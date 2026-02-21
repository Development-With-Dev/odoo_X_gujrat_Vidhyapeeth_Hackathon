import { store } from '../store/data.js';
import { renderShell, bindShellEvents } from '../components/shell.js';
import { formatCurrency, formatCompact, vehicleIcon, exportCSV, exportPDF, toast } from '../utils/helpers.js';

export function renderAnalytics() {
  const app = document.getElementById('app');
  const vehicles = store.vehicles.filter(v => v.status !== 'Retired');
  const completedTrips = store.trips.filter(t => t.status === 'Completed');
  const totalRevenue = completedTrips.reduce((s, t) => s + (t.revenue || 0), 0);
  const totalFuel = store.fuelLogs.reduce((s, f) => s + f.totalCost, 0);
  const totalMaint = store.maintenance.reduce((s, m) => s + m.cost, 0);
  const totalExpense = store.expenses.reduce((s, e) => s + e.amount, 0);
  const netProfit = totalRevenue - totalFuel - totalMaint - totalExpense;

  const vehicleMetrics = vehicles.map(v => {
    const fuelLogs = store.getFuelLogsForVehicle(v.id);
    const totalLiters = fuelLogs.reduce((s, f) => s + f.liters, 0);
    const vTrips = store.trips.filter(t => t.vehicleId === v.id && t.status === 'Completed');
    const totalKm = vTrips.reduce((s, t) => (t.endOdometer && t.startOdometer) ? s + (t.endOdometer - t.startOdometer) : s, 0);
    const fuelEff = totalLiters > 0 ? (totalKm / totalLiters).toFixed(1) : '—';
    const revenue = store.getTotalRevenue(v.id);
    const opsCost = store.getTotalOperationalCost(v.id);
    const roi = store.getVehicleROI(v.id);
    const costPerKm = totalKm > 0 ? (opsCost / totalKm).toFixed(1) : '—';
    return { ...v, totalLiters, totalKm, fuelEff, revenue, opsCost, roi, costPerKm, tripCount: vTrips.length };
  });

  const body = `
  <div class="kpi-grid">
    <div class="kpi-card"><div class="kpi-icon green"><span class="material-symbols-rounded">trending_up</span></div>
      <div class="kpi-value" style="color:var(--c-success)" title="${formatCurrency(totalRevenue)}">${formatCompact(totalRevenue)}</div><div class="kpi-label">Total Revenue</div></div>
    <div class="kpi-card"><div class="kpi-icon red"><span class="material-symbols-rounded">money_off</span></div>
      <div class="kpi-value" style="color:var(--c-danger)" title="${formatCurrency(totalFuel + totalMaint + totalExpense)}">${formatCompact(totalFuel + totalMaint + totalExpense)}</div><div class="kpi-label">Total Costs</div></div>
    <div class="kpi-card"><div class="kpi-icon ${netProfit >= 0 ? 'green' : 'red'}"><span class="material-symbols-rounded">${netProfit >= 0 ? 'savings' : 'warning'}</span></div>
      <div class="kpi-value" style="color:${netProfit >= 0 ? 'var(--c-success)' : 'var(--c-danger)'}" title="${formatCurrency(netProfit)}">${formatCompact(netProfit)}</div><div class="kpi-label">Net Profit</div></div>
    <div class="kpi-card"><div class="kpi-icon blue"><span class="material-symbols-rounded">bar_chart</span></div>
      <div class="kpi-value">${completedTrips.length}</div><div class="kpi-label">Completed Trips</div></div>
  </div>

  <div class="grid-2 mb-6">
    <div class="card">
      <div class="card-header"><span class="card-title">Cost Distribution</span></div>
      <div class="card-body">
        <div style="display:flex;flex-direction:column;gap:var(--sp-4)">
          ${[
      { label: 'Fuel', value: totalFuel, color: 'var(--c-danger)', total: totalFuel + totalMaint + totalExpense },
      { label: 'Maintenance', value: totalMaint, color: 'var(--c-warning)', total: totalFuel + totalMaint + totalExpense },
      { label: 'Other Expenses', value: totalExpense, color: 'var(--c-info)', total: totalFuel + totalMaint + totalExpense },
    ].map(item => {
      const pct = item.total > 0 ? ((item.value / item.total) * 100).toFixed(0) : 0;
      return `<div>
              <div class="flex justify-between mb-1" style="margin-bottom:4px">
                <span class="text-sm" style="font-weight:600">${item.label}</span>
                <span class="text-sm">${formatCurrency(item.value)} <span class="text-muted">(${pct}%)</span></span>
              </div>
              <div style="height:8px;background:var(--bg-elevated);border-radius:99px;overflow:hidden">
                <div style="width:${pct}%;height:100%;background:${item.color};border-radius:99px;transition:width 1s var(--ease-out)"></div>
              </div>
            </div>`;
    }).join('')}
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-header"><span class="card-title">Revenue vs Costs</span></div>
      <div class="card-body">
        <div style="display:flex;flex-direction:column;gap:var(--sp-4)">
          <div>
            <div class="flex justify-between" style="margin-bottom:4px">
              <span class="text-sm font-bold" style="color:var(--c-success)">Revenue</span>
              <span class="text-sm">${formatCurrency(totalRevenue)}</span>
            </div>
            <div style="height:12px;background:var(--bg-elevated);border-radius:99px;overflow:hidden">
              <div style="width:${totalRevenue > 0 ? 100 : 0}%;height:100%;background:var(--c-success);border-radius:99px"></div>
            </div>
          </div>
          <div>
            <div class="flex justify-between" style="margin-bottom:4px">
              <span class="text-sm font-bold" style="color:var(--c-danger)">Total Costs</span>
              <span class="text-sm">${formatCurrency(totalFuel + totalMaint + totalExpense)}</span>
            </div>
            <div style="height:12px;background:var(--bg-elevated);border-radius:99px;overflow:hidden">
              <div style="width:${totalRevenue > 0 ? (((totalFuel + totalMaint + totalExpense) / totalRevenue) * 100).toFixed(0) : 0}%;height:100%;background:var(--c-danger);border-radius:99px"></div>
            </div>
          </div>
          <div style="text-align:center;padding:var(--sp-4);background:var(--bg-elevated);border-radius:var(--radius-md)">
            <div class="text-sm text-muted">Profit Margin</div>
            <div style="font-size:var(--fs-2xl);font-weight:800;color:${netProfit >= 0 ? 'var(--c-success)' : 'var(--c-danger)'}">
              ${totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : 0}%
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div class="card">
    <div class="card-header">
      <span class="card-title">Vehicle Performance & ROI</span>
      <button class="btn btn-ghost btn-sm" id="export-analytics"><span class="material-symbols-rounded" style="font-size:16px">download</span> Export CSV</button>
    </div>
    <div class="data-table-wrap">
      <table class="data-table">
        <thead><tr><th>Vehicle</th><th>Trips</th><th>Distance</th><th>Fuel (L)</th><th>Fuel Eff.</th><th>Cost/km</th><th>Revenue</th><th>Ops Cost</th><th>ROI</th></tr></thead>
        <tbody>
        ${vehicleMetrics.map(v => `<tr>
          <td><div class="flex items-center gap-2"><div class="vehicle-thumb ${v.type.toLowerCase()}"><span class="material-symbols-rounded" style="font-size:16px">${vehicleIcon(v.type)}</span></div><div><div style="font-weight:600;font-size:var(--fs-sm)">${v.name}</div><div class="text-xs text-muted">${v.licensePlate}</div></div></div></td>
          <td>${v.tripCount}</td>
          <td>${v.totalKm.toLocaleString()} km</td>
          <td>${v.totalLiters} L</td>
          <td style="font-weight:600;color:${v.fuelEff !== '—' && v.fuelEff > 5 ? 'var(--c-success)' : 'var(--c-warning)'}">${v.fuelEff} ${v.fuelEff !== '—' ? 'km/L' : ''}</td>
          <td>${v.costPerKm !== '—' ? '₹' + v.costPerKm : '—'}</td>
          <td style="color:var(--c-success);font-weight:600">${formatCurrency(v.revenue)}</td>
          <td style="color:var(--c-warning)">${formatCurrency(v.opsCost)}</td>
          <td><span style="font-weight:700;padding:3px 10px;border-radius:99px;font-size:var(--fs-xs);background:${v.roi > 0 ? 'var(--c-success-bg)' : 'var(--c-danger-bg)'};color:${v.roi > 0 ? 'var(--c-success)' : 'var(--c-danger)'}">${v.roi}%</span></td>
        </tr>`).join('')}
        </tbody>
      </table>
    </div>
  </div>

  <div class="card mt-6">
    <div class="card-header"><span class="card-title">🏆 Driver Leaderboard</span></div>
    <div class="card-body" style="display:flex;flex-direction:column;gap:var(--sp-3)">
      ${store.drivers.sort((a, b) => b.safetyScore - a.safetyScore).slice(0, 5).map((d, i) => `
        <div class="flex items-center gap-3" style="padding:var(--sp-2) 0;border-bottom:1px solid var(--border-subtle)">
          <span style="font-size:var(--fs-lg);width:30px;text-align:center;font-weight:800;color:${i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? '#cd7f32' : 'var(--text-muted)'}">#${i + 1}</span>
          <div class="driver-avatar">${d.name[0]}</div>
          <div style="flex:1"><div style="font-weight:600">${d.name}</div><div class="text-xs text-muted">${d.tripsCompleted} trips completed</div></div>
          <span style="font-weight:700;font-size:var(--fs-lg);color:${d.safetyScore >= 80 ? 'var(--c-success)' : d.safetyScore >= 60 ? 'var(--c-warning)' : 'var(--c-danger)'}">${d.safetyScore}</span>
        </div>
      `).join('')}
    </div>
  </div>`;

  app.innerHTML = renderShell('Analytics & Reports', 'Data-driven fleet insights',
    `<button class="btn btn-secondary" id="export-pdf"><span class="material-symbols-rounded">picture_as_pdf</span> Export PDF</button>
     <button class="btn btn-primary" id="export-full"><span class="material-symbols-rounded">description</span> Full Report CSV</button>`, body);
  bindShellEvents();

  // --- Export Vehicle ROI CSV ---
  document.getElementById('export-analytics')?.addEventListener('click', () => {
    exportCSV(vehicleMetrics.map(v => ({ Vehicle: v.name, Plate: v.licensePlate, Trips: v.tripCount, Distance_km: v.totalKm, Fuel_L: v.totalLiters, FuelEff: v.fuelEff, CostPerKm: v.costPerKm, Revenue: v.revenue, OpsCost: v.opsCost, ROI_pct: v.roi })), 'fleetflow_vehicle_roi.csv');
    toast('Report exported', 'success');
  });

  // --- Export PDF Analytics Report ---
  document.getElementById('export-pdf')?.addEventListener('click', () => {
    const totalCosts = totalFuel + totalMaint + totalExpense;
    const costTotal = totalCosts || 1;

    exportPDF('Fleet Analytics Report', [
      {
        type: 'kpi',
        items: [
          { label: 'Total Revenue', value: formatCurrency(totalRevenue), color: '#16a34a' },
          { label: 'Total Costs', value: formatCurrency(totalCosts), color: '#dc2626' },
          { label: 'Net Profit', value: formatCurrency(netProfit), color: netProfit >= 0 ? '#16a34a' : '#dc2626' },
          { label: 'Completed Trips', value: completedTrips.length, color: '#6366f1' },
        ]
      },
      {
        type: 'bar',
        title: 'Cost Distribution',
        items: [
          { label: 'Fuel', pct: ((totalFuel / costTotal) * 100).toFixed(0), color: '#dc2626', display: formatCurrency(totalFuel) },
          { label: 'Maintenance', pct: ((totalMaint / costTotal) * 100).toFixed(0), color: '#f59e0b', display: formatCurrency(totalMaint) },
          { label: 'Other Expenses', pct: ((totalExpense / costTotal) * 100).toFixed(0), color: '#3b82f6', display: formatCurrency(totalExpense) },
        ]
      },
      {
        type: 'table',
        title: 'Vehicle Performance & ROI',
        data: vehicleMetrics.map(v => ({
          Vehicle: v.name,
          Plate: v.licensePlate,
          Type: v.type,
          Trips: v.tripCount,
          'Distance (km)': v.totalKm.toLocaleString(),
          'Fuel (L)': v.totalLiters,
          'Fuel Eff.': v.fuelEff !== '—' ? v.fuelEff + ' km/L' : '—',
          'Cost/km': v.costPerKm !== '—' ? '₹' + v.costPerKm : '—',
          Revenue: formatCurrency(v.revenue),
          'Ops Cost': formatCurrency(v.opsCost),
          'ROI': v.roi + '%',
        }))
      },
      {
        type: 'table',
        title: 'Driver Leaderboard (Top 5)',
        data: store.drivers.sort((a, b) => b.safetyScore - a.safetyScore).slice(0, 5).map((d, i) => ({
          Rank: '#' + (i + 1),
          Name: d.name,
          Status: d.status,
          'Trips Completed': d.tripsCompleted,
          'Safety Score': d.safetyScore,
        }))
      },
    ]);
    toast('PDF report opened — use Print / Save as PDF', 'success');
  });

  // --- Export Full Report CSV (ALL data) ---
  document.getElementById('export-full')?.addEventListener('click', () => {
    // Build comprehensive CSV rows from all data sources
    const rows = [];

    // Section: Financial Summary
    rows.push({ Section: 'FINANCIAL SUMMARY', Item: 'Total Revenue', Value: totalRevenue, Unit: '₹', Details: '' });
    rows.push({ Section: 'FINANCIAL SUMMARY', Item: 'Fuel Cost', Value: totalFuel, Unit: '₹', Details: '' });
    rows.push({ Section: 'FINANCIAL SUMMARY', Item: 'Maintenance Cost', Value: totalMaint, Unit: '₹', Details: '' });
    rows.push({ Section: 'FINANCIAL SUMMARY', Item: 'Other Expenses', Value: totalExpense, Unit: '₹', Details: '' });
    rows.push({ Section: 'FINANCIAL SUMMARY', Item: 'Net Profit', Value: netProfit, Unit: '₹', Details: `Margin: ${totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : 0}%` });
    rows.push({ Section: '', Item: '', Value: '', Unit: '', Details: '' });

    // Section: Vehicle Metrics
    vehicleMetrics.forEach(v => {
      rows.push({
        Section: 'VEHICLE PERFORMANCE',
        Item: v.name,
        Value: '',
        Unit: '',
        Details: `Plate:${v.licensePlate} | Type:${v.type} | Trips:${v.tripCount} | Dist:${v.totalKm}km | Fuel:${v.totalLiters}L | Eff:${v.fuelEff} | Rev:₹${v.revenue} | Ops:₹${v.opsCost} | ROI:${v.roi}%`
      });
    });
    rows.push({ Section: '', Item: '', Value: '', Unit: '', Details: '' });

    // Section: All Trips
    store.trips.forEach(t => {
      const vehicle = store.getVehicle(t.vehicleId);
      const driver = store.getDriver(t.driverId);
      rows.push({
        Section: 'ALL TRIPS',
        Item: (t.id || '').slice(-8),
        Value: t.revenue || 0,
        Unit: '₹',
        Details: `${t.origin}→${t.destination} | Vehicle:${vehicle?.name || 'N/A'} | Driver:${driver?.name || 'N/A'} | Status:${t.status} | Cargo:${t.cargoWeight || 0}kg | ${t.cargoDescription || ''}`
      });
    });
    rows.push({ Section: '', Item: '', Value: '', Unit: '', Details: '' });

    // Section: Drivers
    store.drivers.forEach(d => {
      rows.push({
        Section: 'DRIVERS',
        Item: d.name,
        Value: d.safetyScore,
        Unit: 'Score',
        Details: `Status:${d.status} | Completed:${d.tripsCompleted} | Cancelled:${d.tripsCancelled || 0} | License:${d.licenseCategory || 'N/A'} | Expiry:${d.licenseExpiry || 'N/A'}`
      });
    });
    rows.push({ Section: '', Item: '', Value: '', Unit: '', Details: '' });

    // Section: Fuel Logs
    store.fuelLogs.forEach(f => {
      const vehicle = store.getVehicle(f.vehicleId);
      rows.push({
        Section: 'FUEL LOGS',
        Item: vehicle?.name || f.vehicleId,
        Value: f.totalCost,
        Unit: '₹',
        Details: `Liters:${f.liters} | Cost/L:₹${f.costPerLiter} | Date:${f.date || ''} | Station:${f.station || ''}`
      });
    });
    rows.push({ Section: '', Item: '', Value: '', Unit: '', Details: '' });

    // Section: Maintenance
    store.maintenance.forEach(m => {
      const vehicle = store.getVehicle(m.vehicleId);
      rows.push({
        Section: 'MAINTENANCE',
        Item: vehicle?.name || m.vehicleId,
        Value: m.cost,
        Unit: '₹',
        Details: `Type:${m.type} | Status:${m.status} | Date:${m.date || ''} | Notes:${m.description || ''}`
      });
    });
    rows.push({ Section: '', Item: '', Value: '', Unit: '', Details: '' });

    // Section: Other Expenses
    store.expenses.forEach(e => {
      const vehicle = store.getVehicle(e.vehicleId);
      rows.push({
        Section: 'EXPENSES',
        Item: vehicle?.name || e.vehicleId || 'General',
        Value: e.amount,
        Unit: '₹',
        Details: `Category:${e.category || ''} | Date:${e.date || ''} | Notes:${e.description || ''}`
      });
    });

    exportCSV(rows, `fleetflow_full_report_${new Date().toISOString().slice(0, 10)}.csv`);
    toast('Full report CSV downloaded', 'success');
  });
}
