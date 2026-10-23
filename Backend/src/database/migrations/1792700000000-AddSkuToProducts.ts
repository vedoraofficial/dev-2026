import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Products get a unique SKU. Existing products are given VED-<first word of the name, without
 * "VEDORA">-<product number>, e.g. "VEDORA PYRITE LEGACY" #3 → VED-PYRITE-003 (the same rule the
 * API uses when Admin leaves the SKU empty).
 */
export class AddSkuToProducts1792700000000 implements MigrationInterface {
    name = 'AddSkuToProducts1792700000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "sku" varchar(40)`);
        await queryRunner.query(`
            UPDATE "products"
               SET "sku" = 'VED-'
                   || COALESCE(
                        NULLIF(left(upper(split_part(btrim(
                          regexp_replace(regexp_replace("name", '\\mvedora\\M', ' ', 'gi'), '[^A-Za-z0-9 ]', ' ', 'g')
                        ), ' ', 1)), 20), ''),
                        'PRD')
                   || '-' || lpad("id"::text, 3, '0')
             WHERE "sku" IS NULL
        `);
        await queryRunner.query(`ALTER TABLE "products" ADD CONSTRAINT "UQ_products_sku" UNIQUE ("sku")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "products" DROP CONSTRAINT IF EXISTS "UQ_products_sku"`);
        await queryRunner.query(`ALTER TABLE "products" DROP COLUMN IF EXISTS "sku"`);
    }
}
