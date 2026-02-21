import { store } from '../store/data.js';
import { renderShell, bindShellEvents } from '../components/shell.js';
import { pillHTML, formatCurrency, vehicleIcon, toast, debounce } from '../utils/helpers.js';
import { router } from '../utils/router.js';

let filterType = 'All';
let filterStatus = 'All';
let searchQuery = '';

export function renderVehicles() {
  const app = document.getElementById('app');

  let vehicles = store.vehicles;
  if (filterType !== 'All') vehicles = vehicles.filter(v => v.type === filterType);
  if (filterStatus !== 'All') vehicles = vehicles.filter(v => v.status === filterStatus);
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    vehicles = vehicles.filter(v =>
      v.name.toLowerCase().includes(q) ||
      v.licensePlate.toLowerCase().includes(q) ||
      v.model.toLowerCase().includes(q)
    );
  }

  const types = ['All', 'Truck', 'Van', 'Bike'];
  const statuses = ['All', 'Available', 'On Trip', 'In Shop', 'Retired'];

  const bodyContent = `
    <div class="filter-bar">
      <div class="search-input-wrap">
        <span class="material-symbols-rounded">search</span>
        <input class="form-input" id="vehicle-search" placeholder="Search by name, plate, model..." value="${searchQuery}" />
      </div>
      <div class="filter-chips" id="vehicle-type-filter">
        ${types.map(t => `<button class="chip ${filterType === t ? 'active' : ''}" data-type="${t}">${t === 'All' ? 'All Types' : t}</button>`).join('')}
      </div>
      <div class="filter-chips" id="vehicle-status-filter">
        ${statuses.map(s => `<button class="chip ${filterStatus === s ? 'active' : ''}" data-status="${s}">${s === 'All' ? 'All Status' : s}</button>`).join('')}
      </div>
    </div>

    <div class="card">
      <div class="data-table-wrap">
        <table class="data-table" id="vehicles-table">
          <thead>
            <tr>
              <th>Vehicle</th>
              <th>License Plate</th>
              <th>Type</th>
              <th>Max Capacity</th>
              <th>Odometer</th>
              <th>Region</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${vehicles.length === 0 ? `
              <tr><td colspan="8">
                <div class="empty-state">
                  <span class="material-symbols-rounded">directions_car</span>
                  <p>No vehicles match your filters</p>
                </div>
              </td></tr>
            ` : vehicles.map(v => `
              <tr>
                <td>
                  <div class="flex items-center gap-3">
                    <div class="vehicle-thumb ${v.type.toLowerCase()}">
                      <span class="material-symbols-rounded">${vehicleIcon(v.type)}</span>
                    </div>
                    <div>
                      <div style="font-weight:600">${v.name}</div>
                      <div class="text-xs text-muted">${v.model}</div>
                    </div>
                  </div>
                </td>
                <td><code style="background:var(--bg-elevated);padding:2px 8px;border-radius:4px;font-size:var(--fs-xs)">${v.licensePlate}</code></td>
                <td>${v.type}</td>
                <td>${v.maxCapacity.toLocaleString()} kg</td>
                <td>${v.odometer.toLocaleString()} km</td>
                <td><span class="text-muted">${v.region}</span></td>
                <td>${pillHTML(v.status)}</td>
                <td>
                  <div class="flex gap-2">
                    <button class="btn btn-ghost btn-sm btn-icon" data-edit="${v.id}" title="Edit">
                      <span class="material-symbols-rounded" style="font-size:16px">edit</span>
                    </button>
                    ${v.status === 'Available' ? `
                    <button class="btn btn-ghost btn-sm btn-icon" data-retire="${v.id}" title="Retire">
                      <span class="material-symbols-rounded" style="font-size:16px;color:var(--c-danger)">block</span>
                    </button>` : ''}
                    ${v.status === 'Retired' ? `
                    <button class="btn btn-ghost btn-sm btn-icon" data-reactivate="${v.id}" title="Reactivate">
                      <span class="material-symbols-rounded" style="font-size:16px;color:var(--c-success)">check_circle</span>
                    </button>` : ''}
                    <button class="btn btn-ghost btn-sm btn-icon" data-delete="${v.id}" title="Delete permanently">
                      <span class="material-symbols-rounded" style="font-size:16px;color:var(--c-danger)">delete</span>
                    </button>
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;

  app.innerHTML = renderShell(
    'Vehicle Registry',
    `${store.vehicles.length} assets tracked`,
    `<button class="btn btn-primary" id="add-vehicle-btn"><span class="material-symbols-rounded">add</span> Add Vehicle</button>`,
    bodyContent
  );
  bindShellEvents();
  bindVehicleEvents();
}

function bindVehicleEvents() {
  document.getElementById('vehicle-search')?.addEventListener('input', debounce((e) => {
    searchQuery = e.target.value;
    renderVehicles();
  }, 200));

  document.querySelectorAll('#vehicle-type-filter .chip').forEach(chip => {
    chip.addEventListener('click', () => {
      filterType = chip.dataset.type;
      renderVehicles();
    });
  });

  document.querySelectorAll('#vehicle-status-filter .chip').forEach(chip => {
    chip.addEventListener('click', () => {
      filterStatus = chip.dataset.status;
      renderVehicles();
    });
  });

  document.getElementById('add-vehicle-btn')?.addEventListener('click', () => showVehicleModal());

  document.querySelectorAll('[data-edit]').forEach(btn => {
    btn.addEventListener('click', () => showVehicleModal(btn.dataset.edit));
  });

  document.querySelectorAll('[data-retire]').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (confirm('Mark this vehicle as Retired/Out of Service?')) {
        const r = await store.updateVehicle(btn.dataset.retire, { status: 'Retired' });
        if (r?.success) { toast('Vehicle retired', 'info'); renderVehicles(); } else toast(r?.error || 'Failed', 'error');
      }
    });
  });

  document.querySelectorAll('[data-reactivate]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const r = await store.updateVehicle(btn.dataset.reactivate, { status: 'Available' });
      if (r?.success) { toast('Vehicle reactivated', 'success'); renderVehicles(); } else toast(r?.error || 'Failed', 'error');
    });
  });

  document.querySelectorAll('[data-delete]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const vehicle = store.getVehicle(btn.dataset.delete);
      if (confirm(`Permanently delete "${vehicle?.name || 'this vehicle'}"?\nThis action cannot be undone.`)) {
        const r = await store.deleteVehicle(btn.dataset.delete);
        if (r?.success) { toast('Vehicle deleted', 'info'); renderVehicles(); } else toast(r?.error || 'Failed to delete', 'error');
      }
    });
  });
}

function showVehicleModal(editId) {
  const vehicle = editId ? store.getVehicle(editId) : null;
  const isEdit = !!vehicle;

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'vehicle-modal';
  overlay.innerHTML = `
    <div class="modal">
      <div class="modal-header">
        <h2 class="modal-title">${isEdit ? 'Edit Vehicle' : 'Add New Vehicle'}</h2>
        <button class="btn btn-ghost btn-icon" id="close-modal"><span class="material-symbols-rounded">close</span></button>
      </div>
      <form id="vehicle-form">
        <div class="modal-body">
          <div class="form-row-2">
            <div class="form-group">
              <label class="form-label">Vehicle Name</label>
              <input class="form-input" name="name" required placeholder="e.g. Volvo FH-16" maxlength="80" value="${vehicle?.name || ''}" />
            </div>
            <div class="form-group">
              <label class="form-label">Model Year</label>
              <input class="form-input" name="model" required type="number" placeholder="e.g. 2024" min="1900" max="2100" value="${vehicle?.model || ''}" title="Enter a valid 4-digit year (1900–2100)" />
            </div>
          </div>
          <div class="form-row-2">
            <div class="form-group">
              <label class="form-label">Vehicle Type</label>
              <select class="form-select" name="type" required>
                <option value="Truck" ${vehicle?.type === 'Truck' ? 'selected' : ''}>Truck</option>
                <option value="Van" ${vehicle?.type === 'Van' ? 'selected' : ''}>Van</option>
                <option value="Bike" ${vehicle?.type === 'Bike' ? 'selected' : ''}>Bike</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">License Plate</label>
              <input class="form-input" name="licensePlate" required placeholder="GJ-01-AB-1234" maxlength="13" pattern="[A-Z]{2}-[0-9]{2}-[A-Z]{1,3}-[0-9]{4}" title="Indian plate format: ST-DD-LL-NNNN e.g. GJ-01-AB-1234 (uppercase letters only)" value="${vehicle?.licensePlate || ''}" />
            </div>
          </div>
          <div class="form-row-2">
            <div class="form-group">
              <label class="form-label">Max Load Capacity (kg)</label>
              <input class="form-input" name="maxCapacity" type="number" required placeholder="e.g. 5000" min="1" max="100000" value="${vehicle?.maxCapacity || ''}" title="Enter capacity between 1 and 100,000 kg" />
            </div>
            <div class="form-group">
              <label class="form-label">Odometer (km)</label>
              <input class="form-input" name="odometer" type="number" required placeholder="e.g. 50000" min="0" max="9999999" value="${vehicle?.odometer || ''}" title="Enter odometer reading in km" />
            </div>
          </div>
          <div class="form-row-2">
            <div class="form-group">
              <label class="form-label">Region</label>
              <select class="form-select" name="region" required>
                ${['West', 'East', 'North', 'South', 'Central'].map(r => `<option ${vehicle?.region === r ? 'selected' : ''}>${r}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Location</label>
              <input class="form-input" name="location" placeholder="e.g. Ahmedabad Depot" value="${vehicle?.location || ''}" />
            </div>
          </div>
          <div class="form-row-2">
            <div class="form-group">
              <label class="form-label">Date of Purchase</label>
              <input class="form-input" name="dateAdded" type="date" value="${vehicle?.dateAdded || new Date().toISOString().slice(0, 10)}" />
            </div>
            <div class="form-group">
              <label class="form-label">Acquisition Cost (₹)</label>
              <input class="form-input" name="acquisitionCost" type="number" placeholder="e.g. 2000000" min="0" max="999999999" value="${vehicle?.acquisitionCost || ''}" title="Enter acquisition cost in rupees" />
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" id="cancel-modal">Cancel</button>
          <button type="submit" class="btn btn-primary">${isEdit ? 'Update Vehicle' : 'Add Vehicle'}</button>
        </div>
      </form>
    </div>
  `;

  document.body.appendChild(overlay);

  const close = () => overlay.remove();
  overlay.querySelector('#close-modal').addEventListener('click', close);
  overlay.querySelector('#cancel-modal').addEventListener('click', close);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

  overlay.querySelector('#vehicle-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);

    // Validate year is exactly 4 digits
    const yearVal = fd.get('model')?.trim();
    if (!/^\d{4}$/.test(yearVal)) {
      toast('Model year must be exactly 4 digits (e.g. 2024)', 'error');
      return;
    }

    const data = {
      name: fd.get('name'),
      model: fd.get('model'),
      type: fd.get('type'),
      licensePlate: fd.get('licensePlate'),
      maxCapacity: Number(fd.get('maxCapacity')),
      odometer: Number(fd.get('odometer')),
      region: fd.get('region'),
      location: fd.get('location') || '',
      dateAdded: fd.get('dateAdded') || new Date().toISOString().slice(0, 10),
      acquisitionCost: Number(fd.get('acquisitionCost')) || 0,
      status: vehicle?.status || 'Available',
    };

    const r = isEdit ? await store.updateVehicle(editId, data) : await store.addVehicle(data);
    if (r?.success) {
      toast(isEdit ? 'Vehicle updated successfully' : 'Vehicle added successfully', 'success');
      close();
      renderVehicles();
    } else {
      toast(r?.error || 'Failed', 'error');
    }
  });
}
