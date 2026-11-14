import { MigrationInterface, QueryRunner } from 'typeorm';

/** Aadhaar card, collected at registration — not unique, a family can share one Aadhaar. */
export class AddAadhaarToUsers1794100000000 implements MigrationInterface {
  name = 'AddAadhaarToUsers1794100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "aadhaar" varchar(12)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "aadhaar"`);
  }
}
