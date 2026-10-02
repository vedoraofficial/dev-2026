import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPennyDropColumnsToUserBanks1790850000000 implements MigrationInterface {
    name = 'AddPennyDropColumnsToUserBanks1790850000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "user_banks"
                ADD COLUMN IF NOT EXISTS "verified_name" varchar(150),
                ADD COLUMN IF NOT EXISTS "name_match_score" numeric(5,2),
                ADD COLUMN IF NOT EXISTS "name_match_result" varchar(30),
                ADD COLUMN IF NOT EXISTS "utr" varchar(100),
                ADD COLUMN IF NOT EXISTS "verification_reference_id" varchar(100),
                ADD COLUMN IF NOT EXISTS "verification_failed_reason" text,
                ADD COLUMN IF NOT EXISTS "verified_at" TIMESTAMPTZ(3);
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "user_banks"
                DROP COLUMN IF EXISTS "verified_at",
                DROP COLUMN IF EXISTS "verification_failed_reason",
                DROP COLUMN IF EXISTS "verification_reference_id",
                DROP COLUMN IF EXISTS "utr",
                DROP COLUMN IF EXISTS "name_match_result",
                DROP COLUMN IF EXISTS "name_match_score",
                DROP COLUMN IF EXISTS "verified_name";
        `);
    }
}
