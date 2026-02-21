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
            <h1>FleetFlow</h1>
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
          <div class="sidebar-user" id="sidebar-user-menu">
            <div class="sidebar-avatar">${user.avatar}</div>
            <div class="sidebar-user-info">
              <div class="sidebar-user-name">${user.name}</div>
              <div class="sidebar-user-role">${user.role}</div>
            </div>
            <span class="material-symbols-rounded" style="color:var(--text-muted);font-size:18px">logout</span>
          </div>
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
    </div>
  `;
}

export function bindShellEvents() {
  document.querySelectorAll('[data-nav]').forEach(el => {
    el.addEventListener('click', () => {
      router.navigate(el.dataset.nav);
    });
  });

  const logoutBtn = document.getElementById('sidebar-user-menu');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      store.logout();
      router.navigate('/login');
    });
  }

  const toggle = document.getElementById('sidebar-toggle');
  const sidebar = document.getElementById('sidebar');
  if (toggle && sidebar) {
    if (window.innerWidth <= 1024) toggle.style.display = 'flex';
    toggle.addEventListener('click', () => sidebar.classList.toggle('open'));
  }
}
