-- Remove legacy QRIS/Midtrans order fields and GoBiz token storage.
ALTER TABLE "Order" DROP COLUMN IF EXISTS "midtransOrderId";
ALTER TABLE "Order" DROP COLUMN IF EXISTS "midtransSnapToken";
DROP TABLE IF EXISTS "GoBizConfig";
