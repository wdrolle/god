-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "auth";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "extensions";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "god";

-- CreateEnum
CREATE TYPE "auth"."aal_level" AS ENUM ('aal1', 'aal2', 'aal3');

-- CreateEnum
CREATE TYPE "auth"."code_challenge_method" AS ENUM ('s256', 'plain');

-- CreateEnum
CREATE TYPE "auth"."factor_status" AS ENUM ('unverified', 'verified');

-- CreateEnum
CREATE TYPE "auth"."factor_type" AS ENUM ('totp', 'webauthn', 'phone');

-- CreateEnum
CREATE TYPE "auth"."one_time_token_type" AS ENUM ('confirmation_token', 'reauthentication_token', 'recovery_token', 'email_change_token_new', 'email_change_token_current', 'phone_change_token');

-- CreateEnum
CREATE TYPE "god"."subscription_status_enum" AS ENUM ('ACTIVE', 'PAUSED', 'CANCELLED', 'TRIAL');

-- CreateEnum
CREATE TYPE "god"."user_role_enum" AS ENUM ('USER', 'ADMIN', 'STAKEHOLDER', 'MODERATOR');

-- CreateTable
CREATE TABLE "auth"."users" (
    "instance_id" UUID,
    "id" UUID NOT NULL,
    "aud" VARCHAR(255),
    "role" VARCHAR(255),
    "email" VARCHAR(255),
    "encrypted_password" VARCHAR(255),
    "email_confirmed_at" TIMESTAMPTZ(6),
    "invited_at" TIMESTAMPTZ(6),
    "confirmation_token" VARCHAR(255),
    "confirmation_sent_at" TIMESTAMPTZ(6),
    "recovery_token" VARCHAR(255),
    "recovery_sent_at" TIMESTAMPTZ(6),
    "email_change_token_new" VARCHAR(255),
    "email_change" VARCHAR(255),
    "email_change_sent_at" TIMESTAMPTZ(6),
    "last_sign_in_at" TIMESTAMPTZ(6),
    "raw_app_meta_data" JSONB,
    "raw_user_meta_data" JSONB,
    "is_super_admin" BOOLEAN,
    "created_at" TIMESTAMPTZ(6),
    "updated_at" TIMESTAMPTZ(6),
    "phone" VARCHAR(255),
    "phone_confirmed_at" TIMESTAMPTZ(6),
    "phone_change" VARCHAR(255) DEFAULT '',
    "phone_change_token" VARCHAR(255) DEFAULT '',
    "phone_change_sent_at" TIMESTAMPTZ(6),
    "confirmed_at" TIMESTAMPTZ(6) DEFAULT LEAST(email_confirmed_at, phone_confirmed_at),
    "email_change_token_current" VARCHAR(255) DEFAULT '',
    "email_change_confirm_status" SMALLINT DEFAULT 0,
    "banned_until" TIMESTAMPTZ(6),
    "reauthentication_token" VARCHAR(255) DEFAULT '',
    "reauthentication_sent_at" TIMESTAMPTZ(6),
    "is_sso_user" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMPTZ(6),
    "is_anonymous" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "god"."god_users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "auth_user_id" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "username" VARCHAR(50),
    "first_name" VARCHAR(50),
    "last_name" VARCHAR(50),
    "full_name" VARCHAR(100),
    "phone_number" VARCHAR(20),
    "avatar_url" TEXT,
    "billing_address" JSONB,
    "payment_method" JSONB,
    "role" "god"."user_role_enum" DEFAULT 'USER',
    "verified" BOOLEAN DEFAULT false,
    "timezone" VARCHAR(50) DEFAULT 'UTC',
    "preferred_language" VARCHAR(10) DEFAULT 'en',
    "notification_preferences" JSONB DEFAULT '{"sms": true, "email": true}',
    "last_login_at" TIMESTAMPTZ(6) DEFAULT (now() AT TIME ZONE 'EST'::text),
    "created_at" TIMESTAMPTZ(6) DEFAULT (now() AT TIME ZONE 'EST'::text),
    "updated_at" TIMESTAMPTZ(6) DEFAULT (now() AT TIME ZONE 'EST'::text),
    "deleted_at" TIMESTAMPTZ(6),
    "phone_country" VARCHAR(2) DEFAULT 'US',

    CONSTRAINT "god_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "god"."god_one_time_tokens" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "token" TEXT NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "used_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) DEFAULT (now() AT TIME ZONE 'EST'::text),

    CONSTRAINT "god_one_time_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "god"."god_subscriptions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID,
    "status" "god"."subscription_status_enum" DEFAULT 'TRIAL',
    "theme_ids" TEXT[] DEFAULT ARRAY['faith']::TEXT[],
    "preferred_time" TIME(6) DEFAULT '09:00:00'::time without time zone,
    "frequency" VARCHAR(20) DEFAULT 'DAILY',
    "trial_ends_at" TIMESTAMPTZ(6) DEFAULT (now() AT TIME ZONE 'EST'::text),
    "last_message_at" TIMESTAMPTZ(6) DEFAULT (now() AT TIME ZONE 'EST'::text),
    "next_message_at" TIMESTAMPTZ(6) DEFAULT (now() AT TIME ZONE 'EST'::text),
    "subscription_ends_at" TIMESTAMPTZ(6) DEFAULT (now() AT TIME ZONE 'EST'::text),
    "payment_status" VARCHAR(20),
    "stripe_customer_id" VARCHAR(50),
    "stripe_subscription_id" VARCHAR(50),
    "created_at" TIMESTAMPTZ(6) DEFAULT (now() AT TIME ZONE 'EST'::text),
    "updated_at" TIMESTAMPTZ(6) DEFAULT (now() AT TIME ZONE 'EST'::text),
    "cancelled_at" TIMESTAMPTZ(6) DEFAULT (now() AT TIME ZONE 'EST'::text),

    CONSTRAINT "god_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "god"."god_message_templates" (
    "id" SERIAL NOT NULL,
    "theme_id" VARCHAR(50) NOT NULL,
    "prompt" TEXT NOT NULL,
    "message" TEXT,
    "character_count" INTEGER,
    "language" VARCHAR(10) DEFAULT 'en',
    "active" BOOLEAN DEFAULT true,
    "success_rate" DOUBLE PRECISION DEFAULT 0,
    "times_used" INTEGER DEFAULT 0,
    "last_used_at" TIMESTAMPTZ(6) DEFAULT (now() AT TIME ZONE 'EST'::text),
    "created_by" UUID,
    "created_at" TIMESTAMPTZ(6) DEFAULT (now() AT TIME ZONE 'EST'::text),
    "updated_at" TIMESTAMPTZ(6) DEFAULT (now() AT TIME ZONE 'EST'::text),

    CONSTRAINT "god_message_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "god"."god_sent_messages" (
    "id" SERIAL NOT NULL,
    "user_id" UUID,
    "subscription_id" UUID,
    "phone_number" VARCHAR(20) NOT NULL,
    "message" TEXT NOT NULL,
    "theme_id" VARCHAR(50) NOT NULL,
    "template_id" INTEGER,
    "twilio_sid" VARCHAR(50) NOT NULL,
    "status" VARCHAR(20) DEFAULT 'SENT',
    "delivery_status" VARCHAR(20),
    "error_message" TEXT,
    "sent_at" TIMESTAMPTZ(6) DEFAULT (now() AT TIME ZONE 'EST'::text),
    "delivered_at" TIMESTAMPTZ(6) DEFAULT (now() AT TIME ZONE 'EST'::text),
    "created_at" TIMESTAMPTZ(6) DEFAULT (now() AT TIME ZONE 'EST'::text),

    CONSTRAINT "god_sent_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "god"."god_user_preferences" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID,
    "theme_preferences" TEXT[] DEFAULT ARRAY['faith']::TEXT[],
    "blocked_themes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "preferred_bible_version" VARCHAR(20) DEFAULT 'NIV',
    "message_length_preference" VARCHAR(20) DEFAULT 'MEDIUM',
    "created_at" TIMESTAMPTZ(6) DEFAULT (now() AT TIME ZONE 'EST'::text),
    "updated_at" TIMESTAMPTZ(6) DEFAULT (now() AT TIME ZONE 'EST'::text),

    CONSTRAINT "god_user_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "god"."god_chat_conversations" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "user_id" UUID NOT NULL,
    "title" VARCHAR(100) DEFAULT 'New Conversation',
    "created_at" TIMESTAMPTZ(6) DEFAULT (now() AT TIME ZONE 'EST'::text),
    "updated_at" TIMESTAMPTZ(6) DEFAULT (now() AT TIME ZONE 'EST'::text),

    CONSTRAINT "god_chat_conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "god"."god_chat_messages" (
    "id" SERIAL NOT NULL,
    "conversation_id" UUID NOT NULL,
    "role" VARCHAR(20) NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) DEFAULT (now() AT TIME ZONE 'EST'::text),

    CONSTRAINT "god_chat_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth"."audit_log_entries" (
    "instance_id" UUID,
    "id" UUID NOT NULL,
    "payload" JSON,
    "created_at" TIMESTAMPTZ(6),
    "ip_address" VARCHAR(64) NOT NULL DEFAULT '',

    CONSTRAINT "audit_log_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth"."flow_state" (
    "id" UUID NOT NULL,
    "user_id" UUID,
    "auth_code" TEXT NOT NULL,
    "code_challenge_method" "auth"."code_challenge_method" NOT NULL,
    "code_challenge" TEXT NOT NULL,
    "provider_type" TEXT NOT NULL,
    "provider_access_token" TEXT,
    "provider_refresh_token" TEXT,
    "created_at" TIMESTAMPTZ(6),
    "updated_at" TIMESTAMPTZ(6),
    "authentication_method" TEXT NOT NULL,
    "auth_code_issued_at" TIMESTAMPTZ(6),

    CONSTRAINT "flow_state_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth"."identities" (
    "provider_id" TEXT NOT NULL,
    "user_id" UUID NOT NULL,
    "identity_data" JSONB NOT NULL,
    "provider" TEXT NOT NULL,
    "last_sign_in_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6),
    "updated_at" TIMESTAMPTZ(6),
    "email" TEXT DEFAULT lower((identity_data ->> 'email'::text)),
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),

    CONSTRAINT "identities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth"."instances" (
    "id" UUID NOT NULL,
    "uuid" UUID,
    "raw_base_config" TEXT,
    "created_at" TIMESTAMPTZ(6),
    "updated_at" TIMESTAMPTZ(6),

    CONSTRAINT "instances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth"."mfa_amr_claims" (
    "session_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "authentication_method" TEXT NOT NULL,
    "id" UUID NOT NULL,

    CONSTRAINT "amr_id_pk" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth"."mfa_challenges" (
    "id" UUID NOT NULL,
    "factor_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL,
    "verified_at" TIMESTAMPTZ(6),
    "ip_address" INET NOT NULL,
    "otp_code" TEXT,
    "web_authn_session_data" JSONB,

    CONSTRAINT "mfa_challenges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth"."mfa_factors" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "friendly_name" TEXT,
    "factor_type" "auth"."factor_type" NOT NULL,
    "status" "auth"."factor_status" NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "secret" TEXT,
    "phone" TEXT,
    "last_challenged_at" TIMESTAMPTZ(6),
    "web_authn_credential" JSONB,
    "web_authn_aaguid" UUID,

    CONSTRAINT "mfa_factors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth"."one_time_tokens" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "token_type" "auth"."one_time_token_type" NOT NULL,
    "token_hash" TEXT NOT NULL,
    "relates_to" TEXT NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "one_time_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth"."refresh_tokens" (
    "instance_id" UUID,
    "id" BIGSERIAL NOT NULL,
    "token" VARCHAR(255),
    "user_id" VARCHAR(255),
    "revoked" BOOLEAN,
    "created_at" TIMESTAMPTZ(6),
    "updated_at" TIMESTAMPTZ(6),
    "parent" VARCHAR(255),
    "session_id" UUID,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth"."saml_providers" (
    "id" UUID NOT NULL,
    "sso_provider_id" UUID NOT NULL,
    "entity_id" TEXT NOT NULL,
    "metadata_xml" TEXT NOT NULL,
    "metadata_url" TEXT,
    "attribute_mapping" JSONB,
    "created_at" TIMESTAMPTZ(6),
    "updated_at" TIMESTAMPTZ(6),
    "name_id_format" TEXT,

    CONSTRAINT "saml_providers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth"."saml_relay_states" (
    "id" UUID NOT NULL,
    "sso_provider_id" UUID NOT NULL,
    "request_id" TEXT NOT NULL,
    "for_email" TEXT,
    "redirect_to" TEXT,
    "created_at" TIMESTAMPTZ(6),
    "updated_at" TIMESTAMPTZ(6),
    "flow_state_id" UUID,

    CONSTRAINT "saml_relay_states_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth"."schema_migrations" (
    "version" VARCHAR(255) NOT NULL,

    CONSTRAINT "schema_migrations_pkey" PRIMARY KEY ("version")
);

-- CreateTable
CREATE TABLE "auth"."sessions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6),
    "updated_at" TIMESTAMPTZ(6),
    "factor_id" UUID,
    "aal" "auth"."aal_level",
    "not_after" TIMESTAMPTZ(6),
    "refreshed_at" TIMESTAMP(6),
    "user_agent" TEXT,
    "ip" INET,
    "tag" TEXT,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth"."sso_domains" (
    "id" UUID NOT NULL,
    "sso_provider_id" UUID NOT NULL,
    "domain" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6),
    "updated_at" TIMESTAMPTZ(6),

    CONSTRAINT "sso_domains_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth"."sso_providers" (
    "id" UUID NOT NULL,
    "resource_id" TEXT,
    "created_at" TIMESTAMPTZ(6),
    "updated_at" TIMESTAMPTZ(6),

    CONSTRAINT "sso_providers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "auth"."users"("phone");

-- CreateIndex
CREATE INDEX "users_instance_id_idx" ON "auth"."users"("instance_id");

-- CreateIndex
CREATE INDEX "users_is_anonymous_idx" ON "auth"."users"("is_anonymous");

-- CreateIndex
CREATE UNIQUE INDEX "god_users_auth_user_id_key" ON "god"."god_users"("auth_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "god_users_email_key" ON "god"."god_users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "god_users_username_key" ON "god"."god_users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "god_users_phone_number_key" ON "god"."god_users"("phone_number");

-- CreateIndex
CREATE INDEX "idx_users_email" ON "god"."god_users"("email");

-- CreateIndex
CREATE INDEX "idx_users_phone" ON "god"."god_users"("phone_number");

-- CreateIndex
CREATE UNIQUE INDEX "god_one_time_tokens_token_key" ON "god"."god_one_time_tokens"("token");

-- CreateIndex
CREATE INDEX "idx_one_time_tokens_token" ON "god"."god_one_time_tokens"("token");

-- CreateIndex
CREATE INDEX "idx_one_time_tokens_user" ON "god"."god_one_time_tokens"("user_id");

-- CreateIndex
CREATE INDEX "idx_subscriptions_status" ON "god"."god_subscriptions"("status");

-- CreateIndex
CREATE INDEX "idx_subscriptions_user" ON "god"."god_subscriptions"("user_id");

-- CreateIndex
CREATE INDEX "idx_message_templates_theme" ON "god"."god_message_templates"("theme_id");

-- CreateIndex
CREATE INDEX "idx_sent_messages_phone" ON "god"."god_sent_messages"("phone_number");

-- CreateIndex
CREATE INDEX "idx_sent_messages_sent_at" ON "god"."god_sent_messages"("sent_at");

-- CreateIndex
CREATE INDEX "idx_sent_messages_subscription" ON "god"."god_sent_messages"("subscription_id");

-- CreateIndex
CREATE INDEX "idx_sent_messages_user" ON "god"."god_sent_messages"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "god_user_preferences_user_id_key" ON "god"."god_user_preferences"("user_id");

-- CreateIndex
CREATE INDEX "idx_user_preferences_user" ON "god"."god_user_preferences"("user_id");

-- CreateIndex
CREATE INDEX "god_chat_conversations_user_id_idx" ON "god"."god_chat_conversations"("user_id");

-- CreateIndex
CREATE INDEX "god_chat_messages_conversation_id_idx" ON "god"."god_chat_messages"("conversation_id");

-- CreateIndex
CREATE INDEX "audit_logs_instance_id_idx" ON "auth"."audit_log_entries"("instance_id");

-- CreateIndex
CREATE INDEX "flow_state_created_at_idx" ON "auth"."flow_state"("created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_auth_code" ON "auth"."flow_state"("auth_code");

-- CreateIndex
CREATE INDEX "idx_user_id_auth_method" ON "auth"."flow_state"("user_id", "authentication_method");

-- CreateIndex
CREATE INDEX "identities_email_idx" ON "auth"."identities"("email");

-- CreateIndex
CREATE INDEX "identities_user_id_idx" ON "auth"."identities"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "identities_provider_id_provider_unique" ON "auth"."identities"("provider_id", "provider");

-- CreateIndex
CREATE UNIQUE INDEX "mfa_amr_claims_session_id_authentication_method_pkey" ON "auth"."mfa_amr_claims"("session_id", "authentication_method");

-- CreateIndex
CREATE INDEX "mfa_challenge_created_at_idx" ON "auth"."mfa_challenges"("created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "mfa_factors_last_challenged_at_key" ON "auth"."mfa_factors"("last_challenged_at");

-- CreateIndex
CREATE INDEX "factor_id_created_at_idx" ON "auth"."mfa_factors"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "mfa_factors_user_id_idx" ON "auth"."mfa_factors"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "unique_phone_factor_per_user" ON "auth"."mfa_factors"("user_id", "phone");

-- CreateIndex
CREATE INDEX "one_time_tokens_relates_to_hash_idx" ON "auth"."one_time_tokens" USING HASH ("relates_to");

-- CreateIndex
CREATE INDEX "one_time_tokens_token_hash_hash_idx" ON "auth"."one_time_tokens" USING HASH ("token_hash");

-- CreateIndex
CREATE UNIQUE INDEX "one_time_tokens_user_id_token_type_key" ON "auth"."one_time_tokens"("user_id", "token_type");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_unique" ON "auth"."refresh_tokens"("token");

-- CreateIndex
CREATE INDEX "refresh_tokens_instance_id_idx" ON "auth"."refresh_tokens"("instance_id");

-- CreateIndex
CREATE INDEX "refresh_tokens_instance_id_user_id_idx" ON "auth"."refresh_tokens"("instance_id", "user_id");

-- CreateIndex
CREATE INDEX "refresh_tokens_parent_idx" ON "auth"."refresh_tokens"("parent");

-- CreateIndex
CREATE INDEX "refresh_tokens_session_id_revoked_idx" ON "auth"."refresh_tokens"("session_id", "revoked");

-- CreateIndex
CREATE INDEX "refresh_tokens_updated_at_idx" ON "auth"."refresh_tokens"("updated_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "saml_providers_entity_id_key" ON "auth"."saml_providers"("entity_id");

-- CreateIndex
CREATE INDEX "saml_providers_sso_provider_id_idx" ON "auth"."saml_providers"("sso_provider_id");

-- CreateIndex
CREATE INDEX "saml_relay_states_created_at_idx" ON "auth"."saml_relay_states"("created_at" DESC);

-- CreateIndex
CREATE INDEX "saml_relay_states_for_email_idx" ON "auth"."saml_relay_states"("for_email");

-- CreateIndex
CREATE INDEX "saml_relay_states_sso_provider_id_idx" ON "auth"."saml_relay_states"("sso_provider_id");

-- CreateIndex
CREATE INDEX "sessions_not_after_idx" ON "auth"."sessions"("not_after" DESC);

-- CreateIndex
CREATE INDEX "sessions_user_id_idx" ON "auth"."sessions"("user_id");

-- CreateIndex
CREATE INDEX "user_id_created_at_idx" ON "auth"."sessions"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "sso_domains_sso_provider_id_idx" ON "auth"."sso_domains"("sso_provider_id");

-- AddForeignKey
ALTER TABLE "god"."god_users" ADD CONSTRAINT "god_users_auth_user_id_fkey" FOREIGN KEY ("auth_user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "god"."god_one_time_tokens" ADD CONSTRAINT "god_one_time_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "god"."god_users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "god"."god_subscriptions" ADD CONSTRAINT "god_subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "god"."god_users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "god"."god_message_templates" ADD CONSTRAINT "god_message_templates_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "god"."god_users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "god"."god_sent_messages" ADD CONSTRAINT "god_sent_messages_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "god"."god_subscriptions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "god"."god_sent_messages" ADD CONSTRAINT "god_sent_messages_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "god"."god_message_templates"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "god"."god_sent_messages" ADD CONSTRAINT "god_sent_messages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "god"."god_users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "god"."god_user_preferences" ADD CONSTRAINT "god_user_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "god"."god_users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "god"."god_chat_conversations" ADD CONSTRAINT "god_chat_conversations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "god"."god_users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "god"."god_chat_messages" ADD CONSTRAINT "god_chat_messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "god"."god_chat_conversations"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "auth"."identities" ADD CONSTRAINT "identities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "auth"."mfa_amr_claims" ADD CONSTRAINT "mfa_amr_claims_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "auth"."sessions"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "auth"."mfa_challenges" ADD CONSTRAINT "mfa_challenges_auth_factor_id_fkey" FOREIGN KEY ("factor_id") REFERENCES "auth"."mfa_factors"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "auth"."mfa_factors" ADD CONSTRAINT "mfa_factors_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "auth"."one_time_tokens" ADD CONSTRAINT "one_time_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "auth"."refresh_tokens" ADD CONSTRAINT "refresh_tokens_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "auth"."sessions"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "auth"."saml_providers" ADD CONSTRAINT "saml_providers_sso_provider_id_fkey" FOREIGN KEY ("sso_provider_id") REFERENCES "auth"."sso_providers"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "auth"."saml_relay_states" ADD CONSTRAINT "saml_relay_states_flow_state_id_fkey" FOREIGN KEY ("flow_state_id") REFERENCES "auth"."flow_state"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "auth"."saml_relay_states" ADD CONSTRAINT "saml_relay_states_sso_provider_id_fkey" FOREIGN KEY ("sso_provider_id") REFERENCES "auth"."sso_providers"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "auth"."sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "auth"."sso_domains" ADD CONSTRAINT "sso_domains_sso_provider_id_fkey" FOREIGN KEY ("sso_provider_id") REFERENCES "auth"."sso_providers"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

