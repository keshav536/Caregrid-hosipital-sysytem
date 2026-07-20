/**
 * supabase-bridge.js
 * CareGrid HMS — Supabase Integration Bridge
 *
 * This module connects every page's form and table to Supabase.
 * It runs AFTER the existing script.js has initialised the UI,
 * replacing localStorage reads/writes with live Supabase calls
 * while keeping every existing HTML element, CSS class, and
 * animation exactly as-is.
 *
 * Loaded as <script type="module"> AFTER script.js on each page.
 */

import { getPatients, addPatient, deletePatient, normalizeAndValidateGender }   from "./patients.js";
import { getDoctors }                               from "./doctors.js";
import { getAppointments, bookAppointment,
         updateAppointment, cancelAppointment }     from "./appointments.js";
import { getPrescriptions }                         from "./prescriptions.js";
import { generateBill, getBills }                   from "./billing.js";
import {
  loadDashboardStatistics,
  loadRecentPatients,
  loadRecentAppointments,
} from "./dashboard.js";
import { supabase }                                 from "./supabase-config.js";

// ─── Shared toast helper (mirrors script.js showToast) ────────
function toast(title, msg, type = "primary") {
  if (typeof window.showToast === "function") {
    window.showToast(title, msg, type);
  } else {
    console.info(`[${type.toUpperCase()}] ${title}: ${msg}`);
  }
}

// ─── Detect current page ──────────────────────────────────────
const page = window.location.pathname.split("/").pop() || "index.html";

// ─── Disable a button while async work runs ───────────────────
function withButtonLock(btn, fn) {
  return async (...args) => {
    if (!btn) return fn(...args);
    const orig = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving…';
    try {
      await fn(...args);
    } finally {
      btn.disabled = false;
      btn.innerHTML = orig;
    }
  };
}

// ═══════════════════════════════════════════════════════════════
// PATIENTS PAGE
// ═══════════════════════════════════════════════════════════════
async function initSupabasePatients() {
  const tbody     = document.getElementById("patient-table-body");
  const form      = document.getElementById("patient-form");
  const modal     = document.getElementById("patient-modal");
  const searchEl  = document.getElementById("patient-search");
  const filterEl  = document.getElementById("patient-status-filter");
  const prevBtn   = document.getElementById("btn-prev");
  const nextBtn   = document.getElementById("btn-next");
  const infoEl    = document.getElementById("pagination-info");

  if (!tbody) return; // not on patients page

  let allPatients   = [];
  let filtered      = [];
  let currentPage   = 1;
  const perPage     = 5;

  // ── Render ──────────────────────────────────────────────────
  function renderRows() {
    tbody.innerHTML = "";
    const start = (currentPage - 1) * perPage;
    const items = filtered.slice(start, start + perPage);

    if (!items.length) {
      tbody.innerHTML =
        '<tr><td colspan="9" style="text-align:center;color:var(--text-muted);">No Patients Found</td></tr>';
      updatePagination();
      return;
    }

    items.forEach((p) => {
      let bc = "badge-primary";
      if (p.status === "admitted")   bc = "badge-warning";
      if (p.status === "recovered")  bc = "badge-success";
      if (p.status === "discharged") bc = "badge-danger";

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td><strong>#${p.id}</strong></td>
        <td>${p.name}</td>
        <td>${p.age}</td>
        <td>${p.gender}</td>
        <td>${p.blood_group || p.bloodGroup || "—"}</td>
        <td>${p.disease}</td>
        <td>${p.doctor}</td>
        <td><span class="badge ${bc}">${p.status}</span></td>
        <td>
          <button class="nav-btn" style="color:var(--danger)"
            onclick="window._sbDeletePatient('${p.id}')">
            <i class="fas fa-trash"></i>
          </button>
        </td>`;
      tbody.appendChild(tr);
    });
    updatePagination();
  }

  function updatePagination() {
    const total = filtered.length;
    const pages = Math.max(1, Math.ceil(total / perPage));
    if (infoEl) {
      const s = total ? (currentPage - 1) * perPage + 1 : 0;
      const e = Math.min(currentPage * perPage, total);
      infoEl.innerText = `Showing ${s} to ${e} of ${total} Patients`;
    }
    if (prevBtn) prevBtn.disabled = currentPage === 1;
    if (nextBtn) nextBtn.disabled = currentPage >= pages;
  }

  function applyFilter() {
    const q   = searchEl ? searchEl.value.toLowerCase() : "";
    const st  = filterEl ? filterEl.value : "all";
    filtered = allPatients.filter((p) => {
      const matchQ = p.name.toLowerCase().includes(q) ||
                     p.disease.toLowerCase().includes(q) ||
                     String(p.id).toLowerCase().includes(q);
      const matchS = st === "all" || p.status === st;
      return matchQ && matchS;
    });
    currentPage = 1;
    renderRows();
  }

  // ── Load from Supabase ──────────────────────────────────────
  async function loadPatients() {
    tbody.innerHTML =
      '<tr><td colspan="9" style="text-align:center;color:var(--text-muted);">' +
      '<i class="fas fa-spinner fa-spin"></i> Loading…</td></tr>';
    const res = await getPatients();
    if (!res.success) {
      toast("Database Error", res.error, "danger");
      tbody.innerHTML =
        '<tr><td colspan="9" style="text-align:center;color:var(--danger);">Failed to load patients.</td></tr>';
      return;
    }
    allPatients = res.data;
    applyFilter();
  }

  // ── Delete handler exposed on window ────────────────────────
  window._sbDeletePatient = async (id) => {
    if (!confirm("Delete this patient record permanently?")) return;
    const res = await deletePatient(id);
    if (res.success) {
      toast("Deleted", `Patient #${id} removed.`, "warning");
      await loadPatients();
    } else {
      toast("Error", res.error, "danger");
    }
  };

  // ── Form submit ─────────────────────────────────────────────
  if (form) {
    const submitBtn = form.querySelector('[type="submit"]');
    form.addEventListener("submit", withButtonLock(submitBtn, async (e) => {
      e.preventDefault();
      
      const genderValue = document.getElementById("pat-gender").value;
      const genderObj = normalizeAndValidateGender(genderValue);
      if (!genderObj.isValid) {
        toast("Validation Error", `Invalid gender option selected: "${genderValue}".`, "danger");
        return;
      }

      const payload = {
        name:       document.getElementById("pat-name").value.trim(),
        age:        parseInt(document.getElementById("pat-age").value),
        gender:     genderObj.value,
        blood_group: document.getElementById("pat-blood").value,
        disease:    document.getElementById("pat-disease").value.trim(),
        doctor:     document.getElementById("pat-doc").value,
        status:     document.getElementById("pat-status").value,
      };
      if (!payload.name || !payload.disease) {
        toast("Validation", "Name and disease are required.", "danger");
        return;
      }
      const res = await addPatient(payload);
      if (res.success) {
        toast("Patient Added", `Record created successfully.`, "success");
        modal && modal.classList.remove("active");
        form.reset();
        await loadPatients();
      } else {
        toast("Error", res.error, "danger");
      }
    }));
  }

  // ── Pagination buttons ──────────────────────────────────────
  if (prevBtn) prevBtn.addEventListener("click", () => { currentPage--; renderRows(); });
  if (nextBtn) nextBtn.addEventListener("click", () => { currentPage++; renderRows(); });

  // ── Search / filter live ────────────────────────────────────
  if (searchEl) searchEl.addEventListener("input", applyFilter);
  if (filterEl) filterEl.addEventListener("change", applyFilter);

  await loadPatients();
}

// ═══════════════════════════════════════════════════════════════
// DOCTORS PAGE
// ═══════════════════════════════════════════════════════════════
async function initSupabaseDoctors() {
  const container = document.getElementById("doctors-grid-container");
  if (!container) return;

  const searchEl  = document.getElementById("doctor-search");
  const deptEl    = document.getElementById("doctor-dept-filter");

  let allDoctors = [];

  function renderDoctors(list) {
    container.innerHTML = "";
    if (!list.length) {
      container.innerHTML =
        '<div style="grid-column:1/-1;text-align:center;color:var(--text-muted);padding:40px 0;">No Doctors Found</div>';
      return;
    }
    list.forEach((doc) => {
      const card = document.createElement("div");
      card.className = "card doc-card";
      card.innerHTML = `
        <div class="doc-img-box">
          <img src="${doc.image || 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?q=80&w=300&auto=format&fit=crop'}" alt="${doc.name}">
          <span class="doc-status-badge doc-status-${doc.status}">${doc.status === "online" ? "Available" : "On Leave"}</span>
        </div>
        <div class="doc-info">
          <div class="doc-dept">${doc.dept}</div>
          <h3 class="doc-name">${doc.name}</h3>
          <p class="doc-qualification">${doc.qual}</p>
          <div class="doc-rating">
            <i class="fas fa-star"></i><i class="fas fa-star"></i>
            <i class="fas fa-star"></i><i class="fas fa-star"></i>
            <i class="fas fa-star"></i>
            <span>(${doc.rating})</span>
          </div>
          <div class="doc-details">
            <span>Experience<strong>${doc.exp} Years</strong></span>
            <span>Fee<strong>$${doc.fee}</strong></span>
          </div>
          <a href="appointments.html?doctor=${encodeURIComponent(doc.name)}&dept=${encodeURIComponent(doc.dept)}"
             class="btn btn-primary doc-action-btn">Book Appointment</a>
        </div>`;
      container.appendChild(card);
    });
  }

  function filterAndRender() {
    const q    = searchEl ? searchEl.value.toLowerCase() : "";
    const dept = deptEl ? deptEl.value : "all";
    const list = allDoctors.filter((d) => {
      const mQ = d.name.toLowerCase().includes(q) || (d.qual || "").toLowerCase().includes(q);
      const mD = dept === "all" || d.dept === dept;
      return mQ && mD;
    });
    renderDoctors(list);
  }

  container.innerHTML =
    '<div style="grid-column:1/-1;text-align:center;color:var(--text-muted);padding:40px 0;">' +
    '<i class="fas fa-spinner fa-spin"></i> Loading doctors…</div>';

  const res = await getDoctors();
  if (!res.success) {
    toast("Database Error", res.error, "danger");
    container.innerHTML =
      '<div style="grid-column:1/-1;text-align:center;color:var(--danger);">Failed to load doctors.</div>';
    return;
  }
  allDoctors = res.data;

  if (searchEl) searchEl.addEventListener("input", filterAndRender);
  if (deptEl)   deptEl.addEventListener("change", filterAndRender);

  filterAndRender();
}

// ═══════════════════════════════════════════════════════════════
// APPOINTMENTS PAGE
// ═══════════════════════════════════════════════════════════════
async function initSupabaseAppointments() {
  const upEl   = document.getElementById("upcoming-list");
  const compEl = document.getElementById("completed-list");
  const cancEl = document.getElementById("cancelled-list");
  const form   = document.getElementById("appointment-form");
  const deptSel = document.getElementById("apt-department");
  const docSel  = document.getElementById("apt-doctor");

  if (!upEl) return;

  let appointments = [];
  let allDoctors   = []; // ← all doctors fetched once from Supabase

  // ── Populate doctor dropdown based on selected department ────
  function populateDoctorDropdown(selectedDept) {
    if (!docSel) return;

    // Reset to default placeholder
    docSel.innerHTML = '<option value="">Select Doctor</option>';

    if (!selectedDept) {
      console.log('[HMS] No department selected — doctor dropdown reset.');
      return;
    }

    const filtered = allDoctors.filter(
      (d) => (d.dept || "").trim().toLowerCase() === selectedDept.trim().toLowerCase()
    );

    console.log(`[HMS] Department "${selectedDept}" → ${filtered.length} doctor(s) found.`);

    if (filtered.length === 0) {
      const opt = document.createElement('option');
      opt.value    = '';
      opt.disabled = true;
      opt.textContent = 'No doctors available';
      docSel.appendChild(opt);
      return;
    }

    filtered.forEach((d) => {
      const opt = document.createElement('option');
      opt.value       = d.name;
      opt.textContent = d.name;
      docSel.appendChild(opt);
    });
  }

  // ── Load all doctors from Supabase once ──────────────────────
  async function loadDoctors() {
    console.log('[HMS] Loading doctors from Supabase…');
    const res = await getDoctors();
    if (!res.success) {
      console.warn('[HMS] Could not load doctors:', res.error);
      allDoctors = [];
      return;
    }
    allDoctors = res.data || [];
    console.log(`[HMS] Loaded ${allDoctors.length} doctor(s) from Supabase.`);
  }

  // ── Attach department change listener (overrides script.js) ──
  // script.js attaches the same listener but reads from an empty
  // localStorage array (which seedLocalStorageData() always clears).
  // We replace it by cloning the element to remove old listeners,
  // then attach our own live Supabase-powered listener.
  function attachDeptListener() {
    if (!deptSel) return;

    // Clone node to strip any stale event listeners from script.js
    const freshDeptSel = deptSel.cloneNode(true);
    deptSel.parentNode.replaceChild(freshDeptSel, deptSel);

    // Re-query after clone
    const dept = document.getElementById('apt-department');
    const doc  = document.getElementById('apt-doctor');

    if (dept) {
      dept.addEventListener('change', () => {
        const selectedDept = dept.value;
        populateDoctorDropdown(selectedDept);
      });
      console.log('[HMS] Department change listener attached (Supabase-powered).');
    }

    // Handle pre-fill from URL query params (e.g. Doctors page "Book" link)
    const params  = new URLSearchParams(window.location.search);
    const qDept   = params.get('dept');
    const qDoc    = params.get('doctor');

    if (qDept && dept) {
      dept.value = qDept;
      populateDoctorDropdown(qDept);
      console.log(`[HMS] Pre-filling department from URL: ${qDept}`);

      // After populating doctors, set the doctor value
      if (qDoc && doc) {
        // Use setTimeout to ensure DOM options are rendered
        setTimeout(() => {
          doc.value = qDoc;
          console.log(`[HMS] Pre-filling doctor from URL: ${qDoc}`);
        }, 50);
      }
    }
  }

  // ── Render appointment cards ─────────────────────────────────
  function renderAppointments() {
    let up = "", comp = "", canc = "";

    appointments.forEach((apt) => {
      const badge = apt.status === "upcoming"
        ? "badge-primary"
        : apt.status === "completed"
        ? "badge-success"
        : "badge-danger";

      const actions = apt.status === "upcoming"
        ? `<div style="display:flex;gap:10px;">
             <button class="btn btn-sm btn-accent" onclick="window._sbCompleteApt('${apt.id}')">Mark Complete</button>
             <button class="btn btn-sm btn-outline" style="border-color:var(--danger);color:var(--danger);"
               onclick="window._sbCancelApt('${apt.id}')">Cancel Appointment</button>
           </div>`
        : "";

      const card = `
        <div class="card" style="margin-bottom:16px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
            <span class="badge ${badge}">${apt.status}</span>
            <span style="font-size:0.8rem;color:var(--text-muted)">#${apt.id}</span>
          </div>
          <h4 style="margin-bottom:6px;color:var(--secondary)">Patient: ${apt.patient} (${apt.age} / ${apt.gender})</h4>
          <p style="font-size:0.875rem;color:var(--text-muted);margin-bottom:4px;">
            <i class="fas fa-stethoscope" style="margin-right:6px;"></i>${apt.doctor} (${apt.dept})</p>
          <p style="font-size:0.875rem;color:var(--text-muted);margin-bottom:4px;">
            <i class="fas fa-calendar-alt" style="margin-right:6px;"></i>${apt.date} at ${apt.time}</p>
          <p style="font-size:0.875rem;color:var(--text-muted);margin-bottom:12px;">
            <i class="fas fa-comment-medical" style="margin-right:6px;"></i>Symptoms: ${apt.symptoms}</p>
          ${actions}
        </div>`;

      if (apt.status === "upcoming")  up   += card;
      if (apt.status === "completed") comp += card;
      if (apt.status === "cancelled") canc += card;
    });

    upEl.innerHTML   = up   || '<p style="color:var(--text-muted);text-align:center;padding:20px 0;">No Appointments Found</p>';
    compEl.innerHTML = comp || '<p style="color:var(--text-muted);text-align:center;padding:20px 0;">No Appointments Found</p>';
    cancEl.innerHTML = canc || '<p style="color:var(--text-muted);text-align:center;padding:20px 0;">No Appointments Found</p>';
  }

  // ── Load appointments from Supabase ──────────────────────────
  async function load() {
    upEl.innerHTML = '<p style="color:var(--text-muted);text-align:center;"><i class="fas fa-spinner fa-spin"></i> Loading…</p>';
    const res = await getAppointments();
    if (!res.success) { toast("Database Error", res.error, "danger"); return; }
    appointments = res.data;
    renderAppointments();
  }

  // ── Status action handlers ───────────────────────────────────
  window._sbCompleteApt = async (id) => {
    const res = await updateAppointment(id, { status: "completed" });
    if (res.success) { toast("Completed", `Appointment marked complete.`, "success"); await load(); }
    else toast("Error", res.error, "danger");
  };

  window._sbCancelApt = async (id) => {
    if (!confirm("Cancel this appointment?")) return;
    const res = await cancelAppointment(id);
    if (res.success) { toast("Cancelled", `Appointment cancelled.`, "danger"); await load(); }
    else toast("Error", res.error, "danger");
  };

  // ── Form submit ─────────────────────────────────────────────
  if (form) {
    const submitBtn = form.querySelector('[type="submit"]');
    form.addEventListener("submit", withButtonLock(submitBtn, async (e) => {
      e.preventDefault();

      const deptEl = document.getElementById("apt-department");
      const docEl  = document.getElementById("apt-doctor");

      const genderValue = document.getElementById("apt-gender").value;
      const genderObj = normalizeAndValidateGender(genderValue);
      if (!genderObj.isValid) {
        toast("Validation Error", `Invalid gender option selected: "${genderValue}".`, "danger");
        return;
      }

      const payload = {
        patient:  document.getElementById("apt-name").value.trim(),
        age:      parseInt(document.getElementById("apt-age").value),
        gender:   genderObj.value,
        phone:    document.getElementById("apt-phone").value.trim(),
        email:    document.getElementById("apt-email").value.trim(),
        dept:     deptEl ? deptEl.value : "",
        doctor:   docEl  ? docEl.value  : "",
        date:     document.getElementById("apt-date").value,
        time:     document.getElementById("apt-time").value,
        symptoms: document.getElementById("apt-symptoms").value.trim(),
      };

      if (!payload.patient || !payload.date || !payload.doctor) {
        toast("Validation", "Patient name, date, and doctor are required.", "danger");
        return;
      }

      const res = await bookAppointment(payload);
      if (res.success) {
        toast("Booked!", `Appointment booked successfully.`, "success");
        form.reset();
        // Re-fetch doctors so dropdown is ready for next booking
        await loadDoctors();
        await load();
      } else {
        toast("Error", res.error, "danger");
      }
    }));
  }

  // ── Bootstrap: load doctors first, then wire listener, then appointments
  await loadDoctors();   // 1. Fetch all doctors from Supabase
  attachDeptListener();  // 2. Attach dept → doctor filter listener
  await load();          // 3. Load and render existing appointments
}

// ═══════════════════════════════════════════════════════════════
// PRESCRIPTIONS PAGE
// ═══════════════════════════════════════════════════════════════
async function initSupabasePrescriptions() {
  const grid = document.getElementById("prescriptions-grid");
  if (!grid) return;

  grid.innerHTML = '<p style="text-align:center;color:var(--text-muted);padding:40px 0;"><i class="fas fa-spinner fa-spin"></i> Loading prescriptions…</p>';

  const res = await getPrescriptions();
  if (!res.success) {
    toast("Database Error", res.error, "danger");
    grid.innerHTML = '<p style="text-align:center;color:var(--danger);">Failed to load prescriptions.</p>';
    return;
  }

  const prescriptions = res.data;
  grid.innerHTML = "";

  if (!prescriptions.length) {
    grid.innerHTML = '<p style="text-align:center;color:var(--text-muted);padding:40px 0;">No Prescriptions Found</p>';
    return;
  }

  prescriptions.forEach((pres) => {
    const medicines = Array.isArray(pres.medicines) ? pres.medicines : [];
    let medsHtml = medicines.map((m) => `
      <div class="med-item">
        <div><strong>${m.name}</strong></div>
        <div class="med-dose-indicators">
          <span class="dose-dot ${m.morning   ? "active" : ""}">M</span>
          <span class="dose-dot ${m.afternoon ? "active" : ""}">A</span>
          <span class="dose-dot ${m.night     ? "active" : ""}">N</span>
        </div>
        <div style="color:var(--text-muted);font-size:0.8rem">${m.note || ""}</div>
      </div>`).join("");

    const card = document.createElement("div");
    card.className = "card prescription-card printable-area";
    card.innerHTML = `
      <div class="prescription-header">
        <div class="prescription-h-left">
          <h3>MedSphere Clinic</h3>
          <span class="prescription-number">${pres.number || "—"}</span>
        </div>
        <div class="prescription-date">${pres.date || "—"}</div>
      </div>
      <div class="prescription-entities">
        <div class="pres-entity">
          <span style="color:var(--text-muted)">Doctor</span>
          <strong>${pres.doctor}</strong>
        </div>
        <div class="pres-entity">
          <span style="color:var(--text-muted)">Patient</span>
          <strong>${pres.patient} (Age: ${pres.age})</strong>
        </div>
      </div>
      <div class="meds-list">
        <div class="meds-header">
          <div>Medicine</div><div>Dose</div><div>Instructions</div>
        </div>
        ${medsHtml || '<p style="color:var(--text-muted);font-size:0.85rem;padding:8px 0;">No medicines listed.</p>'}
      </div>
      <div class="prescription-notes">
        <strong>Doctor Notes:</strong>
        <p>${pres.notes || "—"}</p>
      </div>
      <div class="pres-actions">
        <button class="btn btn-outline btn-sm" onclick="window.print()">
          <i class="fas fa-print"></i> Print
        </button>
        <button class="btn btn-primary btn-sm" onclick="window.downloadPrescriptionPdf && window.downloadPrescriptionPdf()">
          <i class="fas fa-file-pdf"></i> Download PDF
        </button>
      </div>`;
    grid.appendChild(card);
  });
}

// ═══════════════════════════════════════════════════════════════
// BILLING PAGE
// ═══════════════════════════════════════════════════════════════
async function initSupabaseBilling() {
  const form = document.getElementById("billing-form");
  if (!form) return;

  const submitBtn = form.querySelector('[type="submit"]');

  form.addEventListener("submit", withButtonLock(submitBtn, async (e) => {
    e.preventDefault();

    const patient  = document.getElementById("bill-patient")?.value.trim();
    if (!patient) { toast("Validation", "Patient name is required.", "danger"); return; }

    const fee      = parseFloat(document.getElementById("bill-fee")?.value)      || 0;
    const lab      = parseFloat(document.getElementById("bill-lab")?.value)      || 0;
    const med      = parseFloat(document.getElementById("bill-med")?.value)      || 0;
    const room     = parseFloat(document.getElementById("bill-room")?.value)     || 0;
    const discount = parseFloat(document.getElementById("bill-discount")?.value) || 0;
    const method   = document.getElementById("bill-method")?.value || "Cash";

    const subtotal    = fee + lab + med + room;
    const taxable     = Math.max(0, subtotal - discount);
    const tax         = taxable * 0.18;
    const total       = taxable + tax;

    const invoiceId   = document.getElementById("pr-invoice")?.innerText ||
                        `INV-${Math.floor(100000 + Math.random() * 900000)}`;

    const payload = {
      id:       invoiceId,
      patient,
      date:     new Date().toISOString().split("T")[0],
      fee, lab, med, room,
      discount,
      tax:      parseFloat(tax.toFixed(2)),
      total:    parseFloat(total.toFixed(2)),
      method,
      status:   "paid",
    };

    const res = await generateBill(payload);
    if (res.success) {
      toast("Invoice Saved", `Invoice ${invoiceId} saved to database.`, "success");
    } else {
      // Non-blocking warning — the UI preview still works even if DB save fails
      toast("Warning", `Preview generated but DB save failed: ${res.error}`, "warning");
    }
  }));
}

// ═══════════════════════════════════════════════════════════════
// DASHBOARD PAGE
// ═══════════════════════════════════════════════════════════════
// ─── Chart.js dynamic rendering helper ────────────────────────
function drawChart(canvasId, type, labels, data, datasetLabel, color, isFill) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Destroy existing chart instance if any to prevent canvas recycling bugs
  const existingChart = Chart.getChart(canvas);
  if (existingChart) {
    existingChart.destroy();
  }

  const allZero = data.length === 0 || data.every(v => v === 0);

  new Chart(ctx, {
    type: type,
    data: {
      labels: labels,
      datasets: [{
        label: datasetLabel,
        data: data,
        borderColor: color,
        backgroundColor: isFill ? `${color}1A` : color,
        fill: isFill,
        tension: type === 'line' ? 0.4 : 0,
        borderRadius: type === 'bar' ? 6 : 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: {
          grid: { color: 'rgba(226, 232, 240, 0.1)' },
          ticks: {
            beginAtZero: true,
            precision: 0,
            callback: function(value) {
              if (type === 'bar') return '$' + value;
              return value;
            }
          }
        },
        x: { grid: { display: false } }
      }
    },
    plugins: [{
      id: 'noData',
      afterDraw: function(chart) {
        if (allZero) {
          const width = chart.width;
          const height = chart.height;
          chart.clear();
          
          chart.ctx.save();
          chart.ctx.textAlign = 'center';
          chart.ctx.textBaseline = 'middle';
          chart.ctx.font = '16px sans-serif';
          chart.ctx.fillStyle = '#64748b'; // var(--text-muted) color
          chart.ctx.fillText('No Data Available', width / 2, height / 2);
          chart.ctx.restore();
        }
      }
    }]
  });
}

async function initSupabaseDashboard() {
  const patCount  = document.getElementById("dash-patients-count");
  const aptCount  = document.getElementById("dash-appointments-count");
  const docCount  = document.getElementById("dash-doctors-count");
  const revEl     = document.getElementById("dash-revenue-total");
  const patTable  = document.getElementById("dash-patients-table");
  const aptTable  = document.getElementById("dash-appointments-table");

  if (!patCount) return;

  // ── Stats ────────────────────────────────────────────────────
  const statsRes = await loadDashboardStatistics();
  if (statsRes.success) {
    const { patients, appointments, doctors, revenue } = statsRes.data;
    if (patCount) patCount.innerText  = patients ?? 0;
    if (aptCount) aptCount.innerText  = appointments ?? 0;
    if (docCount) docCount.innerText  = doctors ?? 0;
    if (revEl)    revEl.innerText     = `$${(revenue ?? 0).toFixed(0)}`;
  } else {
    if (patCount) patCount.innerText  = 0;
    if (aptCount) aptCount.innerText  = 0;
    if (docCount) docCount.innerText  = 0;
    if (revEl)    revEl.innerText     = "$0";
    toast("Dashboard", "Could not load statistics.", "warning");
  }

  // ── Recent patients table ─────────────────────────────────────
  if (patTable) {
    const pRes = await loadRecentPatients(3);
    patTable.innerHTML = "";
    if (pRes.success && pRes.data.length) {
      pRes.data.forEach((p) => {
        const tr = document.createElement("tr");
        const bc = p.status === "admitted" ? "badge-warning" : "badge-success";
        tr.innerHTML = `
          <td><strong>#${p.id}</strong></td>
          <td>${p.name}</td>
          <td>${p.disease}</td>
          <td><span class="badge ${bc}">${p.status}</span></td>`;
        patTable.appendChild(tr);
      });
    } else {
      patTable.innerHTML =
        '<tr><td colspan="4" style="text-align:center;color:var(--text-muted);">No Patients Found</td></tr>';
    }
  }

  // ── Upcoming appointments table ───────────────────────────────
  if (aptTable) {
    const aRes = await loadRecentAppointments(3);
    aptTable.innerHTML = "";
    if (aRes.success && aRes.data.length) {
      aRes.data.forEach((a) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td><strong>#${a.id}</strong></td>
          <td>${a.patient}</td>
          <td>${a.doctor}</td>
          <td>${a.date} at ${a.time}</td>`;
        aptTable.appendChild(tr);
      });
    } else {
      aptTable.innerHTML =
        '<tr><td colspan="4" style="text-align:center;color:var(--text-muted);">No Appointments Found</td></tr>';
    }
  }

  // ── Patient growth line chart processing ──────────────────────
  let growthData = [0, 0, 0, 0, 0, 0];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const growthLabels = [];
  
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    growthLabels.push(monthNames[d.getMonth()]);
  }

  const patientsRes = await getPatients();
  if (patientsRes.success && patientsRes.data.length > 0) {
    const now = new Date();
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    patientsRes.data.forEach(p => {
      if (!p.created_at) return;
      const createdDate = new Date(p.created_at);
      if (createdDate >= sixMonthsAgo && createdDate <= now) {
        const monthDiff = (now.getFullYear() - createdDate.getFullYear()) * 12 + (now.getMonth() - createdDate.getMonth());
        if (monthDiff >= 0 && monthDiff < 6) {
          const index = 5 - monthDiff;
          growthData[index]++;
        }
      }
    });
  }

  drawChart('patientGrowthChart', 'line', growthLabels, growthData, 'Patients Growth', '#2563EB', true);

  // ── Daily revenue bar chart processing ────────────────────────
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const revenueLabels = [];
  let revenueData = [0, 0, 0, 0, 0, 0, 0];
  
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    revenueLabels.push(dayNames[d.getDay()]);
  }

  const billsRes = await getBills();
  if (billsRes.success && billsRes.data.length > 0) {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);
    
    billsRes.data.forEach(b => {
      if (!b.date) return;
      const billDate = new Date(b.date + 'T00:00:00');
      if (billDate >= sevenDaysAgo && billDate <= today) {
        const diffTime = today - billDate;
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays >= 0 && diffDays < 7) {
          const index = 6 - diffDays;
          revenueData[index] += parseFloat(b.total) || 0;
        }
      }
    });
  }

  drawChart('revenueChart', 'bar', revenueLabels, revenueData, 'Daily Revenue ($)', '#14B8A6', false);

  // ── Realtime subscription to refresh dashboard on changes ─────
  if (!window._supabaseDashboardChannel) {
    window._supabaseDashboardChannel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public' }, () => {
        initSupabaseDashboard();
      })
      .subscribe();
  }
}

// ═══════════════════════════════════════════════════════════════
// PAGE ROUTER — runs the correct init for the current page
// ═══════════════════════════════════════════════════════════════
(async () => {
  switch (page) {
    case "patients.html":
      await initSupabasePatients();
      break;
    case "doctors.html":
      await initSupabaseDoctors();
      break;
    case "appointments.html":
      await initSupabaseAppointments();
      break;
    case "prescriptions.html":
      await initSupabasePrescriptions();
      break;
    case "billing.html":
      await initSupabaseBilling();
      break;
    case "dashboard.html":
      await initSupabaseDashboard();
      break;
    default:
      break;
  }
})();
