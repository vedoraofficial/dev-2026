import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Shipment, ShipmentStatus, TrackingActivity } from './entity/shipment.entity';
import { Order, OrderStatus } from '../order/entity/order.entity';
import { CreateShipmentDto } from './dto/create-shipment.dto';
import {
  OrderTrackingResponseDto,
  TrackingActivityDto,
  TrackingStepper,
} from './dto/tracking-response.dto';

@Injectable()
export class ShiprocketService {
  private readonly logger = new Logger(ShiprocketService.name);

  private readonly email: string;
  private readonly password: string;
  private readonly baseUrl: string;

  // In-memory token cache
  private cachedToken: string | null = null;
  private tokenExpiresAt: number = 0;

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(Shipment)
    private readonly shipmentRepo: Repository<Shipment>,
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
  ) {
    this.email = this.configService.get<string>('SHIPROCKET_EMAIL') || '';
    this.password = this.configService.get<string>('SHIPROCKET_PASSWORD') || '';
    this.baseUrl =
      this.configService.get<string>('SHIPROCKET_BASE_URL') ||
      'https://apiv2.shiprocket.in/v1/external';
  }

  /**
   * Generates or retrieves cached Bearer Token from Shiprocket
   */
  async getAuthToken(): Promise<string> {
    const now = Date.now();
    // Return cached token if valid for at least 5 more minutes
    if (this.cachedToken && this.tokenExpiresAt > now + 300000) {
      return this.cachedToken;
    }

    if (!this.email || !this.password) {
      this.logger.warn(
        'Shiprocket credentials (SHIPROCKET_EMAIL / SHIPROCKET_PASSWORD) are not set in .env. Real API calls will fail.',
      );
      throw new BadRequestException(
        'Shiprocket credentials are not configured in system environment.',
      );
    }

    try {
      this.logger.log('Authenticating with Shiprocket API...');
      const response = await fetch(`${this.baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: this.email,
          password: this.password,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.token) {
        this.logger.error(`Shiprocket auth failed: ${JSON.stringify(data)}`);
        throw new BadRequestException(
          data.message || 'Failed to authenticate with Shiprocket API.',
        );
      }

      this.cachedToken = data.token;
      // Shiprocket token valid for 10 days, refresh in 9 days
      this.tokenExpiresAt = now + 9 * 24 * 60 * 60 * 1000;
      this.logger.log('Shiprocket token successfully acquired and cached.');
      return this.cachedToken;
    } catch (error: any) {
      this.logger.error(`Shiprocket auth error: ${error.message}`);
      throw new InternalServerErrorException(
        error.message || 'Error communicating with Shiprocket auth server.',
      );
    }
  }

  /**
   * Creates an Adhoc Order in Shiprocket and generates AWB courier assignment
   */
  async createAndAssignShipment(dto: CreateShipmentDto): Promise<Shipment> {
    const order = await this.orderRepo.findOne({
      where: { id: dto.orderId },
      relations: {
        user: { profile: true },
        product: true,
        shipment: true,
      },
    });

    if (!order) {
      throw new NotFoundException(`Order #${dto.orderId} not found.`);
    }

    if (order.shipment && order.shipment.awbCode) {
      throw new BadRequestException(
        `Shipment already exists for Order #${dto.orderId} with AWB: ${order.shipment.awbCode}`,
      );
    }

    const profile = order.user?.profile;
    if (!profile || !profile.addressLine1 || !profile.pincode || !profile.city || !profile.state) {
      throw new BadRequestException(
        'Customer address details (addressLine1, city, state, pincode) are missing from their profile. Cannot create shipment.',
      );
    }

    const token = await this.getAuthToken();

    // 1. Create Order in Shiprocket
    const orderDate = new Date(order.createdAt).toISOString().replace('T', ' ').substring(0, 19);
    const orderPayload = {
      order_id: `VED-ORD-${order.id}`,
      order_date: orderDate,
      pickup_location: 'Primary',
      billing_customer_name: order.user.name,
      billing_last_name: '',
      billing_address: profile.addressLine1,
      billing_address_2: profile.addressLine2 || '',
      billing_city: profile.city,
      billing_pincode: profile.pincode,
      billing_state: profile.state,
      billing_country: 'India',
      billing_email: order.user.email,
      billing_phone: order.user.mobile,
      shipping_is_billing: true,
      order_items: [
        {
          name: order.product.name,
          sku: `PROD-${order.product.id}`,
          units: order.quantity,
          selling_price: Math.max(1, Math.round(Number(order.unitPrice) / 100)),
          discount: 0,
          tax: 0,
        },
      ],
      payment_method: order.paymentMethod === 'CASH' ? 'COD' : 'Prepaid',
      sub_total: Math.max(1, Math.round(Number(order.totalAmount) / 100)),
      length: dto.length || 10,
      breadth: dto.breadth || 10,
      height: dto.height || 10,
      weight: dto.weight || 0.5,
    };

    this.logger.log(`Creating Shiprocket order for VED-ORD-${order.id}...`);
    const createRes = await fetch(`${this.baseUrl}/orders/create/adhoc`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(orderPayload),
    });

    const createData = await createRes.json();
    if (!createRes.ok || !createData.order_id) {
      this.logger.error(`Shiprocket order create error: ${JSON.stringify(createData)}`);
      throw new BadRequestException(
        createData.message || 'Failed to create order in Shiprocket.',
      );
    }

    const srOrderId = String(createData.order_id);
    const srShipmentId = String(createData.shipment_id);

    // 2. Generate AWB
    let awbCode: string | null = null;
    let courierName: string | null = null;
    let courierCompanyId: number | null = dto.courierId || null;

    try {
      this.logger.log(`Assigning AWB for Shiprocket shipment #${srShipmentId}...`);
      const awbPayload: any = { shipment_id: srShipmentId };
      if (dto.courierId) awbPayload.courier_id = dto.courierId;

      const awbRes = await fetch(`${this.baseUrl}/courier/assign/awb`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(awbPayload),
      });

      const awbData = await awbRes.json();
      if (awbRes.ok && awbData.response?.data?.awb_code) {
        awbCode = String(awbData.response.data.awb_code);
        courierName = awbData.response.data.courier_name || null;
        courierCompanyId = awbData.response.data.courier_company_id || courierCompanyId;
      } else {
        this.logger.warn(`AWB auto-assignment response: ${JSON.stringify(awbData)}`);
      }
    } catch (awbErr: any) {
      this.logger.warn(`AWB assignment warning: ${awbErr.message}`);
    }

    // 3. Save Shipment in Database
    let shipment = order.shipment;
    if (!shipment) {
      shipment = this.shipmentRepo.create({
        orderId: order.id,
      });
    }

    shipment.shiprocketOrderId = srOrderId;
    shipment.shiprocketShipmentId = srShipmentId;
    shipment.awbCode = awbCode;
    shipment.courierName = courierName;
    shipment.courierCompanyId = courierCompanyId;
    shipment.currentStatus = awbCode ? ShipmentStatus.AWB_ASSIGNED : ShipmentStatus.NEW;
    shipment.trackingUrl = awbCode ? `https://shiprocket.co/tracking/${awbCode}` : null;

    const savedShipment = await this.shipmentRepo.save(shipment);

    // Update Order status to SHIPPED or PROCESSING
    order.orderStatus = awbCode ? OrderStatus.SHIPPED : OrderStatus.PROCESSING;
    await this.orderRepo.save(order);

    return savedShipment;
  }

  /**
   * Fetches real-time tracking data by AWB code from Shiprocket API and updates local DB
   */
  async syncTrackingByAwb(awbCode: string): Promise<Shipment | null> {
    const shipment = await this.shipmentRepo.findOne({
      where: { awbCode },
      relations: { order: true },
    });

    if (!shipment) {
      this.logger.warn(`Shipment with AWB ${awbCode} not found in database.`);
      return null;
    }

    const token = await this.getAuthToken();
    try {
      this.logger.log(`Fetching live tracking for AWB: ${awbCode}...`);
      const response = await fetch(`${this.baseUrl}/courier/track/awb/${awbCode}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (!response.ok || !data.tracking_data) {
        this.logger.warn(`Live tracking fetch returned: ${JSON.stringify(data)}`);
        return shipment;
      }

      const trackingData = data.tracking_data;
      const track = trackingData.shipment_track?.[0];
      const rawActivities = trackingData.shipment_track_activities || [];

      if (track) {
        shipment.courierName = track.courier_name || shipment.courierName;
        shipment.currentStatus = this.normalizeStatus(track.current_status);
        shipment.currentLocation = track.destination || shipment.currentLocation;
        if (track.edd) {
          shipment.etd = new Date(track.edd);
        }
      }

      if (rawActivities.length > 0) {
        const parsedActivities: TrackingActivity[] = rawActivities.map((act: any) => ({
          date: act.date || '',
          status: act.status || '',
          activity: act.activity || '',
          location: act.location || '',
          srStatus: String(act['sr-status'] || ''),
        }));
        shipment.activities = parsedActivities;
        if (parsedActivities[0]?.location) {
          shipment.currentLocation = parsedActivities[0].location;
        }
      }

      const updatedShipment = await this.shipmentRepo.save(shipment);

      // Synchronize Order status
      if (shipment.order) {
        if (shipment.currentStatus === ShipmentStatus.DELIVERED) {
          shipment.order.orderStatus = OrderStatus.DELIVERED;
          await this.orderRepo.save(shipment.order);
        } else if (shipment.currentStatus === ShipmentStatus.RTO_DELIVERED) {
          shipment.order.orderStatus = OrderStatus.RTO;
          await this.orderRepo.save(shipment.order);
        }
      }

      return updatedShipment;
    } catch (error: any) {
      this.logger.error(`Error syncing tracking for AWB ${awbCode}: ${error.message}`);
      return shipment;
    }
  }

  /**
   * Processes incoming Shiprocket tracking webhook
   */
  async processWebhook(payload: any): Promise<{ received: boolean }> {
    this.logger.log(`Received Shiprocket Webhook: ${JSON.stringify(payload)}`);

    const awb = payload.awb || payload.awb_code;
    const shipmentId = payload.shipment_id;

    if (!awb && !shipmentId) {
      this.logger.warn('Webhook payload missing awb and shipment_id');
      return { received: false };
    }

    let shipment: Shipment | null = null;
    if (awb) {
      shipment = await this.shipmentRepo.findOne({
        where: { awbCode: String(awb) },
        relations: { order: true },
      });
    }
    if (!shipment && shipmentId) {
      shipment = await this.shipmentRepo.findOne({
        where: { shiprocketShipmentId: String(shipmentId) },
        relations: { order: true },
      });
    }

    if (!shipment) {
      this.logger.warn(`No shipment found matching webhook AWB: ${awb} / ShipmentID: ${shipmentId}`);
      return { received: true };
    }

    const rawStatus = payload.current_status || payload.status;
    if (rawStatus) {
      shipment.currentStatus = this.normalizeStatus(rawStatus);
    }

    if (payload.courier_name) {
      shipment.courierName = payload.courier_name;
    }
    if (payload.etd) {
      shipment.etd = new Date(payload.etd);
    }
    if (payload.location) {
      shipment.currentLocation = payload.location;
    }

    // Process scans / activities
    const rawScans = payload.scans || payload.activities || [];
    if (Array.isArray(rawScans) && rawScans.length > 0) {
      const newActivities: TrackingActivity[] = rawScans.map((scan: any) => ({
        date: scan.date || new Date().toISOString(),
        status: scan.status || rawStatus || '',
        activity: scan.activity || scan.status_details || '',
        location: scan.location || '',
      }));
      shipment.activities = newActivities;
    }

    await this.shipmentRepo.save(shipment);

    // Update parent order status
    if (shipment.order) {
      if (shipment.currentStatus === ShipmentStatus.DELIVERED) {
        shipment.order.orderStatus = OrderStatus.DELIVERED;
        await this.orderRepo.save(shipment.order);
      } else if (shipment.currentStatus === ShipmentStatus.RTO_DELIVERED) {
        shipment.order.orderStatus = OrderStatus.RTO;
        await this.orderRepo.save(shipment.order);
      }
    }

    return { received: true };
  }

  /**
   * Customer tracking view: returns formatted timeline and stepper for an Order
   */
  async getOrderTracking(
    orderId: number,
    userId?: number,
    isAdmin: boolean = false,
  ): Promise<OrderTrackingResponseDto> {
    const order = await this.orderRepo.findOne({
      where: { id: orderId },
      relations: { shipment: true },
    });

    if (!order) {
      throw new NotFoundException(`Order #${orderId} not found.`);
    }

    if (userId && !isAdmin && order.userId !== userId) {
      throw new ForbiddenException('You do not have permission to view tracking for this order.');
    }

    let shipment = order.shipment;

    // If shipment has AWB, check if we should refresh live data
    if (shipment && shipment.awbCode) {
      const lastUpdated = new Date(shipment.updatedAt).getTime();
      const isStale = Date.now() - lastUpdated > 30 * 60 * 1000; // 30 minutes
      const isNotFinal =
        shipment.currentStatus !== ShipmentStatus.DELIVERED &&
        shipment.currentStatus !== ShipmentStatus.CANCELLED;

      if (isStale && isNotFinal) {
        // Refresh asynchronously or synchronously
        const refreshed = await this.syncTrackingByAwb(shipment.awbCode);
        if (refreshed) shipment = refreshed;
      }
    }

    const currentStatus = shipment?.currentStatus || order.orderStatus;
    const stepper = this.calculateStepper(order, shipment);
    const activities: TrackingActivityDto[] = (shipment?.activities || []).map((a) => ({
      date: a.date,
      status: a.status,
      activity: a.activity,
      location: a.location,
    }));

    return {
      orderId: order.id,
      awbCode: shipment?.awbCode || null,
      courierName: shipment?.courierName || null,
      currentStatus,
      estimatedDeliveryDate: shipment?.etd ? shipment.etd.toISOString() : null,
      currentLocation: shipment?.currentLocation || null,
      trackingUrl: shipment?.trackingUrl || null,
      stepper,
      activities,
      lastSyncedAt: shipment?.updatedAt ? shipment.updatedAt.toISOString() : order.updatedAt.toISOString(),
    };
  }

  /**
   * Public tracking by AWB code
   */
  async getPublicTracking(awbCode: string): Promise<OrderTrackingResponseDto> {
    let shipment = await this.shipmentRepo.findOne({
      where: { awbCode },
      relations: { order: true },
    });

    if (!shipment) {
      // Try to query Shiprocket directly if not in DB
      shipment = await this.syncTrackingByAwb(awbCode);
      if (!shipment) {
        throw new NotFoundException(`No shipment found with AWB: ${awbCode}`);
      }
    }

    return this.getOrderTracking(shipment.orderId, undefined, true);
  }

  /**
   * Helper to normalize raw courier status strings into uniform enum
   */
  private normalizeStatus(rawStatus?: string): string {
    if (!rawStatus) return ShipmentStatus.NEW;
    const s = rawStatus.toUpperCase().trim();

    if (s.includes('DELIVERED') && !s.includes('OUT') && !s.includes('RTO')) return ShipmentStatus.DELIVERED;
    if (s.includes('OUT FOR DELIVERY') || s.includes('OFD')) return ShipmentStatus.OUT_FOR_DELIVERY;
    if (s.includes('IN TRANSIT') || s.includes('TRANSIT') || s.includes('REACHED')) return ShipmentStatus.IN_TRANSIT;
    if (s.includes('PICKED UP') || s.includes('PICKEDUP')) return ShipmentStatus.PICKED_UP;
    if (s.includes('PICKUP SCHEDULED')) return ShipmentStatus.PICKUP_SCHEDULED;
    if (s.includes('AWB ASSIGNED') || s.includes('ASSIGNED')) return ShipmentStatus.AWB_ASSIGNED;
    if (s.includes('RTO DELIVERED')) return ShipmentStatus.RTO_DELIVERED;
    if (s.includes('RTO')) return ShipmentStatus.RTO_INITIATED;
    if (s.includes('CANCEL')) return ShipmentStatus.CANCELLED;
    if (s.includes('LOST')) return ShipmentStatus.LOST;

    return s;
  }

  /**
   * Generates completed/timestamp flags for UI progress bars
   */
  private calculateStepper(order: Order, shipment?: Shipment | null): TrackingStepper {
    const status = (shipment?.currentStatus || order.orderStatus).toUpperCase();
    const orderCreatedAt = order.createdAt ? new Date(order.createdAt).toISOString() : null;
    const shipmentCreatedAt = shipment?.createdAt ? new Date(shipment.createdAt).toISOString() : null;
    const updatedAt = shipment?.updatedAt ? new Date(shipment.updatedAt).toISOString() : null;

    const isShipped = [
      ShipmentStatus.AWB_ASSIGNED,
      ShipmentStatus.PICKUP_SCHEDULED,
      ShipmentStatus.PICKED_UP,
      ShipmentStatus.IN_TRANSIT,
      ShipmentStatus.OUT_FOR_DELIVERY,
      ShipmentStatus.DELIVERED,
      OrderStatus.SHIPPED,
    ].some((st) => status.includes(st));

    const isInTransit = [
      ShipmentStatus.IN_TRANSIT,
      ShipmentStatus.OUT_FOR_DELIVERY,
      ShipmentStatus.DELIVERED,
    ].some((st) => status.includes(st));

    const isOutForDelivery = [
      ShipmentStatus.OUT_FOR_DELIVERY,
      ShipmentStatus.DELIVERED,
    ].some((st) => status.includes(st));

    const isDelivered = status === ShipmentStatus.DELIVERED || order.orderStatus === OrderStatus.DELIVERED;

    return {
      orderPlaced: {
        completed: true,
        timestamp: orderCreatedAt,
      },
      processing: {
        completed: order.orderStatus !== OrderStatus.PENDING,
        timestamp: orderCreatedAt,
      },
      shipped: {
        completed: isShipped,
        timestamp: isShipped ? shipmentCreatedAt : null,
      },
      inTransit: {
        completed: isInTransit,
        timestamp: isInTransit ? updatedAt : null,
      },
      outForDelivery: {
        completed: isOutForDelivery,
        timestamp: isOutForDelivery ? updatedAt : null,
      },
      delivered: {
        completed: isDelivered,
        timestamp: isDelivered ? updatedAt : null,
      },
    };
  }
}
