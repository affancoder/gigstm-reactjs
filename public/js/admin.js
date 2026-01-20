const API_URL = "/api";
const TOKEN_KEY = "jwt_token";
let state = { page: 1, limit: 10, search: "", total: 0, hasNext: false, data: [] };
const tbody = document.getElementById("table-body");
const searchInput = document.getElementById("search-input");
const prevBtn = document.getElementById("prev-page");
const nextBtn = document.getElementById("next-page");
const pageInfo = document.getElementById("page-info");
const logoutBtn = document.getElementById("logout-btn");
const limitSelect = document.getElementById("limit-select");
const clearSearchBtn = document.getElementById("clear-search");
const exportCsvBtn = document.getElementById("export-csv");
const totalCountEl = document.getElementById("total-count");
const loadingEl = document.getElementById("loading");

function fmtExp(y, m) {
  if (!y && !m) return "";
  const a = [];
  if (y) a.push(`${y}y`);
  if (m) a.push(`${m}m`);
  return a.join(" ");
}

function rowHTML(item) {
  const p = item.profile || {};
  return `<tr>
    <td>${item.user?.name || ""}</td>
    <td>${item.user?.email || ""}</td>
    <td>${p.mobile || ""}</td>
    <td>${p.jobRole || ""}</td>
    <td><button class="btn-view" data-id="${item.user?.id}">View</button></td>
  </tr>`;
}

async function fetchMy() {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) { window.location.href = "/login.html"; return; }
  showLoading();
  const res = await fetch(`${API_URL}/user/me/combined`, { headers: { Authorization: `Bearer ${token}` } });
  const json = await res.json();
  hideLoading();
  if (!res.ok) {
    alert(json.message || "Failed to load your data");
    return;
  }
  state.total = 1;
  state.hasNext = false;
  state.data = json.data ? [json.data] : [];
  render();
}

async function fetchData() {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) { window.location.href = "/login.html"; return; }
  const url = `${API_URL}/user/admin/users?page=${state.page}&limit=${state.limit}&search=${encodeURIComponent(state.search)}`;
  showLoading();
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  const json = await res.json();
  hideLoading();
  if (!res.ok) {
    if (res.status === 403) {
      await fetchMy();
      return;
    }
    alert(json.message || "Failed to load data");
    return;
  }
  state.total = json.total || 0;
  state.hasNext = json.hasNextPage || false;
  state.data = json.data || [];
  render();
}

function render() {
  tbody.innerHTML = "";
  if (state.data.length === 0) {
    tbody.innerHTML = `<tr><td colspan="10"><div class="empty">No records</div></td></tr>`;
    pageInfo.textContent = `Page ${state.page}`;
    prevBtn.disabled = state.page <= 1;
    nextBtn.disabled = !state.hasNext;
    return;
  }
  const html = state.data.map(rowHTML).join("");
  tbody.innerHTML = html;
  tbody.querySelectorAll(".btn-view").forEach(btn=>{
    btn.addEventListener("click",()=>{
      const id = btn.getAttribute("data-id");
      const item = state.data.find(d=>String(d?.user?.id)===String(id));
      if(item) openDetail(item);
    });
  });
  const totalPages = Math.max(Math.ceil(state.total / state.limit), 1);
  pageInfo.textContent = `Page ${state.page} / ${totalPages}`;
  prevBtn.disabled = state.page <= 1;
  nextBtn.disabled = !state.hasNext;
  if (totalCountEl) totalCountEl.textContent = `Total: ${state.total}`;
}

let t;
searchInput.addEventListener("input", () => {
  clearTimeout(t);
  t = setTimeout(() => {
    state.search = searchInput.value.trim();
    state.page = 1;
    fetchData();
  }, 300);
});
prevBtn.addEventListener("click", () => {
  if (state.page > 1) {
    state.page -= 1;
    fetchData();
  }
});
nextBtn.addEventListener("click", () => {
  if (state.hasNext) {
    state.page += 1;
    fetchData();
  }
});
logoutBtn.addEventListener("click", () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem("user");
  window.location.href = "/login.html";
});
if (limitSelect) {
  limitSelect.value = String(state.limit);
  limitSelect.addEventListener("change", () => {
    state.limit = parseInt(limitSelect.value) || 10;
    state.page = 1;
    fetchData();
  });
}
if (clearSearchBtn) {
  clearSearchBtn.addEventListener("click", () => {
    searchInput.value = "";
    state.search = "";
    state.page = 1;
    fetchData();
  });
}
if (exportCsvBtn) {
  exportCsvBtn.addEventListener("click", () => {
    exportCSV();
  });
}
fetchData();

function field(label,value){return `<div>${label}</div><div>${value||""}</div>`}
function linkOrImg(url,label){
  if(!url) return "";
  const clean = String(url);
  const name = clean.split("/").pop().split(/[?#]/)[0] || label || "Document";
  const isImg = /\.(png|jpg|jpeg|gif|webp)$/i.test(clean);
  const isPdf = /\.pdf($|[?#])/i.test(clean);
  if (isImg) {
    return `<a href="${clean}" target="_blank" class="image-thumb"><img src="${clean}" alt="${name}"/></a>`;
  }
  if (isPdf) {
    return `
      <div class="pdf-card" data-href="${clean}">
        <div class="pdf-icon">PDF</div>
        <div class="pdf-filename">${name}</div>
        <div class="preview-actions">
          <button class="view-btn" type="button">View PDF</button>
        </div>
      </div>
    `;
  }
  return `<a href="${clean}" target="_blank">${name}</a>`;
}
let bootstrapDetailModal = null;
const detailModalEl = document.getElementById("detailModal");
if (detailModalEl && window.bootstrap) {
  bootstrapDetailModal = new bootstrap.Modal(detailModalEl);
}
function openDetail(item){
  document.getElementById("detail-title").textContent=`Details — ${item.user?.name||""}`;
  const p=item.profile||{}, e=item.experience||{}, k=item.kyc||{};
  const userKv=`
    <div class="kv">
      ${field("Name",item.user?.name)}
      ${field("Email",item.user?.email)}
      ${field("Role",item.user?.role||"")}
      ${field("Created",item.user?.createdAt?new Date(item.user.createdAt).toLocaleString():"")}
    </div>`;
  const profileKv=`
    <div class="kv">
      ${field("Mobile",p.mobile)}
      ${field("Job Role",p.jobRole)}
      ${field("Gender",p.gender)}
      ${field("DOB",p.dob?new Date(p.dob).toLocaleDateString():"")}
      ${field("Aadhaar",p.aadhaar)}
      ${field("PAN",p.pan)}
      ${field("Country",p.country)}
      ${field("State",p.state)}
      ${field("City",p.city)}
      ${field("Address 1",p.address1)}
      ${field("Address 2",p.address2)}
      ${field("Pincode",p.pincode)}
      ${field("About",p.about)}
    </div>
    <div class="thumbs">
      ${linkOrImg(p.profileImage,"Profile Image")||""}
      ${linkOrImg(p.aadhaarFile,"Aadhaar File")||""}
      ${linkOrImg(p.panFile,"PAN File")||""}
      ${linkOrImg(p.resumeFile,"Resume File")||""}
    </div>`;
  const expKv=`
    <div class="kv">
      ${field("Years",e.experienceYears)}
      ${field("Months",e.experienceMonths)}
      ${field("Employment",e.employmentType)}
      ${field("Occupation",e.occupation)}
      ${field("Requirement",e.jobRequirement)}
      ${field("Heard About",e.heardAbout)}
      ${field("Interest Type",e.interestType)}
      ${field("Created",e.createdAt?new Date(e.createdAt).toLocaleString():"")}
    </div>
    <div class="thumbs">
      ${linkOrImg(e.resumeStep2,"Resume")||""}
    </div>`;
  const kycKv=`
    <div class="kv">
      ${field("Bank",k.bankName)}
      ${field("Account",k.accountNumber)}
      ${field("IFSC",k.ifscCode)}
      ${field("Created",k.createdAt?new Date(k.createdAt).toLocaleString():"")}
    </div>
    <div class="thumbs">
      ${linkOrImg(k.aadhaarFront,"Aadhaar Front")||""}
      ${linkOrImg(k.aadhaarBack,"Aadhaar Back")||""}
      ${linkOrImg(k.panCardUpload,"PAN Upload")||""}
      ${linkOrImg(k.passbookUpload,"Passbook Upload")||""}
    </div>`;
  const body=`
    <div class="detail-grid">
      <div class="detail-section"><h3>User</h3>${userKv}</div>
      <div class="detail-section"><h3>Profile</h3>${profileKv}</div>
      <div class="detail-section"><h3>Experience</h3>${expKv}</div>
      <div class="detail-section"><h3>KYC</h3>${kycKv}</div>
    </div>`;
  document.getElementById("detail-body").innerHTML=body;
  if (bootstrapDetailModal) {
    bootstrapDetailModal.show();
  } else {
    // Fallback: if Bootstrap is unavailable, open in new window
    const w = window.open("", "_blank", "width=1000,height=800,scrollbars=yes");
    if (w && w.document) {
      w.document.title = `Details — ${item.user?.name||""}`;
      w.document.body.innerHTML = body;
    }
  }
}

function showLoading(){ if(loadingEl) loadingEl.style.display="block"; }
function hideLoading(){ if(loadingEl) loadingEl.style.display="none"; }
function flatten(item){
  const p=item.profile||{}, e=item.experience||{}, k=item.kyc||{};
  return {
    id:item.user?.id||"",
    name:item.user?.name||"",
    role:item.user?.role||"",
    email:item.user?.email||"",
    mobile:p.mobile||"",
    jobRole:p.jobRole||"",
    gender:p.gender||"",
    dob:p.dob||"",
    aadhaar:p.aadhaar||"",
    pan:p.pan||"",
    country:p.country||"",
    state:p.state||"",
    city:p.city||"",
    address1:p.address1||"",
    address2:p.address2||"",
    pincode:p.pincode||"",
    occupation:e.occupation||"",
    employmentType:e.employmentType||"",
    experienceYears:e.experienceYears||"",
    experienceMonths:e.experienceMonths||"",
    heardAbout:e.heardAbout||"",
    interestType:e.interestType||"",
    kycBank:k.bankName||"",
    kycAccount:k.accountNumber||"",
    kycIfsc:k.ifscCode||""
  };
}
function exportCSV(){
  const rows = state.data.map(flatten);
  if(rows.length===0){ alert("No data to export"); return; }
  const headers = Object.keys(rows[0]);
  const csv = [headers.join(",")].concat(rows.map(r=>headers.map(h=>String(r[h]).replace(/"/g,'""')).map(v=>`"${v}"`).join(","))).join("\n");
  const blob = new Blob([csv],{type:"text/csv;charset=utf-8;"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "admin-data.csv";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function openAdminPreview(type, src) {
  const overlay = document.getElementById("admin-preview-overlay");
  const content = document.getElementById("admin-preview-content");
  const closeBtn = document.getElementById("admin-preview-close");
  if (!overlay || !content || !closeBtn) return;
  content.innerHTML = "";
  if (type === "image") {
    const img = document.createElement("img");
    img.src = src;
    img.alt = "Preview";
    content.appendChild(img);
  } else if (type === "pdf") {
    const iframe = document.createElement("iframe");
    iframe.src = src;
    content.appendChild(iframe);
  }
  overlay.classList.add("visible");
  const close = () => {
    overlay.classList.remove("visible");
    content.innerHTML = "";
    overlay.removeEventListener("click", onOverlayClick);
    document.removeEventListener("keydown", onEsc);
    closeBtn.removeEventListener("click", close);
  };
  const onOverlayClick = (e) => {
    if (e.target === overlay) close();
  };
  const onEsc = (e) => {
    if (e.key === "Escape") close();
  };
  overlay.addEventListener("click", onOverlayClick);
  document.addEventListener("keydown", onEsc);
  closeBtn.addEventListener("click", close);
}

if (detailModalEl) {
  detailModalEl.addEventListener("click", (e) => {
    const img = e.target.closest(".thumbs img");
    if (img) {
      e.preventDefault();
      openAdminPreview("image", img.src);
      return;
    }
    const link = e.target.closest(".thumbs a");
    if (link) {
      const href = link.getAttribute("href") || "";
      const isPdf = /\.pdf($|[?#])/i.test(href);
      const isImg = /\.(png|jpg|jpeg|gif|webp)($|[?#])/i.test(href);
      if (isPdf) {
        e.preventDefault();
        openAdminPreview("pdf", href);
        return;
      }
      if (isImg) {
        e.preventDefault();
        openAdminPreview("image", href);
      }
    }
    const pdfCard = e.target.closest(".pdf-card");
    if (pdfCard) {
      const href = pdfCard.getAttribute("data-href") || "";
      if (href) {
        openAdminPreview("pdf", href);
      }
      return;
    }
    const viewBtn = e.target.closest(".pdf-card .preview-actions .view-btn");
    if (viewBtn) {
      const card = viewBtn.closest(".pdf-card");
      const href = card ? card.getAttribute("data-href") || "" : "";
      if (href) {
        window.open(href, "_blank");
      }
    }
  });
}
