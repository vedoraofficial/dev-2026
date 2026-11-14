import { MigrationInterface, QueryRunner } from 'typeorm';

/** Multiple partners can share the same Aadhaar number — only PAN stays unique per VEDORA ID. */
export class RemoveAadhaarUnique1794200000000 implements MigrationInterface {
  name = 'RemoveAadhaarUnique1794200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "UQ_users_aadhaar"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "UQ_users_aadhaar" UNIQUE ("aadhaar")`);
  }
}
