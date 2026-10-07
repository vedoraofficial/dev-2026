import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Lets Admin delete a product that already has orders: the row stays (orders, payments and
 * commissions keep pointing at it) but is hidden everywhere once `deleted_at` is set.
 */
export class AddDeletedAtToProducts1791100000000 implements MigrationInterface {
    name = 'AddDeletedAtToProducts1791100000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMPTZ(3)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "products" DROP COLUMN IF EXISTS "deleted_at"`);
    }
}
