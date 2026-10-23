import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * The public referral join page now verifies the mobile with OTP and takes the joining payment
 * like Add Partner: OTPs get a purpose (ADD_PARTNER / JOIN), and a held registration records who
 * pays — the sponsor (Add Partner) or the new partner themselves (join page).
 */
export class PublicJoinWithPayment1792900000000 implements MigrationInterface {
    name = 'PublicJoinWithPayment1792900000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "mobile_otps" ADD COLUMN IF NOT EXISTS "purpose" varchar(20) NOT NULL DEFAULT 'ADD_PARTNER'`);
        await queryRunner.query(`ALTER TABLE "pending_registrations" ADD COLUMN IF NOT EXISTS "paid_by" varchar(10) NOT NULL DEFAULT 'SPONSOR'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "pending_registrations" DROP COLUMN IF EXISTS "paid_by"`);
        await queryRunner.query(`ALTER TABLE "mobile_otps" DROP COLUMN IF EXISTS "purpose"`);
    }
}
