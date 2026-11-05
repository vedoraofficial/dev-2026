import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddWithdrawalPayoutTracking1793000000000 implements MigrationInterface {
  name = 'AddWithdrawalPayoutTracking1793000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "withdrawals" ADD COLUMN IF NOT EXISTS "payout_id" varchar(100);
      ALTER TABLE "withdrawals" ADD COLUMN IF NOT EXISTS "utr" varchar(100);
      CREATE INDEX IF NOT EXISTS "IDX_withdrawals_payout_id" ON "withdrawals" ("payout_id");
    `);

    // Backfill payout_id from admin_remarks where it matches pout_[a-zA-Z0-9]+
    await queryRunner.query(`
      UPDATE "withdrawals"
      SET "payout_id" = (regexp_match("admin_remarks", 'pout_[a-zA-Z0-9]+'))[1]
      WHERE "admin_remarks" ~ 'pout_[a-zA-Z0-9]+' AND "payout_id" IS NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_withdrawals_payout_id";
      ALTER TABLE "withdrawals" DROP COLUMN IF EXISTS "utr";
      ALTER TABLE "withdrawals" DROP COLUMN IF EXISTS "payout_id";
    `);
  }
}
