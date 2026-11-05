import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSrpWallet1793700000000 implements MigrationInterface {
  name = 'CreateSrpWallet1793700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "srp_wallets" (
        "id" SERIAL NOT NULL,
        "user_id" integer NOT NULL,
        "balance" integer NOT NULL DEFAULT 0,
        "total_earned" integer NOT NULL DEFAULT 0,
        "total_redeemed" integer NOT NULL DEFAULT 0,
        "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_srp_wallets_user_id" UNIQUE ("user_id"),
        CONSTRAINT "CHK_srp_wallets_balance" CHECK ("balance" >= 0),
        CONSTRAINT "PK_srp_wallets" PRIMARY KEY ("id"),
        CONSTRAINT "FK_srp_wallets_user_id" FOREIGN KEY ("user_id")
          REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "srp_ledger" (
        "id" BIGSERIAL NOT NULL,
        "user_id" integer NOT NULL,
        "type" varchar(10) NOT NULL,
        "reason" varchar(30) NOT NULL,
        "amount" integer NOT NULL,
        "balance_after" integer NOT NULL,
        "reference_type" varchar(30),
        "reference_id" varchar(100),
        "description" text,
        "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT now(),
        CONSTRAINT "PK_srp_ledger" PRIMARY KEY ("id"),
        CONSTRAINT "FK_srp_ledger_user_id" FOREIGN KEY ("user_id")
          REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(`CREATE INDEX "IDX_srp_ledger_user_id" ON "srp_ledger" ("user_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_srp_ledger_created_at" ON "srp_ledger" ("created_at")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "srp_ledger"`);
    await queryRunner.query(`DROP TABLE "srp_wallets"`);
  }
}
