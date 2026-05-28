const authScreen = document.querySelector("#authScreen");
const dashboard = document.querySelector("#dashboard");
const loginForm = document.querySelector("#loginForm");
const loginId = document.querySelector("#loginId");
const password = document.querySelector("#password");
const welcomeName = document.querySelector("#welcomeName");
const logoutBtn = document.querySelector("#logoutBtn");
const installAppBtn = document.querySelector("#installAppBtn");
const connectionStatus = document.querySelector("#connectionStatus");
const viewLinks = document.querySelectorAll("[data-view-link]");
const dashboardViews = document.querySelectorAll("[data-view]");

const plantImage = document.querySelector("#plantImage");
const previewArea = document.querySelector("#previewArea");
const previewImage = document.querySelector("#previewImage");
const aiStatus = document.querySelector("#aiStatus");
const greenScore = document.querySelector("#greenScore");
const yellowScore = document.querySelector("#yellowScore");
const spotScore = document.querySelector("#spotScore");
const qualityScore = document.querySelector("#qualityScore");
const clearImageBtn = document.querySelector("#clearImageBtn");
const farmLocation = document.querySelector("#farmLocation");
const fieldSize = document.querySelector("#fieldSize");
const cropType = document.querySelector("#cropType");
const cropStage = document.querySelector("#cropStage");
const symptomType = document.querySelector("#symptomType");
const detectBtn = document.querySelector("#detectBtn");
const emptyResult = document.querySelector("#emptyResult");
const scanResult = document.querySelector("#scanResult");
const diseaseName = document.querySelector("#diseaseName");
const confidenceScore = document.querySelector("#confidenceScore");
const confidenceBar = document.querySelector("#confidenceBar");
const diseaseSummary = document.querySelector("#diseaseSummary");
const solutionList = document.querySelector("#solutionList");
const preventionText = document.querySelector("#preventionText");
const riskLabel = document.querySelector("#riskLabel");
const mlExplanation = document.querySelector("#mlExplanation");
const totalScans = document.querySelector("#totalScans");
const fieldRisk = document.querySelector("#fieldRisk");
const historyList = document.querySelector("#historyList");
const clearHistoryBtn = document.querySelector("#clearHistoryBtn");
const downloadReportBtn = document.querySelector("#downloadReportBtn");
const copyAdviceBtn = document.querySelector("#copyAdviceBtn");

const chatForm = document.querySelector("#chatForm");
const chatInput = document.querySelector("#chatInput");
const chatWindow = document.querySelector("#chatWindow");
const quickPrompts = document.querySelectorAll("[data-prompt]");
const careItems = document.querySelectorAll("[data-care-item]");
const careProgress = document.querySelector("#careProgress");
const resetCarePlan = document.querySelector("#resetCarePlan");
let latestReport = null;
let currentImageSignals = null;
let deferredInstallPrompt = null;
let backendAvailable = window.location.protocol !== "file:";
let currentUserId = localStorage.getItem("agrivisionUserId") || "demo-farmer";
let scanHistoryCache = [];

async function apiRequest(path, options = {}) {
  if (!backendAvailable) return null;
  try {
    const response = await fetch(path, {
      headers: { "Content-Type": "application/json", ...(options.headers || {}) },
      ...options
    });
    if (!response.ok) throw new Error(`API ${response.status}`);
    return await response.json();
  } catch {
    backendAvailable = false;
    return null;
  }
}

function apiPath(path) {
  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}userId=${encodeURIComponent(currentUserId)}`;
}

const diseaseLibrary = {
  tomato: {
    spots: ["Tomato Septoria Leaf Spot", "Small circular leaf spots can spread quickly in humid conditions.", ["Remove infected lower leaves.", "Spray neem oil or a recommended copper fungicide.", "Avoid overhead watering and keep plants spaced."], "Rotate tomato crops yearly and keep plant debris away from the field."],
    yellow: ["Tomato Early Nutrient Stress", "Yellow leaves often point to poor nitrogen uptake, overwatering, or early fungal pressure.", ["Check drainage before watering again.", "Add balanced compost around the root zone.", "Inspect the underside of leaves for pests."], "Use drip irrigation and test soil before heavy fertilizer use."],
    curl: ["Tomato Leaf Curl Virus", "Curling leaves with stunted growth can be linked to whitefly-transmitted virus.", ["Control whiteflies with yellow sticky traps.", "Remove severely infected plants.", "Use resistant varieties in the next season."], "Keep weeds down and cover young plants with insect netting."],
    blight: ["Tomato Late Blight", "Dark watery patches on leaves and stems need fast action, especially after rain.", ["Remove infected leaves immediately.", "Apply a labeled fungicide after expert advice.", "Improve airflow and avoid wet foliage at night."], "Choose disease-free seedlings and avoid planting near infected potato fields."],
    healthy: ["Healthy Tomato Plant", "The selected symptoms look low-risk in this demo scan.", ["Continue regular monitoring.", "Water at the base of the plant.", "Keep a photo record every week."], "Balanced nutrition and airflow are the best prevention."]
  },
  rice: {
    spots: ["Rice Brown Spot", "Oval brown lesions can appear when plants are stressed or potassium is low.", ["Use balanced NPK fertilizer.", "Remove severely affected seedlings.", "Maintain proper field water level."], "Use certified seed and correct spacing."],
    yellow: ["Rice Nitrogen Deficiency", "General yellowing often indicates nutrient stress.", ["Apply split nitrogen dose as advised locally.", "Check water stagnation and drainage.", "Add organic manure before the next crop."], "Soil testing before sowing prevents underfeeding."],
    curl: ["Rice Leaf Folder Damage", "Folded or curled leaves can indicate larvae feeding inside.", ["Open folded leaves and inspect larvae.", "Encourage natural predators.", "Use pesticide only if damage crosses local threshold."], "Avoid excessive nitrogen that attracts pests."],
    blight: ["Rice Bacterial Leaf Blight", "Long yellow-to-brown streaks after rain can indicate bacterial blight.", ["Avoid moving through wet fields.", "Drain excess water temporarily.", "Use resistant varieties next season."], "Use clean seed and avoid high nitrogen during outbreaks."],
    healthy: ["Healthy Rice Crop", "No strong disease pattern is selected.", ["Keep water level stable.", "Monitor weekly for leaf streaks.", "Maintain field hygiene."], "Good seed selection and balanced fertilizer reduce disease pressure."]
  },
  potato: {
    spots: ["Potato Early Blight", "Target-like brown leaf spots usually start on older leaves.", ["Remove infected foliage.", "Apply recommended fungicide if spreading.", "Avoid overhead irrigation."], "Rotate away from potato and tomato for 2-3 seasons."],
    yellow: ["Potato Nutrient Stress", "Yellowing may come from nitrogen deficiency, water stress, or root issues.", ["Check soil moisture near roots.", "Apply compost or balanced fertilizer.", "Inspect tubers and stems for rot."], "Loose, well-drained soil supports healthier roots."],
    curl: ["Potato Virus Suspected", "Leaf curling can be linked to aphids and viral infection.", ["Control aphids early.", "Remove severely infected plants.", "Use certified seed potatoes."], "Destroy volunteer potato plants after harvest."],
    blight: ["Potato Late Blight", "Dark patches with rapid spread are a serious warning sign.", ["Remove infected leaves safely.", "Do not compost diseased material.", "Consult local agriculture officer for fungicide schedule."], "Plant resistant varieties and avoid wet foliage overnight."],
    healthy: ["Healthy Potato Plant", "The scan is low-risk based on current inputs.", ["Keep ridges weed-free.", "Water deeply but less frequently.", "Watch after humid weather."], "Crop rotation is key for potato health."]
  },
  wheat: {
    spots: ["Wheat Leaf Rust", "Orange-brown spots can reduce photosynthesis during grain filling.", ["Confirm rust pustules on leaves.", "Use recommended fungicide if severe.", "Avoid late excessive nitrogen."], "Use resistant varieties and sow at recommended time."],
    yellow: ["Wheat Yellow Rust", "Yellow stripes or patches should be checked quickly in cool, moist weather.", ["Inspect multiple field locations.", "Report severe spread to local extension officer.", "Apply advised fungicide promptly."], "Grow resistant cultivars and monitor after foggy mornings."],
    curl: ["Wheat Heat or Moisture Stress", "Curling leaves often mean the crop is protecting itself from water or heat stress.", ["Irrigate at critical growth stage.", "Mulch edges where possible.", "Check for root disease if stress remains."], "Timely irrigation reduces stress curling."],
    blight: ["Wheat Spot Blotch", "Brown blotches may develop in warm and humid environments.", ["Improve field drainage.", "Use balanced potassium fertilizer.", "Remove crop residue before next sowing."], "Seed treatment and rotation reduce future risk."],
    healthy: ["Healthy Wheat Crop", "The selected inputs do not suggest high disease pressure.", ["Continue field scouting.", "Protect crop during heading stage.", "Avoid unnecessary sprays."], "Timely sowing and resistant seed help most."]
  },
  cotton: {
    spots: ["Cotton Bacterial Blight", "Angular leaf spots can appear after humid weather and rain splash.", ["Avoid working in wet fields.", "Remove infected debris after harvest.", "Use copper-based spray only with local advice."], "Use acid-delinted certified seed and resistant varieties."],
    yellow: ["Cotton Jassid Damage", "Yellowing leaf edges can indicate sucking pest pressure.", ["Check underside of leaves.", "Use yellow sticky traps.", "Spray neem-based formulation at early stage."], "Avoid excessive nitrogen and encourage beneficial insects."],
    curl: ["Cotton Leaf Curl Virus", "Upward curling and thickened veins suggest virus spread by whiteflies.", ["Control whitefly population.", "Remove infected plants early.", "Avoid alternate host weeds."], "Use tolerant hybrids and keep field borders clean."],
    blight: ["Cotton Alternaria Leaf Spot", "Brown necrotic patches can spread during humid spells.", ["Remove heavily infected leaves.", "Apply recommended fungicide if needed.", "Improve spacing and airflow."], "Balanced nutrition helps cotton resist leaf spot."],
    healthy: ["Healthy Cotton Plant", "Current inputs suggest low risk.", ["Scout twice weekly.", "Track whitefly and jassid counts.", "Irrigate according to soil moisture."], "Clean field borders lower pest pressure."]
  }
};

function setLoggedIn(user) {
  localStorage.setItem("agrivisionUser", user);
  authScreen.classList.add("hidden");
  dashboard.classList.remove("hidden");
  welcomeName.textContent = `Smart farming workspace for ${user}`;
  showView(window.location.hash.replace("#", "") || "detector");
  loadServerState();
}

function setLoggedOut() {
  localStorage.removeItem("agrivisionUser");
  localStorage.removeItem("agrivisionUserId");
  dashboard.classList.add("hidden");
  authScreen.classList.remove("hidden");
  loginForm.reset();
}

loginForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (password.value.trim().length < 4) return;
  loginWithBackend(loginId.value.trim() || "Farmer");
});

logoutBtn.addEventListener("click", setLoggedOut);

async function loginWithBackend(user) {
  const result = await apiRequest("/api/login", {
    method: "POST",
    body: JSON.stringify({ loginId: user })
  });

  if (result?.user?.id) {
    currentUserId = result.user.id;
    localStorage.setItem("agrivisionUserId", currentUserId);
  }

  setLoggedIn(user);
}

function getScanHistory() {
  if (scanHistoryCache.length) return scanHistoryCache;
  try {
    scanHistoryCache = JSON.parse(localStorage.getItem("agrivisionScanHistory")) || [];
    return scanHistoryCache;
  } catch {
    return [];
  }
}

function saveScanHistory(history) {
  scanHistoryCache = history.slice(0, 6);
  localStorage.setItem("agrivisionScanHistory", JSON.stringify(scanHistoryCache));
}

function renderScanHistory() {
  const history = getScanHistory();
  totalScans.textContent = history.length;

  if (!history.length) {
    fieldRisk.textContent = "Low";
    historyList.innerHTML = '<div class="empty-history">No saved scans yet. Run detection to build field records.</div>';
    return;
  }

  const highRiskCount = history.filter((scan) => scan.risk === "High risk").length;
  fieldRisk.textContent = highRiskCount ? "High" : history.some((scan) => scan.risk === "Moderate risk") ? "Moderate" : "Low";

  historyList.innerHTML = history.map((scan) => `
    <div class="history-item">
      <div>
        <strong>${scan.disease}</strong>
        <span>${scan.crop} - ${scan.stage} - ${scan.location || "Location not added"}</span>
        <small>${scan.date}</small>
      </div>
      <span class="history-risk">${scan.risk} ${scan.confidence}%</span>
    </div>
  `).join("");
}

function saveFieldProfile() {
  const profile = {
    location: farmLocation.value.trim(),
    size: fieldSize.value.trim(),
    crop: cropType.value,
    stage: cropStage.value
  };
  localStorage.setItem("agrivisionFieldProfile", JSON.stringify(profile));
  apiRequest(apiPath("/api/profile"), {
    method: "PUT",
    body: JSON.stringify({ profile })
  });
}

function loadFieldProfile() {
  try {
    const profile = JSON.parse(localStorage.getItem("agrivisionFieldProfile")) || {};
    farmLocation.value = profile.location || "";
    fieldSize.value = profile.size || "";
    cropType.value = profile.crop || cropType.value;
    cropStage.value = profile.stage || cropStage.value;
  } catch {
    localStorage.removeItem("agrivisionFieldProfile");
  }
}

function applyFieldProfile(profile) {
  farmLocation.value = profile.location || "";
  fieldSize.value = profile.size || "";
  cropType.value = profile.crop || cropType.value;
  cropStage.value = profile.stage || cropStage.value;
}

async function loadServerState() {
  const [profileResult, scansResult, careResult] = await Promise.all([
    apiRequest(apiPath("/api/profile")),
    apiRequest(apiPath("/api/scans")),
    apiRequest(apiPath("/api/care-plan"))
  ]);

  if (profileResult?.profile) {
    localStorage.setItem("agrivisionFieldProfile", JSON.stringify(profileResult.profile));
    applyFieldProfile(profileResult.profile);
  }

  if (Array.isArray(scansResult?.scans)) {
    scanHistoryCache = scansResult.scans;
    localStorage.setItem("agrivisionScanHistory", JSON.stringify(scanHistoryCache));
    renderScanHistory();
  }

  if (careResult?.carePlan) {
    localStorage.setItem("agrivisionCarePlan", JSON.stringify(careResult.carePlan));
    loadCarePlan();
  }
}

function showView(viewName) {
  const validView = ["detector", "assistant", "calendar"].includes(viewName) ? viewName : "detector";

  dashboardViews.forEach((view) => {
    view.classList.toggle("hidden", view.dataset.view !== validView);
    view.classList.toggle("active", view.dataset.view === validView);
  });

  viewLinks.forEach((link) => {
    link.classList.toggle("active", link.dataset.viewLink === validView);
  });

  if (window.location.hash !== `#${validView}`) {
    history.replaceState(null, "", `#${validView}`);
  }
}

viewLinks.forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    showView(link.dataset.viewLink);
    document.querySelector(".main-content").scrollTo({ top: 0, behavior: "smooth" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
});

window.addEventListener("hashchange", () => {
  showView(window.location.hash.replace("#", ""));
});

plantImage.addEventListener("change", () => {
  const file = plantImage.files[0];
  if (!file) return;
  previewImage.src = URL.createObjectURL(file);
  previewArea.classList.remove("hidden");
  aiStatus.textContent = "Analyzing leaf color, spots, and image quality...";
  currentImageSignals = null;
  analyzePlantImage(file)
    .then((signals) => {
      currentImageSignals = signals;
      renderImageSignals(signals);
    })
    .catch(() => {
      aiStatus.textContent = "Image analysis could not run. Detection will use crop inputs.";
    });
});

clearImageBtn.addEventListener("click", () => {
  plantImage.value = "";
  previewImage.removeAttribute("src");
  previewArea.classList.add("hidden");
  currentImageSignals = null;
  aiStatus.textContent = "Waiting for image analysis";
  greenScore.textContent = "0%";
  yellowScore.textContent = "0%";
  spotScore.textContent = "0%";
  qualityScore.textContent = "0%";
});

function percent(value) {
  return `${Math.round(Math.max(0, Math.min(1, value)) * 100)}%`;
}

function analyzePlantImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      const canvas = document.createElement("canvas");
      const size = 180;
      canvas.width = size;
      canvas.height = size;
      const context = canvas.getContext("2d", { willReadFrequently: true });
      context.drawImage(image, 0, 0, size, size);
      const { data } = context.getImageData(0, 0, size, size);
      URL.revokeObjectURL(url);

      let green = 0;
      let yellow = 0;
      let brown = 0;
      let dark = 0;
      let bright = 0;
      let texture = 0;
      let samples = 0;

      for (let i = 0; i < data.length; i += 16) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const brightness = (r + g + b) / 3;
        const saturation = Math.max(r, g, b) - Math.min(r, g, b);
        const next = Math.min(i + 16, data.length - 4);
        const edge = Math.abs(r - data[next]) + Math.abs(g - data[next + 1]) + Math.abs(b - data[next + 2]);

        if (g > r * 0.92 && g > b * 1.12 && saturation > 22) green += 1;
        if (r > 95 && g > 85 && b < 95 && r >= g * 0.82) yellow += 1;
        if (r > 70 && g > 38 && g < 125 && b < 90 && r > b * 1.35) brown += 1;
        if (brightness < 72 && saturation > 18) dark += 1;
        if (brightness > 75 && brightness < 210) bright += 1;
        if (edge > 56) texture += 1;
        samples += 1;
      }

      const leafCoverage = green / samples;
      const yellowing = yellow / samples;
      const spotIndex = Math.min(1, (brown + dark) / samples);
      const textureIndex = texture / samples;
      const quality = Math.min(1, (bright / samples) * 0.72 + Math.min(leafCoverage * 2.1, 1) * 0.28);
      const severity = Math.min(1, spotIndex * 1.25 + yellowing * 0.85 + textureIndex * 0.2);

      resolve({ leafCoverage, yellowing, spotIndex, textureIndex, quality, severity });
    };

    image.onerror = reject;
    image.src = url;
  });
}

function renderImageSignals(signals) {
  greenScore.textContent = percent(signals.leafCoverage);
  yellowScore.textContent = percent(signals.yellowing);
  spotScore.textContent = percent(signals.spotIndex);
  qualityScore.textContent = percent(signals.quality);

  if (signals.quality < 0.28) {
    aiStatus.textContent = "Low image quality. Try a brighter close-up for better AI confidence.";
  } else if (signals.severity > 0.34) {
    aiStatus.textContent = "Disease-like patterns found. AI scan is ready.";
  } else {
    aiStatus.textContent = "Leaf image analyzed. AI scan is ready.";
  }
}

function chooseAISymptom(userSymptom, signals) {
  if (!signals) return userSymptom;
  if (signals.spotIndex > 0.22 && signals.yellowing > 0.18) return "blight";
  if (signals.spotIndex > 0.24) return "spots";
  if (signals.yellowing > 0.24) return "yellow";
  if (signals.leafCoverage > 0.2 && signals.severity < 0.16 && signals.quality > 0.35) return "healthy";
  return userSymptom;
}

function confidenceFromSignals(symptom, signals) {
  if (!signals) return symptom === "healthy" ? 72 : 84;
  const qualityBoost = Math.round(signals.quality * 10);
  const severityBoost = Math.round(signals.severity * 18);
  if (symptom === "healthy") return Math.max(65, Math.min(88, 68 + qualityBoost - severityBoost));
  return Math.max(72, Math.min(96, 76 + qualityBoost + severityBoost));
}

detectBtn.addEventListener("click", async () => {
  if (!plantImage.files[0]) {
    document.querySelector("#uploadZone").animate([
      { transform: "translateX(0)" },
      { transform: "translateX(-8px)" },
      { transform: "translateX(8px)" },
      { transform: "translateX(0)" }
    ], { duration: 280 });
    return;
  }

  if (!currentImageSignals) {
    aiStatus.textContent = "Finishing image analysis...";
    currentImageSignals = await analyzePlantImage(plantImage.files[0]);
    renderImageSignals(currentImageSignals);
  }

  const aiSymptom = chooseAISymptom(symptomType.value, currentImageSignals);
  const result = diseaseLibrary[cropType.value][aiSymptom];
  const confidence = confidenceFromSignals(aiSymptom, currentImageSignals);
  const risk = confidence > 88 ? "High risk" : aiSymptom === "healthy" ? "Low risk" : "Moderate risk";
  const cropName = cropType.options[cropType.selectedIndex].text;

  diseaseName.textContent = result[0];
  diseaseSummary.textContent = result[1];
  confidenceScore.textContent = `${confidence}%`;
  confidenceBar.style.width = `${confidence}%`;
  riskLabel.textContent = risk;
  riskLabel.style.color = risk === "High risk" ? "#b94735" : risk === "Low risk" ? "#2f7d3c" : "#c68622";
  preventionText.textContent = result[3];
  solutionList.innerHTML = result[2].map((item) => `<li>${item}</li>`).join("");
  mlExplanation.textContent = `The prototype model estimated ${percent(currentImageSignals.leafCoverage)} leaf coverage, ${percent(currentImageSignals.yellowing)} yellowing, ${percent(currentImageSignals.spotIndex)} spot index, and ${percent(currentImageSignals.quality)} image quality. It adjusted the selected symptom to "${aiSymptom}" for this prediction.`;
  emptyResult.classList.add("hidden");
  scanResult.classList.remove("hidden");

  latestReport = {
    disease: result[0],
    summary: result[1],
    solutions: result[2],
    prevention: result[3],
    confidence,
    risk,
    signals: currentImageSignals,
    aiSymptom,
    crop: cropName,
    stage: cropStage.value,
    location: farmLocation.value.trim(),
    size: fieldSize.value.trim(),
    date: new Date().toLocaleString()
  };

  const history = getScanHistory();
  history.unshift(latestReport);
  saveScanHistory(history);
  apiRequest(apiPath("/api/scans"), {
    method: "POST",
    body: JSON.stringify({ scan: latestReport })
  }).then((result) => {
    if (Array.isArray(result?.scans)) {
      saveScanHistory(result.scans);
      renderScanHistory();
    }
  });
  saveFieldProfile();
  renderScanHistory();
});

downloadReportBtn.addEventListener("click", () => {
  if (!latestReport) return;
  const report = [
    "AgriVision AI Crop Health Report",
    "",
    `Date: ${latestReport.date}`,
    `Location: ${latestReport.location || "Not added"}`,
    `Field size: ${latestReport.size || "Not added"}`,
    `Crop: ${latestReport.crop}`,
    `Crop stage: ${latestReport.stage}`,
    `Disease: ${latestReport.disease}`,
    `Risk: ${latestReport.risk}`,
    `Confidence: ${latestReport.confidence}%`,
    `AI symptom used: ${latestReport.aiSymptom || "Not available"}`,
    "",
    "Summary:",
    latestReport.summary,
    "",
    "Recommended solution:",
    ...latestReport.solutions.map((solution) => `- ${solution}`),
    "",
    "Prevention:",
    latestReport.prevention
  ].join("\n");
  const blob = new Blob([report], { type: "text/plain" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "agrivision-crop-report.txt";
  link.click();
  URL.revokeObjectURL(link.href);
});

copyAdviceBtn.addEventListener("click", async () => {
  if (!latestReport) return;
  const text = `${latestReport.disease}: ${latestReport.summary} Solution: ${latestReport.solutions.join(" ")} Prevention: ${latestReport.prevention}`;
  try {
    await navigator.clipboard.writeText(text);
    copyAdviceBtn.textContent = "Copied";
    window.setTimeout(() => {
      copyAdviceBtn.textContent = "Copy advice";
    }, 1200);
  } catch {
    copyAdviceBtn.textContent = "Copy failed";
    window.setTimeout(() => {
      copyAdviceBtn.textContent = "Copy advice";
    }, 1200);
  }
});

clearHistoryBtn.addEventListener("click", () => {
  localStorage.removeItem("agrivisionScanHistory");
  scanHistoryCache = [];
  apiRequest(apiPath("/api/scans"), { method: "DELETE" });
  renderScanHistory();
});

[farmLocation, fieldSize, cropType, cropStage].forEach((field) => {
  field.addEventListener("change", saveFieldProfile);
});

function assistantReply(question) {
  const q = question.toLowerCase();
  if (q.includes("fungal") || q.includes("disease") || q.includes("rain")) {
    return "After rain, inspect lower leaves first because disease often starts where humidity stays high. Remove infected leaves, keep airflow open, and spray only after leaves dry.";
  }
  if (q.includes("water") || q.includes("irrigation")) {
    return "Water early morning or evening. Check soil 5 cm deep first; irrigate only when it feels dry, and avoid wetting leaves when disease pressure is high.";
  }
  if (q.includes("fertilizer") || q.includes("npk") || q.includes("manure")) {
    return "Use compost before planting and split chemical fertilizer into smaller doses. Do a soil test when possible so nitrogen, phosphorus, and potassium are not guessed.";
  }
  if (q.includes("pest") || q.includes("insect") || q.includes("whitefly") || q.includes("aphid")) {
    return "Inspect the underside of leaves. Start with traps, neem-based spray, and field sanitation; use chemical pesticide only after local threshold advice.";
  }
  if (q.includes("soil")) {
    return "Healthy soil should drain well, hold moisture, and contain organic matter. Add compost, rotate crops, and avoid repeated deep tillage.";
  }
  if (q.includes("weather") || q.includes("rain")) {
    return "After rain, scout for fungal spots within 24-48 hours. Improve airflow, drain standing water, and delay spraying until leaves are dry.";
  }
  return "For best guidance, share crop name, plant age, symptom, and weather. Meanwhile, isolate affected plants, avoid overhead watering, and record photos every few days.";
}

function addMessage(text, type) {
  const message = document.createElement("div");
  message.className = `message ${type}`;
  message.textContent = text;
  chatWindow.appendChild(message);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

chatForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const question = chatInput.value.trim();
  if (!question) return;
  addMessage(question, "user");
  chatInput.value = "";
  const result = await apiRequest("/api/assistant", {
    method: "POST",
    body: JSON.stringify({ question, userId: currentUserId })
  });
  window.setTimeout(() => addMessage(result?.reply || assistantReply(question), "bot"), 250);
});

quickPrompts.forEach((button) => {
  button.addEventListener("click", () => {
    chatInput.value = button.dataset.prompt;
    chatInput.focus();
  });
});

function savedCarePlan() {
  try {
    return JSON.parse(localStorage.getItem("agrivisionCarePlan")) || {};
  } catch {
    return {};
  }
}

function updateCareProgress() {
  const done = [...careItems].filter((item) => item.checked).length;
  careProgress.textContent = `${done} of ${careItems.length} done`;
}

function loadCarePlan() {
  const saved = savedCarePlan();
  careItems.forEach((item) => {
    item.checked = Boolean(saved[item.dataset.careItem]);
  });
  updateCareProgress();
}

careItems.forEach((item) => {
  item.addEventListener("change", () => {
    const saved = savedCarePlan();
    saved[item.dataset.careItem] = item.checked;
    localStorage.setItem("agrivisionCarePlan", JSON.stringify(saved));
    apiRequest(apiPath("/api/care-plan"), {
      method: "PUT",
      body: JSON.stringify({ carePlan: saved })
    });
    updateCareProgress();
  });
});

resetCarePlan.addEventListener("click", () => {
  localStorage.removeItem("agrivisionCarePlan");
  careItems.forEach((item) => {
    item.checked = false;
  });
  apiRequest(apiPath("/api/care-plan"), {
    method: "PUT",
    body: JSON.stringify({ carePlan: {} })
  });
  updateCareProgress();
});

function updateConnectionStatus() {
  connectionStatus.textContent = navigator.onLine ? "Online" : "Offline ready";
}

window.addEventListener("online", updateConnectionStatus);
window.addEventListener("offline", updateConnectionStatus);

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  deferredInstallPrompt = event;
  installAppBtn.classList.remove("hidden");
});

installAppBtn.addEventListener("click", async () => {
  if (!deferredInstallPrompt) return;
  deferredInstallPrompt.prompt();
  await deferredInstallPrompt.userChoice;
  deferredInstallPrompt = null;
  installAppBtn.classList.add("hidden");
});

window.addEventListener("appinstalled", () => {
  deferredInstallPrompt = null;
  installAppBtn.classList.add("hidden");
});

if ("serviceWorker" in navigator && window.location.protocol !== "file:") {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js").catch(() => {
      connectionStatus.textContent = "App mode unavailable";
    });
  });
}

const storedUser = localStorage.getItem("agrivisionUser");
if (storedUser) {
  setLoggedIn(storedUser);
}
updateConnectionStatus();
loadFieldProfile();
renderScanHistory();
loadCarePlan();
