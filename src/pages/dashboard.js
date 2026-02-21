import { store } from '../store/data.js';
import { renderShell, bindShellEvents } from '../components/shell.js';
import { pillHTML, formatCurrency, formatDate, vehicleIcon, animateCounters } from '../utils/helpers.js';
import { router } from '../utils/router.js';

/* ─── Multi-select filter state (Sets) ──────────────────────── */
let dashVehicleTypes = new Set();   // empty = All
let dashStatuses = new Set();       // empty = All
let dashRegions = new Set();        // empty = All
let dashSearch = '';

function activeFilterCount() {
  return dashVehicleTypes.size + dashStatuses.size + dashRegions.size + (dashSearch ? 1 : 0);
}

function toggleFilter(set, value) {
  if (set.has(value)) set.delete(value);
  else set.add(value);
}

export async function renderDashboard() {
  const app = document.getElementById('app');
  await store.fetchAll();
  const kpis = store.kpis;
  const draftTrips = store.trips.filter(t => t.status === 'Draft');
  let activeTrips = store.trips.filter(t => t.status === 'Dispatched').sort((a, b) => new Date(b.dispatchedAt || b.createdAt) - new Date(a.dispatchedAt || a.createdAt));
  let vehicles = store.vehicles.filter(v => v.status !== 'Retired');

  /* ─── Apply multi-select filters ─── */
  if (dashVehicleTypes.size) vehicles = vehicles.filter(v => dashVehicleTypes.has(v.type));
  if (dashStatuses.size) vehicles = vehicles.filter(v => dashStatuses.has(v.status));
  if (dashRegions.size) vehicles = vehicles.filter(v => dashRegions.has(v.region));
  if (dashSearch) {
    const q = dashSearch.toLowerCase();
    vehicles = vehicles.filter(v => v.name?.toLowerCase().includes(q) || v.licensePlate?.toLowerCase().includes(q));
  }
  activeTrips = activeTrips.filter(t => {
    const v = store.getVehicle(t.vehicleId);
    if (!v) return true;
    if (dashVehicleTypes.size && !dashVehicleTypes.has(v.type)) return false;
    if (dashRegions.size && !dashRegions.has(v.region)) return false;
    if (dashSearch) {
      const q = dashSearch.toLowerCase();
      if (!v.name?.toLowerCase().includes(q) && !v.licensePlate?.toLowerCase().includes(q)) return false;
    }
    return true;
  });
  const recentTrips = store.trips.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);
  const maintenanceAlerts = store.maintenance.filter(m => m.status === 'In Progress');

  const completedTrips = store.trips.filter(t => t.status === 'Completed');
  const totalRevenue = completedTrips.reduce((s, t) => s + (t.revenue || 0), 0);
  const totalFuelCost = store.fuelLogs.reduce((s, f) => s + f.totalCost, 0);
  const totalMaintCost = store.maintenance.reduce((s, m) => s + m.cost, 0);

  const filterCount = activeFilterCount();

  /* ─── Chip HTML helper (multi-select with checkmark) ─── */
  const multiChip = (label, value, set, dataAttr) => {
    const isActive = set.has(value);
    return `<button class="chip ${isActive ? 'active' : ''}" ${dataAttr}="${value}">
      ${isActive ? '<span class="material-symbols-rounded" style="font-size:14px;margin-right:2px">check</span>' : ''}${label}
    </button>`;
  };

  const bodyContent = `
    <div class="kpi-grid">
      <div class="kpi-card animate-slide-up stagger-1">
        <div class="kpi-icon blue"><span class="material-symbols-rounded">local_shipping</span></div>
        <div class="kpi-value" data-count="${kpis.activeFleet}">0</div>
        <div class="kpi-label">Active Fleet (On Trip)</div>
        <div class="kpi-sub">
          <span style="color:var(--c-success)">● ${kpis.available} available</span>
          <span style="margin-left:8px">of ${kpis.total} total</span>
        </div>
      </div>

      <div class="kpi-card animate-slide-up stagger-2">
        <div class="kpi-icon amber"><span class="material-symbols-rounded">build</span></div>
        <div class="kpi-value" data-count="${kpis.inShop}">0</div>
        <div class="kpi-label">Maintenance Alerts</div>
        <div class="kpi-sub">
          ${kpis.inShop > 0 ? '<span style="color:var(--c-warning)">⚠ Vehicles in shop</span>' : '<span style="color:var(--c-success)">All clear</span>'}
        </div>
      </div>

      <div class="kpi-card animate-slide-up stagger-3">
        <div class="kpi-icon green"><span class="material-symbols-rounded">speed</span></div>
        <div class="kpi-value" data-count="${kpis.utilizationRate}" data-suffix="%" data-decimals="1">0%</div>
        <div class="kpi-label">Utilization Rate</div>
        <div class="kpi-sub">
          <div style="flex:1;height:6px;background:var(--bg-elevated);border-radius:var(--radius-full);overflow:hidden">
            <div style="width:${kpis.utilizationRate}%;height:100%;background:var(--c-success);border-radius:var(--radius-full);transition:width 1s var(--ease-out)"></div>
          </div>
        </div>
      </div>

      <div class="kpi-card animate-slide-up stagger-4">
        <div class="kpi-icon purple"><span class="material-symbols-rounded">inventory_2</span></div>
        <div class="kpi-value" data-count="${draftTrips.length}">0</div>
        <div class="kpi-label">Pending Cargo (Drafts)</div>
        <div class="kpi-sub">
          <span>${kpis.activeDrivers} of ${kpis.totalDrivers} drivers active</span>
        </div>
      </div>
    </div>

    <div class="kpi-grid" style="grid-template-columns: repeat(3, 1fr)">
      <div class="kpi-card">
        <div class="kpi-icon green"><span class="material-symbols-rounded">trending_up</span></div>
        <div class="kpi-value" style="color:var(--c-success)" data-count="${totalRevenue}" data-prefix="₹">₹0</div>
        <div class="kpi-label">Total Revenue</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-icon red"><span class="material-symbols-rounded">local_gas_station</span></div>
        <div class="kpi-value" style="color:var(--c-warning)" data-count="${totalFuelCost}" data-prefix="₹">₹0</div>
        <div class="kpi-label">Fuel Expenses</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-icon amber"><span class="material-symbols-rounded">handyman</span></div>
        <div class="kpi-value" style="color:var(--c-danger)" data-count="${totalMaintCost}" data-prefix="₹">₹0</div>
        <div class="kpi-label">Maintenance Costs</div>
      </div>
    </div>

    <!-- ─── Multi-Select Filter Bar ─── -->
    <div class="filter-bar mt-6">
      <div class="search-input-wrap">
        <span class="material-symbols-rounded">search</span>
        <input class="form-input" id="dash-search" placeholder="Search vehicles..." value="${dashSearch}" />
      </div>
      ${filterCount > 0 ? `<button class="btn btn-ghost btn-sm" id="clear-all-filters" style="color:var(--c-danger);gap:4px">
        <span class="material-symbols-rounded" style="font-size:16px">filter_alt_off</span> Clear ${filterCount} filter${filterCount > 1 ? 's' : ''}
      </button>` : ''}
    </div>

    <div style="display:flex;flex-wrap:wrap;gap:var(--sp-4);margin-bottom:var(--sp-6);animation:fadeSlideUp 0.3s var(--ease-out) both">
      <!-- Vehicle Type (multi-select) -->
      <div class="multi-filter-group">
        <div class="multi-filter-label">
          <span class="material-symbols-rounded" style="font-size:15px">local_shipping</span>
          Type ${dashVehicleTypes.size ? `<span class="filter-count-badge">${dashVehicleTypes.size}</span>` : ''}
        </div>
        <div class="filter-chips" id="dash-vehicle-type">
          ${['Truck', 'Van', 'Bike'].map(t => multiChip(t, t, dashVehicleTypes, 'data-type')).join('')}
        </div>
      </div>

      <!-- Status (multi-select) -->
      <div class="multi-filter-group">
        <div class="multi-filter-label">
          <span class="material-symbols-rounded" style="font-size:15px">toggle_on</span>
          Status ${dashStatuses.size ? `<span class="filter-count-badge">${dashStatuses.size}</span>` : ''}
        </div>
        <div class="filter-chips" id="dash-status">
          ${['Available', 'On Trip', 'In Shop'].map(s => multiChip(s, s, dashStatuses, 'data-status')).join('')}
        </div>
      </div>

      <!-- Region (multi-select) -->
      <div class="multi-filter-group">
        <div class="multi-filter-label">
          <span class="material-symbols-rounded" style="font-size:15px">map</span>
          Region ${dashRegions.size ? `<span class="filter-count-badge">${dashRegions.size}</span>` : ''}
        </div>
        <div class="filter-chips" id="dash-region">
          ${['West', 'East', 'North', 'South', 'Central'].map(r => multiChip(r, r, dashRegions, 'data-region')).join('')}
        </div>
      </div>
    </div>

    ${filterCount > 0 ? `
    <div class="active-filters-summary" style="margin-bottom:var(--sp-4);animation:fadeSlideUp 0.3s var(--ease-out) 0.1s both">
      <span class="material-symbols-rounded" style="font-size:16px;color:var(--c-accent)">filter_list</span>
      <span style="font-size:var(--fs-sm);color:var(--text-secondary)">Showing <strong style="color:var(--text-primary)">${vehicles.length}</strong> vehicles</span>
      ${dashVehicleTypes.size ? `<span class="active-filter-tag">${[...dashVehicleTypes].join(', ')}</span>` : ''}
      ${dashStatuses.size ? `<span class="active-filter-tag">${[...dashStatuses].join(', ')}</span>` : ''}
      ${dashRegions.size ? `<span class="active-filter-tag">${[...dashRegions].join(', ')}</span>` : ''}
    </div>` : ''}

    <div class="card mt-6">
      <div class="card-header">
        <span class="card-title">Active Trips</span>
        <button class="btn btn-ghost btn-sm" data-nav="/trips">View All →</button>
      </div>
      <div class="data-table-wrap">
        <table class="data-table">
          <thead>
            <tr><th>Trip ID</th><th>Vehicle Type</th><th>Status</th><th>Driver</th><th>Cargo</th><th>ETA</th></tr>
          </thead>
          <tbody>
            ${activeTrips.length === 0 ? `
              <tr><td colspan="6"><div class="empty-state"><span class="material-symbols-rounded">route</span><p>No active trips</p></div></td></tr>
            ` : activeTrips.map(trip => {
    const vehicle = store.getVehicle(trip.vehicleId);
    const driver = store.getDriver(trip.driverId);
    return `
                  <tr>
                    <td><code style="background:var(--bg-elevated);padding:2px 8px;border-radius:4px;font-size:var(--fs-xs)">${(trip.id || '').slice(-8)}</code></td>
                    <td><span class="status-pill" style="background:var(--c-info-bg);color:var(--c-info)">${vehicle ? vehicle.type : '—'}</span></td>
                    <td>${pillHTML(trip.status)}</td>
                    <td>${driver ? driver.name : 'N/A'}</td>
                    <td class="text-sm">${trip.cargoDescription || trip.origin + ' → ' + trip.destination}</td>
                    <td class="text-muted text-xs">—</td>
                  </tr>
                `;
  }).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <div class="grid-2 mt-6">
      <div class="card">
        <div class="card-header">
          <span class="card-title">Recent Trips</span>
          <button class="btn btn-ghost btn-sm" data-nav="/trips">View All →</button>
        </div>
        <div class="data-table-wrap">
          <table class="data-table">
            <thead>
              <tr><th>Route</th><th>Vehicle</th><th>Status</th><th>Date</th></tr>
            </thead>
            <tbody>
              ${recentTrips.map(trip => {
    const vehicle = store.getVehicle(trip.vehicleId);
    return `
                  <tr>
                    <td>
                      <div style="font-weight:600;font-size:var(--fs-sm)">${(trip.origin || '').split(' ')[0]}</div>
                      <div style="font-size:var(--fs-xs);color:var(--text-muted)">→ ${(trip.destination || '').split(' ')[0]}</div>
                    </td>
                    <td>
                      <div class="flex items-center gap-2">
                        <div class="vehicle-thumb ${vehicle ? vehicle.type.toLowerCase() : ''}">
                          <span class="material-symbols-rounded">${vehicle ? vehicleIcon(vehicle.type) : 'help'}</span>
                        </div>
                        <span>${vehicle ? vehicle.name : 'N/A'}</span>
                      </div>
                    </td>
                    <td>${pillHTML(trip.status)}</td>
                    <td class="text-muted text-xs">${formatDate(trip.createdAt)}</td>
                  </tr>
                `;
  }).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <span class="card-title">Fleet Status Overview</span>
          <button class="btn btn-ghost btn-sm" data-nav="/vehicles">Manage →</button>
        </div>
        <div class="card-body" style="display:flex;flex-direction:column;gap:var(--sp-3)">
          ${vehicles.map(v => `
            <div class="flex items-center gap-3" style="padding:var(--sp-2) 0;border-bottom:1px solid var(--border-subtle)">
              <div class="vehicle-thumb ${v.type.toLowerCase()}">
                <span class="material-symbols-rounded">${vehicleIcon(v.type)}</span>
              </div>
              <div style="flex:1">
                <div style="font-weight:600;font-size:var(--fs-sm)">${v.name}</div>
                <div style="font-size:var(--fs-xs);color:var(--text-muted)">${v.licensePlate} · ${v.type}</div>
              </div>
              ${pillHTML(v.status)}
            </div>
          `).join('')}
        </div>
      </div>
    </div>

    ${maintenanceAlerts.length > 0 ? `
    <div class="card mt-6" style="border-color:rgba(245,158,11,0.3)">
      <div class="card-header" style="background:var(--c-warning-bg)">
        <span class="card-title flex items-center gap-2" style="color:var(--c-warning)">
          <span class="material-symbols-rounded">warning</span>
          Active Maintenance Alerts
        </span>
      </div>
      <div class="data-table-wrap">
        <table class="data-table">
          <thead>
            <tr><th>Vehicle</th><th>Service Type</th><th>Status</th><th>Cost</th></tr>
          </thead>
          <tbody>
            ${maintenanceAlerts.map(m => {
    const v = store.getVehicle(m.vehicleId);
    return `
                <tr>
                  <td class="font-bold">${v ? v.name : 'Unknown'}</td>
                  <td>${m.type}</td>
                  <td>${pillHTML(m.status)}</td>
                  <td>${formatCurrency(m.cost)}</td>
                </tr>
              `;
  }).join('')}
          </tbody>
        </table>
      </div>
    </div>
    ` : ''}
  `;

  const headerActions = [
    store.vehicles.length === 0
      ? `<button class="btn btn-primary btn-sm" id="seed-demo-btn"><span class="material-symbols-rounded">science</span> Seed Demo Data</button>`
      : '',
    `<button class="btn btn-secondary btn-sm" id="refresh-dashboard-btn"><span class="material-symbols-rounded">refresh</span> Refresh</button>`,
  ].filter(Boolean).join(' ');

  app.innerHTML = renderShell(
    'Command Center',
    'Fleet oversight & real-time KPIs',
    headerActions,
    bodyContent
  );
  bindShellEvents();
  animateCounters();

  /* ─── Event Bindings ─── */
  document.getElementById('refresh-dashboard-btn')?.addEventListener('click', async () => {
    await store.fetchAll();
    renderDashboard();
  });

  document.getElementById('seed-demo-btn')?.addEventListener('click', async () => {
    const btn = document.getElementById('seed-demo-btn');
    if (btn) { btn.disabled = true; btn.innerHTML = '<span class="material-symbols-rounded">hourglass_empty</span> Seeding...'; }
    try {
      const token = localStorage.getItem('fleetflow_token');
      const res = await fetch('/api/seed', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) {
        await store.fetchAll();
        renderDashboard();
      }
    } catch (e) { }
  });

  /* ─── Search ─── */
  document.getElementById('dash-search')?.addEventListener('input', (e) => {
    dashSearch = e.target.value;
    renderDashboard();
  });

  /* ─── Multi-select: Vehicle Type ─── */
  document.querySelectorAll('#dash-vehicle-type .chip').forEach(c => {
    c.addEventListener('click', () => {
      toggleFilter(dashVehicleTypes, c.dataset.type);
      renderDashboard();
    });
  });

  /* ─── Multi-select: Status ─── */
  document.querySelectorAll('#dash-status .chip').forEach(c => {
    c.addEventListener('click', () => {
      toggleFilter(dashStatuses, c.dataset.status);
      renderDashboard();
    });
  });

  /* ─── Multi-select: Region ─── */
  document.querySelectorAll('#dash-region .chip').forEach(c => {
    c.addEventListener('click', () => {
      toggleFilter(dashRegions, c.dataset.region);
      renderDashboard();
    });
  });

  /* ─── Clear All Filters ─── */
  document.getElementById('clear-all-filters')?.addEventListener('click', () => {
    dashVehicleTypes.clear();
    dashStatuses.clear();
    dashRegions.clear();
    dashSearch = '';
    renderDashboard();
  });

  /* ─── Nav links ─── */
  document.querySelectorAll('[data-nav]').forEach(el => {
    el.addEventListener('click', () => { const path = el.dataset.nav; if (path) router.navigate(path); });
  });
}