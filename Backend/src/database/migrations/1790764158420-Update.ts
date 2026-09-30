import { MigrationInterface, QueryRunner } from "typeorm";

export class Update1790764158420 implements MigrationInterface {
    name = 'Update1790764158420'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "reset_token" character varying`);
        await queryRunner.query(`ALTER TABLE "users" ADD "reset_token_expires" TIMESTAMP WITH TIME ZONE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "reset_token_expires"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "reset_token"`);
    }

}
