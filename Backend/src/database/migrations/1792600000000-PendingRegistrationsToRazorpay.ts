import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Partner registrations paid online now go through Razorpay (PhonePe was removed): the
 * pending_registrations payment columns are renamed, and the PhonePe redirect URL is dropped.
 */
export class PendingRegistrationsToRazorpay1792600000000 implements MigrationInterface {
    name = 'PendingRegistrationsToRazorpay1792600000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "pending_registrations" RENAME COLUMN "phonepe_merchant_order_id" TO "razorpay_order_id"`);
        await queryRunner.query(`ALTER TABLE "pending_registrations" RENAME COLUMN "phonepe_transaction_id" TO "razorpay_payment_id"`);
        await queryRunner.query(`ALTER TABLE "pending_registrations" DROP COLUMN IF EXISTS "phonepe_redirect_url"`);
        await queryRunner.query(`ALTER TABLE "pending_registrations" RENAME CONSTRAINT "UQ_pending_registrations_merchant_order_id" TO "UQ_pending_registrations_razorpay_order_id"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "pending_registrations" RENAME CONSTRAINT "UQ_pending_registrations_razorpay_order_id" TO "UQ_pending_registrations_merchant_order_id"`);
        await queryRunner.query(`ALTER TABLE "pending_registrations" ADD COLUMN IF NOT EXISTS "phonepe_redirect_url" text`);
        await queryRunner.query(`ALTER TABLE "pending_registrations" RENAME COLUMN "razorpay_payment_id" TO "phonepe_transaction_id"`);
        await queryRunner.query(`ALTER TABLE "pending_registrations" RENAME COLUMN "razorpay_order_id" TO "phonepe_merchant_order_id"`);
    }
}
