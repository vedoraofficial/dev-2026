import { MigrationInterface, QueryRunner } from "typeorm";

export class Update1790766378731 implements MigrationInterface {
    name = 'Update1790766378731'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "products" ("id" BIGSERIAL NOT NULL, "name" character varying(150) NOT NULL, "description" text, "mrp" bigint NOT NULL, "sale_price" bigint NOT NULL, "bv_amount" bigint NOT NULL, "status" character varying(20) NOT NULL DEFAULT 'ACTIVE', "created_by" integer, "updated_by" integer, "created_at" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_0806c755e0aca124e67c0cf6d7d" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "products"`);
    }

}
