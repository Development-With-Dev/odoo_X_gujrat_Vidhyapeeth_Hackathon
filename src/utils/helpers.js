export function formatCurrency(amount) {
    return '₹' + Number(amount).toLocaleString('en-IN');
}

export function formatCompact(amount) {
    const n = Number(amount);
    if (isNaN(n)) return '₹0';
    const abs = Math.abs(n);
    const sign = n < 0 ? '-' : '';
    if (abs >= 1_00_00_000) return sign + '₹' + (abs / 1_00_00_000).toFixed(2).replace(/\.?0+$/, '') + ' Cr';
    if (abs >= 1_00_000) return sign + '₹' + (abs / 1_00_000).toFixed(2).replace(/\.?0+$/, '') + ' L';
    if (abs >= 1_000) return sign + '₹' + (abs / 1_000).toFixed(1).replace(/\.?0+$/, '') + 'K';
    return sign + '₹' + abs.toLocaleString('en-IN');
}

export function formatDate(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatDateTime(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function statusColor(status) {
    const map = {
        'Available': 'var(--c-success)',
        'On Trip': 'var(--c-info)',
        'In Shop': 'var(--c-warning)',
        'Retired': 'var(--c-muted)',
        'Draft': 'var(--c-muted)',
        'Dispatched': 'var(--c-info)',
        'Completed': 'var(--c-success)',
        'Cancelled': 'var(--c-danger)',
        'In Progress': 'var(--c-warning)',
        'On Duty': 'var(--c-success)',
        'Off Duty': 'var(--c-muted)',
        'Suspended': 'var(--c-danger)',
    };
    return map[status] || 'var(--c-muted)';
}

export function statusBg(status) {
    const map = {
        'Available': 'var(--c-success-bg)',
        'On Trip': 'var(--c-info-bg)',
        'In Shop': 'var(--c-warning-bg)',
        'Retired': 'var(--c-muted-bg)',
        'Draft': 'var(--c-muted-bg)',
        'Dispatched': 'var(--c-info-bg)',
        'Completed': 'var(--c-success-bg)',
        'Cancelled': 'var(--c-danger-bg)',
        'In Progress': 'var(--c-warning-bg)',
        'On Duty': 'var(--c-success-bg)',
        'Off Duty': 'var(--c-muted-bg)',
        'Suspended': 'var(--c-danger-bg)',
    };
    return map[status] || 'var(--c-muted-bg)';
}

export function pillHTML(status) {
    return `<span class="status-pill" style="color:${statusColor(status)};background:${statusBg(status)}">${status}</span>`;
}

export function vehicleIcon(type) {
    const map = { 'Truck': 'local_shipping', 'Van': 'airport_shuttle', 'Bike': 'two_wheeler' };
    return map[type] || 'directions_car';
}

export function toast(message, type = 'info') {
    const t = document.createElement('div');
    t.className = `toast toast-${type}`;
    t.innerHTML = `<span class="material-symbols-rounded">${type === 'success' ? 'check_circle' : type === 'error' ? 'error' : 'info'}</span><span>${message}</span>`;
    document.body.appendChild(t);
    requestAnimationFrame(() => t.classList.add('show'));
    setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 400); }, 3000);
}

export function exportCSV(data, filename) {
    if (!data.length) return;
    const keys = Object.keys(data[0]);
    const csv = [keys.join(','), ...data.map(row => keys.map(k => `"${row[k] ?? ''}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
}

export function exportPDF(title, sections) {
    const win = window.open('', '_blank');
    if (!win) { toast('Please allow popups to export PDF', 'error'); return; }
    const sectionHTML = sections.map(s => {
        if (s.type === 'kpi') {
            return `<div class="kpi-row">${s.items.map(k => `
                <div class="kpi-box">
                    <div class="kpi-val" style="color:${k.color || '#1a1a2e'}">${k.value}</div>
                    <div class="kpi-lbl">${k.label}</div>
                </div>`).join('')}</div>`;
        }
        if (s.type === 'table') {
            const headers = Object.keys(s.data[0] || {});
            return `<h2>${s.title}</h2>
                <table>
                    <thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
                    <tbody>${s.data.map(row => `<tr>${headers.map(h => `<td>${row[h] ?? ''}</td>`).join('')}</tr>`).join('')}</tbody>
                </table>`;
        }
        if (s.type === 'bar') {
            return `<h2>${s.title}</h2>
                <div class="bar-section">${s.items.map(b => `
                    <div class="bar-row">
                        <span class="bar-label">${b.label}</span>
                        <div class="bar-track"><div class="bar-fill" style="width:${b.pct}%;background:${b.color}"></div></div>
                        <span class="bar-val">${b.display}</span>
                    </div>`).join('')}</div>`;
        }
        return '';
    }).join('');

    win.document.write(`<!DOCTYPE html><html><head><title>${title}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700;800&display=swap');
        * { margin:0; padding:0; box-sizing:border-box; }
        body { font-family:'Inter',sans-serif; padding:40px; color:#1a1a2e; background:#fff; }
        .report-header { text-align:center; padding-bottom:24px; border-bottom:3px solid #6366f1; margin-bottom:32px; }
        .report-header h1 { font-size:28px; font-weight:800; color:#1a1a2e; }
        .report-header p { color:#64748b; font-size:13px; margin-top:6px; }
        .report-header .brand { font-size:12px; color:#6366f1; font-weight:700; letter-spacing:1px; text-transform:uppercase; margin-bottom:4px; }
        .kpi-row { display:flex; gap:16px; margin-bottom:28px; }
        .kpi-box { flex:1; background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:16px; text-align:center; }
        .kpi-val { font-size:22px; font-weight:800; }
        .kpi-lbl { font-size:11px; color:#64748b; margin-top:4px; font-weight:600; text-transform:uppercase; letter-spacing:.5px; }
        h2 { font-size:16px; font-weight:700; color:#1a1a2e; margin:24px 0 12px; padding-bottom:8px; border-bottom:2px solid #f1f5f9; }
        table { width:100%; border-collapse:collapse; font-size:12px; margin-bottom:24px; }
        th { background:#6366f1; color:#fff; padding:10px 12px; text-align:left; font-weight:600; font-size:11px; text-transform:uppercase; letter-spacing:.5px; }
        td { padding:8px 12px; border-bottom:1px solid #e2e8f0; }
        tr:nth-child(even) td { background:#f8fafc; }
        .bar-section { margin-bottom:24px; }
        .bar-row { display:flex; align-items:center; gap:12px; margin-bottom:10px; }
        .bar-label { width:120px; font-size:12px; font-weight:600; }
        .bar-track { flex:1; height:10px; background:#f1f5f9; border-radius:99px; overflow:hidden; }
        .bar-fill { height:100%; border-radius:99px; }
        .bar-val { width:100px; font-size:12px; text-align:right; font-weight:600; }
        .footer { margin-top:40px; padding-top:16px; border-top:2px solid #f1f5f9; text-align:center; font-size:11px; color:#94a3b8; }
        @media print {
            body { padding:20px; }
            .no-print { display:none; }
        }
    </style></head><body>
        <div class="report-header">
            <div class="brand">FleetFlow</div>
            <h1>${title}</h1>
            <p>Generated on ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
        </div>
        ${sectionHTML}
        <div class="footer">FleetFlow — Fleet & Logistics Management System • Confidential Report</div>
        <div class="no-print" style="text-align:center;margin-top:24px">
            <button onclick="window.print()" style="background:#6366f1;color:#fff;border:none;padding:12px 32px;border-radius:8px;font-weight:700;font-size:14px;cursor:pointer;font-family:Inter,sans-serif">📄 Save as PDF / Print</button>
        </div>
    </body></html>`);
    win.document.close();
}

export function debounce(fn, ms = 300) {
    let timer;
    return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), ms); };
}
