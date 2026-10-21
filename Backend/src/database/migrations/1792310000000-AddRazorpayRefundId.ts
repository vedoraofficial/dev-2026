import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRazorpayRefundId1792310000000 implements MigrationInterface {
  name = 'AddRazorpayRefundId1792310000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "order_refunds" ADD COLUMN IF NOT EXISTS "razorpay_refund_id" varchar(100);
      CREATE INDEX IF NOT EXISTS "IDX_order_refunds_razorpay_refund_id" ON "order_refunds" ("razorpay_refund_id");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_order_refunds_razorpay_refund_id";
      ALTER TABLE "order_refunds" DROP COLUMN IF EXISTS "razorpay_refund_id";
    `);
  }
}
