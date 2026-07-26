# WT Market

Toko online akun War Thunder (Next.js + Prisma SQLite + Midtrans).

## Fitur

- Katalog bilingual ID/EN + filter (kategori, nation, level, rank, harga)
- Admin: produk, stok bulk paste/upload, order, mark paid
- Auto-delivery kredensial setelah bayar (webhook Midtrans atau mark paid manual)
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

## Midtrans

1. Daftar Midtrans Sandbox
2. Isi di `.env`: `MIDTRANS_SERVER_KEY`, `MIDTRANS_CLIENT_KEY`, `NEXT_PUBLIC_MIDTRANS_CLIENT_KEY`
3. Webhook URL: `https://<public-url>/api/midtrans/notification` (cloudflared/ngrok saat local)
4. Tanpa key valid, order tetap dibuat — admin bisa **Mark paid + deliver**

Kartu sandbox: `4811 1111 1111 1114` / CVV `123` / OTP `112233`

## Alur jual

1. Admin tambah produk + import stok `email:password` per baris
2. Buyer checkout → bayar Midtrans (atau admin mark paid)
3. Sistem assign 1 stok AVAILABLE → order `DELIVERED`
4. Buyer buka link order `?token=...` untuk lihat kredensial

## Catatan

- Bukan afiliasi Gaijin. Jual-beli akun melanggar ToS War Thunder.
- Kredensial disimpan plaintext di SQLite lokal — amankan file DB di production.
- Ganti `ADMIN_PASSWORD` dan `SESSION_SECRET` sebelum deploy.
