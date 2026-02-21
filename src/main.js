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
    <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;gap:16px;animation:fadeIn 0.5s ease both">
      <span class="material-symbols-rounded" style="font-size:40px;color:var(--c-accent-light);animation:heroIconFloat 2s ease-in-out infinite">hub</span>
      <span style="font-size:1.1rem;font-weight:700;color:var(--text-primary);letter-spacing:-0.01em">FleetFlow</span>
      <div style="width:120px;height:3px;background:var(--bg-card);border-radius:9px;overflow:hidden">
        <div style="width:40%;height:100%;background:var(--c-accent);border-radius:9px;animation:loadingBar 1.2s ease-in-out infinite"></div>
      </div>
      <style>@keyframes loadingBar{0%{transform:translateX(-100%)}50%{transform:translateX(150%)}100%{transform:translateX(-100%)}}</style>
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