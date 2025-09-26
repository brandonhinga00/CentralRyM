-- Fix products table category field - remove foreign key constraint
-- This migration removes the foreign key constraint on products.category
-- and ensures it's a free text field

-- Drop the foreign key constraint if it exists
ALTER TABLE "products" DROP CONSTRAINT IF EXISTS "products_category_id_fkey";

-- Rename category_id to category if the column still has the old name
-- (This is a safety check in case the column wasn't renamed properly)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'products' AND column_name = 'category_id'
    ) THEN
        ALTER TABLE "products" RENAME COLUMN "category_id" TO "category";
    END IF;
END $$;

-- Ensure the category column is varchar (text) without foreign key
-- This is redundant but ensures the column type is correct
ALTER TABLE "products" ALTER COLUMN "category" TYPE varchar;