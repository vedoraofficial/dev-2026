import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Separates "who enrolled the partner" (sponsor — earns the ₹200 direct commission) from
 * "where the partner sits in the tree" (parent — BV level income follows this chain).
 * Existing rows keep today's behaviour: sponsor = parent.
 */
export class AddSponsorToGenealogyNodes1791000000000 implements MigrationInterface {
    name = 'AddSponsorToGenealogyNodes1791000000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "genealogy_nodes" ADD COLUMN IF NOT EXISTS "sponsor_user_id" integer;

            UPDATE "genealogy_nodes" SET "sponsor_user_id" = "parent_user_id" WHERE "sponsor_user_id" IS NULL;

            ALTER TABLE "genealogy_nodes" ADD CONSTRAINT "fk_genealogy_nodes_sponsor_user_id"
                FOREIGN KEY ("sponsor_user_id") REFERENCES "users" ("id") ON DELETE SET NULL;

            CREATE INDEX IF NOT EXISTS "idx_genealogy_nodes_sponsor_user_id"
                ON "genealogy_nodes" ("sponsor_user_id");
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX IF EXISTS "idx_genealogy_nodes_sponsor_user_id";
            ALTER TABLE "genealogy_nodes" DROP CONSTRAINT IF EXISTS "fk_genealogy_nodes_sponsor_user_id";
            ALTER TABLE "genealogy_nodes" DROP COLUMN IF EXISTS "sponsor_user_id";
        `);
    }
}
