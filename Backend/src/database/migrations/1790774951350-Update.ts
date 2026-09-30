import { MigrationInterface, QueryRunner } from "typeorm";

export class Update1790774951350 implements MigrationInterface {
    name = 'Update1790774951350'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "genealogy_nodes" ("id" BIGSERIAL NOT NULL, "user_id" integer NOT NULL, "parent_user_id" integer, "slot_number" smallint, "depth" integer NOT NULL DEFAULT '0', "placement_status" character varying(20) NOT NULL DEFAULT 'ACTIVE', "created_at" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_b77cf5a474840ee519d6ef235de" UNIQUE ("user_id"), CONSTRAINT "UQ_da58d84489fbdcb38f399f63b8e" UNIQUE ("parent_user_id", "slot_number"), CONSTRAINT "REL_b77cf5a474840ee519d6ef235d" UNIQUE ("user_id"), CONSTRAINT "PK_068757e0b01883806b6c7b0515d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "genealogy_commission_uplines" ("user_id" integer NOT NULL, "level_1_user_id" integer, "level_2_user_id" integer, "level_3_user_id" integer, "level_4_user_id" integer, "level_5_user_id" integer, "updated_at" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_f5b07b00fc31366e821b924e870" PRIMARY KEY ("user_id"))`);
        await queryRunner.query(`ALTER TABLE "genealogy_nodes" ADD CONSTRAINT "FK_b77cf5a474840ee519d6ef235de" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "genealogy_nodes" ADD CONSTRAINT "FK_0e24119cedd245ba34c2692ea77" FOREIGN KEY ("parent_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "genealogy_commission_uplines" ADD CONSTRAINT "FK_f5b07b00fc31366e821b924e870" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "genealogy_commission_uplines" ADD CONSTRAINT "FK_6df9f8949e5ea2db02c65bc5ad2" FOREIGN KEY ("level_1_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "genealogy_commission_uplines" ADD CONSTRAINT "FK_134bd0f5139aad9931b0a5d945b" FOREIGN KEY ("level_2_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "genealogy_commission_uplines" ADD CONSTRAINT "FK_80467ab3f36926429e136c6cebb" FOREIGN KEY ("level_3_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "genealogy_commission_uplines" ADD CONSTRAINT "FK_3707562667fb78ebd9c0890f576" FOREIGN KEY ("level_4_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "genealogy_commission_uplines" ADD CONSTRAINT "FK_59a051b77addb2c680f845d4828" FOREIGN KEY ("level_5_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "genealogy_commission_uplines" DROP CONSTRAINT "FK_59a051b77addb2c680f845d4828"`);
        await queryRunner.query(`ALTER TABLE "genealogy_commission_uplines" DROP CONSTRAINT "FK_3707562667fb78ebd9c0890f576"`);
        await queryRunner.query(`ALTER TABLE "genealogy_commission_uplines" DROP CONSTRAINT "FK_80467ab3f36926429e136c6cebb"`);
        await queryRunner.query(`ALTER TABLE "genealogy_commission_uplines" DROP CONSTRAINT "FK_134bd0f5139aad9931b0a5d945b"`);
        await queryRunner.query(`ALTER TABLE "genealogy_commission_uplines" DROP CONSTRAINT "FK_6df9f8949e5ea2db02c65bc5ad2"`);
        await queryRunner.query(`ALTER TABLE "genealogy_commission_uplines" DROP CONSTRAINT "FK_f5b07b00fc31366e821b924e870"`);
        await queryRunner.query(`ALTER TABLE "genealogy_nodes" DROP CONSTRAINT "FK_0e24119cedd245ba34c2692ea77"`);
        await queryRunner.query(`ALTER TABLE "genealogy_nodes" DROP CONSTRAINT "FK_b77cf5a474840ee519d6ef235de"`);
        await queryRunner.query(`DROP TABLE "genealogy_commission_uplines"`);
        await queryRunner.query(`DROP TABLE "genealogy_nodes"`);
    }

}
