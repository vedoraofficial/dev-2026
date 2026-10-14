import { MigrationInterface, QueryRunner } from "typeorm";

export class AddOtpAttemptsCount1791300000001 implements MigrationInterface {
    name = 'AddOtpAttemptsCount1791300000001';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "otps" ADD COLUMN IF NOT EXISTS "attempts_count" integer NOT NULL DEFAULT 0;
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "otps" DROP COLUMN IF EXISTS "attempts_count";
        `);
    }
}
