# WT Market

Toko online akun War Thunder (Next.js + Prisma PostgreSQL + pembayaran manual WhatsApp).

## Fitur

- Katalog bilingual ID/EN + filter (kategori, nation, level, rank, harga)
- Admin: produk, stok bulk paste/upload, order, mark paid
- Pembayaran manual via WhatsApp admin, lalu kredensial dikirim setelah admin mark paid
- Harga IDR primary + tampilan USD

## Setup

```bash
cd "E:\toko saya"
npm install
# edit .env (lihat .env.example)
npx prisma migrate dev
npm run db:seed
npm run dev
```

Buka:

- Storefront: http://localhost:3000/id
- Admin: http://localhost:3000/admin  
  Default: `admin@wtmarket.local` / `admin123`

## Pembayaran manual WhatsApp

1. Buyer checkout dan order dibuat dengan status `PENDING`
2. Buyer diarahkan ke `wa.me/6285767503449` dengan detail order
3. Admin cek pembayaran manual, lalu klik **Mark paid + deliver** di panel admin

## Alur jual

1. Admin tambah produk + import stok `email:password` per baris
2. Buyer checkout → chat admin via WhatsApp untuk pembayaran manual
3. Sistem assign 1 stok AVAILABLE → order `DELIVERED`
4. Buyer buka link order `?token=...` untuk lihat kredensial

## Catatan

- Bukan afiliasi Gaijin. Jual-beli akun melanggar ToS War Thunder.
- Kredensial disimpan plaintext di SQLite lokal — amankan file DB di production.
- Ganti `ADMIN_PASSWORD` dan `SESSION_SECRET` sebelum deploy.
