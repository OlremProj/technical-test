import { Migration } from '@mikro-orm/migrations';

export class Migration20230511203505 extends Migration {
  async up(): Promise<void> {
    this.addSql(
      'create table "block" ("id" serial primary key, "number" bigint not null, "hash" varchar(66) not null unique, "timestamp" bigint not null, "parent_hash" varchar(66) not null, "nonce" varchar(66) not null, "difficulty" bigint not null, "gas_limit" bigint not null, "gas_used" bigint not null, "miner" varchar(66) not null, "extra_data" text not null, "base_fee_per_gas" bigint not null, "is_forked" boolean);',
    );

    this.addSql(
      'create table "transaction" ("id" serial primary key, "block_number" bigint null, "block_hash" char(66) not null, "transaction_index" bigint null, "hash" char(66) not null unique, "type" bigint not null, "to" char(66) null, "from" char(66) not null, "nonce" bigint not null, "gas_limit" bigint null, "gas_price" bigint null, "max_priority_fee_per_gas" bigint null, "max_fee_per_gas" bigint null, "data" text not null, "value" text null, "chain_id" bigint  null, "access_list" text null);',
    );

    this.addSql(
      'create table "transaction_error" ("id" serial primary key, "hash" char(66) not null unique, "cause" text null);',
    );

    this.addSql(
      'create table "locked_block" ("id" serial primary key, "hash" char(66) not null unique, "timestamp" bigint not null);',
    );

    this.addSql(
      'create table "locked_transactions" ("id" serial primary key, "hash" char(66) not null unique, "timestamp" bigint not null);',
    );

    this.addSql(
      'create table "locked_synchronisation_block" ("id" serial primary key, "is_running" boolean not null unique);',
    );
  }

  async down(): Promise<void> {
    this.addSql('drop table if exists "block";');
    this.addSql('drop table if exists "transaction";');
    this.addSql('drop table if exists "transaction_error";');
    this.addSql('drop table if exists "locked_block";');
    this.addSql('drop table if exists "locked_transactions";');
    this.addSql('drop table if exists "locked_synchronisation_block";');
  }
}
