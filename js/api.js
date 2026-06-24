// ── API Base URL ─────────────────────────────────────────────────────────────
// When served from Render (same origin), use /api.
// When served from Netlify or any other CDN, point to the Render backend URL.
const RENDER_BACKEND_URL = 'https://palamuru-university-portal.loca.lt'; // localtunnel // ← Update after Render deploy
const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const isSameOriginRender = window.location.hostname.includes('onrender.com');
const API_BASE = (isLocalhost || isSameOriginRender) ? '/api' : `${RENDER_BACKEND_URL}/api`;

const PU = {
  // ── Auth ──────────────────────────────────────────────────
  getToken: () => localStorage.getItem('pu_token'),
  getUser:  () => JSON.parse(localStorage.getItem('pu_user') || 'null'),

  logout() {
    localStorage.removeItem('pu_token');
    localStorage.removeItem('pu_user');
    window.location.href = '/login.html';
  },

  requireAuth(allowedRoles = []) {
    const token = this.getToken();
    const user  = this.getUser();
    if (!token || !user) { window.location.href = '/login.html'; return false; }
    if (allowedRoles.length && !allowedRoles.includes(user.role)) {
      window.location.href = '/login.html'; return false;
    }
    return true;
  },

  // ── HTTP helpers ──────────────────────────────────────────
  async request(path, opts = {}) {
    const headers = { 
      'Content-Type': 'application/json', 
      'Bypass-Tunnel-Reminder': 'true',
      ...opts.headers 
    };
    const token = this.getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${API_BASE}${path}`, { ...opts, headers });
    if (res.status === 401) { this.logout(); return; }
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Request failed');
    return data;
  },

  get:    (path)       => PU.request(path),
  post:   (path, body) => PU.request(path, { method:'POST',   body: JSON.stringify(body) }),
  put:    (path, body) => PU.request(path, { method:'PUT',    body: JSON.stringify(body) }),
  delete: (path)       => PU.request(path, { method:'DELETE' }),

  // ── Domain API calls ──────────────────────────────────────
  login:            (email, pw)    => PU.post('/auth/login', { email, password: pw }),
  getStudents:      ()             => PU.get('/students'),
  getStudent:       (id)           => PU.get(`/students/${id}`),
  createStudent:    (data)         => PU.post('/students', data),
  updateStudent:    (id, data)     => PU.put(`/students/${id}`, data),
  deleteStudent:    (id)           => PU.delete(`/students/${id}`),
  getFaculty:       ()             => PU.get('/faculty'),
  getSubjects:      ()             => PU.get('/subjects'),
  createSubject:    (data)         => PU.post('/subjects', data),
  updateSubject:    (id, data)     => PU.put(`/subjects/${id}`, data),
  deleteSubject:    (id)           => PU.delete(`/subjects/${id}`),
  getAttendanceByStudent: (sid)    => PU.get(`/attendance/student/${sid}`),
  getAttendanceBySubject: (subId)  => PU.get(`/attendance/subject/${subId}`),
  markAttendance:   (data)         => PU.post('/attendance', data),

  // ── UI Helpers ────────────────────────────────────────────
  toast(msg, type = 'info', duration = 3500) {
    let t = document.getElementById('pu-toast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'pu-toast';
      t.className = 'fixed bottom-6 right-6 z-[200] px-6 py-4 rounded-xl flex items-center gap-3 max-w-sm shadow-xl';
      t.style.cssText = 'background:rgba(255,255,255,.9);backdrop-filter:blur(14px);border:1px solid rgba(255,255,255,.5);transform:translateY(100px);opacity:0;transition:all .4s cubic-bezier(.16,1,.3,1)';
      t.innerHTML = '<span class="material-symbols-outlined text-2xl" id="pu-toast-icon"></span><p class="font-outfit text-sm font-semibold" id="pu-toast-msg"></p>';
      document.body.appendChild(t);
    }
    const colors = { success:'#16a34a', error:'#ba1a1a', info:'#001e40', warning:'#705d00' };
    const icons  = { success:'check_circle', error:'error', info:'info', warning:'warning' };
    t.querySelector('#pu-toast-icon').textContent = icons[type] || 'info';
    t.querySelector('#pu-toast-icon').style.color  = colors[type] || '#001e40';
    t.querySelector('#pu-toast-msg').textContent  = msg;
    t.style.transform = 'translateY(0)'; t.style.opacity = '1';
    clearTimeout(t._timer);
    t._timer = setTimeout(() => { t.style.transform='translateY(100px)'; t.style.opacity='0'; }, duration);
  },

  formatDate(iso) {
    return new Date(iso).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' });
  },

  attendanceBadge(pct) {
    if (pct >= 85) return { cls:'bg-secondary-container text-on-secondary-container', label:'Distinction' };
    if (pct >= 75) return { cls:'bg-surface-container-high text-on-surface-variant',  label:'Standard' };
    if (pct >= 60) return { cls:'bg-yellow-100 text-yellow-800',                       label:'At Risk' };
    return             { cls:'bg-error-container text-on-error-container',             label:'Warning' };
  },

  progressColor(pct) {
    if (pct >= 85) return '#705d00';
    if (pct >= 75) return '#003366';
    if (pct >= 60) return '#d97706';
    return '#ba1a1a';
  },

  initials(name = '') {
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  },

  avatarColor(name = '') {
    const colors = ['#003366','#705d00','#3a5f94','#1f477b','#544600'];
    let h = 0; for (let c of name) h = c.charCodeAt(0) + h; return colors[h % colors.length];
  }
};
