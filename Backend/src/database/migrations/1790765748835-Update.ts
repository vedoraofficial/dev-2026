import { MigrationInterface, QueryRunner } from "typeorm";

export class Update1790765748835 implements MigrationInterface {
    name = 'Update1790765748835'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_banks" DROP COLUMN "branch"`);
        await queryRunner.query(`ALTER TABLE "user_banks" ADD "verification_status" character varying(20) NOT NULL DEFAULT 'PENDING'`);
        await queryRunner.query(`ALTER TABLE "user_banks" ADD "is_primary" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "user_banks" DROP CONSTRAINT "FK_e55c2d731d42101bee184c12261"`);
        await queryRunner.query(`ALTER TABLE "user_banks" DROP CONSTRAINT "REL_e55c2d731d42101bee184c1226"`);
        await queryRunner.query(`ALTER TABLE "user_banks" ADD CONSTRAINT "FK_e55c2d731d42101bee184c12261" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_banks" DROP CONSTRAINT "FK_e55c2d731d42101bee184c12261"`);
        await queryRunner.query(`ALTER TABLE "user_banks" ADD CONSTRAINT "REL_e55c2d731d42101bee184c1226" UNIQUE ("user_id")`);
        await queryRunner.query(`ALTER TABLE "user_banks" ADD CONSTRAINT "FK_e55c2d731d42101bee184c12261" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_banks" DROP COLUMN "is_primary"`);
        await queryRunner.query(`ALTER TABLE "user_banks" DROP COLUMN "verification_status"`);
        await queryRunner.query(`ALTER TABLE "user_banks" ADD "branch" character varying(150)`);
    }

}
