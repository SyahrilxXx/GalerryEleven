# ElevenImage Gallery (Publik + Folder `GalleryEleven`)

Website galeri foto ini **bisa diakses semua orang** selama servernya Anda jalankan di internet (VPS/hosting). Foto yang diupload akan tersimpan sebagai file fisik di folder `GalleryEleven`.

## Jalankan lokal
1. Install dependensi:
   - `npm install`
2. Jalankan server:
   - `npm run dev`
3. Buka:
   - `http://localhost:3000`

Folder penting:
- `public/` : frontend
- `GalleryEleven/` : hasil upload gambar (file asli)
- `data/db.json` : metadata foto (judul, tanggal, pinned, nama file)

## Supaya bisa dilihat semua orang
Anda harus **deploy** server ini ke hosting yang punya Node.js (contoh: VPS, Render, Railway, Fly.io).

Umumnya:
1. Upload project ini ke GitHub.
2. Buat service Node.js.
3. Set perintah:
   - Build: `npm install`
   - Start: `npm start`
4. Pastikan hosting Anda menyediakan **persistent storage** agar folder `GalleryEleven/` tidak hilang saat restart (jika tidak, foto akan hilang).

