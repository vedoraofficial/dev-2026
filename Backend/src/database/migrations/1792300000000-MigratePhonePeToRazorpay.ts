import { MigrationInterface, QueryRunner } from 'typeorm';

export class MigratePhonePeToRazorpay1792300000000 implements MigrationInterface {
  name = 'MigratePhonePeToRazorpay1792300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Orders table
    await queryRunner.query(`
      ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "razorpay_order_id" varchar(100);
      ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "razorpay_payment_id" varchar(100);
      ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "razorpay_signature" varchar(255);
      CREATE INDEX IF NOT EXISTS "IDX_orders_razorpay_order_id" ON "orders" ("razorpay_order_id");
    `);

    // 2. Wallet Topups table
    await queryRunner.query(`
      ALTER TABLE "wallet_topups" ADD COLUMN IF NOT EXISTS "razorpay_order_id" varchar(100);
      ALTER TABLE "wallet_topups" ADD COLUMN IF NOT EXISTS "razorpay_payment_id" varchar(100);
      ALTER TABLE "wallet_topups" ADD COLUMN IF NOT EXISTS "razorpay_signature" varchar(255);
      ALTER TABLE "wallet_topups" ALTER COLUMN "phonepe_merchant_order_id" DROP NOT NULL;
      CREATE INDEX IF NOT EXISTS "IDX_wallet_topups_razorpay_order_id" ON "wallet_topups" ("razorpay_order_id");
    `);

    // 3. Payment Events table
    await queryRunner.query(`
      ALTER TABLE "payment_events" ADD COLUMN IF NOT EXISTS "razorpay_order_id" varchar(100);
      ALTER TABLE "payment_events" ALTER COLUMN "phonepe_merchant_order_id" DROP NOT NULL;
      CREATE INDEX IF NOT EXISTS "IDX_payment_events_razorpay_order_id" ON "payment_events" ("razorpay_order_id");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_payment_events_razorpay_order_id";
      ALTER TABLE "payment_events" DROP COLUMN IF EXISTS "razorpay_order_id";

      DROP INDEX IF EXISTS "IDX_wallet_topups_razorpay_order_id";
      ALTER TABLE "wallet_topups" DROP COLUMN IF EXISTS "razorpay_signature";
      ALTER TABLE "wallet_topups" DROP COLUMN IF EXISTS "razorpay_payment_id";
      ALTER TABLE "wallet_topups" DROP COLUMN IF EXISTS "razorpay_order_id";

      DROP INDEX IF EXISTS "IDX_orders_razorpay_order_id";
      ALTER TABLE "orders" DROP COLUMN IF EXISTS "razorpay_signature";
      ALTER TABLE "orders" DROP COLUMN IF EXISTS "razorpay_payment_id";
      ALTER TABLE "orders" DROP COLUMN IF EXISTS "razorpay_order_id";
    `);
  }
}
