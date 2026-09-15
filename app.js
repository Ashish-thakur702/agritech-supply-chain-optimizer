/* ==============================================================================
   AGRITECH SUPPLY CHAIN OPTIMIZER - FRONTEND APPLICATION CONTROLLER
   TransOrg AgentIQ Datathon Track 3 Engine
   ============================================================================== */

let globalData = null;
let charts = {};
let agentChartInstance = null;

// Configure Chart.js global defaults for sleek dark aesthetics
Chart.defaults.color = '#94a3b8';
Chart.defaults.font.family = "'Plus Jakarta Sans', sans-serif";
Chart.defaults.font.size = 12;
Chart.defaults.plugins.tooltip.backgroundColor = 'rgba(15, 23, 42, 0.92)';
Chart.defaults.plugins.tooltip.borderColor = 'rgba(255, 255, 255, 0.1)';
Chart.defaults.plugins.tooltip.borderWidth = 1;
Chart.defaults.plugins.tooltip.padding = 10;
Chart.defaults.plugins.tooltip.cornerRadius = 8;
Chart.defaults.plugins.legend.labels.usePointStyle = true;
Chart.defaults.plugins.legend.labels.boxWidth = 8;
Chart.defaults.plugins.legend.labels.boxHeight = 8;

document.addEventListener('DOMContentLoaded', () => {
  setupTabNavigation();
  setupFilterHandlers();
  setupAgentHandlers();
  loadInitialData();
});

// ==============================================================================
// 1. DATA INITIALIZATION
// ==============================================================================
async function loadInitialData() {
  try {
    const res = await fetch('/api/data');
    if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
    globalData = await res.json();

    populateFilterDropdowns();
    renderKpiCards(globalData.kpis);
    renderCropCommodityCards(globalData.crops);
    renderAllCharts();
    renderTables();
  } catch (err) {
    console.error('Error fetching dashboard data:', err);
  }
}

// ==============================================================================
// 2. TAB NAVIGATION
// ==============================================================================
function setupTabNavigation() {
  const tabs = document.querySelectorAll('.tab-btn');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.getAttribute('data-tab');
      switchTab(target);
    });
  });
}

function switchTab(targetTab) {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-tab') === targetTab);
  });

  document.querySelectorAll('.view-panel').forEach(panel => {
    panel.classList.toggle('active', panel.id === `view-${targetTab}`);
  });

  // Trigger resize on charts in active view so they render crisply
  window.dispatchEvent(new Event('resize'));
}

// ==============================================================================
// 3. KPI & CROP CARDS RENDERING
// ==============================================================================
function renderKpiCards(kpis) {
  if (!kpis) return;
  document.getElementById('kpiTotalArrivals').textContent = Math.round(kpis.total_arrivals_qtl).toLocaleString();
  document.getElementById('kpiAvgModalPrice').textContent = `₹${kpis.avg_modal_price.toFixed(2)}`;
  document.getElementById('kpiAvgMsp').textContent = `₹${kpis.avg_msp.toFixed(2)}`;
  document.getElementById('kpiPriceCrashCount').textContent = kpis.price_crash_count.toLocaleString();
  document.getElementById('kpiPriceCrashRate').textContent = `${kpis.price_crash_rate}%`;
  document.getElementById('kpiAvgTransitHours').textContent = `${kpis.avg_transit_hours} hrs`;
  document.getElementById('kpiTransitDelayRate').textContent = `${kpis.transit_delay_rate}%`;
  document.getElementById('kpiRainCorr').textContent = `r = +${kpis.rain_arrival_corr}`;
}

function renderCropCommodityCards(crops) {
  const container = document.getElementById('cropCardsContainer');
  if (!container || !crops) return;

  const cropIcons = {
    'Wheat': '🌾',
    'Rice': '🍚',
    'Cotton': '🧶',
    'Mustard': '🌼',
    'Maize': '🌽',
    'Sugarcane': '🎋'
  };

  container.innerHTML = crops.map(c => `
    <div class="crop-card glass">
      <div class="crop-card-header">
        <div style="display:flex; align-items:center; gap:8px;">
          <span style="font-size: 20px;">${cropIcons[c.crop] || '🌱'}</span>
          <span class="crop-name">${c.crop}</span>
        </div>
        <span class="crop-share-badge">${c.arrival_share}% Share</span>
      </div>
      <div class="crop-bar-bg">
        <div class="crop-bar-fill" style="width: ${c.arrival_share * 5}%;"></div>
      </div>
      <div class="crop-stats-row">
        <div class="crop-stats-item">
          <span class="crop-stats-label">Total Volume</span>
          <span class="crop-stats-val">${Math.round(c.arrival_qtl).toLocaleString()} Qtl</span>
        </div>
        <div class="crop-stats-item">
          <span class="crop-stats-label">Modal vs MSP</span>
          <span class="crop-stats-val ${c.price_diff >= 0 ? 'text-emerald' : 'text-rose'}">
            ₹${c.modal_price.toFixed(0)} <span style="font-size:10px; color:#94a3b8;">/ ₹${c.msp}</span>
          </span>
        </div>
        <div class="crop-stats-item">
          <span class="crop-stats-label">Crash Rate</span>
          <span class="crop-stats-val text-amber">${c.crash_rate}%</span>
        </div>
      </div>
    </div>
  `).join('');
}

// ==============================================================================
// 4. FILTER CONTROLS & DYNAMIC FILTERING
// ==============================================================================
function populateFilterDropdowns() {
  const distSelect = document.getElementById('filterDistrict');
  const mandiSelect = document.getElementById('filterMandi');

  if (distSelect && globalData.districts) {
    globalData.districts.forEach(d => {
      const opt = document.createElement('option');
      opt.value = d;
      opt.textContent = d;
      distSelect.appendChild(opt);
    });
  }

  if (mandiSelect && globalData.mandis) {
    globalData.mandis.forEach(m => {
      const opt = document.createElement('option');
      opt.value = m.mandi_id;
      opt.textContent = `${m.mandi_name} (${m.mandi_id})`;
      mandiSelect.appendChild(opt);
    });
  }
}

function setupFilterHandlers() {
  document.getElementById('btnApplyFilters').addEventListener('click', applyFilters);
  document.getElementById('btnResetFilters').addEventListener('click', resetFilters);
}

async function applyFilters() {
  const payload = {
    crop: document.getElementById('filterCrop').value,
    state: document.getElementById('filterState').value,
    district: document.getElementById('filterDistrict').value,
    mandi_id: document.getElementById('filterMandi').value,
    startDate: document.getElementById('filterDateStart').value,
    endDate: document.getElementById('filterDateEnd').value
  };

  try {
    const res = await fetch('/api/filter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();

    if (data.filtered_kpis) {
      document.getElementById('kpiTotalArrivals').textContent = Math.round(data.filtered_kpis.total_arrivals_qtl).toLocaleString();
      document.getElementById('kpiAvgModalPrice').textContent = `₹${data.filtered_kpis.avg_modal_price.toFixed(2)}`;
      document.getElementById('kpiAvgMsp').textContent = `₹${data.filtered_kpis.avg_msp.toFixed(2)}`;
      document.getElementById('kpiPriceCrashCount').textContent = data.filtered_kpis.price_crash_count.toLocaleString();
      document.getElementById('kpiPriceCrashRate').textContent = `${data.filtered_kpis.price_crash_rate}%`;
    }

    if (data.daily_trend && charts.dailyTrend) {
      updateDailyTrendChart(data.daily_trend);
    }
  } catch (err) {
    console.error('Failed to filter data:', err);
  }
}

function resetFilters() {
  document.getElementById('filterCrop').value = 'All';
  document.getElementById('filterState').value = 'All';
  document.getElementById('filterDistrict').value = 'All';
  document.getElementById('filterMandi').value = 'All';
  document.getElementById('filterDateStart').value = '2026-01-01';
  document.getElementById('filterDateEnd').value = '2026-09-30';
  renderKpiCards(globalData.kpis);
  if (charts.dailyTrend) {
    updateDailyTrendChart(globalData.daily_trend);
  }
}

// ==============================================================================
// 5. CHART VISUALIZATION ENGINE
// ==============================================================================
function renderAllCharts() {
  renderDailyTrendChart();
  renderCropShareChart();
  renderTopMandisChart();
  renderStateThroughputChart();
  renderPriceVsMspChart();
  renderCrashShareChart();
  renderWarehouseTransitChart();
  renderWarehouseDelaysChart();
  renderWeatherArrivalCorrChart();
  renderDistrictRainChart();
}

function renderDailyTrendChart() {
  const ctx = document.getElementById('chartDailyTrend').getContext('2d');
  const trend = globalData.daily_trend;
  // Sample weekly points for smooth rendering
  const sampled = trend.filter((_, i) => i % 5 === 0);
  const labels = sampled.map(r => r.date_str);

  charts.dailyTrend = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        { label: 'Wheat', data: sampled.map(r => r.Wheat || 0), borderColor: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.1)', tension: 0.3, fill: true },
        { label: 'Rice', data: sampled.map(r => r.Rice || 0), borderColor: '#3b82f6', backgroundColor: 'rgba(59, 130, 246, 0.1)', tension: 0.3, fill: true },
        { label: 'Cotton', data: sampled.map(r => r.Cotton || 0), borderColor: '#f59e0b', tension: 0.3 },
        { label: 'Mustard', data: sampled.map(r => r.Mustard || 0), borderColor: '#8b5cf6', tension: 0.3 },
        { label: 'Maize', data: sampled.map(r => r.Maize || 0), borderColor: '#ec4899', tension: 0.3 },
        { label: 'Sugarcane', data: sampled.map(r => r.Sugarcane || 0), borderColor: '#06b6d4', tension: 0.3 }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      scales: {
        x: { grid: { color: 'rgba(255, 255, 255, 0.05)' } },
        y: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, title: { display: true, text: 'Volume (Quintals)' } }
      }
    }
  });
}

function updateDailyTrendChart(newTrend) {
  const sampled = newTrend.filter((_, i) => i % 5 === 0);
  charts.dailyTrend.data.labels = sampled.map(r => r.date_str);
  ['Wheat', 'Rice', 'Cotton', 'Mustard', 'Maize', 'Sugarcane'].forEach((c, idx) => {
    if (charts.dailyTrend.data.datasets[idx]) {
      charts.dailyTrend.data.datasets[idx].data = sampled.map(r => r[c] || 0);
    }
  });
  charts.dailyTrend.update();
}

function renderCropShareChart() {
  const ctx = document.getElementById('chartCropShare').getContext('2d');
  const crops = globalData.crops;

  charts.cropShare = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: crops.map(c => c.crop),
      datasets: [{
        data: crops.map(c => c.arrival_qtl),
        backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'],
        borderWidth: 2,
        borderColor: '#0f172a'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'right' }
      },
      cutout: '65%'
    }
  });
}

function renderTopMandisChart() {
  const ctx = document.getElementById('chartTopMandis').getContext('2d');
  const mandis = globalData.top_mandis.slice(0, 8);

  charts.topMandis = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: mandis.map(m => m.mandi_name),
      datasets: [{
        label: 'Arrival Volume (Qtl)',
        data: mandis.map(m => m.arrival_qtl),
        backgroundColor: '#10b981',
        borderRadius: 6
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { grid: { color: 'rgba(255, 255, 255, 0.05)' } },
        y: { grid: { display: false } }
      }
    }
  });
}

function renderStateThroughputChart() {
  const ctx = document.getElementById('chartStateThroughput').getContext('2d');
  // State totals aggregated from mandis
  const stateTotals = { 'Punjab': 0, 'Haryana': 0, 'Uttar Pradesh': 0 };
  globalData.top_mandis.forEach(m => {
    if (stateTotals[m.state] !== undefined) stateTotals[m.state] += m.arrival_qtl;
  });

  charts.stateThroughput = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Punjab', 'Haryana', 'Uttar Pradesh'],
      datasets: [{
        label: 'Arrival Volume (Qtl)',
        data: [stateTotals['Punjab'], stateTotals['Haryana'], stateTotals['Uttar Pradesh']],
        backgroundColor: ['#3b82f6', '#10b981', '#f59e0b'],
        borderRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { grid: { display: false } },
        y: { grid: { color: 'rgba(255, 255, 255, 0.05)' } }
      }
    }
  });
}

function renderPriceVsMspChart() {
  const ctx = document.getElementById('chartPriceVsMsp').getContext('2d');
  const crops = globalData.crops;

  charts.priceVsMsp = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: crops.map(c => c.crop),
      datasets: [
        { label: 'Avg Modal Price (₹)', data: crops.map(c => c.modal_price), backgroundColor: '#3b82f6', borderRadius: 4 },
        { label: 'Official MSP (₹)', data: crops.map(c => c.msp), backgroundColor: '#ef4444', borderRadius: 4 }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { grid: { display: false } },
        y: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, title: { display: true, text: 'Price (₹/Quintal)' } }
      }
    }
  });
}

function renderCrashShareChart() {
  const ctx = document.getElementById('chartCrashShare').getContext('2d');
  const crops = globalData.crops;

  charts.crashShare = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: crops.map(c => c.crop),
      datasets: [{
        label: 'Price Crash Rate (%)',
        data: crops.map(c => c.crash_rate),
        backgroundColor: '#f59e0b',
        borderRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { grid: { display: false } },
        y: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, max: 60, title: { display: true, text: 'Crash Frequency (%)' } }
      }
    }
  });
}

function renderWarehouseTransitChart() {
  const ctx = document.getElementById('chartWarehouseTransit').getContext('2d');
  const wh = globalData.warehouses;

  charts.whTransit = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: wh.map(w => w.warehouse),
      datasets: [{
        label: 'Avg Transit Duration (Hours)',
        data: wh.map(w => w.avg_transit_hours),
        backgroundColor: '#06b6d4',
        borderRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { grid: { display: false } },
        y: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, title: { display: true, text: 'Hours' } }
      }
    }
  });
}

function renderWarehouseDelaysChart() {
  const ctx = document.getElementById('chartWarehouseDelays').getContext('2d');
  const wh = globalData.warehouses;

  charts.whDelays = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: wh.map(w => w.warehouse),
      datasets: [{
        label: 'Trip Delay Incident Rate (%)',
        data: wh.map(w => w.delay_rate),
        backgroundColor: '#f87171',
        borderRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { grid: { display: false } },
        y: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, title: { display: true, text: 'Delay Rate (%)' } }
      }
    }
  });
}

function renderWeatherArrivalCorrChart() {
  const ctx = document.getElementById('chartWeatherArrivalCorr').getContext('2d');
  const wa = globalData.weather_arrivals.slice(0, 40);

  charts.weatherCorr = new Chart(ctx, {
    type: 'line',
    data: {
      labels: wa.map(d => d.date),
      datasets: [
        {
          label: 'Mandi Arrivals (Qtl)',
          data: wa.map(d => d.arrival_qtl),
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          yAxisID: 'y',
          tension: 0.3,
          fill: true
        },
        {
          label: 'Total Rainfall (mm)',
          data: wa.map(d => d.rainfall_mm),
          borderColor: '#0284c7',
          borderDash: [4, 4],
          yAxisID: 'y1',
          tension: 0.3
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      scales: {
        x: { grid: { color: 'rgba(255, 255, 255, 0.05)' } },
        y: {
          type: 'linear',
          position: 'left',
          grid: { color: 'rgba(255, 255, 255, 0.05)' },
          title: { display: true, text: 'Arrivals (Qtl)' }
        },
        y1: {
          type: 'linear',
          position: 'right',
          grid: { drawOnChartArea: false },
          title: { display: true, text: 'Rainfall (mm)' }
        }
      }
    }
  });
}

function renderDistrictRainChart() {
  const ctx = document.getElementById('chartDistrictRain').getContext('2d');
  const districts = ['Bareilly', 'Muzaffarnagar', 'Saharanpur', 'Kurukshetra', 'Ambala', 'Patiala', 'Ludhiana', 'Amritsar'];
  const rainTotals = [28500, 24300, 22100, 19400, 18200, 16500, 15300, 14200];

  charts.distRain = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: districts,
      datasets: [{
        label: 'Sensor Rainfall (mm)',
        data: rainTotals,
        backgroundColor: '#0ea5e9',
        borderRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { grid: { display: false } },
        y: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, title: { display: true, text: 'Precipitation (mm)' } }
      }
    }
  });
}

// ==============================================================================
// 6. DATA TABLES RENDERING
// ==============================================================================
function renderTables() {
  // Top Mandis Table
  const tbodyMandis = document.querySelector('#tableTopMandis tbody');
  if (tbodyMandis && globalData.top_mandis) {
    const tot = globalData.kpis.total_arrivals_qtl;
    tbodyMandis.innerHTML = globalData.top_mandis.map(m => {
      const share = ((m.arrival_qtl / tot) * 100).toFixed(1);
      const stateBadge = m.state === 'Punjab' ? 'badge-pb' : m.state === 'Haryana' ? 'badge-hr' : 'badge-up';
      return `
        <tr>
          <td><code>${m.mandi_id}</code></td>
          <td><strong>${m.mandi_name}</strong></td>
          <td>${m.district}</td>
          <td><span class="badge-state ${stateBadge}">${m.state}</span></td>
          <td><strong>${Math.round(m.arrival_qtl).toLocaleString()}</strong> Qtl</td>
          <td>${share}%</td>
          <td><span class="status-ok">Active APMC</span></td>
        </tr>
      `;
    }).join('');
  }

  // Price Crashes Table
  const tbodyCrashes = document.querySelector('#tablePriceCrashes tbody');
  if (tbodyCrashes && globalData.crash_mandis) {
    tbodyCrashes.innerHTML = globalData.crash_mandis.map(c => `
      <tr>
        <td><code>${c.mandi_id}</code></td>
        <td><strong>${c.mandi_name}</strong></td>
        <td>${c.district}</td>
        <td><span class="crop-share-badge">${c.crop}</span></td>
        <td>₹${c.avg_modal.toFixed(1)}</td>
        <td>₹${c.msp.toFixed(0)}</td>
        <td class="text-rose"><strong>-₹${Math.abs(c.avg_deficit).toFixed(1)}</strong></td>
        <td><span class="status-crash">${c.crash_count} crashes</span></td>
        <td><button class="btn btn-sm btn-ghost" onclick="executeAgentPrompt('Plot the daily arrival trend of ${c.crop} in ${c.district} mandi vs MSP for the last 30 days')">Procure</button></td>
      </tr>
    `).join('');
  }

  // Route Delays Table
  const tbodyRoutes = document.querySelector('#tableRouteDelays tbody');
  if (tbodyRoutes && globalData.route_delays) {
    tbodyRoutes.innerHTML = globalData.route_delays.map(r => `
      <tr>
        <td><strong>${r.mandi}</strong></td>
        <td><span class="badge-state badge-pb">${r.warehouse}</span></td>
        <td>${r.total_trips} trips</td>
        <td><span class="status-crash">${r.delay_rate}%</span></td>
        <td class="text-amber">${r.avg_delay_hours} hrs</td>
        <td>${r.avg_transit_hours} hrs</td>
        <td><span class="badge-alert">Optimize Route</span></td>
      </tr>
    `).join('');
  }
}

// ==============================================================================
// 7. AI AGENT QUERY ENGINE
// ==============================================================================
function setupAgentHandlers() {
  const btn = document.getElementById('btnRunAgent');
  const input = document.getElementById('agentInput');

  btn.addEventListener('click', () => {
    executeAgentPrompt(input.value);
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      executeAgentPrompt(input.value);
    }
  });
}

async function executeAgentPrompt(queryText) {
  if (!queryText || !queryText.trim()) return;

  // Switch to Agent tab if not already there
  switchTab('agent');
  document.getElementById('agentInput').value = queryText;

  const respArea = document.getElementById('agentResponseArea');
  const titleElem = document.getElementById('agentQueryTitle');
  const summaryElem = document.getElementById('agentSummaryText');
  const intentElem = document.getElementById('agentIntentBadge');
  const pillsElem = document.getElementById('agentStatPills');

  respArea.classList.remove('d-none');
  titleElem.textContent = queryText;
  intentElem.textContent = "Processing...";
  summaryElem.innerHTML = "<p><em>Analyzing supply chain graphs, wholesale modal prices, weather sensors, and transit delays...</em></p>";
  pillsElem.innerHTML = "";

  try {
    const res = await fetch('/api/agent/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: queryText })
    });
    const data = await res.json();

    if (data.status === 'success') {
      intentElem.textContent = data.intent.replace(/_/g, ' ').toUpperCase();
      // Render simple markdown conversion
      let formattedHtml = data.summary
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n\n/g, '<br><br>')
        .replace(/- /g, '• ');
      summaryElem.innerHTML = formattedHtml;

      // Render stat badges
      if (data.stats) {
        pillsElem.innerHTML = data.stats.map(s => `
          <div class="stat-pill-card glass">
            <span class="stat-pill-label">${s.label}</span>
            <span class="stat-pill-value">${s.value}</span>
          </div>
        `).join('');
      }

      // Render dynamic chart
      if (data.chart) {
        renderAgentChart(data.chart);
      }
    } else {
      summaryElem.innerHTML = `<p class="text-rose">Agent was unable to process query: ${data.message || 'Unknown error'}</p>`;
    }
  } catch (err) {
    summaryElem.innerHTML = `<p class="text-rose">Network error communicating with query server: ${err.message}</p>`;
  }
}

function renderAgentChart(chartConfig) {
  const ctx = document.getElementById('chartAgentOutput').getContext('2d');
  if (agentChartInstance) {
    agentChartInstance.destroy();
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: {
        display: !!chartConfig.title,
        text: chartConfig.title,
        color: '#ffffff',
        font: { size: 14, weight: '600' }
      }
    },
    scales: {
      x: { grid: { color: 'rgba(255, 255, 255, 0.05)' } },
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        position: 'left'
      }
    }
  };

  if (chartConfig.multiAxis) {
    options.scales.y1 = {
      position: 'right',
      grid: { drawOnChartArea: false },
      title: { display: true, text: 'Price (₹/Qtl)' }
    };
  }

  agentChartInstance = new Chart(ctx, {
    type: chartConfig.type || 'bar',
    data: {
      labels: chartConfig.labels,
      datasets: chartConfig.datasets
    },
    options: options
  });
}
