import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * The partner's PAN card, collected at Add Partner and on the referral join page. One PAN can be
 * linked to only one VEDORA ID; partners registered before this keep NULL (allowed many times).
 */
export class AddUserPan1793600000000 implements MigrationInterface {
    name = 'AddUserPan1793600000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "pan_number" varchar(10)`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "UQ_users_pan_number" UNIQUE ("pan_number")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "UQ_users_pan_number"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "pan_number"`);
    }
}
