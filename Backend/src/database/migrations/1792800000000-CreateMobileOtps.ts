import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Add Partner verifies the new partner's mobile number with an SMS OTP. The partner doesn't exist
 * yet, so these OTPs are keyed by mobile number + the sponsor who requested them.
 */
export class CreateMobileOtps1792800000000 implements MigrationInterface {
    name = 'CreateMobileOtps1792800000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "mobile_otps" (
                "id" SERIAL NOT NULL,
                "mobile" varchar(15) NOT NULL,
                "otp_code" varchar(255) NOT NULL,
                "requested_by" integer NOT NULL,
                "expires_at" TIMESTAMPTZ NOT NULL,
                "attempts_count" integer NOT NULL DEFAULT 0,
                "verified_at" TIMESTAMPTZ,
                "is_used" boolean NOT NULL DEFAULT false,
                "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT now(),
                CONSTRAINT "PK_mobile_otps" PRIMARY KEY ("id"),
                CONSTRAINT "FK_mobile_otps_requested_by" FOREIGN KEY ("requested_by")
                    REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_mobile_otps_mobile_requested_by" ON "mobile_otps" ("mobile", "requested_by")
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_mobile_otps_mobile_requested_by"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "mobile_otps"`);
    }
}
