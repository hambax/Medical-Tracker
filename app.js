const STORAGE_KEY = "medical_tracker_entries_v1";
const PATIENT_KEY = "medical_tracker_patient_v1";
const NAV_KEY = "medical_tracker_nav_collapsed_v1";
const MEDICATION_OPTIONS_KEY = "medical_tracker_medication_options_v1";
const CAREGIVER_OPTIONS_KEY = "medical_tracker_caregiver_options_v1";
const MEDS_PLAN_KEY = "medical_tracker_meds_plan_v1";
const SHEET_API_URL_KEY = "medical_tracker_sheet_api_url_v1";
const AI_SUMMARY_API_URL_KEY = "medical_tracker_ai_summary_api_url_v1";
const DEFAULT_SHEET_API_URL = "";
const GOOGLE_SHEET_URL = "";
let sheetApiUrl = DEFAULT_SHEET_API_URL;
let aiSummaryApiUrl = "";

const state = {
  entries: [],
  patient: {
    name: "One patient",
    context: "Serious illness care log for family caregivers.",
    medications: "Add current medications, usual doses, and timing here.",
    watchList: "Headache, nausea, dizziness, fatigue, confusion, speech changes, seizure activity, balance changes.",
    emergency: "Add emergency contacts, oncology/neurosurgery instructions, and red flag actions here."
  },
  medsPlan: [],
  medsPlanView: "time",
  route: "today"
};

const routeTitles = {
  today: "Today",
  "meds-plan": "Meds Plan",
  history: "History",
  patient: "Patient",
  trends: "Trends",
  settings: "Settings"
};

const typeConfig = {
  Medication: { icon: "medication", color: "Medication", title: "Log medication" },
  Feeling: { icon: "sentiment_satisfied", color: "Feeling", title: "Log feeling" },
  Symptom: { icon: "sick", color: "Symptom", title: "Log symptom" },
  Behaviour: { icon: "psychology", color: "Behaviour", title: "Log behaviour" },
  Food: { icon: "restaurant", color: "Food", title: "Log food" },
  Note: { icon: "edit_note", color: "Note", title: "Add care note" }
};

const defaultNotesPlaceholder = "What happened? What helped?";
const foodNotesPlaceholder = "Here you can list food and drinks consumed and note any changes in taste or preferences";
const foodInstructions = ["No food instruction", "With food", "Before food", "After food", "Without food"];

const presets = {
  feelings: ["Good", "Tired", "Anxious", "Low", "Irritable", "Confused", "In pain", "Nauseous"],
  symptoms: ["Headache", "Dizziness", "Nausea", "Fatigue", "Weakness", "Vision change", "Speech difficulty", "Memory issue", "Seizure", "Sleep issue", "Appetite change"],
  behaviours: ["Confusion", "Agitation", "Repetition", "Forgetfulness", "Mood swing", "Withdrawal", "Restlessness", "Poor concentration", "Speech change", "Balance issue", "Unusual behaviour"],
  mealTypes: ["Breakfast", "Morning tea", "Lunch", "Afternoon tea", "Dinner", "Snack"],
  severity: ["Mild", "Moderate", "Severe"],
  medications: [
    { name: "Dexamethasone", defaultDose: "4mg per tablet" },
    { name: "Ondansetron", defaultDose: "4mg per tablet" },
    { name: "Candesartan cilexetil", defaultDose: "16mg per tablet" },
    { name: "Atorvastatin", defaultDose: "40mg per tablet" },
    { name: "Omeprazole", defaultDose: "20mg per tablet" },
    { name: "Paracetamol", defaultDose: "500mg per tablet" },
    { name: "Ibuprofen", defaultDose: "200mg per tablet" },
    { name: "Magnesium glycinate", defaultDose: "150mg per tablet" }
  ],
  caregivers: ["Caregiver A", "Caregiver B", "Caregiver C", "Nurse", "Doctor", "Paramedic", "Family member", "Friend"]
};

const landingView = document.querySelector('[data-view="landing"]');
const appView = document.querySelector('[data-view="app"]');
const openTrackerButton = document.querySelector("#openTrackerButton");
const demoDataButtons = document.querySelectorAll("[data-demo-data]");
const entryDialog = document.querySelector("#entryDialog");
const entryForm = document.querySelector("#entryForm");
const dynamicFields = document.querySelector("#dynamicFields");
const patientForm = document.querySelector("#patientForm");
const settingsForm = document.querySelector("#settingsForm");
const medsPlanForm = document.querySelector("#medsPlanForm");
const medsPlanEditor = document.querySelector("#medsPlanEditor");
const medsPlanReadable = document.querySelector("#medsPlanReadable");
const medsPlanSyncHint = document.querySelector("#medsPlanSyncHint");
const medicationNamesList = document.querySelector("#medicationNamesList");
const addMedsPlanItemButton = document.querySelector("#addMedsPlanItemButton");
const saveMedsPlanButton = document.querySelector("#saveMedsPlanButton");
const medicationSettingsList = document.querySelector("#medicationSettingsList");
const caregiverSettingsList = document.querySelector("#caregiverSettingsList");
const saveSettingsTopButton = document.querySelector("#saveSettingsTopButton");
const sheetApiUrlInput = document.querySelector("#sheetApiUrl");
const aiSummaryApiUrlInput = document.querySelector("#aiSummaryApiUrl");
const copySetupLinkButton = document.querySelector("#copySetupLinkButton");
const syncButton = document.querySelector("#syncButton");
const exportScope = document.querySelector("#exportScope");
const exportFrom = document.querySelector("#exportFrom");
const exportTo = document.querySelector("#exportTo");
const exportCount = document.querySelector("#exportCount");
const syncHint = document.querySelector("#syncHint");
const dateLabel = document.querySelector("#dateLabel");
const routeTitle = document.querySelector("#routeTitle");
const navToggle = document.querySelector("#navToggle");
const datePicker = document.querySelector("#datePicker");
const timePicker = document.querySelector("#timePicker");
const dateDisplay = document.querySelector("#dateDisplay");
const timeDisplay = document.querySelector("#timeDisplay");
const pdfPreviewDialog = document.querySelector("#pdfPreviewDialog");
const pdfPreviewContent = document.querySelector("#pdfPreviewContent");
const pdfPrintArea = document.querySelector("#pdfPrintArea");
const downloadDialog = document.querySelector("#downloadDialog");
const downloadForm = document.querySelector("#downloadForm");
const downloadFileType = document.querySelector("#downloadFileType");
const downloadFilename = document.querySelector("#downloadFilename");
const downloadSummary = document.querySelector("#downloadSummary");
const downloadFormatNote = document.querySelector("#downloadFormatNote");
const fatigueStats = document.querySelector("#fatigueStats");
const fatigueChart = document.querySelector("#fatigueChart");
const fatigueSummary = document.querySelector("#fatigueSummary");
const fatigueAiResult = document.querySelector("#fatigueAiResult");
const aiFatigueSummaryButton = document.querySelector("#aiFatigueSummaryButton");

let pickerMonth = new Date();
const dirtySettings = {
  medication: new Set(),
  caregiver: new Set(),
  sheet: false,
  ai: false
};
let isMedsPlanDirty = false;
const expandedMedsPlanItems = new Set();
let trendRange = "30";

function loadState() {
  const savedEntries = localStorage.getItem(STORAGE_KEY);
  const savedPatient = localStorage.getItem(PATIENT_KEY);
  const savedMedications = localStorage.getItem(MEDICATION_OPTIONS_KEY);
  const savedCaregivers = localStorage.getItem(CAREGIVER_OPTIONS_KEY);
  const savedMedsPlan = localStorage.getItem(MEDS_PLAN_KEY);
  const savedSheetApiUrl = localStorage.getItem(SHEET_API_URL_KEY);
  const savedAiSummaryApiUrl = localStorage.getItem(AI_SUMMARY_API_URL_KEY);
  const setupSheetApiUrl = setupSheetUrlFromLocation();

  state.entries = savedEntries ? JSON.parse(savedEntries) : seedEntries();
  state.patient = savedPatient ? JSON.parse(savedPatient) : state.patient;
  presets.medications = normalizeMedicationOptions(savedMedications ? JSON.parse(savedMedications) : presets.medications);
  presets.caregivers = savedCaregivers ? JSON.parse(savedCaregivers) : presets.caregivers;
  state.medsPlan = normalizeMedsPlan(savedMedsPlan ? JSON.parse(savedMedsPlan) : []);
  sheetApiUrl = setupSheetApiUrl || savedSheetApiUrl || DEFAULT_SHEET_API_URL;
  aiSummaryApiUrl = savedAiSummaryApiUrl || "";

  if (!savedEntries) saveEntries();
  if (!savedPatient) savePatient();
  if (!savedMedications || savedMedications.includes('"')) saveMedicationOptions();
  if (!savedCaregivers) saveCaregiverOptions();
  if (!savedMedsPlan) saveMedsPlanLocal();
  if (setupSheetApiUrl) saveSheetApiUrlValue(setupSheetApiUrl);
}

function seedEntries() {
  return [];
}

function saveEntries() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.entries));
}

function saveMedsPlanLocal() {
  localStorage.setItem(MEDS_PLAN_KEY, JSON.stringify(state.medsPlan));
}

function saveAiSummaryApiUrl() {
  aiSummaryApiUrl = aiSummaryApiUrlInput.value.trim();
  if (aiSummaryApiUrl) {
    localStorage.setItem(AI_SUMMARY_API_URL_KEY, aiSummaryApiUrl);
  } else {
    localStorage.removeItem(AI_SUMMARY_API_URL_KEY);
  }
}

function aiSummaryEnabled() {
  return aiSummaryApiUrl.startsWith("https://");
}

function syncEnabled() {
  return sheetApiUrl.startsWith("https://");
}

function setupSheetUrlFromLocation() {
  const params = new URLSearchParams(window.location.search);
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const value = params.get("sheet") || params.get("sync") || hashParams.get("sheet") || hashParams.get("sync");
  if (!value) return "";

  const decoded = decodeURIComponent(value).trim();
  if (!decoded.startsWith("https://script.google.com/macros/s/")) return "";

  const cleanUrl = new URL(window.location.href);
  cleanUrl.searchParams.delete("sheet");
  cleanUrl.searchParams.delete("sync");
  if (hashParams.has("sheet") || hashParams.has("sync")) cleanUrl.hash = "";
  window.history.replaceState({}, document.title, cleanUrl.toString());
  return decoded;
}

function jsonpRequest(params) {
  return new Promise((resolve, reject) => {
    const callbackName = `medicalTrackerSheetCallback_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const url = new URL(sheetApiUrl);
    Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
    url.searchParams.set("callback", callbackName);

    const script = document.createElement("script");
    const cleanup = () => {
      script.remove();
      delete window[callbackName];
    };

    window[callbackName] = (payload) => {
      cleanup();
      resolve(payload);
    };
    script.onerror = () => {
      cleanup();
      reject(new Error("Could not reach Google Sheet backend."));
    };
    script.src = url.toString();
    document.body.append(script);
  });
}

async function loadEntriesFromSheet() {
  if (!syncEnabled()) return;
  const response = await jsonpRequest({ action: "listLogs" });
  if (!response.ok) throw new Error(response.error || "Could not load logs.");
  state.entries = response.entries || [];
  saveEntries();
  render();
}

async function loadMedsPlanFromSheet() {
  if (!syncEnabled()) return;
  const response = await jsonpRequest({ action: "listMedicationPlan" });
  if (!response.ok) throw new Error(response.error || "Could not load medication plan.");
  state.medsPlan = normalizeMedsPlan(response.plan || []);
  saveMedsPlanLocal();
  isMedsPlanDirty = false;
  render();
}

function openTracker() {
  landingView.classList.add("is-hidden");
  appView.classList.remove("is-hidden");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function refreshSheetNow() {
  if (!syncEnabled()) {
    alert("Google Sheets sync is not configured.");
    return;
  }

  syncButton.disabled = true;
  syncButton.title = "Refreshing from spreadsheet";
  syncButton.setAttribute("aria-label", "Refreshing from spreadsheet");
  syncButton.innerHTML = '<span class="material-symbols-outlined">progress_activity</span>';

  try {
    await Promise.all([loadEntriesFromSheet(), loadMedsPlanFromSheet()]);
    syncButton.innerHTML = '<span class="material-symbols-outlined">cloud_done</span>';
    syncButton.title = "Spreadsheet refreshed";
    syncButton.setAttribute("aria-label", "Spreadsheet refreshed");
    window.setTimeout(() => {
      syncButton.innerHTML = '<span class="material-symbols-outlined">sync</span>';
      syncButton.title = "Refresh from spreadsheet";
      syncButton.setAttribute("aria-label", "Refresh from spreadsheet");
    }, 1600);
  } catch (error) {
    syncButton.innerHTML = '<span class="material-symbols-outlined">sync_problem</span>';
    syncButton.title = "Refresh failed";
    syncButton.setAttribute("aria-label", "Refresh failed");
    alert(error.message);
  } finally {
    syncButton.disabled = false;
  }
}

async function saveMedsPlanToSheet() {
  if (!syncEnabled()) return false;
  await fetch(sheetApiUrl, {
    method: "POST",
    mode: "no-cors",
    body: JSON.stringify({ action: "saveMedicationPlan", plan: state.medsPlan })
  });
  return true;
}

async function appendEntryToSheet(entry) {
  if (!syncEnabled()) return false;
  await fetch(sheetApiUrl, {
    method: "POST",
    mode: "no-cors",
    body: JSON.stringify({ action: "appendLog", entry })
  });
  return true;
}

async function deleteEntryFromSheet(id) {
  if (!syncEnabled() || !id) return false;
  const response = await jsonpRequest({ action: "deleteLog", id });
  if (!response.ok) throw new Error(response.error || "Could not delete the log from Google Sheets.");
  return response.deleted;
}

function refreshEntriesFromSheetSoon() {
  if (!syncEnabled()) return;
  window.setTimeout(() => {
    loadEntriesFromSheet().catch(() => {});
  }, 1400);
}

function savePatient() {
  localStorage.setItem(PATIENT_KEY, JSON.stringify(state.patient));
}

function saveMedicationOptions() {
  localStorage.setItem(MEDICATION_OPTIONS_KEY, JSON.stringify(presets.medications));
}

function saveCaregiverOptions() {
  localStorage.setItem(CAREGIVER_OPTIONS_KEY, JSON.stringify(presets.caregivers));
}

function saveSheetApiUrl() {
  saveSheetApiUrlValue(sheetApiUrlInput.value.trim());
}

function saveSheetApiUrlValue(value) {
  sheetApiUrl = value;
  if (value) {
    localStorage.setItem(SHEET_API_URL_KEY, value);
  } else {
    localStorage.removeItem(SHEET_API_URL_KEY);
  }
}

function publicSetupLink() {
  const url = new URL(window.location.href);
  url.search = "";
  url.hash = "";
  url.searchParams.set("sync", sheetApiUrlInput.value.trim() || sheetApiUrl);
  return url.toString();
}

function setNavCollapsed(isCollapsed) {
  appView.classList.toggle("nav-collapsed", isCollapsed);
  localStorage.setItem(NAV_KEY, String(isCollapsed));
  navToggle.setAttribute("aria-expanded", String(!isCollapsed));
  navToggle.setAttribute("aria-label", isCollapsed ? "Expand navigation" : "Collapse navigation");
  navToggle.querySelector(".material-symbols-outlined").textContent = isCollapsed ? "left_panel_open" : "left_panel_close";
}

function todayString() {
  return localDateString(new Date());
}

function localDateString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDisplayDate() {
  return new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long"
  }).format(new Date());
}

function formatShortDate(dateString) {
  const [year, month, day] = dateString.split("-").map(Number);
  return `${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}/${year}`;
}

function formatTime(time) {
  if (!time) return "";
  return formatTimeParts(time).label;
}

function formatTimeHtml(time) {
  if (!time) return "";
  const parts = formatTimeParts(time);
  const period = parts.period ? `<span class="time-period">${escapeHtml(parts.period)}</span>` : "";
  return `<span class="time-clock">${escapeHtml(parts.clock)}</span>${period}`;
}

function formatTimeParts(time) {
  const [hour, minute] = time.split(":");
  const date = new Date();
  date.setHours(Number(hour), Number(minute));
  const label = new Intl.DateTimeFormat(undefined, { hour: "2-digit", minute: "2-digit" }).format(date);
  const match = label.match(/^(.+?)\s?([AP]M)$/i);
  return {
    clock: match ? match[1].trim() : label,
    period: match ? match[2].toUpperCase() : "",
    label
  };
}

function daylightGradient(time) {
  if (!time) return "linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)";
  const [hour] = time.split(":").map(Number);
  if (hour < 5) return "linear-gradient(135deg, #172033 0%, #28385d 100%)";
  if (hour < 8) return "linear-gradient(135deg, #fff7ed 0%, #e0f2fe 100%)";
  if (hour < 12) return "linear-gradient(135deg, #ecfeff 0%, #dff7ff 100%)";
  if (hour < 17) return "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)";
  if (hour < 20) return "linear-gradient(135deg, #fff7ed 0%, #fef3c7 45%, #dbeafe 100%)";
  return "linear-gradient(135deg, #111827 0%, #1e3a5f 100%)";
}

function isNightTime(time) {
  if (!time) return false;
  const [hour] = time.split(":").map(Number);
  return hour < 5 || hour >= 20;
}

function setPickerValues(date, time) {
  entryForm.elements.date.value = date;
  entryForm.elements.time.value = time;
  dateDisplay.textContent = formatShortDate(date);
  timeDisplay.innerHTML = formatTimeHtml(time);
  const timeControl = timeDisplay.closest(".picker-control");
  timeControl.style.setProperty("--time-gradient", daylightGradient(time));
  timeControl.classList.toggle("time-night", isNightTime(time));
}

function closePickers() {
  datePicker.classList.add("is-hidden");
  timePicker.classList.add("is-hidden");
}

function renderDatePicker() {
  const selected = entryForm.elements.date.value;
  const selectedDate = selected ? parseLocalDate(selected) : new Date();
  const year = pickerMonth.getFullYear();
  const month = pickerMonth.getMonth();
  const firstDay = new Date(year, month, 1);
  const gridStart = new Date(firstDay);
  gridStart.setDate(firstDay.getDate() - firstDay.getDay());
  const monthLabel = new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric" }).format(firstDay);
  const weekdays = ["S", "M", "T", "W", "T", "F", "S"];
  const days = Array.from({ length: 42 }, (_, index) => {
    const day = new Date(gridStart);
    day.setDate(gridStart.getDate() + index);
    const dayValue = localDateString(day);
    const classes = [
      day.getMonth() !== month ? "is-muted" : "",
      dayValue === localDateString(selectedDate) ? "is-selected" : ""
    ]
      .filter(Boolean)
      .join(" ");
    return `<button class="${classes}" data-date="${dayValue}" type="button">${day.getDate()}</button>`;
  }).join("");

  datePicker.innerHTML = `
    <div class="picker-header">
      <strong>${escapeHtml(monthLabel)}</strong>
      <div class="picker-nav">
        <button data-month-shift="-1" type="button" aria-label="Previous month"><span class="material-symbols-outlined">keyboard_arrow_left</span></button>
        <button data-month-shift="1" type="button" aria-label="Next month"><span class="material-symbols-outlined">keyboard_arrow_right</span></button>
      </div>
    </div>
    <div class="picker-weekdays">${weekdays.map((day) => `<span>${day}</span>`).join("")}</div>
    <div class="date-grid">${days}</div>
  `;
}

function renderTimePicker() {
  const selected = entryForm.elements.time.value;
  const options = [];
  const isQuarterHour = selected.endsWith(":00") || selected.endsWith(":15") || selected.endsWith(":30") || selected.endsWith(":45");
  if (selected && !isQuarterHour) {
    options.push(`<button class="is-selected ${isNightTime(selected) ? "time-night" : ""}" data-time="${selected}" style="--time-gradient: ${daylightGradient(selected)}" type="button">${formatTimeHtml(selected)}</button>`);
  }
  for (let hour = 0; hour < 24; hour += 1) {
    for (let minute = 0; minute < 60; minute += 15) {
      const value = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
      options.push(`<button class="${value === selected ? "is-selected" : ""} ${isNightTime(value) ? "time-night" : ""}" data-time="${value}" style="--time-gradient: ${daylightGradient(value)}" type="button">${formatTimeHtml(value)}</button>`);
    }
  }

  timePicker.innerHTML = `
    <div class="picker-header">
      <strong>Choose time</strong>
      <button class="text-button" data-time-now type="button">Now</button>
    </div>
    <div class="time-grid">${options.join("")}</div>
  `;
}

function parseLocalDate(dateString) {
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function sortEntries(entries) {
  return [...entries].sort((a, b) => `${b.date}T${b.time}`.localeCompare(`${a.date}T${a.time}`));
}

function entryTitle(entry) {
  if (entry.type === "Medication") return `${entry.medicationName || "Medication"}${entry.dose ? `, ${entry.dose}` : ""}`;
  if (entry.type === "Feeling") {
    const feelings = Array.isArray(entry.feeling) ? entry.feeling.join(", ") : entry.feeling;
    return `${feelings || "Feeling"}${entry.severity ? `, ${severityLabel(entry.severity)}` : ""}`;
  }
  if (entry.type === "Symptom") {
    const symptoms = Array.isArray(entry.symptom) ? entry.symptom.join(", ") : entry.symptom;
    return `${symptoms || "Symptom"}${entry.severity ? `, ${severityLabel(entry.severity)}` : ""}`;
  }
  if (entry.type === "Behaviour") {
    const behaviours = Array.isArray(entry.behaviour) ? entry.behaviour.join(", ") : entry.behaviour;
    return `${behaviours || "Behaviour"}${entry.severity ? `, ${severityLabel(entry.severity)}` : ""}`;
  }
  if (entry.type === "Food") return entry.mealType || "Food";
  return "Care note";
}

function severityTerm(value) {
  const score = Number(value);
  if (!Number.isFinite(score)) return String(value || "").toLowerCase();
  if (score <= 2) return "mild";
  if (score <= 5) return "moderate";
  if (score <= 8) return "severe";
  return "extreme";
}

function severityLabel(value) {
  return /^\d+$/.test(String(value)) ? `${value}/10, ${severityTerm(value)}` : String(value).toLowerCase();
}

function entryMeta(entry) {
  const pieces = [];
  if (entry.givenBy) pieces.push(`Given by ${entry.givenBy}`);
  if (entry.notes) pieces.push(entry.notes);
  return pieces.join(" · ");
}

function renderTimeline(container, entries, options = {}) {
  if (!entries.length) {
    container.innerHTML = '<div class="empty-state">No logs yet. Use quick log to add the first one.</div>';
    return;
  }

  container.innerHTML = sortEntries(entries)
    .map((entry) => {
      const config = typeConfig[entry.type] || typeConfig.Note;
      return `
        <article class="timeline-item">
          <div class="timeline-icon">
            <span class="material-symbols-outlined">${config.icon}</span>
          </div>
          <div class="timeline-body">
            <h4>${escapeHtml(entryTitle(entry))}</h4>
            <p>${escapeHtml(entryMeta(entry) || entry.type)}</p>
          </div>
          <div class="timeline-actions">
            ${entry.time ? `<span class="time-pill ${isNightTime(entry.time) ? "time-night" : ""}" style="--time-gradient: ${daylightGradient(entry.time)}">${formatTimeHtml(entry.time)}</span>` : ""}
            ${options.canDelete ? `
              <button class="icon-button delete-log-button" data-delete-log="${escapeHtml(entry.id)}" type="button" title="Delete log" aria-label="Delete ${escapeHtml(entryTitle(entry))}">
                <span class="material-symbols-outlined">delete</span>
              </button>
            ` : ""}
          </div>
        </article>
      `;
    })
    .join("");
}

function timeToMinutes(time) {
  if (!/^\d{2}:\d{2}$/.test(String(time || ""))) return Number.POSITIVE_INFINITY;
  const [hour, minute] = time.split(":").map(Number);
  return hour * 60 + minute;
}

function currentTimeMinutes() {
  return timeToMinutes(new Date().toTimeString().slice(0, 5));
}

function isFutureTodayEntry(entry, nowMinutes = currentTimeMinutes()) {
  const entryMinutes = timeToMinutes(entry.time);
  return entry.date === todayString() && Number.isFinite(entryMinutes) && entryMinutes > nowMinutes;
}

function normalizedMedName(value) {
  return String(value || "").trim().toLowerCase();
}

function normalizedDose(value) {
  return String(value || "").trim().replace(/\s+/g, "").toLowerCase();
}

function doseMatchesPlan(entry, item) {
  if (!normalizedMedName(entry.medicationName) || normalizedMedName(entry.medicationName) !== normalizedMedName(item.medicationName)) return false;
  if (!item.dose || !entry.dose) return true;
  return normalizedDose(entry.dose) === normalizedDose(item.dose);
}

function matchedTodayMedsPlanEntries(planItems, todayMedicationEntries) {
  const unmatched = [...planItems];
  const matched = new Map();
  sortEntries(todayMedicationEntries).reverse().forEach((entry) => {
    const candidates = unmatched
      .filter((item) => doseMatchesPlan(entry, item))
      .sort((a, b) => Math.abs(timeToMinutes(entry.time) - timeToMinutes(a.time)) - Math.abs(timeToMinutes(entry.time) - timeToMinutes(b.time)));
    const selected = candidates[0];
    if (!selected) return;
    matched.set(selected.id, entry);
    unmatched.splice(unmatched.indexOf(selected), 1);
  });
  return matched;
}

function doseUnitName(defaultDose) {
  const text = String(defaultDose || "").toLowerCase();
  if (text.includes("capsule")) return "capsule";
  if (text.includes("sachet")) return "sachet";
  if (text.includes("tablet")) return "tablet";
  if (text.includes("pill")) return "pill";
  return "";
}

function doseAsBaseAmount(dose) {
  const parsed = parseDoseText(dose);
  if (!parsed) return null;
  const unit = parsed.unit.toLowerCase();
  if (unit === "g") return { amount: parsed.amount * 1000, unit: "mg" };
  if (unit === "mcg" || unit === "ug") return { amount: parsed.amount / 1000, unit: "mg" };
  return { amount: parsed.amount, unit };
}

function doseQuantityLabel(item) {
  const defaultDose = medicationDefaultDose(item.medicationName);
  const unitName = doseUnitName(defaultDose);
  const planned = doseAsBaseAmount(item.dose);
  const single = doseAsBaseAmount(defaultDose);
  if (!unitName || !planned || !single || planned.unit !== single.unit || single.amount <= 0) return "";

  const count = planned.amount / single.amount;
  if (!Number.isFinite(count) || count <= 0) return "";
  const rounded = Math.round(count * 10) / 10;
  const countText = Number.isInteger(rounded) ? String(rounded) : String(rounded);
  return `${countText} ${unitName}${rounded === 1 ? "" : "s"}`;
}

function medsPlanItemStatus(item, isGiven, isNext, nowMinutes = currentTimeMinutes()) {
  if (isGiven) return "Given";
  if (isNext) return "Next";
  return timeToMinutes(item.time) < nowMinutes ? "Missed" : "Later";
}

function todayMedsPlanActions(item, status, matchedEntry) {
  if (status === "Next") {
    return `
      <button class="today-dose-button" data-give-plan-dose="${escapeHtml(item.id)}" type="button">
        <span class="material-symbols-outlined">check_circle</span>
        Give dose now
      </button>
    `;
  }

  if (status === "Given" && matchedEntry?.id) {
    return `
      <details class="today-med-menu">
        <summary aria-label="More actions for ${escapeHtml(item.medicationName)}">
          <span class="material-symbols-outlined">more_horiz</span>
        </summary>
        <div class="today-med-menu-popover">
          <button data-unmark-plan-dose="${escapeHtml(matchedEntry.id)}" type="button">
            <span class="material-symbols-outlined">undo</span>
            Mark as not given
          </button>
        </div>
      </details>
    `;
  }

  return "";
}

function renderTodayMedsPlan() {
  const container = document.querySelector("#todayMedsPlan");
  const summary = document.querySelector("#todayMedsSummary");
  const planItems = activeMedsPlan();
  if (!planItems.length) {
    summary.textContent = "No meds plan loaded yet.";
    container.innerHTML = '<div class="empty-state">Add medication times in Meds Plan to see what is due today.</div>';
    return;
  }

  const nowMinutes = currentTimeMinutes();
  const todayMedicationEntries = state.entries.filter((entry) => entry.date === todayString() && entry.type === "Medication" && !isFutureTodayEntry(entry, nowMinutes));
  const matchedEntries = matchedTodayMedsPlanEntries(planItems, todayMedicationEntries);
  const matchedIds = new Set(matchedEntries.keys());
  const nextItem = planItems.find((item) => !matchedIds.has(item.id));
  const givenCount = matchedIds.size;

  summary.textContent = nextItem
    ? `Next: ${nextItem.medicationName} at ${formatPlanTime(nextItem.time || "No time set")}`
    : `All ${planItems.length} planned medication ${planItems.length === 1 ? "time has" : "times have"} been logged today.`;

  container.innerHTML = planItems.map((item) => {
    const isGiven = matchedIds.has(item.id);
    const isNext = nextItem?.id === item.id;
    const status = medsPlanItemStatus(item, isGiven, isNext, nowMinutes);
    const matchedEntry = matchedEntries.get(item.id);
    const quantity = doseQuantityLabel(item);
    const detail = [item.dose, quantity, foodInstructionText(item.foodInstruction)].filter(Boolean).join(" · ");
    return `
      <article class="today-med-item ${isGiven ? "is-given" : ""} ${isNext ? "is-next" : ""}" data-plan-dose="${escapeHtml(item.id)}">
        <span class="today-med-time">${escapeHtml(formatPlanTime(item.time || "No time set"))}</span>
        <div class="today-med-body">
          <h4>${escapeHtml(item.medicationName)}</h4>
          <p>${escapeHtml(detail || "No dose set")}</p>
        </div>
        <div class="today-med-actions">
          <span class="today-med-status status-${status.toLowerCase()}">${escapeHtml(status)}</span>
          ${todayMedsPlanActions(item, status, matchedEntry)}
        </div>
      </article>
    `;
  }).join("");
}

function renderToday() {
  const todayEntries = state.entries.filter((entry) => entry.date === todayString());
  renderTodayMedsPlan();
  renderTimeline(document.querySelector("#todayTimeline"), todayEntries);
}

function entryValues(value) {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  return String(value).split(",").map((item) => item.trim()).filter(Boolean);
}

function isFatigueSymptomEntry(entry) {
  return entry.type === "Symptom"
    && entryValues(entry.symptom).some((symptom) => symptom.toLowerCase() === "fatigue")
    && Number.isFinite(Number(entry.severity));
}

function fatigueLogs() {
  return sortEntries(state.entries.filter(isFatigueSymptomEntry)).map((entry) => ({
    ...entry,
    severityScore: Math.max(0, Math.min(10, Number(entry.severity)))
  }));
}

function trendStartDate(range) {
  if (range === "all") return "";
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - Number(range) + 1);
  return localDateString(date);
}

function filterTrendLogs(logs) {
  const start = trendStartDate(trendRange);
  return start ? logs.filter((entry) => entry.date >= start) : logs;
}

function fatigueDailyPoints(logs) {
  const groups = new Map();
  logs.forEach((entry) => {
    const existing = groups.get(entry.date);
    if (!existing || entry.severityScore > existing.severity) {
      groups.set(entry.date, {
        date: entry.date,
        severity: entry.severityScore,
        time: entry.time,
        notes: entry.notes || ""
      });
    }
  });
  return [...groups.values()].sort((a, b) => a.date.localeCompare(b.date));
}

function average(values) {
  if (!values.length) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function formatAverage(value) {
  return value == null ? "No data" : value.toFixed(1).replace(/\.0$/, "");
}

function lastNDaysAverage(points, days, offsetDays = 0) {
  const end = new Date();
  end.setHours(0, 0, 0, 0);
  end.setDate(end.getDate() - offsetDays);
  const start = new Date(end);
  start.setDate(end.getDate() - days + 1);
  const startValue = localDateString(start);
  const endValue = localDateString(end);
  return average(points.filter((point) => point.date >= startValue && point.date <= endValue).map((point) => point.severity));
}

function trendDirectionLabel(currentAverage, previousAverage) {
  if (currentAverage == null || previousAverage == null) return "Not enough recent data yet.";
  const delta = currentAverage - previousAverage;
  if (Math.abs(delta) < 0.5) return "Fatigue has been broadly steady compared with the previous week.";
  if (delta > 0) return `Fatigue is averaging ${delta.toFixed(1)} points higher than the previous week.`;
  return `Fatigue is averaging ${Math.abs(delta).toFixed(1)} points lower than the previous week.`;
}

function nearbyEntriesForFatigue(points) {
  const fatigueDates = new Set(points.map((point) => point.date));
  return sortEntries(state.entries.filter((entry) => {
    if (!fatigueDates.has(entry.date)) return false;
    if (entry.type === "Symptom" && isFatigueSymptomEntry(entry)) return false;
    return ["Medication", "Food", "Feeling", "Note"].includes(entry.type);
  })).slice(0, 18);
}

function renderFatigueStats(points, logs) {
  const latest = points.at(-1);
  const currentAverage = lastNDaysAverage(points, 7);
  const previousAverage = lastNDaysAverage(points, 7, 7);
  const highest = points.reduce((max, point) => !max || point.severity > max.severity ? point : max, null);
  const stats = [
    ["Latest", latest ? `${latest.severity}/10` : "No data", latest ? formatShortDate(latest.date) : "Add fatigue logs"],
    ["7-day avg", formatAverage(currentAverage), trendDirectionLabel(currentAverage, previousAverage)],
    ["Previous 7 days", formatAverage(previousAverage), "For comparison"],
    ["Highest day", highest ? `${highest.severity}/10` : "No data", highest ? formatShortDate(highest.date) : "No peak yet"],
    ["Fatigue logs", String(logs.length), `${points.length} ${points.length === 1 ? "day" : "days"} charted`]
  ];

  fatigueStats.innerHTML = stats.map(([label, value, detail]) => `
    <article class="trend-stat">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
      <p>${escapeHtml(detail)}</p>
    </article>
  `).join("");
}

function renderFatigueChart(points) {
  if (!points.length) {
    fatigueChart.innerHTML = '<div class="empty-state">No fatigue logs yet. Log Symptom -> Fatigue to start tracking.</div>';
    return;
  }

  const width = 720;
  const height = 300;
  const padding = { top: 24, right: 24, bottom: 42, left: 48 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const xFor = (index) => padding.left + (points.length === 1 ? chartWidth / 2 : (index / (points.length - 1)) * chartWidth);
  const yFor = (severity) => padding.top + ((10 - severity) / 10) * chartHeight;
  const coordinates = points.map((point, index) => `${xFor(index).toFixed(1)},${yFor(point.severity).toFixed(1)}`);
  const areaPath = `M ${coordinates[0]} L ${coordinates.join(" L ")} L ${xFor(points.length - 1).toFixed(1)},${padding.top + chartHeight} L ${xFor(0).toFixed(1)},${padding.top + chartHeight} Z`;
  const tickIndexes = [...new Set([0, Math.floor((points.length - 1) / 2), points.length - 1])];

  fatigueChart.innerHTML = `
    <svg class="trend-chart" viewBox="0 0 ${width} ${height}" role="img" aria-label="Fatigue severity trend from zero to ten">
      <defs>
        <linearGradient id="fatigueTrendFill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stop-color="#8b5cf6" stop-opacity="0.26" />
          <stop offset="100%" stop-color="#f97316" stop-opacity="0.04" />
        </linearGradient>
      </defs>
      ${[0, 2, 4, 6, 8, 10].map((tick) => `
        <line class="trend-grid-line" x1="${padding.left}" x2="${width - padding.right}" y1="${yFor(tick).toFixed(1)}" y2="${yFor(tick).toFixed(1)}" />
        <text class="trend-y-label" x="${padding.left - 14}" y="${yFor(tick).toFixed(1)}">${tick}</text>
      `).join("")}
      <path class="trend-area" d="${areaPath}" />
      <polyline class="trend-line" points="${coordinates.join(" ")}" />
      ${points.map((point, index) => `
        <circle class="trend-point" cx="${xFor(index).toFixed(1)}" cy="${yFor(point.severity).toFixed(1)}" r="${point === points.at(-1) ? 5.5 : 4}">
          <title>${escapeHtml(formatShortDate(point.date))}: ${point.severity}/10${point.notes ? ` - ${escapeHtml(point.notes)}` : ""}</title>
        </circle>
      `).join("")}
      ${tickIndexes.map((index) => `
        <text class="trend-x-label" x="${xFor(index).toFixed(1)}" y="${height - 12}">${escapeHtml(formatShortDate(points[index].date).slice(0, 5))}</text>
      `).join("")}
    </svg>
  `;
}

function renderFatigueSummary(points) {
  if (!points.length) {
    fatigueSummary.innerHTML = '<div class="empty-state">Patterns will appear here once fatigue symptom logs have been added.</div>';
    fatigueAiResult.classList.add("is-hidden");
    return;
  }

  const currentAverage = lastNDaysAverage(points, 7);
  const previousAverage = lastNDaysAverage(points, 7, 7);
  const latest = points.at(-1);
  const highest = points.reduce((max, point) => point.severity > max.severity ? point : max, points[0]);
  const nearby = nearbyEntriesForFatigue(points);
  const relatedTypes = [...new Set(nearby.map((entry) => entry.type))].slice(0, 4);
  const prompts = [
    trendDirectionLabel(currentAverage, previousAverage),
    `Latest fatigue log was ${latest.severity}/10 on ${formatShortDate(latest.date)}.`,
    `Highest charted fatigue was ${highest.severity}/10 on ${formatShortDate(highest.date)}.`,
    relatedTypes.length
      ? `Review nearby ${relatedTypes.join(", ").toLowerCase()} entries with the care team for context.`
      : "Add notes, food, feeling, and medication logs on fatigue days to give the care team more context."
  ];

  fatigueSummary.innerHTML = `
    <div class="trend-summary-list">
      ${prompts.map((prompt) => `
        <article>
          <span class="material-symbols-outlined">forum</span>
          <p>${escapeHtml(prompt)}</p>
        </article>
      `).join("")}
    </div>
  `;
}

function trendRangeLabel() {
  if (trendRange === "all") return "all";
  return `${trendRange} days`;
}

function updateTrendRangeButtons() {
  document.querySelectorAll("[data-trend-range]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.trendRange === trendRange);
  });
}

function renderTrends() {
  updateTrendRangeButtons();
  aiFatigueSummaryButton.classList.toggle("is-hidden", !aiSummaryEnabled());
  const logs = filterTrendLogs(fatigueLogs());
  const points = fatigueDailyPoints(logs);
  renderFatigueStats(points, logs);
  renderFatigueChart(points);
  renderFatigueSummary(points);
  if (!aiSummaryEnabled()) fatigueAiResult.classList.add("is-hidden");
}

async function requestFatigueAiSummary() {
  if (!aiSummaryEnabled()) return;
  const logs = filterTrendLogs(fatigueLogs());
  const points = fatigueDailyPoints(logs);
  if (!points.length) {
    fatigueAiResult.classList.remove("is-hidden");
    fatigueAiResult.innerHTML = '<p>Add fatigue symptom logs before requesting an AI summary.</p>';
    return;
  }

  aiFatigueSummaryButton.disabled = true;
  aiFatigueSummaryButton.innerHTML = '<span class="material-symbols-outlined">progress_activity</span> Summarising';
  fatigueAiResult.classList.remove("is-hidden");
  fatigueAiResult.innerHTML = '<p>Preparing a cautious appointment summary...</p>';

  try {
    const response = await fetch(aiSummaryApiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        patientContext: state.patient.context || "",
        range: trendRangeLabel(),
        fatiguePoints: points,
        nearbyEntries: nearbyEntriesForFatigue(points).map((entry) => ({
          date: entry.date,
          time: entry.time,
          type: entry.type,
          title: entryTitle(entry),
          notes: entry.notes || "",
          severity: entry.severity || ""
        }))
      })
    });
    const payload = await response.json();
    if (!response.ok || !payload.ok) throw new Error(payload.error || "Could not generate the AI summary.");

    const prompts = Array.isArray(payload.discussionPrompts) ? payload.discussionPrompts : [];
    fatigueAiResult.innerHTML = `
      <h4>AI-generated patterns to discuss</h4>
      <p>${escapeHtml(payload.summary || "No summary returned.")}</p>
      ${prompts.length ? `
        <ul>
          ${prompts.map((prompt) => `<li>${escapeHtml(prompt)}</li>`).join("")}
        </ul>
      ` : ""}
    `;
  } catch (error) {
    fatigueAiResult.innerHTML = `<p>${escapeHtml(error.message || "Could not generate the AI summary.")}</p>`;
  } finally {
    aiFatigueSummaryButton.disabled = false;
    aiFatigueSummaryButton.innerHTML = '<span class="material-symbols-outlined">auto_awesome</span> AI summary';
  }
}

function renderHistory() {
  const query = document.querySelector("#historySearch").value.trim().toLowerCase();
  const type = document.querySelector("#typeFilter").value;
  const isRange = document.querySelector("#historyDateScope").value === "range";
  const from = isRange ? document.querySelector("#historyFrom").value : "";
  const to = isRange ? document.querySelector("#historyTo").value : "";
  const filtered = state.entries.filter((entry) => {
    const matchesType = type === "All" || entry.type === type;
    const matchesFrom = !from || entry.date >= from;
    const matchesTo = !to || entry.date <= to;
    const haystack = JSON.stringify(entry).toLowerCase();
    return matchesType && matchesFrom && matchesTo && (!query || haystack.includes(query));
  });

  renderTimeline(document.querySelector("#historyTimeline"), filtered, { canDelete: true });
  renderExportCount();
}

function updateHistoryDateFilters() {
  const isRange = document.querySelector("#historyDateScope").value === "range";
  document.querySelectorAll(".history-date-filter").forEach((field) => {
    field.classList.toggle("is-hidden", !isRange);
  });
  if (!isRange) {
    document.querySelector("#historyFrom").value = "";
    document.querySelector("#historyTo").value = "";
  }
  renderHistory();
}

function exportEntries() {
  return sortEntries(state.entries).filter((entry) => {
    if (exportScope.value !== "range") return true;
    const afterStart = !exportFrom.value || entry.date >= exportFrom.value;
    const beforeEnd = !exportTo.value || entry.date <= exportTo.value;
    return afterStart && beforeEnd;
  });
}

function renderExportCount() {
  const count = exportEntries().length;
  exportCount.textContent = `${count} ${count === 1 ? "log" : "logs"}`;
  syncHint.textContent = syncEnabled()
    ? "Google Sheets sync is configured for this device."
    : "Google Sheets sync is not configured on this device.";
  syncHint.classList.toggle("is-synced", syncEnabled());
}

function entryValue(value) {
  return Array.isArray(value) ? value.join("; ") : value || "";
}

function exportRows() {
  return exportEntries().map((entry) => ({
    Date: entry.date || "",
    Time: formatTime(entry.time || "00:00"),
    Category: entry.type || "",
    Meal: entry.mealType || "",
    Medication: entry.medicationName || "",
    Dose: entry.dose || "",
    "Given by": entry.givenBy || "",
    Feelings: entryValue(entry.feeling),
    Symptoms: entryValue(entry.symptom),
    Behaviours: entryValue(entry.behaviour),
    Severity: entry.severity ? severityLabel(entry.severity) : "",
    Notes: entry.notes || "",
    "Logged at": entry.createdAt || ""
  }));
}

function exportRangeLabel() {
  return exportScope.value === "range"
    ? `${exportFrom.value || "Start"} to ${exportTo.value || "Today"}`
    : "All logs";
}

function printableRows() {
  return exportEntries().map((entry) => {
    const detailParts = [];
    if (entry.medicationName) detailParts.push(entry.medicationName);
    if (entry.mealType) detailParts.push(`Meal: ${entry.mealType}`);
    if (entry.dose) detailParts.push(entry.dose);
    if (entry.givenBy) detailParts.push(`Given by ${entry.givenBy}`);
    if (entryValue(entry.feeling)) detailParts.push(`Feeling: ${entryValue(entry.feeling)}`);
    if (entryValue(entry.symptom)) detailParts.push(`Symptom: ${entryValue(entry.symptom)}`);
    if (entryValue(entry.behaviour)) detailParts.push(`Behaviour: ${entryValue(entry.behaviour)}`);

    return {
      date: entry.date || "",
      time: formatTime(entry.time || "00:00"),
      category: entry.type || "",
      details: detailParts.join(" · ") || entry.type || "",
      severity: entry.severity ? severityLabel(entry.severity) : "",
      notes: entry.notes || ""
    };
  });
}

function pdfDocumentHtml() {
  const rows = printableRows();
  const generatedAt = new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date());

  return `
    <section class="pdf-page">
      <header class="pdf-header">
        <div>
          <p>Medical Tracker care log</p>
          <h1>Doctor review export</h1>
        </div>
        <div>
          <strong>${escapeHtml(exportRangeLabel())}</strong>
          <span>${rows.length} ${rows.length === 1 ? "log" : "logs"}</span>
        </div>
      </header>
      <table class="pdf-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Time</th>
            <th>Type</th>
            <th>Details</th>
            <th>Severity</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>
          ${rows.length ? rows.map((row) => `
            <tr>
              <td>${escapeHtml(row.date)}</td>
              <td>${escapeHtml(row.time)}</td>
              <td>${escapeHtml(row.category)}</td>
              <td>${escapeHtml(row.details)}</td>
              <td>${escapeHtml(row.severity)}</td>
              <td>${escapeHtml(row.notes)}</td>
            </tr>
          `).join("") : '<tr><td colspan="6">No logs in this export range.</td></tr>'}
        </tbody>
      </table>
      <footer class="pdf-footer">
        <span>Generated ${escapeHtml(generatedAt)}</span>
        <span>${escapeHtml(GOOGLE_SHEET_URL || "Private sheet link not configured")}</span>
      </footer>
    </section>
  `;
}

function pdfSafeText(value) {
  return String(value ?? "")
    .normalize("NFKD")
    .replace(/[^\x20-\x7E]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function pdfEscape(value) {
  return pdfSafeText(value)
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

function pdfText(x, y, size, text, font = "F1") {
  return `BT /${font} ${size} Tf ${x} ${y} Td (${pdfEscape(text)}) Tj ET`;
}

function wrapPdfText(value, maxChars) {
  const words = pdfSafeText(value).split(" ").filter(Boolean);
  const lines = [];
  let line = "";

  words.forEach((word) => {
    const next = line ? `${line} ${word}` : word;
    if (next.length <= maxChars) {
      line = next;
      return;
    }
    if (line) lines.push(line);
    line = word.length > maxChars ? `${word.slice(0, maxChars - 1)}...` : word;
  });

  if (line) lines.push(line);
  return lines.length ? lines : [""];
}

function buildPdfPages() {
  const rows = printableRows();
  const pageWidth = 842;
  const pageHeight = 595;
  const margin = 36;
  const columns = [
    { label: "Date", key: "date", x: 36, width: 70, chars: 12 },
    { label: "Time", key: "time", x: 106, width: 52, chars: 9 },
    { label: "Type", key: "category", x: 158, width: 70, chars: 11 },
    { label: "Details", key: "details", x: 228, width: 284, chars: 45 },
    { label: "Severity", key: "severity", x: 512, width: 62, chars: 10 },
    { label: "Notes", key: "notes", x: 574, width: 232, chars: 36 }
  ];
  const pages = [];
  let commands = [];
  let y = 0;

  function startPage() {
    commands = [
      "0.93 0.97 1 rg 0 0 842 595 re f",
      "1 1 1 rg 24 24 794 547 re f",
      "0.82 0.90 0.96 RG 24 24 794 547 re S",
      pdfText(margin, 548, 10, "Medical Tracker care log", "F2"),
      pdfText(margin, 526, 20, "Doctor review export", "F2"),
      pdfText(610, 548, 10, exportRangeLabel(), "F2"),
      pdfText(610, 530, 10, `${rows.length} ${rows.length === 1 ? "log" : "logs"}`),
      "0.86 0.95 1 rg 36 494 770 24 re f",
      "0.74 0.84 0.92 RG 36 494 770 24 re S"
    ];
    columns.forEach((column) => {
      commands.push(pdfText(column.x + 5, 502, 9, column.label, "F2"));
    });
    y = 480;
  }

  function finishPage() {
    commands.push(pdfText(margin, 34, 8, `Generated ${new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date())}`));
    commands.push(pdfText(282, 34, 8, GOOGLE_SHEET_URL || "Private sheet link not configured"));
    pages.push(commands.join("\n"));
  }

  startPage();

  const sourceRows = rows.length ? rows : [{ date: "", time: "", category: "", details: "No logs in this export range.", severity: "", notes: "" }];
  sourceRows.forEach((row) => {
    const wrapped = columns.map((column) => wrapPdfText(row[column.key], column.chars));
    const lineCount = Math.max(...wrapped.map((lines) => lines.length));
    const rowHeight = Math.max(24, lineCount * 11 + 12);

    if (y - rowHeight < 54) {
      finishPage();
      startPage();
    }

    commands.push("1 1 1 rg");
    commands.push(`36 ${y - rowHeight + 8} 770 ${rowHeight} re f`);
    commands.push("0.88 0.93 0.97 RG");
    commands.push(`36 ${y - rowHeight + 8} 770 ${rowHeight} re S`);

    wrapped.forEach((lines, columnIndex) => {
      const column = columns[columnIndex];
      lines.slice(0, 5).forEach((line, lineIndex) => {
        commands.push(pdfText(column.x + 5, y - 5 - lineIndex * 11, 8.5, line));
      });
    });
    y -= rowHeight;
  });

  finishPage();
  return { pages, pageWidth, pageHeight };
}

function exportPdfBlob() {
  const { pages, pageWidth, pageHeight } = buildPdfPages();
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    `<< /Type /Pages /Kids ${pages.map((_, index) => `${5 + index * 2} 0 R`).join(" ")} /Count ${pages.length} >>`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>"
  ];

  pages.forEach((content, index) => {
    const pageObjectNumber = 5 + index * 2;
    const contentObjectNumber = pageObjectNumber + 1;
    objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentObjectNumber} 0 R >>`);
    objects.push(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`);
  });

  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });

  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return new Blob([pdf], { type: "application/pdf" });
}

function pdfFilename() {
  return exportFilename().replace(/\.csv$/, ".pdf");
}

function previewPdfExport() {
  const html = pdfDocumentHtml();
  pdfPreviewContent.innerHTML = html;
  pdfPrintArea.innerHTML = html;
  pdfPreviewDialog.showModal();
}

function printPdfExport() {
  pdfPrintArea.innerHTML = pdfDocumentHtml();
  window.print();
}

function downloadPdfExport(filename = pdfFilename()) {
  const blob = exportPdfBlob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function csvEscape(value) {
  const text = String(value ?? "");
  if (/[",\n\r]/.test(text)) return `"${text.replaceAll('"', '""')}"`;
  return text;
}

function exportCsv() {
  const rows = exportRows();
  const headers = ["Date", "Time", "Category", "Meal", "Medication", "Dose", "Given by", "Feelings", "Symptoms", "Behaviours", "Severity", "Notes", "Logged at"];
  const csvRows = [headers.join(",")];
  rows.forEach((row) => {
    csvRows.push(headers.map((header) => csvEscape(row[header])).join(","));
  });
  return csvRows.join("\n");
}

function exportFilename() {
  const stamp = exportScope.value === "range" && (exportFrom.value || exportTo.value)
    ? `${exportFrom.value || "start"}_to_${exportTo.value || "today"}`
    : "all_logs";
  return `medical_tracker_${stamp}.csv`;
}

function downloadExport(filename = exportFilename()) {
  const csv = exportCsv();
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function extensionForDownloadType(type) {
  return type === "pdf" ? ".pdf" : ".csv";
}

function downloadFilenameForType(type) {
  return type === "pdf" ? pdfFilename() : exportFilename();
}

function normalizeDownloadFilename(value, type) {
  const extension = extensionForDownloadType(type);
  const fallback = downloadFilenameForType(type);
  const clean = String(value || "")
    .trim()
    .replace(/[\\/:*?"<>|]+/g, "-")
    .replace(/\s+/g, "_");
  if (!clean) return fallback;
  return clean.toLowerCase().endsWith(extension) ? clean : `${clean}${extension}`;
}

function updateDownloadDialog() {
  const type = downloadFileType.value;
  const count = exportEntries().length;
  const range = exportRangeLabel();
  downloadSummary.textContent = `${count} ${count === 1 ? "log" : "logs"} selected · ${range}`;
  downloadFilename.value = downloadFilenameForType(type);
  downloadFormatNote.textContent = type === "pdf"
    ? "PDF is best for a clean doctor-review summary that can be printed or shared."
    : "CSV is best for spreadsheets, filtering, and importing into other tools.";
}

function openDownloadDialog() {
  downloadFileType.value = "csv";
  updateDownloadDialog();
  downloadDialog.showModal();
}

function handleDownloadSubmit(event) {
  event.preventDefault();
  const submitter = event.submitter;
  if (submitter?.value === "cancel") {
    downloadDialog.close();
    return;
  }

  const type = downloadFileType.value;
  const filename = normalizeDownloadFilename(downloadFilename.value, type);
  if (type === "pdf") {
    downloadPdfExport(filename);
  } else {
    downloadExport(filename);
  }
  downloadDialog.close();
}

function emailExport() {
  const rows = exportRows();
  const subject = `Medical Tracker care log (${rows.length} ${rows.length === 1 ? "log" : "logs"})`;
  const body = [
    "Medical Tracker care log for doctor review:",
    "",
    GOOGLE_SHEET_URL || "Add your private Google Sheet link here.",
    "",
    `Date range selected in app: ${exportRangeLabel()}`,
    `Log count: ${rows.length}`,
  ].join("\n");
  window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

async function sharePdfExport() {
  const rows = exportRows();
  const subject = `Medical Tracker care log (${rows.length} ${rows.length === 1 ? "log" : "logs"})`;
  const text = [
    "Medical Tracker care log for doctor review:",
    GOOGLE_SHEET_URL || "Add your private Google Sheet link here.",
    "",
    `Date range selected in app: ${exportRangeLabel()}`,
    `Log count: ${rows.length}`
  ].join("\n");
  const file = new File([exportPdfBlob()], pdfFilename(), { type: "application/pdf" });

  if (navigator.canShare?.({ files: [file] }) && navigator.share) {
    try {
      await navigator.share({
        title: subject,
        text,
        files: [file]
      });
      return;
    } catch (error) {
      if (error.name === "AbortError") return;
    }
  }

  downloadPdfExport();
  window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(`${text}\n\nPDF downloaded separately. Attach the downloaded PDF to this email if needed.`)}`;
}

function renderPatient() {
  Object.entries(state.patient).forEach(([key, value]) => {
    const field = patientForm.elements[key];
    if (field) field.value = value;
  });
}

function renderSettings() {
  sheetApiUrlInput.value = sheetApiUrl;
  aiSummaryApiUrlInput.value = aiSummaryApiUrl;

  medicationSettingsList.innerHTML = presets.medications
    .map((medication, index) => `
      <div class="settings-row">
        <label>
          Medication name
          <input name="medicationName_${index}" type="text" value="${escapeHtml(medication.name)}" />
        </label>
        <label>
          Single pill size
          <input name="medicationDose_${index}" type="text" value="${escapeHtml(medication.defaultDose)}" />
        </label>
        ${settingsActionButton("medication", index, dirtySettings.medication.has(index))}
      </div>
    `)
    .join("");

  caregiverSettingsList.innerHTML = presets.caregivers
    .map((caregiver, index) => `
      <div class="settings-row caregiver-row">
        <label>
          Caregiver name
          <input name="caregiver_${index}" type="text" value="${escapeHtml(caregiver)}" />
        </label>
        ${settingsActionButton("caregiver", index, dirtySettings.caregiver.has(index))}
      </div>
    `)
    .join("");
}

function normalizeMedsPlan(plan) {
  return (Array.isArray(plan) ? plan : []).map((item, index) => ({
    id: item.id || crypto.randomUUID(),
    medicationName: item.medicationName || "",
    dose: item.dose || "",
    time: item.time || "",
    sortOrder: Number.isFinite(Number(item.sortOrder)) ? Number(item.sortOrder) : index + 1,
    foodInstruction: foodInstructions.includes(item.foodInstruction) ? item.foodInstruction : "No food instruction",
    notes: item.notes || "",
    isActive: item.isActive === false || item.isActive === "false" ? false : true
  }));
}

function activeMedsPlan() {
  return state.medsPlan
    .filter((item) => item.isActive && item.medicationName)
    .sort((a, b) => `${a.time || "99:99"}-${String(a.sortOrder).padStart(4, "0")}-${a.medicationName}`.localeCompare(`${b.time || "99:99"}-${String(b.sortOrder).padStart(4, "0")}-${b.medicationName}`));
}

function foodInstructionText(value) {
  return value && value !== "No food instruction" ? value : "";
}

function medsPlanMeta(item) {
  return [item.dose, foodInstructionText(item.foodInstruction), item.notes].filter(Boolean).join(" · ");
}

function medsPlanSummaryMeta(item) {
  return [
    item.time ? formatPlanTime(item.time) : "No time set",
    item.dose,
    foodInstructionText(item.foodInstruction),
    item.isActive ? "" : "Inactive"
  ].filter(Boolean).join(" · ") || "No details yet";
}

function medsPlanTimeGroups() {
  const groups = new Map();
  activeMedsPlan().forEach((item) => {
    const time = item.time || "No time set";
    if (!groups.has(time)) groups.set(time, []);
    groups.get(time).push(item);
  });
  return [...groups.entries()];
}

function medsPlanMedicationGroups() {
  const groups = new Map();
  activeMedsPlan().forEach((item) => {
    const name = item.medicationName || "Medication";
    if (!groups.has(name)) groups.set(name, []);
    groups.get(name).push(item);
  });
  return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b));
}

function renderMedsPlanReadable() {
  const groups = state.medsPlanView === "medication" ? medsPlanMedicationGroups() : medsPlanTimeGroups();
  if (!groups.length) {
    medsPlanReadable.innerHTML = '<div class="empty-state">No meds plan yet. Add the first medication time below.</div>';
    return;
  }

  medsPlanReadable.innerHTML = groups.map(([heading, items]) => `
    <section class="meds-plan-group">
      <div class="meds-plan-group-heading">
        <strong>${escapeHtml(state.medsPlanView === "medication" ? heading : formatPlanTime(heading))}</strong>
        <span>${items.length} ${items.length === 1 ? "item" : "items"}</span>
      </div>
      <div class="meds-plan-items">
        ${items.map((item) => `
          <article class="meds-plan-item">
            <div class="meds-plan-item-main">
              <h4>${escapeHtml(state.medsPlanView === "medication" ? formatPlanTime(item.time || "No time set") : item.medicationName)}</h4>
              <p>${escapeHtml(medsPlanMeta(item) || "No extra instruction")}</p>
            </div>
          </article>
        `).join("")}
      </div>
    </section>
  `).join("");
}

function formatPlanTime(value) {
  if (!/^\d{2}:\d{2}$/.test(String(value))) return value;
  return formatTime(value);
}

function renderMedsPlanEditor() {
  medsPlanSyncHint.textContent = syncEnabled()
    ? "Google Sheets sync is configured for the meds plan."
    : "Showing the cached meds plan on this device.";
  medsPlanSyncHint.classList.toggle("is-synced", syncEnabled());
  saveMedsPlanButton.disabled = !isMedsPlanDirty;
  medicationNamesList.innerHTML = medicationNames().map((name) => `<option value="${escapeHtml(name)}"></option>`).join("");

  document.querySelectorAll("[data-meds-plan-view]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.medsPlanView === state.medsPlanView);
  });

  medsPlanEditor.innerHTML = state.medsPlan.length ? state.medsPlan
    .map((item, index) => {
      const isExpanded = expandedMedsPlanItems.has(item.id);
      return `
        <article class="meds-plan-editor-card ${isExpanded ? "is-expanded" : ""}" data-plan-index="${index}">
          <div class="meds-plan-card-summary">
            <div class="meds-plan-card-copy">
              <h4>${escapeHtml(item.medicationName || "New medication")}</h4>
              <p>${escapeHtml(medsPlanSummaryMeta(item))}</p>
            </div>
            <div class="meds-plan-summary-actions">
              <button class="icon-button meds-plan-icon-action" data-edit-plan-item="${index}" type="button" title="${isExpanded ? "Collapse medication plan item" : "Edit medication plan item"}" aria-label="${isExpanded ? "Collapse medication plan item" : "Edit medication plan item"}">
                <span class="material-symbols-outlined">edit</span>
              </button>
              <button class="icon-button meds-plan-icon-action danger" data-remove-plan-item="${index}" type="button" title="Delete medication plan item" aria-label="Delete medication plan item">
                <span class="material-symbols-outlined">delete</span>
              </button>
            </div>
          </div>
          ${isExpanded ? `
            <div class="meds-plan-editor-row">
              <label>
                Medication
                <span class="control-icon-field dropdown-icon-field">
                  <input name="planMedication_${index}" type="text" list="medicationNamesList" value="${escapeHtml(item.medicationName)}" placeholder="Medication name" />
                  <span class="material-symbols-outlined" aria-hidden="true">keyboard_arrow_down</span>
                </span>
              </label>
              <label>
                Dose
                <input name="planDose_${index}" type="text" value="${escapeHtml(item.dose)}" placeholder="e.g. 4mg" />
              </label>
              <label>
                Time
                <span class="control-icon-field">
                  <input name="planTime_${index}" type="text" inputmode="numeric" pattern="[0-9]{2}:[0-9]{2}" value="${escapeHtml(item.time)}" placeholder="09:00" />
                  <span class="material-symbols-outlined" aria-hidden="true">schedule</span>
                </span>
              </label>
              <label>
                Order
                <input name="planOrder_${index}" type="number" min="1" step="1" value="${escapeHtml(item.sortOrder)}" />
              </label>
              <label>
                Food
                <select name="planFood_${index}">
                  ${selectOptions(foodInstructions, item.foodInstruction)}
                </select>
              </label>
              <label class="meds-plan-notes-field">
                Notes
                <input name="planNotes_${index}" type="text" value="${escapeHtml(item.notes)}" placeholder="Extra instruction" />
              </label>
              <label class="meds-plan-active-field">
                Active
                <select name="planActive_${index}">
                  <option value="true" ${item.isActive ? "selected" : ""}>Active</option>
                  <option value="false" ${!item.isActive ? "selected" : ""}>Inactive</option>
                </select>
              </label>
              <div class="meds-plan-card-actions">
                <button class="ghost-button meds-plan-remove" data-remove-plan-item="${index}" type="button">
                  <span class="material-symbols-outlined">delete</span>
                  Remove
                </button>
                <button class="primary-button meds-plan-save-item" data-save-plan-item="${index}" type="button">
                  <span class="material-symbols-outlined">save</span>
                  Save
                </button>
              </div>
            </div>
          ` : ""}
        </article>
      `;
    }).join("") : '<div class="empty-state">No editable medication times yet.</div>';
}

function renderMedsPlan() {
  renderMedsPlanReadable();
  renderMedsPlanEditor();
  enhanceSelects(medsPlanForm);
}

function medsPlanModalHtml() {
  const groups = medsPlanTimeGroups();
  if (!groups.length) return '<p class="helper-text">No active meds plan saved yet.</p>';

  return groups.map(([time, items]) => `
    <section class="meds-plan-modal-group">
      <strong>${escapeHtml(formatPlanTime(time))}</strong>
      ${items.map((item) => `
        <div class="meds-plan-modal-item">
          <div>
            <h4>${escapeHtml(item.medicationName)}</h4>
            <p>${escapeHtml(medsPlanMeta(item) || "No extra instruction")}</p>
          </div>
          <button class="text-button" data-use-plan-item="${escapeHtml(item.id)}" type="button">Use</button>
        </div>
      `).join("")}
    </section>
  `).join("");
}

function useMedsPlanItem(id) {
  const item = state.medsPlan.find((planItem) => planItem.id === id);
  if (!item) return;
  if (entryForm.elements.medicationName && medicationNames().includes(item.medicationName)) {
    entryForm.elements.medicationName.value = item.medicationName;
  }
  if (entryForm.elements.dose) entryForm.elements.dose.value = item.dose || medicationDefaultDose(item.medicationName);
}

function saveEntryRecord(entry, options = {}) {
  state.entries.push(entry);
  saveEntries();
  render();
  if (options.route) setRoute(options.route);

  if (syncEnabled()) {
    appendEntryToSheet(entry)
      .then((didSync) => {
        if (didSync) refreshEntriesFromSheetSoon();
      })
      .catch(() => {});
  }
}

function givePlannedDoseNow(itemId) {
  const item = activeMedsPlan().find((planItem) => planItem.id === itemId);
  if (!item) return;

  const now = new Date();
  const plannedTime = item.time ? `Planned time: ${formatPlanTime(item.time)}.` : "";
  const notes = [plannedTime, item.notes].filter(Boolean).join(" ");
  const entry = {
    id: crypto.randomUUID(),
    type: "Medication",
    date: todayString(),
    time: now.toTimeString().slice(0, 5),
    medicationName: item.medicationName,
    dose: item.dose || medicationDefaultDose(item.medicationName),
    givenBy: "",
    notes,
    createdAt: now.toISOString()
  };

  saveEntryRecord(entry, { route: "today" });
}

function updateMedsPlanFromForm(options = {}) {
  const shouldMarkDirty = options.markDirty !== false;
  const data = new FormData(medsPlanForm);
  state.medsPlan = state.medsPlan.map((item, index) => ({
    ...item,
    medicationName: data.has(`planMedication_${index}`) ? data.get(`planMedication_${index}`).trim() : item.medicationName,
    dose: data.has(`planDose_${index}`) ? data.get(`planDose_${index}`).trim() : item.dose,
    time: data.has(`planTime_${index}`) ? data.get(`planTime_${index}`) : item.time,
    sortOrder: data.has(`planOrder_${index}`) ? Number(data.get(`planOrder_${index}`)) || index + 1 : item.sortOrder,
    foodInstruction: data.has(`planFood_${index}`) ? data.get(`planFood_${index}`) || "No food instruction" : item.foodInstruction,
    notes: data.has(`planNotes_${index}`) ? data.get(`planNotes_${index}`).trim() : item.notes,
    isActive: data.has(`planActive_${index}`) ? data.get(`planActive_${index}`) !== "false" : item.isActive
  }));
  if (shouldMarkDirty) isMedsPlanDirty = true;
  saveMedsPlanLocal();
  saveMedsPlanButton.disabled = !isMedsPlanDirty;
  renderMedsPlanReadable();
}

function addMedsPlanItem() {
  const item = {
    id: crypto.randomUUID(),
    medicationName: medicationNames()[0] || "",
    dose: medicationDefaultDose(medicationNames()[0] || ""),
    time: "",
    sortOrder: state.medsPlan.length + 1,
    foodInstruction: "No food instruction",
    notes: "",
    isActive: true
  };
  state.medsPlan.push(item);
  expandedMedsPlanItems.add(item.id);
  isMedsPlanDirty = true;
  saveMedsPlanLocal();
  renderMedsPlan();
}

async function saveMedsPlanItem(index) {
  updateMedsPlanFromForm();
  const item = state.medsPlan[index];
  if (item) expandedMedsPlanItems.delete(item.id);
  await saveMedsPlan();
}

async function saveMedsPlan() {
  updateMedsPlanFromForm();
  if (!syncEnabled()) {
    alert("Meds plan saved on this device. Add the Apps Script Web App URL in Settings to sync it.");
    isMedsPlanDirty = false;
    renderMedsPlan();
    return;
  }

  saveMedsPlanButton.disabled = true;
  saveMedsPlanButton.innerHTML = '<span class="material-symbols-outlined">progress_activity</span> Saving';
  try {
    await saveMedsPlanToSheet();
    isMedsPlanDirty = false;
    saveMedsPlanButton.innerHTML = '<span class="material-symbols-outlined">check</span> Saved';
    window.setTimeout(() => {
      saveMedsPlanButton.innerHTML = '<span class="material-symbols-outlined">save</span> Save meds plan';
      renderMedsPlan();
    }, 1200);
  } catch (error) {
    saveMedsPlanButton.innerHTML = '<span class="material-symbols-outlined">save</span> Save meds plan';
    saveMedsPlanButton.disabled = false;
    alert(error.message || "Could not save the meds plan.");
  }
}

function settingsActionButton(kind, index, isDirty) {
  const action = isDirty ? "save" : "remove";
  const icon = isDirty ? "save" : "delete";
  const label = isDirty ? "Save" : "Remove";
  return `
    <button class="ghost-button settings-action settings-${action}" data-${action}-setting="${kind}" data-index="${index}" type="button">
      <span class="material-symbols-outlined">${icon}</span>
      ${label}
    </button>
  `;
}

function renderActiveRoute() {
  if (state.route === "today") renderToday();
  if (state.route === "meds-plan") renderMedsPlan();
  if (state.route === "history") renderHistory();
  if (state.route === "trends") renderTrends();
  if (state.route === "patient") renderPatient();
  if (state.route === "settings") renderSettings();
}

function render() {
  dateLabel.textContent = formatDisplayDate();
  renderActiveRoute();
  enhanceSelects();
  updateSettingsSaveButton();
}

function setRoute(route) {
  state.route = route;
  routeTitle.textContent = routeTitles[route] || route.charAt(0).toUpperCase() + route.slice(1);
  document.querySelectorAll("[data-route-panel]").forEach((panel) => {
    panel.classList.toggle("is-active", panel.dataset.routePanel === route);
  });
  document.querySelectorAll(".nav-button").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.route === route);
  });
  renderActiveRoute();
  if (route === "history") renderExportCount();
  enhanceSelects();
  updateSettingsSaveButton();
}

function hasUnsavedSettings() {
  return dirtySettings.medication.size > 0 || dirtySettings.caregiver.size > 0 || dirtySettings.sheet || dirtySettings.ai;
}

function updateSettingsSaveButton() {
  const shouldShow = state.route === "settings";
  const isDirty = hasUnsavedSettings();
  saveSettingsTopButton.classList.toggle("is-hidden", !shouldShow);
  saveSettingsTopButton.disabled = !isDirty;
}

function choiceField(name, label, options, isMultiple = false) {
  return `
    <fieldset>
      <legend>${label}</legend>
      <div class="choice-grid">
        ${options
          .map(
            (option, index) => `
              <label>
                <input type="${isMultiple ? "checkbox" : "radio"}" name="${name}" value="${escapeHtml(option)}" ${!isMultiple && index === 0 ? "checked" : ""} />
                <span>${escapeHtml(option)}</span>
              </label>
            `
          )
          .join("")}
      </div>
    </fieldset>
  `;
}

function severitySliderField() {
  const defaultSeverity = 5;
  return `
    <fieldset class="severity-slider-field">
      <legend>Severity</legend>
      <div class="severity-value" aria-live="polite">
        <strong data-severity-value>${defaultSeverity}</strong>
        <span>/10</span>
        <em data-severity-term>${severityTerm(defaultSeverity)}</em>
      </div>
      <input class="severity-slider" name="severity" type="range" min="0" max="10" step="1" value="${defaultSeverity}" aria-label="Severity from 0 mild to 10 extreme" />
      <div class="severity-scale" aria-hidden="true">
        <span>0 Mild</span>
        <span>10 Extreme</span>
      </div>
    </fieldset>
  `;
}

function normalizeMedicationOptions(options) {
  return options.map((option) => {
    if (typeof option === "string") {
      return { name: option, defaultDose: defaultDoseForMedication(option) };
    }
    return {
      name: option.name || "",
      defaultDose: option.defaultDose || ""
    };
  }).filter((option) => option.name);
}

function defaultDoseForMedication(name) {
  const normalized = name.toLowerCase();
  if (normalized.includes("ibuprofen")) return "200mg per tablet";
  if (normalized.includes("paracetamol")) return "500mg per tablet";
  if (normalized.includes("omeprazole")) return "20mg per tablet";
  if (normalized.includes("atorvastatin")) return "40mg per tablet";
  if (normalized.includes("candesartan")) return "16mg per tablet";
  if (normalized.includes("ondansetron")) return "4mg per tablet";
  if (normalized.includes("dexamethasone") || normalized.includes("dexamethazone")) return "4mg per tablet";
  return "";
}

function medicationNames() {
  return presets.medications.map((medication) => medication.name);
}

function medicationDefaultDose(name) {
  return presets.medications.find((medication) => medication.name === name)?.defaultDose || "";
}

function parseDoseText(value) {
  const match = String(value || "").trim().match(/^(\d+(?:\.\d+)?)\s*([a-zA-Z]+)(.*)$/);
  if (!match) return null;
  return {
    amount: Number(match[1]),
    unit: match[2],
    suffix: match[3].trim()
  };
}

function formatDoseAmount(amount, unit, suffix = "") {
  const cleanAmount = Number.isInteger(amount) ? String(amount) : String(Number(amount.toFixed(2)));
  return suffix ? `${cleanAmount}${unit} ${suffix}` : `${cleanAmount}${unit}`;
}

function selectedMedicationDoseUnit() {
  const selectedMedication = entryForm.elements.medicationName?.value;
  if (selectedMedication && selectedMedication !== "__add__") return medicationDefaultDose(selectedMedication);
  return entryForm.elements.newMedicationDose?.value.trim() || "";
}

function stepMedicationDose(direction) {
  const doseInput = entryForm.elements.dose;
  if (!doseInput) return;

  const baseDose = parseDoseText(selectedMedicationDoseUnit());
  if (!baseDose || !Number.isFinite(baseDose.amount) || baseDose.amount <= 0) return;

  const currentDose = parseDoseText(doseInput.value);
  const currentAmount = currentDose && currentDose.unit.toLowerCase() === baseDose.unit.toLowerCase()
    ? currentDose.amount
    : baseDose.amount;
  const nextAmount = Math.max(baseDose.amount, currentAmount + baseDose.amount * direction);

  doseInput.value = nextAmount === baseDose.amount
    ? formatDoseAmount(baseDose.amount, baseDose.unit, baseDose.suffix)
    : formatDoseAmount(nextAmount, baseDose.unit);
}

function selectOptions(options, selected = "") {
  return options.map((option) => `<option value="${escapeHtml(option)}" ${option === selected ? "selected" : ""}>${escapeHtml(option)}</option>`).join("");
}

function customSelectLabel(select) {
  return select.selectedOptions[0]?.textContent || select.options[0]?.textContent || "";
}

function closeCustomSelect(wrapper) {
  if (!wrapper) return;
  wrapper.classList.remove("is-open");
  wrapper.querySelector(".custom-select-button")?.setAttribute("aria-expanded", "false");
  wrapper.querySelector(".custom-select-menu")?.classList.add("is-hidden");
}

function closeCustomSelects(exceptWrapper = null) {
  document.querySelectorAll("[data-custom-select-wrapper]").forEach((wrapper) => {
    if (wrapper !== exceptWrapper) closeCustomSelect(wrapper);
  });
}

function syncCustomSelect(wrapper) {
  if (!wrapper) return;
  const select = wrapper.querySelector("select");
  const value = wrapper.querySelector(".custom-select-value");
  const menu = wrapper.querySelector(".custom-select-menu");
  if (!select || !value || !menu) return;

  value.textContent = customSelectLabel(select);
  menu.innerHTML = "";
  Array.from(select.options).forEach((option) => {
    const optionButton = document.createElement("button");
    optionButton.className = `custom-select-option ${option.selected ? "is-selected" : ""}`;
    optionButton.disabled = option.disabled;
    optionButton.role = "option";
    optionButton.type = "button";
    optionButton.textContent = option.textContent;
    optionButton.setAttribute("aria-selected", String(option.selected));
    optionButton.addEventListener("click", () => {
      select.value = option.value;
      syncCustomSelect(wrapper);
      closeCustomSelect(wrapper);
      select.dispatchEvent(new Event("change", { bubbles: true }));
    });
    menu.append(optionButton);
  });
}

function enhanceSelects(root = document) {
  root.querySelectorAll("select").forEach((select) => {
    if (select.dataset.customSelect === "true") {
      syncCustomSelect(select.closest("[data-custom-select-wrapper]"));
      return;
    }

    const wrapper = document.createElement("div");
    wrapper.className = "custom-select";
    wrapper.dataset.customSelectWrapper = "";

    const button = document.createElement("button");
    button.className = "custom-select-button";
    button.type = "button";
    button.setAttribute("aria-expanded", "false");
    button.setAttribute("aria-haspopup", "listbox");
    button.innerHTML = `
      <span class="custom-select-value"></span>
      <span class="material-symbols-outlined" aria-hidden="true">keyboard_arrow_down</span>
    `;

    const menu = document.createElement("div");
    menu.className = "custom-select-menu is-hidden";
    menu.role = "listbox";

    select.dataset.customSelect = "true";
    select.classList.add("native-select-hidden");
    select.tabIndex = -1;
    select.parentNode.insertBefore(wrapper, select);
    wrapper.append(select, button, menu);

    button.addEventListener("click", () => {
      const isOpen = wrapper.classList.contains("is-open");
      closeCustomSelects(wrapper);
      wrapper.classList.toggle("is-open", !isOpen);
      button.setAttribute("aria-expanded", String(!isOpen));
      menu.classList.toggle("is-hidden", isOpen);
    });
    select.addEventListener("change", () => syncCustomSelect(wrapper));
    syncCustomSelect(wrapper);
  });
}

function quickSelectField(name, label, options, selected) {
  return `
    <label>
      ${label}
      <select name="${name}" data-quick-select="${name}">
        ${selectOptions(options, selected)}
        <option value="">Not sure yet</option>
        <option value="__add__">Add new...</option>
      </select>
    </label>
  `;
}

function openEntryDialog(type) {
  entryForm.reset();
  entryForm.elements.type.value = type;
  setPickerValues(todayString(), new Date().toTimeString().slice(0, 5));
  pickerMonth = parseLocalDate(entryForm.elements.date.value);
  closePickers();
  document.querySelector("#entryTitle").textContent = typeConfig[type].title;
  document.querySelector("#entryEyebrow").textContent = "Quick log";
  dynamicFields.innerHTML = fieldsForType(type);
  entryForm.elements.notes.placeholder = type === "Food" ? foodNotesPlaceholder : defaultNotesPlaceholder;
  enhanceSelects(entryForm);
  entryDialog.showModal();
}

function fieldsForType(type) {
  if (type === "Medication") {
    const defaultMedication = medicationNames()[0] || "";
    return `
      ${quickSelectField("medicationName", "Medication", medicationNames(), defaultMedication)}
      <div class="inline-add-fields is-hidden" data-add-fields="medicationName">
        <label>
          New Medication Name
          <input name="newMedicationName" type="text" placeholder="Medication name" />
        </label>
        <label>
          Single pill size
          <input name="newMedicationDose" type="text" placeholder="e.g. 200mg per tablet" />
        </label>
      </div>
      <div class="field-row">
        <label class="dose-field">
          Dose
          <div class="dose-stepper">
            <button class="dose-step-button" data-dose-step="-1" type="button" aria-label="Decrease dose">
              <span class="material-symbols-outlined">remove</span>
            </button>
            <input name="dose" type="text" placeholder="Dose given" value="${escapeHtml(medicationDefaultDose(defaultMedication))}" />
            <button class="dose-step-button" data-dose-step="1" type="button" aria-label="Increase dose">
              <span class="material-symbols-outlined">add</span>
            </button>
          </div>
        </label>
        ${quickSelectField("givenBy", "Given by", presets.caregivers, "Caregiver A")}
      </div>
      <div class="inline-add-fields is-hidden" data-add-fields="givenBy">
        <label>
          New Caregiver Name
          <input name="newCaregiverName" type="text" placeholder="Caregiver name" />
        </label>
      </div>
      <details class="meds-plan-accordion">
        <summary>
          <span class="material-symbols-outlined">medication_liquid</span>
          View meds plan
        </summary>
        <div class="meds-plan-modal-list">
          ${medsPlanModalHtml()}
        </div>
      </details>
    `;
  }

  if (type === "Feeling") {
    return `${choiceField("feeling", "Feeling", presets.feelings, true)}${severitySliderField()}`;
  }

  if (type === "Symptom") {
    return `${choiceField("symptom", "Symptom", presets.symptoms, true)}${severitySliderField()}`;
  }

  if (type === "Behaviour") {
    return `${choiceField("behaviour", "Behaviour", presets.behaviours, true)}${severitySliderField()}`;
  }

  if (type === "Food") {
    return `
      <label>
        Meal
        <select name="mealType">
          <option value="">Not sure yet</option>
          ${selectOptions(presets.mealTypes)}
        </select>
      </label>
    `;
  }

  return "";
}

async function handleEntrySubmit(event) {
  event.preventDefault();
  const submitter = event.submitter;
  if (submitter?.value === "cancel") {
    entryDialog.close();
    return;
  }

  const formData = new FormData(entryForm);
  const entry = {};
  formData.forEach((value, key) => {
    if (entry[key]) {
      entry[key] = Array.isArray(entry[key]) ? [...entry[key], value] : [entry[key], value];
    } else {
      entry[key] = value;
    }
  });
  Object.keys(entry).forEach((key) => {
    if (entry[key] === "__add__") entry[key] = "";
  });
  if (entry.type === "Medication") {
    const newMedicationName = entry.newMedicationName?.trim();
    const newMedicationDose = entry.newMedicationDose?.trim();
    const newCaregiverName = entry.newCaregiverName?.trim();

    if (newMedicationName) {
      entry.medicationName = newMedicationName;
      if (!entry.dose) entry.dose = newMedicationDose || "";
      if (!presets.medications.some((option) => option.name.toLowerCase() === newMedicationName.toLowerCase())) {
        presets.medications.push({ name: newMedicationName, defaultDose: newMedicationDose || "" });
        saveMedicationOptions();
      }
    }

    if (newCaregiverName) {
      entry.givenBy = newCaregiverName;
      if (!presets.caregivers.some((option) => option.toLowerCase() === newCaregiverName.toLowerCase())) {
        presets.caregivers.push(newCaregiverName);
        saveCaregiverOptions();
      }
    }
  }
  delete entry.newMedicationName;
  delete entry.newMedicationDose;
  delete entry.newCaregiverName;
  const savedEntry = {
    ...entry,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString()
  };
  entryDialog.close();
  saveEntryRecord(savedEntry, { route: "today" });
}

function deleteEntry(id) {
  const entry = state.entries.find((item) => item.id === id);
  if (!entry) return;
  const confirmed = window.confirm(`Delete this ${entry.type.toLowerCase()} log?`);
  if (!confirmed) return;

  state.entries = state.entries.filter((item) => item.id !== id);
  saveEntries();
  render();

  if (syncEnabled()) {
    deleteEntryFromSheet(id)
      .then((didSync) => {
        if (didSync) {
          refreshEntriesFromSheetSoon();
          return;
        }
        loadEntriesFromSheet().catch(() => {});
      })
      .catch((error) => {
        loadEntriesFromSheet().catch(() => {});
        alert(error.message || "Could not delete the log from Google Sheets.");
      });
  }
}

function demoEntry(day, time, type, fields = {}) {
  const date = demoDate(day);
  return {
    id: crypto.randomUUID(),
    type,
    date,
    time,
    createdAt: `${date}T${time}:00.000`,
    ...fields
  };
}

function demoDate(dayOffset) {
  const date = new Date(demoDate.start);
  date.setDate(demoDate.start.getDate() + dayOffset);
  return localDateString(date);
}

function demoMed(day, time, medicationName, dose, notes = "", givenBy = "Caregiver A") {
  return demoEntry(day, time, "Medication", {
    medicationName,
    dose,
    givenBy,
    notes
  });
}

function demoMedicationSchedule(day) {
  const week = Math.floor(day / 7);
  const meds = [
    ["08:00", "Levetiracetam", "500mg", "Anti-seizure medicine. Demo example only."],
    ["20:00", "Levetiracetam", "500mg", "Evening anti-seizure medicine. Demo example only."]
  ];

  if (week <= 1) {
    meds.push(
      ["08:30", "Dexamethasone", week === 0 ? "4mg" : "2mg", "Steroid plan after diagnosis/surgery review. Demo example only."],
      ["12:30", "Dexamethasone", week === 0 ? "4mg" : "2mg", "Second steroid dose while swelling is monitored."],
      ["08:15", "Omeprazole", "20mg", "Stomach protection while taking steroid."]
    );
  } else if (week <= 3) {
    meds.push(
      ["08:30", "Dexamethasone", week === 2 ? "1mg" : "0.5mg", "Tapering steroid dose after clinical review. Demo example only."],
      ["08:15", "Omeprazole", "20mg", "Continued while steroid is tapering."]
    );
  } else if (week <= 7) {
    meds.push(
      ["08:15", "Omeprazole", "20mg", "Stomach protection during treatment period."],
      ["18:30", "Ondansetron", "4mg", "Given before evening oncology medicine for nausea prevention."],
      ["21:00", "Temozolomide", "per oncology cycle", "Chemotherapy example during radiotherapy. Demo only, not dosing guidance."]
    );
    if ([1, 3, 5].includes(parseLocalDate(demoDate(day)).getDay())) {
      meds.push(["09:00", "Trimethoprim/sulfamethoxazole", "per oncology plan", "Infection-prevention example used in some oncology plans. Demo only."]);
    }
    if (day >= 41 && day <= 48) {
      meds.push(["08:30", "Dexamethasone", "1mg", "Short steroid increase after worsening headache, reviewed by clinic. Demo only."]);
    }
  } else {
    meds.push(
      ["08:15", "Omeprazole", "20mg", "Continued until medication review."],
      ["21:30", "Melatonin", "2mg", "Sleep support after steroid-related sleep disruption."]
    );
    if (day % 6 === 0) {
      meds.push(["18:30", "Ondansetron", "4mg", "Used as needed for nausea on lower appetite days."]);
    }
  }

  if (day % 3 === 0) {
    meds.push(["14:00", "Paracetamol", "1g", "Used for headache/discomfort if needed."]);
  }
  if (day >= 32 && day <= 58) {
    meds.push(["19:30", "Macrogol", "one sachet", "Bowel support while appetite and activity are reduced."]);
  }

  return meds;
}

function demoFatigueSeverity(day) {
  const wave = day % 6 === 0 ? 1 : day % 6 === 2 ? 0 : -1;
  if (day < 8) return Math.min(10, 6 + wave);
  if (day < 28) return Math.max(2, 4 + wave);
  if (day < 42) return Math.min(10, 6 + wave);
  if (day < 63) return Math.min(10, 8 + wave);
  if (day < 76) return Math.max(3, 6 + wave);
  return Math.max(2, 5 + wave);
}

function demoMedsPlan() {
  const plan = [
    ["Levetiracetam", "500mg", "08:00", "No food instruction", "Anti-seizure medicine. Demo example only."],
    ["Omeprazole", "20mg", "08:15", "Before food", "Stomach protection while other medicines are reviewed."],
    ["Ondansetron", "4mg", "18:30", "No food instruction", "As needed for nausea."],
    ["Levetiracetam", "500mg", "20:00", "No food instruction", "Evening anti-seizure medicine."],
    ["Melatonin", "2mg", "21:30", "No food instruction", "Sleep support if needed."]
  ];

  return plan.map(([medicationName, dose, time, foodInstruction, notes], index) => ({
    id: crypto.randomUUID(),
    medicationName,
    dose,
    time,
    sortOrder: index + 1,
    foodInstruction,
    notes,
    isActive: true
  }));
}

function buildDemoData() {
  demoDate.start = new Date();
  demoDate.start.setHours(0, 0, 0, 0);
  demoDate.start.setDate(demoDate.start.getDate() - 89);

  const entries = [];
  const finalDemoDay = 89;
  const nowMinutes = currentTimeMinutes();
  const isFutureDemoTime = (day, time) => day === finalDemoDay && timeToMinutes(time) > nowMinutes;
  const milestoneNotes = [
    [0, "09:20", "Diagnosis meeting", "MRI and neurosurgery review discussed a suspected high-grade brain tumour. Family started a shared log for medicines, symptoms, questions, and appointments."],
    [2, "17:10", "Pre-surgery planning", "Blood tests, medication review, and consent appointment completed. Patient anxious but relieved to have a plan."],
    [5, "19:00", "Surgery recovery", "Returned from surgery tired and sleepy. Nurses monitoring speech, arm strength, wound dressing, pain, and nausea."],
    [8, "11:45", "Ward physiotherapy", "Short supported walk on the ward. Balance unsteady at first, improved with rest and handrail."],
    [13, "15:10", "Home routine", "Family set up a quiet medication station, phone alarms, and a whiteboard for clinic questions."],
    [21, "10:30", "Pathology review", "Oncology team explained the treatment plan and likely side effects. Family asked about fatigue, nausea, seizures, and when to call urgently."],
    [28, "14:00", "Radiotherapy mask fitting", "Planning appointment completed. Patient found the mask uncomfortable but managed with coaching and slow breathing."],
    [35, "16:20", "First treatment week", "Radiotherapy and evening chemotherapy routine started. Main issues were fatigue, reduced appetite, and worry before appointments."],
    [44, "08:50", "Steroid review", "Clinic advised a short steroid increase after morning headaches became more noticeable. Family tracking sleep and appetite closely."],
    [56, "17:30", "Mid-treatment fatigue", "Needed more rest after appointments. Family agreed to keep evenings quiet and move visitors to shorter daytime windows."],
    [64, "12:15", "Treatment break", "Short break from daily hospital visits. Appetite still variable; patient enjoyed small portions and cold drinks."],
    [75, "09:40", "Rehabilitation check-in", "Speech therapy and occupational therapy reviewed memory prompts, fatigue pacing, and safe shower routine."],
    [89, "15:35", "Three-month review", "Scan review day. Family brought timeline export to clinic to discuss headaches, fatigue, sleep, appetite, and medication changes."]
  ];

  for (let day = 0; day < 90; day += 1) {
    demoMedicationSchedule(day).filter(([time]) => !isFutureDemoTime(day, time)).forEach(([time, medicationName, dose, notes], index) => {
      entries.push(demoMed(day, time, medicationName, dose, notes, index % 2 === 0 ? "Caregiver A" : "Caregiver B"));
    });

    if (day % 2 === 0 && !isFutureDemoTime(day, "10:15")) {
      const severity = String(demoFatigueSeverity(day));
      entries.push(demoEntry(day, "10:15", "Symptom", {
        symptom: day % 6 === 0 ? ["Fatigue", "Headache", "Nausea"] : day % 4 === 0 ? ["Fatigue", "Appetite change"] : ["Fatigue"],
        severity,
        notes: day < 28
          ? "Morning symptoms checked before medication and appointments. Improved with rest and small fluids."
          : day < 63
            ? "Treatment fatigue more obvious today. Planned rest after hospital visit."
            : "Fatigue still present but easier to pace with shorter visits and quieter evenings."
      }));
    }

    if (day % 3 === 1 && !isFutureDemoTime(day, "13:00")) {
      entries.push(demoEntry(day, "13:00", "Food", {
        mealType: "Lunch",
        notes: day < 35
          ? "Managed soup, toast, and water. Taste mostly normal."
          : "Smaller portion than usual. Cold fruit and electrolyte drink easier than hot food."
      }));
    }

    if (day % 4 === 2 && !isFutureDemoTime(day, "18:45")) {
      entries.push(demoEntry(day, "18:45", "Feeling", {
        feeling: day < 21 ? ["Anxious", "Tired"] : day < 63 ? ["Tired", "Low"] : ["Tired"],
        severity: day < 21 ? "6" : "5",
        notes: "Settled after quiet time, reassurance, and fewer conversations at once."
      }));
    }

    if (day % 7 === 4 && !isFutureDemoTime(day, "20:10")) {
      entries.push(demoEntry(day, "20:10", "Behaviour", {
        behaviour: day < 30 ? ["Forgetfulness", "Poor concentration"] : ["Poor concentration", "Withdrawal"],
        severity: "4",
        notes: "Needed reminders for steps in the evening routine. One instruction at a time worked best."
      }));
    }
  }

  milestoneNotes.forEach(([day, time, heading, note]) => {
    if (isFutureDemoTime(day, time)) return;
    entries.push(demoEntry(day, time, "Note", {
      notes: `${heading}: ${note}`
    }));
  });

  return {
    entries,
    patient: {
      name: "Demo patient",
      context: "Fully synthetic brain tumour care demo covering diagnosis, surgery recovery, treatment planning, chemoradiation, symptom changes, and review over three months.",
      medications: "Demo only, not medical advice: anti-seizure medicine, steroid/taper periods, stomach protection, nausea support, pain relief, bowel support, sleep support, and oncology-cycle examples.",
      watchList: "Worsening headache, vomiting, seizure activity, new weakness, speech change, confusion, fever, dehydration, falls, severe drowsiness, or sudden behaviour change.",
      emergency: "Demo only: follow the treating team's urgent-care instructions. Call local emergency services for severe or sudden symptoms."
    },
    medications: normalizeMedicationOptions([
      { name: "Levetiracetam", defaultDose: "500mg per tablet" },
      { name: "Dexamethasone", defaultDose: "1mg per tablet" },
      { name: "Omeprazole", defaultDose: "20mg per capsule" },
      { name: "Ondansetron", defaultDose: "4mg per tablet" },
      { name: "Temozolomide", defaultDose: "per oncology cycle" },
      { name: "Trimethoprim/sulfamethoxazole", defaultDose: "per oncology plan" },
      { name: "Paracetamol", defaultDose: "500mg per tablet" },
      { name: "Macrogol", defaultDose: "one sachet" },
      { name: "Melatonin", defaultDose: "2mg per tablet" }
    ]),
    caregivers: ["Caregiver A", "Caregiver B", "Nurse", "Doctor", "Family member"],
    medsPlan: demoMedsPlan()
  };
}

function loadDemoData() {
  const confirmed = window.confirm("Load fictional demo data? This replaces Medical Tracker data stored in this browser only. It will not write to Google Sheets.");
  if (!confirmed) return;

  const demo = buildDemoData();
  state.entries = demo.entries;
  state.patient = demo.patient;
  state.medsPlan = demo.medsPlan;
  presets.medications = demo.medications;
  presets.caregivers = demo.caregivers;
  isMedsPlanDirty = false;
  expandedMedsPlanItems.clear();
  dirtySettings.medication.clear();
  dirtySettings.caregiver.clear();

  saveEntries();
  savePatient();
  saveMedsPlanLocal();
  saveMedicationOptions();
  saveCaregiverOptions();

  openTracker();
  setRoute("today");
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function activeOptionList(name) {
  if (name === "medicationName") {
    return {
      values: medicationNames(),
      save: saveMedicationOptions,
      label: "medication"
    };
  }

  return {
    values: presets.caregivers,
    save: saveCaregiverOptions,
    label: "caregiver"
  };
}

function refreshMedicationFields() {
  const currentMedication = entryForm.elements.medicationName?.value;
  const currentCaregiver = entryForm.elements.givenBy?.value;
  const currentDose = entryForm.elements.dose?.value;
  dynamicFields.innerHTML = fieldsForType("Medication");
  if (entryForm.elements.medicationName && medicationNames().includes(currentMedication)) {
    entryForm.elements.medicationName.value = currentMedication;
  }
  if (entryForm.elements.givenBy && presets.caregivers.includes(currentCaregiver)) {
    entryForm.elements.givenBy.value = currentCaregiver;
  }
  if (entryForm.elements.dose) entryForm.elements.dose.value = currentDose || "";
}

function toggleInlineAddFields(name, shouldShow) {
  const fields = dynamicFields.querySelector(`[data-add-fields="${name}"]`);
  fields?.classList.toggle("is-hidden", !shouldShow);
  if (shouldShow) {
    fields?.querySelector("input")?.focus();
  }
}

function removeQuickOption(name) {
  const select = entryForm.elements[name];
  const value = select?.value;
  const list = activeOptionList(name);
  if (!value || value === "__add__" || list.values.length <= 1) return;

  if (name === "medicationName") {
    presets.medications = presets.medications.filter((option) => option.name !== value);
  }
  if (name === "givenBy") {
    presets.caregivers = presets.caregivers.filter((option) => option !== value);
  }
  list.save();
  refreshMedicationFields();
}

document.querySelectorAll("[data-route]").forEach((button) => {
  button.addEventListener("click", () => setRoute(button.dataset.route));
});

document.querySelectorAll("[data-entry-type]").forEach((button) => {
  button.addEventListener("click", () => openEntryDialog(button.dataset.entryType));
});

openTrackerButton?.addEventListener("click", openTracker);
document.querySelectorAll("[data-open-tracker]").forEach((button) => {
  button.addEventListener("click", openTracker);
});
demoDataButtons.forEach((button) => {
  button.addEventListener("click", loadDemoData);
});
document.querySelector("#todayMedsPlan").addEventListener("click", (event) => {
  const giveButton = event.target.closest("[data-give-plan-dose]");
  if (giveButton) {
    givePlannedDoseNow(giveButton.dataset.givePlanDose);
    return;
  }

  const unmarkButton = event.target.closest("[data-unmark-plan-dose]");
  if (unmarkButton) {
    deleteEntry(unmarkButton.dataset.unmarkPlanDose);
  }
});

navToggle.addEventListener("click", () => {
  setNavCollapsed(!appView.classList.contains("nav-collapsed"));
});
document.querySelectorAll("[data-picker]").forEach((button) => {
  button.addEventListener("click", () => {
    const pickerType = button.dataset.picker;
    const picker = pickerType === "date" ? datePicker : timePicker;
    const isOpen = !picker.classList.contains("is-hidden");
    closePickers();
    if (!isOpen) {
      if (pickerType === "date") renderDatePicker();
      if (pickerType === "time") renderTimePicker();
      picker.classList.remove("is-hidden");
    }
  });
});
datePicker.addEventListener("click", (event) => {
  const monthButton = event.target.closest("[data-month-shift]");
  const dateButton = event.target.closest("[data-date]");
  if (monthButton) {
    pickerMonth.setMonth(pickerMonth.getMonth() + Number(monthButton.dataset.monthShift));
    renderDatePicker();
  }
  if (dateButton) {
    setPickerValues(dateButton.dataset.date, entryForm.elements.time.value);
    pickerMonth = parseLocalDate(dateButton.dataset.date);
    closePickers();
  }
});
timePicker.addEventListener("click", (event) => {
  const nowButton = event.target.closest("[data-time-now]");
  const timeButton = event.target.closest("[data-time]");
  if (nowButton) {
    setPickerValues(entryForm.elements.date.value, new Date().toTimeString().slice(0, 5));
    closePickers();
  }
  if (timeButton) {
    setPickerValues(entryForm.elements.date.value, timeButton.dataset.time);
    closePickers();
  }
});
document.querySelector("#historySearch").addEventListener("input", renderHistory);
document.querySelector("#typeFilter").addEventListener("change", renderHistory);
document.querySelector("#historyDateScope").addEventListener("change", updateHistoryDateFilters);
document.querySelector("#historyFrom").addEventListener("change", renderHistory);
document.querySelector("#historyTo").addEventListener("change", renderHistory);
document.querySelector("#historyTimeline").addEventListener("click", (event) => {
  const deleteButton = event.target.closest("[data-delete-log]");
  if (!deleteButton) return;
  deleteEntry(deleteButton.dataset.deleteLog);
});
document.querySelectorAll("[data-trend-range]").forEach((button) => {
  button.addEventListener("click", () => {
    trendRange = button.dataset.trendRange;
    renderTrends();
  });
});
aiFatigueSummaryButton.addEventListener("click", requestFatigueAiSummary);
exportScope.addEventListener("change", () => {
  const isRange = exportScope.value === "range";
  document.querySelectorAll(".export-date-field").forEach((field) => {
    field.classList.toggle("is-hidden", !isRange);
  });
  renderExportCount();
});
exportFrom.addEventListener("change", renderExportCount);
exportTo.addEventListener("change", renderExportCount);
document.querySelector("#downloadExportButton").addEventListener("click", openDownloadDialog);
document.querySelector("#emailExportButton").addEventListener("click", sharePdfExport);
document.querySelector("#previewPdfButton").addEventListener("click", previewPdfExport);
document.querySelector("#printPdfButton").addEventListener("click", printPdfExport);
downloadFileType.addEventListener("change", updateDownloadDialog);
downloadForm.addEventListener("submit", handleDownloadSubmit);
syncButton.addEventListener("click", refreshSheetNow);
addMedsPlanItemButton.addEventListener("click", addMedsPlanItem);
saveMedsPlanButton.addEventListener("click", saveMedsPlan);
document.querySelectorAll("[data-meds-plan-view]").forEach((button) => {
  button.addEventListener("click", () => {
    state.medsPlanView = button.dataset.medsPlanView;
    renderMedsPlan();
  });
});
document.addEventListener("click", (event) => {
  if (event.target.closest("[data-custom-select-wrapper]")) return;
  closeCustomSelects();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeCustomSelects();
});
medsPlanForm.addEventListener("input", updateMedsPlanFromForm);
medsPlanForm.addEventListener("change", updateMedsPlanFromForm);
medsPlanEditor.addEventListener("click", (event) => {
  const editButton = event.target.closest("[data-edit-plan-item]");
  if (editButton) {
    updateMedsPlanFromForm({ markDirty: false });
    const item = state.medsPlan[Number(editButton.dataset.editPlanItem)];
    if (!item) return;
    if (expandedMedsPlanItems.has(item.id)) {
      expandedMedsPlanItems.delete(item.id);
    } else {
      expandedMedsPlanItems.add(item.id);
    }
    renderMedsPlan();
    return;
  }

  const saveButton = event.target.closest("[data-save-plan-item]");
  if (saveButton) {
    saveMedsPlanItem(Number(saveButton.dataset.savePlanItem));
    return;
  }

  const removeButton = event.target.closest("[data-remove-plan-item]");
  if (!removeButton) return;
  const item = state.medsPlan[Number(removeButton.dataset.removePlanItem)];
  if (item) expandedMedsPlanItems.delete(item.id);
  state.medsPlan.splice(Number(removeButton.dataset.removePlanItem), 1);
  isMedsPlanDirty = true;
  saveMedsPlanLocal();
  renderMedsPlan();
});
document.querySelector("#addMedicationSetting").addEventListener("click", () => {
  presets.medications.push({ name: "", defaultDose: "" });
  dirtySettings.medication.add(presets.medications.length - 1);
  renderSettings();
  updateSettingsSaveButton();
});
document.querySelector("#addCaregiverSetting").addEventListener("click", () => {
  presets.caregivers.push("");
  dirtySettings.caregiver.add(presets.caregivers.length - 1);
  renderSettings();
  updateSettingsSaveButton();
});
saveSettingsTopButton.addEventListener("click", () => {
  if (saveSettingsTopButton.disabled) return;
  saveSheetApiUrl();
  saveAiSummaryApiUrl();
  saveSettingsFromForm();
  dirtySettings.medication.clear();
  dirtySettings.caregiver.clear();
  dirtySettings.sheet = false;
  dirtySettings.ai = false;
  renderSettings();
  updateSettingsSaveButton();
});
copySetupLinkButton.addEventListener("click", async () => {
  saveSheetApiUrl();
  if (!syncEnabled()) {
    alert("Add the Apps Script Web App URL first, then copy the setup link.");
    return;
  }

  const link = publicSetupLink();
  try {
    await navigator.clipboard.writeText(link);
    copySetupLinkButton.innerHTML = '<span class="material-symbols-outlined">check</span> Copied';
    setTimeout(() => {
      copySetupLinkButton.innerHTML = '<span class="material-symbols-outlined">link</span> Copy setup link';
    }, 1800);
  } catch (error) {
    window.prompt("Copy this setup link and open it once in each browser/device:", link);
  }
});

entryForm.addEventListener("submit", handleEntrySubmit);
dynamicFields.addEventListener("change", (event) => {
  const select = event.target.closest("[data-quick-select]");
  if (select) toggleInlineAddFields(select.name, select.value === "__add__");
  if (select?.name === "medicationName" && select.value !== "__add__" && entryForm.elements.dose) {
    entryForm.elements.dose.value = medicationDefaultDose(select.value);
  }
});
dynamicFields.addEventListener("input", (event) => {
  if (event.target.matches('[name="newMedicationDose"]') && entryForm.elements.medicationName?.value === "__add__" && entryForm.elements.dose && !entryForm.elements.dose.value.trim()) {
    entryForm.elements.dose.value = event.target.value.trim();
  }
  if (!event.target.matches(".severity-slider")) return;
  const field = event.target.closest(".severity-slider-field");
  const value = field?.querySelector("[data-severity-value]");
  const term = field?.querySelector("[data-severity-term]");
  if (value) value.textContent = event.target.value;
  if (term) term.textContent = severityTerm(event.target.value);
});
dynamicFields.addEventListener("click", (event) => {
  const doseButton = event.target.closest("[data-dose-step]");
  if (doseButton) {
    stepMedicationDose(Number(doseButton.dataset.doseStep));
    return;
  }

  const planButton = event.target.closest("[data-use-plan-item]");
  if (planButton) {
    useMedsPlanItem(planButton.dataset.usePlanItem);
    return;
  }

  const removeButton = event.target.closest("[data-remove-option]");
  if (removeButton) removeQuickOption(removeButton.dataset.removeOption);
});
patientForm.addEventListener("submit", (event) => {
  event.preventDefault();
  state.patient = Object.fromEntries(new FormData(patientForm).entries());
  savePatient();
});
settingsForm.addEventListener("click", (event) => {
  const saveButton = event.target.closest("[data-save-setting]");
  if (saveButton) {
    saveSheetApiUrl();
    saveAiSummaryApiUrl();
    saveSettingsFromForm();
    dirtySettings.medication.clear();
    dirtySettings.caregiver.clear();
    dirtySettings.sheet = false;
    dirtySettings.ai = false;
    renderSettings();
    updateSettingsSaveButton();
    return;
  }

  const removeButton = event.target.closest("[data-remove-setting]");
  if (!removeButton) return;

  const index = Number(removeButton.dataset.index);
  if (removeButton.dataset.removeSetting === "medication") {
    presets.medications.splice(index, 1);
  }
  if (removeButton.dataset.removeSetting === "caregiver") {
    presets.caregivers.splice(index, 1);
  }
  dirtySettings.medication.clear();
  dirtySettings.caregiver.clear();
  dirtySettings.sheet = false;
  dirtySettings.ai = false;
  renderSettings();
  updateSettingsSaveButton();
});
settingsForm.addEventListener("input", (event) => {
  if (event.target.matches("#sheetApiUrl")) {
    dirtySettings.sheet = true;
    updateSettingsSaveButton();
    return;
  }
  if (event.target.matches("#aiSummaryApiUrl")) {
    dirtySettings.ai = true;
    updateSettingsSaveButton();
    return;
  }

  const row = event.target.closest(".settings-row");
  if (!row) return;

  const button = row.querySelector("[data-remove-setting], [data-save-setting]");
  const kind = button?.dataset.removeSetting || button?.dataset.saveSetting;
  const index = Number(button?.dataset.index);
  if (!kind || Number.isNaN(index)) return;

  dirtySettings[kind].add(index);
  button.outerHTML = settingsActionButton(kind, index, true);
  updateSettingsSaveButton();
});
settingsForm.addEventListener("submit", (event) => {
  event.preventDefault();
  saveSheetApiUrl();
  saveAiSummaryApiUrl();
  saveSettingsFromForm();
  dirtySettings.medication.clear();
  dirtySettings.caregiver.clear();
  dirtySettings.sheet = false;
  dirtySettings.ai = false;
  renderSettings();
  updateSettingsSaveButton();
});

function saveSettingsFromForm() {
  const data = new FormData(settingsForm);

  presets.medications = presets.medications
    .map((_, index) => ({
      name: data.get(`medicationName_${index}`)?.trim() || "",
      defaultDose: data.get(`medicationDose_${index}`)?.trim() || ""
    }))
    .filter((medication) => medication.name);

  presets.caregivers = presets.caregivers
    .map((_, index) => data.get(`caregiver_${index}`)?.trim() || "")
    .filter(Boolean);

  saveMedicationOptions();
  saveCaregiverOptions();
}

loadState();
setNavCollapsed(localStorage.getItem(NAV_KEY) === "true");
setRoute("today");
render();
loadEntriesFromSheet().catch(() => {});
loadMedsPlanFromSheet().catch(() => {});
