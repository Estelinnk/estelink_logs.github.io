// =====================
// CONFIGURATION
// =====================
const API_URL = "https://MON-API-URL"; // <-- Mets l'URL publique de ton backend (ex: https://fivem-logs-api.onrender.com)

let filters = {};
let liveMode = false;
let liveInterval = null;

// =====================
// INITIALISATION
// =====================
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("search").addEventListener("input", updateFilters);
  document.getElementById("date").addEventListener("change", updateFilters);
  document.getElementById("type").addEventListener("change", updateFilters);

  document.getElementById("reset").addEventListener("click", resetFilters);
  document.getElementById("exportCsv").addEventListener("click", exportCSV);
  document.getElementById("liveToggle").addEventListener("click", toggleLive);

  document.getElementById("openFilters").addEventListener("click", () => {
    document.getElementById("filtersModal").showModal();
  });
  document.getElementById("closeFilters").addEventListener("click", () => {
    document.getElementById("filtersModal").close();
  });
  document.getElementById("applyFilters").addEventListener("click", applyAdvancedFilters);
  document.getElementById("clearFilters").addEventListener("click", clearAdvancedFilters);

  loadData();
  loadStats();
});

// =====================
// FONCTIONS
// =====================
function updateFilters() {
  filters.q = document.getElementById("search").value || undefined;
  filters.date = document.getElementById("date").value || undefined;
  filters.type = document.getElementById("type").value || undefined;
  renderChips();
  loadData();
  loadStats();
}

function resetFilters() {
  filters = {};
  document.getElementById("search").value = "";
  document.getElementById("date").value = "";
  document.getElementById("type").value = "";
  clearAdvancedFilters();
  renderChips();
  loadData();
  loadStats();
}

function applyAdvancedFilters() {
  filters.identifier = document.getElementById("identifier").value || undefined;
  filters.victim = document.getElementById("victim").value || undefined;
  filters.weapon = document.getElementById("weapon").value || undefined;
  filters.minAmount = document.getElementById("minAmount").value || undefined;
  filters.maxAmount = document.getElementById("maxAmount").value || undefined;
  document.getElementById("filtersModal").close();
  renderChips();
  loadData();
  loadStats();
}

function clearAdvancedFilters() {
  ["identifier", "victim", "weapon", "minAmount", "maxAmount"].forEach(id => {
    document.getElementById(id).value = "";
  });
  filters.identifier = undefined;
  filters.victim = undefined;
  filters.weapon = undefined;
  filters.minAmount = undefined;
  filters.maxAmount = undefined;
}

function renderChips() {
  const chipsContainer = document.getElementById("chips");
  chipsContainer.innerHTML = "";
  Object.entries(filters).forEach(([key, value]) => {
    if (value) {
      const chip = document.createElement("span");
      chip.className = "chip";
      chip.innerHTML = `${key}: ${value} ✖`;
      chip.onclick = () => {
        delete filters[key];
        document.getElementById(key)?.value && (document.getElementById(key).value = "");
        renderChips();
        loadData();
        loadStats();
      };
      chipsContainer.appendChild(chip);
    }
  });
}

async function loadData() {
  try {
    document.getElementById("errorBanner").style.display = "none";
    const params = new URLSearchParams(filters);
    const res = await fetch(`${API_URL}/logs?${params.toString()}`);
    if (!res.ok) throw new Error("API error");
    const { data } = await res.json();

    const list = document.getElementById("list");
    list.innerHTML = "";
    data.forEach(log => {
      const item = document.createElement("div");
      item.className = "list-item";
      item.innerHTML = `
        <div>
          <strong>${log.type}</strong> — ${log.player_name}
          ${log.victim_name ? ` → ${log.victim_name}` : ""}
          ${log.amount ? ` — $${log.amount}` : ""}
        </div>
        <div class="date">${new Date(log.created_at).toLocaleString()}</div>
      `;
      list.appendChild(item);
    });

    document.getElementById("apiLed").style.background = "#4caf50";
  } catch (err) {
    console.error(err);
    document.getElementById("errorBanner").style.display = "block";
    document.getElementById("apiLed").style.background = "#f44336";
  }
}

async function loadStats() {
  try {
    const res = await fetch(`${API_URL}/stats?hours=24`);
    if (!res.ok) throw new Error("API error");
    const stats = await res.json();
    document.getElementById("kpiConnect").textContent = stats.connects || 0;
    document.getElementById("kpiKill").textContent = stats.kills || 0;
    document.getElementById("kpiTransfer").textContent = stats.transfers || 0;
    document.getElementById("kpiAmount").textContent = `$${stats.amount_sum || 0}`;
  } catch (err) {
    console.error(err);
  }
}

function exportCSV() {
  const params = new URLSearchParams(filters);
  fetch(`${API_URL}/logs?${params.toString()}`)
    .then(res => res.json())
    .then(({ data }) => {
      let csv = "Type,Player,Victim,Amount,Date\n";
      data.forEach(log => {
        csv += `${log.type},${log.player_name || ""},${log.victim_name || ""},${log.amount || 0},${log.created_at}\n`;
      });
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "logs.csv";
      a.click();
      URL.revokeObjectURL(url);
    });
}

function toggleLive() {
  liveMode = !liveMode;
  document.getElementById("liveToggle").textContent = `Live: ${liveMode ? "ON" : "OFF"}`;
  if (liveMode) {
    liveInterval = setInterval(() => {
      loadData();
      loadStats();
    }, 5000);
  } else {
    clearInterval(liveInterval);
  }
}
