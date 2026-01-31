// =============================================================================
// TEA TEMPERATURE DYNAMICS - Two-Exponential Cooling Model
// Version 2.1.0
// T(t) = T_amb + A1*exp(-k1*t) + A2*exp(-k2*t)
// =============================================================================

const APP_VERSION = "2.1.0";

// Tea presets
const teaPresets = {
  black: { temp: 95, steep: 4 },
  green: { temp: 80, steep: 2 },
  white: { temp: 75, steep: 3 },
  oolong: { temp: 90, steep: 3 },
  herbal: { temp: 100, steep: 5 },
  rooibos: { temp: 100, steep: 5 },
  custom: null,
};

// Cup presets: [A1, k1, A2, k2] - burleigh updated from measurements
const cupPresets = {
  burleigh: {
    A1: 14.0,
    k1: 0.35,
    A2: 56.0,
    k2: 0.022,
    name: "Burleigh Blue Calico",
  },
  preheated: {
    A1: 0,
    k1: 0.22,
    A2: 80.0,
    k2: 0.025,
    name: "Pre-heated ceramic",
  },
  thin_ceramic: { A1: 12.0, k1: 0.3, A2: 58.0, k2: 0.03, name: "Thin ceramic" },
  thick_ceramic: {
    A1: 22.0,
    k1: 0.15,
    A2: 48.0,
    k2: 0.022,
    name: "Thick stoneware",
  },
  glass: { A1: 8.0, k1: 0.4, A2: 62.0, k2: 0.032, name: "Glass" },
  insulated: { A1: 2.0, k1: 0.1, A2: 78.0, k2: 0.008, name: "Insulated" },
  paper: { A1: 5.0, k1: 0.5, A2: 65.0, k2: 0.038, name: "Paper cup" },
  custom: null,
};

// State
let params = {
  brewTemp: 95,
  steepTime: 4,
  roomTemp: 20,
  A1: 14.0,
  k1: 0.35,
  A2: 56.0,
  k2: 0.022,
  drinkableTemp: 60,
  coldTemp: 45,
};

let chartData = [];
let markers = { addTea: 0, removeTea: 0, drinkable: 0 };
let currentTimeIndex = 0;
let overlayActive = false;
let equationDetailsOpen = false;

// Timer state: idle | countdown | running | confirm
let timerState = "idle";
let timerStartTime = null;
let timerInterval = null;
let timerElapsed = 0;
const COUNTDOWN_SECONDS = 5;

// Logging state
let measurementLog = "";
let currentSessionMeasurements = [];
let sessionActive = false;

// DOM elements
const mainCanvas = document.getElementById("tempChart");
const mainCtx = mainCanvas.getContext("2d");
const overlayCanvas = document.getElementById("overlayChart");
const overlayCtx = overlayCanvas.getContext("2d");

// =============================================================================
// TWO-EXPONENTIAL MODEL
// =============================================================================

function tempAtTime(t) {
  if (t < 0) t = 0;
  return (
    params.roomTemp +
    params.A1 * Math.exp(-params.k1 * t) +
    params.A2 * Math.exp(-params.k2 * t)
  );
}

function timeToTemp(T_target) {
  const T0 = tempAtTime(0);
  if (T_target >= T0) return 0;
  if (T_target <= params.roomTemp) return Infinity;

  let t = 5;
  for (let i = 0; i < 50; i++) {
    const T = tempAtTime(t);
    const dTdt =
      -params.k1 * params.A1 * Math.exp(-params.k1 * t) -
      params.k2 * params.A2 * Math.exp(-params.k2 * t);
    const error = T - T_target;
    if (Math.abs(error) < 0.01) break;
    t = t - error / dTdt;
    if (t < 0) t = 0.1;
    if (t > 200) return Infinity;
  }
  return t;
}

function calculateCurve() {
  chartData = [];
  const totalMinutes = 30;

  const addTeaTime = timeToTemp(params.brewTemp);
  const removeTeaTime = addTeaTime + params.steepTime;
  const drinkableTime = timeToTemp(params.drinkableTemp);

  markers = {
    addTea: addTeaTime,
    removeTea: removeTeaTime,
    drinkable: drinkableTime,
  };

  for (let t = 0; t <= totalMinutes; t += 0.05) {
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

  const maxTime = 30;
  const minTemp = params.roomTemp - 5;
  const maxTemp = 105;

  const xScale = (t) => padding.left + (t / maxTime) * chartWidth;
  const yScale = (temp) =>
    padding.top +
    chartHeight -
    ((temp - minTemp) / (maxTemp - minTemp)) * chartHeight;

  // Grid
  ctx.strokeStyle = "#3a3328";
  ctx.lineWidth = 1;
  for (let temp = Math.ceil(minTemp / 10) * 10; temp <= maxTemp; temp += 10) {
    ctx.beginPath();
    ctx.moveTo(padding.left, yScale(temp));
    ctx.lineTo(width - padding.right, yScale(temp));
    ctx.stroke();
  }
  for (let t = 0; t <= maxTime; t += 5) {
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
  const xStep = compact ? 10 : 5;
  for (let t = 0; t <= maxTime; t += xStep) {
    ctx.fillText(
      `${t}m`,
      xScale(t),
      height - padding.bottom + (compact ? 15 : 20)
    );
  }
  ctx.textAlign = "right";
  for (let temp = Math.ceil(minTemp / 10) * 10; temp <= maxTemp; temp += 20) {
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
  updateLogDisplay();
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
      break;
    case "confirm":
      stopTimer();
      break;
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
  timerState = "idle";
  timerElapsed = 0;
  timerStartTime = null;
  sessionActive = false;
  currentSessionMeasurements = [];

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

document
  .getElementById("stickyToggle")
  .addEventListener("click", toggleOverlay);
document
  .getElementById("equationToggle")
  .addEventListener("click", toggleEquationDetails);
document
  .getElementById("timerStartBtn")
  .addEventListener("click", handleTimerClick);

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

document.getElementById("drinkableTemp").addEventListener("input", (e) => {
  params.drinkableTemp = parseInt(e.target.value);
  document.getElementById("drinkableTempValue").textContent =
    `${params.drinkableTemp}°C`;
  if (params.coldTemp >= params.drinkableTemp) {
    params.coldTemp = params.drinkableTemp - 5;
    document.getElementById("coldTemp").value = params.coldTemp;
    document.getElementById("coldTempValue").textContent =
      `${params.coldTemp}°C`;
  }
  update();
});

document.getElementById("coldTemp").addEventListener("input", (e) => {
  params.coldTemp = parseInt(e.target.value);
  document.getElementById("coldTempValue").textContent = `${params.coldTemp}°C`;
  if (params.drinkableTemp <= params.coldTemp) {
    params.drinkableTemp = params.coldTemp + 5;
    document.getElementById("drinkableTemp").value = params.drinkableTemp;
    document.getElementById("drinkableTempValue").textContent =
      `${params.drinkableTemp}°C`;
  }
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

// Canvas interaction
function handleCanvasInteraction(canvas, e, isTouch = false, compact = false) {
  if (timerState !== "idle") return;
  const rect = canvas.getBoundingClientRect();
  const x = isTouch ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
  const padding = compact ? { left: 40, right: 15 } : { left: 45, right: 20 };
  const chartWidth = rect.width - padding.left - padding.right;

  if (x >= padding.left && x <= rect.width - padding.right) {
    const maxTime = 30;
    const time = ((x - padding.left) / chartWidth) * maxTime;
    currentTimeIndex = Math.round(time / 0.05);
    currentTimeIndex = Math.max(
      0,
      Math.min(currentTimeIndex, chartData.length - 1)
    );
    document.getElementById("timeScrubber").value = currentTimeIndex;
    drawChart(mainCanvas, mainCtx, false, null);
    if (overlayActive) drawChart(overlayCanvas, overlayCtx, true, null);
    if (currentTimeIndex >= 0 && currentTimeIndex < chartData.length) {
      document.getElementById("timeDisplay").textContent = formatTime(
        chartData[currentTimeIndex].time
      );
    }
  }
}

mainCanvas.addEventListener("mousemove", (e) =>
  handleCanvasInteraction(mainCanvas, e, false, false)
);
mainCanvas.addEventListener("touchmove", (e) => {
  e.preventDefault();
  handleCanvasInteraction(mainCanvas, e, true, false);
});
overlayCanvas.addEventListener("mousemove", (e) =>
  handleCanvasInteraction(overlayCanvas, e, false, true)
);
overlayCanvas.addEventListener("touchmove", (e) => {
  e.preventDefault();
  handleCanvasInteraction(overlayCanvas, e, true, true);
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
