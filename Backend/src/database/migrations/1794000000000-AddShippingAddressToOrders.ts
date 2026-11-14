import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddShippingAddressToOrders1794000000000 implements MigrationInterface {
  name = 'AddShippingAddressToOrders1794000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "orders"
        ADD COLUMN IF NOT EXISTS "shipping_name" varchar(150),
        ADD COLUMN IF NOT EXISTS "shipping_mobile" varchar(20),
        ADD COLUMN IF NOT EXISTS "shipping_address_line1" varchar(255),
        ADD COLUMN IF NOT EXISTS "shipping_landmark" varchar(255),
        ADD COLUMN IF NOT EXISTS "shipping_area" varchar(150),
        ADD COLUMN IF NOT EXISTS "shipping_city" varchar(100),
        ADD COLUMN IF NOT EXISTS "shipping_state" varchar(100),
        ADD COLUMN IF NOT EXISTS "shipping_pincode" varchar(20);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "orders"
        DROP COLUMN IF EXISTS "shipping_name",
        DROP COLUMN IF EXISTS "shipping_mobile",
        DROP COLUMN IF EXISTS "shipping_address_line1",
        DROP COLUMN IF EXISTS "shipping_landmark",
        DROP COLUMN IF EXISTS "shipping_area",
        DROP COLUMN IF EXISTS "shipping_city",
        DROP COLUMN IF EXISTS "shipping_state",
        DROP COLUMN IF EXISTS "shipping_pincode";
    `);
  }
}
