import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateBvWallet1793900000000 implements MigrationInterface {
  name = 'CreateBvWallet1793900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "bv_wallets" (
        "id" SERIAL NOT NULL,
        "user_id" integer NOT NULL,
        "balance" integer NOT NULL DEFAULT 0,
        "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_bv_wallets_user_id" UNIQUE ("user_id"),
        CONSTRAINT "CHK_bv_wallets_balance" CHECK ("balance" >= 0),
        CONSTRAINT "PK_bv_wallets" PRIMARY KEY ("id"),
        CONSTRAINT "FK_bv_wallets_user_id" FOREIGN KEY ("user_id")
          REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "bv_ledger" (
        "id" BIGSERIAL NOT NULL,
        "user_id" integer NOT NULL,
        "from_user_id" integer NOT NULL,
        "amount" integer NOT NULL,
        "balance_after" integer NOT NULL,
        "reference_type" varchar(30),
        "reference_id" varchar(100),
        "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT now(),
        CONSTRAINT "PK_bv_ledger" PRIMARY KEY ("id"),
        CONSTRAINT "FK_bv_ledger_user_id" FOREIGN KEY ("user_id")
          REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "FK_bv_ledger_from_user_id" FOREIGN KEY ("from_user_id")
          REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(`CREATE INDEX "IDX_bv_ledger_user_id" ON "bv_ledger" ("user_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_bv_ledger_created_at" ON "bv_ledger" ("created_at")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "bv_ledger"`);
    await queryRunner.query(`DROP TABLE "bv_wallets"`);
  }
}
