import { MigrationInterface, QueryRunner } from "typeorm";

export class Update1790764621616 implements MigrationInterface {
    name = 'Update1790764621616'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "user_banks" ("id" SERIAL NOT NULL, "account_holder_name" character varying(150) NOT NULL, "account_number" character varying(50) NOT NULL, "bank_name" character varying(150) NOT NULL, "ifsc_code" character varying(20) NOT NULL, "branch" character varying(150), "created_at" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT now(), "user_id" integer, CONSTRAINT "REL_e55c2d731d42101bee184c1226" UNIQUE ("user_id"), CONSTRAINT "PK_6c520687002e2a1fefff649a3c2" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "user_banks" ADD CONSTRAINT "FK_e55c2d731d42101bee184c12261" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_banks" DROP CONSTRAINT "FK_e55c2d731d42101bee184c12261"`);
        await queryRunner.query(`DROP TABLE "user_banks"`);
    }

}
