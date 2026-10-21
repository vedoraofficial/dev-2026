import { MigrationInterface, QueryRunner } from 'typeorm';

export class CleanPhonePeData1792320000000 implements MigrationInterface {
  name = 'CleanPhonePeData1792320000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "orders" SET "payment_method" = 'RAZORPAY' WHERE "payment_method" = 'PHONEPE';
      UPDATE "orders" SET "razorpay_order_id" = "phonepe_merchant_order_id" WHERE "razorpay_order_id" IS NULL AND "phonepe_merchant_order_id" IS NOT NULL;
      UPDATE "orders" SET "razorpay_payment_id" = "phonepe_transaction_id" WHERE "razorpay_payment_id" IS NULL AND "phonepe_transaction_id" IS NOT NULL;
      UPDATE "wallet_topups" SET "razorpay_order_id" = "phonepe_merchant_order_id" WHERE "razorpay_order_id" IS NULL AND "phonepe_merchant_order_id" IS NOT NULL;
      UPDATE "wallet_topups" SET "razorpay_payment_id" = "phonepe_transaction_id" WHERE "razorpay_payment_id" IS NULL AND "phonepe_transaction_id" IS NOT NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // No-op rollback for data migration
  }
}
