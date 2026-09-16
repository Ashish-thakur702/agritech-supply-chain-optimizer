/* ==============================================================================
   AGRITECH SUPPLY CHAIN OPTIMIZER - FRONTEND APPLICATION CONTROLLER
   TransOrg AgentIQ Datathon Track 3 Engine · Fully Reactive Multi-Page Filter
   ============================================================================== */

let globalData = null;
let currentData = null;
let recommendationsData = null;
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
  setupTableSearchHandlers();
  setupAgentHandlers();
  loadInitialData();
  loadRecommendationsData();
});

// ==============================================================================
// 1. DATA INITIALIZATION
// ==============================================================================
async function loadInitialData() {
  try {
    const res = await fetch('/api/data');
    if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
    globalData = await res.json();
    currentData = globalData;

    populateFilterDropdowns();
    renderKpiCards(globalData.kpis);
    renderCropCommodityCards(globalData.crops);
    renderAllCharts();
    renderTables();
    updateFilterStatusBadge(globalData.kpis.total_arrivals_qtl, 25750);
  } catch (err) {
    console.error('Error fetching dashboard data:', err);
  }
}

async function loadRecommendationsData() {
  try {
    const res = await fetch('/api/recommendations');
    if (!res.ok) return;
    recommendationsData = await res.json();
    renderRecommendationsView(recommendationsData);
  } catch (err) {
    console.error('Error loading recommendations:', err);
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
  setTimeout(() => {
    window.dispatchEvent(new Event('resize'));
    Object.values(charts).forEach(ch => {
      if (ch && typeof ch.resize === 'function') ch.resize();
    });
    if (agentChartInstance) agentChartInstance.resize();
  }, 50);
}

// ==============================================================================
// 3. KPI & CROP CARDS RENDERING
// ==============================================================================
function renderKpiCards(kpis) {
  if (!kpis) return;
  const totArrElem = document.getElementById('kpiTotalArrivals');
  const avgModalElem = document.getElementById('kpiAvgModalPrice');
  const avgMspElem = document.getElementById('kpiAvgMsp');
  const crashCountElem = document.getElementById('kpiPriceCrashCount');
  const crashRateElem = document.getElementById('kpiPriceCrashRate');
  const transitHoursElem = document.getElementById('kpiAvgTransitHours');
  const delayRateElem = document.getElementById('kpiTransitDelayRate');
  const rainCorrElem = document.getElementById('kpiRainCorr');

  if (totArrElem) totArrElem.textContent = Math.round(kpis.total_arrivals_qtl || 0).toLocaleString();
  if (avgModalElem) avgModalElem.textContent = `₹${(kpis.avg_modal_price || 0).toFixed(2)}`;
  if (avgMspElem) avgMspElem.textContent = `₹${(kpis.avg_msp || 0).toFixed(2)}`;
  if (crashCountElem) crashCountElem.textContent = (kpis.price_crash_count || 0).toLocaleString();
  if (crashRateElem) crashRateElem.textContent = `${(kpis.price_crash_rate || 0).toFixed(1)}%`;
  if (transitHoursElem) transitHoursElem.textContent = `${(kpis.avg_transit_hours || 0).toFixed(1)} hrs`;
  if (delayRateElem) delayRateElem.textContent = `${(kpis.transit_delay_rate || 0).toFixed(1)}%`;
  if (rainCorrElem) {
    const sign = (kpis.rain_arrival_corr || 0) >= 0 ? '+' : '';
    rainCorrElem.textContent = `r = ${sign}${(kpis.rain_arrival_corr || 0).toFixed(3)}`;
  }
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
        <div class="crop-bar-fill" style="width: ${Math.min(c.arrival_share * 5, 100)}%;"></div>
      </div>
      <div class="crop-stats-row">
        <div class="crop-stats-item">
          <span class="crop-stats-label">Total Volume</span>
          <span class="crop-stats-val">${Math.round(c.arrival_qtl).toLocaleString()} Qtl</span>
        </div>
        <div class="crop-stats-item">
          <span class="crop-stats-label">Modal vs MSP</span>
          <span class="crop-stats-val ${c.price_diff >= 0 ? 'text-emerald' : 'text-rose'}">
            ₹${(c.modal_price || 0).toFixed(0)} <span style="font-size:10px; color:#94a3b8;">/ ₹${c.msp || 0}</span>
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
// 4. FILTER CONTROLS & DYNAMIC CASCADING
// ==============================================================================
function populateFilterDropdowns() {
  const distSelect = document.getElementById('filterDistrict');
  const mandiSelect = document.getElementById('filterMandi');

  if (distSelect && globalData.districts) {
    distSelect.innerHTML = '<option value="All">All Districts (18)</option>';
    globalData.districts.forEach(d => {
      const opt = document.createElement('option');
      opt.value = d;
      opt.textContent = d;
      distSelect.appendChild(opt);
    });
  }

  if (mandiSelect && globalData.mandis) {
    mandiSelect.innerHTML = '<option value="All">All Mandis (57)</option>';
    globalData.mandis.forEach(m => {
      const opt = document.createElement('option');
      opt.value = m.mandi_id;
      opt.textContent = `${m.mandi_name} (${m.mandi_id})`;
      mandiSelect.appendChild(opt);
    });
  }
}

function updateCascadedDropdowns(availableDistricts, availableMandis) {
  const distSelect = document.getElementById('filterDistrict');
  const mandiSelect = document.getElementById('filterMandi');
  const currentDist = distSelect.value;
  const currentMandi = mandiSelect.value;

  if (availableDistricts) {
    distSelect.innerHTML = `<option value="All">All Districts (${availableDistricts.length})</option>`;
    availableDistricts.forEach(d => {
      const opt = document.createElement('option');
      opt.value = d;
      opt.textContent = d;
      distSelect.appendChild(opt);
    });
    if (availableDistricts.includes(currentDist)) {
      distSelect.value = currentDist;
    }
  }

  if (availableMandis) {
    mandiSelect.innerHTML = `<option value="All">All Mandis (${availableMandis.length})</option>`;
    availableMandis.forEach(m => {
      const opt = document.createElement('option');
      opt.value = m.mandi_id;
      opt.textContent = `${m.mandi_name} (${m.mandi_id})`;
      mandiSelect.appendChild(opt);
    });
    if (availableMandis.some(m => m.mandi_id === currentMandi)) {
      mandiSelect.value = currentMandi;
    }
  }
}

function setupFilterHandlers() {
  const cropSelect = document.getElementById('filterCrop');
  const stateSelect = document.getElementById('filterState');
  const distSelect = document.getElementById('filterDistrict');
  const mandiSelect = document.getElementById('filterMandi');
  const startDateInput = document.getElementById('filterDateStart');
  const endDateInput = document.getElementById('filterDateEnd');

  // Reactive state change -> update district & mandi options immediately
  stateSelect.addEventListener('change', () => {
    onStateFilterChange();
    applyFilters();
  });

  // Reactive district change -> update mandi options immediately
  distSelect.addEventListener('change', () => {
    onDistrictFilterChange();
    applyFilters();
  });

  cropSelect.addEventListener('change', applyFilters);
  mandiSelect.addEventListener('change', applyFilters);
  startDateInput.addEventListener('change', applyFilters);
  endDateInput.addEventListener('change', applyFilters);

  document.getElementById('btnApplyFilters').addEventListener('click', applyFilters);
  document.getElementById('btnResetFilters').addEventListener('click', resetFilters);
}

function onStateFilterChange() {
  const selectedState = document.getElementById('filterState').value;
  if (!globalData || !globalData.mandis) return;

  let filteredMandis = globalData.mandis;
  if (selectedState !== 'All') {
    filteredMandis = filteredMandis.filter(m => m.state === selectedState);
  }

  const uniqueDistricts = [...new Set(filteredMandis.map(m => m.district))].sort();
  const distSelect = document.getElementById('filterDistrict');
  distSelect.innerHTML = `<option value="All">All Districts (${uniqueDistricts.length})</option>`;
  uniqueDistricts.forEach(d => {
    const opt = document.createElement('option');
    opt.value = d;
    opt.textContent = d;
    distSelect.appendChild(opt);
  });

  const mandiSelect = document.getElementById('filterMandi');
  mandiSelect.innerHTML = `<option value="All">All Mandis (${filteredMandis.length})</option>`;
  filteredMandis.forEach(m => {
    const opt = document.createElement('option');
    opt.value = m.mandi_id;
    opt.textContent = `${m.mandi_name} (${m.mandi_id})`;
    mandiSelect.appendChild(opt);
  });
}

function onDistrictFilterChange() {
  const selectedState = document.getElementById('filterState').value;
  const selectedDistrict = document.getElementById('filterDistrict').value;
  if (!globalData || !globalData.mandis) return;

  let filteredMandis = globalData.mandis;
  if (selectedState !== 'All') {
    filteredMandis = filteredMandis.filter(m => m.state === selectedState);
  }
  if (selectedDistrict !== 'All') {
    filteredMandis = filteredMandis.filter(m => m.district === selectedDistrict);
  }

  const mandiSelect = document.getElementById('filterMandi');
  mandiSelect.innerHTML = `<option value="All">All Mandis (${filteredMandis.length})</option>`;
  filteredMandis.forEach(m => {
    const opt = document.createElement('option');
    opt.value = m.mandi_id;
    opt.textContent = `${m.mandi_name} (${m.mandi_id})`;
    mandiSelect.appendChild(opt);
  });
}

function updateFilterStatusBadge(totalQtl, matchCount) {
  const badgeText = document.getElementById('filterStatusText');
  if (!badgeText) return;
  const crop = document.getElementById('filterCrop').value;
  const state = document.getElementById('filterState').value;
  const dist = document.getElementById('filterDistrict').value;

  let activeFilters = [];
  if (crop !== 'All') activeFilters.push(crop);
  if (state !== 'All') activeFilters.push(state);
  if (dist !== 'All') activeFilters.push(dist);

  const filterSummary = activeFilters.length > 0 ? ` · ${activeFilters.join(' · ')}` : '';
  badgeText.textContent = `${matchCount.toLocaleString()} matches (${Math.round(totalQtl || 0).toLocaleString()} Qtl)${filterSummary}`;
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

  const statusElem = document.getElementById('filterStatusText');
  if (statusElem) statusElem.textContent = 'Filtering supply chain data...';

  try {
    const res = await fetch('/api/filter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    currentData = data;

    // 1. Update KPI Cards
    if (data.filtered_kpis) {
      renderKpiCards(data.filtered_kpis);
      updateFilterStatusBadge(data.filtered_kpis.total_arrivals_qtl, data.match_count || 0);
    }

    // 2. Update Crop Commodity Cards
    if (data.crops) {
      renderCropCommodityCards(data.crops);
    }

    // 3. Update Tab 1 Charts
    if (data.daily_trend && charts.dailyTrend) {
      updateDailyTrendChart(data.daily_trend);
    }
    if (data.crops && charts.cropShare) {
      updateCropShareChart(data.crops);
    }

    // 4. Update Tab 2 Charts & Table (Mandi Arrivals)
    if (data.top_mandis && charts.topMandis) {
      updateTopMandisChart(data.top_mandis);
    }
    if (data.state_throughput && charts.stateThroughput) {
      updateStateThroughputChart(data.state_throughput);
    }
    renderTopMandisTable(data.top_mandis, (data.filtered_kpis && data.filtered_kpis.total_arrivals_qtl) || 1);

    // 5. Update Tab 3 Charts & Table (MSP & Prices)
    if (data.crops && charts.priceVsMsp) {
      updatePriceVsMspChart(data.crops);
    }
    if (data.crops && charts.crashShare) {
      updateCrashShareChart(data.crops);
    }
    renderPriceCrashesTable(data.crash_mandis);

    // 6. Update Tab 4 Charts & Table (Logistics)
    if (data.warehouses && charts.whTransit) {
      updateWarehouseTransitChart(data.warehouses);
    }
    if (data.warehouses && charts.whDelays) {
      updateWarehouseDelaysChart(data.warehouses);
    }
    renderRouteDelaysTable(data.route_delays);

    // 7. Update Tab 5 Charts (Weather)
    if (data.weather_arrivals && charts.weatherCorr) {
      updateWeatherArrivalCorrChart(data.weather_arrivals);
    }
    if (data.district_rain && charts.distRain) {
      updateDistrictRainChart(data.district_rain);
    }

    // 8. Filter recommendations table if on ML Recommendations tab
    filterRecommendationsTable();

  } catch (err) {
    console.error('Failed to filter data:', err);
    if (statusElem) statusElem.textContent = 'Filter calculation error';
  }
}

function resetFilters() {
  document.getElementById('filterCrop').value = 'All';
  document.getElementById('filterState').value = 'All';
  document.getElementById('filterDateStart').value = '2026-01-01';
  document.getElementById('filterDateEnd').value = '2026-09-30';

  populateFilterDropdowns();
  currentData = globalData;

  renderKpiCards(globalData.kpis);
  renderCropCommodityCards(globalData.crops);

  if (charts.dailyTrend) updateDailyTrendChart(globalData.daily_trend);
  if (charts.cropShare) updateCropShareChart(globalData.crops);
  if (charts.topMandis) updateTopMandisChart(globalData.top_mandis);
  if (charts.stateThroughput) {
    const st = { 'Punjab': 0, 'Haryana': 0, 'Uttar Pradesh': 0 };
    globalData.top_mandis.forEach(m => { if (st[m.state] !== undefined) st[m.state] += m.arrival_qtl; });
    updateStateThroughputChart(st);
  }
  if (charts.priceVsMsp) updatePriceVsMspChart(globalData.crops);
  if (charts.crashShare) updateCrashShareChart(globalData.crops);
  if (charts.whTransit) updateWarehouseTransitChart(globalData.warehouses);
  if (charts.whDelays) updateWarehouseDelaysChart(globalData.warehouses);
  if (charts.weatherCorr) updateWeatherArrivalCorrChart(globalData.weather_arrivals);
  if (charts.distRain) renderDistrictRainChart();

  renderTables();
  updateFilterStatusBadge(globalData.kpis.total_arrivals_qtl, 25750);

  // Clear table search inputs
  const searchInputs = ['searchMandisInput', 'searchCrashesInput', 'searchRoutesInput', 'searchRecsInput'];
  searchInputs.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });

  if (recommendationsData) {
    renderRecommendationsTable(recommendationsData.recommendations);
  }
}

// ==============================================================================
// 5. CHART VISUALIZATION & REACTIVE UPDATE ENGINE
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
  const canvas = document.getElementById('chartDailyTrend');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const trend = globalData.daily_trend || [];
  const sampled = trend.filter((_, i) => i % 4 === 0);
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
  if (!charts.dailyTrend) return;
  const sampled = (newTrend || []).filter((_, i) => i % 4 === 0);
  charts.dailyTrend.data.labels = sampled.map(r => r.date_str);
  ['Wheat', 'Rice', 'Cotton', 'Mustard', 'Maize', 'Sugarcane'].forEach((c, idx) => {
    if (charts.dailyTrend.data.datasets[idx]) {
      charts.dailyTrend.data.datasets[idx].data = sampled.map(r => r[c] || 0);
    }
  });
  charts.dailyTrend.update();
}

function renderCropShareChart() {
  const canvas = document.getElementById('chartCropShare');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const crops = globalData.crops || [];

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
      plugins: { legend: { position: 'right' } },
      cutout: '65%'
    }
  });
}

function updateCropShareChart(crops) {
  if (!charts.cropShare) return;
  charts.cropShare.data.labels = crops.map(c => c.crop);
  charts.cropShare.data.datasets[0].data = crops.map(c => c.arrival_qtl);
  charts.cropShare.update();
}

function renderTopMandisChart() {
  const canvas = document.getElementById('chartTopMandis');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const mandis = (globalData.top_mandis || []).slice(0, 8);

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

function updateTopMandisChart(mandis) {
  if (!charts.topMandis) return;
  const topSlice = (mandis || []).slice(0, 8);
  charts.topMandis.data.labels = topSlice.map(m => m.mandi_name);
  charts.topMandis.data.datasets[0].data = topSlice.map(m => m.arrival_qtl);
  charts.topMandis.update();
}

function renderStateThroughputChart() {
  const canvas = document.getElementById('chartStateThroughput');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const stateTotals = { 'Punjab': 0, 'Haryana': 0, 'Uttar Pradesh': 0 };
  (globalData.top_mandis || []).forEach(m => {
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

function updateStateThroughputChart(stateThroughput) {
  if (!charts.stateThroughput) return;
  const totals = [
    stateThroughput['Punjab'] || 0,
    stateThroughput['Haryana'] || 0,
    stateThroughput['Uttar Pradesh'] || 0
  ];
  charts.stateThroughput.data.datasets[0].data = totals;
  charts.stateThroughput.update();
}

function renderPriceVsMspChart() {
  const canvas = document.getElementById('chartPriceVsMsp');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const crops = globalData.crops || [];

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

function updatePriceVsMspChart(crops) {
  if (!charts.priceVsMsp) return;
  charts.priceVsMsp.data.labels = crops.map(c => c.crop);
  charts.priceVsMsp.data.datasets[0].data = crops.map(c => c.modal_price);
  charts.priceVsMsp.data.datasets[1].data = crops.map(c => c.msp);
  charts.priceVsMsp.update();
}

function renderCrashShareChart() {
  const canvas = document.getElementById('chartCrashShare');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const crops = globalData.crops || [];

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

function updateCrashShareChart(crops) {
  if (!charts.crashShare) return;
  charts.crashShare.data.labels = crops.map(c => c.crop);
  charts.crashShare.data.datasets[0].data = crops.map(c => c.crash_rate);
  charts.crashShare.update();
}

function renderWarehouseTransitChart() {
  const canvas = document.getElementById('chartWarehouseTransit');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const wh = globalData.warehouses || [];

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

function updateWarehouseTransitChart(warehouses) {
  if (!charts.whTransit) return;
  charts.whTransit.data.labels = warehouses.map(w => w.warehouse);
  charts.whTransit.data.datasets[0].data = warehouses.map(w => w.avg_transit_hours);
  charts.whTransit.update();
}

function renderWarehouseDelaysChart() {
  const canvas = document.getElementById('chartWarehouseDelays');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const wh = globalData.warehouses || [];

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

function updateWarehouseDelaysChart(warehouses) {
  if (!charts.whDelays) return;
  charts.whDelays.data.labels = warehouses.map(w => w.warehouse);
  charts.whDelays.data.datasets[0].data = warehouses.map(w => w.delay_rate);
  charts.whDelays.update();
}

function renderWeatherArrivalCorrChart() {
  const canvas = document.getElementById('chartWeatherArrivalCorr');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const wa = (globalData.weather_arrivals || []).slice(0, 40);

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

function updateWeatherArrivalCorrChart(wa) {
  if (!charts.weatherCorr) return;
  const slice = (wa || []).slice(0, 40);
  charts.weatherCorr.data.labels = slice.map(d => d.date);
  charts.weatherCorr.data.datasets[0].data = slice.map(d => d.arrival_qtl);
  charts.weatherCorr.data.datasets[1].data = slice.map(d => d.rainfall_mm);
  charts.weatherCorr.update();
}

function renderDistrictRainChart() {
  const canvas = document.getElementById('chartDistrictRain');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
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

function updateDistrictRainChart(distRain) {
  if (!charts.distRain || !distRain || distRain.length === 0) return;
  const labels = distRain.map(d => d.district);
  const data = distRain.map(d => d.rainfall_mm);
  charts.distRain.data.labels = labels;
  charts.distRain.data.datasets[0].data = data;
  charts.distRain.update();
}

// ==============================================================================
// 6. DATA TABLES RENDERING & LIVE SEARCH
// ==============================================================================
function renderTables() {
  renderTopMandisTable(globalData.top_mandis, globalData.kpis.total_arrivals_qtl);
  renderPriceCrashesTable(globalData.crash_mandis);
  renderRouteDelaysTable(globalData.route_delays);
}

function renderTopMandisTable(mandis, totalArrivals) {
  const tbody = document.querySelector('#tableTopMandis tbody');
  if (!tbody) return;
  const tot = totalArrivals || 1;

  if (!mandis || mandis.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center" style="padding:24px; color:#94a3b8;">No mandi arrival records match the current filter selection.</td></tr>`;
    return;
  }

  tbody.innerHTML = mandis.map(m => {
    const share = ((m.arrival_qtl / tot) * 100).toFixed(1);
    const stateBadge = m.state === 'Punjab' ? 'badge-pb' : m.state === 'Haryana' ? 'badge-hr' : 'badge-up';
    return `
      <tr class="mandi-row">
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

function renderPriceCrashesTable(crashMandis) {
  const tbody = document.querySelector('#tablePriceCrashes tbody');
  if (!tbody) return;

  if (!crashMandis || crashMandis.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9" class="text-center" style="padding:24px; color:#10b981;">No price crash incidents reported under current filter criteria! Market prices are healthy above MSP.</td></tr>`;
    return;
  }

  tbody.innerHTML = crashMandis.map(c => `
    <tr class="crash-row">
      <td><code>${c.mandi_id}</code></td>
      <td><strong>${c.mandi_name}</strong></td>
      <td>${c.district}</td>
      <td><span class="crop-share-badge">${c.crop}</span></td>
      <td>₹${(c.avg_modal || 0).toFixed(1)}</td>
      <td>₹${(c.msp || 0).toFixed(0)}</td>
      <td class="text-rose"><strong>-₹${Math.abs(c.avg_deficit || 0).toFixed(1)}</strong></td>
      <td><span class="status-crash">${c.crash_count} crashes</span></td>
      <td><button class="btn btn-sm btn-ghost" onclick="executeAgentPrompt('Plot the daily arrival trend of ${c.crop} in ${c.district} mandi vs MSP for the last 30 days')">Procure</button></td>
    </tr>
  `).join('');
}

function renderRouteDelaysTable(routeDelays) {
  const tbody = document.querySelector('#tableRouteDelays tbody');
  if (!tbody) return;

  if (!routeDelays || routeDelays.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center" style="padding:24px; color:#94a3b8;">No route transit delay data matching current criteria.</td></tr>`;
    return;
  }

  tbody.innerHTML = routeDelays.map(r => `
    <tr class="route-row">
      <td><strong>${r.mandi}</strong></td>
      <td><span class="badge-state badge-pb">${r.warehouse}</span></td>
      <td>${r.total_trips} trips</td>
      <td><span class="status-crash">${r.delay_rate}%</span></td>
      <td class="text-amber">${(r.avg_delay_hours || 0).toFixed(1)} hrs</td>
      <td>${(r.avg_transit_hours || 0).toFixed(1)} hrs</td>
      <td><span class="badge-alert">Optimize Route</span></td>
    </tr>
  `).join('');
}

function setupTableSearchHandlers() {
  // Mandi Table Live Search
  const searchMandis = document.getElementById('searchMandisInput');
  if (searchMandis) {
    searchMandis.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase().trim();
      document.querySelectorAll('#tableTopMandis tbody tr.mandi-row').forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(q) ? '' : 'none';
      });
    });
  }

  // Price Crash Table Live Search
  const searchCrashes = document.getElementById('searchCrashesInput');
  if (searchCrashes) {
    searchCrashes.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase().trim();
      document.querySelectorAll('#tablePriceCrashes tbody tr.crash-row').forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(q) ? '' : 'none';
      });
    });
  }

  // Routes Table Live Search
  const searchRoutes = document.getElementById('searchRoutesInput');
  if (searchRoutes) {
    searchRoutes.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase().trim();
      document.querySelectorAll('#tableRouteDelays tbody tr.route-row').forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(q) ? '' : 'none';
      });
    });
  }

  // Recommendations Table Live Search
  const searchRecs = document.getElementById('searchRecsInput');
  if (searchRecs) {
    searchRecs.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase().trim();
      document.querySelectorAll('#tableRecommendations tbody tr.rec-row').forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(q) ? '' : 'none';
      });
    });
  }
}

// ==============================================================================
// 7. ML RECOMMENDATIONS & CROP INTELLIGENCE VIEW
// ==============================================================================
function renderRecommendationsView(data) {
  if (!data) return;

  const recs = data.recommendations || [];
  if (recs.length > 0) {
    const topRec = recs[0];
    const topNameElem = document.getElementById('recTopMandiName');
    const topPriceElem = document.getElementById('recTopMandiPrice');
    if (topNameElem) topNameElem.textContent = `${topRec.mandi_name} (${topRec.mandi_id})`;
    if (topPriceElem) topPriceElem.textContent = `₹${(topRec.predicted_price || 0).toFixed(2)}/Qtl`;
  }

  renderRecommendationsTable(recs);
  renderModelPriceSpreadChart(data.crop_prices);
  renderModelFarmerChart(data.crop_arrivals);
}

function renderRecommendationsTable(recs) {
  const tbody = document.querySelector('#tableRecommendations tbody');
  if (!tbody) return;

  if (!recs || recs.length === 0) {
    tbody.innerHTML = `<tr><td colspan="11" class="text-center" style="padding:24px; color:#94a3b8;">No market recommendations match the current filter selection.</td></tr>`;
    return;
  }

  tbody.innerHTML = recs.map(r => {
    const stateBadge = r.state === 'Punjab' ? 'badge-pb' : r.state === 'Haryana' ? 'badge-hr' : 'badge-up';
    const isPositive = (r.price_spread || 0) >= 0;
    const strategyClass = r.rank <= 5 ? 'strong' : isPositive ? 'stable' : 'deficit';
    return `
      <tr class="rec-row">
        <td><strong>#${r.rank}</strong></td>
        <td><code>${r.mandi_id}</code></td>
        <td><strong>${r.mandi_name}</strong></td>
        <td>${r.district}</td>
        <td><span class="badge-state ${stateBadge}">${r.state}</span></td>
        <td><span class="badge-sub">${r.mandi_type || 'APMC'}</span></td>
        <td class="text-emerald"><strong>₹${(r.predicted_price || 0).toFixed(2)}</strong></td>
        <td>₹${(r.current_wheat_price || 2310).toFixed(2)}</td>
        <td class="${isPositive ? 'text-emerald' : 'text-rose'}">
          ${isPositive ? '+' : ''}₹${(r.price_spread || 0).toFixed(2)}
        </td>
        <td><span class="badge-strategy ${strategyClass}">${r.strategy || 'Standard Liquidity'}</span></td>
        <td>
          <button class="btn btn-sm btn-primary" onclick="executeAgentPrompt('Which warehouse receives the highest volume of crops?')">
            Dispatch
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

function filterRecommendationsTable() {
  if (!recommendationsData || !recommendationsData.recommendations) return;
  const state = document.getElementById('filterState').value;
  const dist = document.getElementById('filterDistrict').value;
  const mandi = document.getElementById('filterMandi').value;

  let filtered = recommendationsData.recommendations;
  if (state !== 'All') filtered = filtered.filter(r => r.state === state);
  if (dist !== 'All') filtered = filtered.filter(r => r.district === dist);
  if (mandi !== 'All') filtered = filtered.filter(r => r.mandi_id === mandi);

  renderRecommendationsTable(filtered);
}

function renderModelPriceSpreadChart(cropPrices) {
  const canvas = document.getElementById('chartModelPrices');
  if (!canvas || !cropPrices) return;
  const ctx = canvas.getContext('2d');

  charts.modelPrices = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: cropPrices.map(c => c.crop_name),
      datasets: [
        { label: 'Min Price (₹)', data: cropPrices.map(c => Math.round(c.minimum_price)), backgroundColor: '#3b82f6', borderRadius: 4 },
        { label: 'Avg Price (₹)', data: cropPrices.map(c => Math.round(c.average_price)), backgroundColor: '#10b981', borderRadius: 4 },
        { label: 'Max Price (₹)', data: cropPrices.map(c => Math.round(c.maximum_price)), backgroundColor: '#f59e0b', borderRadius: 4 }
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

function renderModelFarmerChart(cropArrivals) {
  const canvas = document.getElementById('chartModelFarmers');
  if (!canvas || !cropArrivals) return;
  const ctx = canvas.getContext('2d');

  charts.modelFarmers = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: cropArrivals.map(c => c.crop_name),
      datasets: [{
        label: 'Registered Farmers',
        data: cropArrivals.map(c => c.total_farmer_count),
        backgroundColor: '#8b5cf6',
        borderRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { grid: { display: false } },
        y: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, title: { display: true, text: 'Farmers Count' } }
      }
    }
  });
}

// ==============================================================================
// 8. AI AGENT QUERY ENGINE
// ==============================================================================
function setupAgentHandlers() {
  const btn = document.getElementById('btnRunAgent');
  const input = document.getElementById('agentInput');
  if (!btn || !input) return;

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
      let formattedHtml = data.summary
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n\n/g, '<br><br>')
        .replace(/- /g, '• ');
      summaryElem.innerHTML = formattedHtml;

      if (data.stats) {
        pillsElem.innerHTML = data.stats.map(s => `
          <div class="stat-pill-card glass">
            <span class="stat-pill-label">${s.label}</span>
            <span class="stat-pill-value">${s.value}</span>
          </div>
        `).join('');
      }

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
