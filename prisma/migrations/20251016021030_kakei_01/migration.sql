-- CreateEnum
CREATE TYPE "public"."OrgType" AS ENUM ('political', 'household', 'personal');

-- CreateEnum
CREATE TYPE "public"."HouseholdRole" AS ENUM ('owner', 'admin', 'member', 'viewer');

-- CreateEnum
CREATE TYPE "public"."AccountType" AS ENUM ('bank', 'cash', 'credit_card', 'e_money', 'investment', 'loan');

-- CreateTable
CREATE TABLE "public"."organization_settings" (
    "id" BIGSERIAL NOT NULL,
    "political_organization_id" BIGINT NOT NULL,
    "org_type" "public"."OrgType" NOT NULL,
    "mapping_profile" VARCHAR(64),
    "features" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organization_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."household_members" (
    "id" BIGSERIAL NOT NULL,
    "political_organization_id" BIGINT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "role" "public"."HouseholdRole" NOT NULL DEFAULT 'member',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "household_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."accounts" (
    "id" BIGSERIAL NOT NULL,
    "political_organization_id" BIGINT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "type" "public"."AccountType" NOT NULL,
    "institution" VARCHAR(255),
    "currency" VARCHAR(16) NOT NULL DEFAULT 'JPY',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."account_snapshots" (
    "id" BIGSERIAL NOT NULL,
    "account_id" BIGINT NOT NULL,
    "as_of_date" DATE NOT NULL,
    "balance" DECIMAL(18,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "account_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."budgets" (
    "id" BIGSERIAL NOT NULL,
    "political_organization_id" BIGINT NOT NULL,
    "year_month" VARCHAR(7) NOT NULL,
    "category_key" VARCHAR(255) NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "budgets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."rules" (
    "id" BIGSERIAL NOT NULL,
    "political_organization_id" BIGINT NOT NULL,
    "field" VARCHAR(64) NOT NULL,
    "operator" VARCHAR(32) NOT NULL,
    "pattern" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 100,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."expense_shares" (
    "id" BIGSERIAL NOT NULL,
    "transaction_id" BIGINT NOT NULL,
    "member_id" BIGINT NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,

    CONSTRAINT "expense_shares_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "organization_settings_political_organization_id_key" ON "public"."organization_settings"("political_organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "household_members_political_organization_id_user_id_key" ON "public"."household_members"("political_organization_id", "user_id");

-- CreateIndex
CREATE INDEX "accounts_political_organization_id_type_idx" ON "public"."accounts"("political_organization_id", "type");

-- CreateIndex
CREATE UNIQUE INDEX "account_snapshots_account_id_as_of_date_key" ON "public"."account_snapshots"("account_id", "as_of_date");

-- CreateIndex
CREATE UNIQUE INDEX "budgets_political_organization_id_year_month_category_key_key" ON "public"."budgets"("political_organization_id", "year_month", "category_key");

-- CreateIndex
CREATE INDEX "rules_political_organization_id_priority_idx" ON "public"."rules"("political_organization_id", "priority");

-- CreateIndex
CREATE UNIQUE INDEX "expense_shares_transaction_id_member_id_key" ON "public"."expense_shares"("transaction_id", "member_id");

-- AddForeignKey
ALTER TABLE "public"."organization_settings" ADD CONSTRAINT "organization_settings_political_organization_id_fkey" FOREIGN KEY ("political_organization_id") REFERENCES "public"."political_organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."household_members" ADD CONSTRAINT "household_members_political_organization_id_fkey" FOREIGN KEY ("political_organization_id") REFERENCES "public"."political_organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."household_members" ADD CONSTRAINT "household_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."accounts" ADD CONSTRAINT "accounts_political_organization_id_fkey" FOREIGN KEY ("political_organization_id") REFERENCES "public"."political_organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."account_snapshots" ADD CONSTRAINT "account_snapshots_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."budgets" ADD CONSTRAINT "budgets_political_organization_id_fkey" FOREIGN KEY ("political_organization_id") REFERENCES "public"."political_organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."rules" ADD CONSTRAINT "rules_political_organization_id_fkey" FOREIGN KEY ("political_organization_id") REFERENCES "public"."political_organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."expense_shares" ADD CONSTRAINT "expense_shares_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "public"."transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."expense_shares" ADD CONSTRAINT "expense_shares_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "public"."household_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;
