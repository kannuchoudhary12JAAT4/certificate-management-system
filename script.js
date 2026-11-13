"use strict";

// ==========================================
// 1. DEMO CREDENTIALS
// ==========================================
const AUTH_USER = "Choudhary";
const AUTH_PASS = "jaat";

// ==========================================
// 2. STATE MANAGEMENT & LOCALSTORAGE
// ==========================================
function loadCertificates() {
  try {
    const data = JSON.parse(localStorage.getItem("certificates") || "[]");
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

let certificates = loadCertificates();

// Migrate data safely if fields are missing
certificates.forEach((cert) => {
  if (!cert.certificateId) cert.certificateId = cert.id;
  if (!cert.status) cert.status = "Valid";
});

try {
  localStorage.setItem("certificates", JSON.stringify(certificates));
} catch (error) {
  console.warn("Storage sync error:", error);
}

// ==========================================
// 3. DOM ELEMENT REFERENCES
// ==========================================
const loginContainer = document.getElementById("login-container");
const appContainer = document.getElementById("app-container");
const loginForm = document.getElementById("login-form");
const loginError = document.getElementById("login-error");
const logoutBtn = document.getElementById("logout-btn");
const themeToggle = document.getElementById("theme-toggle");

const uploadForm = document.getElementById("upload-form");
const uploadMessage = document.getElementById("upload-message");
const searchInput = document.getElementById("search-input");
const filterCategory = document.getElementById("filter-category");
const certGrid = document.getElementById("cert-grid");

const verifyForm = document.getElementById("verify-form");
const verifyInput = document.getElementById("verify-cert-id");
const verifyResult = document.getElementById("verify-result");

// ==========================================
// 4. AUTHENTICATION & FLOW
// ==========================================
// Login is shown first by default. App container starts hidden.
loginForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value;

  if (username === AUTH_USER && password === AUTH_PASS) {
    loginContainer.classList.add("hidden");
    appContainer.classList.remove("hidden");
    logoutBtn.classList.remove("hidden");
    loginError.textContent = "";
    renderCertificates();
  } else {
    loginError.textContent = "Invalid username or password!";
  }
});

logoutBtn.addEventListener("click", () => {
  appContainer.classList.add("hidden");
  logoutBtn.classList.add("hidden");
  loginContainer.classList.remove("hidden");
  loginForm.reset();
  loginError.textContent = "";
});

// ==========================================
// 5. THEME TOGGLE
// ==========================================
themeToggle.addEventListener("click", () => {
  const isLight = document.body.getAttribute("data-theme") === "light";
  if (isLight) {
    document.body.removeAttribute("data-theme");
    themeToggle.textContent = "☀️ Light Mode";
  } else {
    document.body.setAttribute("data-theme", "light");
    themeToggle.textContent = "🌙 Dark Mode";
  }
});

themeToggle.textContent = "☀️ Light Mode";

// ==========================================
// 6. STORAGE UTILITIES
// ==========================================
function saveAndRender() {
  localStorage.setItem("certificates", JSON.stringify(certificates));
  renderCertificates();
}

function generateCertificateId() {
  let id;
  do {
    const randomPart = Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 6).toUpperCase();
    id = "CERT-" + randomPart;
  } while (certificates.some(cert => cert.certificateId === id));
  return id;
}

// ==========================================
// 7. CERTIFICATE UPLOAD
// ==========================================
if (uploadForm) {
  uploadForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const title = document.getElementById("cert-title").value.trim();
    const recipient = document.getElementById("recipient").value.trim();
    const category = document.getElementById("category").value;
    const issueDate = document.getElementById("issue-date").value;
    const fileInput = document.getElementById("pdf-file");
    const file = fileInput.files[0];

    uploadMessage.textContent = "";

    if (!title || !recipient || !issueDate || !file) {
      uploadMessage.textContent = "Please complete all fields.";
      uploadMessage.className = "verify-failure";
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      uploadMessage.textContent = "File size must be under 2MB for demo storage.";
      uploadMessage.className = "verify-failure";
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const newCert = {
        id: generateCertificateId(),
        certificateId: "",
        title,
        recipient,
        category,
        issueDate,
        pdfData: e.target.result,
        status: "Valid"
      };
      newCert.certificateId = newCert.id;

      certificates.push(newCert);
      try {
        saveAndRender();
        uploadForm.reset();
        uploadMessage.textContent = `Success! ID: ${newCert.certificateId}`;
        uploadMessage.className = "verify-success";
      } catch (err) {
        certificates.pop();
        uploadMessage.textContent = "Storage limit reached. Clear space and try again.";
        uploadMessage.className = "verify-failure";
      }
    };
    reader.readAsDataURL(file);
  });
}

// ==========================================
// 8. RENDER CERTIFICATES DASHBOARD
// ==========================================
function renderCertificates() {
  if (!certGrid) return;
  certGrid.replaceChildren();

  const query = searchInput.value.trim().toLowerCase();
  const category = filterCategory.value;

  const filtered = certificates.filter((cert) => {
    const matchesSearch =
      (cert.title || "").toLowerCase().includes(query) ||
      (cert.recipient || "").toLowerCase().includes(query) ||
      (cert.certificateId || "").toLowerCase().includes(query);
    const matchesCategory = category === "All" || cert.category === category;
    return matchesSearch && matchesCategory;
  });

  if (filtered.length === 0) {
    const empty = document.createElement("p");
    empty.textContent = "No certificates found.";
    empty.style.color = "var(--text-muted)";
    certGrid.appendChild(empty);
    return;
  }

  filtered.forEach((cert) => {
    const card = document.createElement("article");
    card.className = "cert-card";

    const details = document.createElement("div");

    const badge = document.createElement("span");
    badge.className = "badge";
    badge.textContent = cert.category || "General";

    const heading = document.createElement("h3");
    heading.textContent = cert.title;

    const recipient = document.createElement("p");
    recipient.textContent = `Recipient: ${cert.recipient}`;

    const date = document.createElement("p");
    date.textContent = `Issued: ${cert.issueDate}`;

    const id = document.createElement("p");
    id.textContent = `ID: ${cert.certificateId}`;

    details.append(badge, heading, recipient, date, id);

    const actions = document.createElement("div");
    actions.className = "cert-actions";

    const viewBtn = document.createElement("button");
    viewBtn.className = "btn btn-primary";
    viewBtn.textContent = "View PDF";
    viewBtn.type = "button";
    viewBtn.addEventListener("click", () => window.openPdf(cert.id));

    const copyBtn = document.createElement("button");
    copyBtn.className = "btn btn-alt";
    copyBtn.textContent = "Copy ID";
    copyBtn.type = "button";
    copyBtn.addEventListener("click", async () => {
      await navigator.clipboard.writeText(cert.certificateId);
      copyBtn.textContent = "Copied!";
      setTimeout(() => (copyBtn.textContent = "Copy ID"), 2000);
    });

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "btn btn-danger";
    deleteBtn.textContent = "Delete";
    deleteBtn.type = "button";
    deleteBtn.addEventListener("click", () => deleteCertificate(cert.id));

    actions.append(viewBtn, copyBtn, deleteBtn);
    card.append(details, actions);
    certGrid.appendChild(card);
  });
}

// ==========================================
// 9. VERIFICATION LOGIC
// ==========================================
verifyForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const enteredId = verifyInput.value.trim().toUpperCase();
  verifyResult.replaceChildren();

  if (!enteredId) {
    showVerificationResult("INVALID INPUT", "Please enter a valid Certificate ID.", false);
    return;
  }

  const cert = certificates.find((item) => String(item.certificateId).toUpperCase() === enteredId);

  if (!cert) {
    showVerificationResult("NOT FOUND", "No active certificate matches this unique ID.", false);
    return;
  }

  showVerificationResult("VERIFIED AUTHENTIC", "This certificate record is cryptographically valid.", true, cert);
});

function showVerificationResult(title, message, isValid, cert = null) {
  const box = document.createElement("div");
  box.className = isValid ? "verify-success" : "verify-failure";

  const heading = document.createElement("div");
  heading.className = "verify-result-title";
  heading.textContent = (isValid ? "✓ " : "✕ ") + title;

  const desc = document.createElement("p");
  desc.textContent = message;
  box.append(heading, desc);

  if (cert) {
    const details = document.createElement("div");
    details.className = "verify-details";
    const fields = [
      ["ID", cert.certificateId],
      ["Title", cert.title],
      ["Recipient", cert.recipient],
      ["Category", cert.category],
      ["Date", cert.issueDate]
    ];
    fields.forEach(([label, val]) => {
      const p = document.createElement("p");
      p.innerHTML = `<strong>${label}:</strong> ${val}`;
      details.appendChild(p);
    });
    box.appendChild(details);
  }
  verifyResult.appendChild(box);
}

// ==========================================
// 10. PDF VIEWER & DELETE HELPERS
// ==========================================
window.openPdf = function (id) {
  const cert = certificates.find((item) => String(item.id) === String(id));
  if (!cert || !cert.pdfData) {
    alert("Associated PDF file not found.");
    return;
  }
  try {
    const parts = cert.pdfData.split(",");
    const binary = atob(parts[1]);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const blob = new Blob([bytes], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
  } catch (err) {
    alert("Error rendering PDF stream.");
  }
};

function deleteCertificate(id) {
  if (!confirm("Are you sure you want to delete this certificate record?")) return;
  certificates = certificates.filter((item) => String(item.id) !== String(id));
  saveAndRender();
}

if (searchInput) searchInput.addEventListener("input", renderCertificates);
if (filterCategory) filterCategory.addEventListener("change", renderCertificates);