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

export function exportExcel(data, filename, sheetName = 'Report') {
    if (!data.length) return;
    import('xlsx').then(XLSX => {
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, sheetName);
        XLSX.writeFile(wb, filename);
    });
}

export function debounce(fn, ms = 300) {
    let timer;
    return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), ms); };
}
