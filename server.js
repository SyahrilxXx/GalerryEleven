import express from "express";
import cors from "cors";
import multer from "multer";
import path from "path";
import fs from "fs/promises";
import { existsSync } from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

// Password sesuai requirement
const UPLOAD_PASSWORD = "elevenimage";
const DELETE_PASSWORD = "delsyah";
const PIN_PASSWORD = "sematelv";
const VAULT_PASSWORD = "syahril1212";

// Folder penyimpanan file (wajib: "GalleryEleven")
const GALLERY_DIR = path.join(__dirname, "GalleryEleven");
const DATA_DIR = path.join(__dirname, "data");
const DB_PATH = path.join(DATA_DIR, "db.json");

async function ensureStorage() {
  await fs.mkdir(GALLERY_DIR, { recursive: true });
  await fs.mkdir(DATA_DIR, { recursive: true });
  if (!existsSync(DB_PATH)) {
    await fs.writeFile(DB_PATH, JSON.stringify({ photos: [] }, null, 2), "utf-8");
  }
}

async function readDb() {
  const raw = await fs.readFile(DB_PATH, "utf-8");
  const parsed = JSON.parse(raw || "{}");
  if (!parsed || typeof parsed !== "object") return { photos: [] };
  if (!Array.isArray(parsed.photos)) parsed.photos = [];
  return parsed;
}

async function writeDb(db) {
  await fs.writeFile(DB_PATH, JSON.stringify(db, null, 2), "utf-8");
}

function safeExtFromMime(mime) {
  if (mime === "image/png") return ".png";
  if (mime === "image/jpeg") return ".jpg";
  if (mime === "image/webp") return ".webp";
  if (mime === "image/gif") return ".gif";
  return ".jpg";
}

function makeId() {
  return `img_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      await ensureStorage();
      cb(null, GALLERY_DIR);
    } catch (e) {
      cb(e);
    }
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || safeExtFromMime(file.mimetype);
    const id = makeId();
    cb(null, `${id}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 12 * 1024 * 1024 } // 12MB
});

const app = express();
app.use(cors());
app.use(express.json({ limit: "2mb" }));

// Static: halaman web + folder foto
app.use("/", express.static(path.join(__dirname, "public")));
app.use("/GalleryEleven", express.static(GALLERY_DIR));

// API: list foto
app.get("/api/photos", async (req, res) => {
  try {
    await ensureStorage();
    const db = await readDb();
    res.json({ photos: db.photos });
  } catch (e) {
    res.status(500).json({ error: "Gagal membaca data." });
  }
});

// API: upload
app.post("/api/upload", upload.single("file"), async (req, res) => {
  try {
    await ensureStorage();
    const password = String(req.body?.password || "");
    const title = String(req.body?.title || "").trim();

    if (password !== UPLOAD_PASSWORD) {
      // Hapus file kalau terlanjur tersimpan
      if (req.file?.path) {
        try { await fs.unlink(req.file.path); } catch {}
      }
      return res.status(401).json({ error: "Password upload salah." });
    }

    if (!title) {
      if (req.file?.path) {
        try { await fs.unlink(req.file.path); } catch {}
      }
      return res.status(400).json({ error: "Judul foto wajib diisi." });
    }

    if (!req.file) {
      return res.status(400).json({ error: "File gambar tidak ditemukan." });
    }

    const fileName = req.file.filename;
    const id = path.parse(fileName).name;
    const createdAt = new Date().toISOString();
    const mimeType = req.file.mimetype;
    const url = `/GalleryEleven/${encodeURIComponent(fileName)}`;

    const db = await readDb();
    db.photos.unshift({
      id,
      title,
      createdAt,
      mimeType,
      url,
      pinned: false,
      fileName,
    });
    await writeDb(db);

    res.json({ ok: true, photo: db.photos[0] });
  } catch (e) {
    res.status(500).json({ error: "Gagal upload foto." });
  }
});

// API: sematkan (bisa banyak, tanpa batas)
app.post("/api/pin/:id", async (req, res) => {
  try {
    const password = String(req.body?.password || "");
    if (password !== PIN_PASSWORD) return res.status(401).json({ error: "Password sematkan salah." });

    const id = String(req.params.id || "");
    const db = await readDb();
    const photo = db.photos.find((p) => p.id === id);
    if (!photo) return res.status(404).json({ error: "Foto tidak ditemukan." });

    photo.pinned = true;
    await writeDb(db);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: "Gagal menyematkan foto." });
  }
});

// API: unsematkan
app.post("/api/unpin/:id", async (req, res) => {
  try {
    const password = String(req.body?.password || "");
    if (password !== PIN_PASSWORD) return res.status(401).json({ error: "Password sematkan salah." });

    const id = String(req.params.id || "");
    const db = await readDb();
    const photo = db.photos.find((p) => p.id === id);
    if (!photo) return res.status(404).json({ error: "Foto tidak ditemukan." });

    photo.pinned = false;
    await writeDb(db);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: "Gagal melepas sematan foto." });
  }
});

// API: hapus
app.delete("/api/photos/:id", async (req, res) => {
  try {
    const password = String(req.body?.password || "");
    if (password !== DELETE_PASSWORD) return res.status(401).json({ error: "Password hapus salah." });

    const id = String(req.params.id || "");
    const db = await readDb();
    const index = db.photos.findIndex((p) => p.id === id);
    if (index === -1) return res.status(404).json({ error: "Foto tidak ditemukan." });

    const [removed] = db.photos.splice(index, 1);
    await writeDb(db);

    if (removed?.fileName) {
      const filePath = path.join(GALLERY_DIR, removed.fileName);
      try { await fs.unlink(filePath); } catch {}
    }

    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: "Gagal menghapus foto." });
  }
});

// API: lihat password (vault)
app.post("/api/vault", async (req, res) => {
  const password = String(req.body?.password || "");
  if (password !== VAULT_PASSWORD) return res.status(401).json({ error: "Password utama salah." });

  res.json({
    ok: true,
    passwords: {
      upload: UPLOAD_PASSWORD,
      delete: DELETE_PASSWORD,
      pin: PIN_PASSWORD,
      vault: VAULT_PASSWORD,
    },
  });
});

await ensureStorage();
app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});
