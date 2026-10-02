import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateNotificationsTable1790900000000 implements MigrationInterface {
    name = 'CreateNotificationsTable1790900000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "notifications" (
                "id" SERIAL PRIMARY KEY,
                "user_id" integer NOT NULL,
                "key" varchar(60) NOT NULL,
                "title" varchar(200) NOT NULL,
                "message" text NOT NULL,
                "metadata" jsonb,
                "is_read" boolean NOT NULL DEFAULT false,
                "read_at" TIMESTAMPTZ(3),
                "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT now(),
                CONSTRAINT "fk_notifications_user_id" FOREIGN KEY ("user_id") 
                    REFERENCES "users" ("id") ON DELETE CASCADE
            );

            CREATE INDEX IF NOT EXISTS "idx_notifications_user_is_read" 
                ON "notifications" ("user_id", "is_read");

            CREATE INDEX IF NOT EXISTS "idx_notifications_user_created_at" 
                ON "notifications" ("user_id", "created_at" DESC);
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX IF EXISTS "idx_notifications_user_created_at";
            DROP INDEX IF EXISTS "idx_notifications_user_is_read";
            DROP TABLE IF EXISTS "notifications";
        `);
    }
}
