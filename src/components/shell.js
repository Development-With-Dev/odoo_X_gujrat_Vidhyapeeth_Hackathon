import { store } from '../store/data.js';
import { router } from '../utils/router.js';

export function renderShell(pageTitle, subtitle, headerActions, bodyContent) {
  const user = store.currentUser;
  if (!user) { router.navigate('/login'); return ''; }

  const kpis = store.kpis;

  const allNav = [
    { label: 'Command Center', icon: 'dashboard', path: '/dashboard', roles: ['manager', 'dispatcher', 'safety', 'analyst'] },
    { label: 'Vehicle Registry', icon: 'local_shipping', path: '/vehicles', roles: ['manager', 'dispatcher'] },
    { label: 'Trip Dispatcher', icon: 'route', path: '/trips', roles: ['manager', 'dispatcher'] },
    { label: 'Maintenance Logs', icon: 'build', path: '/maintenance', roles: ['manager', 'dispatcher', 'safety'] },
    { label: 'Expenses & Fuel', icon: 'payments', path: '/expenses', roles: ['manager', 'analyst'] },
    { label: 'Driver Profiles', icon: 'badge', path: '/drivers', roles: ['manager', 'safety'] },
    { label: 'Analytics', icon: 'analytics', path: '/analytics', roles: ['manager', 'analyst'] },
  ];

  const navItems = allNav.filter(n => n.roles.includes(user.role));

  const currentPath = window.location.hash.slice(1) || '/dashboard';

  return `
    <div class="app-shell">
      <aside class="sidebar" id="sidebar">
        <div class="sidebar-brand">
          <div class="sidebar-brand-icon"><span class="material-symbols-rounded">hub</span></div>
          <div>
            <h1 style="color:var(--text-primary)">FleetFlow</h1>
            <span>Fleet Management</span>
          </div>
        </div>

        <nav class="sidebar-nav">
          <div class="nav-section-label">Main Menu</div>
          ${navItems.map(item => `
            <div class="nav-item ${currentPath === item.path ? 'active' : ''}" data-nav="${item.path}" id="nav-${item.path.slice(1)}">
              <span class="material-symbols-rounded">${item.icon}</span>
              ${item.label}
              ${item.label === 'Maintenance Logs' && kpis.inShop > 0 ? `<span class="nav-item-badge">${kpis.inShop}</span>` : ''}
              ${item.label === 'Trip Dispatcher' && kpis.pendingCargo > 0 ? `<span class="nav-item-badge">${kpis.pendingCargo}</span>` : ''}
            </div>
          `).join('')}
        </nav>

        <div class="sidebar-footer">
          <div class="sidebar-user" id="sidebar-profile-link" style="cursor:pointer" title="View Profile">
            <div class="sidebar-avatar">${user.avatar}</div>
            <div class="sidebar-user-info">
              <div class="sidebar-user-name">${user.name}</div>
              <div class="sidebar-user-role">${user.role}</div>
            </div>
          </div>
          <button class="btn btn-ghost btn-sm" id="sidebar-logout-btn" style="color:var(--c-danger);gap:4px;margin:var(--sp-2) var(--sp-3) 0" title="Logout">
            <span class="material-symbols-rounded" style="font-size:16px">logout</span> Logout
          </button>
        </div>
      </aside>

      <main class="main-content">
        <header class="page-header">
          <div style="display:flex;align-items:center;gap:var(--sp-4)">
            <button class="btn btn-icon btn-ghost sidebar-toggle" id="sidebar-toggle" style="display:none">
              <span class="material-symbols-rounded">menu</span>
            </button>
            <div class="page-title-group">
              <h1 class="page-title">${pageTitle}</h1>
              ${subtitle ? `<p class="page-subtitle">${subtitle}</p>` : ''}
            </div>
          </div>
          <div class="page-actions">${headerActions || ''}</div>
        </header>

        <div class="page-body animate-fade-in">
          ${bodyContent}
        </div>
      </main>

      <!-- Logout Confirmation Modal -->
      <div class="modal-overlay" id="logout-modal" style="display:none">
        <div class="modal" style="max-width:380px">
          <div class="modal-header">
            <span class="modal-title">Confirm Logout</span>
            <button class="btn btn-icon btn-ghost" id="logout-cancel-x"><span class="material-symbols-rounded">close</span></button>
          </div>
          <div class="modal-body" style="align-items:center;text-align:center;padding:var(--sp-8) var(--sp-6)">
            <div style="width:56px;height:56px;border-radius:var(--radius-full);background:var(--c-danger-bg);display:flex;align-items:center;justify-content:center;margin-bottom:var(--sp-3)">
              <span class="material-symbols-rounded" style="font-size:28px;color:var(--c-danger)">logout</span>
            </div>
            <p style="font-size:var(--fs-base);font-weight:600;margin-bottom:var(--sp-2)">Ready to leave?</p>
            <p style="font-size:var(--fs-sm);color:var(--text-muted);line-height:1.6">You are logged in as <strong style="color:var(--text-primary)">${user.name}</strong><br><span style="text-transform:capitalize">${user.role}</span></p>
          </div>
          <div class="modal-footer" style="justify-content:center;gap:var(--sp-3);padding:var(--sp-4) var(--sp-6) var(--sp-6)">
            <button class="btn btn-secondary" id="logout-cancel" style="flex:1"><span class="material-symbols-rounded" style="font-size:16px">arrow_back</span> Cancel</button>
            <button class="btn btn-danger" id="logout-confirm" style="flex:1;border-color:var(--c-danger)"><span class="material-symbols-rounded" style="font-size:16px">logout</span> Logout</button>
          </div>
        </div>
      </div>
    </div>
  `;
}

export function bindShellEvents() {
  document.querySelectorAll('[data-nav]').forEach(el => {
    el.addEventListener('click', () => {
      router.navigate(el.dataset.nav);
    });
  });

  document.getElementById('sidebar-profile-link')?.addEventListener('click', () => {
    router.navigate('/profile');
  });

  const logoutBtn = document.getElementById('sidebar-logout-btn');
  const logoutModal = document.getElementById('logout-modal');
  const closeLogoutModal = () => { if (logoutModal) logoutModal.style.display = 'none'; };

  if (logoutBtn && logoutModal) {
    logoutBtn.addEventListener('click', () => {
      logoutModal.style.display = 'flex';
    });

    document.getElementById('logout-confirm')?.addEventListener('click', () => {
      closeLogoutModal();
      store.logout();
      router.navigate('/login');
    });

    document.getElementById('logout-cancel')?.addEventListener('click', closeLogoutModal);
    document.getElementById('logout-cancel-x')?.addEventListener('click', closeLogoutModal);

    logoutModal.addEventListener('click', (e) => {
      if (e.target === logoutModal) closeLogoutModal();
    });
  }

  const toggle = document.getElementById('sidebar-toggle');
  const sidebar = document.getElementById('sidebar');
  if (toggle && sidebar) {
    if (window.innerWidth <= 1024) toggle.style.display = 'flex';
    toggle.addEventListener('click', () => sidebar.classList.toggle('open'));
  }
}
