import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from '../order/entity/order.entity';
import { UserProfile } from '../user/entity/user-profile.entity';
import { NotificationModule } from '../notification/notification.module';
import { Invoice, InvoiceOrder } from './entity/invoice.entity';
import { InvoiceService } from './invoice.service';
import { InvoiceController } from './invoice.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Invoice, InvoiceOrder, Order, UserProfile]), NotificationModule],
  controllers: [InvoiceController],
  providers: [InvoiceService],
})
export class InvoiceModule {}
