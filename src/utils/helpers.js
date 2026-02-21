export function formatCurrency(amount) {
  return '₹' + Number(amount).toLocaleString('en-IN');
}

export function animateCounters(selector = '[data-count]', duration = 1200) {
  document.querySelectorAll(selector).forEach(el => {
    const raw = el.getAttribute('data-count');
    const prefix = el.getAttribute('data-prefix') || '';
    const suffix = el.getAttribute('data-suffix') || '';
    const decimals = parseInt(el.getAttribute('data-decimals') || '0', 10);
    const target = parseFloat(raw);
    if (isNaN(target)) return;

    let start = null;
    const easeOut = t => 1 - Math.pow(1 - t, 4); // easeOutQuart

    function step(ts) {
      if (!start) start = ts;
      const elapsed = ts - start;
      const progress = Math.min(elapsed / duration, 1);
      const current = target * easeOut(progress);
      el.textContent = prefix + (decimals > 0 ? current.toFixed(decimals) : Math.round(current).toLocaleString('en-IN')) + suffix;
      if (progress < 1) requestAnimationFrame(step);
      else el.textContent = prefix + (decimals > 0 ? target.toFixed(decimals) : target.toLocaleString('en-IN')) + suffix;
    }
    requestAnimationFrame(step);
  });
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

export function exportPDF({ title, generated, sections, charts, kpis }) {
  const win = window.open('', '_blank');
  if (!win) { toast('Please allow pop-ups to export PDF', 'error'); return; }

  const now = generated || new Date().toLocaleString('en-IN', { dateStyle: 'long', timeStyle: 'short' });
  const docRef = 'FF-RPT-' + Date.now().toString(36).toUpperCase();

  const tableHTML = (rows) => {
    if (!rows || !rows.length) return '<p class="no-data">No data available for this section.</p>';
    const keys = Object.keys(rows[0]);
    return `<table>
            <thead><tr>${keys.map(k => `<th>${k}</th>`).join('')}</tr></thead>
            <tbody>${rows.map((r, i) => `<tr class="${i % 2 === 0 ? 'even' : 'odd'}">${keys.map(k => {
      const v = r[k] ?? '';
      const isNum = typeof v === 'number';
      return `<td${isNum ? ' class="num"' : ''}>${isNum ? v.toLocaleString('en-IN') : v}</td>`;
    }).join('')}</tr>`).join('')}</tbody>
        </table>`;
  };

  const kpiHTML = kpis && kpis.length ? `<div class="kpi-row">${kpis.map(k =>
    `<div class="kpi-box">
            <div class="kpi-val" style="color:${k.color || '#4338ca'}">${k.value}</div>
            <div class="kpi-lbl">${k.label}</div>
        </div>`
  ).join('')}</div>` : '';

  const chartSections = charts && charts.length ? charts.map(c =>
    `<div class="chart-block">
            <div class="chart-title">${c.title}</div>
            <img src="${c.image}" class="chart-img" alt="${c.title}" />
        </div>`
  ).join('') : '';

  win.document.write(`<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>${title}</title>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
      *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

      body {
        font-family: 'Inter', -apple-system, sans-serif;
        color: #1e293b;
        background: #fff;
        padding: 0;
        font-size: 11px;
        line-height: 1.5;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }

      .letterhead {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 24px 36px;
        border-bottom: 3px solid #4338ca;
        background: linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%);
      }
      .brand {
        display: flex;
        align-items: center;
        gap: 14px;
      }
      .brand-icon {
        width: 52px; height: 52px;
        border-radius: 14px;
        background: linear-gradient(135deg, #4338ca, #6366f1);
        display: flex; align-items: center; justify-content: center;
        color: #fff; font-size: 26px; font-weight: 800;
        box-shadow: 0 4px 14px rgba(67,56,202,0.3);
      }
      .brand-text h1 {
        font-size: 22px; font-weight: 800; color: #1e1b4b;
        letter-spacing: -0.5px;
      }
      .brand-text p {
        font-size: 10px; color: #6366f1; font-weight: 600;
        text-transform: uppercase; letter-spacing: 1.5px;
      }
      .doc-meta {
        text-align: right; font-size: 10px; color: #64748b;
        line-height: 1.8;
      }
      .doc-meta strong { color: #334155; }
      .doc-ref {
        display: inline-block; background: #4338ca; color: #fff;
        padding: 2px 10px; border-radius: 4px; font-weight: 700;
        font-size: 9px; letter-spacing: 0.5px; margin-top: 4px;
      }

      .title-bar {
        text-align: center;
        padding: 20px 36px;
        background: linear-gradient(135deg, #4338ca, #6366f1, #818cf8);
        color: #fff;
      }
      .title-bar h2 {
        font-size: 18px; font-weight: 800; letter-spacing: -0.3px;
        margin-bottom: 4px;
      }
      .title-bar p { font-size: 10px; opacity: 0.85; }

      .content { padding: 28px 36px; }

      .kpi-row {
        display: flex; gap: 12px; margin-bottom: 24px;
        flex-wrap: wrap;
      }
      .kpi-box {
        flex: 1; min-width: 120px;
        background: #f8fafc;
        border: 1.5px solid #e2e8f0;
        border-radius: 10px;
        padding: 14px 16px;
        text-align: center;
      }
      .kpi-val { font-size: 20px; font-weight: 800; }
      .kpi-lbl { font-size: 9px; color: #64748b; text-transform: uppercase; letter-spacing: 0.8px; font-weight: 600; margin-top: 2px; }

      .section {
        margin-bottom: 22px;
        page-break-inside: avoid;
      }
      .section-head {
        display: flex; align-items: center; gap: 8px;
        font-size: 13px; font-weight: 700; color: #1e293b;
        padding: 8px 14px;
        background: linear-gradient(90deg, #f1f5f9, transparent);
        border-left: 4px solid #4338ca;
        border-radius: 0 6px 6px 0;
        margin-bottom: 10px;
      }
      .section-head .sec-num {
        display: inline-flex; align-items: center; justify-content: center;
        width: 22px; height: 22px; border-radius: 6px;
        background: #4338ca; color: #fff;
        font-size: 10px; font-weight: 800;
      }

      table {
        width: 100%; border-collapse: collapse;
        font-size: 10px; margin-bottom: 6px;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        overflow: hidden;
      }
      thead { background: linear-gradient(135deg, #4338ca, #6366f1); }
      th {
        color: #fff; font-weight: 700; text-align: left;
        padding: 8px 10px; font-size: 9px;
        text-transform: uppercase; letter-spacing: 0.5px;
        border-right: 1px solid rgba(255,255,255,0.15);
      }
      th:last-child { border-right: none; }
      td {
        padding: 6px 10px;
        border-bottom: 1px solid #f1f5f9;
        border-right: 1px solid #f8fafc;
        color: #334155;
      }
      td:last-child { border-right: none; }
      td.num { text-align: right; font-variant-numeric: tabular-nums; font-weight: 500; }
      tr.even td { background: #fafbfe; }
      tr.odd td { background: #fff; }
      tr:hover td { background: #eef2ff !important; }
      .no-data {
        color: #94a3b8; font-style: italic;
        text-align: center; padding: 16px;
        background: #f8fafc; border-radius: 8px;
        border: 1px dashed #cbd5e1;
      }

      .charts-header {
        font-size: 14px; font-weight: 800; color: #1e293b;
        padding: 10px 14px; margin: 24px 0 16px;
        border-left: 4px solid #6366f1;
        background: linear-gradient(90deg, #eef2ff, transparent);
        border-radius: 0 6px 6px 0;
        page-break-before: always;
      }
      .charts-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
        margin-bottom: 20px;
      }
      .chart-block {
        border: 1.5px solid #e2e8f0;
        border-radius: 10px;
        overflow: hidden;
        background: #fafbfe;
        page-break-inside: avoid;
      }
      .chart-block.full { grid-column: 1 / -1; }
      .chart-title {
        font-size: 10px; font-weight: 700; color: #4338ca;
        padding: 8px 14px;
        background: linear-gradient(90deg, #f1f5f9, #fafbfe);
        border-bottom: 1px solid #e2e8f0;
        text-transform: uppercase; letter-spacing: 0.5px;
      }
      .chart-img {
        width: 100%; height: auto;
        display: block;
        padding: 10px;
        background: #0f172a;
        border-radius: 0 0 8px 8px;
      }

      .page-footer {
        margin-top: 32px;
        padding: 16px 36px;
        border-top: 2px solid #e2e8f0;
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 9px;
        color: #94a3b8;
        background: #f8fafc;
      }
      .page-footer .conf {
        background: #fef2f2;
        color: #dc2626;
        padding: 2px 8px;
        border-radius: 3px;
        font-weight: 700;
        font-size: 8px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .watermark {
        position: fixed; top: 50%; left: 50%;
        transform: translate(-50%, -50%) rotate(-35deg);
        font-size: 90px; font-weight: 900;
        color: rgba(67,56,202,0.03);
        pointer-events: none; z-index: 0;
        letter-spacing: 10px;
        white-space: nowrap;
      }

      @media print {
        body { padding: 0; }
        .no-print { display: none; }
        @page { size: A4 landscape; margin: 10mm; }
        .letterhead { -webkit-print-color-adjust: exact; }
        .title-bar { -webkit-print-color-adjust: exact; }
        thead { -webkit-print-color-adjust: exact; }
        .chart-img { -webkit-print-color-adjust: exact; }
        .watermark { position: fixed; }
      }
    </style></head><body>

    <div class="watermark">FLEETFLOW</div>

    <!-- LETTERHEAD -->
    <div class="letterhead">
      <div class="brand">
        <div class="brand-icon">FF</div>
        <div class="brand-text">
          <h1>FleetFlow</h1>
          <p>Fleet & Logistics Management System</p>
        </div>
      </div>
      <div class="doc-meta">
        <div><strong>Date:</strong> ${now}</div>
        <div><strong>Prepared by:</strong> FleetFlow Analytics Engine</div>
        <div><strong>Format:</strong> Official Report</div>
        <div class="doc-ref">${docRef}</div>
      </div>
    </div>

    <!-- TITLE -->
    <div class="title-bar">
      <h2>${title}</h2>
      <p>Comprehensive fleet performance analysis and financial overview</p>
    </div>

    <div class="content">
      <!-- KPIs -->
      ${kpiHTML ? '<div style="margin-bottom:6px;font-size:11px;font-weight:700;color:#4338ca;text-transform:uppercase;letter-spacing:1px">Executive Summary</div>' + kpiHTML : ''}

      <!-- DATA SECTIONS -->
      ${sections.map((s, i) => `<div class="section">
        <div class="section-head"><span class="sec-num">${i + 1}</span> ${s.heading}</div>
        ${tableHTML(s.rows)}
      </div>`).join('')}

      <!-- CHARTS -->
      ${chartSections ? `
        <div class="charts-header">📊 Visual Analytics — Charts & Graphs</div>
        <div class="charts-grid">
          ${charts.map((c, i) => `<div class="chart-block${i === 0 || i === 3 || i === 4 ? ' full' : ''}">
            <div class="chart-title">${c.title}</div>
            <img src="${c.image}" class="chart-img" alt="${c.title}" />
          </div>`).join('')}
        </div>
      ` : ''}
    </div>

    <!-- FOOTER -->
    <div class="page-footer">
      <div>FleetFlow © ${new Date().getFullYear()} — All rights reserved</div>
      <div style="text-align:center">
        <span class="conf">CONFIDENTIAL</span>
        <div style="margin-top:3px">This report is auto-generated and intended for internal use only.</div>
      </div>
      <div style="text-align:right">
        <div>Ref: ${docRef}</div>
        <div>${now}</div>
      </div>
    </div>

    <script>
      window.onload = function() {
        setTimeout(function() { window.print(); }, 400);
      };
    <\/script>
    </body></html>`);
  win.document.close();
}

export function debounce(fn, ms = 300) {
  let timer;
  return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), ms); };
}
