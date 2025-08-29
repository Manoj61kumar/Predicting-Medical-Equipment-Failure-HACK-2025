// Medical Device Monitoring System - Enhanced Live Streaming Application

// Device Configuration
const DEVICE_MAPPING = {
    "Alaris GH": "Infusion Pump",
    "Baxter Flo-Gard": "Infusion Pump", 
    "Smiths Medfusion": "Infusion Pump",
    "Baxter AK 96": "Dialysis Machine",
    "Fresenius 4008": "Dialysis Machine",
    "NxStage System One": "Dialysis Machine",
    "Datex Ohmeda S5": "Anesthesia Machine",
    "Drager Fabius Trio": "Anesthesia Machine", 
    "GE Aisys": "Anesthesia Machine",
    "Drager V500": "Patient Ventilator",
    "Hamilton G5": "Patient Ventilator",
    "Puritan Bennett 980": "Patient Ventilator",
    "HeartStart FRx": "Defibrillator",
    "Lifepak 20": "Defibrillator",
    "Philips HeartStrart": "Defibrillator",
    "Zoll R Series": "Defibrillator",
    "GE Logiq E9": "Ultrasound Machine",
    "Philips EPIQ": "Ultrasound Machine", 
    "Siemens Acuson": "Ultrasound Machine",
    "Siemens S2000": "Ultrasound Machine",
    "GE Revolution": "CT Scanner",
    "Philips Ingenuity": "CT Scanner",
    "GE MAC 2000": "ECG Monitor",
    "Phillips PageWriter": "ECG Monitor"
};

const DEVICE_TYPES = ["Anesthesia Machine", "CT Scanner", "Defibrillator", "Dialysis Machine", "ECG Monitor", "Infusion Pump", "Patient Ventilator", "Ultrasound Machine"];
const LOCATIONS = ["Hospital A - ICU", "Hospital A - Emergency", "Hospital B - Nephrology", "Hospital B - Cardiology", "Hospital C - Surgery"];

// Global Application State
let devices = [];
let alerts = [];
let isStreaming = false;
let streamingInterval = null;
let charts = {};
let currentTheme = 'light';
let updateInterval = 2000; // 2 seconds for fast streaming
let soundEnabled = false;
let updateCount = 0;
let lastStats = { healthy: 0, warning: 0, critical: 0 };
let chartsPaused = { risk: false, temperature: false };

// Initialize Application
document.addEventListener('DOMContentLoaded', function() {
    initializeApplication();
    setupEventListeners();
    generateDevices();
    setupCharts();
    startLiveStreaming(); // Auto-start live streaming
});

// Core Application Functions
function initializeApplication() {
    console.log('Initializing Enhanced Medical Device Monitoring System...');
    
    // Detect system theme preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        currentTheme = 'dark';
        updateThemeIcon();
    }
    
    // Setup manual form device options
    setupManualForm();
    
    // Setup inventory filters
    setupInventoryFilters();
    
    // Initialize streaming controls
    updateStreamingControls();
    
    console.log('Enhanced application initialized successfully');
}

function setupEventListeners() {
    // Tab navigation - Fixed event handling with proper delegation
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const tabName = this.getAttribute('data-tab');
            if (tabName) {
                console.log('Switching to tab:', tabName);
                switchTab(tabName);
            }
        });
    });
    
    // Enhanced streaming controls
    document.getElementById('toggleStreamBtn').addEventListener('click', toggleStreaming);
    document.getElementById('soundToggle').addEventListener('click', toggleSound);
    
    // Speed control slider
    const speedSlider = document.getElementById('speedSlider');
    speedSlider.addEventListener('input', (e) => {
        updateInterval = parseInt(e.target.value) * 1000;
        document.getElementById('speedDisplay').textContent = e.target.value + 's';
        if (isStreaming) {
            restartStreaming();
        }
    });
    
    // Chart pause controls
    document.getElementById('pauseRiskChart').addEventListener('click', () => {
        chartsPaused.risk = !chartsPaused.risk;
        document.getElementById('pauseRiskChart').textContent = chartsPaused.risk ? '▶️' : '⏸️';
    });
    
    document.getElementById('pauseTempChart').addEventListener('click', () => {
        chartsPaused.temperature = !chartsPaused.temperature;
        document.getElementById('pauseTempChart').textContent = chartsPaused.temperature ? '▶️' : '⏸️';
    });
    
    // Other controls
    document.getElementById('themeToggle').addEventListener('click', toggleTheme);
    document.getElementById('exportBtn').addEventListener('click', exportData);
    document.getElementById('runBatchBtn').addEventListener('click', runBatchPrediction);
    document.getElementById('manualForm').addEventListener('submit', handleManualPrediction);
    document.getElementById('searchInput').addEventListener('input', filterInventory);
    document.getElementById('typeFilter').addEventListener('change', filterInventory);
    document.getElementById('locationFilter').addEventListener('change', filterInventory);
    document.getElementById('closeModal').addEventListener('click', closeModal);
    document.getElementById('deviceModal').addEventListener('click', (e) => {
        if (e.target.id === 'deviceModal') closeModal();
    });
    document.getElementById('clearAlertsBtn').addEventListener('click', clearAlerts);
}

// Tab Management - Fixed implementation
function switchTab(tabName) {
    console.log('Switching to tab:', tabName);
    
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    const activeTabBtn = document.querySelector(`[data-tab="${tabName}"]`);
    if (activeTabBtn) {
        activeTabBtn.classList.add('active');
    }
    
    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    const activeTabContent = document.getElementById(tabName);
    if (activeTabContent) {
        activeTabContent.classList.add('active');
    }
    
    // Load tab-specific content
    switch(tabName) {
        case 'dashboard':
            // Dashboard is always live
            break;
        case 'batch':
            // Batch content is static
            break;
        case 'manual':
            // Manual form is static
            break;
        case 'streaming':
            updateStreamingStats();
            break;
        case 'inventory':
            populateInventoryTable();
            break;
        case 'alerts':
            displayAlerts();
            updateAlertCounts();
            break;
    }
    
    console.log('Successfully switched to tab:', tabName);
}

// Enhanced Device Data Generation
function generateDevices() {
    devices = [];
    const deviceNames = Object.keys(DEVICE_MAPPING);
    
    for (let i = 0; i < 24; i++) {
        const deviceName = deviceNames[i];
        const deviceType = DEVICE_MAPPING[deviceName];
        const location = LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)];
        
        const device = {
            id: i + 1,
            deviceName,
            deviceType,
            location,
            alerted: false,
            lastUpdate: new Date(),
            ...generateRealisticParameters(deviceType)
        };
        
        devices.push(device);
    }
    
    console.log('Generated 24 medical devices with realistic parameters');
}

function generateRealisticParameters(deviceType) {
    const baseParams = {
        temperature: 20 + Math.random() * 25, // 20-45°C
        vibration: Math.random() * 1.2, // 0-1.2
        errorLogs: Math.floor(Math.random() * 30), // 0-30
        runtimeHours: 1000 + Math.random() * 8000, // 1000-9000 hours
        deviceAge: 0.5 + Math.random() * 5, // 0.5-5.5 years
        repairs: Math.floor(Math.random() * 8), // 0-8 repairs
        pressure: 80 + Math.random() * 100, // 80-180
        currentDraw: 3 + Math.random() * 8 // 3-11 amps
    };
    
    // Device-specific parameter adjustments
    switch (deviceType) {
        case "Patient Ventilator":
            baseParams.temperature = Math.min(baseParams.temperature, 35);
            baseParams.pressure = 100 + Math.random() * 50;
            break;
        case "Dialysis Machine":
            baseParams.pressure = 120 + Math.random() * 80;
            baseParams.currentDraw = 6 + Math.random() * 5;
            break;
        case "CT Scanner":
            baseParams.currentDraw = 8 + Math.random() * 7;
            baseParams.temperature = 25 + Math.random() * 15;
            break;
        case "Defibrillator":
            baseParams.currentDraw = 2 + Math.random() * 12;
            baseParams.vibration = Math.random() * 0.4;
            break;
    }
    
    return baseParams;
}

// FAST LIVE STREAMING IMPLEMENTATION
function startLiveStreaming() {
    if (isStreaming) return;
    
    isStreaming = true;
    updateStreamingControls();
    updateCount = 0;
    
    // Start fast streaming with 2-second updates
    streamingInterval = setInterval(() => {
        updateAllDevicesRealtime();
        updateLiveDashboard();
        updateCharts();
        checkForAlerts();
        updateStreamingMetrics();
        updateCount++;
    }, updateInterval);
    
    showToast("🔴 Live streaming started - Fast updates every " + (updateInterval/1000) + "s");
    console.log('Fast live streaming started with', updateInterval/1000, 'second intervals');
}

function stopLiveStreaming() {
    if (!isStreaming) return;
    
    isStreaming = false;
    if (streamingInterval) {
        clearInterval(streamingInterval);
        streamingInterval = null;
    }
    
    updateStreamingControls();
    showToast("⏸️ Live streaming stopped");
    console.log('Live streaming stopped');
}

function toggleStreaming() {
    if (isStreaming) {
        stopLiveStreaming();
    } else {
        startLiveStreaming();
    }
}

function restartStreaming() {
    if (isStreaming) {
        stopLiveStreaming();
        setTimeout(startLiveStreaming, 100);
    }
}

// FAST DATA GENERATION - Update every 2 seconds
function updateAllDevicesRealtime() {
    devices.forEach(device => {
        // Simulate realistic parameter changes with small variations
        device.temperature += (Math.random() - 0.5) * 2; // ±1°C change
        device.vibration += (Math.random() - 0.5) * 0.1; // ±0.05 change  
        device.errorLogs += Math.floor(Math.random() * 3); // 0-2 new errors
        device.runtimeHours += 0.5; // 30 minutes runtime
        device.pressure += (Math.random() - 0.5) * 5; // ±2.5 pressure change
        device.currentDraw += (Math.random() - 0.5) * 0.5; // ±0.25A change
        
        // Keep values in realistic ranges
        device.temperature = Math.max(15, Math.min(45, device.temperature));
        device.vibration = Math.max(0, Math.min(1.2, device.vibration));
        device.errorLogs = Math.max(0, Math.min(50, device.errorLogs));
        device.pressure = Math.max(50, Math.min(250, device.pressure));
        device.currentDraw = Math.max(1, Math.min(15, device.currentDraw));
        
        // Update timestamp
        device.lastUpdate = new Date();
        
        // Run XGBoost prediction for each device
        const prediction = simulateXGBoostPrediction(device);
        device.prediction = prediction.prediction;
        device.confidence = prediction.confidence;
        device.riskScore = prediction.riskScore;
        device.factors = prediction.factors;
    });
}

// LIVE DASHBOARD UPDATES
function updateLiveDashboard() {
    // Calculate current statistics
    const stats = calculateDeviceStats();
    updateDashboardStats(stats);
    
    // Update device grid with real-time data
    updateDeviceGrid();
    
    // Update live metrics
    updateLiveMetrics();
}

function calculateDeviceStats() {
    const stats = {
        total: devices.length,
        healthy: 0,
        warning: 0,
        critical: 0
    };
    
    devices.forEach(device => {
        if (device.prediction) {
            switch(device.prediction) {
                case 'Low':
                    stats.healthy++;
                    break;
                case 'Medium':
                    stats.warning++;
                    break;
                case 'High':
                    stats.critical++;
                    break;
            }
        }
    });
    
    return stats;
}

function updateDashboardStats(stats) {
    // Update values
    document.getElementById('totalDevices').textContent = stats.total;
    document.getElementById('healthyDevices').textContent = stats.healthy;
    document.getElementById('warningDevices').textContent = stats.warning;
    document.getElementById('criticalDevices').textContent = stats.critical;
    
    // Update change indicators
    updateStatChanges(stats);
    lastStats = { ...stats };
}

function updateStatChanges(stats) {
    updateStatChange('healthyChange', stats.healthy - lastStats.healthy);
    updateStatChange('warningChange', stats.warning - lastStats.warning);
    updateStatChange('criticalChange', stats.critical - lastStats.critical);
}

function updateStatChange(elementId, change) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = change >= 0 ? `+${change}` : `${change}`;
        element.className = 'stat-change ' + (change > 0 ? 'positive' : change < 0 ? 'negative' : '');
    }
}

function updateDeviceGrid() {
    const grid = document.getElementById('deviceGrid');
    
    devices.forEach((device, index) => {
        let card = grid.children[index];
        if (!card) {
            card = createDeviceCard(device, index);
            grid.appendChild(card);
        } else {
            updateDeviceCard(card, device);
        }
    });
}

function createDeviceCard(device, index) {
    const card = document.createElement('div');
    card.className = 'device-card';
    card.dataset.deviceId = device.id;
    card.addEventListener('click', () => showDeviceDetails(device, device));
    
    updateDeviceCard(card, device);
    return card;
}

function updateDeviceCard(card, device) {
    const riskClass = device.prediction ? `risk-${device.prediction.toLowerCase()}` : 'risk-low';
    const riskLevel = device.prediction || 'Low';
    
    // Add updating animation
    card.classList.add('updating');
    setTimeout(() => card.classList.remove('updating'), 200);
    
    card.innerHTML = `
        <div class="device-header">
            <div>
                <div class="device-name">${device.deviceName}</div>
                <div class="device-type">${device.deviceType}</div>
            </div>
            <div class="status">
                <span class="status-dot ${riskLevel.toLowerCase()}"></span>
                <span class="status ${riskClass}">${riskLevel}</span>
            </div>
        </div>
        <div class="device-metrics">
            <div class="metric">
                <span class="metric-label">Temperature</span>
                <span class="metric-value">${device.temperature.toFixed(1)}°C</span>
            </div>
            <div class="metric">
                <span class="metric-label">Vibration</span>
                <span class="metric-value">${device.vibration.toFixed(2)}</span>
            </div>
            <div class="metric">
                <span class="metric-label">Runtime</span>
                <span class="metric-value">${Math.round(device.runtimeHours)}h</span>
            </div>
            <div class="metric">
                <span class="metric-label">Confidence</span>
                <span class="metric-value">${device.confidence ? Math.round(device.confidence * 100) : 0}%</span>
            </div>
        </div>
    `;
}

function updateLiveMetrics() {
    // Update rate per minute
    const updatesPerMinute = Math.round((60 / (updateInterval / 1000)));
    const updateRateElement = document.getElementById('updateRate');
    if (updateRateElement) {
        updateRateElement.textContent = updatesPerMinute;
    }
    
    // Data rate
    const dataRateElement = document.getElementById('dataRate');
    if (dataRateElement) {
        dataRateElement.textContent = isStreaming ? 'Real-time' : 'Stopped';
    }
    
    // Connection status
    const connectionStatusElement = document.getElementById('connectionStatus');
    if (connectionStatusElement) {
        connectionStatusElement.textContent = isStreaming ? 'Active' : 'Disconnected';
    }
}

// ENHANCED CHART UPDATES
function setupCharts() {
    const chartColors = ['#1FB8CD', '#FFC185', '#B4413C'];
    
    // Risk Distribution Chart
    charts.riskChart = new Chart(document.getElementById('riskChart'), {
        type: 'doughnut',
        data: {
            labels: ['Low Risk', 'Medium Risk', 'High Risk'],
            datasets: [{
                data: [0, 0, 0],
                backgroundColor: chartColors,
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 0 // No animation for smooth real-time updates
            },
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
    
    // Live Temperature Chart
    charts.temperatureChart = new Chart(document.getElementById('temperatureChart'), {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Average Temperature',
                data: [],
                borderColor: chartColors[0],
                backgroundColor: chartColors[0] + '20',
                fill: true,
                tension: 0.4,
                pointRadius: 1,
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 0 // No animation for smooth updates
            },
            scales: {
                y: {
                    beginAtZero: false,
                    title: {
                        display: true,
                        text: 'Temperature (°C)'
                    }
                },
                x: {
                    display: false
                }
            },
            elements: {
                line: {
                    tension: 0.4
                }
            }
        }
    });
    
    // Streaming Chart
    charts.streamingChart = new Chart(document.getElementById('streamingChart'), {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Live Temperature',
                data: [],
                borderColor: chartColors[1],
                backgroundColor: 'transparent',
                borderWidth: 2,
                pointRadius: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 0
            },
            scales: {
                x: {
                    display: false
                },
                y: {
                    title: {
                        display: true,
                        text: 'Temperature (°C)'
                    }
                }
            }
        }
    });
}

function updateCharts() {
    updateRiskChart();
    updateTemperatureChart();
    updateStreamingChart();
}

function updateRiskChart() {
    if (chartsPaused.risk) return;
    
    // Update risk distribution chart
    const riskCounts = [0, 0, 0];
    devices.forEach(device => {
        if (device.prediction) {
            switch(device.prediction) {
                case 'Low': riskCounts[0]++; break;
                case 'Medium': riskCounts[1]++; break;
                case 'High': riskCounts[2]++; break;
            }
        }
    });
    
    charts.riskChart.data.datasets[0].data = riskCounts;
    charts.riskChart.update('none'); // No animation for smooth updates
}

function updateTemperatureChart() {
    if (chartsPaused.temperature) return;
    
    // Add new data point
    const now = new Date().toLocaleTimeString();
    const temps = devices.map(d => d.temperature);
    const avgTemp = temps.reduce((a, b) => a + b) / temps.length;
    
    charts.temperatureChart.data.labels.push(now);
    charts.temperatureChart.data.datasets[0].data.push(avgTemp.toFixed(1));
    
    // Keep only last 20 data points for smooth scrolling
    if (charts.temperatureChart.data.labels.length > 20) {
        charts.temperatureChart.data.labels.shift();
        charts.temperatureChart.data.datasets[0].data.shift();
    }
    
    charts.temperatureChart.update('none'); // No animation for smooth updates
}

function updateStreamingChart() {
    if (!isStreaming) return;
    
    const now = new Date().toLocaleTimeString();
    const randomDevice = devices[Math.floor(Math.random() * devices.length)];
    const temperature = randomDevice.temperature;
    
    charts.streamingChart.data.labels.push(now);
    charts.streamingChart.data.datasets[0].data.push(temperature.toFixed(1));
    
    // Keep only last 30 data points
    if (charts.streamingChart.data.labels.length > 30) {
        charts.streamingChart.data.labels.shift();
        charts.streamingChart.data.datasets[0].data.shift();
    }
    
    charts.streamingChart.update('none');
}

// POPUP ALERT SYSTEM
function checkForAlerts() {
    devices.forEach(device => {
        const shouldAlert = (
            device.prediction === 'High' || 
            device.temperature > 38 || 
            device.vibration > 0.8 ||
            device.errorLogs > 20
        );
        
        if (shouldAlert && !device.alerted) {
            showPopupAlert(device);
            device.alerted = true;
            addAlert('critical', 'CRITICAL DEVICE ALERT', 
                   `${device.deviceName} requires immediate inspection`, device.location);
        }
        
        // Reset alert after conditions improve
        if (!shouldAlert && device.alerted) {
            device.alerted = false;
        }
    });
}

function showPopupAlert(device) {
    const alertDiv = document.createElement('div');
    alertDiv.className = 'alert-popup critical';
    alertDiv.innerHTML = `
        <div class="alert-header">
            <h3>
                <span class="alert-icon">🚨</span>
                CRITICAL DEVICE ALERT
            </h3>
            <button class="close-alert" onclick="this.parentElement.parentElement.remove()">×</button>
        </div>
        <div class="alert-content">
            <strong>${device.deviceName}</strong> - ${device.deviceType}<br>
            Location: ${device.location}<br>
            Risk Level: <span class="risk-high">${device.prediction || 'High'}</span><br>
            Temperature: ${device.temperature.toFixed(1)}°C<br>
            Vibration: ${device.vibration.toFixed(2)}<br>
            <strong>Action Required: Immediate Inspection</strong>
        </div>
    `;
    
    document.getElementById('popupAlertContainer').appendChild(alertDiv);
    
    // Play sound if enabled
    if (soundEnabled) {
        playAlertSound();
    }
    
    // Auto-remove after 10 seconds
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.remove();
        }
    }, 10000);
}

function playAlertSound() {
    // Create audio context for alert sound
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        gainNode.gain.value = 0.1;
        
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.2);
    } catch (error) {
        console.warn('Audio alert not available:', error);
    }
}

// STREAMING CONTROLS
function updateStreamingControls() {
    const btn = document.getElementById('toggleStreamBtn');
    const icon = document.getElementById('streamBtnIcon');
    const text = document.getElementById('streamBtnText');
    const indicator = document.getElementById('liveIndicator');
    const statusDot = document.getElementById('streamingStatusDot');
    const statusText = document.getElementById('streamingStatusText');
    
    if (isStreaming) {
        icon.textContent = '⏸️';
        text.textContent = 'Pause Live';
        btn.className = 'btn btn--secondary btn--sm';
        indicator.style.display = 'flex';
        if (statusDot) statusDot.classList.add('active');
        if (statusText) statusText.textContent = 'Streaming';
    } else {
        icon.textContent = '▶️';
        text.textContent = 'Start Live';
        btn.className = 'btn btn--primary btn--sm';
        indicator.style.display = 'none';
        if (statusDot) statusDot.classList.remove('active');
        if (statusText) statusText.textContent = 'Stopped';
    }
}

function toggleSound() {
    soundEnabled = !soundEnabled;
    const icon = document.getElementById('soundIcon');
    icon.textContent = soundEnabled ? '🔊' : '🔇';
    showToast(soundEnabled ? '🔊 Sound alerts enabled' : '🔇 Sound alerts disabled');
}

function updateStreamingMetrics() {
    const indicator = document.getElementById('streamingStatusIndicator');
    if (indicator) {
        indicator.style.display = 'flex';
    }
}

// Enhanced XGBoost ML Simulation
function simulateXGBoostPrediction(deviceData) {
    // Extract normalized features
    const features = {
        temp_norm: Math.min(Math.max((deviceData.temperature - 20) / 25, 0), 1),
        vibration_norm: Math.min(deviceData.vibration / 1.2, 1),
        error_norm: Math.min(deviceData.errorLogs / 30, 1),
        runtime_norm: Math.min(deviceData.runtimeHours / 10000, 1),
        age_norm: Math.min(deviceData.deviceAge / 6, 1),
        repair_norm: Math.min(deviceData.repairs / 10, 1),
        pressure_norm: Math.min(Math.max((deviceData.pressure - 50) / 200, 0), 1),
        current_norm: Math.min(deviceData.currentDraw / 15, 1)
    };
    
    // Simulate XGBoost ensemble prediction
    let riskScore = 0;
    let treeCount = 0;
    
    // Temperature-Vibration Interaction
    const tempVibInteraction = features.temp_norm * features.vibration_norm;
    if (tempVibInteraction > 0.6) riskScore += 0.28;
    else if (tempVibInteraction > 0.3) riskScore += 0.12;
    treeCount++;
    
    // Operational Stress
    const operationalStress = Math.pow(features.runtime_norm * features.error_norm * features.age_norm, 0.33);
    if (operationalStress > 0.7) riskScore += 0.32;
    else if (operationalStress > 0.4) riskScore += 0.16;
    treeCount++;
    
    // Maintenance History
    const maintenanceRisk = features.repair_norm * (1 + features.age_norm);
    if (maintenanceRisk > 0.8) riskScore += 0.25;
    else if (maintenanceRisk > 0.4) riskScore += 0.10;
    treeCount++;
    
    // Power System Analysis
    const powerRisk = features.current_norm * (1 + features.temp_norm * 0.5);
    if (powerRisk > 0.9) riskScore += 0.22;
    else if (powerRisk > 0.6) riskScore += 0.11;
    treeCount++;
    
    // Pressure System Integrity
    if (features.pressure_norm > 0.85 && features.vibration_norm > 0.4) riskScore += 0.26;
    else if (features.pressure_norm > 0.7) riskScore += 0.08;
    treeCount++;
    
    // Device-Specific Risk Factors
    const deviceType = DEVICE_MAPPING[deviceData.deviceName] || "Unknown";
    let deviceSpecificRisk = 0;
    
    switch (deviceType) {
        case "Patient Ventilator":
            if (features.temp_norm > 0.6 || features.error_norm > 0.5) deviceSpecificRisk = 0.24;
            break;
        case "Dialysis Machine":
            if (features.pressure_norm > 0.7 && features.runtime_norm > 0.6) deviceSpecificRisk = 0.21;
            break;
        case "Defibrillator":
            if (features.current_norm > 0.8 || features.repair_norm > 0.6) deviceSpecificRisk = 0.26;
            break;
        case "CT Scanner":
            if (features.current_norm > 0.7 && features.temp_norm > 0.5) deviceSpecificRisk = 0.23;
            break;
        case "Anesthesia Machine":
            if (features.error_norm > 0.6 || (features.temp_norm > 0.5 && features.age_norm > 0.7)) deviceSpecificRisk = 0.20;
            break;
        default:
            deviceSpecificRisk = features.error_norm * 0.15;
    }
    riskScore += deviceSpecificRisk;
    treeCount++;
    
    // Environmental Interaction
    const environmentalFactor = Math.sqrt(features.temp_norm * features.vibration_norm * features.pressure_norm);
    if (environmentalFactor > 0.6) riskScore += 0.19;
    treeCount++;
    
    // Aging Equipment Pattern
    const agingPattern = features.age_norm * features.runtime_norm * (1 + features.repair_norm);
    if (agingPattern > 0.8) riskScore += 0.27;
    else if (agingPattern > 0.5) riskScore += 0.13;
    treeCount++;
    
    // Gradient boosting ensemble averaging
    const learningRate = 0.1;
    riskScore = Math.min(riskScore * learningRate * treeCount, 1.0);
    
    // Calculate confidence
    const featureVariance = calculateFeatureVariance(Object.values(features));
    const confidence = Math.max(0.65, Math.min(0.95, 0.8 + (1 - featureVariance) * 0.15));
    
    // Risk categorization
    let prediction;
    if (riskScore >= 0.65) prediction = "High";
    else if (riskScore >= 0.35) prediction = "Medium";
    else prediction = "Low";
    
    // Generate risk factors
    const riskFactors = analyzeRiskFactors(deviceData, features);
    
    return {
        prediction,
        confidence: Math.round(confidence * 100) / 100,
        riskScore: Math.round(riskScore * 100) / 100,
        factors: riskFactors,
        modelVersion: "XGBoost v2.1.0",
        timestamp: new Date().toISOString()
    };
}

function calculateFeatureVariance(features) {
    const mean = features.reduce((sum, val) => sum + val, 0) / features.length;
    const variance = features.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / features.length;
    return Math.sqrt(variance);
}

function analyzeRiskFactors(deviceData, features) {
    const factors = [];
    
    if (features.temp_norm > 0.7) factors.push(`High temperature (${deviceData.temperature.toFixed(1)}°C)`);
    if (features.vibration_norm > 0.6) factors.push(`Excessive vibration (${deviceData.vibration.toFixed(2)})`);
    if (features.error_norm > 0.5) factors.push(`Frequent errors (${deviceData.errorLogs} logs)`);
    if (features.runtime_norm > 0.8) factors.push(`Extended runtime (${Math.round(deviceData.runtimeHours)} hours)`);
    if (features.age_norm > 0.7) factors.push(`Device aging (${deviceData.deviceAge.toFixed(1)} years)`);
    if (features.repair_norm > 0.6) factors.push(`Multiple repairs (${deviceData.repairs} repairs)`);
    if (features.pressure_norm > 0.8) factors.push(`High pressure (${deviceData.pressure.toFixed(0)} units)`);
    if (features.current_norm > 0.7) factors.push(`High power draw (${deviceData.currentDraw.toFixed(1)}A)`);
    
    if (factors.length === 0) {
        factors.push("All parameters within normal ranges");
    }
    
    return factors;
}

// Streaming Stats
function updateStreamingStats() {
    const statsDiv = document.getElementById('streamingStats');
    if (!statsDiv) return;
    
    const dataPoints = charts.streamingChart ? charts.streamingChart.data.datasets[0].data.length : 0;
    
    if (dataPoints === 0) {
        statsDiv.innerHTML = '<p class="text-muted">No streaming data available</p>';
        return;
    }
    
    const temperatures = charts.streamingChart.data.datasets[0].data.map(parseFloat);
    const avgTemp = temperatures.reduce((sum, temp) => sum + temp, 0) / temperatures.length;
    const maxTemp = Math.max(...temperatures);
    const minTemp = Math.min(...temperatures);
    
    statsDiv.innerHTML = `
        <div class="streaming-stat">
            <span>Data Points:</span>
            <span class="font-bold">${dataPoints}</span>
        </div>
        <div class="streaming-stat">
            <span>Update Interval:</span>
            <span class="font-bold">${updateInterval/1000}s</span>
        </div>
        <div class="streaming-stat">
            <span>Updates Count:</span>
            <span class="font-bold">${updateCount}</span>
        </div>
        <div class="streaming-stat">
            <span>Avg Temperature:</span>
            <span class="font-bold">${avgTemp.toFixed(1)}°C</span>
        </div>
        <div class="streaming-stat">
            <span>Max Temperature:</span>
            <span class="font-bold">${maxTemp.toFixed(1)}°C</span>
        </div>
        <div class="streaming-stat">
            <span>Min Temperature:</span>
            <span class="font-bold">${minTemp.toFixed(1)}°C</span>
        </div>
        <div class="streaming-stat">
            <span>Status:</span>
            <span class="font-bold status--success">${isStreaming ? 'Live Streaming' : 'Stopped'}</span>
        </div>
    `;
}

// Alert Management
function addAlert(type, title, message, location) {
    const existingAlert = alerts.find(alert => 
        alert.title === title && alert.message === message
    );
    
    if (!existingAlert) {
        alerts.unshift({
            id: Date.now(),
            type,
            title,
            message,
            location,
            timestamp: new Date()
        });
        
        if (alerts.length > 50) {
            alerts = alerts.slice(0, 50);
        }
        
        updateAlertCounts();
    }
}

function updateAlertCounts() {
    const activeCount = alerts.length;
    const criticalCount = alerts.filter(alert => alert.type === 'critical').length;
    
    const activeElement = document.getElementById('activeAlertCount');
    const criticalElement = document.getElementById('criticalAlertCount');
    
    if (activeElement) activeElement.textContent = activeCount;
    if (criticalElement) criticalElement.textContent = criticalCount;
}

function displayAlerts() {
    const alertsList = document.getElementById('alertsList');
    if (!alertsList) return;
    
    if (alerts.length === 0) {
        alertsList.innerHTML = '<p class="text-muted text-center">No system alerts at this time.</p>';
        return;
    }
    
    alertsList.innerHTML = alerts.map(alert => `
        <div class="alert-item ${alert.type}">
            <div class="alert-content">
                <div class="alert-title">${alert.title}</div>
                <div class="alert-message">${alert.message}</div>
                <div class="alert-time">${alert.timestamp.toLocaleString()} - ${alert.location}</div>
            </div>
            <button class="alert-dismiss" onclick="dismissAlert(${alert.id})">&times;</button>
        </div>
    `).join('');
}

function dismissAlert(alertId) {
    alerts = alerts.filter(alert => alert.id !== alertId);
    displayAlerts();
    updateAlertCounts();
}

function clearAlerts() {
    alerts = [];
    displayAlerts();
    updateAlertCounts();
    showToast("All alerts cleared");
}

// Manual prediction form setup
function setupManualForm() {
    const deviceSelect = document.getElementById('manualDeviceName');
    if (!deviceSelect) return;
    
    Object.keys(DEVICE_MAPPING).forEach(deviceName => {
        const option = document.createElement('option');
        option.value = deviceName;
        option.textContent = `${deviceName} (${DEVICE_MAPPING[deviceName]})`;
        deviceSelect.appendChild(option);
    });
}

async function handleManualPrediction(event) {
    event.preventDefault();
    
    const deviceData = {
        deviceName: document.getElementById('manualDeviceName').value,
        temperature: parseFloat(document.getElementById('manualTemp').value),
        vibration: parseFloat(document.getElementById('manualVibration').value),
        errorLogs: parseInt(document.getElementById('manualErrors').value),
        runtimeHours: parseInt(document.getElementById('manualRuntime').value),
        deviceAge: 2.5,
        repairs: Math.floor(Math.random() * 5),
        pressure: 100 + Math.random() * 50,
        currentDraw: 4 + Math.random() * 4
    };
    
    try {
        const prediction = simulateXGBoostPrediction(deviceData);
        displayManualResults(prediction);
    } catch (error) {
        console.error('Manual prediction error:', error);
        showToast("Error analyzing device", 'error');
    }
}

function displayManualResults(prediction) {
    const resultsDiv = document.getElementById('manualResults');
    if (!resultsDiv) return;
    
    resultsDiv.innerHTML = `
        <div class="prediction-results">
            <div class="result-item">
                <span class="result-label">Risk Level:</span>
                <span class="result-value risk-${prediction.prediction.toLowerCase()}">${prediction.prediction}</span>
            </div>
            <div class="result-item">
                <span class="result-label">Confidence:</span>
                <span class="result-value">${Math.round(prediction.confidence * 100)}%</span>
            </div>
            <div class="result-item">
                <span class="result-label">Risk Score:</span>
                <span class="result-value">${(prediction.riskScore * 100).toFixed(1)}%</span>
            </div>
            <div class="result-item">
                <span class="result-label">Model:</span>
                <span class="result-value font-mono">${prediction.modelVersion}</span>
            </div>
            <div style="margin-top: 16px;">
                <strong>Risk Factors:</strong>
                <ul style="margin: 8px 0; padding-left: 20px;">
                    ${prediction.factors.map(factor => `<li>${factor}</li>`).join('')}
                </ul>
            </div>
        </div>
    `;
}

// Batch prediction
async function runBatchPrediction() {
    const btn = document.getElementById('runBatchBtn');
    const btnText = document.getElementById('batchBtnText');
    const spinner = document.getElementById('batchSpinner');
    
    btn.disabled = true;
    btnText.textContent = 'Analyzing...';
    spinner.classList.remove('hidden');
    
    try {
        // Simulate batch processing with current device data
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const results = devices.map(device => ({
            ...device,
            ...simulateXGBoostPrediction(device)
        }));
        
        displayBatchResults(results);
        showToast("Batch analysis completed successfully!");
    } catch (error) {
        console.error('Batch prediction error:', error);
        showToast("Error running batch analysis", 'error');
    } finally {
        btn.disabled = false;
        btnText.textContent = 'Run XGBoost Analysis';
        spinner.classList.add('hidden');
    }
}

function displayBatchResults(results) {
    const resultsDiv = document.getElementById('batchResults');
    if (!resultsDiv) return;
    
    const table = document.createElement('table');
    table.className = 'results-table';
    
    table.innerHTML = `
        <thead>
            <tr>
                <th>Device</th>
                <th>Type</th>
                <th>Location</th>
                <th>Risk Level</th>
                <th>Confidence</th>
                <th>Key Factors</th>
            </tr>
        </thead>
        <tbody>
            ${results.map(result => `
                <tr onclick="showDeviceDetails(${JSON.stringify(result).replace(/"/g, '&quot;')}, ${JSON.stringify(result).replace(/"/g, '&quot;')})" style="cursor: pointer;">
                    <td>${result.deviceName}</td>
                    <td>${result.deviceType}</td>
                    <td>${result.location}</td>
                    <td>
                        <span class="status-dot ${result.prediction.toLowerCase()}"></span>
                        <span class="risk-${result.prediction.toLowerCase()}">${result.prediction}</span>
                    </td>
                    <td>${Math.round(result.confidence * 100)}%</td>
                    <td>${result.factors.slice(0, 2).join(', ')}</td>
                </tr>
            `).join('')}
        </tbody>
    `;
    
    resultsDiv.innerHTML = '';
    resultsDiv.appendChild(table);
}

// Inventory functions
function setupInventoryFilters() {
    const typeFilter = document.getElementById('typeFilter');
    const locationFilter = document.getElementById('locationFilter');
    
    if (typeFilter) {
        DEVICE_TYPES.forEach(type => {
            const option = document.createElement('option');
            option.value = type;
            option.textContent = type;
            typeFilter.appendChild(option);
        });
    }
    
    if (locationFilter) {
        LOCATIONS.forEach(location => {
            const option = document.createElement('option');
            option.value = location;
            option.textContent = location;
            locationFilter.appendChild(option);
        });
    }
}

function populateInventoryTable() {
    const tableDiv = document.getElementById('inventoryTable');
    if (!tableDiv) return;
    
    const table = document.createElement('table');
    table.className = 'results-table';
    
    table.innerHTML = `
        <thead>
            <tr>
                <th>ID</th>
                <th>Device Name</th>
                <th>Type</th>
                <th>Location</th>
                <th>Age (Years)</th>
                <th>Runtime (Hours)</th>
                <th>Temperature</th>
                <th>Status</th>
                <th>Last Update</th>
            </tr>
        </thead>
        <tbody id="inventoryBody">
            ${devices.map(device => `
                <tr>
                    <td>${device.id}</td>
                    <td>${device.deviceName}</td>
                    <td>${device.deviceType}</td>
                    <td>${device.location}</td>
                    <td>${device.deviceAge.toFixed(1)}</td>
                    <td>${Math.round(device.runtimeHours)}</td>
                    <td>${device.temperature.toFixed(1)}°C</td>
                    <td><span class="status--success">Live</span></td>
                    <td>${device.lastUpdate.toLocaleTimeString()}</td>
                </tr>
            `).join('')}
        </tbody>
    `;
    
    tableDiv.innerHTML = '';
    tableDiv.appendChild(table);
}

function filterInventory() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const typeFilter = document.getElementById('typeFilter').value;
    const locationFilter = document.getElementById('locationFilter').value;
    
    const filteredDevices = devices.filter(device => {
        const matchesSearch = device.deviceName.toLowerCase().includes(searchTerm) ||
                            device.deviceType.toLowerCase().includes(searchTerm);
        const matchesType = !typeFilter || device.deviceType === typeFilter;
        const matchesLocation = !locationFilter || device.location === locationFilter;
        
        return matchesSearch && matchesType && matchesLocation;
    });
    
    updateInventoryTable(filteredDevices);
}

function updateInventoryTable(filteredDevices) {
    const tbody = document.getElementById('inventoryBody');
    if (!tbody) return;
    
    tbody.innerHTML = filteredDevices.map(device => `
        <tr>
            <td>${device.id}</td>
            <td>${device.deviceName}</td>
            <td>${device.deviceType}</td>
            <td>${device.location}</td>
            <td>${device.deviceAge.toFixed(1)}</td>
            <td>${Math.round(device.runtimeHours)}</td>
            <td>${device.temperature.toFixed(1)}°C</td>
            <td><span class="status--success">Live</span></td>
            <td>${device.lastUpdate.toLocaleTimeString()}</td>
        </tr>
    `).join('');
}

// Device details modal
function showDeviceDetails(device, prediction) {
    const modal = document.getElementById('deviceModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');
    
    if (!modal || !modalTitle || !modalBody) return;
    
    modalTitle.textContent = `${device.deviceName} - Live Details`;
    
    modalBody.innerHTML = `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px;">
            <div>
                <h4>Device Information</h4>
                <div class="result-item">
                    <span class="result-label">Device Type:</span>
                    <span class="result-value">${device.deviceType}</span>
                </div>
                <div class="result-item">
                    <span class="result-label">Location:</span>
                    <span class="result-value">${device.location}</span>
                </div>
                <div class="result-item">
                    <span class="result-label">Device Age:</span>
                    <span class="result-value">${device.deviceAge.toFixed(1)} years</span>
                </div>
                <div class="result-item">
                    <span class="result-label">Total Repairs:</span>
                    <span class="result-value">${device.repairs}</span>
                </div>
                <div class="result-item">
                    <span class="result-label">Last Update:</span>
                    <span class="result-value">${device.lastUpdate.toLocaleString()}</span>
                </div>
            </div>
            <div>
                <h4>Live Parameters</h4>
                <div class="result-item">
                    <span class="result-label">Temperature:</span>
                    <span class="result-value">${device.temperature.toFixed(1)}°C</span>
                </div>
                <div class="result-item">
                    <span class="result-label">Vibration:</span>
                    <span class="result-value">${device.vibration.toFixed(2)}</span>
                </div>
                <div class="result-item">
                    <span class="result-label">Runtime Hours:</span>
                    <span class="result-value">${Math.round(device.runtimeHours)}</span>
                </div>
                <div class="result-item">
                    <span class="result-label">Error Logs:</span>
                    <span class="result-value">${device.errorLogs}</span>
                </div>
                <div class="result-item">
                    <span class="result-label">Pressure:</span>
                    <span class="result-value">${device.pressure.toFixed(1)} units</span>
                </div>
                <div class="result-item">
                    <span class="result-label">Current Draw:</span>
                    <span class="result-value">${device.currentDraw.toFixed(1)}A</span>
                </div>
            </div>
        </div>
        
        <div style="margin-top: 24px;">
            <h4>Live ML Prediction Analysis</h4>
            <div class="result-item">
                <span class="result-label">Risk Level:</span>
                <span class="result-value risk-${(device.prediction || 'Low').toLowerCase()}">${device.prediction || 'Low'} Risk</span>
            </div>
            <div class="result-item">
                <span class="result-label">Confidence Score:</span>
                <span class="result-value">${device.confidence ? Math.round(device.confidence * 100) : 0}%</span>
            </div>
            <div class="result-item">
                <span class="result-label">Risk Score:</span>
                <span class="result-value">${device.riskScore ? (device.riskScore * 100).toFixed(1) : 0}%</span>
            </div>
            ${device.factors ? `
                <div style="margin-top: 16px;">
                    <strong>Identified Risk Factors:</strong>
                    <ul style="margin: 8px 0; padding-left: 20px;">
                        ${device.factors.map(factor => `<li>${factor}</li>`).join('')}
                    </ul>
                </div>
            ` : ''}
            <div style="margin-top: 16px; font-size: 12px; color: var(--color-text-secondary);">
                Model: XGBoost v2.1.0 | Live Analysis | Updated: ${device.lastUpdate.toLocaleString()}
            </div>
        </div>
    `;
    
    modal.classList.remove('hidden');
}

function closeModal() {
    const modal = document.getElementById('deviceModal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

// Utility Functions
function toggleTheme() {
    currentTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-color-scheme', currentTheme);
    updateThemeIcon();
}

function updateThemeIcon() {
    const icon = document.getElementById('themeIcon');
    if (icon) {
        icon.textContent = currentTheme === 'light' ? '🌙' : '☀️';
    }
}

function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    
    if (!toast || !toastMessage) return;
    
    toastMessage.textContent = message;
    toast.className = `toast ${type}`;
    toast.classList.remove('hidden');
    
    setTimeout(() => {
        toast.classList.add('hidden');
    }, 3000);
}

function exportData() {
    const exportData = {
        devices: devices,
        alerts: alerts,
        streamingConfig: {
            isStreaming: isStreaming,
            updateInterval: updateInterval,
            updateCount: updateCount
        },
        timestamp: new Date().toISOString(),
        systemInfo: {
            totalDevices: devices.length,
            activeAlerts: alerts.length,
            criticalAlerts: alerts.filter(a => a.type === 'critical').length
        }
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `medical-devices-live-export-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    showToast("Live data exported successfully!");
}

// Error Handling
window.addEventListener('error', function(event) {
    console.error('Application error:', event.error);
    showToast("An unexpected error occurred. Please refresh the page.", 'error');
});

// Page visibility handling to pause/resume streaming
document.addEventListener('visibilitychange', function() {
    if (document.hidden && isStreaming) {
        console.log('Page hidden, streaming continues');
    } else if (!document.hidden && isStreaming) {
        console.log('Page visible, streaming active');
    }
});

console.log('Enhanced Medical Device Monitoring System with Live Streaming loaded successfully');
