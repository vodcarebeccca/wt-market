-- AddProductImages
-- Create ProductImage table for multi-image product support.
-- Existing Product.imageUrl is preserved as a fallback/cover image.

CREATE TABLE IF NOT EXISTS "ProductImage" (
  "id"        TEXT NOT NULL PRIMARY KEY,
  "productId" TEXT NOT NULL,
  "url"       TEXT NOT NULL,
  "alt"       TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ProductImage_productId_fkey"
    FOREIGN KEY ("productId") REFERENCES "Product"("id")
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "ProductImage_productId_sortOrder_idx"
  ON "ProductImage"("productId", "sortOrder");
