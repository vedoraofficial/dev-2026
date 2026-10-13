import { ApiProperty } from '@nestjs/swagger';

export class TrackingStepperStep {
  @ApiProperty({ example: true })
  completed: boolean;

  @ApiProperty({ example: '2026-10-13T10:30:00.000Z', nullable: true })
  timestamp: string | null;
}

export class TrackingStepper {
  @ApiProperty()
  orderPlaced: TrackingStepperStep;

  @ApiProperty()
  processing: TrackingStepperStep;

  @ApiProperty()
  shipped: TrackingStepperStep;

  @ApiProperty()
  inTransit: TrackingStepperStep;

  @ApiProperty()
  outForDelivery: TrackingStepperStep;

  @ApiProperty()
  delivered: TrackingStepperStep;
}

export class TrackingActivityDto {
  @ApiProperty({ example: '2026-10-13 14:30:00' })
  date: string;

  @ApiProperty({ example: 'Out for Delivery' })
  status: string;

  @ApiProperty({ example: 'Dispatched for delivery with delivery agent' })
  activity: string;

  @ApiProperty({ example: 'Mumbai Hub' })
  location: string;
}

export class OrderTrackingResponseDto {
  @ApiProperty({ example: 45 })
  orderId: number;

  @ApiProperty({ example: '142231908234', nullable: true })
  awbCode: string | null;

  @ApiProperty({ example: 'Delhivery Surface', nullable: true })
  courierName: string | null;

  @ApiProperty({ example: 'OUT_FOR_DELIVERY' })
  currentStatus: string;

  @ApiProperty({ example: '2026-10-16T18:00:00.000Z', nullable: true })
  estimatedDeliveryDate: string | null;

  @ApiProperty({ example: 'Mumbai Hub', nullable: true })
  currentLocation: string | null;

  @ApiProperty({ example: 'https://shiprocket.co/tracking/142231908234', nullable: true })
  trackingUrl: string | null;

  @ApiProperty({ type: TrackingStepper })
  stepper: TrackingStepper;

  @ApiProperty({ type: [TrackingActivityDto] })
  activities: TrackingActivityDto[];

  @ApiProperty({ example: '2026-10-13T14:30:00.000Z' })
  lastSyncedAt: string;
}
