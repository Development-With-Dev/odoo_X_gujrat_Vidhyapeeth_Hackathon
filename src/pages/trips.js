import { store } from '../store/data.js';
import { renderShell, bindShellEvents } from '../components/shell.js';
import { pillHTML, formatDate, formatDateTime, formatCurrency, vehicleIcon, toast } from '../utils/helpers.js';

let tripFilter = 'All';

export function renderTrips() {
  const app = document.getElementById('app');

  let trips = store.trips.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  if (tripFilter !== 'All') trips = trips.filter(t => t.status === tripFilter);

  const statuses = ['All', 'Draft', 'Dispatched', 'Completed', 'Cancelled'];

  const bodyContent = `
    <div class="filter-bar">
      <div class="filter-chips" id="trip-status-filter">
        ${statuses.map(s => `<button class="chip ${tripFilter === s ? 'active' : ''}" data-status="${s}">${s === 'All' ? 'All Trips' : s}</button>`).join('')}
      </div>
      <div style="margin-left:auto;font-size:var(--fs-sm);color:var(--text-muted)">${trips.length} trip${trips.length !== 1 ? 's' : ''}</div>
    </div>

    <div class="card mb-6" style="padding:var(--sp-4) var(--sp-6)">
      <div class="flex items-center gap-4" style="flex-wrap:wrap">
        <span class="text-xs text-muted font-bold" style="text-transform:uppercase;letter-spacing:0.1em">Lifecycle:</span>
        <div class="flex items-center gap-2">
          ${pillHTML('Draft')} <span class="text-xs text-muted">→</span>
          ${pillHTML('Dispatched')} <span class="text-xs text-muted">→</span>
          ${pillHTML('Completed')}
        </div>
        <span class="text-xs text-muted" style="margin-left:12px">or</span>
        ${pillHTML('Cancelled')}
      </div>
    </div>

    <div class="card">
      <div class="data-table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Route</th>
              <th>Vehicle</th>
              <th>Driver</th>
              <th>Cargo</th>
              <th>Weight</th>
              <th>Revenue</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${trips.length === 0 ? `
              <tr><td colspan="8"><div class="empty-state"><span class="material-symbols-rounded">route</span><p>No trips found</p></div></td></tr>
            ` : trips.map(t => {
    const v = store.getVehicle(t.vehicleId);
    const d = store.getDriver(t.driverId);
    const capacityPct = v ? ((t.cargoWeight / v.maxCapacity) * 100).toFixed(0) : 0;
    return `
                <tr>
                  <td>
                    <div style="font-weight:600;font-size:var(--fs-sm)">${t.origin}</div>
                    <div style="font-size:var(--fs-xs);color:var(--text-muted)">→ ${t.destination}</div>
                  </td>
                  <td>
                    <div class="flex items-center gap-2">
                      <div class="vehicle-thumb ${v ? v.type.toLowerCase() : ''}">
                        <span class="material-symbols-rounded" style="font-size:16px">${v ? vehicleIcon(v.type) : 'help'}</span>
                      </div>
                      <div>
                        <div style="font-size:var(--fs-sm)">${v ? v.name : 'N/A'}</div>
                        <div class="text-xs text-muted">${v ? v.licensePlate : ''}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div class="flex items-center gap-2">
                      <div class="driver-avatar">${d ? d.name.charAt(0) : '?'}</div>
                      <span style="font-size:var(--fs-sm)">${d ? d.name : 'N/A'}</span>
                    </div>
                  </td>
                  <td class="text-xs">${t.cargoDescription || '—'}</td>
                  <td>
                    <div>
                      <span style="font-weight:600">${t.cargoWeight.toLocaleString()} kg</span>
                      ${v ? `
                      <div style="margin-top:4px;width:60px;height:4px;background:var(--bg-elevated);border-radius:var(--radius-full)">
                        <div style="width:${capacityPct}%;height:100%;background:${capacityPct > 90 ? 'var(--c-danger)' : capacityPct > 70 ? 'var(--c-warning)' : 'var(--c-success)'};border-radius:var(--radius-full)"></div>
                      </div>
                      <div class="text-xs text-muted">${capacityPct}% capacity</div>` : ''}
                    </div>
                  </td>
                  <td style="font-weight:600">${formatCurrency(t.revenue || 0)}</td>
                  <td>${pillHTML(t.status)}</td>
                  <td>
                    <div class="flex gap-2">
                      ${t.status === 'Draft' ? `
                        <button class="btn btn-success btn-sm" data-dispatch="${t.id}" title="Dispatch">
                          <span class="material-symbols-rounded" style="font-size:14px">send</span> Dispatch
                        </button>
                        <button class="btn btn-danger btn-sm" data-cancel="${t.id}" title="Cancel">
                          <span class="material-symbols-rounded" style="font-size:14px">close</span>
                        </button>
                      ` : ''}
                      ${t.status === 'Dispatched' ? `
                        <button class="btn btn-success btn-sm" data-complete="${t.id}" title="Complete">
                          <span class="material-symbols-rounded" style="font-size:14px">check</span> Complete
                        </button>
                        <button class="btn btn-danger btn-sm" data-cancel="${t.id}" title="Cancel">
                          <span class="material-symbols-rounded" style="font-size:14px">close</span>
                        </button>
                      ` : ''}
                    </div>
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
    'Trip Dispatcher',
    'Create, manage, and track delivery trips',
    `<button class="btn btn-primary" id="create-trip-btn"><span class="material-symbols-rounded">add</span> New Trip</button>`,
    bodyContent
  );
  bindShellEvents();
  bindTripEvents();
}

function bindTripEvents() {
  document.querySelectorAll('#trip-status-filter .chip').forEach(chip => {
    chip.addEventListener('click', () => {
      tripFilter = chip.dataset.status;
      renderTrips();
    });
  });

  document.getElementById('create-trip-btn')?.addEventListener('click', () => showTripModal());

  document.querySelectorAll('[data-dispatch]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const r = await store.dispatchTrip(btn.dataset.dispatch);
      if (r?.success) {
        toast('Trip dispatched! Vehicle & driver are now On Trip.', 'success');
        renderTrips();
      } else toast(r?.error || 'Failed', 'error');
    });
  });

  document.querySelectorAll('[data-complete]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const trip = store.getTrip(btn.dataset.complete);
      const endOdo = prompt('Enter final odometer reading (km):', trip?.startOdometer ? String(trip.startOdometer + 100) : '');
      if (endOdo && !isNaN(endOdo)) {
        const r = await store.completeTrip(btn.dataset.complete, Number(endOdo));
        if (r?.success) {
          toast('Trip completed! Vehicle & driver available again.', 'success');
          renderTrips();
        } else toast(r?.error || 'Failed', 'error');
      }
    });
  });

  document.querySelectorAll('[data-cancel]').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (confirm('Cancel this trip?')) {
        const r = await store.cancelTrip(btn.dataset.cancel);
        if (r?.success) { toast('Trip cancelled', 'info'); renderTrips(); } else toast(r?.error || 'Failed', 'error');
      }
    });
  });
}

function showTripModal() {
  const availableVehicles = store.availableVehicles;
  const availableDrivers = store.availableDrivers;

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal modal-lg">
      <div class="modal-header">
        <h2 class="modal-title">Create New Trip</h2>
        <button class="btn btn-ghost btn-icon" id="close-modal"><span class="material-symbols-rounded">close</span></button>
      </div>
      <form id="trip-form">
        <div class="modal-body">
          ${availableVehicles.length === 0 ? `
            <div class="empty-state" style="padding:var(--sp-6)">
              <span class="material-symbols-rounded" style="color:var(--c-warning)">warning</span>
              <p>No available vehicles. All are on trip, in shop, or retired.</p>
            </div>
          ` : ''}
          ${availableDrivers.length === 0 ? `
            <div class="empty-state" style="padding:var(--sp-6)">
              <span class="material-symbols-rounded" style="color:var(--c-warning)">warning</span>
              <p>No available drivers. All are off-duty, on trip, or suspended.</p>
            </div>
          ` : ''}

          <div class="form-row-2">
            <div class="form-group">
              <label class="form-label">Select Vehicle</label>
              <select class="form-select" name="vehicleId" required id="trip-vehicle-select">
                <option value="">Choose a vehicle...</option>
                ${availableVehicles.map(v => `<option value="${v.id}" data-type="${v.type}" data-cap="${v.maxCapacity}" data-odo="${v.odometer}">${v.name} (${v.licensePlate}) — ${v.maxCapacity}kg max</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Select Driver</label>
              <select class="form-select" name="driverId" required id="trip-driver-select">
                <option value="">Choose a driver...</option>
                ${availableDrivers.map(d => `<option value="${d.id}" data-cat="${d.licenseCategory}">${d.name} — License: ${d.licenseCategory}</option>`).join('')}
              </select>
            </div>
          </div>

          <div id="trip-validation-msg" class="form-error" style="display:none"></div>

          <div class="form-row-2">
            <div class="form-group">
              <label class="form-label">Origin</label>
              <input class="form-input" name="origin" required placeholder="e.g. Ahmedabad Warehouse" />
            </div>
            <div class="form-group">
              <label class="form-label">Destination</label>
              <input class="form-input" name="destination" required placeholder="e.g. Mumbai Hub" />
            </div>
          </div>

          <div class="form-row-2">
            <div class="form-group">
              <label class="form-label">Cargo Weight (kg)</label>
              <input class="form-input" name="cargoWeight" type="number" required placeholder="e.g. 5000" id="cargo-weight-input" />
              <div id="capacity-indicator" class="text-xs" style="margin-top:4px"></div>
            </div>
            <div class="form-group">
              <label class="form-label">Expected Revenue (₹)</label>
              <input class="form-input" name="revenue" type="number" placeholder="e.g. 25000" />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Cargo Description</label>
            <input class="form-input" name="cargoDescription" placeholder="e.g. Electronics - Smartphones" />
          </div>

          <div class="form-group">
            <label class="form-label">Start Odometer (km)</label>
            <input class="form-input" name="startOdometer" type="number" id="start-odo-input" placeholder="Auto-filled from vehicle" />
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" id="cancel-modal">Cancel</button>
          <button type="submit" class="btn btn-primary" ${availableVehicles.length === 0 || availableDrivers.length === 0 ? 'disabled' : ''}>Create Trip</button>
        </div>
      </form>
    </div>
  `;

  document.body.appendChild(overlay);

  const close = () => overlay.remove();
  overlay.querySelector('#close-modal').addEventListener('click', close);
  overlay.querySelector('#cancel-modal').addEventListener('click', close);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

  const vehicleSelect = overlay.querySelector('#trip-vehicle-select');
  vehicleSelect?.addEventListener('change', () => {
    const opt = vehicleSelect.selectedOptions[0];
    if (opt?.dataset?.odo) {
      overlay.querySelector('#start-odo-input').value = opt.dataset.odo;
    }
    validateTrip();
  });

  const cargoInput = overlay.querySelector('#cargo-weight-input');
  cargoInput?.addEventListener('input', validateTrip);

  const driverSelect = overlay.querySelector('#trip-driver-select');
  driverSelect?.addEventListener('change', validateTrip);

  function validateTrip() {
    const vehicleOpt = vehicleSelect?.selectedOptions[0];
    const maxCap = vehicleOpt ? Number(vehicleOpt.dataset?.cap) : 0;
    const vType = vehicleOpt?.dataset?.type || '';
    const cargoW = Number(cargoInput?.value || 0);
    const driverOpt = driverSelect?.selectedOptions[0];
    const driverCats = driverOpt?.dataset?.cat || '';

    const msgEl = overlay.querySelector('#trip-validation-msg');
    const indEl = overlay.querySelector('#capacity-indicator');
    let errors = [];

    if (maxCap > 0 && cargoW > 0) {
      const pct = ((cargoW / maxCap) * 100).toFixed(0);
      if (cargoW > maxCap) {
        errors.push(`Cargo (${cargoW}kg) exceeds capacity (${maxCap}kg)!`);
        indEl.innerHTML = `<span style="color:var(--c-danger)">⚠ ${pct}% — OVERWEIGHT</span>`;
      } else {
        indEl.innerHTML = `<span style="color:${pct > 90 ? 'var(--c-warning)' : 'var(--c-success)'}">✓ ${pct}% of ${maxCap.toLocaleString()}kg capacity</span>`;
      }
    } else {
      indEl.innerHTML = '';
    }

    if (vType && driverCats && !driverCats.split(',').includes(vType)) {
      errors.push(`Driver not licensed for ${vType}. Has: ${driverCats}`);
    }

    if (errors.length) {
      msgEl.style.display = 'flex';
      msgEl.innerHTML = `<span class="material-symbols-rounded" style="font-size:14px">error</span> ${errors.join(' | ')}`;
    } else {
      msgEl.style.display = 'none';
    }
  }

  overlay.querySelector('#trip-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const data = {
      vehicleId: fd.get('vehicleId'),
      driverId: fd.get('driverId'),
      origin: fd.get('origin'),
      destination: fd.get('destination'),
      cargoWeight: Number(fd.get('cargoWeight')),
      cargoDescription: fd.get('cargoDescription'),
      startOdometer: Number(fd.get('startOdometer')) || null,
      revenue: Number(fd.get('revenue')) || 0,
    };

    const result = await store.createTrip(data);
    if (result?.success) {
      toast('Trip created as Draft. Dispatch when ready!', 'success');
      close();
      renderTrips();
    } else {
      toast(result?.error || 'Failed', 'error');
    }
  });
}
