import { MigrationInterface, QueryRunner } from "typeorm";

/** Messages sent from the website's contact page ("Send us a message"), listed for Admin. */
export class CreateEnquiries1793500000000 implements MigrationInterface {
    name = 'CreateEnquiries1793500000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "enquiries" (
                "id" SERIAL NOT NULL,
                "name" varchar(100) NOT NULL,
                "mobile" varchar(15) NOT NULL,
                "email" varchar(150) NOT NULL,
                "reference" varchar(60),
                "topic" varchar(30) NOT NULL,
                "message" text NOT NULL,
                "status" varchar(20) NOT NULL DEFAULT 'NEW',
                "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT now(),
                CONSTRAINT "PK_enquiries" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`CREATE INDEX "IDX_enquiries_created_at" ON "enquiries" ("created_at")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_enquiries_created_at"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "enquiries"`);
    }
}
