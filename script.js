"use strict";

/* ================= LOGIN DETAILS ================= */

const AUTH_USER = "Choudhary";
const AUTH_PASS = "jaat";

/* ================= STORAGE ================= */

const STORAGE_KEY = "certificates";

let certificates = [];

try {
  const savedData = localStorage.getItem(STORAGE_KEY);
  certificates = savedData ? JSON.parse(savedData) : [];

  if (!Array.isArray(certificates)) {
    certificates = [];
  }
} catch (error) {
  console.error("Unable to load certificates:", error);
  certificates = [];
}

// Support older saved certificate records
certificates = certificates.map(cert => ({
  ...cert,
  certificateId: cert.certificateId || cert.id || generateCertificateId(),
  status: cert.status || "Valid"
}));

/* ================= DOM ELEMENTS ================= */

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

/* ================= SAVE DATA ================= */

function saveAndRender() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(certificates));
    renderCertificates();
    return true;
  } catch (error) {
    console.error("Storage error:", error);
    alert("Unable to save certificate. Browser storage may be full.");
    return false;
  }
}

/* ================= CERTIFICATE ID ================= */

function generateCertificateId() {
  let id;

  do {
    const randomPart = Math.random().toString(36).substring(2, 11).toUpperCase();
    id = "CERT-" + randomPart;
  } while (
    certificates.some(cert => cert.certificateId === id)
  );

  return id;
}

/* ================= LOGIN ================= */

loginForm.addEventListener("submit", function (event) {
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

/* ================= LOGOUT ================= */

logoutBtn.addEventListener("click", function () {
  loginContainer.classList.remove("hidden");
  appContainer.classList.add("hidden");
  logoutBtn.classList.add("hidden");

  loginForm.reset();
  loginError.textContent = "";
});

/* ================= DARK / LIGHT MODE ================= */

function updateThemeButton() {
  const currentTheme = document.body.getAttribute("data-theme");

  themeToggle.textContent =
    currentTheme === "light"
      ? "🌙 Dark Mode"
      : "☀️ Light Mode";
}

const savedTheme = localStorage.getItem("portal-theme");

if (savedTheme === "light") {
  document.body.setAttribute("data-theme", "light");
}

updateThemeButton();

themeToggle.addEventListener("click", function () {
  const currentTheme = document.body.getAttribute("data-theme");

  if (currentTheme === "light") {
    document.body.removeAttribute("data-theme");
    localStorage.setItem("portal-theme", "dark");
  } else {
    document.body.setAttribute("data-theme", "light");
    localStorage.setItem("portal-theme", "light");
  }

  updateThemeButton();
});

/* ================= UPLOAD CERTIFICATE ================= */

uploadForm.addEventListener("submit", function (event) {
  event.preventDefault();

  const title = document.getElementById("cert-title").value.trim();
  const recipient = document.getElementById("recipient").value.trim();
  const category = document.getElementById("category").value;
  const issueDate = document.getElementById("issue-date").value;

  const fileInput = document.getElementById("pdf-file");
  const file = fileInput.files[0];

  uploadMessage.textContent = "";

  if (!file) {
    uploadMessage.textContent = "Please select a PDF file.";
    return;
  }

  if (file.type !== "application/pdf" &&
      !file.name.toLowerCase().endsWith(".pdf")) {
    uploadMessage.textContent = "Only PDF files are allowed.";
    return;
  }

  if (file.size > 2 * 1024 * 1024) {
    uploadMessage.textContent = "PDF size must be less than 2MB.";
    return;
  }

  if (!title || !recipient || !issueDate) {
    uploadMessage.textContent = "Please fill all required fields.";
    return;
  }

  const reader = new FileReader();

  reader.onload = function () {
    const newCertificate = {
      id: Date.now().toString(),
      certificateId: generateCertificateId(),
      title: title,
      recipient: recipient,
      category: category,
      issueDate: issueDate,
      pdfData: reader.result,
      status: "Valid"
    };

    certificates.push(newCertificate);

    if (saveAndRender()) {
      uploadForm.reset();
      uploadMessage.textContent =
        "Certificate published successfully! ID: " +
        newCertificate.certificateId;
    } else {
      certificates.pop();
    }
  };

  reader.onerror = function () {
    uploadMessage.textContent = "Error reading PDF file.";
  };

  reader.readAsDataURL(file);
});

/* ================= RENDER CERTIFICATES ================= */

function renderCertificates() {
  certGrid.replaceChildren();

  const searchText = searchInput.value.toLowerCase().trim();
  const selectedCategory = filterCategory.value;

  const filteredCertificates = certificates.filter(cert => {
    const matchesSearch =
      (cert.title || "").toLowerCase().includes(searchText) ||
      (cert.recipient || "").toLowerCase().includes(searchText) ||
      (cert.certificateId || "").toLowerCase().includes(searchText);

    const matchesCategory =
      selectedCategory === "All" ||
      cert.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  if (filteredCertificates.length === 0) {
    const message = document.createElement("p");
    message.textContent = "No certificates found.";
    certGrid.appendChild(message);
    return;
  }

  filteredCertificates.forEach(cert => {
    const card = document.createElement("div");
    card.className = "cert-card";

    // Category badge
    const badge = document.createElement("span");
    badge.className = "badge";
    badge.textContent = cert.category || "General";
    badge.title = "Double-click to change certificate status";

    badge.addEventListener("dblclick", function () {
      changeCertificateStatus(cert.id);
    });

    // Certificate title
    const title = document.createElement("h3");
    title.textContent = cert.title || "Untitled Certificate";
    title.title = "Double-click to edit certificate details";
    title.style.cursor = "pointer";

    title.addEventListener("dblclick", function () {
      editCertificate(cert.id);
    });

    // Recipient
    const recipient = document.createElement("p");
    recipient.textContent = "Recipient: " + (cert.recipient || "");

    // Issue date
    const date = document.createElement("p");
    date.textContent = "Issue Date: " + (cert.issueDate || "");

    // Certificate ID
    const certificateId = document.createElement("p");
    certificateId.textContent = "Certificate ID: " + cert.certificateId;

    // Action buttons
    const actions = document.createElement("div");
    actions.className = "cert-actions";

    const viewButton = document.createElement("button");
    viewButton.type = "button";
    viewButton.className = "btn btn-alt";
    viewButton.textContent = "View PDF";

    viewButton.addEventListener("click", function () {
      openPdf(cert.id);
    });

    const copyButton = document.createElement("button");
    copyButton.type = "button";
    copyButton.className = "btn btn-alt";
    copyButton.textContent = "Copy ID";

    copyButton.addEventListener("click", function () {
      copyCertificateId(cert.certificateId);
    });

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "btn btn-danger";
    deleteButton.textContent = "Delete";

    deleteButton.addEventListener("click", function () {
      deleteCertificate(cert.id);
    });

    actions.appendChild(viewButton);
    actions.appendChild(copyButton);
    actions.appendChild(deleteButton);

    card.appendChild(badge);
    card.appendChild(title);
    card.appendChild(recipient);
    card.appendChild(date);
    card.appendChild(certificateId);
    card.appendChild(actions);

    certGrid.appendChild(card);
  });
}

/* ================= EDIT CERTIFICATE ================= */

function editCertificate(id) {
  const cert = certificates.find(item => item.id === id);

  if (!cert) return;

  const newTitle = prompt("Enter certificate title:", cert.title);

  if (newTitle === null) return;

  if (!newTitle.trim()) {
    alert("Certificate title cannot be empty.");
    return;
  }

  const newRecipient = prompt(
    "Enter recipient name:",
    cert.recipient
  );

  if (newRecipient === null) return;

  if (!newRecipient.trim()) {
    alert("Recipient name cannot be empty.");
    return;
  }

  const newCategory = prompt(
    "Enter category:\nSoftware Development\nCloud Computing\nCybersecurity\nArtificial Intelligence\nGeneral",
    cert.category
  );

  if (newCategory === null) return;

  const allowedCategories = [
    "Software Development",
    "Cloud Computing",
    "Cybersecurity",
    "Artificial Intelligence",
    "General"
  ];

  if (!allowedCategories.includes(newCategory.trim())) {
    alert("Please enter a valid category.");
    return;
  }

  const newDate = prompt(
    "Enter issue date (YYYY-MM-DD):",
    cert.issueDate
  );

  if (newDate === null) return;

  cert.title = newTitle.trim();
  cert.recipient = newRecipient.trim();
  cert.category = newCategory.trim();
  cert.issueDate = newDate.trim();

  if (saveAndRender()) {
    alert("Certificate updated successfully!");
  }
}

/* ================= VALID / INVALID STATUS ================= */

function changeCertificateStatus(id) {
  const cert = certificates.find(item => item.id === id);

  if (!cert) return;

  const currentStatus = cert.status || "Valid";

  const newStatus = prompt(
    "Enter certificate status:\nType Valid or Invalid",
    currentStatus
  );

  if (newStatus === null) return;

  const status = newStatus.trim().toLowerCase();

  if (status !== "valid" && status !== "invalid") {
    alert("Please enter only Valid or Invalid.");
    return;
  }

  cert.status = status === "valid" ? "Valid" : "Invalid";

  if (saveAndRender()) {
    alert("Certificate status changed to " + cert.status);
  }
}

/* ================= VIEW PDF ================= */

function openPdf(id) {
  const cert = certificates.find(item => item.id === id);

  if (!cert || !cert.pdfData) {
    alert("PDF document not found.");
    return;
  }

  try {
    const parts = cert.pdfData.split(",");
    const mimeMatch = parts[0].match(/:(.*?);/);
    const mimeType = mimeMatch ? mimeMatch[1] : "application/pdf";

    const binary = atob(parts[1]);
    const bytes = new Uint8Array(binary.length);

    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    const blob = new Blob([bytes], { type: mimeType });
    const pdfUrl = URL.createObjectURL(blob);

    const newWindow = window.open(pdfUrl, "_blank");

    if (!newWindow) {
      alert("Please allow pop-ups to view the PDF.");
    }

    setTimeout(function () {
      URL.revokeObjectURL(pdfUrl);
    }, 60000);

  } catch (error) {
    console.error("PDF error:", error);
    alert("Unable to open PDF.");
  }
}

/* ================= COPY CERTIFICATE ID ================= */

async function copyCertificateId(id) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(id);
    } else {
      const tempInput = document.createElement("textarea");
      tempInput.value = id;
      tempInput.style.position = "fixed";
      tempInput.style.opacity = "0";

      document.body.appendChild(tempInput);
      tempInput.select();

      const copied = document.execCommand("copy");
      tempInput.remove();

      if (!copied) {
        throw new Error("Copy failed");
      }
    }

    alert("Certificate ID copied: " + id);

  } catch (error) {
    console.error("Copy error:", error);
    alert("Unable to copy certificate ID.");
  }
}

/* ================= DELETE CERTIFICATE ================= */

function deleteCertificate(id) {
  const confirmed = confirm(
    "Are you sure you want to delete this certificate?"
  );

  if (!confirmed) return;

  const oldCertificates = certificates;

  certificates = certificates.filter(cert => cert.id !== id);

  if (!saveAndRender()) {
    certificates = oldCertificates;
    renderCertificates();
    return;
  }

  alert("Certificate deleted successfully!");
}

/* ================= VERIFY CERTIFICATE ================= */

verifyForm.addEventListener("submit", function (event) {
  event.preventDefault();

  const enteredId = verifyInput.value.trim().toUpperCase();

  const cert = certificates.find(item =>
    (item.certificateId || "").toUpperCase() === enteredId
  );

  verifyResult.replaceChildren();

  if (!cert) {
    showVerificationResult(
      "Certificate Not Found",
      "No certificate exists with this ID.",
      "verify-failure"
    );

    return;
  }

  if (cert.status === "Invalid") {
    showVerificationResult(
      "Certificate Invalid",
      "This certificate exists but has been marked Invalid.",
      "verify-failure",
      cert
    );

    return;
  }

  showVerificationResult(
    "Certificate Verified Successfully",
    "This certificate is registered and marked Valid in the portal.",
    "verify-success",
    cert
  );
});

/* ================= VERIFICATION RESULT ================= */

function showVerificationResult(title, message, className, cert = null) {
  verifyResult.replaceChildren();

  const resultBox = document.createElement("div");
  resultBox.className = className;

  const heading = document.createElement("div");
  heading.className = "verify-result-title";
  heading.textContent = title;

  const description = document.createElement("p");
  description.textContent = message;

  resultBox.appendChild(heading);
  resultBox.appendChild(description);

  if (cert) {
    const details = document.createElement("div");
    details.className = "verify-details";

    const fields = [
      ["Certificate Title", cert.title],
      ["Recipient", cert.recipient],
      ["Category", cert.category],
      ["Issue Date", cert.issueDate],
      ["Certificate ID", cert.certificateId],
      ["Status", cert.status]
    ];

    fields.forEach(([label, value]) => {
      const paragraph = document.createElement("p");
      paragraph.textContent = label + ": " + (value || "");
      details.appendChild(paragraph);
    });

    resultBox.appendChild(details);
  }

  verifyResult.appendChild(resultBox);
}

/* ================= SEARCH ================= */

searchInput.addEventListener("input", renderCertificates);

/* ================= CATEGORY FILTER ================= */

filterCategory.addEventListener("change", renderCertificates);

/* ================= INITIAL RENDER ================= */

renderCertificates();
