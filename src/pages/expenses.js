import { store } from '../store/data.js';
import { renderShell, bindShellEvents } from '../components/shell.js';
import { pillHTML, formatCurrency, formatDate, vehicleIcon, toast, exportCSV } from '../utils/helpers.js';

let activeTab = 'fuel';

export function renderExpenses() {
  const app = document.getElementById('app');

  const fuelLogs = store.fuelLogs.sort((a, b) => new Date(b.date) - new Date(a.date));
  const expenses = store.expenses.sort((a, b) => new Date(b.date) - new Date(a.date));
  const totalFuel = fuelLogs.reduce((s, f) => s + f.totalCost, 0);
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const totalMaint = store.maintenance.reduce((s, m) => s + m.cost, 0);

  const vehicleCosts = store.vehicles.filter(v => v.status !== 'Retired').map(v => ({
    ...v,
    fuelCost: store.getTotalFuelCost(v.id),
    maintCost: store.getTotalMaintenanceCost(v.id),
    expenseCost: store.getTotalExpenseCost(v.id),
    totalOps: store.getTotalOperationalCost(v.id),
    revenue: store.getTotalRevenue(v.id),
  })).sort((a, b) => b.totalOps - a.totalOps);

  const bodyContent = `
    <div class="kpi-grid" style="grid-template-columns: repeat(4, 1fr)">
      <div class="kpi-card">
        <div class="kpi-icon red"><span class="material-symbols-rounded">local_gas_station</span></div>
        <div class="kpi-value">${formatCurrency(totalFuel)}</div>
        <div class="kpi-label">Total Fuel Cost</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-icon amber"><span class="material-symbols-rounded">build</span></div>
        <div class="kpi-value">${formatCurrency(totalMaint)}</div>
        <div class="kpi-label">Total Maintenance</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-icon purple"><span class="material-symbols-rounded">receipt_long</span></div>
        <div class="kpi-value">${formatCurrency(totalExpenses)}</div>
        <div class="kpi-label">Other Expenses</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-icon blue"><span class="material-symbols-rounded">account_balance</span></div>
        <div class="kpi-value" style="color:var(--c-danger)">${formatCurrency(totalFuel + totalMaint + totalExpenses)}</div>
        <div class="kpi-label">Total Operational Cost</div>
      </div>
    </div>

    <div class="card mb-6">
      <div class="card-header">
        <span class="card-title">Cost Breakdown by Vehicle</span>
      </div>
      <div class="data-table-wrap">
        <table class="data-table">
          <thead>
            <tr><th>Vehicle</th><th>Fuel</th><th>Maintenance</th><th>Other</th><th>Total Ops Cost</th><th>Revenue</th><th>Net</th></tr>
          </thead>
          <tbody>
            ${vehicleCosts.map(v => {
    const net = v.revenue - v.totalOps;
    return `
                <tr>
                  <td>
                    <div class="flex items-center gap-2">
                      <div class="vehicle-thumb ${v.type.toLowerCase()}">
                        <span class="material-symbols-rounded" style="font-size:16px">${vehicleIcon(v.type)}</span>
                      </div>
                      <div>
                        <div style="font-weight:600;font-size:var(--fs-sm)">${v.name}</div>
                        <div class="text-xs text-muted">${v.licensePlate}</div>
                      </div>
                    </div>
                  </td>
                  <td>${formatCurrency(v.fuelCost)}</td>
                  <td>${formatCurrency(v.maintCost)}</td>
                  <td>${formatCurrency(v.expenseCost)}</td>
                  <td style="font-weight:700;color:var(--c-warning)">${formatCurrency(v.totalOps)}</td>
                  <td style="font-weight:700;color:var(--c-success)">${formatCurrency(v.revenue)}</td>
                  <td style="font-weight:700;color:${net >= 0 ? 'var(--c-success)' : 'var(--c-danger)'}">
                    ${net >= 0 ? '+' : ''}${formatCurrency(net)}
                  </td>
                </tr>
              `;
  }).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <div class="filter-bar">
      <div class="filter-chips">
        <button class="chip ${activeTab === 'fuel' ? 'active' : ''}" id="tab-fuel">⛽ Fuel Logs</button>
        <button class="chip ${activeTab === 'expenses' ? 'active' : ''}" id="tab-expenses">💸 Other Expenses</button>
      </div>
    </div>

    ${activeTab === 'fuel' ? `
    <div class="card">
      <div class="card-header">
        <span class="card-title">Fuel Log Entries</span>
        <button class="btn btn-ghost btn-sm" id="export-fuel-btn"><span class="material-symbols-rounded" style="font-size:16px">download</span> Export CSV</button>
      </div>
      <div class="data-table-wrap">
        <table class="data-table">
          <thead>
            <tr><th>Vehicle</th><th>Trip</th><th>Liters</th><th>Cost/L</th><th>Total Cost</th><th>Odometer</th><th>Date</th></tr>
          </thead>
          <tbody>
            ${fuelLogs.map(f => {
    const v = store.getVehicle(f.vehicleId);
    const t = f.tripId ? store.getTrip(f.tripId) : null;
    return `
                <tr>
                  <td style="font-weight:600">${v ? v.name : 'Unknown'}</td>
                  <td class="text-sm text-muted">${t ? `${t.origin} → ${t.destination}` : '—'}</td>
                  <td>${f.liters} L</td>
                  <td>${formatCurrency(f.costPerLiter)}</td>
                  <td style="font-weight:700">${formatCurrency(f.totalCost)}</td>
                  <td>${f.odometer.toLocaleString()} km</td>
                  <td>${formatDate(f.date)}</td>
                </tr>
              `;
  }).join('')}
          </tbody>
        </table>
      </div>
    </div>
    ` : `
    <div class="card">
      <div class="card-header">
        <span class="card-title">Expense Records</span>
        <button class="btn btn-ghost btn-sm" id="export-expenses-btn"><span class="material-symbols-rounded" style="font-size:16px">download</span> Export CSV</button>
      </div>
      <div class="data-table-wrap">
        <table class="data-table">
          <thead>
            <tr><th>Vehicle</th><th>Category</th><th>Description</th><th>Amount</th><th>Date</th></tr>
          </thead>
          <tbody>
            ${expenses.map(e => {
    const v = store.getVehicle(e.vehicleId);
    return `
                <tr>
                  <td style="font-weight:600">${v ? v.name : 'Unknown'}</td>
                  <td>${pillHTML(e.category)}</td>
                  <td class="text-sm">${e.description}</td>
                  <td style="font-weight:700">${formatCurrency(e.amount)}</td>
                  <td>${formatDate(e.date)}</td>
                </tr>
              `;
  }).join('')}
          </tbody>
        </table>
      </div>
    </div>
    `}
  `;

  app.innerHTML = renderShell(
    'Expenses & Fuel Logging',
    'Financial tracking per asset',
    `
      <button class="btn btn-secondary" id="add-expense-btn"><span class="material-symbols-rounded">add</span> Add Expense</button>
      <button class="btn btn-primary" id="add-fuel-btn"><span class="material-symbols-rounded">local_gas_station</span> Log Fuel</button>
    `,
    bodyContent
  );
  bindShellEvents();

  document.getElementById('tab-fuel')?.addEventListener('click', () => { activeTab = 'fuel'; renderExpenses(); });
  document.getElementById('tab-expenses')?.addEventListener('click', () => { activeTab = 'expenses'; renderExpenses(); });

  document.getElementById('add-fuel-btn')?.addEventListener('click', () => showFuelModal());
  document.getElementById('add-expense-btn')?.addEventListener('click', () => showExpenseModal());

  document.getElementById('export-fuel-btn')?.addEventListener('click', () => {
    const data = fuelLogs.map(f => {
      const v = store.getVehicle(f.vehicleId);
      return { Vehicle: v?.name, Liters: f.liters, 'Cost/L': f.costPerLiter, Total: f.totalCost, Odometer: f.odometer, Date: f.date };
    });
    exportCSV(data, 'fleetflow_fuel_logs.csv');
    toast('Fuel logs exported', 'success');
  });

  document.getElementById('export-expenses-btn')?.addEventListener('click', () => {
    const data = expenses.map(e => {
      const v = store.getVehicle(e.vehicleId);
      return { Vehicle: v?.name, Category: e.category, Description: e.description, Amount: e.amount, Date: e.date };
    });
    exportCSV(data, 'fleetflow_expenses.csv');
    toast('Expenses exported', 'success');
  });
}

function showFuelModal() {
  const vehicles = store.vehicles.filter(v => v.status !== 'Retired');
  const completedTrips = store.trips.filter(t => t.status === 'Completed');
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal">
      <div class="modal-header">
        <h2 class="modal-title">Log Fuel Entry</h2>
        <button class="btn btn-ghost btn-icon" id="close-modal"><span class="material-symbols-rounded">close</span></button>
      </div>
      <form id="fuel-form">
        <div class="modal-body">
          <div class="form-row-2">
            <div class="form-group">
              <label class="form-label">Vehicle</label>
              <select class="form-select" name="vehicleId" required>
                <option value="">Select...</option>
                ${vehicles.map(v => `<option value="${v.id}">${v.name} (${v.licensePlate})</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Linked Trip (Optional)</label>
              <select class="form-select" name="tripId">
                <option value="">None</option>
                ${completedTrips.map(t => `<option value="${t.id}">${t.origin} → ${t.destination}</option>`).join('')}
              </select>
            </div>
          </div>
          <div class="form-row-2">
            <div class="form-group">
              <label class="form-label">Liters</label>
              <input class="form-input" name="liters" type="number" step="0.1" required placeholder="e.g. 50" />
            </div>
            <div class="form-group">
              <label class="form-label">Cost per Liter (₹)</label>
              <input class="form-input" name="costPerLiter" type="number" step="0.1" required placeholder="e.g. 102.5" value="102.50" />
            </div>
          </div>
          <div class="form-row-2">
            <div class="form-group">
              <label class="form-label">Odometer Reading (km)</label>
              <input class="form-input" name="odometer" type="number" required placeholder="Current odometer" />
            </div>
            <div class="form-group">
              <label class="form-label">Date</label>
              <input class="form-input" name="date" type="date" required value="${new Date().toISOString().slice(0, 10)}" />
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" id="cancel-modal">Cancel</button>
          <button type="submit" class="btn btn-primary">Log Fuel</button>
        </div>
      </form>
    </div>
  `;
  document.body.appendChild(overlay);
  const close = () => overlay.remove();
  overlay.querySelector('#close-modal').addEventListener('click', close);
  overlay.querySelector('#cancel-modal').addEventListener('click', close);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

  overlay.querySelector('#fuel-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const liters = Number(fd.get('liters'));
    const cpl = Number(fd.get('costPerLiter'));
    const r = await store.addFuelLog({
      vehicleId: fd.get('vehicleId'),
      tripId: fd.get('tripId') || null,
      liters,
      costPerLiter: cpl,
      totalCost: liters * cpl,
      odometer: Number(fd.get('odometer')),
      date: fd.get('date'),
    });
    if (r?.success) { toast('Fuel entry logged', 'success'); close(); renderExpenses(); } else toast(r?.error || 'Failed', 'error');
  });
}

function showExpenseModal() {
  const vehicles = store.vehicles.filter(v => v.status !== 'Retired');
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal">
      <div class="modal-header">
        <h2 class="modal-title">Add Expense</h2>
        <button class="btn btn-ghost btn-icon" id="close-modal"><span class="material-symbols-rounded">close</span></button>
      </div>
      <form id="expense-form">
        <div class="modal-body">
          <div class="form-row-2">
            <div class="form-group">
              <label class="form-label">Vehicle</label>
              <select class="form-select" name="vehicleId" required>
                <option value="">Select...</option>
                ${vehicles.map(v => `<option value="${v.id}">${v.name} (${v.licensePlate})</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Category</label>
              <select class="form-select" name="category" required>
                ${['Toll', 'Parking', 'Insurance', 'Fine', 'Permit', 'Other'].map(c => `<option>${c}</option>`).join('')}
              </select>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Description</label>
            <input class="form-input" name="description" required placeholder="Expense details..." />
          </div>
          <div class="form-row-2">
            <div class="form-group">
              <label class="form-label">Amount (₹)</label>
              <input class="form-input" name="amount" type="number" required placeholder="e.g. 1500" />
            </div>
            <div class="form-group">
              <label class="form-label">Date</label>
              <input class="form-input" name="date" type="date" required value="${new Date().toISOString().slice(0, 10)}" />
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" id="cancel-modal">Cancel</button>
          <button type="submit" class="btn btn-primary">Add Expense</button>
        </div>
      </form>
    </div>
  `;
  document.body.appendChild(overlay);
  const close = () => overlay.remove();
  overlay.querySelector('#close-modal').addEventListener('click', close);
  overlay.querySelector('#cancel-modal').addEventListener('click', close);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

  overlay.querySelector('#expense-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const r = await store.addExpense({
      vehicleId: fd.get('vehicleId'),
      tripId: null,
      category: fd.get('category'),
      description: fd.get('description'),
      amount: Number(fd.get('amount')),
      date: fd.get('date'),
    });
    if (r?.success) { toast('Expense added', 'success'); close(); renderExpenses(); } else toast(r?.error || 'Failed', 'error');
  });
}
