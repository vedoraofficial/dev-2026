import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * A cart paid online with one Razorpay payment: ties the cart's orders (one per product) to that
 * payment, so they are confirmed together (and share one invoice).
 */
export class CreateOrderCheckouts1793100000000 implements MigrationInterface {
    name = 'CreateOrderCheckouts1793100000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "order_checkouts" (
                "id" BIGSERIAL NOT NULL,
                "user_id" integer NOT NULL,
                "order_ids" jsonb NOT NULL,
                "amount" bigint NOT NULL,
                "status" varchar(20) NOT NULL DEFAULT 'PENDING',
                "razorpay_order_id" varchar(100) NOT NULL,
                "razorpay_payment_id" varchar(100),
                "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT now(),
                CONSTRAINT "PK_order_checkouts" PRIMARY KEY ("id"),
                CONSTRAINT "UQ_order_checkouts_razorpay_order_id" UNIQUE ("razorpay_order_id"),
                CONSTRAINT "FK_order_checkouts_user" FOREIGN KEY ("user_id")
                    REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `);
        await queryRunner.query(`CREATE INDEX "IDX_order_checkouts_user_id" ON "order_checkouts" ("user_id")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_order_checkouts_user_id"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "order_checkouts"`);
    }
}
