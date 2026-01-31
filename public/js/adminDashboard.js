const API_URL = "/api/admin";
const ADMIN_TOKEN_KEY = "admin_token";
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

// ==========================
// AUTH GUARD
// ==========================
(async function checkAuth() {
    const token = localStorage.getItem(ADMIN_TOKEN_KEY);
    if (!token) {
        window.location.href = "/admin-login.html";
        return;
    }
    try {
        const res = await fetch(`${API_URL}/me`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error("Unauthorized");
        document.body.style.display = "block"; // Show page
        fetchData();
    } catch (err) {
        localStorage.removeItem(ADMIN_TOKEN_KEY);
        localStorage.removeItem("admin_user");
        window.location.href = "/admin-login.html";
    }
})();

// ==========================
// HELPERS
// ==========================
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
    <td>${item.user?.uniqueId || "-"}</td>
    <td>${item.user?.name || ""}</td>
    <td>${item.user?.email || ""}</td>
    <td>${p.mobile || ""}</td>
    <td>${p.jobRole || ""}</td>
    <td><button class="btn-view" data-id="${item.user?.id}">View</button></td>
  </tr>`;
}

// ==========================
// DATA FETCHING
// ==========================
async function fetchData() {
  const token = localStorage.getItem(ADMIN_TOKEN_KEY);
  if (!token) { window.location.href = "/admin-login.html"; return; }
  
  const url = `${API_URL}/users?page=${state.page}&limit=${state.limit}&search=${encodeURIComponent(state.search)}`;
  
  showLoading();
  try {
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      hideLoading();
      
      if (!res.ok) {
        alert(json.message || "Failed to load data");
        if (res.status === 401) {
            localStorage.removeItem(ADMIN_TOKEN_KEY);
            window.location.href = "/admin-login.html";
        }
        return;
      }
      
      state.total = json.total || 0;
      state.hasNext = json.hasNextPage || false;
      state.data = json.data || [];
      // Debug: Verify uniqueId presence
      if(state.data.length > 0) console.log("First user uniqueId:", state.data[0].user?.uniqueId);
      render();
  } catch (err) {
      hideLoading();
      console.error(err);
      alert("An error occurred while fetching data");
  }
}

function showLoading() {
    if (loadingEl) loadingEl.style.display = "block";
}
function hideLoading() {
    if (loadingEl) loadingEl.style.display = "none";
}

// ==========================
// RENDERING
// ==========================
function render() {
  tbody.innerHTML = "";
  if (state.data.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6"><div class="empty">No records found</div></td></tr>`;
    pageInfo.textContent = `Page ${state.page}`;
    prevBtn.disabled = state.page <= 1;
    nextBtn.disabled = true;
    if (totalCountEl) totalCountEl.textContent = `Total: 0`;
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

// ==========================
// EVENT LISTENERS
// ==========================
let t;
searchInput.addEventListener("input", () => {
  clearTimeout(t);
  t = setTimeout(() => {
    state.search = searchInput.value;
    state.page = 1;
    fetchData();
  }, 500);
});

clearSearchBtn.addEventListener("click", () => {
    searchInput.value = "";
    state.search = "";
    state.page = 1;
    fetchData();
});

prevBtn.addEventListener("click", () => {
  if (state.page > 1) {
    state.page--;
    fetchData();
  }
});

nextBtn.addEventListener("click", () => {
  if (state.hasNext) {
    state.page++;
    fetchData();
  }
});

limitSelect.addEventListener("change", (e) => {
    state.limit = parseInt(e.target.value);
    state.page = 1;
    fetchData();
});

logoutBtn.addEventListener("click", () => {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    localStorage.removeItem("admin_user");
    window.location.href = "/admin-login.html";
});

// ==========================
// MODAL LOGIC (Simplified from admin.js)
// ==========================
const detailModal = new bootstrap.Modal(document.getElementById('detailModal'));
const detailBody = document.getElementById("detail-body");

function openDetail(item) {
    const p = item.profile || {};
    const k = item.kyc || {};
    const e = item.experience || {};
    
    // Helper for safe value
    const val = (v) => v || "-";
    // Helper for file link
    const fileLink = (url, label) => url ? `<a href="${url}" target="_blank" class="file-link"><i class="fas fa-file-alt"></i> ${label}</a>` : ``;

    const html = `
    <div class="container-fluid">
        <div class="row mb-4">
            <div class="col-md-3 text-center">
                <img src="${p.profileImage || '/GigsTm_files/lgo_n_user1.jpg'}" class="img-fluid rounded-circle mb-2" style="max-width: 150px; height: 150px; object-fit: cover;" alt="Profile">
                <h5>${item.user.name}</h5>
                <p class="text-muted mb-1">${item.user.email}</p>
                <span class="badge bg-primary">${item.user.role}</span>
            </div>
            <div class="col-md-9">
                <h6 class="border-bottom pb-2">Personal Information</h6>
                <div class="row g-3 mb-3">
                    <div class="col-md-6"><strong>Mobile:</strong> ${val(p.mobile)}</div>
                    <div class="col-md-6"><strong>Job Role:</strong> ${val(p.jobRole)}</div>
                    <div class="col-md-6"><strong>Gender:</strong> ${val(p.gender)}</div>
                    <div class="col-md-6"><strong>DOB:</strong> ${val(p.dob)}</div>
                    <div class="col-md-6"><strong>Aadhaar No:</strong> ${val(p.aadhaar)}</div>
                    <div class="col-md-6"><strong>PAN No:</strong> ${val(p.pan)}</div>
                    <div class="col-12"><strong>About:</strong> ${val(p.about)}</div>
                </div>
                
                <h6 class="border-bottom pb-2">Address</h6>
                <div class="row g-3 mb-3">
                    <div class="col-12">
                        ${val(p.address1)} ${p.address2 ? ', ' + p.address2 : ''}<br>
                        ${val(p.city)}, ${val(p.state)} - ${val(p.pincode)}<br>
                        ${val(p.country)}
                    </div>
                </div>

                <h6 class="border-bottom pb-2">KYC Details</h6>
                <div class="row g-3 mb-3">
                    <div class="col-md-6"><strong>Bank Name:</strong> ${val(k.bankName)}</div>
                    <div class="col-md-6"><strong>Account No:</strong> ${val(k.accountNumber)}</div>
                    <div class="col-md-6"><strong>IFSC Code:</strong> ${val(k.ifscCode)}</div>
                </div>
            </div>
        </div>

        <div class="row mb-4">
            <div class="col-md-6">
                <h6 class="border-bottom pb-2">Experience</h6>
                <div class="row g-3">
                    <div class="col-md-6"><strong>Occupation:</strong> ${val(e.occupation)}</div>
                    <div class="col-md-6"><strong>Type:</strong> ${val(e.employmentType)}</div>
                    <div class="col-md-6"><strong>Experience:</strong> ${val(e.experienceYears)} Years ${e.experienceMonths ? e.experienceMonths + ' Months' : ''}</div>
                    <div class="col-md-6"><strong>Job Req:</strong> ${val(e.jobRequirement)}</div>
                    <div class="col-md-6"><strong>Heard About:</strong> ${val(e.heardAbout)}</div>
                    <div class="col-md-6"><strong>Interest:</strong> ${val(e.interestType)}</div>
                </div>
            </div>
            <div class="col-md-6">
                <h6 class="border-bottom pb-2">Documents</h6>
                <div class="d-flex flex-wrap gap-2">
                    ${fileLink(p.resumeFile, "Resume")}
                    ${fileLink(e.resumeStep2, "Resume (Exp)")}
                    ${fileLink(p.aadhaarFile, "Aadhaar")}
                    ${fileLink(p.panFile, "PAN Card")}
                    ${fileLink(k.aadhaarFront, "Aadhaar Front")}
                    ${fileLink(k.aadhaarBack, "Aadhaar Back")}
                    ${fileLink(k.panCardUpload, "PAN Card (KYC)")}
                    ${fileLink(k.passbookUpload, "Passbook/Cheque")}
                </div>
            </div>
        </div>
    </div>
    `;
    
    console.log(item);
    detailBody.innerHTML = html;
    detailModal.show();
}

// ==========================
// EXPORT CSV (Simplified)
// ==========================
exportCsvBtn.addEventListener("click", () => {
    if (!state.data || state.data.length === 0) {
        alert("No data to export");
        return;
    }
    
    // Define headers
    const headers = ["ID", "Name", "Email", "Mobile", "Job Role", "Occupation", "Experience", "City", "State", "Joined At"];
    
    // Map data to CSV rows
    const rows = state.data.map(item => {
        const u = item.user || {};
        const p = item.profile || {};
        const e = item.experience || {};
        
        // Helper to escape quotes and handle nulls
        const safe = (val) => `"${String(val || "").replace(/"/g, '""')}"`;
        
        return [
            safe(u.uniqueId),
            safe(u.name),
            safe(u.email),
            safe(p.mobile),
            safe(p.jobRole),
            safe(e.occupation),
            safe(e.experienceYears),
            safe(p.city),
            safe(p.state),
            safe(new Date(u.createdAt).toLocaleDateString())
        ].join(",");
    });
    
    // Combine headers and rows
    const csvContent = [headers.join(","), ...rows].join("\n");
    
    // Create download link
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `users_export_${new Date().toISOString().slice(0,10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
});
