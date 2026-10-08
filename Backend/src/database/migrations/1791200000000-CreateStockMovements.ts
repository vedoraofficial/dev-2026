import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Stock in / stock out entries per product. Available stock = received (IN) − sold (OUT).
 * A product with no entries is "not tracked" and stays orderable.
 */
export class CreateStockMovements1791200000000 implements MigrationInterface {
    name = 'CreateStockMovements1791200000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "stock_movements" (
                "id" SERIAL PRIMARY KEY,
                "product_id" bigint NOT NULL,
                "type" varchar(10) NOT NULL,
                "quantity" integer NOT NULL CHECK ("quantity" > 0),
                "note" varchar(300),
                "created_by" integer,
                "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT now(),
                CONSTRAINT "fk_stock_movements_product_id" FOREIGN KEY ("product_id")
                    REFERENCES "products" ("id") ON DELETE CASCADE,
                CONSTRAINT "fk_stock_movements_created_by" FOREIGN KEY ("created_by")
                    REFERENCES "users" ("id") ON DELETE SET NULL,
                CONSTRAINT "chk_stock_movements_type" CHECK ("type" IN ('IN', 'OUT'))
            );

            CREATE INDEX IF NOT EXISTS "idx_stock_movements_product_id"
                ON "stock_movements" ("product_id");
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX IF EXISTS "idx_stock_movements_product_id";
            DROP TABLE IF EXISTS "stock_movements";
        `);
    }
}
