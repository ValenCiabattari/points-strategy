const ENDURANCE_PMAX = 250;
const ENDURANCE_PMIN = 25;
const EFFICIENCY_PMAX = 75;
const TRACKDRIVE_PMAX = 200;
const TRACKDRIVE_BASE_MAX = 0.75 * TRACKDRIVE_PMAX;

const competitionData = {
  portugal: {
    label: "Portugal",
    ev: {
      acceleration: 3.766,
      skidpad: 4.944,
      autocross: 57.183,
      endurance: 1516.701,
      efficiency: {
        energyKwh: 4.414,
        time: 1516.701,
        laps: null,
        efficiencyFactor: 10152966,
        efficiencyReported: 75.0,
        score: 75.0,
        endurancePoints: 250.0
      }
    },
    dv: {
      acceleration: 4.48,
      skidpad: 6.642,
      autocross: null,
      trackdrive: 212.223,
      trackdriveLaps: 11
    }
  },
  germany: {
    label: "Germany",
    ev: {
      acceleration: 3.403,
      skidpad: 4.555,
      autocross: 72.719,
      endurance: 1361.13,
      efficiency: {
        energyKwh: 4.971,
        time: 1391.36,
        laps: 18,
        efficiencyFactor: 9623270.0,
        efficiencyReported: null,
        score: null,
        endurancePoints: null
      }
    },
    dv: {
      acceleration: 3.231,
      skidpad: 4.875,
      autocross: 26.588,
      trackdrive: 263.56,
      trackdriveLaps: null
    }
  },
  italy: {
    label: "Italy",
    ev: {
      acceleration: 3.302,
      skidpad: 4.351,
      autocross: 52.953,
      endurance: 1488.707,
      efficiency: {
        energyKwh: 5.979,
        time: 1488.707,
        laps: null,
        efficiencyFactor: null,
        efficiencyReported: 94.944,
        score: null,
        endurancePoints: null
      }
    },
    dv: {
      acceleration: null,
      skidpad: 5.45,
      autocross: 36.173,
      trackdrive: null,
      trackdriveLaps: null
    }
  }
};

const evDemoScenarios = [
  {
    name: "Conservative / Low energy",
    primaryValue: 1560,
    secondaryValue: 4.2,
    notes: "Slower but lower energy consumption"
  },
  {
    name: "Balanced",
    primaryValue: 1535,
    secondaryValue: 4.45,
    notes: "Balanced endurance time and energy consumption"
  },
  {
    name: "Aggressive / High power",
    primaryValue: 1510,
    secondaryValue: 4.9,
    notes: "Faster but higher energy consumption"
  }
];

const dvDemoScenarios = {
  portugal: [
    {
      name: "Conservative autonomous run",
      primaryValue: 245,
      secondaryValue: 11,
      notes: "Safer autonomous strategy"
    },
    {
      name: "Balanced autonomous run",
      primaryValue: 225,
      secondaryValue: 11,
      notes: "Balanced speed and completion probability"
    },
    {
      name: "Aggressive autonomous run",
      primaryValue: 210,
      secondaryValue: 11,
      notes: "Fast but higher risk strategy"
    }
  ],
  germany: [
    {
      name: "Conservative autonomous run",
      primaryValue: 300,
      secondaryValue: 10,
      notes: "Safer autonomous strategy"
    },
    {
      name: "Balanced autonomous run",
      primaryValue: 275,
      secondaryValue: 10,
      notes: "Balanced speed and completion probability"
    },
    {
      name: "Aggressive autonomous run",
      primaryValue: 255,
      secondaryValue: 10,
      notes: "Fast but higher risk strategy"
    }
  ],
  italy: [
    {
      name: "",
      primaryValue: "",
      secondaryValue: "",
      notes: ""
    }
  ]
};

const state = {
  results: [],
  currentRace: "portugal",
  currentMode: "ev"
};

const elements = {
  raceSelect: document.getElementById("race-select"),
  modeSelect: document.getElementById("mode-select"),
  modeBadge: document.getElementById("mode-badge"),
  benchmarkStatus: document.getElementById("benchmark-status"),
  benchmarkNote: document.getElementById("benchmark-note"),
  benchmarkWarning: document.getElementById("benchmark-warning"),
  benchmarkCardTitle: document.getElementById("benchmark-card-title"),
  benchmarkDetails: document.getElementById("benchmark-details"),
  referencePrimaryField: document.getElementById("reference-primary-field"),
  referencePrimaryLabel: document.getElementById("reference-primary-label"),
  referencePrimaryInput: document.getElementById("reference-primary-input"),
  referenceSecondaryField: document.getElementById("reference-secondary-field"),
  referenceSecondaryLabel: document.getElementById("reference-secondary-label"),
  referenceSecondaryInput: document.getElementById("reference-secondary-input"),
  energyUnitField: document.getElementById("energy-unit-field"),
  energyUnitInput: document.getElementById("energy-unit-input"),
  scenarioSectionTitle: document.getElementById("scenario-section-title"),
  scenarioSectionCopy: document.getElementById("scenario-section-copy"),
  scenarioTableHeadRow: document.getElementById("scenario-table-head-row"),
  scenarioTableBody: document.getElementById("scenario-table-body"),
  resultsSectionCopy: document.getElementById("results-section-copy"),
  resultsTableHeadRow: document.getElementById("results-table-head-row"),
  resultsTableBody: document.getElementById("results-table-body"),
  recommendationContent: document.getElementById("recommendation-content"),
  errorBanner: document.getElementById("error-banner"),
  infoBanner: document.getElementById("info-banner"),
  addScenarioButton: document.getElementById("add-scenario-btn"),
  calculateButton: document.getElementById("calculate-btn"),
  loadDemoButton: document.getElementById("load-demo-btn"),
  clearScenariosButton: document.getElementById("clear-scenarios-btn"),
  exportCsvButton: document.getElementById("export-csv-btn")
};

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function formatNumber(value, decimals = 2) {
  if (!Number.isFinite(value)) {
    return "No data";
  }

  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value);
}

function formatDisplayValue(value, decimals = 3, emptyLabel = "No data") {
  if (value === null || value === undefined || value === "") {
    return emptyLabel;
  }

  if (!Number.isFinite(value)) {
    return emptyLabel;
  }

  return formatNumber(value, decimals);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function csvEscape(value) {
  const safeValue = String(value ?? "");
  return `"${safeValue.replace(/"/g, '""')}"`;
}

function getEnergyUnitLabel() {
  const label = elements.energyUnitInput.value.trim();
  return label || "kWh";
}

function getSelectedCompetition() {
  return competitionData[state.currentRace];
}

function getSelectedMode() {
  return state.currentMode;
}

function isEVMode() {
  return getSelectedMode() === "ev";
}

function isDVMode() {
  return getSelectedMode() === "dv";
}

function getModeLabel() {
  return isEVMode() ? "Manual / EV" : "Driverless / DV";
}

function getCompetitionModeData() {
  const competition = getSelectedCompetition();
  return competition?.[getSelectedMode()] ?? null;
}

function getEffectiveEfficiencyFactor(evData) {
  if (!evData?.efficiency) {
    return { value: null, derived: false };
  }

  if (Number.isFinite(evData.efficiency.efficiencyFactor)) {
    return { value: evData.efficiency.efficiencyFactor, derived: false };
  }

  if (Number.isFinite(evData.efficiency.time) && Number.isFinite(evData.efficiency.energyKwh)) {
    return {
      value: (evData.efficiency.time ** 2) * evData.efficiency.energyKwh,
      derived: true
    };
  }

  return { value: null, derived: false };
}

function setMessage(element, message) {
  element.textContent = message;
  element.classList.remove("hidden");
}

function hideMessage(element) {
  element.textContent = "";
  element.classList.add("hidden");
}

function clearFeedbackMessages() {
  hideMessage(elements.errorBanner);
  hideMessage(elements.infoBanner);
}

function showError(message) {
  setMessage(elements.errorBanner, message);
}

function showInfo(message) {
  setMessage(elements.infoBanner, message);
}

function clearBenchmarkMessages() {
  hideMessage(elements.benchmarkStatus);
  hideMessage(elements.benchmarkNote);
  hideMessage(elements.benchmarkWarning);
}

function updateModeVisuals() {
  document.body.classList.toggle("mode-ev", isEVMode());
  document.body.classList.toggle("mode-dv", isDVMode());
  elements.modeBadge.textContent = getModeLabel();
  elements.modeBadge.className = isEVMode()
    ? "mode-badge mode-badge-ev"
    : "mode-badge mode-badge-dv";
}

function updateReferenceFields() {
  if (isEVMode()) {
    elements.referencePrimaryLabel.textContent = "Fastest Endurance Time, Tmin [s]";
    elements.referenceSecondaryLabel.textContent = "Best Efficiency Factor, EFmin";
    elements.referenceSecondaryField.classList.remove("hidden");
    elements.energyUnitField.classList.remove("hidden");

    const primaryTitle = document.getElementById("formula-card-primary").querySelector("h3");
    primaryTitle.textContent = "Endurance defaults";
    elements.formulaPrimaryList = document.getElementById("formula-primary-list");
    elements.formulaSecondaryList = document.getElementById("formula-secondary-list");
    elements.formulaPrimaryList.innerHTML = `
      <li><strong>Pmax</strong> = 250</li>
      <li><strong>Pmin</strong> = 25</li>
      <li><strong>Tmax</strong> = 1.5 × Tmin</li>
    `;
    document.getElementById("formula-card-secondary").querySelector("h3").textContent = "Efficiency defaults";
    elements.formulaSecondaryList.innerHTML = `
      <li><strong>Pmax</strong> = 75</li>
      <li><strong>EFteam</strong> = Tteam² × Eteam</li>
      <li><strong>EFmax</strong> = 2 × EFmin</li>
    `;
    return;
  }

  elements.referencePrimaryLabel.textContent = "Fastest Trackdrive Time, Tmin [s]";
  elements.referenceSecondaryField.classList.add("hidden");
  elements.energyUnitField.classList.add("hidden");

  const primaryTitle = document.getElementById("formula-card-primary").querySelector("h3");
  primaryTitle.textContent = "Trackdrive defaults";
  elements.formulaPrimaryList = document.getElementById("formula-primary-list");
  elements.formulaSecondaryList = document.getElementById("formula-secondary-list");
  elements.formulaPrimaryList.innerHTML = `
    <li><strong>Pmax</strong> = 200</li>
    <li><strong>Base score max</strong> = 150</li>
    <li><strong>Tmax</strong> = 2 × Tfastest</li>
  `;
  document.getElementById("formula-card-secondary").querySelector("h3").textContent = "Lap completion bonus";
  elements.formulaSecondaryList.innerHTML = `
    <li><strong>Bonus per lap</strong> = 0.025 × Pmax</li>
    <li><strong>Bonus per lap</strong> = 5 points</li>
    <li><strong>Total score</strong> capped at 200</li>
  `;
}

function updateBenchmarksFromSelection() {
  clearBenchmarkMessages();

  const competition = getSelectedCompetition();
  const modeData = getCompetitionModeData();

  if (isEVMode()) {
    const effectiveEfficiency = getEffectiveEfficiencyFactor(modeData);
    elements.referencePrimaryInput.value = Number.isFinite(modeData?.endurance) ? String(modeData.endurance) : "";
    elements.referenceSecondaryInput.value = Number.isFinite(effectiveEfficiency.value) ? String(effectiveEfficiency.value) : "";

    if (Number.isFinite(modeData?.endurance) && Number.isFinite(effectiveEfficiency.value)) {
      setMessage(elements.benchmarkStatus, `${competition.label} Manual / EV benchmarks loaded into Tmin and EFmin. You can still edit them manually.`);
    } else {
      setMessage(elements.benchmarkStatus, "Benchmarks for this competition are not fully loaded yet.");
    }

    if (effectiveEfficiency.derived) {
      setMessage(elements.benchmarkNote, "Efficiency Factor calculated from time and energy.");
    }

    return;
  }

  elements.referencePrimaryInput.value = Number.isFinite(modeData?.trackdrive) ? String(modeData.trackdrive) : "";
  elements.referenceSecondaryInput.value = "";
  setMessage(elements.benchmarkStatus, `${competition.label} Driverless / DV benchmarks loaded for Trackdrive strategy analysis.`);

  if (!Number.isFinite(modeData?.trackdrive)) {
    setMessage(elements.benchmarkWarning, "Trackdrive benchmark is not loaded for this competition. Please enter a manual reference time.");
  }
}

function renderBenchmarkCard() {
  const competition = getSelectedCompetition();
  const modeData = getCompetitionModeData();
  elements.benchmarkCardTitle.textContent = `${competition.label} - ${getModeLabel()} benchmarks`;

  const items = [];

  if (isEVMode()) {
    const effectiveEfficiency = getEffectiveEfficiencyFactor(modeData);
    items.push(`Acceleration: ${formatDisplayValue(modeData?.acceleration, 3)} s`);
    items.push(`Skidpad: ${formatDisplayValue(modeData?.skidpad, 3)} s`);
    items.push(`Autocross: ${modeData?.autocross === null ? "Not registered" : `${formatDisplayValue(modeData?.autocross, 3)} s`}`);
    items.push(`Endurance: ${formatDisplayValue(modeData?.endurance, 3)} s`);
    items.push(`Efficiency reference time: ${formatDisplayValue(modeData?.efficiency?.time, 3)} s`);
    items.push(`Energy used: ${formatDisplayValue(modeData?.efficiency?.energyKwh, 3)} kWh`);

    if (Number.isFinite(modeData?.efficiency?.laps)) {
      items.push(`Laps: ${formatDisplayValue(modeData.efficiency.laps, 0)}`);
    }

    items.push(`Efficiency Factor: ${formatDisplayValue(effectiveEfficiency.value, 0)}`);
  } else {
    items.push(`Acceleration: ${formatDisplayValue(modeData?.acceleration, 3)} s`);
    items.push(`Skidpad: ${formatDisplayValue(modeData?.skidpad, 3)} s`);
    items.push(`Autocross: ${modeData?.autocross === null ? "Not registered" : `${formatDisplayValue(modeData?.autocross, 3)} s`}`);
    items.push(`Trackdrive: ${formatDisplayValue(modeData?.trackdrive, 3)} s`);
    if (modeData?.trackdriveLaps === null || modeData?.trackdriveLaps === undefined) {
      items.push("Trackdrive laps: No data");
    } else {
      items.push(`Trackdrive laps: ${formatDisplayValue(modeData.trackdriveLaps, 0)}`);
    }
  }

  elements.benchmarkDetails.innerHTML = items
    .map((item) => `<li>${escapeHtml(item)}</li>`)
    .join("");
}

function getScenarioColumns() {
  if (isEVMode()) {
    return [
      "Scenario name",
      "Endurance time Tteam [s]",
      `Energy used Eteam [${getEnergyUnitLabel()}]`,
      "Notes",
      "Remove"
    ];
  }

  return [
    "Scenario name",
    "Trackdrive time Tteam [s]",
    "Completed laps",
    "Notes",
    "Remove"
  ];
}

function renderScenarioTableHead() {
  const columns = getScenarioColumns();
  elements.scenarioTableHeadRow.innerHTML = columns
    .map((column, index) => `<th${index === columns.length - 1 ? ' class="action-col"' : ""}>${escapeHtml(column)}</th>`)
    .join("");
}

function createScenarioRow(scenario = {}) {
  const row = document.createElement("tr");

  const primaryPlaceholder = isEVMode() ? "1535" : "225";
  const secondaryPlaceholder = isEVMode() ? "4.45" : "11";
  const secondaryStep = isEVMode() ? "0.01" : "1";
  const secondaryMin = isEVMode() ? "0.01" : "0";

  row.innerHTML = `
    <td><input type="text" class="scenario-name" placeholder="Scenario name" value="${escapeHtml(scenario.name || "")}"></td>
    <td><input type="number" class="scenario-primary" min="0.01" step="0.1" placeholder="${primaryPlaceholder}" value="${scenario.primaryValue ?? ""}"></td>
    <td><input type="number" class="scenario-secondary" min="${secondaryMin}" step="${secondaryStep}" placeholder="${secondaryPlaceholder}" value="${scenario.secondaryValue ?? ""}"></td>
    <td><textarea class="scenario-notes" placeholder="Notes">${escapeHtml(scenario.notes || "")}</textarea></td>
    <td class="remove-cell"><button type="button" class="table-remove-btn">Remove</button></td>
  `;

  row.querySelector(".table-remove-btn").addEventListener("click", () => {
    row.remove();
    hideMessage(elements.infoBanner);
    if (!elements.scenarioTableBody.children.length) {
      addScenarioRow();
    }
  });

  return row;
}

function addScenarioRow(scenario = {}) {
  elements.scenarioTableBody.appendChild(createScenarioRow(scenario));
}

function clearScenarios() {
  elements.scenarioTableBody.innerHTML = "";
}

function getDemoScenariosForSelection() {
  if (isEVMode()) {
    return evDemoScenarios;
  }

  return dvDemoScenarios[state.currentRace] ?? dvDemoScenarios.italy;
}

function loadDemoData() {
  clearScenarios();
  getDemoScenariosForSelection().forEach((scenario) => addScenarioRow(scenario));

  if (isEVMode()) {
    showInfo("Endurance + Efficiency demo scenarios loaded.");
  } else {
    showInfo("Trackdrive demo scenarios loaded.");
  }
}

function readBenchmarks() {
  if (isEVMode()) {
    return {
      Tmin: Number(elements.referencePrimaryInput.value),
      EFmin: Number(elements.referenceSecondaryInput.value)
    };
  }

  return {
    fastestTrackdriveTime: Number(elements.referencePrimaryInput.value)
  };
}

function readScenarios() {
  const rows = Array.from(elements.scenarioTableBody.querySelectorAll("tr"));

  return rows.map((row, index) => {
    const scenario = {
      id: index + 1,
      name: row.querySelector(".scenario-name").value.trim() || `Scenario ${index + 1}`,
      notes: row.querySelector(".scenario-notes").value.trim()
    };

    if (isEVMode()) {
      return {
        ...scenario,
        Tteam: Number(row.querySelector(".scenario-primary").value),
        Eteam: Number(row.querySelector(".scenario-secondary").value)
      };
    }

    return {
      ...scenario,
      Tteam: Number(row.querySelector(".scenario-primary").value),
      completedLaps: Number(row.querySelector(".scenario-secondary").value)
    };
  });
}

function validateEVInputs(benchmarks, scenarios) {
  if (benchmarks.Tmin <= 0 || !Number.isFinite(benchmarks.Tmin)) {
    return "Fastest Endurance Time, Tmin must be greater than 0.";
  }

  if (benchmarks.EFmin <= 0 || !Number.isFinite(benchmarks.EFmin)) {
    return "Best Efficiency Factor, EFmin must be greater than 0.";
  }

  if (!scenarios.length) {
    return "Add at least one scenario before calculating.";
  }

  for (const scenario of scenarios) {
    if (scenario.Tteam <= 0 || !Number.isFinite(scenario.Tteam)) {
      return `Scenario "${scenario.name}" must have an Endurance time greater than 0.`;
    }

    if (scenario.Eteam <= 0 || !Number.isFinite(scenario.Eteam)) {
      return `Scenario "${scenario.name}" must have an energy value greater than 0.`;
    }
  }

  return "";
}

function validateDVInputs(benchmarks, scenarios) {
  if (benchmarks.fastestTrackdriveTime <= 0 || !Number.isFinite(benchmarks.fastestTrackdriveTime)) {
    return "Trackdrive reference time must be greater than 0.";
  }

  if (!scenarios.length) {
    return "Add at least one scenario before calculating.";
  }

  for (const scenario of scenarios) {
    if (scenario.Tteam <= 0 || !Number.isFinite(scenario.Tteam)) {
      return `Scenario "${scenario.name}" must have a Trackdrive time greater than 0.`;
    }

    if (scenario.completedLaps < 0 || !Number.isFinite(scenario.completedLaps)) {
      return `Scenario "${scenario.name}" must have completed laps greater than or equal to 0.`;
    }
  }

  return "";
}

function calculateEnduranceScore(Tteam, Tmin) {
  const Tmax = 1.5 * Tmin;
  const cappedTime = Math.min(Tteam, Tmax);
  const normalizedDelta = (Tmax - cappedTime) / (Tmax - Tmin);
  const rawScore = (ENDURANCE_PMAX - ENDURANCE_PMIN) * (normalizedDelta ** 2) + ENDURANCE_PMIN;
  return clamp(rawScore, 0, ENDURANCE_PMAX);
}

function calculateEfficiencyScore(Tteam, Eteam, EFmin) {
  const EFteam = (Tteam ** 2) * Eteam;
  const EFmax = 2 * EFmin;

  if (EFteam >= EFmax) {
    return 0;
  }

  if (EFteam <= EFmin) {
    return EFFICIENCY_PMAX;
  }

  const rawScore = EFFICIENCY_PMAX * (((EFmax - EFteam) / (EFmax - EFmin)) ** 2);
  return clamp(rawScore, 0, EFFICIENCY_PMAX);
}

function calculateEVScenario(scenario, benchmarks) {
  const EFteam = (scenario.Tteam ** 2) * scenario.Eteam;
  const endurancePoints = calculateEnduranceScore(scenario.Tteam, benchmarks.Tmin);
  const efficiencyPoints = calculateEfficiencyScore(scenario.Tteam, scenario.Eteam, benchmarks.EFmin);
  const combinedPoints = endurancePoints + efficiencyPoints;

  return {
    ...scenario,
    EFteam,
    endurancePoints,
    efficiencyPoints,
    combinedPoints
  };
}

function calculateTrackdriveScore(Tteam, completedLaps, fastestTrackdriveTime) {
  const Tmax = 2 * fastestTrackdriveTime;
  const correctedTime = Math.min(Tteam, Tmax);
  const rawBaseScore = 0.75 * TRACKDRIVE_PMAX * (Tmax / correctedTime - 1);
  const baseScore = clamp(rawBaseScore, 0, TRACKDRIVE_BASE_MAX);
  const lapBonus = 0.025 * TRACKDRIVE_PMAX * Math.max(0, completedLaps);
  const totalScore = clamp(baseScore + lapBonus, 0, TRACKDRIVE_PMAX);

  return {
    Tmax,
    correctedTime,
    baseScore,
    lapBonus,
    totalScore
  };
}

function calculateDVScenario(scenario, benchmarks) {
  const trackdrive = calculateTrackdriveScore(scenario.Tteam, scenario.completedLaps || 0, benchmarks.fastestTrackdriveTime);
  return {
    ...scenario,
    baseTrackdrivePoints: trackdrive.baseScore,
    lapCompletionBonus: trackdrive.lapBonus,
    totalTrackdrivePoints: trackdrive.totalScore,
    correctedTime: trackdrive.correctedTime,
    Tmax: trackdrive.Tmax
  };
}

function renderResultsHeaders() {
  if (isEVMode()) {
    elements.resultsTableHeadRow.innerHTML = `
      <th>Rank</th>
      <th>Scenario name</th>
      <th>Tteam [s]</th>
      <th>Eteam [${escapeHtml(getEnergyUnitLabel())}]</th>
      <th>EFteam</th>
      <th>Endurance points</th>
      <th>Efficiency points</th>
      <th>Combined points</th>
      <th>Notes</th>
    `;
    return;
  }

  elements.resultsTableHeadRow.innerHTML = `
    <th>Rank</th>
    <th>Scenario name</th>
    <th>Trackdrive time [s]</th>
    <th>Completed laps</th>
    <th>Base Trackdrive points</th>
    <th>Lap completion bonus</th>
    <th>Total Trackdrive points</th>
    <th>Notes</th>
  `;
}

function renderEVResults(results) {
  elements.resultsTableBody.innerHTML = results.map((result, index) => `
    <tr>
      <td>${index + 1}</td>
      <td>${escapeHtml(result.name)}</td>
      <td>${formatNumber(result.Tteam, 1)}</td>
      <td>${formatNumber(result.Eteam, 2)}</td>
      <td>${formatNumber(result.EFteam, 0)}</td>
      <td>${formatNumber(result.endurancePoints, 2)}</td>
      <td>${formatNumber(result.efficiencyPoints, 2)}</td>
      <td><strong>${formatNumber(result.combinedPoints, 2)}</strong></td>
      <td>${escapeHtml(result.notes || "-")}</td>
    </tr>
  `).join("");
}

function renderDVResults(results) {
  elements.resultsTableBody.innerHTML = results.map((result, index) => `
    <tr>
      <td>${index + 1}</td>
      <td>${escapeHtml(result.name)}</td>
      <td>${formatNumber(result.Tteam, 1)}</td>
      <td>${formatNumber(result.completedLaps, 0)}</td>
      <td>${formatNumber(result.baseTrackdrivePoints, 2)}</td>
      <td>${formatNumber(result.lapCompletionBonus, 2)}</td>
      <td><strong>${formatNumber(result.totalTrackdrivePoints, 2)}</strong></td>
      <td>${escapeHtml(result.notes || "-")}</td>
    </tr>
  `).join("");
}

function setEmptyResults(message) {
  const colspan = isEVMode() ? 9 : 8;
  elements.resultsTableBody.innerHTML = `
    <tr>
      <td colspan="${colspan}" class="empty-state">${escapeHtml(message)}</td>
    </tr>
  `;
  elements.recommendationContent.className = "recommendation-placeholder";
  elements.recommendationContent.textContent = "Run a calculation to generate a recommendation card.";
}

function renderRecommendation(results) {
  if (!results.length) {
    setEmptyResults("Press Calculate to rank the scenarios.");
    return;
  }

  if (isEVMode()) {
    const bestScenario = results[0];
    const fastestScenario = [...results].sort((a, b) => a.Tteam - b.Tteam)[0];
    const lowestEnergyScenario = [...results].sort((a, b) => a.Eteam - b.Eteam)[0];
    const messages = [];

    if (bestScenario.name === fastestScenario.name && bestScenario.Tteam === fastestScenario.Tteam) {
      messages.push("The fastest scenario also gives the best combined score for the current benchmark assumptions.");
    } else {
      messages.push("The fastest scenario is not the best points strategy because the efficiency penalty is higher than the endurance gain.");
    }

    if (!(bestScenario.name === lowestEnergyScenario.name && bestScenario.Eteam === lowestEnergyScenario.Eteam)) {
      messages.push("The lowest-energy scenario is not necessarily optimal because the time penalty reduces the Endurance score.");
    }

    elements.recommendationContent.className = "recommendation-summary";
    elements.recommendationContent.innerHTML = `
      <p class="section-label">Best scenario</p>
      <h3>${escapeHtml(bestScenario.name)}</h3>
      <p>This scenario gives the highest combined score under the current Endurance and Efficiency benchmark assumptions.</p>
      <div class="recommendation-stats">
        <article class="stat-chip">
          <p class="stat-label">Combined points</p>
          <p class="stat-value">${formatNumber(bestScenario.combinedPoints, 2)}</p>
        </article>
        <article class="stat-chip">
          <p class="stat-label">Endurance points</p>
          <p class="stat-value">${formatNumber(bestScenario.endurancePoints, 2)}</p>
        </article>
        <article class="stat-chip">
          <p class="stat-label">Efficiency points</p>
          <p class="stat-value">${formatNumber(bestScenario.efficiencyPoints, 2)}</p>
        </article>
      </div>
      <p class="comparison-note">${escapeHtml(messages.join(" "))}</p>
    `;
    return;
  }

  const bestScenario = results[0];
  const fastestScenario = [...results].sort((a, b) => a.Tteam - b.Tteam)[0];
  const maximumLaps = Math.max(...results.map((result) => result.completedLaps || 0));
  const messages = [
    "The selected autonomous strategy gives the highest Trackdrive score considering both elapsed time and completed laps."
  ];

  if ((bestScenario.completedLaps || 0) < maximumLaps) {
    messages.push("A slightly slower autonomous run can be better if it increases the probability of completing all laps.");
  } else if (bestScenario.name === fastestScenario.name && bestScenario.Tteam === fastestScenario.Tteam) {
    messages.push("The fastest strategy gives the best score only if the lap completion target is achieved.");
  } else {
    messages.push("A slightly slower autonomous run can be better if it increases the probability of completing all laps.");
  }

  elements.recommendationContent.className = "recommendation-summary";
  elements.recommendationContent.innerHTML = `
    <p class="section-label">Best Trackdrive scenario</p>
    <h3>${escapeHtml(bestScenario.name)}</h3>
    <p>This autonomous strategy gives the highest Trackdrive score for the current benchmark assumptions.</p>
    <div class="recommendation-stats">
      <article class="stat-chip">
        <p class="stat-label">Total Trackdrive points</p>
        <p class="stat-value">${formatNumber(bestScenario.totalTrackdrivePoints, 2)}</p>
      </article>
      <article class="stat-chip">
        <p class="stat-label">Base Trackdrive points</p>
        <p class="stat-value">${formatNumber(bestScenario.baseTrackdrivePoints, 2)}</p>
      </article>
      <article class="stat-chip">
        <p class="stat-label">Lap completion bonus</p>
        <p class="stat-value">${formatNumber(bestScenario.lapCompletionBonus, 2)}</p>
      </article>
    </div>
    <p class="comparison-note">${escapeHtml(messages.join(" "))}</p>
  `;
}

function exportCSV(results) {
  if (!results.length) {
    showError("Calculate results before exporting CSV.");
    return;
  }

  let headers;
  let rows;

  if (isEVMode()) {
    headers = [
      "Rank",
      "Scenario name",
      "Tteam [s]",
      `Eteam [${getEnergyUnitLabel()}]`,
      "EFteam",
      "Endurance points",
      "Efficiency points",
      "Combined points",
      "Notes"
    ];

    rows = results.map((result, index) => ([
      index + 1,
      result.name,
      result.Tteam,
      result.Eteam,
      result.EFteam,
      result.endurancePoints,
      result.efficiencyPoints,
      result.combinedPoints,
      result.notes || ""
    ]));
  } else {
    headers = [
      "Rank",
      "Scenario name",
      "Trackdrive time [s]",
      "Completed laps",
      "Base Trackdrive points",
      "Lap completion bonus",
      "Total Trackdrive points",
      "Notes"
    ];

    rows = results.map((result, index) => ([
      index + 1,
      result.name,
      result.Tteam,
      result.completedLaps,
      result.baseTrackdrivePoints,
      result.lapCompletionBonus,
      result.totalTrackdrivePoints,
      result.notes || ""
    ]));
  }

  const csvContent = [headers, ...rows]
    .map((row) => row.map(csvEscape).join(","))
    .join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = isEVMode() ? "points_strategy_ev_results.csv" : "points_strategy_dv_results.csv";
  link.click();
  URL.revokeObjectURL(url);

  showInfo("CSV exported successfully.");
}

function calculateAllScenarios() {
  clearFeedbackMessages();

  const benchmarks = readBenchmarks();
  const scenarios = readScenarios();

  if (isEVMode()) {
    const validationError = validateEVInputs(benchmarks, scenarios);

    if (validationError) {
      showError(validationError);
      setEmptyResults("Press Calculate to rank the scenarios.");
      state.results = [];
      return;
    }

    const results = scenarios
      .map((scenario) => calculateEVScenario(scenario, benchmarks))
      .sort((a, b) => b.combinedPoints - a.combinedPoints);

    state.results = results;
    renderEVResults(results);
    renderRecommendation(results);
    showInfo(`Calculated ${results.length} Endurance + Efficiency scenario${results.length === 1 ? "" : "s"}.`);
    return;
  }

  const validationError = validateDVInputs(benchmarks, scenarios);

  if (validationError) {
    showError(validationError);
    setEmptyResults("Press Calculate to rank the scenarios.");
    state.results = [];
    return;
  }

  const results = scenarios
    .map((scenario) => calculateDVScenario(scenario, benchmarks))
    .sort((a, b) => b.totalTrackdrivePoints - a.totalTrackdrivePoints);

  state.results = results;
  renderDVResults(results);
  renderRecommendation(results);
  showInfo(`Calculated ${results.length} Trackdrive scenario${results.length === 1 ? "" : "s"}.`);
}

function refreshSectionCopy() {
  if (isEVMode()) {
    elements.scenarioSectionTitle.textContent = "Endurance + Efficiency Scenarios";
    elements.scenarioSectionCopy.textContent = "Each row represents one endurance and energy strategy to compare.";
    elements.resultsSectionCopy.textContent = "Results are automatically sorted from highest to lowest combined score.";
    return;
  }

  elements.scenarioSectionTitle.textContent = "Trackdrive Scenarios";
  elements.scenarioSectionCopy.textContent = "Each row represents one autonomous Trackdrive strategy to compare.";
  elements.resultsSectionCopy.textContent = "Results are automatically sorted from highest to lowest Trackdrive score.";
}

function applySelection() {
  updateModeVisuals();
  updateReferenceFields();
  refreshSectionCopy();
  renderScenarioTableHead();
  renderResultsHeaders();
  updateBenchmarksFromSelection();
  renderBenchmarkCard();
  clearScenarios();
  clearFeedbackMessages();
  state.results = [];
  loadDemoData();
  setEmptyResults("Press Calculate to rank the scenarios.");
}

elements.addScenarioButton.addEventListener("click", () => {
  addScenarioRow();
  hideMessage(elements.infoBanner);
});

elements.calculateButton.addEventListener("click", calculateAllScenarios);

elements.loadDemoButton.addEventListener("click", () => {
  clearFeedbackMessages();
  loadDemoData();
  setEmptyResults("Press Calculate to rank the scenarios.");
});

elements.clearScenariosButton.addEventListener("click", () => {
  clearFeedbackMessages();
  clearScenarios();
  addScenarioRow();
  state.results = [];
  setEmptyResults("Press Calculate to rank the scenarios.");
  showInfo("Scenario table cleared.");
});

elements.exportCsvButton.addEventListener("click", () => {
  clearFeedbackMessages();
  exportCSV(state.results);
});

elements.energyUnitInput.addEventListener("input", () => {
  if (isEVMode()) {
    renderScenarioTableHead();
    renderResultsHeaders();
  }
});

elements.raceSelect.addEventListener("change", () => {
  state.currentRace = elements.raceSelect.value;
  applySelection();
});

elements.modeSelect.addEventListener("change", () => {
  state.currentMode = elements.modeSelect.value;
  applySelection();
});

elements.raceSelect.value = state.currentRace;
elements.modeSelect.value = state.currentMode;
applySelection();
