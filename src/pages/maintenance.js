import { store } from '../store/data.js';
import { renderShell, bindShellEvents } from '../components/shell.js';
import { pillHTML, formatCurrency, formatDate, vehicleIcon, toast } from '../utils/helpers.js';

export function renderMaintenance() {
  const app = document.getElementById('app');
  const records = store.maintenance.sort((a, b) => new Date(b.date) - new Date(a.date));
  const totalCost = records.reduce((s, m) => s + m.cost, 0);
  const inProgress = records.filter(r => r.status === 'In Progress').length;

  const bodyContent = `
    <div class="kpi-grid" style="grid-template-columns: repeat(3, 1fr)">
      <div class="kpi-card">
        <div class="kpi-icon amber"><span class="material-symbols-rounded">build</span></div>
        <div class="kpi-value">${records.length}</div>
        <div class="kpi-label">Total Service Records</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-icon red"><span class="material-symbols-rounded">engineering</span></div>
        <div class="kpi-value">${inProgress}</div>
        <div class="kpi-label">Currently In Progress</div>
        <div class="kpi-sub" style="color:var(--c-warning)">Vehicles unavailable for dispatch</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-icon purple"><span class="material-symbols-rounded">payments</span></div>
        <div class="kpi-value">${formatCurrency(totalCost)}</div>
        <div class="kpi-label">Total Maintenance Spend</div>
      </div>
    </div>

    <div class="card mb-6" style="border-color:rgba(59,130,246,0.3);padding:var(--sp-4) var(--sp-6)">
      <div class="flex items-center gap-3">
        <span class="material-symbols-rounded" style="color:var(--c-info)">info</span>
        <span class="text-sm" style="color:var(--c-info)">
          <strong>Auto-Logic:</strong> Adding an "In Progress" service log automatically sets the vehicle to "In Shop" status, removing it from the dispatcher's available pool.
        </span>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <span class="card-title">Service Log History</span>
      </div>
      <div class="data-table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Vehicle</th>
              <th>Service Type</th>
              <th>Description</th>
              <th>Mechanic</th>
              <th>Date</th>
              <th>Cost</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${records.map(m => {
    const v = store.getVehicle(m.vehicleId);
    return `
                <tr>
                  <td>
                    <div class="flex items-center gap-2">
                      <div class="vehicle-thumb ${v ? v.type.toLowerCase() : ''}">
                        <span class="material-symbols-rounded" style="font-size:16px">${v ? vehicleIcon(v.type) : 'help'}</span>
                      </div>
                      <div>
                        <div style="font-weight:600;font-size:var(--fs-sm)">${v ? v.name : 'Unknown'}</div>
                        <div class="text-xs text-muted">${v ? v.licensePlate : ''}</div>
                      </div>
                    </div>
                  </td>
                  <td style="font-weight:600">${m.type}</td>
                  <td class="text-sm text-muted" style="max-width:200px;white-space:normal">${m.description}</td>
                  <td class="text-sm">${m.mechanic}</td>
                  <td class="text-sm">${formatDate(m.date)}</td>
                  <td style="font-weight:600">${formatCurrency(m.cost)}</td>
                  <td>${pillHTML(m.status)}</td>
                  <td>
                    ${m.status === 'In Progress' ? `
                      <button class="btn btn-success btn-sm" data-complete-maint="${m.id}">
                        <span class="material-symbols-rounded" style="font-size:14px">check</span> Mark Done
                      </button>
                    ` : ''}
                  </td>
                </tr>
              `;
  }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;

  app.innerHTML = renderShell(
    'Maintenance & Service Logs',
    'Preventative and reactive health tracking',
    `<button class="btn btn-primary" id="add-maintenance-btn"><span class="material-symbols-rounded">add</span> Log Service</button>`,
    bodyContent
  );
  bindShellEvents();

  document.querySelectorAll('[data-complete-maint]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const r = await store.updateMaintenance(btn.dataset.completeMaint, { status: 'Completed' });
      if (r?.success) { toast('Service completed — vehicle now Available', 'success'); renderMaintenance(); } else toast(r?.error || 'Failed', 'error');
    });
  });

  document.getElementById('add-maintenance-btn')?.addEventListener('click', () => showMaintenanceModal());
}

function showMaintenanceModal() {
  const vehicles = store.vehicles.filter(v => v.status !== 'Retired');
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal">
      <div class="modal-header">
        <h2 class="modal-title">Log New Service</h2>
        <button class="btn btn-ghost btn-icon" id="close-modal"><span class="material-symbols-rounded">close</span></button>
      </div>
      <form id="maintenance-form">
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">Vehicle</label>
            <select class="form-select" name="vehicleId" required>
              <option value="">Select vehicle...</option>
              ${vehicles.map(v => `<option value="${v.id}">${v.name} (${v.licensePlate})</option>`).join('')}
            </select>
          </div>
          <div class="form-row-2">
            <div class="form-group">
              <label class="form-label">Service Type</label>
              <select class="form-select" name="type" required>
                ${['Oil Change', 'Tire Replacement', 'Brake Inspection', 'Engine Overhaul', 'AC Repair', 'Battery Replacement', 'Transmission Service', 'General Inspection', 'Other'].map(t => `<option>${t}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Status</label>
              <select class="form-select" name="status" required>
                <option value="In Progress">In Progress (Vehicle → In Shop)</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Description</label>
            <input class="form-input" name="description" placeholder="Details about the service..." required />
          </div>
          <div class="form-row-2">
            <div class="form-group">
              <label class="form-label">Mechanic / Garage</label>
              <input class="form-input" name="mechanic" placeholder="e.g. AutoCare Garage" required />
            </div>
            <div class="form-group">
              <label class="form-label">Cost (₹)</label>
              <input class="form-input" name="cost" type="number" required placeholder="e.g. 5000" />
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Date</label>
            <input class="form-input" name="date" type="date" required value="${new Date().toISOString().slice(0, 10)}" />
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" id="cancel-modal">Cancel</button>
          <button type="submit" class="btn btn-primary">Log Service</button>
        </div>
      </form>
    </div>
  `;

  document.body.appendChild(overlay);
  const close = () => overlay.remove();
  overlay.querySelector('#close-modal').addEventListener('click', close);
  overlay.querySelector('#cancel-modal').addEventListener('click', close);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

  overlay.querySelector('#maintenance-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const r = await store.addMaintenance({
      vehicleId: fd.get('vehicleId'),
      type: fd.get('type'),
      description: fd.get('description'),
      mechanic: fd.get('mechanic'),
      cost: Number(fd.get('cost')),
      date: fd.get('date'),
      status: fd.get('status'),
    });
    if (r?.success) { toast('Service logged successfully', 'success'); close(); renderMaintenance(); } else toast(r?.error || 'Failed', 'error');
  });
}
