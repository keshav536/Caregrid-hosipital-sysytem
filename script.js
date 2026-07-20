/**
 * CareGrid Hospital Management System - Frontend JavaScript
 * Core interaction logic, data seeding, dashboard charts, filters, and modals.
 */

document.addEventListener('DOMContentLoaded', () => {
  // --- Initialization & Seeding ---
  initTheme();
  initLoader();
  initMobileNav();
  initScrollEffects();
  seedLocalStorageData();
  
  // --- Page Specific Dispatchers ---
  const currentPath = window.location.pathname;
  const pageName = currentPath.split('/').pop() || 'index.html';
  
  // Highlight active link
  highlightActiveLink(pageName);
  
  if (pageName === 'index.html' || pageName === '') {
    initCounterAnimations();
    initTestimonialCarousel();
    initNewsletter();
  } else if (pageName === 'about.html') {
    // About actions if any
  } else if (pageName === 'departments.html') {
    initDepartmentFilters();
  } else if (pageName === 'doctors.html') {
    initDoctorsPage();
  } else if (pageName === 'patients.html') {
    initPatientsPage();
  } else if (pageName === 'appointments.html') {
    initAppointmentsPage();
  } else if (pageName === 'prescriptions.html') {
    initPrescriptionsPage();
  } else if (pageName === 'billing.html') {
    initBillingPage();
  } else if (pageName === 'dashboard.html') {
    initDashboardPage();
  } else if (pageName === 'contact.html') {
    initContactPage();
  } else if (pageName === 'faq.html') {
    initFAQPage();
  }
});

// ==========================================
// THEME & LOADING UTILITIES
// ==========================================

function initTheme() {
  const themeToggle = document.getElementById('theme-toggle');
  if (!themeToggle) return;
  
  const currentTheme = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', currentTheme);
  updateThemeIcon(themeToggle, currentTheme);
  
  themeToggle.addEventListener('click', () => {
    const activeTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = activeTheme === 'light' ? 'dark' : 'light';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(themeToggle, newTheme);
    showToast('Theme Changed', `Switched to ${newTheme} mode.`, 'success');
  });
}

function updateThemeIcon(btn, theme) {
  const icon = btn.querySelector('i');
  if (!icon) return;
  if (theme === 'dark') {
    icon.className = 'fas fa-sun';
  } else {
    icon.className = 'fas fa-moon';
  }
}

function initLoader() {
  const loader = document.getElementById('loader');
  if (!loader) return;
  
  window.addEventListener('load', () => {
    setTimeout(() => {
      loader.style.opacity = '0';
      setTimeout(() => {
        loader.style.display = 'none';
      }, 500);
    }, 300);
  });
  
  // Fallback if load event already fired
  if (document.readyState === 'complete') {
    setTimeout(() => {
      loader.style.opacity = '0';
      setTimeout(() => {
        loader.style.display = 'none';
      }, 500);
    }, 300);
  }
}

function initMobileNav() {
  // Handle all mobile nav toggles on the page (there may be multiple on dashboard)
  const toggles = document.querySelectorAll('.mobile-nav-toggle');
  const links = document.querySelector('.nav-links');
  if (!links) return;
  
  toggles.forEach(toggle => {
    // Skip the dashboard sidebar toggle — it's handled separately
    if (toggle.id === 'dashboard-sidebar-toggle') return;
    toggle.addEventListener('click', () => {
      links.classList.toggle('active');
      const icon = toggle.querySelector('i');
      if (links.classList.contains('active')) {
        if (icon) icon.className = 'fas fa-times';
      } else {
        if (icon) icon.className = 'fas fa-bars';
      }
    });
  });
  
  // Close menu on nav link click
  links.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      links.classList.remove('active');
      toggles.forEach(toggle => {
        if (toggle.id === 'dashboard-sidebar-toggle') return;
        const icon = toggle.querySelector('i');
        if (icon) icon.className = 'fas fa-bars';
      });
    });
  });
}

function initScrollEffects() {
  const header = document.querySelector('header');
  const scrollProgress = document.getElementById('scroll-progress');
  const scrollTopBtn = document.getElementById('scroll-to-top');
  
  window.addEventListener('scroll', () => {
    const scrollPos = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    
    // Header style on scroll
    if (header) {
      if (scrollPos > 50) {
        header.style.boxShadow = 'var(--shadow-md)';
        header.style.padding = '10px 0';
      } else {
        header.style.boxShadow = 'none';
        header.style.padding = '0';
      }
    }
    
    // Progress Bar
    if (scrollProgress && docHeight > 0) {
      const scrollPercent = (scrollPos / docHeight) * 100;
      scrollProgress.style.width = `${scrollPercent}%`;
    }
    
    // Scroll To Top Button
    if (scrollTopBtn) {
      if (scrollPos > 300) {
        scrollTopBtn.classList.add('show');
      } else {
        scrollTopBtn.classList.remove('show');
      }
    }
  });
  
  if (scrollTopBtn) {
    scrollTopBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
}

function highlightActiveLink(pageName) {
  const navLinks = document.querySelectorAll('.nav-link');
  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (href === pageName || (pageName === 'index.html' && href === 'index.html')) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
}

// ==========================================
// TOAST NOTIFICATIONS
// ==========================================

function showToast(title, message, type = 'primary') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  let iconClass = 'fa-info-circle';
  if (type === 'success') iconClass = 'fa-check-circle';
  if (type === 'danger') iconClass = 'fa-exclamation-circle';
  if (type === 'warning') iconClass = 'fa-exclamation-triangle';
  
  toast.innerHTML = `
    <i class="fas ${iconClass} toast-icon"></i>
    <div class="toast-content">
      <div class="toast-title">${title}</div>
      <div class="toast-message">${message}</div>
    </div>
    <button class="toast-close"><i class="fas fa-times"></i></button>
  `;
  
  container.appendChild(toast);
  
  const closeBtn = toast.querySelector('.toast-close');
  closeBtn.addEventListener('click', () => {
    toast.remove();
  });
  
  setTimeout(() => {
    toast.remove();
  }, 4000);
}

// ==========================================
// LOCAL STORAGE SEEDING DATA
// ==========================================

function seedLocalStorageData() {
  // Clear any existing dummy/seeding local storage data to ensure we display 0 or empty lists if DB is empty
  localStorage.removeItem('seed_hms');
  localStorage.removeItem('doctors');
  localStorage.removeItem('patients');
  localStorage.removeItem('appointments');
  localStorage.removeItem('prescriptions');
  localStorage.removeItem('invoices');
}

// Helper to access LocalStorage objects
function getStoredData(key) {
  return JSON.parse(localStorage.getItem(key)) || [];
}

function setStoredData(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

// ==========================================
// HOME PAGE FEATURES
// ==========================================

function initCounterAnimations() {
  const statsSection = document.querySelector('.stats-section');
  if (!statsSection) return;
  
  const counters = document.querySelectorAll('.stat-number');
  
  function animateCounter(counter) {
    const target = +counter.getAttribute('data-target');
    const duration = 1800; // ms
    const steps = 60;
    const increment = target / steps;
    let current = 0;
    let step = 0;
    
    const suffix = counter.getAttribute('data-target') === '24' ? '/7' : '+';
    
    const timer = setInterval(() => {
      step++;
      current = Math.min(Math.ceil(increment * step), target);
      counter.innerText = current;
      if (current >= target) {
        counter.innerText = target + suffix;
        clearInterval(timer);
      }
    }, duration / steps);
  }
  
  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        counters.forEach(counter => animateCounter(counter));
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.3 });
  
  observer.observe(statsSection);
}

function initTestimonialCarousel() {
  const track = document.querySelector('.testimonial-track');
  const dotsContainer = document.querySelector('.testimonial-dots');
  if (!track || !dotsContainer) return;
  
  const slides = Array.from(track.children);
  let currentIndex = 0;
  
  // Create dots
  slides.forEach((_, idx) => {
    const dot = document.createElement('button');
    dot.className = `testimonial-dot ${idx === 0 ? 'active' : ''}`;
    dot.addEventListener('click', () => {
      goToSlide(idx);
    });
    dotsContainer.appendChild(dot);
  });
  
  const dots = Array.from(dotsContainer.children);
  
  function goToSlide(index) {
    currentIndex = index;
    track.style.transform = `translateX(-${index * 100}%)`;
    dots.forEach((dot, idx) => {
      dot.classList.toggle('active', idx === index);
    });
  }
  
  // Auto-play
  setInterval(() => {
    let nextIndex = currentIndex + 1;
    if (nextIndex >= slides.length) nextIndex = 0;
    goToSlide(nextIndex);
  }, 5000);
}

function initNewsletter() {
  const form = document.getElementById('newsletter-form');
  if (!form) return;
  
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = form.querySelector('input').value;
    if (validateEmail(email)) {
      showToast('Subscribed!', 'Thank you for subscribing to our newsletter.', 'success');
      form.reset();
    } else {
      showToast('Invalid Email', 'Please enter a valid email address.', 'danger');
    }
  });
}

function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

// ==========================================
// DEPARTMENTS FILTER
// ==========================================

function initDepartmentFilters() {
  const buttons = document.querySelectorAll('.dep-filter-btn');
  const cards = document.querySelectorAll('.dep-card');
  if (buttons.length === 0) return;
  
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      buttons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      const filter = btn.getAttribute('data-filter');
      
      cards.forEach(card => {
        const type = card.getAttribute('data-type');
        if (filter === 'all' || type === filter) {
          card.style.display = 'flex';
          card.style.animation = 'fade-up 0.5s ease forwards';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });
}

// ==========================================
// DOCTORS PAGE FILTERING
// ==========================================

function initDoctorsPage() {
  const doctorsContainer = document.getElementById('doctors-grid-container');
  const searchInput = document.getElementById('doctor-search');
  const deptSelect = document.getElementById('doctor-dept-filter');
  
  if (!doctorsContainer) return;
  
  const doctors = getStoredData('doctors');
  
  function renderDoctors(list) {
    doctorsContainer.innerHTML = '';
    
    if (list.length === 0) {
      doctorsContainer.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 40px 0;">No Doctors found matching current filters.</div>';
      return;
    }
    
    list.forEach(doc => {
      const card = document.createElement('div');
      card.className = 'card doc-card';
      card.innerHTML = `
        <div class="doc-img-box">
          <img src="${doc.image}" alt="${doc.name}">
          <span class="doc-status-badge doc-status-${doc.status}">${doc.status === 'online' ? 'Available' : 'On Leave'}</span>
        </div>
        <div class="doc-info">
          <div class="doc-dept">${doc.dept}</div>
          <h3 class="doc-name">${doc.name}</h3>
          <p class="doc-qualification">${doc.qual}</p>
          <div class="doc-rating">
            <i class="fas fa-star"></i>
            <i class="fas fa-star"></i>
            <i class="fas fa-star"></i>
            <i class="fas fa-star"></i>
            <i class="fas fa-star"></i>
            <span>(${doc.rating})</span>
          </div>
          <div class="doc-details">
            <span>Experience<strong>${doc.exp} Years</strong></span>
            <span>Fee<strong>$${doc.fee}</strong></span>
          </div>
          <a href="appointments.html?doctor=${encodeURIComponent(doc.name)}&dept=${encodeURIComponent(doc.dept)}" class="btn btn-primary doc-action-btn">Book Appointment</a>
        </div>
      `;
      doctorsContainer.appendChild(card);
    });
  }
  
  function filterDoctors() {
    const query = searchInput.value.toLowerCase();
    const dept = deptSelect.value;
    
    const filtered = doctors.filter(doc => {
      const matchesSearch = doc.name.toLowerCase().includes(query) || doc.qual.toLowerCase().includes(query);
      const matchesDept = dept === 'all' || doc.dept === dept;
      return matchesSearch && matchesDept;
    });
    
    renderDoctors(filtered);
  }
  
  if (searchInput) searchInput.addEventListener('input', filterDoctors);
  if (deptSelect) deptSelect.addEventListener('change', filterDoctors);
  
  // Initial render
  renderDoctors(doctors);
}

// ==========================================
// PATIENTS TABLE
// ==========================================

function initPatientsPage() {
  const patientTableBody = document.getElementById('patient-table-body');
  const searchInput = document.getElementById('patient-search');
  const statusFilter = document.getElementById('patient-status-filter');
  const addPatientBtn = document.getElementById('add-patient-btn');
  const patientModal = document.getElementById('patient-modal');
  const closeModalBtn = document.getElementById('close-patient-modal');
  const patientForm = document.getElementById('patient-form');
  
  if (!patientTableBody) return;
  
  let patients = getStoredData('patients');
  let currentPage = 1;
  const itemsPerPage = 5;
  let filteredPatients = [...patients];
  
  function renderPatients() {
    patientTableBody.innerHTML = '';
    
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedItems = filteredPatients.slice(startIndex, endIndex);
    
    if (paginatedItems.length === 0) {
      patientTableBody.innerHTML = '<tr><td colspan="9" style="text-align:center; color: var(--text-muted);">No Patient records available.</td></tr>';
      return;
    }
    
    paginatedItems.forEach(pat => {
      const row = document.createElement('tr');
      
      let badgeClass = 'badge-primary';
      if (pat.status === 'admitted') badgeClass = 'badge-warning';
      if (pat.status === 'recovered') badgeClass = 'badge-success';
      if (pat.status === 'discharged') badgeClass = 'badge-danger';
      
      row.innerHTML = `
        <td><strong>#${pat.id}</strong></td>
        <td>${pat.name}</td>
        <td>${pat.age}</td>
        <td>${pat.gender}</td>
        <td>${pat.bloodGroup}</td>
        <td>${pat.disease}</td>
        <td>${pat.doctor}</td>
        <td><span class="badge ${badgeClass}">${pat.status}</span></td>
        <td>
          <button class="nav-btn" style="color:var(--danger)" onclick="deletePatient('${pat.id}')"><i class="fas fa-trash"></i></button>
        </td>
      `;
      patientTableBody.appendChild(row);
    });
    
    updatePaginationUI();
  }
  
  function updatePaginationUI() {
    const totalPages = Math.ceil(filteredPatients.length / itemsPerPage) || 1;
    const info = document.getElementById('pagination-info');
    const prevBtn = document.getElementById('btn-prev');
    const nextBtn = document.getElementById('btn-next');
    
    if (info) {
      const start = (currentPage - 1) * itemsPerPage + 1;
      const end = Math.min(currentPage * itemsPerPage, filteredPatients.length);
      info.innerText = `Showing ${filteredPatients.length > 0 ? start : 0} to ${end} of ${filteredPatients.length} Patients`;
    }
    
    if (prevBtn) prevBtn.disabled = currentPage === 1;
    if (nextBtn) nextBtn.disabled = currentPage === totalPages;
  }
  
  window.deletePatient = function(id) {
    patients = patients.filter(p => p.id !== id);
    setStoredData('patients', patients);
    filterPatients();
    showToast('Deleted', `Patient records with ID ${id} deleted successfully.`, 'warning');
  };
  
  function filterPatients() {
    const query = searchInput ? searchInput.value.toLowerCase() : '';
    const status = statusFilter ? statusFilter.value : 'all';
    
    filteredPatients = patients.filter(pat => {
      const matchesSearch = pat.name.toLowerCase().includes(query) || pat.disease.toLowerCase().includes(query) || pat.id.toLowerCase().includes(query);
      const matchesStatus = status === 'all' || pat.status === status;
      return matchesSearch && matchesStatus;
    });
    
    currentPage = 1;
    renderPatients();
  }
  
  if (searchInput) searchInput.addEventListener('input', filterPatients);
  if (statusFilter) statusFilter.addEventListener('change', filterPatients);
  
  // Pagination actions
  const prevBtn = document.getElementById('btn-prev');
  const nextBtn = document.getElementById('btn-next');
  
  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      if (currentPage > 1) {
        currentPage--;
        renderPatients();
      }
    });
  }
  
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      const totalPages = Math.ceil(filteredPatients.length / itemsPerPage);
      if (currentPage < totalPages) {
        currentPage++;
        renderPatients();
      }
    });
  }
  
  // Modal Interactions
  if (addPatientBtn && patientModal) {
    addPatientBtn.addEventListener('click', () => {
      patientModal.classList.add('active');
    });
  }
  
  if (closeModalBtn && patientModal) {
    closeModalBtn.addEventListener('click', () => {
      patientModal.classList.remove('active');
    });
  }
  
  if (patientForm) {
    patientForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const name = document.getElementById('pat-name').value;
      const age = document.getElementById('pat-age').value;
      const gender = document.getElementById('pat-gender').value;
      const blood = document.getElementById('pat-blood').value;
      const disease = document.getElementById('pat-disease').value;
      const doc = document.getElementById('pat-doc').value;
      const status = document.getElementById('pat-status').value;
      
      const newId = `PAT${String(patients.length + 1).padStart(3, '0')}`;
      
      const newPatient = { id: newId, name, age: parseInt(age), gender, bloodGroup: blood, disease, doctor: doc, status };
      patients.push(newPatient);
      
      setStoredData('patients', patients);
      filterPatients();
      
      patientModal.classList.remove('active');
      patientForm.reset();
      showToast('Patient Added', `Record created with Patient ID ${newId}`, 'success');
    });
  }
  
  renderPatients();
}

// ==========================================
// APPOINTMENTS PAGE
// ==========================================

function initAppointmentsPage() {
  const form = document.getElementById('appointment-form');
  const docSelect = document.getElementById('apt-doctor');
  const deptSelect = document.getElementById('apt-department');
  
  const upcomingContainer = document.getElementById('upcoming-list');
  const completedContainer = document.getElementById('completed-list');
  const cancelledContainer = document.getElementById('cancelled-list');
  
  if (!upcomingContainer) return;
  
  let appointments = getStoredData('appointments');
  const doctors = getStoredData('doctors');
  
  // Setup tabs
  const tabBtns = document.querySelectorAll('.tab-btn');
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      const tabTarget = btn.getAttribute('data-tab');
      document.querySelectorAll('.tab-content').forEach(cont => {
        cont.classList.remove('active');
      });
      document.getElementById(`${tabTarget}-list`).classList.add('active');
    });
  });
  
  // Set Doctors Dropdown on Dept change
  if (deptSelect && docSelect) {
    deptSelect.addEventListener('change', () => {
      const dept = deptSelect.value;
      docSelect.innerHTML = '<option value="">Select Doctor</option>';
      doctors.filter(d => d.dept === dept).forEach(d => {
        const opt = document.createElement('option');
        opt.value = d.name;
        opt.innerText = d.name;
        docSelect.appendChild(opt);
      });
    });
  }
  
  // Pre-fill query parameters if any (redirect from Doctor page)
  const params = new URLSearchParams(window.location.search);
  const qDoc = params.get('doctor');
  const qDept = params.get('dept');
  
  if (qDept && deptSelect) {
    deptSelect.value = qDept;
    deptSelect.dispatchEvent(new Event('change'));
  }
  if (qDoc && docSelect) {
    docSelect.value = qDoc;
  }
  
  function renderAppointments() {
    upcomingContainer.innerHTML = '';
    completedContainer.innerHTML = '';
    cancelledContainer.innerHTML = '';
    
    let upcomingHtml = '';
    let completedHtml = '';
    let cancelledHtml = '';
    
    appointments.forEach(apt => {
      const htmlCard = `
        <div class="card" style="margin-bottom: 16px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
            <span class="badge ${apt.status === 'upcoming' ? 'badge-primary' : apt.status === 'completed' ? 'badge-success' : 'badge-danger'}">${apt.status}</span>
            <span style="font-size:0.8rem; color:var(--text-muted)">#${apt.id}</span>
          </div>
          <h4 style="margin-bottom:6px; color:var(--secondary)">Patient: ${apt.patient} (${apt.age} / ${apt.gender})</h4>
          <p style="font-size:0.875rem; color:var(--text-muted); margin-bottom:4px;"><i class="fas fa-stethoscope" style="margin-right:6px;"></i> ${apt.doctor} (${apt.dept})</p>
          <p style="font-size:0.875rem; color:var(--text-muted); margin-bottom:4px;"><i class="fas fa-calendar-alt" style="margin-right:6px;"></i> ${apt.date} at ${apt.time}</p>
          <p style="font-size:0.875rem; color:var(--text-muted); margin-bottom:12px;"><i class="fas fa-comment-medical" style="margin-right:6px;"></i> Symptoms: ${apt.symptoms}</p>
          ${apt.status === 'upcoming' ? `
            <div style="display:flex; gap:10px;">
              <button class="btn btn-sm btn-accent" onclick="completeApt('${apt.id}')">Mark Complete</button>
              <button class="btn btn-sm btn-outline" style="border-color:var(--danger); color:var(--danger);" onclick="cancelApt('${apt.id}')">Cancel Appointment</button>
            </div>
          ` : ''}
        </div>
      `;
      
      if (apt.status === 'upcoming') upcomingHtml += htmlCard;
      if (apt.status === 'completed') completedHtml += htmlCard;
      if (apt.status === 'cancelled') cancelledHtml += htmlCard;
    });
    
    upcomingContainer.innerHTML = upcomingHtml || '<p style="color:var(--text-muted); text-align:center; padding: 20px 0;">No upcoming appointments.</p>';
    completedContainer.innerHTML = completedHtml || '<p style="color:var(--text-muted); text-align:center; padding: 20px 0;">No completed appointments.</p>';
    cancelledContainer.innerHTML = cancelledHtml || '<p style="color:var(--text-muted); text-align:center; padding: 20px 0;">No cancelled appointments.</p>';
  }
  
  window.completeApt = function(id) {
    appointments = appointments.map(apt => apt.id === id ? { ...apt, status: 'completed' } : apt);
    setStoredData('appointments', appointments);
    renderAppointments();
    showToast('Success', `Appointment ${id} completed.`, 'success');
  };
  
  window.cancelApt = function(id) {
    appointments = appointments.map(apt => apt.id === id ? { ...apt, status: 'cancelled' } : apt);
    setStoredData('appointments', appointments);
    renderAppointments();
    showToast('Cancelled', `Appointment ${id} has been cancelled.`, 'danger');
  };
  
  // Form submission
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const patient = document.getElementById('apt-name').value;
      const age = document.getElementById('apt-age').value;
      const gender = document.getElementById('apt-gender').value;
      const phone = document.getElementById('apt-phone').value;
      const email = document.getElementById('apt-email').value;
      const dept = deptSelect.value;
      const doctor = docSelect.value;
      const date = document.getElementById('apt-date').value;
      const time = document.getElementById('apt-time').value;
      const symptoms = document.getElementById('apt-symptoms').value;
      
      const newId = `APT${String(appointments.length + 1).padStart(3, '0')}`;
      const newApt = { id: newId, patient, age: parseInt(age), gender, phone, email, doctor, dept, date, time, symptoms, status: 'upcoming' };
      
      appointments.push(newApt);
      setStoredData('appointments', appointments);
      renderAppointments();
      form.reset();
      
      showToast('Booked!', `Appointment booked successfully. Your ID is ${newId}`, 'success');
    });
  }
  
  // Render current calendar visual placeholder
  initMiniCalendar();
  
  renderAppointments();
}

function initMiniCalendar() {
  const daysGrid = document.querySelector('.calendar-grid');
  if (!daysGrid) return;
  
  // Draw simple days from Current month
  const today = new Date();
  const currentMonth = today.toLocaleString('default', { month: 'long', year: 'numeric' });
  document.getElementById('calendar-month').innerText = currentMonth;
  
  // Clear previous dates
  daysGrid.querySelectorAll('.calendar-day').forEach(d => d.remove());
  
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).getDay();
  const totalDays = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  
  // Blank items for offset
  for (let i = 0; i < firstDay; i++) {
    const el = document.createElement('div');
    el.className = 'calendar-day empty';
    daysGrid.appendChild(el);
  }
  
  // Days items
  for (let day = 1; day <= totalDays; day++) {
    const el = document.createElement('div');
    el.className = 'calendar-day';
    el.innerText = day;
    if (day === today.getDate()) el.classList.add('today');
    if (day === today.getDate() + 1) el.classList.add('active'); // set dummy selection
    
    el.addEventListener('click', () => {
      daysGrid.querySelectorAll('.calendar-day').forEach(d => d.classList.remove('active'));
      el.classList.add('active');
      const selectedDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dateInput = document.getElementById('apt-date');
      if (dateInput) dateInput.value = selectedDate;
    });
    
    daysGrid.appendChild(el);
  }
}

// ==========================================
// PRESCRIPTIONS UTILITIES
// ==========================================

function initPrescriptionsPage() {
  const grid = document.getElementById('prescriptions-grid');
  if (!grid) return;
  
  const prescriptions = getStoredData('prescriptions');
  
  function renderPrescriptions() {
    grid.innerHTML = '';
    prescriptions.forEach(pres => {
      const card = document.createElement('div');
      card.className = 'card prescription-card printable-area';
      
      let medsHtml = '';
      pres.medicines.forEach(m => {
        medsHtml += `
          <div class="med-item">
            <div><strong>${m.name}</strong></div>
            <div class="med-dose-indicators">
              <span class="dose-dot ${m.morning ? 'active' : ''}">M</span>
              <span class="dose-dot ${m.afternoon ? 'active' : ''}">A</span>
              <span class="dose-dot ${m.night ? 'active' : ''}">N</span>
            </div>
            <div style="color:var(--text-muted); font-size:0.8rem">${m.note}</div>
          </div>
        `;
      });
      
      card.innerHTML = `
        <div class="prescription-header">
          <div class="prescription-h-left">
            <h3>MedSphere Clinic</h3>
            <span class="prescription-number">${pres.number}</span>
          </div>
          <div class="prescription-date">${pres.date}</div>
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
            <div>Medicine</div>
            <div>Dose</div>
            <div>Instructions</div>
          </div>
          ${medsHtml}
        </div>
        <div class="prescription-notes">
          <strong>Doctor Notes:</strong>
          <p>${pres.notes}</p>
        </div>
        <div class="pres-actions">
          <button class="btn btn-outline btn-sm" onclick="window.print()"><i class="fas fa-print"></i> Print</button>
          <button class="btn btn-primary btn-sm" onclick="downloadPrescriptionPdf()"><i class="fas fa-file-pdf"></i> Download PDF</button>
        </div>
      `;
      grid.appendChild(card);
    });
  }
  
  window.downloadPrescriptionPdf = function() {
    showToast('Download PDF', 'Generating prescription PDF copy in downloads folder...', 'success');
  };
  
  renderPrescriptions();
}

// ==========================================
// BILLING PAGE CALCULATIONS & GENERATION
// ==========================================

function initBillingPage() {
  const form = document.getElementById('billing-form');
  
  // Input fields
  const pNameInput = document.getElementById('bill-patient');
  const feeInput = document.getElementById('bill-fee');
  const labInput = document.getElementById('bill-lab');
  const medInput = document.getElementById('bill-med');
  const roomInput = document.getElementById('bill-room');
  const discountInput = document.getElementById('bill-discount');
  
  // Preview fields
  const prName = document.getElementById('pr-patient');
  const prDate = document.getElementById('pr-date');
  const prFee = document.getElementById('pr-fee');
  const prLab = document.getElementById('pr-lab');
  const prMed = document.getElementById('pr-med');
  const prRoom = document.getElementById('pr-room');
  const prSub = document.getElementById('pr-subtotal');
  const prDisc = document.getElementById('pr-discount');
  const prGst = document.getElementById('pr-gst');
  const prTotal = document.getElementById('pr-total');
  const prInvoice = document.getElementById('pr-invoice');
  
  if (!form || !prName) return;
  
  // Calculate on input triggers
  const fields = [feeInput, labInput, medInput, roomInput, discountInput];
  fields.forEach(f => {
    f.addEventListener('input', calculateTotal);
  });
  pNameInput.addEventListener('input', () => {
    prName.innerText = pNameInput.value || 'Patient Name';
  });
  
  // Initial values setup
  const invoiceNum = `INV-${Math.floor(100000 + Math.random() * 900000)}`;
  prInvoice.innerText = invoiceNum;
  prDate.innerText = new Date().toLocaleDateString();
  
  function calculateTotal() {
    const fee = parseFloat(feeInput.value) || 0;
    const lab = parseFloat(labInput.value) || 0;
    const med = parseFloat(medInput.value) || 0;
    const room = parseFloat(roomInput.value) || 0;
    const disc = parseFloat(discountInput.value) || 0;
    
    const subtotal = fee + lab + med + room;
    const taxableAmount = Math.max(0, subtotal - disc);
    const gst = taxableAmount * 0.18; // 18% GST standard
    const total = taxableAmount + gst;
    
    // Update preview numbers
    prFee.innerText = `$${fee.toFixed(2)}`;
    prLab.innerText = `$${lab.toFixed(2)}`;
    prMed.innerText = `$${med.toFixed(2)}`;
    prRoom.innerText = `$${room.toFixed(2)}`;
    
    prSub.innerText = `$${subtotal.toFixed(2)}`;
    prDisc.innerText = `-$${disc.toFixed(2)}`;
    prGst.innerText = `$${gst.toFixed(2)}`;
    prTotal.innerText = `$${total.toFixed(2)}`;
    
    return { fee, lab, med, room, subtotal, disc, gst, total };
  }
  
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const patientName = pNameInput.value;
    if (!patientName) {
      showToast('Error', 'Please enter a Patient Name', 'danger');
      return;
    }
    
    const calc = calculateTotal();
    const payMethod = document.getElementById('bill-method').value;
    
    const invoiceList = getStoredData('invoices');
    const newInvoice = {
      id: prInvoice.innerText,
      patient: patientName,
      date: new Date().toISOString().split('T')[0],
      fee: calc.fee,
      lab: calc.lab,
      med: calc.med,
      room: calc.room,
      discount: calc.disc,
      tax: calc.gst,
      total: calc.total,
      method: payMethod,
      status: 'paid'
    };
    
    invoiceList.push(newInvoice);
    setStoredData('invoices', invoiceList);
    
    showToast('Invoice Saved', `Invoice generated successfully: ${newInvoice.id}`, 'success');
  });
  
  window.downloadInvoicePdf = function() {
    showToast('Download Invoice', 'Downloading copy of Invoice...', 'success');
  };
}

// ==========================================
// ADMIN DASHBOARD & CHARTS
// ==========================================

function initDashboardPage() {
  // Sidebar toggler
  const dashToggle = document.getElementById('dashboard-sidebar-toggle');
  const sidebar = document.querySelector('.sidebar');
  if (dashToggle && sidebar) {
    dashToggle.addEventListener('click', () => {
      sidebar.classList.toggle('active');
    });
  }
}

// ==========================================
// CONTACT & FAQ PAGE INTERACTIVE FEATURES
// ==========================================

function initContactPage() {
  const form = document.getElementById('contact-form');
  if (!form) return;
  
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const name = document.getElementById('con-name').value;
    const email = document.getElementById('con-email').value;
    const subject = document.getElementById('con-subject').value;
    const msg = document.getElementById('con-message').value;
    
    if (!name || !email || !subject || !msg) {
      showToast('Validation Error', 'Please complete all required fields.', 'danger');
      return;
    }
    
    showToast('Message Sent', `Thank you ${name}. Your ticket has been logged successfully.`, 'success');
    form.reset();
  });
}

function initFAQPage() {
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(item => {
    const header = item.querySelector('.faq-header');
    header.addEventListener('click', () => {
      const isActive = item.classList.contains('active');
      
      // Close all items
      faqItems.forEach(i => i.classList.remove('active'));
      
      // Open selected if it was not already active
      if (!isActive) {
        item.classList.add('active');
      }
    });
  });
}
