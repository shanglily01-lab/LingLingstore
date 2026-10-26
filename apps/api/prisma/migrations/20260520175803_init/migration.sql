-- CreateTable
CREATE TABLE "users" (
    "id" BIGSERIAL NOT NULL,
    "region" TEXT NOT NULL DEFAULT 'CN',
    "country_code" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "password_hash" TEXT,
    "display_name" TEXT,
    "region_verified_at" TIMESTAMP(3),
    "status" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "region_change_logs" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "from_region" TEXT NOT NULL,
    "to_region" TEXT NOT NULL,
    "ip_country" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "region_change_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_categories" (
    "id" BIGSERIAL NOT NULL,
    "parent_id" BIGINT,
    "name_cn" TEXT,
    "name_en" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "product_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" BIGSERIAL NOT NULL,
    "spu_no" TEXT NOT NULL,
    "name_cn" TEXT,
    "name_en" TEXT,
    "description_cn" TEXT,
    "description_en" TEXT,
    "category_id" BIGINT,
    "images" JSONB,
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_listings" (
    "id" BIGSERIAL NOT NULL,
    "product_id" BIGINT NOT NULL,
    "region" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "price" BIGINT NOT NULL,
    "currency" TEXT NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "reserved_stock" INTEGER NOT NULL DEFAULT 0,
    "shipping_template_id" BIGINT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_listings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shipping_addresses" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "recipient_name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "country_code" TEXT NOT NULL,
    "state_province" TEXT,
    "city" TEXT NOT NULL,
    "district" TEXT,
    "street_address" TEXT NOT NULL,
    "postal_code" TEXT,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "id_card_number" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shipping_addresses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shipping_templates" (
    "id" BIGSERIAL NOT NULL,
    "name" TEXT,
    "region" TEXT NOT NULL,
    "rules" JSONB NOT NULL,

    CONSTRAINT "shipping_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" BIGSERIAL NOT NULL,
    "order_no" TEXT NOT NULL,
    "user_id" BIGINT NOT NULL,
    "region" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "subtotal" BIGINT NOT NULL,
    "shipping_fee" BIGINT NOT NULL,
    "total_amount" BIGINT NOT NULL,
    "currency" TEXT NOT NULL,
    "shipping_address_snapshot" JSONB,
    "payment_channel" TEXT,
    "payment_provider_order_id" TEXT,
    "paid_at" TIMESTAMP(3),
    "shipping_method" TEXT,
    "tracking_no" TEXT,
    "shipped_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_items" (
    "id" BIGSERIAL NOT NULL,
    "order_id" BIGINT NOT NULL,
    "product_id" BIGINT,
    "listing_id" BIGINT,
    "product_snapshot" JSONB NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit_price" BIGINT NOT NULL,
    "subtotal" BIGINT NOT NULL,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_intents" (
    "id" BIGSERIAL NOT NULL,
    "order_id" BIGINT NOT NULL,
    "channel" TEXT NOT NULL,
    "provider_order_id" TEXT,
    "amount" BIGINT NOT NULL,
    "currency" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'created',
    "raw_create_response" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_intents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_callbacks" (
    "id" BIGSERIAL NOT NULL,
    "channel" TEXT NOT NULL,
    "provider_order_id" TEXT NOT NULL,
    "order_no" TEXT NOT NULL,
    "amount" BIGINT,
    "currency" TEXT,
    "status" TEXT,
    "raw_payload" JSONB NOT NULL,
    "received_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_callbacks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refunds" (
    "id" BIGSERIAL NOT NULL,
    "refund_no" TEXT NOT NULL,
    "order_id" BIGINT NOT NULL,
    "amount" BIGINT NOT NULL,
    "currency" TEXT NOT NULL,
    "reason" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "channel" TEXT,
    "provider_refund_id" TEXT,
    "approved_by" BIGINT,
    "approved_at" TIMESTAMP(3),
    "refunded_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refunds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shipment_trackings" (
    "id" BIGSERIAL NOT NULL,
    "order_id" BIGINT NOT NULL,
    "carrier" TEXT,
    "tracking_no" TEXT NOT NULL,
    "status" TEXT,
    "events" JSONB,
    "last_synced_at" TIMESTAMP(3),

    CONSTRAINT "shipment_trackings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" BIGSERIAL NOT NULL,
    "actor_type" TEXT NOT NULL,
    "actor_id" BIGINT,
    "action" TEXT NOT NULL,
    "target_type" TEXT,
    "target_id" TEXT,
    "payload" JSONB,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_region_idx" ON "users"("region");

-- CreateIndex
CREATE INDEX "region_change_logs_user_id_created_at_idx" ON "region_change_logs"("user_id", "created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "products_spu_no_key" ON "products"("spu_no");

-- CreateIndex
CREATE INDEX "product_listings_region_is_active_idx" ON "product_listings"("region", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "product_listings_product_id_region_key" ON "product_listings"("product_id", "region");

-- CreateIndex
CREATE UNIQUE INDEX "product_listings_region_sku_key" ON "product_listings"("region", "sku");

-- CreateIndex
CREATE UNIQUE INDEX "orders_order_no_key" ON "orders"("order_no");

-- CreateIndex
CREATE INDEX "orders_status_expires_at_idx" ON "orders"("status", "expires_at");

-- CreateIndex
CREATE INDEX "orders_user_id_created_at_idx" ON "orders"("user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "orders_region_status_idx" ON "orders"("region", "status");

-- CreateIndex
CREATE INDEX "order_items_order_id_idx" ON "order_items"("order_id");

-- CreateIndex
CREATE INDEX "payment_intents_order_id_idx" ON "payment_intents"("order_id");

-- CreateIndex
CREATE INDEX "payment_intents_channel_provider_order_id_idx" ON "payment_intents"("channel", "provider_order_id");

-- CreateIndex
CREATE INDEX "payment_callbacks_order_no_idx" ON "payment_callbacks"("order_no");

-- CreateIndex
CREATE UNIQUE INDEX "payment_callbacks_channel_provider_order_id_status_key" ON "payment_callbacks"("channel", "provider_order_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "refunds_refund_no_key" ON "refunds"("refund_no");

-- CreateIndex
CREATE UNIQUE INDEX "shipment_trackings_order_id_tracking_no_key" ON "shipment_trackings"("order_id", "tracking_no");

-- CreateIndex
CREATE INDEX "audit_logs_actor_type_actor_id_created_at_idx" ON "audit_logs"("actor_type", "actor_id", "created_at" DESC);

-- AddForeignKey
ALTER TABLE "region_change_logs" ADD CONSTRAINT "region_change_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_categories" ADD CONSTRAINT "product_categories_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "product_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "product_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_listings" ADD CONSTRAINT "product_listings_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipping_addresses" ADD CONSTRAINT "shipping_addresses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_intents" ADD CONSTRAINT "payment_intents_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipment_trackings" ADD CONSTRAINT "shipment_trackings_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
