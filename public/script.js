// Frontend publik: data foto diambil dari server, file tersimpan di folder "GalleryEleven"

const galleryGrid = document.getElementById("galleryGrid");
const emptyState = document.getElementById("emptyState");
const fileInput = document.getElementById("fileInput");
const photoCount = document.getElementById("photoCount");
const pinnedCount = document.getElementById("pinnedCount");
const searchInput = document.getElementById("searchInput");
const gallerySection = document.getElementById("gallerySection");
const photoCardTemplate = document.getElementById("photoCardTemplate");
const passwordModal = document.getElementById("passwordModal");
const passwordForm = document.getElementById("passwordForm");
const passwordInput = document.getElementById("passwordInput");
const modalTitle = document.getElementById("modalTitle");
const modalDescription = document.getElementById("modalDescription");
const modalBadge = document.getElementById("modalBadge");
const modalError = document.getElementById("modalError");
const cancelPasswordButton = document.getElementById("cancelPasswordButton");
const togglePasswordButton = document.getElementById("togglePasswordButton");
const toast = document.getElementById("toast");
const titleField = document.getElementById("titleField");
const titleInput = document.getElementById("titleInput");
const featuredTitle = document.getElementById("featuredTitle");
const featuredGrid = document.getElementById("featuredGrid");
const featuredEmpty = document.getElementById("featuredEmpty");
const featuredDate = document.getElementById("featuredDate");
const toolbarUploadButton = document.getElementById("toolbarUploadButton");
const scrollGalleryButton = document.getElementById("scrollGalleryButton");
const openPasswordVaultButton = document.getElementById("openPasswordVaultButton");
const passwordVault = document.getElementById("passwordVault");
const closePasswordVaultButton = document.getElementById("closePasswordVaultButton");
const previewModal = document.getElementById("previewModal");
const previewImage = document.getElementById("previewImage");
const previewTitle = document.getElementById("previewTitle");
const closePreviewButton = document.getElementById("closePreviewButton");

const vaultUpload = document.getElementById("vaultUpload");
const vaultDelete = document.getElementById("vaultDelete");
const vaultPin = document.getElementById("vaultPin");
const vaultVault = document.getElementById("vaultVault");

let photos = [];
let activeKeyword = "";
let activePasswordAction = null;
let toastTimeoutId = null;

let pendingUpload = null; // {title, password}

function formatDate(dateString) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(dateString));
}

function showToast(message) {
  window.clearTimeout(toastTimeoutId);
  toast.textContent = message;
  toast.classList.remove("hidden");
  toastTimeoutId = window.setTimeout(() => toast.classList.add("hidden"), 2600);
}

function openPasswordModal(config) {
  activePasswordAction = config;
  passwordForm.reset();
  passwordInput.type = "password";
  togglePasswordButton.textContent = "Tampilkan";

  modalTitle.textContent = config.title;
  modalDescription.textContent = config.description;
  modalBadge.textContent = config.badge;
  modalError.textContent = "";
  modalError.classList.add("hidden");

  titleField.classList.toggle("hidden", !config.withTitle);
  titleInput.required = Boolean(config.withTitle);
  titleInput.value = config.withTitle ? (config.initialTitle || "") : "";

  passwordModal.classList.remove("hidden");
  passwordModal.setAttribute("aria-hidden", "false");

  window.setTimeout(() => {
    if (config.withTitle) titleInput.focus();
    else passwordInput.focus();
  }, 30);
}

function closePasswordModal() {
  passwordModal.classList.add("hidden");
  passwordModal.setAttribute("aria-hidden", "true");
  modalError.textContent = "";
  modalError.classList.add("hidden");
  titleInput.value = "";
  titleInput.required = false;
  titleField.classList.add("hidden");
  activePasswordAction = null;
}

function showModalError(message) {
  modalError.textContent = message;
  modalError.classList.remove("hidden");
}

function openVault() {
  passwordVault.classList.remove("hidden");
  passwordVault.setAttribute("aria-hidden", "false");
}

function closeVault() {
  passwordVault.classList.add("hidden");
  passwordVault.setAttribute("aria-hidden", "true");
}

function openPreview(photo) {
  previewTitle.textContent = photo.title;
  previewImage.src = photo.url;
  previewImage.alt = photo.title;
  previewModal.classList.remove("hidden");
  previewModal.setAttribute("aria-hidden", "false");
}

function closePreview() {
  previewModal.classList.add("hidden");
  previewModal.setAttribute("aria-hidden", "true");
  previewImage.removeAttribute("src");
  previewImage.alt = "";
}

async function apiJson(url, options = {}) {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = data?.error || "Terjadi kesalahan.";
    throw new Error(message);
  }
  return data;
}

async function loadPhotosFromServer() {
  const data = await apiJson("/api/photos");
  photos = Array.isArray(data.photos) ? data.photos : [];
  renderGallery();
}

function renderFeatured() {
  const pinnedPhotos = photos.filter((p) => p.pinned);
  featuredGrid.innerHTML = "";

  if (!pinnedPhotos.length) {
    featuredTitle.textContent = "Galeri sematan Anda";
    featuredDate.textContent = "Belum ada foto yang disematkan.";
    featuredGrid.classList.add("hidden");
    featuredEmpty.classList.remove("hidden");
    return;
  }

  pinnedPhotos.forEach((photo) => {
    const item = document.createElement("div");
    item.className = "featured-item";

    const media = document.createElement("div");
    media.className = "featured-media";
    const image = document.createElement("img");
    image.className = "featured-image";
    image.src = photo.url;
    image.alt = photo.title;
    image.addEventListener("click", () => openPreview(photo));

    media.appendChild(image);

    const meta = document.createElement("div");
    meta.className = "featured-meta";

    const title = document.createElement("h4");
    title.className = "featured-photo-title";
    title.textContent = photo.title;

    const actions = document.createElement("div");
    actions.className = "featured-actions";

    const previewButton = document.createElement("button");
    previewButton.type = "button";
    previewButton.className = "preview-button";
    previewButton.textContent = "Preview";
    previewButton.addEventListener("click", () => openPreview(photo));

    const downloadButton = document.createElement("button");
    downloadButton.type = "button";
    downloadButton.className = "download-button";
    downloadButton.textContent = "Download";
    downloadButton.addEventListener("click", () => handleDownload(photo));

    const unpinButton = document.createElement("button");
    unpinButton.type = "button";
    unpinButton.className = "unpin-button";
    unpinButton.textContent = "Unsematkan";
    unpinButton.addEventListener("click", () => handleUnpin(photo.id, photo.title));

    actions.append(previewButton, downloadButton, unpinButton);
    meta.append(title, actions);
    item.append(media, meta);
    featuredGrid.appendChild(item);
  });

  featuredTitle.textContent = `${pinnedPhotos.length} foto disematkan`;
  featuredDate.textContent = "Semua foto yang Anda sematkan akan tampil di sini.";
  featuredGrid.classList.remove("hidden");
  featuredEmpty.classList.add("hidden");
}

function renderGallery() {
  galleryGrid.innerHTML = "";

  const keyword = activeKeyword.trim().toLowerCase();
  const filtered = photos.filter((photo) =>
    String(photo.title || "").toLowerCase().includes(keyword)
  );

  filtered.forEach((photo) => {
    const card = photoCardTemplate.content.firstElementChild.cloneNode(true);
    const image = card.querySelector(".photo-image");
    const title = card.querySelector(".photo-title");
    const date = card.querySelector(".photo-date");
    const deleteButton = card.querySelector(".delete-button");
    const pinButton = card.querySelector(".pin-button");
    const downloadButton = card.querySelector(".download-button");
    const previewButton = card.querySelector(".preview-button");

    image.src = photo.url;
    image.alt = photo.title;
    title.textContent = photo.title;
    date.textContent = `Ditambahkan ${formatDate(photo.createdAt)}`;
    pinButton.textContent = photo.pinned ? "Unsematkan" : "Sematkan";
    image.addEventListener("click", () => openPreview(photo));

    deleteButton.addEventListener("click", () => handleDelete(photo.id, photo.title));
    pinButton.addEventListener("click", () => {
      if (photo.pinned) {
        handleUnpin(photo.id, photo.title);
      } else {
        handlePin(photo.id, photo.title);
      }
    });
    downloadButton.addEventListener("click", () => handleDownload(photo));
    previewButton.addEventListener("click", () => openPreview(photo));

    galleryGrid.appendChild(card);
  });

  emptyState.classList.toggle("hidden", filtered.length > 0);
  galleryGrid.classList.toggle("hidden", filtered.length === 0);
  photoCount.textContent = String(photos.length);
  pinnedCount.textContent = String(photos.filter((p) => p.pinned).length);
  renderFeatured();
}

function getDownloadFileName(photo) {
  const mimeType = photo.mimeType || "";
  if (mimeType.includes("png")) return "imageeleven.png";
  if (mimeType.includes("jpeg") || mimeType.includes("jpg")) return "imageleven.jpg";
  if (mimeType.includes("gif")) return "imageeleven.gif";
  if (mimeType.includes("webp")) return "imageeleven.webp";
  return "imageeleven.jpg";
}

function handleDownload(photo) {
  const link = document.createElement("a");
  link.href = photo.url;
  link.download = getDownloadFileName(photo);
  document.body.appendChild(link);
  link.click();
  link.remove();
  showToast(`Foto "${photo.title}" sedang diunduh.`);
}

function openUploadFlow() {
  openPasswordModal({
    badge: "Upload Security",
    title: "Upload Foto",
    description: "Masukkan judul foto dan password upload, lalu pilih file gambar.",
    withTitle: true,
    onSuccess: ({ title, password }) => {
      pendingUpload = { title, password };
      fileInput.click();
    },
  });
}

async function handleFileSelected(event) {
  const file = (event.target.files || [])[0];
  if (!file) return;

  if (!pendingUpload?.title || !pendingUpload?.password) {
    fileInput.value = "";
    showToast("Silakan klik Upload Baru dan isi judul + password terlebih dahulu.");
    return;
  }

  try {
    const form = new FormData();
    form.append("file", file);
    form.append("title", pendingUpload.title);
    form.append("password", pendingUpload.password);

    const res = await fetch("/api/upload", { method: "POST", body: form });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.error || "Gagal upload foto.");

    showToast(`Foto "${data.photo.title}" berhasil diupload.`);
    await loadPhotosFromServer();
  } catch (e) {
    showToast(String(e.message || e));
  } finally {
    pendingUpload = null;
    fileInput.value = "";
  }
}

function handleDelete(id, title) {
  openPasswordModal({
    badge: "Delete Security",
    title: "Hapus Foto",
    description: `Masukkan password hapus untuk menghapus foto "${title}".`,
    onSuccess: async ({ password }) => {
      try {
        await apiJson(`/api/photos/${encodeURIComponent(id)}`, {
          method: "DELETE",
          body: JSON.stringify({ password }),
        });
        showToast("Foto berhasil dihapus.");
        await loadPhotosFromServer();
      } catch (e) {
        showToast(String(e.message || e));
      }
    },
  });
}

function handlePin(id, title) {
  openPasswordModal({
    badge: "Pin Security",
    title: "Sematkan Foto",
    description: `Masukkan password sematkan untuk menyematkan foto "${title}".`,
    onSuccess: async ({ password }) => {
      try {
        await apiJson(`/api/pin/${encodeURIComponent(id)}`, {
          method: "POST",
          body: JSON.stringify({ password }),
        });
        showToast("Foto berhasil disematkan.");
        await loadPhotosFromServer();
      } catch (e) {
        showToast(String(e.message || e));
      }
    },
  });
}

function handleUnpin(id, title) {
  openPasswordModal({
    badge: "Pin Security",
    title: "Lepas Sematan Foto",
    description: `Masukkan password sematkan untuk melepas sematan foto "${title}".`,
    onSuccess: async ({ password }) => {
      try {
        await apiJson(`/api/unpin/${encodeURIComponent(id)}`, {
          method: "POST",
          body: JSON.stringify({ password }),
        });
        showToast("Sematan foto berhasil dilepas.");
        await loadPhotosFromServer();
      } catch (e) {
        showToast(String(e.message || e));
      }
    },
  });
}

function openPasswordVault() {
  openPasswordModal({
    badge: "Vault Security",
    title: "Buka Daftar Password",
    description: "Masukkan password utama untuk melihat semua password fitur website ini.",
    onSuccess: async ({ password }) => {
      try {
        const data = await apiJson("/api/vault", {
          method: "POST",
          body: JSON.stringify({ password }),
        });
        vaultUpload.textContent = data.passwords.upload;
        vaultDelete.textContent = data.passwords.delete;
        vaultPin.textContent = data.passwords.pin;
        vaultVault.textContent = data.passwords.vault;
        openVault();
      } catch (e) {
        showToast(String(e.message || e));
      }
    },
  });
}

passwordForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!activePasswordAction) return closePasswordModal();

  const typedTitle = titleInput.value.trim();
  const typedPassword = passwordInput.value;

  if (activePasswordAction.withTitle && !typedTitle) {
    showModalError("Judul foto wajib diisi terlebih dahulu.");
    titleInput.focus();
    return;
  }

  const currentAction = activePasswordAction;
  closePasswordModal();
  currentAction.onSuccess({
    title: typedTitle,
    password: typedPassword,
  });
});

cancelPasswordButton.addEventListener("click", closePasswordModal);

togglePasswordButton.addEventListener("click", () => {
  const nextType = passwordInput.type === "password" ? "text" : "password";
  passwordInput.type = nextType;
  togglePasswordButton.textContent = nextType === "password" ? "Tampilkan" : "Sembunyikan";
  passwordInput.focus();
});

passwordModal.addEventListener("click", (event) => {
  if (event.target === passwordModal) closePasswordModal();
});

passwordVault.addEventListener("click", (event) => {
  if (event.target === passwordVault) closeVault();
});

previewModal.addEventListener("click", (event) => {
  if (event.target === previewModal) closePreview();
});

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !passwordModal.classList.contains("hidden")) closePasswordModal();
  if (event.key === "Escape" && !passwordVault.classList.contains("hidden")) closeVault();
  if (event.key === "Escape" && !previewModal.classList.contains("hidden")) closePreview();
});

searchInput.addEventListener("input", (event) => {
  activeKeyword = event.target.value;
  renderGallery();
});

if (scrollGalleryButton) {
  scrollGalleryButton.addEventListener("click", () => {
    gallerySection.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

toolbarUploadButton.addEventListener("click", openUploadFlow);
fileInput.addEventListener("change", handleFileSelected);

openPasswordVaultButton.addEventListener("click", openPasswordVault);
closePasswordVaultButton.addEventListener("click", closeVault);
closePreviewButton.addEventListener("click", closePreview);

loadPhotosFromServer().catch((e) => {
  console.error(e);
  showToast("Gagal memuat data dari server.");
});
