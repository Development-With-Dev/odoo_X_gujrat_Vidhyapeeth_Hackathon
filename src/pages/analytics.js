import { store } from '../store/data.js';
import { renderShell, bindShellEvents } from '../components/shell.js';
import { formatCurrency, formatCompact, vehicleIcon, exportCSV, exportExcel, exportPDF, toast } from '../utils/helpers.js';

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
  <div class="card mb-6" style="border-left:4px solid var(--c-accent-light);background:var(--bg-elevated)">
    <div class="card-body" style="display:flex;gap:var(--sp-5);align-items:flex-start;flex-wrap:wrap">
      <div style="flex:1;min-width:220px">
        <div style="display:flex;align-items:center;gap:var(--sp-2);margin-bottom:var(--sp-2)">
          <span class="material-symbols-rounded" style="color:var(--c-accent-light);font-size:20px">bar_chart</span>
          <span style="font-weight:700;font-size:var(--fs-base)">Analytics & Reports — Data-Driven Decisions</span>
        </div>
        <p style="font-size:var(--fs-sm);color:var(--text-secondary);line-height:1.7;margin:0">
          Operational and financial intelligence across your fleet. Track fuel efficiency, vehicle ROI, and cost per km. Export full reports as <strong>Excel (7 sheets)</strong> or <strong>PDF</strong> for monthly payroll and health audits.
        </p>
      </div>
      <div style="display:flex;gap:var(--sp-4);flex-wrap:wrap">
        ${[
      { icon: 'local_gas_station', color: 'var(--c-warning)', label: 'Fuel Efficiency', desc: 'km / L per vehicle' },
      { icon: 'trending_up', color: 'var(--c-success)', label: 'Vehicle ROI', desc: '(Revenue − Ops Cost) ÷ Acquisition Cost' },
      { icon: 'route', color: 'var(--c-info)', label: 'Cost per km', desc: 'Total ops cost ÷ distance driven' },
      { icon: 'table_view', color: 'var(--c-accent-light)', label: 'Excel / PDF Export', desc: 'One-click full report generation' },
    ].map(item => `
          <div style="display:flex;gap:var(--sp-2);align-items:flex-start;min-width:165px">
            <span class="material-symbols-rounded" style="font-size:18px;color:${item.color};margin-top:2px">${item.icon}</span>
            <div>
              <div style="font-weight:600;font-size:var(--fs-sm)">${item.label}</div>
              <div style="font-size:var(--fs-xs);color:var(--text-muted)">${item.desc}</div>
            </div>
          </div>`).join('')}
      </div>
    </div>
  </div>

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
    `<button class="btn btn-primary" id="export-full"><span class="material-symbols-rounded">table_view</span> Full Report Excel</button>
     <button class="btn btn-ghost" id="export-pdf" style="margin-left:8px"><span class="material-symbols-rounded">picture_as_pdf</span> Export PDF</button>`, body);
  bindShellEvents();

  document.getElementById('export-analytics')?.addEventListener('click', () => {
    exportCSV(vehicleMetrics.map(v => ({ Vehicle: v.name, Plate: v.licensePlate, Trips: v.tripCount, Distance_km: v.totalKm, Fuel_L: v.totalLiters, FuelEff: v.fuelEff, CostPerKm: v.costPerKm, Revenue: v.revenue, OpsCost: v.opsCost, ROI_pct: v.roi })), 'fleetflow_vehicle_roi.csv');
    toast('Report exported', 'success');
  });

  const buildFullReport = () => {
    const financialSummary = [
      { Category: 'Revenue', Amount: totalRevenue },
      { Category: 'Fuel Cost', Amount: totalFuel },
      { Category: 'Maintenance Cost', Amount: totalMaint },
      { Category: 'Other Expenses', Amount: totalExpense },
      { Category: 'Net Profit', Amount: netProfit },
      { Category: 'Profit Margin %', Amount: totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) + '%' : '0%' },
    ];
    const vehicleROI = vehicleMetrics.map(v => ({
      Vehicle: v.name, Plate: v.licensePlate, Type: v.type, Status: v.status,
      Trips: v.tripCount, 'Distance (km)': v.totalKm, 'Fuel (L)': v.totalLiters,
      'Fuel Eff (km/L)': v.fuelEff, 'Cost/km (₹)': v.costPerKm,
      'Revenue (₹)': v.revenue, 'Ops Cost (₹)': v.opsCost, 'ROI %': v.roi
    }));
    const tripsData = store.trips.map(t => {
      const veh = store.getVehicle(t.vehicleId);
      const drv = store.getDriver(t.driverId);
      return {
        Status: t.status, Vehicle: veh?.name || '—', Driver: drv?.name || '—',
        Origin: t.origin || '', Destination: t.destination || '',
        'Start Odo': t.startOdometer || '', 'End Odo': t.endOdometer || '',
        'Cargo (kg)': t.cargoWeight || '', 'Revenue (₹)': t.revenue || 0,
        Date: t.createdAt ? new Date(t.createdAt).toLocaleDateString('en-IN') : ''
      };
    });
    const fuelData = store.fuelLogs.map(f => {
      const veh = store.getVehicle(f.vehicleId);
      return {
        Vehicle: veh?.name || '—', Date: f.date || '', 'Liters': f.liters,
        'Cost/L (₹)': f.costPerLiter, 'Total (₹)': f.totalCost, Station: f.station || ''
      };
    });
    const maintData = store.maintenance.map(m => {
      const veh = store.getVehicle(m.vehicleId);
      return {
        Vehicle: veh?.name || '—', Type: m.type || '', Description: m.description || '',
        'Cost (₹)': m.cost, Status: m.status || '', Date: m.date || ''
      };
    });
    const expenseData = store.expenses.map(e => {
      const veh = store.getVehicle(e.vehicleId);
      return {
        Vehicle: veh?.name || '—', Category: e.category || '', Description: e.description || '',
        'Amount (₹)': e.amount, Date: e.date || ''
      };
    });
    const driverData = store.drivers.map(d => ({
      Name: d.name, Phone: d.phone || '', License: d.licenseNumber || '',
      Category: d.licenseCategory || '', Expiry: d.licenseExpiry || '',
      Status: d.status, 'Trips Done': d.tripsCompleted, 'Trips Cancelled': d.tripsCancelled,
      'Safety Score': d.safetyScore
    }));
    return { financialSummary, vehicleROI, tripsData, fuelData, maintData, expenseData, driverData };
  };

  document.getElementById('export-full')?.addEventListener('click', () => {
    const r = buildFullReport();
    exportExcel({
      'Financial Summary': r.financialSummary,
      'Vehicle ROI': r.vehicleROI,
      'All Trips': r.tripsData,
      'Fuel Logs': r.fuelData,
      'Maintenance': r.maintData,
      'Expenses': r.expenseData,
      'Drivers': r.driverData,
    }, 'fleetflow_full_report.xlsx');
    toast('Full Excel report exported (7 sheets)', 'success');
  });

  document.getElementById('export-pdf')?.addEventListener('click', () => {
    const r = buildFullReport();
    exportPDF({
      title: 'FleetFlow — Full Analytics Report',
      generated: new Date().toLocaleString('en-IN'),
      sections: [
        { heading: '💰 Financial Summary', rows: r.financialSummary },
        { heading: '🚛 Vehicle Performance & ROI', rows: r.vehicleROI },
        { heading: '🗺️ All Trips', rows: r.tripsData },
        { heading: '⛽ Fuel Logs', rows: r.fuelData },
        { heading: '🔧 Maintenance Records', rows: r.maintData },
        { heading: '💸 Expenses', rows: r.expenseData },
        { heading: '👤 Drivers', rows: r.driverData },
      ]
    });
    toast('PDF report opened — use Save as PDF in print dialog', 'success');
  });
}
