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


export function exportExcel(sheets, filename) {
    import('xlsx').then(XLSX => {
        const wb = XLSX.utils.book_new();
        const sheetMap = Array.isArray(sheets) ? { Report: sheets } : sheets;
        for (const [name, data] of Object.entries(sheetMap)) {
            if (!data || !data.length) continue;
            const ws = XLSX.utils.json_to_sheet(data);
            const keys = Object.keys(data[0]);
            ws['!cols'] = keys.map(k => {
                const maxLen = Math.max(k.length, ...data.map(r => String(r[k] ?? '').length));
                return { wch: Math.min(maxLen + 2, 40) };
            });
            XLSX.utils.book_append_sheet(wb, ws, name.slice(0, 31));
        }
        XLSX.writeFile(wb, filename);
    });
}

export function exportPDF({ title, generated, sections }) {
    const win = window.open('', '_blank');
    if (!win) { toast('Please allow pop-ups to export PDF', 'error'); return; }

    const tableHTML = (rows) => {
        if (!rows || !rows.length) return '<p style="color:#888">No data available.</p>';
        const keys = Object.keys(rows[0]);
        return `<table>
            <thead><tr>${keys.map(k => `<th>${k}</th>`).join('')}</tr></thead>
            <tbody>${rows.map(r => `<tr>${keys.map(k => `<td>${r[k] ?? ''}</td>`).join('')}</tr>`).join('')}</tbody>
        </table>`;
    };

    win.document.write(`<!DOCTYPE html><html><head><title>${title}</title>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { font-family: 'Inter', sans-serif; color: #1a1a2e; padding: 40px; background: #fff; }
      .header { text-align: center; margin-bottom: 32px; padding-bottom: 20px; border-bottom: 3px solid #6c63ff; }
      .header h1 { font-size: 24px; color: #6c63ff; margin-bottom: 4px; }
      .header p { font-size: 12px; color: #888; }
      .section { margin-bottom: 28px; }
      .section h2 { font-size: 15px; color: #fff; background: linear-gradient(135deg, #6c63ff, #48c6ef); padding: 8px 16px; border-radius: 6px; margin-bottom: 10px; }
      table { width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 8px; }
      th { background: #f0f0f8; color: #333; font-weight: 700; text-align: left; padding: 8px 10px; border-bottom: 2px solid #ddd; }
      td { padding: 7px 10px; border-bottom: 1px solid #eee; }
      tr:nth-child(even) td { background: #fafafe; }
      .footer { text-align: center; font-size: 10px; color: #aaa; margin-top: 32px; padding-top: 16px; border-top: 1px solid #eee; }
      @media print { body { padding: 20px; } .no-print { display: none; } @page { size: A4 landscape; margin: 15mm; } }
    </style></head><body>
    <div class="header">
      <h1>📊 ${title}</h1>
      <p>Generated: ${generated || new Date().toLocaleString('en-IN')}</p>
    </div>
    ${sections.map(s => `<div class="section"><h2>${s.heading}</h2>${tableHTML(s.rows)}</div>`).join('')}
    <div class="footer">FleetFlow — Fleet & Logistics Management System</div>
    <script>window.onload=function(){window.print();}<\/script>
    </body></html>`);
    win.document.close();
}

export function debounce(fn, ms = 300) {
    let timer;
    return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), ms); };
}
