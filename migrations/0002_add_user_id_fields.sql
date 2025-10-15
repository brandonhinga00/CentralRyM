-- Add user_id fields to all tables for Row-Level Security
-- This migration adds user_id columns to enable RLS policies

-- Add user_id to suppliers table
ALTER TABLE "suppliers" ADD COLUMN "user_id" varchar NOT NULL REFERENCES "users"("id");

-- Add user_id to categories table
ALTER TABLE "categories" ADD COLUMN "user_id" varchar NOT NULL REFERENCES "users"("id");

-- Add user_id to products table
ALTER TABLE "products" ADD COLUMN "user_id" varchar NOT NULL REFERENCES "users"("id");

-- Add user_id to customers table
ALTER TABLE "customers" ADD COLUMN "user_id" varchar NOT NULL REFERENCES "users"("id");

-- Add user_id to sales table
ALTER TABLE "sales" ADD COLUMN "user_id" varchar NOT NULL REFERENCES "users"("id");

-- Add user_id to payments table
ALTER TABLE "payments" ADD COLUMN "user_id" varchar NOT NULL REFERENCES "users"("id");

-- Add user_id to expenses table
ALTER TABLE "expenses" ADD COLUMN "user_id" varchar NOT NULL REFERENCES "users"("id");

-- Add user_id to stock_movements table
ALTER TABLE "stock_movements" ADD COLUMN "user_id" varchar NOT NULL REFERENCES "users"("id");

-- Add user_id to api_keys table
ALTER TABLE "api_keys" ADD COLUMN "user_id" varchar NOT NULL REFERENCES "users"("id");

-- Note: cash_closings already has closed_by field which references users.id
-- We'll use that for RLS instead of adding a separate user_id field

-- Create indexes for performance
CREATE INDEX "suppliers_user_id_idx" ON "suppliers"("user_id");
CREATE INDEX "categories_user_id_idx" ON "categories"("user_id");
CREATE INDEX "products_user_id_idx" ON "products"("user_id");
CREATE INDEX "customers_user_id_idx" ON "customers"("user_id");
CREATE INDEX "sales_user_id_idx" ON "sales"("user_id");
CREATE INDEX "payments_user_id_idx" ON "payments"("user_id");
CREATE INDEX "expenses_user_id_idx" ON "expenses"("user_id");
CREATE INDEX "stock_movements_user_id_idx" ON "stock_movements"("user_id");
CREATE INDEX "api_keys_user_id_idx" ON "api_keys"("user_id");