const STORAGE_KEY = "elevenimage-gallery-items";
const UPLOAD_PASSWORD = "elevenimage";
const DELETE_PASSWORD = "delsyah";
const PIN_PASSWORD = "sematelv";
const VAULT_PASSWORD = "syahril1212";

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
const openPasswordVaultButton = document.getElementById("openPasswordVaultButton");
const passwordVault = document.getElementById("passwordVault");
const closePasswordVaultButton = document.getElementById("closePasswordVaultButton");

const toolbarUploadButton = document.getElementById("toolbarUploadButton");

const scrollGalleryButton = document.getElementById("scrollGalleryButton");

let photos = loadPhotos();
let activeKeyword = "";
let activePasswordAction = null;
let toastTimeoutId = null;
let pendingUploadData = null;

function loadPhotos() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    const normalized = Array.isArray(parsed) ? parsed : [];

    return normalized.map((photo) => ({
        ...photo,
        title: typeof photo.title === "string" ? photo.title.trim() : "",
        pinned: Boolean(photo.pinned),
      }));
  } catch (error) {
    console.error("Gagal membaca data galeri:", error);
    return [];
  }
}

function savePhotos() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(photos));
}

function formatDate(dateString) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(dateString));
}

function renderGallery() {
  galleryGrid.innerHTML = "";

  const keyword = activeKeyword.trim().toLowerCase();
  const filteredPhotos = photos.filter((photo) => {
    const title = typeof photo.title === "string" ? photo.title : "";
    return title.toLowerCase().includes(keyword);
  });

  filteredPhotos.forEach((photo) => {
    const card = photoCardTemplate.content.firstElementChild.cloneNode(true);
    const image = card.querySelector(".photo-image");
    const title = card.querySelector(".photo-title");
    const date = card.querySelector(".photo-date");
    const deleteButton = card.querySelector(".delete-button");
    const pinButton = card.querySelector(".pin-button");
    const downloadButton = card.querySelector(".download-button");

    image.src = photo.dataUrl;
    image.alt = photo.title;
    title.textContent = photo.title;
    date.textContent = `Ditambahkan ${formatDate(photo.createdAt)}`;
    pinButton.textContent = photo.pinned ? "Tersemat" : "Sematkan";

    deleteButton.addEventListener("click", () => handleDelete(photo.id));
    pinButton.addEventListener("click", () => handlePin(photo.id));
    downloadButton.addEventListener("click", () => handleDownload(photo.id));

    galleryGrid.appendChild(card);
  });

  emptyState.classList.toggle("hidden", filteredPhotos.length > 0);
  galleryGrid.classList.toggle("hidden", filteredPhotos.length === 0);
  photoCount.textContent = String(photos.length);
  pinnedCount.textContent = String(photos.filter((photo) => photo.pinned).length);
  renderFeaturedPhoto();
}

function renderFeaturedPhoto() {
  const pinnedPhotos = photos.filter((photo) => photo.pinned);
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

    const image = document.createElement("img");
    image.className = "featured-image";
    image.src = photo.dataUrl;
    image.alt = photo.title;

    item.appendChild(image);
    featuredGrid.appendChild(item);
  });

  featuredTitle.textContent = `${pinnedPhotos.length} foto disematkan`;
  featuredDate.textContent = "Semua foto yang Anda sematkan akan tampil di sini.";
  featuredGrid.classList.remove("hidden");
  featuredEmpty.classList.add("hidden");
}

function showToast(message) {
  window.clearTimeout(toastTimeoutId);
  toast.textContent = message;
  toast.classList.remove("hidden");

  toastTimeoutId = window.setTimeout(() => {
    toast.classList.add("hidden");
  }, 2600);
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

  if (config.withTitle) {
    titleInput.value = config.initialTitle || "";
  } else {
    titleInput.value = "";
  }

  passwordModal.classList.remove("hidden");
  passwordModal.setAttribute("aria-hidden", "false");
  window.setTimeout(() => {
    if (config.withTitle) {
      titleInput.focus();
    } else {
      passwordInput.focus();
    }
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

function openPasswordVault() {
  passwordVault.classList.remove("hidden");
  passwordVault.setAttribute("aria-hidden", "false");
}

function closePasswordVault() {
  passwordVault.classList.add("hidden");
  passwordVault.setAttribute("aria-hidden", "true");
}

function showModalError(message) {
  modalError.textContent = message;
  modalError.classList.remove("hidden");
}

function generatePhotoId() {
  if (window.crypto && typeof window.crypto.randomUUID === "function") {
    return window.crypto.randomUUID();
  }

  return `photo-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error(`Gagal membaca file ${file.name}`));
    reader.readAsDataURL(file);
  });
}

async function handleFilesSelected(event) {
  const selectedFiles = Array.from(event.target.files || []);

  if (!selectedFiles.length) {
    pendingUploadData = null;
    return;
  }

  const validImages = selectedFiles.filter((file) => file.type.startsWith("image/"));

  if (!validImages.length) {
    showToast("File yang dipilih bukan gambar.");
    fileInput.value = "";
    pendingUploadData = null;
    return;
  }

  try {
    const [selectedImage] = validImages;
    const createdPhoto = {
      id: generatePhotoId(),
      title: pendingUploadData?.title || "",
      createdAt: new Date().toISOString(),
      dataUrl: await readFileAsDataUrl(selectedImage),
      mimeType: selectedImage.type,
      pinned: false,
    };

    photos = [createdPhoto, ...photos];
    savePhotos();
    renderGallery();
    showToast(`Foto "${createdPhoto.title}" berhasil ditambahkan ke galeri.`);
  } catch (error) {
    console.error(error);
    showToast(
      "Terjadi masalah saat menyimpan foto. Coba upload ulang file gambarnya."
    );
  } finally {
    fileInput.value = "";
    pendingUploadData = null;
  }
}

function openFilePicker() {
  openPasswordModal({
    badge: "Upload Security",
    title: "Password Upload Foto",
    description: "Masukkan judul foto dan password upload untuk membuka pilihan file gambar.",
    password: UPLOAD_PASSWORD,
    withTitle: true,
    onSuccess: ({ title }) => {
      pendingUploadData = {
        title,
      };
      fileInput.click();
    },
  });
}

function handleDelete(photoId) {
  const targetPhoto = photos.find((photo) => photo.id === photoId);

  if (!targetPhoto) {
    showToast("Foto tidak ditemukan.");
    return;
  }

  openPasswordModal({
    badge: "Delete Security",
    title: "Password Hapus Foto",
    description: `Masukkan password hapus untuk menghapus foto "${targetPhoto.title}".`,
    password: DELETE_PASSWORD,
    onSuccess: () => {
      photos = photos.filter((photo) => photo.id !== photoId);
      savePhotos();
      renderGallery();
      showToast("Foto berhasil dihapus.");
    },
  });
}

function handlePin(photoId) {
  const targetPhoto = photos.find((photo) => photo.id === photoId);

  if (!targetPhoto) {
    showToast("Foto tidak ditemukan.");
    return;
  }

  openPasswordModal({
    badge: "Pin Security",
    title: "Password Sematkan Foto",
    description: `Masukkan password sematkan untuk menjadikan "${targetPhoto.title}" sebagai foto utama.`,
    password: PIN_PASSWORD,
    onSuccess: () => {
      photos = photos.map((photo) =>
        photo.id === photoId
          ? {
              ...photo,
              pinned: true,
            }
          : photo
      );
      savePhotos();
      renderGallery();
      showToast(`Foto "${targetPhoto.title}" berhasil disematkan.`);
    },
  });
}

function getDownloadFileName(photo) {
  const mimeType = photo.mimeType || "";

  if (mimeType.includes("png")) {
    return "imageeleven.png";
  }

  if (mimeType.includes("jpeg") || mimeType.includes("jpg")) {
    return "imageleven.jpg";
  }

  if (mimeType.includes("gif")) {
    return "imageeleven.gif";
  }

  if (mimeType.includes("webp")) {
    return "imageeleven.webp";
  }

  return "imageeleven.jpg";
}

function handleDownload(photoId) {
  const targetPhoto = photos.find((photo) => photo.id === photoId);

  if (!targetPhoto) {
    showToast("Foto tidak ditemukan.");
    return;
  }

  const link = document.createElement("a");
  link.href = targetPhoto.dataUrl;
  link.download = getDownloadFileName(targetPhoto);
  document.body.appendChild(link);
  link.click();
  link.remove();
  showToast(`Foto "${targetPhoto.title}" sedang diunduh.`);
}

function handleOpenPasswordVault() {
  openPasswordModal({
    badge: "Vault Security",
    title: "Buka Daftar Password",
    description: "Masukkan password utama untuk melihat semua password fitur website ini.",
    password: VAULT_PASSWORD,
    onSuccess: () => {
      openPasswordVault();
    },
  });
}

window.openUploadProtected = openFilePicker;
window.openPasswordVaultProtected = handleOpenPasswordVault;

if (toolbarUploadButton) {
  toolbarUploadButton.addEventListener("click", openFilePicker);
}

if (openPasswordVaultButton) {
  openPasswordVaultButton.addEventListener("click", handleOpenPasswordVault);
}

if (closePasswordVaultButton) {
  closePasswordVaultButton.addEventListener("click", closePasswordVault);
}

fileInput.addEventListener("change", handleFilesSelected);

passwordForm.addEventListener("submit", (event) => {
  event.preventDefault();

  if (!activePasswordAction) {
    closePasswordModal();
    return;
  }

  const typedPassword = passwordInput.value;
  const typedTitle = titleInput.value.trim();

  if (activePasswordAction.withTitle && !typedTitle) {
    showModalError("Judul foto wajib diisi terlebih dahulu.");
    titleInput.focus();
    return;
  }

  if (typedPassword !== activePasswordAction.password) {
    showModalError("Password yang Anda masukkan masih salah.");
    passwordInput.focus();
    passwordInput.select();
    return;
  }

  const currentAction = activePasswordAction;
  const formValues = {
    title: typedTitle,
    password: typedPassword,
  };
  closePasswordModal();
  currentAction.onSuccess(formValues);
});

cancelPasswordButton.addEventListener("click", closePasswordModal);

togglePasswordButton.addEventListener("click", () => {
  const nextType = passwordInput.type === "password" ? "text" : "password";
  passwordInput.type = nextType;
  togglePasswordButton.textContent =
    nextType === "password" ? "Tampilkan" : "Sembunyikan";
  passwordInput.focus();
});

passwordModal.addEventListener("click", (event) => {
  if (event.target === passwordModal) {
    closePasswordModal();
  }
});

passwordVault.addEventListener("click", (event) => {
  if (event.target === passwordVault) {
    closePasswordVault();
  }
});

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !passwordModal.classList.contains("hidden")) {
    closePasswordModal();
  }

  if (event.key === "Escape" && !passwordVault.classList.contains("hidden")) {
    closePasswordVault();
  }
});

searchInput.addEventListener("input", (event) => {
  activeKeyword = event.target.value.trim();
  renderGallery();
});

if (scrollGalleryButton) {
  scrollGalleryButton.addEventListener("click", () => {
    gallerySection.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

renderGallery();