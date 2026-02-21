import './styles.css';
import { router } from './utils/router.js';
import { store } from './store/data.js';
import { renderLogin, renderRegister } from './pages/login.js';
import { renderDashboard } from './pages/dashboard.js';
import { renderVehicles } from './pages/vehicles.js';
import { renderTrips } from './pages/trips.js';
import { renderMaintenance } from './pages/maintenance.js';
import { renderExpenses } from './pages/expenses.js';
import { renderDrivers } from './pages/drivers.js';
import { renderAnalytics } from './pages/analytics.js';

function guard(renderFn) {
    return () => {
        if (!store.currentUser) {
            router.navigate('/login');
        } else {
            renderFn();
        }
    };
}

router.register('/login', renderLogin);
router.register('/register', renderRegister);
router.register('/dashboard', guard(renderDashboard));
router.register('/vehicles', guard(renderVehicles));
router.register('/trips', guard(renderTrips));
router.register('/maintenance', guard(renderMaintenance));
router.register('/expenses', guard(renderExpenses));
router.register('/drivers', guard(renderDrivers));
router.register('/analytics', guard(renderAnalytics));

async function init() {
    const app = document.getElementById('app');
    app.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:center;min-height:100vh;gap:12px;color:var(--text-muted)">
      <span class="material-symbols-rounded" style="font-size:32px;animation:float 1.5s ease-in-out infinite">hub</span>
      <span style="font-size:1.1rem;font-weight:600">Loading FleetFlow...</span>
    </div>
  `;

    const restored = await store.restoreSession();

    if (restored) {
        if (!window.location.hash || window.location.hash === '#/login' || window.location.hash === '#/register') {
            router.navigate('/dashboard');
        } else {
            router.start();
        }
    } else {
        if (!window.location.hash || (window.location.hash !== '#/login' && window.location.hash !== '#/register')) {
            router.navigate('/login');
        }
        router.start();
    }
}

init();