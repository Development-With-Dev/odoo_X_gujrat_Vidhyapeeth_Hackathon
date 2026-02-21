import { store } from '../store/data.js';
import { renderShell, bindShellEvents } from '../components/shell.js';
import { pillHTML, formatCurrency, formatDate, vehicleIcon } from '../utils/helpers.js';
import { router } from '../utils/router.js';

let dashVehicleType = 'All';
let dashStatus = 'All';
let dashRegion = 'All';
let dashSearch = '';

export function renderDashboard() {
  const app = document.getElementById('app');
  const kpis = store.kpis;
  let activeTrips = store.trips.filter(t => t.status === 'Dispatched').sort((a, b) => new Date(b.dispatchedAt || b.createdAt) - new Date(a.dispatchedAt || a.createdAt));
  let vehicles = store.vehicles.filter(v => v.status !== 'Retired');
  if (dashVehicleType !== 'All') vehicles = vehicles.filter(v => v.type === dashVehicleType);
  if (dashStatus !== 'All') vehicles = vehicles.filter(v => v.status === dashStatus);
  if (dashRegion !== 'All') vehicles = vehicles.filter(v => v.region === dashRegion);
  if (dashSearch) {
    const q = dashSearch.toLowerCase();
    vehicles = vehicles.filter(v => v.name?.toLowerCase().includes(q) || v.licensePlate?.toLowerCase().includes(q));
  }
  activeTrips = activeTrips.filter(t => {
    const v = store.getVehicle(t.vehicleId);
    if (!v) return true;
    if (dashVehicleType !== 'All' && v.type !== dashVehicleType) return false;
    if (dashRegion !== 'All' && v.region !== dashRegion) return false;
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

  const bodyContent = `
    <div class="card mb-6" style="border-left:4px solid var(--c-accent-light);background:var(--bg-elevated)">
      <div class="card-body" style="display:flex;gap:var(--sp-5);align-items:center;flex-wrap:wrap">
        <div style="flex:1;min-width:220px">
          <div style="display:flex;align-items:center;gap:var(--sp-2);margin-bottom:var(--sp-2)">
            <span class="material-symbols-rounded" style="color:var(--c-accent-light);font-size:20px">dashboard</span>
            <span style="font-weight:700;font-size:var(--fs-base)">Command Center — Fleet Oversight</span>
          </div>
          <p style="font-size:var(--fs-sm);color:var(--text-secondary);line-height:1.7;margin:0">
            High-level <strong>at-a-glance</strong> fleet overview. Monitor all active trips, maintenance alerts, and financial performance in real time. Filter by Vehicle Type, Status, or Region.
          </p>
        </div>
        <div style="display:flex;gap:var(--sp-4);flex-wrap:wrap">
          ${[
      { icon: 'local_shipping', color: 'var(--c-info)', label: 'Active Fleet', desc: 'Vehicles currently On Trip' },
      { icon: 'build', color: 'var(--c-warning)', label: 'Maintenance Alerts', desc: 'Vehicles currently In Shop' },
      { icon: 'speed', color: 'var(--c-success)', label: 'Utilization Rate', desc: '% of fleet assigned vs idle' },
      { icon: 'inventory_2', color: 'var(--c-accent-light)', label: 'Pending Cargo', desc: 'Shipments waiting for assignment' },
    ].map(item => `
            <div style="display:flex;gap:var(--sp-2);align-items:flex-start;min-width:160px">
              <span class="material-symbols-rounded" style="font-size:18px;color:${item.color};margin-top:2px">${item.icon}</span>
              <div>
                <div style="font-weight:600;font-size:var(--fs-sm)">${item.label}</div>
                <div style="font-size:var(--fs-xs);color:var(--text-muted)">${item.desc}</div>
              </div>
            </div>`).join('')}
        </div>
      </div>
    </div>

    <div class="kpi-grid">

      <div class="kpi-card animate-slide-up stagger-1">
        <div class="kpi-icon blue"><span class="material-symbols-rounded">local_shipping</span></div>
        <div class="kpi-value">${kpis.activeFleet}</div>
        <div class="kpi-label">Active Fleet (On Trip)</div>
        <div class="kpi-sub">
          <span style="color:var(--c-success)">● ${kpis.available} available</span>
          <span style="margin-left:8px">of ${kpis.total} total</span>
        </div>
      </div>

      <div class="kpi-card animate-slide-up stagger-2">
        <div class="kpi-icon amber"><span class="material-symbols-rounded">build</span></div>
        <div class="kpi-value">${kpis.inShop}</div>
        <div class="kpi-label">Maintenance Alerts</div>
        <div class="kpi-sub">
          ${kpis.inShop > 0 ? '<span style="color:var(--c-warning)">⚠ Vehicles in shop</span>' : '<span style="color:var(--c-success)">All clear</span>'}
        </div>
      </div>

      <div class="kpi-card animate-slide-up stagger-3">
        <div class="kpi-icon green"><span class="material-symbols-rounded">speed</span></div>
        <div class="kpi-value">${kpis.utilizationRate}%</div>
        <div class="kpi-label">Utilization Rate</div>
        <div class="kpi-sub">
          <div style="flex:1;height:6px;background:var(--bg-elevated);border-radius:var(--radius-full);overflow:hidden">
            <div style="width:${kpis.utilizationRate}%;height:100%;background:var(--c-success);border-radius:var(--radius-full);transition:width 1s var(--ease-out)"></div>
          </div>
        </div>
      </div>

      <div class="kpi-card animate-slide-up stagger-4">
        <div class="kpi-icon purple"><span class="material-symbols-rounded">inventory_2</span></div>
        <div class="kpi-value">${kpis.pendingCargo}</div>
        <div class="kpi-label">Pending Cargo (Drafts)</div>
        <div class="kpi-sub">
          <span>${kpis.activeDrivers} of ${kpis.totalDrivers} drivers active</span>
        </div>
      </div>
    </div>

    <div class="kpi-grid" style="grid-template-columns: repeat(3, 1fr)">
      <div class="kpi-card">
        <div class="kpi-icon green"><span class="material-symbols-rounded">trending_up</span></div>
        <div class="kpi-value" style="color:var(--c-success)">${formatCurrency(totalRevenue)}</div>
        <div class="kpi-label">Total Revenue</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-icon red"><span class="material-symbols-rounded">local_gas_station</span></div>
        <div class="kpi-value" style="color:var(--c-warning)">${formatCurrency(totalFuelCost)}</div>
        <div class="kpi-label">Fuel Expenses</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-icon amber"><span class="material-symbols-rounded">handyman</span></div>
        <div class="kpi-value" style="color:var(--c-danger)">${formatCurrency(totalMaintCost)}</div>
        <div class="kpi-label">Maintenance Costs</div>
      </div>
    </div>

    <div class="filter-bar mt-6">
      <div class="search-input-wrap">
        <span class="material-symbols-rounded">search</span>
        <input class="form-input" id="dash-search" placeholder="Search..." value="${dashSearch}" />
      </div>
      <div class="filter-chips" id="dash-vehicle-type">
        ${['All', 'Truck', 'Van', 'Bike'].map(t => `<button class="chip ${dashVehicleType === t ? 'active' : ''}" data-type="${t}">${t === 'All' ? 'All Types' : t}</button>`).join('')}
      </div>
      <div class="filter-chips" id="dash-status">
        ${['All', 'Available', 'On Trip', 'In Shop'].map(s => `<button class="chip ${dashStatus === s ? 'active' : ''}" data-status="${s}">${s === 'All' ? 'All Status' : s}</button>`).join('')}
      </div>
      <div class="filter-chips" id="dash-region">
        ${['All', 'West', 'East', 'North', 'South', 'Central'].map(r => `<button class="chip ${dashRegion === r ? 'active' : ''}" data-region="${r}">${r === 'All' ? 'All Regions' : r}</button>`).join('')}
      </div>
    </div>

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

  document.getElementById('dash-search')?.addEventListener('input', (e) => {
    dashSearch = e.target.value;
    renderDashboard();
  });
  document.querySelectorAll('#dash-vehicle-type .chip').forEach(c => {
    c.addEventListener('click', () => { dashVehicleType = c.dataset.type; renderDashboard(); });
  });
  document.querySelectorAll('#dash-status .chip').forEach(c => {
    c.addEventListener('click', () => { dashStatus = c.dataset.status; renderDashboard(); });
  });
  document.querySelectorAll('#dash-region .chip').forEach(c => {
    c.addEventListener('click', () => { dashRegion = c.dataset.region; renderDashboard(); });
  });
  document.querySelectorAll('[data-nav]').forEach(el => {
    el.addEventListener('click', () => { const path = el.dataset.nav; if (path) router.navigate(path); });
  });
}