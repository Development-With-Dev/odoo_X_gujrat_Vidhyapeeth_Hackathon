import { store } from '../store/data.js';
import { renderShell, bindShellEvents } from '../components/shell.js';
import { pillHTML, formatDate, toast } from '../utils/helpers.js';

let driverFilter = 'All';
const today = () => new Date().toISOString().slice(0, 10);

export function renderDrivers() {
    const app = document.getElementById('app');
    let drivers = store.drivers;
    if (driverFilter !== 'All') drivers = drivers.filter(d => d.status === driverFilter);
    const avgSafety = drivers.length ? (drivers.reduce((s, d) => s + d.safetyScore, 0) / drivers.length).toFixed(0) : 0;
    const expiredCount = store.drivers.filter(d => d.licenseExpiry < today()).length;
    const statuses = ['All', 'On Duty', 'On Trip', 'Off Duty', 'Suspended'];
    const expiredDrivers = store.drivers.filter(d => d.licenseExpiry < today());

    const body = `
  <div class="kpi-grid" style="grid-template-columns:repeat(4,1fr)">
    <div class="kpi-card"><div class="kpi-icon blue"><span class="material-symbols-rounded">groups</span></div><div class="kpi-value">${store.drivers.length}</div><div class="kpi-label">Total Drivers</div></div>
    <div class="kpi-card"><div class="kpi-icon green"><span class="material-symbols-rounded">shield</span></div><div class="kpi-value">${avgSafety}</div><div class="kpi-label">Avg Safety Score</div>
      <div class="kpi-sub"><div style="flex:1;height:6px;background:var(--bg-elevated);border-radius:99px"><div style="width:${avgSafety}%;height:100%;background:${avgSafety >= 80 ? 'var(--c-success)' : avgSafety >= 60 ? 'var(--c-warning)' : 'var(--c-danger)'};border-radius:99px"></div></div></div></div>
    <div class="kpi-card"><div class="kpi-icon red"><span class="material-symbols-rounded">gpp_bad</span></div><div class="kpi-value" style="color:${expiredCount ? 'var(--c-danger)' : 'var(--c-success)'}">${expiredCount}</div><div class="kpi-label">Expired Licenses</div></div>
    <div class="kpi-card"><div class="kpi-icon purple"><span class="material-symbols-rounded">emoji_events</span></div><div class="kpi-value">${store.drivers.reduce((s, d) => s + d.tripsCompleted, 0)}</div><div class="kpi-label">Total Trips Done</div></div>
  </div>
  <div class="filter-bar"><div class="filter-chips" id="df">${statuses.map(s => `<button class="chip ${driverFilter === s ? 'active' : ''}" data-s="${s}">${s === 'All' ? 'All Drivers' : s}</button>`).join('')}</div></div>
  ${expiredDrivers.length ? `<div class="card mb-6" style="border-color:rgba(239,68,68,.3)"><div class="card-header" style="background:var(--c-danger-bg)"><span class="card-title flex items-center gap-2" style="color:var(--c-danger)"><span class="material-symbols-rounded">warning</span>Expired License Alerts</span></div><div class="card-body">${expiredDrivers.map(d => `<div class="flex items-center gap-3" style="padding:4px 0"><div class="driver-avatar">${d.name[0]}</div><span style="font-weight:600;flex:1">${d.name}</span><span class="text-sm" style="color:var(--c-danger)">Expired: ${formatDate(d.licenseExpiry)}</span></div>`).join('')}</div></div>` : ''}
  <div class="card"><div class="data-table-wrap"><table class="data-table"><thead><tr><th>Driver</th><th>Phone</th><th>License</th><th>Categories</th><th>Expiry</th><th>Safety</th><th>Trips</th><th>Status</th><th>Actions</th></tr></thead><tbody>
  ${drivers.map(d => {
        const exp = d.licenseExpiry < today(); const rate = d.tripsCompleted + d.tripsCancelled > 0 ? ((d.tripsCompleted / (d.tripsCompleted + d.tripsCancelled)) * 100).toFixed(0) : 100; return `<tr>
    <td><div class="flex items-center gap-3"><div class="driver-avatar">${d.name[0]}</div><div style="font-weight:600">${d.name}</div></div></td>
    <td class="text-sm">${d.phone}</td>
    <td><code style="background:var(--bg-elevated);padding:2px 6px;border-radius:4px;font-size:var(--fs-xs)">${d.licenseNumber}</code></td>
    <td>${d.licenseCategory.split(',').map(c => `<span class="status-pill" style="background:var(--c-accent-bg);color:var(--c-accent-light);margin:1px">${c.trim()}</span>`).join('')}</td>
    <td><span style="color:${exp ? 'var(--c-danger)' : 'var(--text-primary)'};font-weight:${exp ? 700 : 400}">${exp ? '⚠ ' : ''}${formatDate(d.licenseExpiry)}</span></td>
    <td><div class="flex items-center gap-2"><span style="font-weight:700;color:${d.safetyScore >= 80 ? 'var(--c-success)' : d.safetyScore >= 60 ? 'var(--c-warning)' : 'var(--c-danger)'}">${d.safetyScore}</span><div style="width:50px;height:5px;background:var(--bg-elevated);border-radius:99px"><div style="width:${d.safetyScore}%;height:100%;background:${d.safetyScore >= 80 ? 'var(--c-success)' : d.safetyScore >= 60 ? 'var(--c-warning)' : 'var(--c-danger)'};border-radius:99px"></div></div></div></td>
    <td><span style="font-weight:600">${d.tripsCompleted}</span><span class="text-xs text-muted"> (${rate}%)</span></td>
    <td>${pillHTML(d.status)}</td>
    <td><div class="flex gap-2"><button class="btn btn-ghost btn-sm btn-icon" data-ed="${d.id}"><span class="material-symbols-rounded" style="font-size:16px">edit</span></button><select class="form-select" style="padding:4px 28px 4px 8px;font-size:var(--fs-xs);width:auto;min-width:90px" data-st="${d.id}">${['On Duty', 'Off Duty', 'Suspended'].map(s => `<option ${d.status === s ? 'selected' : ''}>${s}</option>`).join('')}</select></div></td>
  </tr>`}).join('')}</tbody></table></div></div>`;

    app.innerHTML = renderShell('Driver Profiles & Safety', 'Compliance, performance, and status management', `<button class="btn btn-primary" id="adb"><span class="material-symbols-rounded">person_add</span> Add Driver</button>`, body);
    bindShellEvents();
    document.querySelectorAll('#df .chip').forEach(c => c.addEventListener('click', () => { driverFilter = c.dataset.s; renderDrivers(); }));
    document.querySelectorAll('[data-st]').forEach(s => s.addEventListener('change', async () => { const r = await store.updateDriver(s.dataset.st, { status: s.value }); if (r?.success) { toast(`Status → ${s.value}`, 'info'); renderDrivers(); } else toast(r?.error || 'Failed', 'error'); }));
    document.querySelectorAll('[data-ed]').forEach(b => b.addEventListener('click', () => showDriverModal(b.dataset.ed)));
    document.getElementById('adb')?.addEventListener('click', () => showDriverModal());
}

function showDriverModal(editId) {
    const d = editId ? store.getDriver(editId) : null;
    const isEdit = !!d;
    const o = document.createElement('div'); o.className = 'modal-overlay';
    o.innerHTML = `<div class="modal modal-lg"><div class="modal-header"><h2 class="modal-title">${isEdit ? 'Edit' : 'Add'} Driver</h2><button class="btn btn-ghost btn-icon" id="cm"><span class="material-symbols-rounded">close</span></button></div>
  <form id="df"><div class="modal-body">
    <div class="form-row-2"><div class="form-group"><label class="form-label">Full Name</label><input class="form-input" name="name" required value="${d?.name || ''}"/></div><div class="form-group"><label class="form-label">Phone</label><input class="form-input" name="phone" required value="${d?.phone || ''}"/></div></div>
    <div class="form-row-2"><div class="form-group"><label class="form-label">License Number</label><input class="form-input" name="licenseNumber" required value="${d?.licenseNumber || ''}"/></div><div class="form-group"><label class="form-label">License Expiry</label><input class="form-input" name="licenseExpiry" type="date" required value="${d?.licenseExpiry || ''}"/></div></div>
    <div class="form-group"><label class="form-label">License Categories (comma-separated: Truck,Van,Bike)</label><input class="form-input" name="licenseCategory" required value="${d?.licenseCategory || ''}"/></div>
    <div class="form-group"><label class="form-label">Status</label><select class="form-select" name="status">${['On Duty', 'Off Duty'].map(s => `<option ${d?.status === s ? 'selected' : ''}>${s}</option>`).join('')}</select></div>
  </div><div class="modal-footer"><button type="button" class="btn btn-secondary" id="ccm">Cancel</button><button type="submit" class="btn btn-primary">${isEdit ? 'Update' : 'Add'}</button></div></form></div>`;
    document.body.appendChild(o);
    const close = () => o.remove();
    o.querySelector('#cm').addEventListener('click', close);
    o.querySelector('#ccm').addEventListener('click', close);
    o.addEventListener('click', e => { if (e.target === o) close(); });
    o.querySelector('#df').addEventListener('submit', async e => {
        e.preventDefault(); const fd = new FormData(e.target); const data = { name: fd.get('name'), phone: fd.get('phone'), licenseNumber: fd.get('licenseNumber'), licenseExpiry: fd.get('licenseExpiry'), licenseCategory: fd.get('licenseCategory'), status: fd.get('status') };
        const r = isEdit ? await store.updateDriver(editId, data) : await store.addDriver(data);
        if (r?.success) { toast(isEdit ? 'Driver updated' : 'Driver added', 'success'); close(); renderDrivers(); } else toast(r?.error || 'Failed', 'error');
    });
}
