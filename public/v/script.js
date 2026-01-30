// Tea presets: target temp to add tea, steep duration
const teaPresets = {
  black: { temp: 95, steep: 4 },
  green: { temp: 80, steep: 2 },
  white: { temp: 75, steep: 3 },
  oolong: { temp: 90, steep: 3 },
  herbal: { temp: 100, steep: 5 },
  rooibos: { temp: 100, steep: 5 },
  custom: null,
};

// State
let params = {
  brewTemp: 95,
  steepTime: 4,
  volume: 250,
  roomTemp: 22,
  coolingConstant: 0.025, // k_base
  drinkableTemp: 60,
  coldTemp: 45,
};

let chartData = [];
let markers = { addTea: 0, removeTea: 0, drinkable: 0 };
let currentTimeIndex = 0;
let overlayActive = false;
let equationDetailsOpen = false;

// Timer state
let timerRunning = false;
let timerStartTime = null;
let timerInterval = null;
let timerElapsed = 0; // in seconds
let currentTimerTemp = 100;

// DOM elements
const mainCanvas = document.getElementById("tempChart");
const mainCtx = mainCanvas.getContext("2d");
const overlayCanvas = document.getElementById("overlayChart");
const overlayCtx = overlayCanvas.getContext("2d");

// Calculate effective k
function getEffectiveK() {
  const volumeFactor = Math.sqrt(250 / params.volume);
  return params.coolingConstant * volumeFactor;
}

// Temperature at time t using Newton's Law of Cooling
function tempAtTime(t, T_initial, k, T_amb) {
  return T_amb + (T_initial - T_amb) * Math.exp(-k * t);
}

// Time to reach target temp from initial temp
function timeToTemp(T_target, T_initial, k, T_amb) {
  if (T_target >= T_initial) return 0;
  if (T_target <= T_amb) return Infinity;
  return -Math.log((T_target - T_amb) / (T_initial - T_amb)) / k;
}

// Calculate temperature curve
function calculateCurve() {
  chartData = [];
  const pourTemp = 100;
  const totalMinutes = 40;
  const k = getEffectiveK();
  const T_amb = params.roomTemp;

  // Calculate when to add tea
  let addTeaTime = 0;
  if (params.brewTemp < pourTemp) {
    addTeaTime = timeToTemp(params.brewTemp, pourTemp, k, T_amb);
  }

  const removeTeaTime = addTeaTime + params.steepTime;

  // Temperature at key points
  const tempAtAdd = tempAtTime(addTeaTime, pourTemp, k, T_amb);
  const tempAtRemove = tempAtTime(params.steepTime, tempAtAdd, k, T_amb);

  // Generate data points
  for (let t = 0; t <= totalMinutes; t += 0.05) {
    let temp, phase;

    if (t < addTeaTime) {
      temp = tempAtTime(t, pourTemp, k, T_amb);
      phase = "cooling-pre";
    } else if (t < removeTeaTime) {
      const steepT = t - addTeaTime;
      temp = tempAtTime(steepT, tempAtAdd, k, T_amb);
      phase = "steeping";
    } else {
      const coolT = t - removeTeaTime;
      temp = tempAtTime(coolT, tempAtRemove, k, T_amb);
      phase = "cooling";
    }

    // Determine drinking zone
    if (temp <= params.drinkableTemp && temp > params.coldTemp) {
      phase = "drinkable";
    } else if (temp <= params.coldTemp) {
      phase = "cold";
    }

    chartData.push({ time: t, temp, phase });
  }

  // Find drinkable time
  let drinkableTime = null;
  for (let i = 0; i < chartData.length; i++) {
    if (chartData[i].temp <= params.drinkableTemp) {
      drinkableTime = chartData[i].time;
      break;
    }
  }

  markers = {
    addTea: addTeaTime,
    removeTea: removeTeaTime,
    drinkable: drinkableTime,
  };

  return chartData;
}

// Get current temperature at a given time (minutes)
function getTempAtMinutes(minutes) {
  const k = getEffectiveK();
  const T_amb = params.roomTemp;
  const pourTemp = 100;

  if (minutes < markers.addTea) {
    return tempAtTime(minutes, pourTemp, k, T_amb);
  } else if (minutes < markers.removeTea) {
    const tempAtAdd = tempAtTime(markers.addTea, pourTemp, k, T_amb);
    return tempAtTime(minutes - markers.addTea, tempAtAdd, k, T_amb);
  } else {
    const tempAtAdd = tempAtTime(markers.addTea, pourTemp, k, T_amb);
    const tempAtRemove = tempAtTime(params.steepTime, tempAtAdd, k, T_amb);
    return tempAtTime(minutes - markers.removeTea, tempAtRemove, k, T_amb);
  }
}

// Format time as M:SS
function formatTime(minutes) {
  if (minutes === Infinity || isNaN(minutes)) return "--";
  const mins = Math.floor(minutes);
  const secs = Math.round((minutes - mins) * 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

// Format steep time for display
function formatSteepTime(minutes) {
  if (minutes === Math.floor(minutes)) {
    return `${minutes} min`;
  } else {
    const mins = Math.floor(minutes);
    const secs = (minutes - mins) * 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }
}

// Draw chart
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

  const maxTime = chartData[chartData.length - 1].time;
  const minTemp = params.roomTemp - 5;
  const maxTemp = 105;

  const xScale = (t) => padding.left + (t / maxTime) * chartWidth;
  const yScale = (temp) =>
    padding.top +
    chartHeight -
    ((temp - minTemp) / (maxTemp - minTemp)) * chartHeight;

  // Draw grid
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

  // Draw cold zone
  ctx.fillStyle = "rgba(122, 111, 130, 0.12)";
  ctx.fillRect(
    padding.left,
    yScale(params.coldTemp),
    chartWidth,
    height - padding.bottom - yScale(params.coldTemp)
  );

  // Draw ideal drinking zone
  ctx.fillStyle = "rgba(107, 154, 196, 0.15)";
  ctx.fillRect(
    padding.left,
    yScale(params.drinkableTemp),
    chartWidth,
    yScale(params.coldTemp) - yScale(params.drinkableTemp)
  );

  // Draw threshold lines
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

  // Draw vertical markers
  if (markers.addTea > 0) {
    ctx.strokeStyle = "#d4a574";
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 3]);
    ctx.beginPath();
    ctx.moveTo(xScale(markers.addTea), padding.top);
    ctx.lineTo(xScale(markers.addTea), height - padding.bottom);
    ctx.stroke();
    ctx.setLineDash([]);

    if (!compact) {
      ctx.fillStyle = "#d4a574";
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.textAlign = "center";
      ctx.fillText("ADD", xScale(markers.addTea), padding.top - 5);
    }
  }

  ctx.strokeStyle = "#c45c3a";
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 3]);
  ctx.beginPath();
  ctx.moveTo(xScale(markers.removeTea), padding.top);
  ctx.lineTo(xScale(markers.removeTea), height - padding.bottom);
  ctx.stroke();
  ctx.setLineDash([]);

  if (!compact) {
    ctx.fillStyle = "#c45c3a";
    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.textAlign = "center";
    ctx.fillText("REMOVE", xScale(markers.removeTea), padding.top - 5);
  }

  if (markers.drinkable && markers.drinkable < maxTime) {
    ctx.strokeStyle = "#6b9ac4";
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 3]);
    ctx.beginPath();
    ctx.moveTo(xScale(markers.drinkable), padding.top);
    ctx.lineTo(xScale(markers.drinkable), height - padding.bottom);
    ctx.stroke();
    ctx.setLineDash([]);

    if (!compact) {
      ctx.fillStyle = "#6b9ac4";
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.textAlign = "center";
      ctx.fillText("DRINK", xScale(markers.drinkable), padding.top - 5);
    }
  }

  // Draw temperature curve
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

  // Draw timer position if running
  if (timerTimeMinutes !== null && timerTimeMinutes <= maxTime) {
    const timerTemp = getTempAtMinutes(timerTimeMinutes);
    const x = xScale(timerTimeMinutes);
    const y = yScale(timerTemp);

    // Glowing vertical line
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

    // Determine phase for color
    let pointPhase = "cooling";
    if (timerTimeMinutes < markers.addTea) pointPhase = "cooling-pre";
    else if (timerTimeMinutes < markers.removeTea) pointPhase = "steeping";
    else if (timerTemp <= params.coldTemp) pointPhase = "cold";
    else if (timerTemp <= params.drinkableTemp) pointPhase = "drinkable";

    // Animated point
    ctx.fillStyle = "#e8e0d5";
    ctx.beginPath();
    ctx.arc(x, y, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = phases[pointPhase] || "#d4a574";
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fill();
  }
  // Draw scrubber position (only if timer not running)
  else if (currentTimeIndex >= 0 && currentTimeIndex < chartData.length) {
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
  const yStep = 20;
  for (
    let temp = Math.ceil(minTemp / 10) * 10;
    temp <= maxTemp;
    temp += yStep
  ) {
    ctx.fillText(`${temp}°`, padding.left - 8, yScale(temp) + 4);
  }
}

// Update marker displays
function updateMarkers(timerMinutes = null) {
  if (timerRunning && timerMinutes !== null) {
    // Timer running: show countdown/status
    const addRemaining = markers.addTea - timerMinutes;
    const removeRemaining = markers.removeTea - timerMinutes;
    const drinkRemaining = markers.drinkable
      ? markers.drinkable - timerMinutes
      : null;

    // Add tea
    if (addRemaining > 0) {
      document.getElementById("addTeaLabel").textContent = "Add Tea In";
      document.getElementById("addTeaTime").textContent =
        formatTime(addRemaining);
      document.getElementById("addTeaTime").classList.remove("done");
    } else {
      document.getElementById("addTeaLabel").textContent = "Tea Added";
      document.getElementById("addTeaTime").textContent = "✓";
      document.getElementById("addTeaTime").classList.add("done");
    }

    // Remove tea
    if (removeRemaining > 0) {
      document.getElementById("removeTeaLabel").textContent = "Remove Tea In";
      document.getElementById("removeTeaTime").textContent =
        formatTime(removeRemaining);
      document.getElementById("removeTeaTime").classList.remove("done");
    } else {
      document.getElementById("removeTeaLabel").textContent = "Tea Removed";
      document.getElementById("removeTeaTime").textContent = "✓";
      document.getElementById("removeTeaTime").classList.add("done");
    }

    // Drinkable
    if (drinkRemaining !== null && drinkRemaining > 0) {
      document.getElementById("drinkableLabel").textContent = "Drinkable In";
      document.getElementById("drinkableTime").textContent =
        formatTime(drinkRemaining);
      document.getElementById("drinkableTime").classList.remove("done");
    } else if (drinkRemaining !== null) {
      document.getElementById("drinkableLabel").textContent = "Drinkable";
      document.getElementById("drinkableTime").textContent = "✓ Now";
      document.getElementById("drinkableTime").classList.add("done");
    } else {
      document.getElementById("drinkableLabel").textContent = "Drinkable At";
      document.getElementById("drinkableTime").textContent = "--";
    }
  } else {
    // Timer not running: show absolute times
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

// Update equation display
function updateEquation() {
  const k = getEffectiveK();
  const kStr = k.toFixed(4);
  const T_amb = params.roomTemp;

  // Main equation
  document.getElementById("eqTambMain").textContent = T_amb;
  document.getElementById("eqT0Main").textContent = "100";
  document.getElementById("eqTambMain2").textContent = T_amb;
  document.getElementById("eqKeffMain").textContent = kStr;

  // Parameters
  document.getElementById("eqTamb").textContent = T_amb;
  document.getElementById("eqKbase").textContent =
    params.coolingConstant.toFixed(3);
  document.getElementById("eqVolume").textContent = params.volume;
  document.getElementById("eqKeff").textContent = kStr;

  // Detailed section
  document.getElementById("eqTamb2").textContent = T_amb;
  document.getElementById("eqTamb3").textContent = T_amb;
  document.getElementById("eqK1").textContent = kStr;

  document.getElementById("eqBrewTemp").textContent = params.brewTemp;
  document.getElementById("eqBrewTemp2").textContent = params.brewTemp;
  document.getElementById("eqTamb8").textContent = T_amb;
  document.getElementById("eqTamb9").textContent = T_amb;
  document.getElementById("eqK4").textContent = kStr;
  document.getElementById("eqTadd").textContent = markers.addTea.toFixed(2);

  document.getElementById("eqTamb4").textContent = T_amb;
  document.getElementById("eqTamb5").textContent = T_amb;
  document.getElementById("eqK2").textContent = kStr;

  // Calculate actual temps
  const tempAtAdd = getTempAtMinutes(markers.addTea);
  const tempAtRemove = getTempAtMinutes(markers.removeTea);

  document.getElementById("eqTaddTemp").textContent = tempAtAdd.toFixed(1);
  document.getElementById("eqSteepTime").textContent =
    params.steepTime.toFixed(1);
  document.getElementById("eqTremove").textContent =
    markers.removeTea.toFixed(2);
  document.getElementById("eqTremoveTemp").textContent =
    tempAtRemove.toFixed(1);

  document.getElementById("eqTamb6").textContent = T_amb;
  document.getElementById("eqTamb7").textContent = T_amb;
  document.getElementById("eqK3").textContent = kStr;

  document.getElementById("eqKeffNote").textContent = kStr;
}

// Update how-to tab values
function updateHowTo() {
  document.getElementById("howtoBrewTemp").textContent = params.brewTemp + "°C";
  document.getElementById("howtoSteepTime").textContent = formatSteepTime(
    params.steepTime
  );
  document.getElementById("howtoDrinkTemp").textContent =
    params.drinkableTemp + "°C";
}

// Update current temp display
function updateCurrentTemp(timerMinutes = null) {
  if (timerRunning && timerMinutes !== null) {
    // Show current temperature from timer
    const temp = getTempAtMinutes(timerMinutes);
    currentTimerTemp = temp;

    document.getElementById("currentTempLabel").textContent =
      "Current Temperature";
    document.getElementById("currentTemp").textContent = `${temp.toFixed(1)}°C`;

    let phaseText;
    if (timerMinutes < markers.addTea) {
      phaseText = "Cooling to brew temp";
    } else if (timerMinutes < markers.removeTea) {
      phaseText = "Steeping tea";
    } else if (temp > params.drinkableTemp) {
      phaseText = "Too hot to drink";
    } else if (temp > params.coldTemp) {
      phaseText = "✓ Ideal drinking zone";
    } else {
      phaseText = "Getting cold";
    }
    document.getElementById("currentPhase").textContent = phaseText;
  } else if (currentTimeIndex >= 0 && currentTimeIndex < chartData.length) {
    // Show temperature at cursor
    const point = chartData[currentTimeIndex];

    document.getElementById("currentTempLabel").textContent =
      "Temperature at cursor";
    document.getElementById("currentTemp").textContent =
      `${point.temp.toFixed(1)}°C`;

    let phaseText;
    if (point.time < markers.addTea) {
      phaseText = "Cooling to brew temp";
    } else if (point.time < markers.removeTea) {
      phaseText = "Steeping tea";
    } else if (point.temp > params.drinkableTemp) {
      phaseText = "Too hot to drink";
    } else if (point.temp > params.coldTemp) {
      phaseText = "✓ Ideal drinking zone";
    } else {
      phaseText = "Getting cold";
    }
    document.getElementById("currentPhase").textContent = phaseText;
    document.getElementById("timeDisplay").textContent = formatTime(point.time);
  }
}

// Timer functions
function startTimer() {
  timerRunning = true;
  timerStartTime = Date.now() - timerElapsed * 1000;
  document.getElementById("timerStartBtn").textContent = "Pause";
  document.getElementById("timerResetBtn").disabled = false;

  timerInterval = setInterval(updateTimer, 100);
}

function pauseTimer() {
  timerRunning = false;
  clearInterval(timerInterval);
  document.getElementById("timerStartBtn").textContent = "Resume";

  // Revert to cursor mode
  updateMarkers(null);
  updateCurrentTemp(null);
}

function resetTimer() {
  timerRunning = false;
  clearInterval(timerInterval);
  timerElapsed = 0;
  timerStartTime = null;
  document.getElementById("timerStartBtn").textContent = "Start";
  document.getElementById("timerResetBtn").disabled = true;
  document.getElementById("timerDisplay").textContent = "0:00";
  document.getElementById("timerPhase").textContent = "Ready to start";
  document.getElementById("timerInstruction").textContent =
    "Press Start when you pour the water";

  updateMarkers(null);
  updateCurrentTemp(null);
  drawChart(mainCanvas, mainCtx, false, null);
  if (overlayActive) {
    drawChart(overlayCanvas, overlayCtx, true, null);
  }
}

function updateTimer() {
  timerElapsed = (Date.now() - timerStartTime) / 1000;
  const minutes = timerElapsed / 60;

  // Update timer display
  const mins = Math.floor(minutes);
  const secs = Math.floor(timerElapsed % 60);
  document.getElementById("timerDisplay").textContent =
    `${mins}:${secs.toString().padStart(2, "0")}`;

  // Get current temp
  const currentTemp = getTempAtMinutes(minutes);

  // Update phase and instruction
  let phase, instruction;

  if (minutes < markers.addTea) {
    const timeToAdd = markers.addTea - minutes;
    phase = `Cooling... ${currentTemp.toFixed(1)}°C`;
    if (timeToAdd < 0.5) {
      instruction = "⏰ Almost time to add tea!";
    } else {
      instruction = `Add tea in ${formatTime(timeToAdd)}`;
    }
  } else if (minutes < markers.removeTea) {
    const timeToRemove = markers.removeTea - minutes;
    phase = `Steeping... ${currentTemp.toFixed(1)}°C`;
    if (timeToRemove < 0.5) {
      instruction = "⏰ Almost done steeping!";
    } else {
      instruction = `Remove tea in ${formatTime(timeToRemove)}`;
    }
  } else if (currentTemp > params.drinkableTemp) {
    const timeToDrink = markers.drinkable ? markers.drinkable - minutes : null;
    phase = `Cooling... ${currentTemp.toFixed(1)}°C`;
    if (timeToDrink !== null && timeToDrink < 0.5 && timeToDrink > 0) {
      instruction = "⏰ Almost drinkable!";
    } else if (timeToDrink !== null && timeToDrink > 0) {
      instruction = `Drinkable in ${formatTime(timeToDrink)}`;
    } else {
      instruction = "Should be drinkable soon";
    }
  } else if (currentTemp > params.coldTemp) {
    phase = `✓ Ready! ${currentTemp.toFixed(1)}°C`;
    instruction = "Enjoy your tea!";
  } else {
    phase = `Cold: ${currentTemp.toFixed(1)}°C`;
    instruction = "Tea is getting cold";
  }

  document.getElementById("timerPhase").textContent = phase;
  document.getElementById("timerInstruction").textContent = instruction;

  // Update markers and temp display
  updateMarkers(minutes);
  updateCurrentTemp(minutes);

  // Redraw chart with timer position
  drawChart(mainCanvas, mainCtx, false, minutes);
  if (overlayActive) {
    drawChart(overlayCanvas, overlayCtx, true, minutes);
  }
}

// Update all
function update() {
  calculateCurve();

  const timerMinutes = timerRunning ? timerElapsed / 60 : null;
  drawChart(mainCanvas, mainCtx, false, timerMinutes);
  if (overlayActive) {
    drawChart(overlayCanvas, overlayCtx, true, timerMinutes);
  }

  updateMarkers(timerMinutes);
  updateEquation();
  updateHowTo();
  updateCurrentTemp(timerMinutes);

  document.getElementById("timeScrubber").max = chartData.length - 1;
}

// Update k preset buttons
function updateKPresetButtons() {
  document.querySelectorAll(".k-preset-btn").forEach((btn) => {
    const btnK = parseFloat(btn.dataset.k);
    if (Math.abs(btnK - params.coolingConstant) < 0.0005) {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }
  });
}

// Toggle overlay
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
    const timerMinutes = timerRunning ? timerElapsed / 60 : null;
    drawChart(overlayCanvas, overlayCtx, true, timerMinutes);
  } else {
    overlay.classList.remove("visible");
    toggle.classList.remove("active");
    toggleText.textContent = "Pin Graph";
    document.body.classList.remove("overlay-active");
  }
}

// Toggle equation details
function toggleEquationDetails() {
  equationDetailsOpen = !equationDetailsOpen;
  const details = document.getElementById("equationDetails");
  const icon = document.getElementById("equationToggleIcon");

  if (equationDetailsOpen) {
    details.classList.add("open");
    icon.classList.add("open");
  } else {
    details.classList.remove("open");
    icon.classList.remove("open");
  }
}

// Event listeners
document
  .getElementById("stickyToggle")
  .addEventListener("click", toggleOverlay);
document
  .getElementById("equationToggle")
  .addEventListener("click", toggleEquationDetails);

document.getElementById("timerStartBtn").addEventListener("click", () => {
  if (timerRunning) {
    pauseTimer();
  } else {
    startTimer();
  }
});

document.getElementById("timerResetBtn").addEventListener("click", resetTimer);

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

document.getElementById("volume").addEventListener("input", (e) => {
  params.volume = parseInt(e.target.value);
  document.getElementById("volumeValue").textContent = `${params.volume} ml`;
  update();
});

document.getElementById("kSlider").addEventListener("input", (e) => {
  params.coolingConstant = parseFloat(e.target.value);
  document.getElementById("kValue").textContent =
    params.coolingConstant.toFixed(3);
  updateKPresetButtons();
  update();
});

// K preset buttons
document.querySelectorAll(".k-preset-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    params.coolingConstant = parseFloat(btn.dataset.k);
    document.getElementById("kSlider").value = params.coolingConstant;
    document.getElementById("kValue").textContent =
      params.coolingConstant.toFixed(3);
    updateKPresetButtons();
    update();
  });
});

document.getElementById("roomTemp").addEventListener("input", (e) => {
  params.roomTemp = parseInt(e.target.value);
  document.getElementById("roomTempValue").textContent = `${params.roomTemp}°C`;
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
  if (!timerRunning) {
    currentTimeIndex = parseInt(e.target.value);
    drawChart(mainCanvas, mainCtx, false, null);
    if (overlayActive) {
      drawChart(overlayCanvas, overlayCtx, true, null);
    }
    updateCurrentTemp(null);
  }
});

// Tab switching
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
  if (timerRunning) return;

  const rect = canvas.getBoundingClientRect();
  const x = isTouch ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
  const padding = compact ? { left: 40, right: 15 } : { left: 45, right: 20 };
  const chartWidth = rect.width - padding.left - padding.right;

  if (x >= padding.left && x <= rect.width - padding.right) {
    const ratio = (x - padding.left) / chartWidth;
    currentTimeIndex = Math.round(ratio * (chartData.length - 1));
    document.getElementById("timeScrubber").value = currentTimeIndex;
    drawChart(mainCanvas, mainCtx, false, null);
    if (overlayActive) {
      drawChart(overlayCanvas, overlayCtx, true, null);
    }
    updateCurrentTemp(null);
  }
}

mainCanvas.addEventListener("mousemove", (e) =>
  handleCanvasInteraction(mainCanvas, e, false, false)
);
mainCanvas.addEventListener(
  "touchmove",
  (e) => {
    e.preventDefault();
    handleCanvasInteraction(mainCanvas, e, true, false);
  },
  { passive: false }
);

overlayCanvas.addEventListener("mousemove", (e) =>
  handleCanvasInteraction(overlayCanvas, e, false, true)
);
overlayCanvas.addEventListener(
  "touchmove",
  (e) => {
    e.preventDefault();
    handleCanvasInteraction(overlayCanvas, e, true, true);
  },
  { passive: false }
);

// Resize handling
window.addEventListener("resize", () => {
  const timerMinutes = timerRunning ? timerElapsed / 60 : null;
  drawChart(mainCanvas, mainCtx, false, timerMinutes);
  if (overlayActive) {
    drawChart(overlayCanvas, overlayCtx, true, timerMinutes);
  }
});

// Initial render
update();
