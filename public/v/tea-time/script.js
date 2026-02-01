// =============================================================================
// TEA TEMPERATURE DYNAMICS - Two-Exponential Cooling Model
// =============================================================================

const APP_VERSION = "2.1.0";

// Tea presets: { temp: brewing temp, steep: steep time in minutes }
const teaPresets = {
  black: { temp: 95, steep: 4 },
  green: { temp: 80, steep: 2 },
  white: { temp: 75, steep: 3 },
  oolong: { temp: 90, steep: 3 },
  herbal: { temp: 100, steep: 5 },
  rooibos: { temp: 100, steep: 5 },
};

// Cup presets based on thermal properties
const cupPresets = {
  burleigh: {
    name: "Burleigh Blue Calico",
    A1: 14.0,
    k1: 0.35,
    A2: 56.0,
    k2: 0.022,
  },
  preheated: {
    name: "Pre-heated ceramic",
    A1: 2.0,
    k1: 0.5,
    A2: 68.0,
    k2: 0.025,
  },
  thin_ceramic: {
    name: "Thin ceramic / porcelain",
    A1: 8.0,
    k1: 0.6,
    A2: 62.0,
    k2: 0.028,
  },
  thick_ceramic: {
    name: "Thick stoneware mug",
    A1: 20.0,
    k1: 0.25,
    A2: 50.0,
    k2: 0.02,
  },
  glass: { name: "Glass cup", A1: 6.0, k1: 0.8, A2: 64.0, k2: 0.032 },
  insulated: {
    name: "Insulated / double-wall",
    A1: 1.0,
    k1: 0.3,
    A2: 69.0,
    k2: 0.008,
  },
  paper: { name: "Paper cup", A1: 4.0, k1: 1.0, A2: 66.0, k2: 0.04 },
};

// Model parameters (defaults: Burleigh Blue Calico)
const params = {
  roomTemp: 20,
  A1: 14.0,
  k1: 0.35,
  A2: 56.0,
  k2: 0.022,
  brewTemp: 95,
  steepTime: 4,
  drinkableTemp: 70, // Changed default to 70
  coldTemp: 50, // Changed default to 50
};

let chartData = [];
let markers = { addTea: 0, removeTea: 0, drinkable: 0 };
let currentTimeIndex = 0;
let overlayActive = false;
let equationDetailsOpen = false;
let logExpanded = false;

// Timer state: idle | countdown | running | confirm
let timerState = "idle";
let timerStartTime = null;
let timerInterval = null;
let timerElapsed = 0;
const COUNTDOWN_SECONDS = 5;
const CONFIRM_TIMEOUT_SECONDS = 5;
let confirmTimeoutId = null;

// Logging state
let measurementLog = "";
let currentSessionMeasurements = [];
let sessionActive = false;
let fittedParams = null;

// DOM elements
const mainCanvas = document.getElementById("tempChart");
const mainCtx = mainCanvas.getContext("2d");
const overlayCanvas = document.getElementById("overlayChart");
const overlayCtx = overlayCanvas.getContext("2d");

// =============================================================================
// TWO-EXPONENTIAL MODEL
// =============================================================================

function tempAtTime(t, p = params) {
  if (t < 0) t = 0;
  return p.roomTemp + p.A1 * Math.exp(-p.k1 * t) + p.A2 * Math.exp(-p.k2 * t);
}

function timeToTemp(T_target, p = params) {
  const T0 = tempAtTime(0, p);
  if (T_target >= T0) return 0;
  if (T_target <= p.roomTemp) return Infinity;

  let t = 5;
  for (let i = 0; i < 50; i++) {
    const T = tempAtTime(t, p);
    const dTdt =
      -p.k1 * p.A1 * Math.exp(-p.k1 * t) - p.k2 * p.A2 * Math.exp(-p.k2 * t);
    const error = T - T_target;
    if (Math.abs(error) < 0.01) break;
    t = t - error / dTdt;
    if (t < 0) t = 0.1;
    if (t > 200) return Infinity;
  }
  return t;
}

function ensureDrinkableAfterRemove() {
  // Calculate current times
  const addTeaTime = timeToTemp(params.brewTemp);
  const removeTeaTime = addTeaTime + params.steepTime;
  const drinkableTime = timeToTemp(params.drinkableTemp);

  // If drinkable comes before or at remove tea, lower drinkableTemp
  if (drinkableTime <= removeTeaTime) {
    // Find the temperature at removeTeaTime and set drinkable slightly below
    const tempAtRemove = tempAtTime(removeTeaTime);
    // Set drinkable temp to 1 degree below the temp at remove time
    // but not below coldTemp + 5
    const newDrinkable = Math.max(
      params.coldTemp + 5,
      Math.min(75, Math.floor(tempAtRemove - 1))
    );
    
    if (newDrinkable !== params.drinkableTemp) {
      params.drinkableTemp = newDrinkable;
      document.getElementById("drinkableTemp").value = newDrinkable;
      updateDrinkingZoneSlider();
    }
  }
}

function calculateCurve() {
  chartData = [];

  // Ensure drinkable comes after remove tea
  ensureDrinkableAfterRemove();

  const addTeaTime = timeToTemp(params.brewTemp);
  const removeTeaTime = addTeaTime + params.steepTime;
  const drinkableTime = timeToTemp(params.drinkableTemp);
  const coldTime = timeToTemp(params.coldTemp);

  markers = {
    addTea: addTeaTime,
    removeTea: removeTeaTime,
    drinkable: drinkableTime,
  };

  // Calculate dynamic maxTime: 5 minutes after coldTemp is reached
  const maxTime = Math.min(
    60,
    Math.max(30, isFinite(coldTime) ? coldTime + 5 : 30)
  );

  for (let t = 0; t <= maxTime; t += 0.05) {
    const temp = tempAtTime(t);
    let phase;
    if (t < addTeaTime) phase = "cooling-pre";
    else if (t < removeTeaTime) phase = "steeping";
    else if (temp > params.drinkableTemp) phase = "cooling";
    else if (temp > params.coldTemp) phase = "drinkable";
    else phase = "cold";
    chartData.push({ time: t, temp, phase });
  }
  return chartData;
}

function formatTime(minutes) {
  if (minutes === Infinity || isNaN(minutes)) return "--";
  const negative = minutes < 0;
  const absMinutes = Math.abs(minutes);
  const mins = Math.floor(absMinutes);
  const secs = Math.round((absMinutes - mins) * 60);
  const timeStr = `${mins}:${secs.toString().padStart(2, "0")}`;
  return negative ? `-${timeStr}` : timeStr;
}

function formatSteepTime(minutes) {
  if (minutes === Math.floor(minutes)) return `${minutes} min`;
  const mins = Math.floor(minutes);
  const secs = (minutes - mins) * 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

// =============================================================================
// CHART DRAWING
// =============================================================================

function drawChart(canvas, ctx, compact = false, timerTimeMinutes = null) {
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);

  const width = rect.width;
  const height = rect.height;
  const padding = compact
    ? { top: 15, right: 15, bottom: 25, left: 40 }
    : { top: 20, right: 20, bottom: 35, left: 45 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  ctx.clearRect(0, 0, width, height);

  // Dynamic axes based on coldTemp
  const coldTime = timeToTemp(params.coldTemp);
  const maxTime = Math.min(
    60,
    Math.max(30, isFinite(coldTime) ? coldTime + 5 : 30)
  );
  const minTemp = params.coldTemp - 5;
  const maxTemp = 105;

  const xScale = (t) => padding.left + (t / maxTime) * chartWidth;
  const yScale = (temp) =>
    padding.top +
    chartHeight -
    ((temp - minTemp) / (maxTemp - minTemp)) * chartHeight;

  // Grid
  ctx.strokeStyle = "#3a3328";
  ctx.lineWidth = 1;
  for (
    let temp = Math.ceil(minTemp / 10) * 10;
    temp <= maxTemp;
    temp += 10
  ) {
    ctx.beginPath();
    ctx.moveTo(padding.left, yScale(temp));
    ctx.lineTo(width - padding.right, yScale(temp));
    ctx.stroke();
  }
  const xStep = maxTime <= 30 ? 5 : 10;
  for (let t = 0; t <= maxTime; t += xStep) {
    ctx.beginPath();
    ctx.moveTo(xScale(t), padding.top);
    ctx.lineTo(xScale(t), height - padding.bottom);
    ctx.stroke();
  }

  // Zones
  ctx.fillStyle = "rgba(122, 111, 130, 0.12)";
  ctx.fillRect(
    padding.left,
    yScale(params.coldTemp),
    chartWidth,
    height - padding.bottom - yScale(params.coldTemp)
  );
  ctx.fillStyle = "rgba(107, 154, 196, 0.15)";
  ctx.fillRect(
    padding.left,
    yScale(params.drinkableTemp),
    chartWidth,
    yScale(params.coldTemp) - yScale(params.drinkableTemp)
  );

  // Threshold lines
  ctx.setLineDash([4, 4]);
  ctx.strokeStyle = "rgba(107, 154, 196, 0.5)";
  ctx.beginPath();
  ctx.moveTo(padding.left, yScale(params.drinkableTemp));
  ctx.lineTo(width - padding.right, yScale(params.drinkableTemp));
  ctx.stroke();
  ctx.strokeStyle = "rgba(122, 111, 130, 0.5)";
  ctx.beginPath();
  ctx.moveTo(padding.left, yScale(params.coldTemp));
  ctx.lineTo(width - padding.right, yScale(params.coldTemp));
  ctx.stroke();
  ctx.setLineDash([]);

  // Vertical markers
  const drawMarker = (time, color, label) => {
    if (time <= 0 || time >= maxTime) return;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 3]);
    ctx.beginPath();
    ctx.moveTo(xScale(time), padding.top);
    ctx.lineTo(xScale(time), height - padding.bottom);
    ctx.stroke();
    ctx.setLineDash([]);
    if (!compact) {
      ctx.fillStyle = color;
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.textAlign = "center";
      ctx.fillText(label, xScale(time), padding.top - 5);
    }
  };

  if (markers.addTea > 0) drawMarker(markers.addTea, "#d4a574", "ADD");
  drawMarker(markers.removeTea, "#c45c3a", "REMOVE");
  if (markers.drinkable && markers.drinkable < maxTime)
    drawMarker(markers.drinkable, "#6b9ac4", "DRINK");

  // Temperature curve
  const phases = {
    "cooling-pre": "#5b8a72",
    steeping: "#d4a574",
    cooling: "#5b8a72",
    drinkable: "#6b9ac4",
    cold: "#7a6f82",
  };
  ctx.lineWidth = 2.5;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  let currentPhase = null;
  ctx.beginPath();
  chartData.forEach((point, i) => {
    if (point.time > maxTime) return;
    const x = xScale(point.time);
    const y = yScale(point.temp);
    if (i === 0) {
      ctx.moveTo(x, y);
      currentPhase = point.phase;
    } else {
      if (point.phase !== currentPhase) {
        ctx.strokeStyle = phases[currentPhase];
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(
          xScale(chartData[i - 1].time),
          yScale(chartData[i - 1].temp)
        );
        currentPhase = point.phase;
      }
      ctx.lineTo(x, y);
    }
  });
  ctx.strokeStyle = phases[currentPhase];
  ctx.stroke();

  // Timer position
  if (
    timerTimeMinutes !== null &&
    timerTimeMinutes >= 0 &&
    timerTimeMinutes <= maxTime
  ) {
    const timerTemp = tempAtTime(timerTimeMinutes);
    const x = xScale(timerTimeMinutes);
    const y = yScale(timerTemp);

    ctx.strokeStyle = "rgba(232, 224, 213, 0.3)";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(x, padding.top);
    ctx.lineTo(x, height - padding.bottom);
    ctx.stroke();

    ctx.strokeStyle = "#e8e0d5";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x, padding.top);
    ctx.lineTo(x, height - padding.bottom);
    ctx.stroke();

    let pointPhase = "cooling";
    if (timerTimeMinutes < markers.addTea) pointPhase = "cooling-pre";
    else if (timerTimeMinutes < markers.removeTea) pointPhase = "steeping";
    else if (timerTemp <= params.coldTemp) pointPhase = "cold";
    else if (timerTemp <= params.drinkableTemp) pointPhase = "drinkable";

    ctx.fillStyle = "#e8e0d5";
    ctx.beginPath();
    ctx.arc(x, y, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = phases[pointPhase] || "#d4a574";
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fill();
  } else if (
    currentTimeIndex >= 0 &&
    currentTimeIndex < chartData.length &&
    timerState === "idle"
  ) {
    const point = chartData[currentTimeIndex];
    const x = xScale(point.time);
    const y = yScale(point.temp);

    ctx.strokeStyle = "#e8e0d5";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(x, padding.top);
    ctx.lineTo(x, height - padding.bottom);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = "#e8e0d5";
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = phases[point.phase] || "#5b8a72";
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  // Axes labels
  ctx.fillStyle = "#9a8f80";
  ctx.font = compact
    ? '9px "JetBrains Mono", monospace'
    : '11px "JetBrains Mono", monospace';
  ctx.textAlign = "center";
  const labelXStep = compact ? Math.max(10, xStep) : xStep;
  for (let t = 0; t <= maxTime; t += labelXStep) {
    ctx.fillText(
      `${t}m`,
      xScale(t),
      height - padding.bottom + (compact ? 15 : 20)
    );
  }
  ctx.textAlign = "right";
  for (
    let temp = Math.ceil(minTemp / 10) * 10;
    temp <= maxTemp;
    temp += 20
  ) {
    ctx.fillText(`${temp}°`, padding.left - 8, yScale(temp) + 4);
  }
}

// =============================================================================
// UI UPDATES
// =============================================================================

function updateMarkers(timerMinutes = null) {
  const isRunning = timerState === "running" || timerState === "confirm";
  if (isRunning && timerMinutes !== null && timerMinutes >= 0) {
    const addRemaining = markers.addTea - timerMinutes;
    const removeRemaining = markers.removeTea - timerMinutes;
    const drinkRemaining = markers.drinkable
      ? markers.drinkable - timerMinutes
      : null;

    document.getElementById("addTeaLabel").textContent =
      addRemaining > 0 ? "Add Tea In" : "Tea Added";
    document.getElementById("addTeaTime").textContent =
      addRemaining > 0 ? formatTime(addRemaining) : "✓";
    document
      .getElementById("addTeaTime")
      .classList.toggle("done", addRemaining <= 0);

    document.getElementById("removeTeaLabel").textContent =
      removeRemaining > 0 ? "Remove Tea In" : "Tea Removed";
    document.getElementById("removeTeaTime").textContent =
      removeRemaining > 0 ? formatTime(removeRemaining) : "✓";
    document
      .getElementById("removeTeaTime")
      .classList.toggle("done", removeRemaining <= 0);

    if (drinkRemaining !== null && drinkRemaining > 0) {
      document.getElementById("drinkableLabel").textContent = "Drinkable In";
      document.getElementById("drinkableTime").textContent =
        formatTime(drinkRemaining);
      document.getElementById("drinkableTime").classList.remove("done");
    } else if (drinkRemaining !== null) {
      document.getElementById("drinkableLabel").textContent = "Drinkable";
      document.getElementById("drinkableTime").textContent = "✓ Now";
      document.getElementById("drinkableTime").classList.add("done");
    }
  } else {
    document.getElementById("addTeaLabel").textContent = "Add Tea At";
    document.getElementById("addTeaTime").textContent = formatTime(
      markers.addTea
    );
    document.getElementById("addTeaTime").classList.remove("done");
    document.getElementById("removeTeaLabel").textContent = "Remove Tea At";
    document.getElementById("removeTeaTime").textContent = formatTime(
      markers.removeTea
    );
    document.getElementById("removeTeaTime").classList.remove("done");
    document.getElementById("drinkableLabel").textContent = "Drinkable At";
    document.getElementById("drinkableTime").textContent = markers.drinkable
      ? formatTime(markers.drinkable)
      : "--";
    document.getElementById("drinkableTime").classList.remove("done");
  }
}

function updateEquation() {
  const tau1 = 1 / params.k1;
  const tau2 = 1 / params.k2;
  const T0 = params.roomTemp + params.A1 + params.A2;

  document.getElementById("eqTambMain").textContent = params.roomTemp;
  document.getElementById("eqA1Main").textContent = params.A1.toFixed(1);
  document.getElementById("eqK1Main").textContent = params.k1.toFixed(3);
  document.getElementById("eqA2Main").textContent = params.A2.toFixed(1);
  document.getElementById("eqK2Main").textContent = params.k2.toFixed(3);

  document.getElementById("eqTamb").textContent = params.roomTemp;
  document.getElementById("eqA1").textContent = params.A1.toFixed(1);
  document.getElementById("eqK1").textContent = params.k1.toFixed(3);
  document.getElementById("eqTau1").textContent = tau1.toFixed(1);
  document.getElementById("eqA2").textContent = params.A2.toFixed(1);
  document.getElementById("eqK2").textContent = params.k2.toFixed(3);
  document.getElementById("eqTau2").textContent = tau2.toFixed(1);
  document.getElementById("eqT0calc").textContent = T0.toFixed(1);
}

function updateHowTo() {
  document.getElementById("howtoBrewTemp").textContent = params.brewTemp + "°C";
  document.getElementById("howtoSteepTime").textContent = formatSteepTime(
    params.steepTime
  );
  document.getElementById("howtoDrinkTemp").textContent =
    params.drinkableTemp + "°C";
}

function updateSliderDisplays() {
  document.getElementById("A1Value").textContent = params.A1.toFixed(1) + "°C";
  document.getElementById("k1Value").textContent =
    params.k1.toFixed(3) + " min⁻¹";
  document.getElementById("A2Value").textContent = params.A2.toFixed(1) + "°C";
  document.getElementById("k2Value").textContent =
    params.k2.toFixed(3) + " min⁻¹";
}

function updateDrinkingZoneSlider() {
  const cold = params.coldTemp;
  const drinkable = params.drinkableTemp;
  const min = 42;
  const max = 75;
  const range = max - min;

  const leftPercent = ((cold - min) / range) * 100;
  const rightPercent = ((drinkable - min) / range) * 100;

  const track = document.getElementById("drinkingZoneTrack");
  track.style.left = leftPercent + "%";
  track.style.width = (rightPercent - leftPercent) + "%";

  document.getElementById("coldTempValue").textContent = cold + "°C";
  document.getElementById("drinkableTempValue").textContent = drinkable + "°C";
}

function updateTimerContext() {
  document.getElementById("timerTeaType").textContent = getTeaPresetName();
  document.getElementById("timerCupType").textContent = getCupPresetName();
}

// =============================================================================
// MODEL FITTING FROM MEASUREMENTS
// =============================================================================

function fitTwoExponential(measurements) {
  // Need at least 3 valid (non-undone) measurements
  const valid = measurements.filter((m) => !m.undone);
  if (valid.length < 3) return null;

  // Simple curve fitting using Levenberg-Marquardt-like approach
  // For a robust fit we'd use a proper optimizer, but this gives reasonable results

  // Initial guess based on current params
  let p = {
    roomTemp: params.roomTemp,
    A1: params.A1,
    k1: params.k1,
    A2: params.A2,
    k2: params.k2,
  };

  // Compute RMSE
  const rmse = (p) => {
    let sum = 0;
    valid.forEach((m) => {
      const predicted = tempAtTime(m.time, p);
      sum += Math.pow(m.measured - predicted, 2);
    });
    return Math.sqrt(sum / valid.length);
  };

  // Simple gradient descent on A1, A2 (keep k1, k2 from current params for stability)
  // More sophisticated fitting would adjust all params
  const step = 0.5;
  for (let iter = 0; iter < 50; iter++) {
    const baseRmse = rmse(p);

    // Try adjusting A1
    const pA1up = { ...p, A1: p.A1 + step };
    const pA1down = { ...p, A1: Math.max(0, p.A1 - step) };
    if (rmse(pA1up) < baseRmse) p.A1 += step;
    else if (rmse(pA1down) < baseRmse) p.A1 = Math.max(0, p.A1 - step);

    // Try adjusting A2
    const pA2up = { ...p, A2: p.A2 + step };
    const pA2down = { ...p, A2: Math.max(0, p.A2 - step) };
    if (rmse(pA2up) < baseRmse) p.A2 += step;
    else if (rmse(pA2down) < baseRmse) p.A2 = Math.max(0, p.A2 - step);
  }

  return {
    T_amb: p.roomTemp,
    A1: p.A1,
    k1: p.k1,
    A2: p.A2,
    k2: p.k2,
    rmse: rmse(p),
  };
}

function updateLiveParams() {
  const valid = currentSessionMeasurements.filter((m) => !m.undone);

  if (valid.length < 3) {
    document.getElementById("liveParamsInsufficient").style.display = "block";
    document.getElementById("liveParamsContent").style.display = "none";
    fittedParams = null;
    return;
  }

  fittedParams = fitTwoExponential(currentSessionMeasurements);

  if (fittedParams) {
    document.getElementById("liveParamsInsufficient").style.display = "none";
    document.getElementById("liveParamsContent").style.display = "block";
    document.getElementById("liveParamTamb").textContent =
      fittedParams.T_amb + "°C";
    document.getElementById("liveParamA1").textContent =
      fittedParams.A1.toFixed(1) + "°C";
    document.getElementById("liveParamK1").textContent =
      fittedParams.k1.toFixed(3) + " min⁻¹";
    document.getElementById("liveParamA2").textContent =
      fittedParams.A2.toFixed(1) + "°C";
    document.getElementById("liveParamK2").textContent =
      fittedParams.k2.toFixed(3) + " min⁻¹";
    document.getElementById("liveParamRMSE").textContent =
      fittedParams.rmse.toFixed(2) + "°C";
  }
}

// =============================================================================
// LOGGING SYSTEM
// =============================================================================

function getCupPresetName() {
  const select = document.getElementById("cupPreset");
  return cupPresets[select.value]?.name || "Custom";
}

function getTeaPresetName() {
  const select = document.getElementById("teaType");
  return select.options[select.selectedIndex].text;
}

function startNewLogSession() {
  const now = new Date();
  const sessionHeader = `
# ============================================================
# Tea Cooling Measurement Session
# ============================================================

session:
  app_version: "${APP_VERSION}"
  started_at: "${now.toISOString()}"
  
model_parameters:
  T_amb: ${params.roomTemp}
  A1: ${params.A1}
  k1: ${params.k1}
  A2: ${params.A2}
  k2: ${params.k2}
  
brew_settings:
  tea_type: "${getTeaPresetName()}"
  brew_temp: ${params.brewTemp}
  steep_time: ${params.steepTime}
  drinkable_temp: ${params.drinkableTemp}
  cold_temp: ${params.coldTemp}
  
cup_preset: "${getCupPresetName()}"

readings:
  # time_min, measured_temp_c, predicted_temp_c, status
`;
  measurementLog += sessionHeader;
  currentSessionMeasurements = [];
  sessionActive = true;
  fittedParams = null;
  updateLogDisplay();
  updateLiveParams();
}

function logTemperature() {
  if (!sessionActive || timerState !== "running" || timerElapsed < 0) return;

  const minutes = timerElapsed / 60;
  const slider = document.getElementById("measuredTemp");
  const measuredTemp = parseFloat(slider.value);
  const predictedTemp = tempAtTime(minutes);

  currentSessionMeasurements.push({
    time: minutes,
    measured: measuredTemp,
    predicted: predictedTemp,
    undone: false,
  });
  measurementLog += `  - [${minutes.toFixed(2)}, ${measuredTemp.toFixed(1)}, ${predictedTemp.toFixed(1)}, "ok"]\n`;

  // Visual feedback
  const btn = document.getElementById("logTempBtn");
  btn.classList.add("flash");
  setTimeout(() => btn.classList.remove("flash"), 200);

  // Decrease slider by 1°C for next measurement
  const newVal = Math.max(30, measuredTemp - 1);
  slider.value = newVal;
  document.getElementById("measuredTempValue").textContent =
    `${newVal.toFixed(0)}°C`;

  updateLogDisplay();
  updateUndoButton();
  updateLiveParams();
}

function undoLastLog() {
  if (currentSessionMeasurements.length === 0) return;
  let lastIndex = -1;
  for (let i = currentSessionMeasurements.length - 1; i >= 0; i--) {
    if (!currentSessionMeasurements[i].undone) {
      lastIndex = i;
      break;
    }
  }
  if (lastIndex === -1) return;

  const lastEntry = currentSessionMeasurements[lastIndex];
  lastEntry.undone = true;
  measurementLog += `  - [${lastEntry.time.toFixed(2)}, ${lastEntry.measured.toFixed(1)}, ${lastEntry.predicted.toFixed(1)}, "undone"]\n`;
  updateLogDisplay();
  updateUndoButton();
  updateLiveParams();
}

function updateLogDisplay() {
  const textarea = document.getElementById("measurementLog");
  textarea.value = measurementLog;
  textarea.scrollTop = textarea.scrollHeight;
}

function updateUndoButton() {
  const btn = document.getElementById("undoLogBtn");
  const hasUndoable = currentSessionMeasurements.some((m) => !m.undone);
  btn.disabled = !hasUndoable || timerState !== "running";
}

function updateLogButtons() {
  document.getElementById("logTempBtn").disabled =
    timerState !== "running" || timerElapsed < 0;
  updateUndoButton();
}

function copyLog() {
  const textarea = document.getElementById("measurementLog");
  navigator.clipboard.writeText(textarea.value).then(() => {
    const btn = document.getElementById("copyLogBtn");
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-check"></i> Copied';
    setTimeout(() => (btn.innerHTML = originalText), 1500);
  });
}

function logFittedParamsOnStop() {
  if (!fittedParams) return;

  measurementLog += `
# ============================================================
# Fitted Parameters (from session measurements)
# ============================================================
fitted_parameters:
  T_amb: ${fittedParams.T_amb}
  A1: ${fittedParams.A1.toFixed(2)}
  k1: ${fittedParams.k1.toFixed(4)}
  A2: ${fittedParams.A2.toFixed(2)}
  k2: ${fittedParams.k2.toFixed(4)}
  rmse: ${fittedParams.rmse.toFixed(3)}
`;
  updateLogDisplay();
}

function toggleLogExpanded() {
  logExpanded = !logExpanded;
  document.getElementById("logContent").classList.toggle("open", logExpanded);
  document.getElementById("logToggleIcon").classList.toggle("open", logExpanded);
}

// =============================================================================
// TIMER - Simple state machine: idle -> countdown -> running <-> confirm -> idle
// =============================================================================

function updateTimerButton() {
  const btn = document.getElementById("timerStartBtn");
  const labels = {
    idle: "Start",
    countdown: "...",
    running: "Stop",
    confirm: "Confirm",
  };
  btn.textContent = labels[timerState];
  btn.disabled = timerState === "countdown";
  btn.classList.toggle("danger", timerState === "confirm");
}

function handleTimerClick() {
  switch (timerState) {
    case "idle":
      startTimer();
      break;
    case "running":
      timerState = "confirm";
      updateTimerButton();
      startConfirmTimeout();
      break;
    case "confirm":
      clearConfirmTimeout();
      stopTimer();
      break;
  }
}

function startConfirmTimeout() {
  confirmTimeoutId = setTimeout(() => {
    if (timerState === "confirm") {
      timerState = "running";
      updateTimerButton();
    }
  }, CONFIRM_TIMEOUT_SECONDS * 1000);
}

function clearConfirmTimeout() {
  if (confirmTimeoutId) {
    clearTimeout(confirmTimeoutId);
    confirmTimeoutId = null;
  }
}

function startTimer() {
  timerState = "countdown";
  timerElapsed = -COUNTDOWN_SECONDS;
  timerStartTime = Date.now() + COUNTDOWN_SECONDS * 1000;
  startNewLogSession();
  updateTimerButton();
  timerInterval = setInterval(updateTimer, 100);
}

function stopTimer() {
  clearInterval(timerInterval);
  clearConfirmTimeout();

  // Log fitted params before ending session
  logFittedParamsOnStop();

  timerState = "idle";
  timerElapsed = 0;
  timerStartTime = null;
  sessionActive = false;
  currentSessionMeasurements = [];
  fittedParams = null;

  document.getElementById("timerDisplay").textContent = "0:00";
  document.getElementById("timerDisplay").classList.remove("countdown");
  document.getElementById("timerPhase").textContent = "Ready to start";
  document.getElementById("timerInstruction").textContent =
    "Press Start to begin countdown";
  document
    .getElementById("timerInstruction")
    .classList.remove("countdown-instruction");

  updateTimerButton();
  updateMarkers(null);
  updateLogButtons();
  updateLiveParams();
  drawChart(mainCanvas, mainCtx, false, null);
  if (overlayActive) drawChart(overlayCanvas, overlayCtx, true, null);
}

function updateTimer() {
  timerElapsed = (Date.now() - timerStartTime) / 1000;
  const minutes = timerElapsed / 60;

  const timerDisplay = document.getElementById("timerDisplay");
  const timerPhase = document.getElementById("timerPhase");
  const timerInstruction = document.getElementById("timerInstruction");

  // Countdown phase
  if (timerElapsed < 0) {
    const secondsLeft = Math.ceil(-timerElapsed);
    timerDisplay.textContent = secondsLeft.toString();
    timerDisplay.classList.add("countdown");
    timerPhase.textContent = secondsLeft === 1 ? "Get ready..." : "Countdown";
    timerInstruction.textContent =
      secondsLeft === 1
        ? "🫖 POUR NOW!"
        : `Pour boiling water into room temperature cup in ${secondsLeft}...`;
    timerInstruction.classList.add("countdown-instruction");
    updateLogButtons();
    return;
  }

  // Transition from countdown to running
  if (timerState === "countdown") {
    timerState = "running";
    timerDisplay.classList.remove("countdown");
    timerInstruction.classList.remove("countdown-instruction");
    updateTimerButton();
  }

  // Normal timer display
  const mins = Math.floor(minutes);
  const secs = Math.floor(timerElapsed % 60);
  timerDisplay.textContent = `${mins}:${secs.toString().padStart(2, "0")}`;

  const currentTemp = tempAtTime(minutes);
  let phase, instruction;

  if (minutes < markers.addTea) {
    const timeToAdd = markers.addTea - minutes;
    phase = `Cooling... ${currentTemp.toFixed(1)}°C`;
    instruction =
      timeToAdd < 0.5
        ? "⏰ Almost time to add tea!"
        : `Add tea in ${formatTime(timeToAdd)}`;
  } else if (minutes < markers.removeTea) {
    const timeToRemove = markers.removeTea - minutes;
    phase = `Steeping... ${currentTemp.toFixed(1)}°C`;
    instruction =
      timeToRemove < 0.5
        ? "⏰ Almost done steeping!"
        : `Remove tea in ${formatTime(timeToRemove)}`;
  } else if (currentTemp > params.drinkableTemp) {
    const timeToDrink = markers.drinkable ? markers.drinkable - minutes : null;
    phase = `Cooling... ${currentTemp.toFixed(1)}°C`;
    if (timeToDrink !== null && timeToDrink < 0.5 && timeToDrink > 0)
      instruction = "⏰ Almost drinkable!";
    else if (timeToDrink !== null && timeToDrink > 0)
      instruction = `Drinkable in ${formatTime(timeToDrink)}`;
    else instruction = "Should be drinkable soon";
  } else if (currentTemp > params.coldTemp) {
    phase = `✓ Ready! ${currentTemp.toFixed(1)}°C`;
    instruction = "Enjoy your tea!";
  } else {
    phase = `Cold: ${currentTemp.toFixed(1)}°C`;
    instruction = "Tea is getting cold";
  }

  timerPhase.textContent = phase;
  timerInstruction.textContent = instruction;

  updateMarkers(minutes);
  updateLogButtons();
  drawChart(mainCanvas, mainCtx, false, minutes);
  if (overlayActive) drawChart(overlayCanvas, overlayCtx, true, minutes);
}

// =============================================================================
// MAIN UPDATE
// =============================================================================

function update() {
  calculateCurve();
  const timerMinutes =
    (timerState === "running" || timerState === "confirm") && timerElapsed >= 0
      ? timerElapsed / 60
      : null;
  drawChart(mainCanvas, mainCtx, false, timerMinutes);
  if (overlayActive) drawChart(overlayCanvas, overlayCtx, true, timerMinutes);
  updateMarkers(timerMinutes);
  updateEquation();
  updateHowTo();
  updateSliderDisplays();
  updateDrinkingZoneSlider();
  updateTimerContext();
  document.getElementById("timeScrubber").max = chartData.length - 1;
}

function toggleOverlay() {
  overlayActive = !overlayActive;
  const overlay = document.getElementById("chartOverlay");
  const toggle = document.getElementById("stickyToggle");
  const toggleText = document.getElementById("toggleText");

  if (overlayActive) {
    overlay.classList.add("visible");
    toggle.classList.add("active");
    toggleText.textContent = "Unpin";
    document.body.classList.add("overlay-active");
    const timerMinutes =
      (timerState === "running" || timerState === "confirm") &&
      timerElapsed >= 0
        ? timerElapsed / 60
        : null;
    drawChart(overlayCanvas, overlayCtx, true, timerMinutes);
  } else {
    overlay.classList.remove("visible");
    toggle.classList.remove("active");
    toggleText.textContent = "Pin Graph";
    document.body.classList.remove("overlay-active");
  }
}

function toggleEquationDetails() {
  equationDetailsOpen = !equationDetailsOpen;
  document
    .getElementById("equationDetails")
    .classList.toggle("open", equationDetailsOpen);
  document
    .getElementById("equationToggleIcon")
    .classList.toggle("open", equationDetailsOpen);
}

function applyCupPreset(presetName) {
  const preset = cupPresets[presetName];
  if (preset) {
    params.A1 = preset.A1;
    params.k1 = preset.k1;
    params.A2 = preset.A2;
    params.k2 = preset.k2;
    document.getElementById("A1Slider").value = preset.A1;
    document.getElementById("k1Slider").value = preset.k1;
    document.getElementById("A2Slider").value = preset.A2;
    document.getElementById("k2Slider").value = preset.k2;
  }
}

// =============================================================================
// EVENT LISTENERS
// =============================================================================

document.getElementById("stickyToggle").addEventListener("click", toggleOverlay);
document.getElementById("equationToggle").addEventListener("click", toggleEquationDetails);
document.getElementById("timerStartBtn").addEventListener("click", handleTimerClick);
document.getElementById("logToggle").addEventListener("click", toggleLogExpanded);

document.getElementById("measuredTemp").addEventListener("input", (e) => {
  document.getElementById("measuredTempValue").textContent =
    `${parseFloat(e.target.value).toFixed(0)}°C`;
});

document.getElementById("logTempBtn").addEventListener("click", logTemperature);
document.getElementById("undoLogBtn").addEventListener("click", undoLastLog);
document.getElementById("copyLogBtn").addEventListener("click", copyLog);

document.getElementById("teaType").addEventListener("change", (e) => {
  const preset = teaPresets[e.target.value];
  if (preset) {
    params.brewTemp = preset.temp;
    params.steepTime = preset.steep;
    document.getElementById("brewTemp").value = preset.temp;
    document.getElementById("steepTime").value = preset.steep;
    document.getElementById("brewTempValue").textContent = `${preset.temp}°C`;
    document.getElementById("steepTimeValue").textContent = formatSteepTime(
      preset.steep
    );
  }
  update();
});

document.getElementById("brewTemp").addEventListener("input", (e) => {
  params.brewTemp = parseInt(e.target.value);
  document.getElementById("brewTempValue").textContent = `${params.brewTemp}°C`;
  document.getElementById("teaType").value = "custom";
  update();
});

document.getElementById("steepTime").addEventListener("input", (e) => {
  params.steepTime = parseFloat(e.target.value);
  document.getElementById("steepTimeValue").textContent = formatSteepTime(
    params.steepTime
  );
  document.getElementById("teaType").value = "custom";
  update();
});

document.getElementById("roomTemp").addEventListener("input", (e) => {
  params.roomTemp = parseInt(e.target.value);
  document.getElementById("roomTempValue").textContent = `${params.roomTemp}°C`;
  update();
});

document.getElementById("cupPreset").addEventListener("change", (e) => {
  applyCupPreset(e.target.value);
  update();
});

document.getElementById("A1Slider").addEventListener("input", (e) => {
  params.A1 = parseFloat(e.target.value);
  document.getElementById("cupPreset").value = "custom";
  update();
});

document.getElementById("k1Slider").addEventListener("input", (e) => {
  params.k1 = parseFloat(e.target.value);
  document.getElementById("cupPreset").value = "custom";
  update();
});

document.getElementById("A2Slider").addEventListener("input", (e) => {
  params.A2 = parseFloat(e.target.value);
  document.getElementById("cupPreset").value = "custom";
  update();
});

document.getElementById("k2Slider").addEventListener("input", (e) => {
  params.k2 = parseFloat(e.target.value);
  document.getElementById("cupPreset").value = "custom";
  update();
});

// Dual-handle drinking zone slider
const coldTempSlider = document.getElementById("coldTemp");
const drinkableTempSlider = document.getElementById("drinkableTemp");

coldTempSlider.addEventListener("input", (e) => {
  let cold = parseInt(e.target.value);
  let drinkable = params.drinkableTemp;

  // Ensure cold < drinkable with min gap of 5
  if (cold >= drinkable - 5) {
    cold = drinkable - 5;
    e.target.value = cold;
  }

  params.coldTemp = cold;
  update();
});

drinkableTempSlider.addEventListener("input", (e) => {
  let drinkable = parseInt(e.target.value);
  let cold = params.coldTemp;

  // Ensure drinkable > cold with min gap of 5
  if (drinkable <= cold + 5) {
    drinkable = cold + 5;
    e.target.value = drinkable;
  }

  params.drinkableTemp = drinkable;
  update();
});

document.getElementById("timeScrubber").addEventListener("input", (e) => {
  if (timerState === "idle") {
    currentTimeIndex = parseInt(e.target.value);
    drawChart(mainCanvas, mainCtx, false, null);
    if (overlayActive) drawChart(overlayCanvas, overlayCtx, true, null);
    if (currentTimeIndex >= 0 && currentTimeIndex < chartData.length) {
      document.getElementById("timeDisplay").textContent = formatTime(
        chartData[currentTimeIndex].time
      );
    }
  }
});

document.querySelectorAll(".tab-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document
      .querySelectorAll(".tab-btn")
      .forEach((b) => b.classList.remove("active"));
    document
      .querySelectorAll(".tab-content")
      .forEach((c) => c.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById(`tab-${btn.dataset.tab}`).classList.add("active");
  });
});

window.addEventListener("resize", () => {
  const timerMinutes =
    (timerState === "running" || timerState === "confirm") && timerElapsed >= 0
      ? timerElapsed / 60
      : null;
  drawChart(mainCanvas, mainCtx, false, timerMinutes);
  if (overlayActive) drawChart(overlayCanvas, overlayCtx, true, timerMinutes);
});

// Initialize
update();
