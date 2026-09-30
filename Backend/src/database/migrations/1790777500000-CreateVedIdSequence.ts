import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateVedIdSequence1790777500000 implements MigrationInterface {
    name = 'CreateVedIdSequence1790777500000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE SEQUENCE IF NOT EXISTS ved_id_seq START WITH 4;`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP SEQUENCE IF EXISTS ved_id_seq;`);
    }
}
