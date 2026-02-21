import { store } from '../store/data.js';
import { renderShell, bindShellEvents } from '../components/shell.js';
import { formatCurrency, formatCompact, vehicleIcon, exportCSV, exportExcel, exportPDF, toast } from '../utils/helpers.js';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

/* ─── Custom crosshair plugin ────────────────────────────── */
const crosshairPlugin = {
  id: 'crosshair',
  afterDraw(chart) {
    if (chart.tooltip?._active?.length) {
      const ctx = chart.ctx;
      const x = chart.tooltip._active[0].element.x;
      const topY = chart.scales.y.top;
      const bottomY = chart.scales.y.bottom;
      ctx.save();
      ctx.beginPath();
      ctx.setLineDash([4, 4]);
      ctx.moveTo(x, topY);
      ctx.lineTo(x, bottomY);
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(99,102,241,0.4)';
      ctx.stroke();
      ctx.restore();
    }
  }
};

/* ─── Custom center text plugin for doughnut ──────────────── */
const centerTextPlugin = {
  id: 'centerText',
  afterDraw(chart) {
    if (chart.config.type !== 'doughnut') return;
    const { ctx, width, height } = chart;
    const meta = chart.getDatasetMeta(0);
    const total = meta.total;
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '800 22px Inter, sans-serif';
    ctx.fillStyle = '#f0f2f8';
    const cx = width / 2;
    const cy = height / 2 - 6;
    ctx.fillText('₹' + (total >= 100000 ? (total / 100000).toFixed(1) + 'L' : total >= 1000 ? (total / 1000).toFixed(0) + 'K' : total), cx, cy);
    ctx.font = '500 11px Inter, sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.fillText('Total Cost', cx, cy + 22);
    ctx.restore();
  }
};

Chart.register(crosshairPlugin, centerTextPlugin);

/* ─── Color Palette ──────────────────────────────────────── */
const C = {
  primary: '#6366f1', primaryLight: '#818cf8', primaryGlow: 'rgba(99,102,241,0.35)',
  success: '#22c55e', successLight: '#4ade80', successGlow: 'rgba(34,197,94,0.25)',
  danger: '#ef4444', dangerLight: '#f87171', dangerGlow: 'rgba(239,68,68,0.25)',
  warning: '#f59e0b', warningLight: '#fbbf24',
  info: '#3b82f6', infoLight: '#60a5fa',
  purple: '#a855f7', purpleLight: '#c084fc',
  cyan: '#06b6d4', rose: '#f43f5e', emerald: '#10b981',
  text: '#f0f2f8', textSec: '#94a3b8', textMuted: '#64748b',
  grid: 'rgba(255,255,255,0.05)', bgCard: '#1a1f35',
};

/* ─── Gradient helper ────────────────────────────────────── */
function makeGradient(ctx, chartArea, c1, c2) {
  const g = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
  g.addColorStop(0, c1);
  g.addColorStop(1, c2);
  return g;
}

/* ─── Shared tooltip ─────────────────────────────────────── */
const prettyTooltip = {
  backgroundColor: 'rgba(15,23,42,0.95)', titleColor: '#f0f2f8', bodyColor: '#cbd5e1',
  borderColor: 'rgba(99,102,241,0.3)', borderWidth: 1, padding: 14, cornerRadius: 12,
  titleFont: { family: "'Inter',sans-serif", weight: '700', size: 13 },
  bodyFont: { family: "'Inter',sans-serif", size: 12 },
  displayColors: true, boxPadding: 6, usePointStyle: true,
  titleMarginBottom: 8,
  caretSize: 8,
  animation: { duration: 150 },
};

/* ─── Chart instance manager ─────────────────────────────── */
const instances = {};
function makeChart(id, cfg) {
  if (instances[id]) instances[id].destroy();
  const el = document.getElementById(id);
  if (!el) return;
  instances[id] = new Chart(el.getContext('2d'), cfg);
  return instances[id];
}

/* ═══════════════════════════════════════════════════════════
   RENDER
   ═══════════════════════════════════════════════════════════ */
export function renderAnalytics() {
  const app = document.getElementById('app');
  const vehicles = store.vehicles.filter(v => v.status !== 'Retired');
  const completedTrips = store.trips.filter(t => t.status === 'Completed');
  const totalRevenue = completedTrips.reduce((s, t) => s + (t.revenue || 0), 0);
  const totalFuel = store.fuelLogs.reduce((s, f) => s + f.totalCost, 0);
  const totalMaint = store.maintenance.reduce((s, m) => s + m.cost, 0);
  const totalExpense = store.expenses.reduce((s, e) => s + e.amount, 0);
  const netProfit = totalRevenue - totalFuel - totalMaint - totalExpense;

  /* ─── Vehicle metrics ─── */
  const vm = vehicles.map(v => {
    const fl = store.getFuelLogsForVehicle(v.id);
    const liters = fl.reduce((s, f) => s + f.liters, 0);
    const vTrips = store.trips.filter(t => t.vehicleId === v.id && t.status === 'Completed').sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));
    const km = vTrips.reduce((s, t) => (t.endOdometer && t.startOdometer) ? s + (t.endOdometer - t.startOdometer) : s, 0);
    const eff = liters > 0 ? parseFloat((km / liters).toFixed(1)) : 0;
    const rev = store.getTotalRevenue(v.id);
    const ops = store.getTotalOperationalCost(v.id);
    const roi = Number(store.getVehicleROI(v.id));
    const cpk = km > 0 ? (ops / km).toFixed(1) : '—';

    /* ─── Last Trip Cost per KM (Fuel) ─── */
    let lastTripFuelCpk = 0;
    if (vTrips.length) {
      const lastT = vTrips[0];
      const tKm = (lastT.endOdometer || 0) - (lastT.startOdometer || 0);
      if (tKm > 0) {
        // Find fuel logs recorded near or for this trip
        const tDate = new Date(lastT.completedAt || lastT.dispatchedAt).getTime();
        const nearestFuel = fl.sort((a, b) => Math.abs(new Date(a.date).getTime() - tDate) - Math.abs(new Date(b.date).getTime() - tDate))[0];
        if (nearestFuel) {
          lastTripFuelCpk = parseFloat((nearestFuel.totalCost / tKm).toFixed(2));
        }
      }
    }

    const allT = store.trips.filter(t => t.vehicleId === v.id);
    const last = allT.length ? allT.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0].createdAt : null;
    const idle = last ? Math.floor((Date.now() - new Date(last)) / 864e5) : 999;
    const dead = v.status === 'Available' && (idle > 7 || vTrips.length === 0);
    return { ...v, liters, km, eff, rev, ops, roi, cpk, lastTripFuelCpk, trips: vTrips.length, idle, dead };
  });

  const avgEff = vm.filter(v => v.eff > 0).length > 0 ? +(vm.filter(v => v.eff > 0).reduce((s, v) => s + v.eff, 0) / vm.filter(v => v.eff > 0).length).toFixed(1) : 0;
  const deadVehicles = vm.filter(v => v.dead);

  /* ─── Monthly aggregation ─── */
  const mm = {};
  const addMonth = (date, field, val) => {
    if (!date) return;
    const d = new Date(date);
    const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (!mm[k]) mm[k] = { rev: 0, fuel: 0, maint: 0, exp: 0, trips: 0 };
    mm[k][field] += val;
  };
  store.trips.forEach(t => { addMonth(t.createdAt, 'trips', 1); if (t.status === 'Completed') addMonth(t.createdAt, 'rev', t.revenue || 0); });
  store.fuelLogs.forEach(f => addMonth(f.date, 'fuel', f.totalCost || 0));
  store.maintenance.forEach(m => addMonth(m.date, 'maint', m.cost || 0));
  store.expenses.forEach(e => addMonth(e.date, 'exp', e.amount || 0));
  const mKeys = Object.keys(mm).sort();
  const mLabels = mKeys.map(k => { const [y, m] = k.split('-'); return new Date(y, m - 1).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }); });
  const mRev = mKeys.map(k => mm[k].rev);
  const mCost = mKeys.map(k => mm[k].fuel + mm[k].maint + mm[k].exp);
  const mProfit = mKeys.map((_, i) => mRev[i] - mCost[i]);
  const mTrips = mKeys.map(k => mm[k].trips);

  /* ─── Driver radar data ─── */
  const topDrivers = [...store.drivers].sort((a, b) => b.safetyScore - a.safetyScore).slice(0, 5);

  /* ═══ HTML ═══ */
  const body = `
  <div class="kpi-grid">
    <div class="kpi-card animate-slide-up stagger-1"><div class="kpi-icon green"><span class="material-symbols-rounded">trending_up</span></div>
      <div class="kpi-value" style="color:var(--c-success)" title="${formatCurrency(totalRevenue)}">${formatCompact(totalRevenue)}</div><div class="kpi-label">Total Revenue</div></div>
    <div class="kpi-card animate-slide-up stagger-2"><div class="kpi-icon red"><span class="material-symbols-rounded">money_off</span></div>
      <div class="kpi-value" style="color:var(--c-danger)" title="${formatCurrency(totalFuel + totalMaint + totalExpense)}">${formatCompact(totalFuel + totalMaint + totalExpense)}</div><div class="kpi-label">Total Costs</div></div>
    <div class="kpi-card animate-slide-up stagger-3"><div class="kpi-icon ${netProfit >= 0 ? 'green' : 'red'}"><span class="material-symbols-rounded">${netProfit >= 0 ? 'savings' : 'warning'}</span></div>
      <div class="kpi-value" style="color:${netProfit >= 0 ? 'var(--c-success)' : 'var(--c-danger)'}" title="${formatCurrency(netProfit)}">${formatCompact(netProfit)}</div><div class="kpi-label">Net Profit</div></div>
    <div class="kpi-card animate-slide-up stagger-4"><div class="kpi-icon blue"><span class="material-symbols-rounded">bar_chart</span></div>
      <div class="kpi-value">${completedTrips.length}</div><div class="kpi-label">Completed Trips</div></div>
  </div>

  <!-- CHART 1: Revenue & Cost Trend -->
  <div class="card analytics-chart-card mb-6">
    <div class="card-header"><span class="card-title flex items-center gap-2"><span class="material-symbols-rounded" style="color:${C.success}">show_chart</span> Revenue & Cost Trend</span></div>
    <div class="card-body"><div class="chart-container" style="height:340px"><canvas id="ch-trend"></canvas></div></div>
  </div>

  <div class="grid-2 mb-6">
    <!-- CHART 2: Cost Doughnut -->
    <div class="card analytics-chart-card">
      <div class="card-header"><span class="card-title flex items-center gap-2"><span class="material-symbols-rounded" style="color:${C.warning}">donut_large</span> Cost Breakdown</span></div>
      <div class="card-body"><div class="chart-container" style="height:300px"><canvas id="ch-donut"></canvas></div></div>
    </div>
    <!-- CHART 3: Trips Bar -->
    <div class="card analytics-chart-card">
      <div class="card-header"><span class="card-title flex items-center gap-2"><span class="material-symbols-rounded" style="color:${C.purple}">insights</span> Monthly Trip Volume</span></div>
      <div class="card-body"><div class="chart-container" style="height:300px"><canvas id="ch-trips"></canvas></div></div>
    </div>
  </div>

  <!-- CHART 4: Fuel Efficiency -->
  <div class="card analytics-chart-card mb-6">
    <div class="card-header" style="background:linear-gradient(90deg,rgba(245,158,11,0.06),transparent)">
      <span class="card-title flex items-center gap-2"><span class="material-symbols-rounded" style="color:${C.warning}">local_gas_station</span> Fuel Efficiency per Vehicle</span>
      <span class="status-pill" style="background:var(--c-warning-bg);color:var(--c-warning)">Avg: ${avgEff} km/L</span>
    </div>
    <div class="card-body"><div class="chart-container" style="height:${Math.max(260, vm.filter(v => v.eff > 0).length * 42)}px"><canvas id="ch-fuel"></canvas></div></div>
  </div>

  <!-- CHART 5: Last Trip Fuel CPK -->
  <div class="card analytics-chart-card mb-6">
    <div class="card-header" style="background:linear-gradient(90deg,rgba(59,130,246,0.06),transparent)">
      <span class="card-title flex items-center gap-2"><span class="material-symbols-rounded" style="color:${C.info}">speed</span> Last Trip Performance (Fuel ₹/km)</span>
      <span class="text-xs text-muted">Based on most recent completed trip and nearest fuel log</span>
    </div>
    <div class="card-body"><div class="chart-container" style="height:280px"><canvas id="ch-last-cpk"></canvas></div></div>
  </div>

  <!-- CHART 6: ROI -->
  <div class="card analytics-chart-card mb-6">
    <div class="card-header" style="background:linear-gradient(90deg,rgba(99,102,241,0.06),transparent)">
      <span class="card-title flex items-center gap-2"><span class="material-symbols-rounded" style="color:${C.primary}">account_balance</span> Vehicle ROI — Revenue vs Cost</span>
      <button class="btn btn-ghost btn-sm" id="exp-roi"><span class="material-symbols-rounded" style="font-size:16px">download</span> CSV</button>
    </div>
    <div class="card-body"><div class="chart-container" style="height:${Math.max(300, vm.length * 46)}px"><canvas id="ch-roi"></canvas></div></div>
  </div>

  <div class="grid-2 mb-6">
    <!-- CHART 7: Profit Area -->
    <div class="card analytics-chart-card">
      <div class="card-header"><span class="card-title flex items-center gap-2"><span class="material-symbols-rounded" style="color:${C.primary}">monitoring</span> Monthly Profit</span></div>
      <div class="card-body"><div class="chart-container" style="height:300px"><canvas id="ch-profit"></canvas></div></div>
    </div>
    <!-- CHART 8: Driver Radar -->
    <div class="card analytics-chart-card">
      <div class="card-header"><span class="card-title flex items-center gap-2"><span class="material-symbols-rounded" style="color:gold">emoji_events</span> Top Drivers — Performance Radar</span></div>
      <div class="card-body"><div class="chart-container" style="height:300px"><canvas id="ch-radar"></canvas></div></div>
    </div>
  </div>

  <!-- DEAD STOCK -->
  <div class="card mb-6" style="border-color:${deadVehicles.length ? 'rgba(245,158,11,0.3)' : 'var(--border-subtle)'}">
    <div class="card-header" style="${deadVehicles.length ? 'background:linear-gradient(90deg,rgba(245,158,11,0.08),transparent)' : ''}">
      <span class="card-title flex items-center gap-2">
        <span class="material-symbols-rounded" style="color:${deadVehicles.length ? C.warning : C.success}">${deadVehicles.length ? 'inventory' : 'verified'}</span>
        Dead Stock Alerts ${deadVehicles.length ? `<span class="nav-item-badge">${deadVehicles.length}</span>` : ''}
      </span>
    </div>
    <div class="card-body">
      ${deadVehicles.length === 0 ? `<div style="text-align:center;padding:var(--sp-8)"><span class="material-symbols-rounded" style="font-size:48px;color:var(--c-success);opacity:.4;display:block;margin-bottom:var(--sp-3)">check_circle</span><p style="font-weight:600;color:var(--c-success)">All vehicles are active!</p><p class="text-sm text-muted">No idle vehicles detected in the last 7 days.</p></div>`
      : `<div style="padding:var(--sp-3) var(--sp-4);background:var(--c-warning-bg);border-radius:var(--radius-md);margin-bottom:var(--sp-4);border:1px solid rgba(245,158,11,0.15)"><span style="font-weight:600;color:var(--c-warning);font-size:var(--fs-sm)">⚠ ${deadVehicles.length} vehicle${deadVehicles.length > 1 ? 's are' : ' is'} sitting idle — consider reassigning or selling</span></div>
        <div class="data-table-wrap"><table class="data-table"><thead><tr><th>Vehicle</th><th>Type</th><th>Idle</th><th>Trips</th><th>Revenue</th><th>Cost</th><th>Action</th></tr></thead><tbody>
        ${deadVehicles.map(v => `<tr><td><div class="flex items-center gap-2"><div class="vehicle-thumb ${v.type.toLowerCase()}"><span class="material-symbols-rounded" style="font-size:16px">${vehicleIcon(v.type)}</span></div><div><div style="font-weight:600;font-size:var(--fs-sm)">${v.name}</div><div class="text-xs text-muted">${v.licensePlate}</div></div></div></td><td>${v.type}</td><td><span style="font-weight:700;color:var(--c-warning)">${v.idle >= 999 ? 'Never' : v.idle + 'd'}</span></td><td>${v.trips}</td><td style="color:var(--c-success)">${formatCurrency(v.rev)}</td><td style="color:var(--c-danger)">${formatCurrency(v.ops)}</td><td><span class="status-pill" style="background:var(--c-info-bg);color:var(--c-info)">Reassign</span></td></tr>`).join('')}
        </tbody></table></div>`}
    </div>
  </div>

  <!-- ONE-CLICK REPORTS -->
  <div class="card mb-6">
    <div class="card-header"><span class="card-title flex items-center gap-2"><span class="material-symbols-rounded" style="color:${C.primaryLight}">summarize</span> One-Click Reports</span></div>
    <div class="card-body">
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:var(--sp-4)">
        <button class="one-click-report-card" id="exp-pdf"><div style="width:48px;height:48px;border-radius:var(--radius-lg);background:linear-gradient(135deg,#ef4444,#dc2626);display:flex;align-items:center;justify-content:center;margin-bottom:var(--sp-3)"><span class="material-symbols-rounded" style="font-size:22px;color:#fff">picture_as_pdf</span></div><div style="font-weight:700">PDF Report</div><div class="text-xs text-muted">Print-ready analytics</div></button>
        <button class="one-click-report-card" id="exp-xl"><div style="width:48px;height:48px;border-radius:var(--radius-lg);background:linear-gradient(135deg,#22c55e,#16a34a);display:flex;align-items:center;justify-content:center;margin-bottom:var(--sp-3)"><span class="material-symbols-rounded" style="font-size:22px;color:#fff">table_view</span></div><div style="font-weight:700">Excel Report</div><div class="text-xs text-muted">8-sheet workbook</div></button>
        <button class="one-click-report-card" id="exp-csv"><div style="width:48px;height:48px;border-radius:var(--radius-lg);background:linear-gradient(135deg,#3b82f6,#2563eb);display:flex;align-items:center;justify-content:center;margin-bottom:var(--sp-3)"><span class="material-symbols-rounded" style="font-size:22px;color:#fff">csv</span></div><div style="font-weight:700">CSV Export</div><div class="text-xs text-muted">Vehicle ROI data</div></button>
      </div>
    </div>
  </div>`;

  app.innerHTML = renderShell('Analytics & Reports', 'Data-driven fleet insights',
    `<button class="btn btn-primary" id="exp-hdr"><span class="material-symbols-rounded">download</span> Quick PDF</button>`, body);
  bindShellEvents();

  /* ═══════════════════════════════════════════════════════════
     CHART 1 — REVENUE & COST TREND (Dual Line + Area)
     ═══════════════════════════════════════════════════════════ */
  makeChart('ch-trend', {
    type: 'line',
    data: {
      labels: mLabels,
      datasets: [
        {
          label: 'Revenue',
          data: mRev,
          borderColor: C.success,
          borderWidth: 3,
          tension: 0.45,
          fill: true,
          backgroundColor: ctx => {
            if (!ctx.chart.chartArea) return 'transparent';
            return makeGradient(ctx.chart.ctx, ctx.chart.chartArea, 'rgba(34,197,94,0.25)', 'rgba(34,197,94,0.01)');
          },
          pointRadius: 6,
          pointHoverRadius: 10,
          pointBackgroundColor: C.success,
          pointBorderColor: '#fff',
          pointBorderWidth: 2.5,
          pointHoverBorderWidth: 3,
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: C.success,
        },
        {
          label: 'Total Costs',
          data: mCost,
          borderColor: C.danger,
          borderWidth: 3,
          tension: 0.45,
          fill: true,
          backgroundColor: ctx => {
            if (!ctx.chart.chartArea) return 'transparent';
            return makeGradient(ctx.chart.ctx, ctx.chart.chartArea, 'rgba(239,68,68,0.18)', 'rgba(239,68,68,0.01)');
          },
          pointRadius: 6,
          pointHoverRadius: 10,
          pointBackgroundColor: C.danger,
          pointBorderColor: '#fff',
          pointBorderWidth: 2.5,
          pointHoverBorderWidth: 3,
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: C.danger,
        },
      ],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      animation: { duration: 1200, easing: 'easeOutQuart' },
      plugins: {
        legend: { labels: { color: C.textSec, font: { family: "'Inter'" }, usePointStyle: true, pointStyle: 'circle', padding: 20 } },
        tooltip: { ...prettyTooltip, callbacks: { label: c => `${c.dataset.label}: ₹${c.parsed.y.toLocaleString('en-IN')}` } },
      },
      scales: {
        x: { ticks: { color: C.textMuted, font: { size: 11 } }, grid: { color: C.grid }, border: { color: C.grid } },
        y: { ticks: { color: C.textMuted, font: { size: 11 }, callback: v => '₹' + (v >= 1e5 ? (v / 1e5).toFixed(0) + 'L' : v >= 1e3 ? (v / 1e3).toFixed(0) + 'K' : v) }, grid: { color: C.grid }, border: { color: C.grid } },
      },
    },
  });

  /* ═══════════════════════════════════════════════════════════
     CHART 2 — COST DOUGHNUT
     ═══════════════════════════════════════════════════════════ */
  makeChart('ch-donut', {
    type: 'doughnut',
    data: {
      labels: ['Fuel', 'Maintenance', 'Other'],
      datasets: [{
        data: [totalFuel, totalMaint, totalExpense],
        backgroundColor: [
          `rgba(239,68,68,0.85)`,
          `rgba(245,158,11,0.85)`,
          `rgba(59,130,246,0.85)`,
        ],
        hoverBackgroundColor: [C.danger, C.warning, C.info],
        borderColor: C.bgCard,
        borderWidth: 4,
        hoverOffset: 18,
        hoverBorderWidth: 0,
        spacing: 3,
        borderRadius: 6,
      }],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      cutout: '68%',
      animation: { animateRotate: true, animateScale: true, duration: 1400, easing: 'easeOutBack' },
      plugins: {
        legend: { position: 'bottom', labels: { color: C.textSec, font: { family: "'Inter'", size: 12 }, usePointStyle: true, pointStyle: 'rectRounded', padding: 18 } },
        tooltip: { ...prettyTooltip, callbacks: { label: c => { const t = totalFuel + totalMaint + totalExpense; return `${c.label}: ₹${c.parsed.toLocaleString('en-IN')} (${t > 0 ? ((c.parsed / t) * 100).toFixed(1) : 0}%)`; } } },
      },
    },
  });

  /* ═══════════════════════════════════════════════════════════
     CHART 3 — MONTHLY TRIPS (Gradient Bar)
     ═══════════════════════════════════════════════════════════ */
  makeChart('ch-trips', {
    type: 'bar',
    data: {
      labels: mLabels,
      datasets: [{
        label: 'Trips',
        data: mTrips,
        backgroundColor: ctx => {
          if (!ctx.chart.chartArea) return C.primary;
          return makeGradient(ctx.chart.ctx, ctx.chart.chartArea, 'rgba(99,102,241,0.85)', 'rgba(168,85,247,0.65)');
        },
        hoverBackgroundColor: ctx => {
          if (!ctx.chart.chartArea) return C.primaryLight;
          return makeGradient(ctx.chart.ctx, ctx.chart.chartArea, C.primaryLight, C.purpleLight);
        },
        borderColor: 'transparent',
        borderRadius: 10,
        borderSkipped: false,
        barPercentage: 0.65,
      }],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      animation: { duration: 1000, easing: 'easeOutQuart', delay: ctx => ctx.dataIndex * 80 },
      plugins: {
        legend: { display: false },
        tooltip: { ...prettyTooltip, callbacks: { label: c => `${c.parsed.y} trips` } },
      },
      scales: {
        x: { ticks: { color: C.textMuted, font: { size: 11 } }, grid: { display: false }, border: { color: C.grid } },
        y: { beginAtZero: true, ticks: { color: C.textMuted, font: { size: 11 }, stepSize: 1 }, grid: { color: C.grid }, border: { color: C.grid } },
      },
    },
  });

  /* ═══════════════════════════════════════════════════════════
     CHART 4 — FUEL EFFICIENCY (Horizontal Bar, color-coded)
     ═══════════════════════════════════════════════════════════ */
  const fuelD = vm.filter(v => v.eff > 0).sort((a, b) => b.eff - a.eff);
  makeChart('ch-fuel', {
    type: 'bar',
    data: {
      labels: fuelD.map(v => v.name),
      datasets: [{
        label: 'km/L',
        data: fuelD.map(v => v.eff),
        backgroundColor: fuelD.map(v => v.eff >= avgEff ? 'rgba(34,197,94,0.75)' : v.eff < avgEff * 0.8 ? 'rgba(239,68,68,0.75)' : 'rgba(245,158,11,0.75)'),
        hoverBackgroundColor: fuelD.map(v => v.eff >= avgEff ? C.success : v.eff < avgEff * 0.8 ? C.danger : C.warning),
        borderColor: fuelD.map(v => v.eff >= avgEff ? C.success : v.eff < avgEff * 0.8 ? C.danger : C.warning),
        borderWidth: 2,
        borderRadius: 8,
        borderSkipped: false,
        barPercentage: 0.7,
      }],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      indexAxis: 'y',
      animation: { duration: 1200, easing: 'easeOutQuart', delay: ctx => ctx.dataIndex * 60 },
      plugins: {
        legend: { display: false },
        tooltip: { ...prettyTooltip, callbacks: { label: c => { const v = fuelD[c.dataIndex]; return [`${c.parsed.x} km/L`, `${v.km.toLocaleString()} km driven`, `${v.liters} L consumed`]; } } },
      },
      scales: {
        x: { beginAtZero: true, title: { display: true, text: 'km / L', color: C.textMuted, font: { size: 11, weight: '600' } }, ticks: { color: C.textMuted }, grid: { color: C.grid }, border: { color: C.grid } },
        y: { ticks: { color: C.textSec, font: { size: 12, weight: '600', family: "'Inter'" } }, grid: { display: false }, border: { color: C.grid } },
      },
    },
  });

  /* ═══════════════════════════════════════════════════════════
     CHART 5 — LAST TRIP FUEL CPK (Bar)
     ═══════════════════════════════════════════════════════════ */
  const cpkD = [...vm].sort((a, b) => b.lastTripFuelCpk - a.lastTripFuelCpk);
  makeChart('ch-last-cpk', {
    type: 'bar',
    data: {
      labels: cpkD.map(v => v.name),
      datasets: [{
        label: 'Fuel Cost ₹/km',
        data: cpkD.map(v => v.lastTripFuelCpk),
        backgroundColor: cpkD.map(v => {
          if (v.lastTripFuelCpk === 0) return 'rgba(100,116,139,0.3)';
          return v.lastTripFuelCpk < 15 ? 'rgba(34,197,94,0.7)' : v.lastTripFuelCpk > 35 ? 'rgba(239,68,68,0.7)' : 'rgba(59,130,246,0.7)';
        }),
        borderColor: 'transparent',
        borderRadius: 8,
        barPercentage: 0.6,
      }],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      animation: { duration: 1000, easing: 'easeOutQuart' },
      plugins: {
        legend: { display: false },
        tooltip: {
          ...prettyTooltip, callbacks: {
            label: c => {
              const val = c.parsed.y;
              return val > 0 ? `Last Trip Fuel: ₹${val}/km` : 'No fuel logs for this trip';
            }
          }
        }
      },
      scales: {
        x: { ticks: { color: C.textSec, font: { size: 10 }, autoSkip: false, maxRotation: 45, minRotation: 45 }, grid: { display: false } },
        y: { beginAtZero: true, ticks: { color: C.textMuted, callback: v => '₹' + v }, grid: { color: C.grid } }
      }
    }
  });

  /* ═══════════════════════════════════════════════════════════
     CHART 6 — VEHICLE ROI (Grouped Horizontal, Rev vs Cost)
     ═══════════════════════════════════════════════════════════ */
  const roiD = [...vm].sort((a, b) => b.roi - a.roi);
  makeChart('ch-roi', {
    type: 'bar',
    data: {
      labels: roiD.map(v => v.name),
      datasets: [
        {
          label: 'Revenue',
          data: roiD.map(v => v.rev),
          backgroundColor: 'rgba(34,197,94,0.7)',
          hoverBackgroundColor: C.success,
          borderColor: C.success,
          borderWidth: 2,
          borderRadius: 8,
          borderSkipped: false,
          barPercentage: 0.7,
        },
        {
          label: 'Ops Cost',
          data: roiD.map(v => v.ops),
          backgroundColor: 'rgba(239,68,68,0.55)',
          hoverBackgroundColor: C.danger,
          borderColor: C.danger,
          borderWidth: 2,
          borderRadius: 8,
          borderSkipped: false,
          barPercentage: 0.7,
        },
      ],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      indexAxis: 'y',
      animation: { duration: 1200, easing: 'easeOutQuart', delay: ctx => ctx.dataIndex * 50 },
      plugins: {
        legend: { labels: { color: C.textSec, font: { family: "'Inter'" }, usePointStyle: true, pointStyle: 'rectRounded', padding: 18 } },
        tooltip: {
          ...prettyTooltip,
          callbacks: {
            label: c => `${c.dataset.label}: ₹${c.parsed.x.toLocaleString('en-IN')}`,
            afterBody: c => { const v = roiD[c[0].dataIndex]; return [`ROI: ${v.roi > 0 ? '+' : ''}${v.roi}%`, `Profit: ${v.rev > v.ops ? '+' : ''}₹${(v.rev - v.ops).toLocaleString('en-IN')}`]; },
          },
        },
      },
      scales: {
        x: { beginAtZero: true, ticks: { color: C.textMuted, font: { size: 11 }, callback: v => '₹' + (v >= 1e5 ? (v / 1e5).toFixed(0) + 'L' : v >= 1e3 ? (v / 1e3).toFixed(0) + 'K' : v) }, grid: { color: C.grid }, border: { color: C.grid } },
        y: { ticks: { color: C.textSec, font: { size: 12, weight: '600', family: "'Inter'" } }, grid: { display: false }, border: { color: C.grid } },
      },
    },
  });

  /* ═══════════════════════════════════════════════════════════
     CHART 6 — MONTHLY PROFIT (Line + Gradient Area)
     ═══════════════════════════════════════════════════════════ */
  makeChart('ch-profit', {
    type: 'line',
    data: {
      labels: mLabels,
      datasets: [{
        label: 'Net Profit',
        data: mProfit,
        borderColor: C.primary,
        borderWidth: 3,
        tension: 0.45,
        fill: true,
        backgroundColor: ctx => {
          if (!ctx.chart.chartArea) return 'transparent';
          return makeGradient(ctx.chart.ctx, ctx.chart.chartArea, 'rgba(99,102,241,0.3)', 'rgba(99,102,241,0.01)');
        },
        pointRadius: 7,
        pointHoverRadius: 11,
        pointBackgroundColor: mProfit.map(v => v >= 0 ? C.success : C.danger),
        pointBorderColor: '#fff',
        pointBorderWidth: 3,
        pointHoverBorderWidth: 4,
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: mProfit.map(v => v >= 0 ? C.success : C.danger),
        segment: {
          borderColor: ctx => {
            const v = ctx.p1.parsed.y;
            return v < 0 ? C.danger : C.primary;
          },
        },
      }],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      animation: { duration: 1400, easing: 'easeOutQuart' },
      plugins: {
        legend: { display: false },
        tooltip: { ...prettyTooltip, callbacks: { label: c => `Profit: ${c.parsed.y >= 0 ? '+' : ''}₹${c.parsed.y.toLocaleString('en-IN')}` } },
      },
      scales: {
        x: { ticks: { color: C.textMuted, font: { size: 11 } }, grid: { color: C.grid }, border: { color: C.grid } },
        y: { ticks: { color: C.textMuted, font: { size: 11 }, callback: v => (v >= 0 ? '+' : '') + '₹' + (Math.abs(v) >= 1e5 ? (v / 1e5).toFixed(0) + 'L' : Math.abs(v) >= 1e3 ? (v / 1e3).toFixed(0) + 'K' : v) }, grid: { color: C.grid }, border: { color: C.grid } },
      },
    },
  });

  /* ═══════════════════════════════════════════════════════════
     CHART 7 — DRIVER RADAR
     ═══════════════════════════════════════════════════════════ */
  const radarColors = [C.primary, C.success, C.warning, C.danger, C.info];
  makeChart('ch-radar', {
    type: 'radar',
    data: {
      labels: ['Safety Score', 'Trips Done', 'Reliability', 'Experience', 'Rating'],
      datasets: topDrivers.map((d, i) => ({
        label: d.name,
        data: [
          d.safetyScore,
          Math.min(d.tripsCompleted * 5, 100),
          100 - (d.tripsCancelled || 0) * 10,
          Math.min(d.tripsCompleted * 3, 100),
          d.safetyScore * 0.9 + (d.tripsCompleted || 0) * 0.5,
        ],
        backgroundColor: radarColors[i] + '20',
        borderColor: radarColors[i],
        borderWidth: 2.5,
        pointRadius: 4,
        pointHoverRadius: 7,
        pointBackgroundColor: radarColors[i],
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
      })),
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      animation: { duration: 1200, easing: 'easeOutQuart' },
      plugins: {
        legend: { position: 'bottom', labels: { color: C.textSec, font: { family: "'Inter'", size: 11 }, usePointStyle: true, pointStyle: 'circle', padding: 14 } },
        tooltip: { ...prettyTooltip },
      },
      scales: {
        r: {
          angleLines: { color: 'rgba(255,255,255,0.08)' },
          grid: { color: 'rgba(255,255,255,0.06)' },
          pointLabels: { color: C.textSec, font: { size: 11, weight: '600', family: "'Inter'" } },
          ticks: { display: false },
          suggestedMin: 0, suggestedMax: 100,
        },
      },
    },
  });

  /* ═══════════════════════════════════════════════════════════
     EVENT BINDINGS
     ═══════════════════════════════════════════════════════════ */
  const report = () => {
    const f = { Category: 'Revenue', Amount: totalRevenue };
    const fin = [f, { Category: 'Fuel', Amount: totalFuel }, { Category: 'Maintenance', Amount: totalMaint }, { Category: 'Other', Amount: totalExpense }, { Category: 'Net Profit', Amount: netProfit }];
    const vr = vm.map(v => ({ Vehicle: v.name, Plate: v.licensePlate, Trips: v.trips, 'Last Fuel ₹/km': v.lastTripFuelCpk || '—', 'km': v.km, 'L': v.liters, 'km/L': v.eff || '—', Revenue: v.rev, Cost: v.ops, 'ROI%': v.roi }));
    const tr = store.trips.map(t => ({ Status: t.status, Vehicle: store.getVehicle(t.vehicleId)?.name || '—', Driver: store.getDriver(t.driverId)?.name || '—', Rev: t.revenue || 0 }));
    const fl = store.fuelLogs.map(f => ({ Vehicle: store.getVehicle(f.vehicleId)?.name || '—', L: f.liters, '₹': f.totalCost }));
    const mt = store.maintenance.map(m => ({ Vehicle: store.getVehicle(m.vehicleId)?.name || '—', Type: m.type, '₹': m.cost, Status: m.status }));
    const ex = store.expenses.map(e => ({ Vehicle: store.getVehicle(e.vehicleId)?.name || '—', Cat: e.category, '₹': e.amount }));
    const dr = store.drivers.map(d => ({ Name: d.name, Trips: d.tripsCompleted, Safety: d.safetyScore }));
    const ds = deadVehicles.map(v => ({ Vehicle: v.name, Idle: v.idle >= 999 ? 'Never' : v.idle + 'd', Rev: v.rev, Cost: v.ops }));
    return { fin, vr, tr, fl, mt, ex, dr, ds };
  };

  document.getElementById('exp-csv')?.addEventListener('click', () => { exportCSV(report().vr, 'fleetflow_roi.csv'); toast('CSV exported', 'success'); });
  document.getElementById('exp-roi')?.addEventListener('click', () => { exportCSV(report().vr, 'fleetflow_roi.csv'); toast('ROI CSV exported', 'success'); });
  document.getElementById('exp-xl')?.addEventListener('click', () => {
    const r = report();
    exportExcel({ 'Summary': r.fin, 'Vehicle ROI': r.vr, 'Dead Stock': r.ds, 'Trips': r.tr, 'Fuel': r.fl, 'Maintenance': r.mt, 'Expenses': r.ex, 'Drivers': r.dr }, 'fleetflow_report.xlsx');
    toast('Excel exported (8 sheets) 📊', 'success');
  });
  const doPDF = () => {
    const r = report();

    /* ─── Capture all chart canvases as base64 images ─── */
    const chartIds = [
      { id: 'ch-trend', title: 'Revenue & Cost Trend — Monthly Performance' },
      { id: 'ch-donut', title: 'Cost Breakdown — Fuel vs Maintenance vs Other' },
      { id: 'ch-trips', title: 'Monthly Trip Volume — Dispatch Activity' },
      { id: 'ch-fuel', title: 'Fuel Efficiency per Vehicle (km/L)' },
      { id: 'ch-last-cpk', title: 'Last Trip Fuel Performance (₹/km)' },
      { id: 'ch-roi', title: 'Vehicle ROI — Revenue vs Operational Cost' },
      { id: 'ch-profit', title: 'Monthly Profit Trend — Net Earnings' },
      { id: 'ch-radar', title: 'Top Drivers — Performance Radar Analysis' },
    ];
    const chartImages = [];
    for (const c of chartIds) {
      const canvas = document.getElementById(c.id);
      if (canvas) {
        try { chartImages.push({ title: c.title, image: canvas.toDataURL('image/png', 1.0) }); }
        catch (e) { console.warn('Could not capture chart:', c.id, e); }
      }
    }

    /* ─── Executive Summary KPIs ─── */
    const profitMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) + '%' : '0%';
    const pdfKpis = [
      { label: 'Total Revenue', value: formatCurrency(totalRevenue), color: '#22c55e' },
      { label: 'Total Costs', value: formatCurrency(totalFuel + totalMaint + totalExpense), color: '#ef4444' },
      { label: 'Net Profit', value: formatCurrency(netProfit), color: netProfit >= 0 ? '#22c55e' : '#ef4444' },
      { label: 'Profit Margin', value: profitMargin, color: '#6366f1' },
      { label: 'Completed Trips', value: String(completedTrips.length), color: '#3b82f6' },
      { label: 'Fleet Size', value: String(vehicles.length), color: '#8b5cf6' },
    ];

    exportPDF({
      title: 'FleetFlow Analytics Report',
      generated: new Date().toLocaleString('en-IN', { dateStyle: 'long', timeStyle: 'short' }),
      kpis: pdfKpis,
      charts: chartImages,
      sections: [
        { heading: '💰 Financial Summary', rows: r.fin },
        { heading: '🚛 Vehicle ROI & Performance', rows: r.vr },
        { heading: '⚠️ Dead Stock Alerts', rows: r.ds },
        { heading: '🗺️ Trip Records', rows: r.tr },
        { heading: '⛽ Fuel Log Entries', rows: r.fl },
        { heading: '🔧 Maintenance Records', rows: r.mt },
        { heading: '💸 Expense Records', rows: r.ex },
        { heading: '👤 Driver Performance', rows: r.dr },
      ]
    });
    toast('Official PDF report with charts opened — Save as PDF', 'success');
  };
  document.getElementById('exp-pdf')?.addEventListener('click', doPDF);
  document.getElementById('exp-hdr')?.addEventListener('click', doPDF);
}
