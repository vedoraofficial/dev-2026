import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Admin can upload a photo per product. The photo is stored in the database (survives redeploys);
 * products.image_updated_at says whether there is one and versions its link.
 */
export class AddProductImages1793300000000 implements MigrationInterface {
    name = 'AddProductImages1793300000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "image_updated_at" TIMESTAMPTZ`);
        await queryRunner.query(`
            CREATE TABLE "product_images" (
                "product_id" bigint NOT NULL,
                "mime" varchar(40) NOT NULL,
                "data" bytea NOT NULL,
                "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT now(),
                CONSTRAINT "PK_product_images" PRIMARY KEY ("product_id"),
                CONSTRAINT "FK_product_images_product" FOREIGN KEY ("product_id")
                    REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS "product_images"`);
        await queryRunner.query(`ALTER TABLE "products" DROP COLUMN IF EXISTS "image_updated_at"`);
    }
}
