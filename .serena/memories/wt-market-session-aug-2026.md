## WT Market — Update 2026-08-03

### Deployment
- **URL:** https://wt-market.vercel.app
- **GitHub:** `github.com/vodcarebeccca/wt-market` (branch: `master`)

### Database
- **Production:** Neon PostgreSQL — `ep-holy-recipe-aupju4bl`
- **Local:** SQLite (`.env` file) — untuk dev lokal saja

### ⚠️ Seed ke Production
Prisma baca `.env` file, bukan env var. Jadi seed production:
1. Rename `.env` → `.env.backup`
2. Set `$env:DATABASE_URL` ke Neon URL (dari `.env.local`)
3. `npx tsx prisma/seed.ts`
4. Rename balik

### 2 Produk
- WT Rank 10.0 Tank (Rp 40.000, 5 stok)
- WT Rank 10.0 Aircraft (Rp 35.000, 0 stok)

### Admin
- URL: https://wt-market.vercel.app/admin
- Email: `admin@wtmarket.local` / Password: `admin123`

**Why:** Session 2026-08-03: migrate DB ke Neon, bersihin 12 produk jadi 2, push ke Vercel.
**How to apply:** Jangan seed langsung tanpa rename `.env`.