-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "god";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";

-- CreateEnum
CREATE TYPE "god"."UserRole" AS ENUM ('USER', 'ADMIN', 'STAKEHOLDER', 'MODERATOR');

-- CreateEnum
CREATE TYPE "god"."SubscriptionStatus" AS ENUM ('ACTIVE', 'PAUSED', 'CANCELLED', 'TRIAL');

-- CreateTable
CREATE TABLE "god"."god_users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "username" VARCHAR(50),
    "first_name" VARCHAR(50),
    "last_name" VARCHAR(50),
    "full_name" VARCHAR(100),
    "phone_number" VARCHAR(20),
    "avatar_url" TEXT,
    "billing_address" JSONB,
    "payment_method" JSONB,
    "role" "god"."UserRole" NOT NULL DEFAULT 'USER',
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "timezone" VARCHAR(50) NOT NULL DEFAULT 'UTC',
    "preferred_language" VARCHAR(10) NOT NULL DEFAULT 'en',
    "notification_preferences" JSONB NOT NULL DEFAULT '{"sms": true, "email": true}',
    "last_login_at" TIMESTAMPTZ DEFAULT (now() AT TIME ZONE 'EST'),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'EST'),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'EST'),
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "god_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "god"."god_subscriptions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "status" "god"."SubscriptionStatus" NOT NULL DEFAULT 'TRIAL',
    "theme_ids" TEXT[],
    "preferred_time" TIME NOT NULL DEFAULT '09:00:00 EST'::time,
    "frequency" VARCHAR(20) NOT NULL DEFAULT 'DAILY',
    "trial_ends_at" TIMESTAMPTZ DEFAULT (now() AT TIME ZONE 'EST'),
    "last_message_at" TIMESTAMPTZ DEFAULT (now() AT TIME ZONE 'EST'),
    "next_message_at" TIMESTAMPTZ DEFAULT (now() AT TIME ZONE 'EST'),
    "subscription_ends_at" TIMESTAMPTZ DEFAULT (now() AT TIME ZONE 'EST'),
    "payment_status" VARCHAR(20),
    "stripe_customer_id" VARCHAR(50),
    "stripe_subscription_id" VARCHAR(50),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'EST'),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'EST'),
    "cancelled_at" TIMESTAMPTZ DEFAULT (now() AT TIME ZONE 'EST'),

    CONSTRAINT "god_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "god"."god_message_templates" (
    "id" SERIAL NOT NULL,
    "theme_id" VARCHAR(50) NOT NULL,
    "prompt" TEXT NOT NULL,
    "message" TEXT,
    "character_count" INTEGER,
    "language" VARCHAR(10) NOT NULL DEFAULT 'en',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "success_rate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "times_used" INTEGER NOT NULL DEFAULT 0,
    "last_used_at" TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'EST'),
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'EST'),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'EST'),

    CONSTRAINT "god_message_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "god"."god_sent_messages" (
    "id" SERIAL NOT NULL,
    "user_id" UUID NOT NULL,
    "subscription_id" UUID NOT NULL,
    "phone_number" VARCHAR(20) NOT NULL,
    "message" TEXT NOT NULL,
    "theme_id" VARCHAR(50) NOT NULL,
    "template_id" INTEGER NOT NULL,
    "twilio_sid" VARCHAR(50) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'SENT',
    "delivery_status" VARCHAR(20),
    "error_message" TEXT,
    "sent_at" TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'EST'),
    "delivered_at" TIMESTAMPTZ DEFAULT (now() AT TIME ZONE 'EST'),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'EST'),

    CONSTRAINT "god_sent_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "god"."god_user_preferences" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "theme_preferences" TEXT[],
    "blocked_themes" TEXT[],
    "preferred_bible_version" VARCHAR(20) NOT NULL DEFAULT 'NIV',
    "message_length_preference" VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'EST'),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'EST'),

    CONSTRAINT "god_user_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "god_users_email_key" ON "god"."god_users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "god_users_username_key" ON "god"."god_users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "god_users_phone_number_key" ON "god"."god_users"("phone_number");

-- CreateIndex
CREATE UNIQUE INDEX "god_user_preferences_user_id_key" ON "god"."god_user_preferences"("user_id");

-- AddForeignKey
ALTER TABLE "god"."god_subscriptions" ADD CONSTRAINT "god_subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "god"."god_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "god"."god_message_templates" ADD CONSTRAINT "god_message_templates_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "god"."god_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "god"."god_sent_messages" ADD CONSTRAINT "god_sent_messages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "god"."god_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "god"."god_sent_messages" ADD CONSTRAINT "god_sent_messages_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "god"."god_subscriptions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "god"."god_sent_messages" ADD CONSTRAINT "god_sent_messages_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "god"."god_message_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "god"."god_user_preferences" ADD CONSTRAINT "god_user_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "god"."god_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

