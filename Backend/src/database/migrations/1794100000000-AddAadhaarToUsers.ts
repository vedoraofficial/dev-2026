import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAadhaarToUsers1794100000000 implements MigrationInterface {
  name = 'AddAadhaarToUsers1794100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "aadhaar" varchar(12)`);
    await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "UQ_users_aadhaar" UNIQUE ("aadhaar")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "UQ_users_aadhaar"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "aadhaar"`);
  }
}
