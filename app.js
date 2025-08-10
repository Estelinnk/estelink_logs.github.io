const API_URL = "https://fivem-logs-api.onrender.com";

const logsContainer = document.getElementById("logs");
const searchInput = document.getElementById("search");
const dateInput = document.getElementById("date");
const typeSelect = document.getElementById("type");

const statsElements = {
  connections: document.getElementById("stat-connections"),
  kills: document.getElementById("stat-kills"),
  transfers: document.getElementById("stat-transfers"),
  amount: document.getElementById("stat-amount"),
};
const apiStatus = document.getElementById("api-status");

// ---- helpers
function idBlock(src, identifier) {
  const parts = [];
  if (src != null && src !== "") parts.push(`[${src}]`);
  if (identifier) parts.push(`[${identifier}]`);
  return parts.join(" ");
}
function safeJson(v){ try{ return typeof v==='string' ? JSON.parse(v) : v }catch{ return null } }
function fmtAmount(a){ return a!=null ? `${Number(a).toLocaleString("fr-FR")} $` : "" }
function formatDate(s){ return new Date(s).toLocaleString("fr-FR") }
function updateAPIStatus(ok){ apiStatus.textContent = ok ? "🟢 API" : "🔴 API" }

// ---- data
async function loadData() {
  const q = searchInput.value.trim();
  const d = dateInput.value;
  const t = typeSelect.value;
  const qs = new URLSearchParams();
  if (q) qs.set("search", q);
  if (d) qs.set("date", d);
  if (t) qs.set("type", t);

  try{
    const r = await fetch(`${API_URL}/logs?${qs.toString()}`);
    if(!r.ok) throw new Error(r.status);
    const { data } = await r.json();
    displayLogs(data); updateAPIStatus(true);
  }catch(e){ console.error(e); updateAPIStatus(false); }
}

function displayLogs(logs){
  logsContainer.innerHTML = "";
  logs.forEach(log=>{
    const d = safeJson(log.details) || {};
    let content = "";
    switch(log.type){
      case "kill":
        content = `${translateText(log.player_name)} ${idBlock(log.player_src, log.identifier)} a tué ${translateText(log.victim_name)||"???"} ${idBlock(log.victim_src, log.victim_identifier)} avec ${translateText(log.weapon)||"[TYPE D’ARME]"}.`;
        break;
      case "transfer": {
        const from = d.account_from ?? d.src ?? "[Compte]";
        const to   = d.account_to   ?? d.dst ?? "[Compte]";
        content = `${translateText(log.player_name)} ${idBlock(log.player_src, log.identifier)} a transféré ${fmtAmount(log.amount)} du compte ${from} vers ${to} de ${translateText(log.target_name)||"???"} ${idBlock(log.target_src, log.target_identifier)}.`;
        break;
      }
      case "stash": {
        const item = d.item || "[Objet]";
        const stash= d.stash || d.vehicle || "[Stash]";
        const act  = (d.action === "withdraw") ? "retiré" : "mis";
        content = `${translateText(log.player_name)} ${idBlock(log.player_src, log.identifier)} a ${act} ${translateText(item)} dans un coffre ${stash}.`;
        break;
      }
      default:
        content = `${log.type} — ${translateText(log.player_name)} ${idBlock(log.player_src, log.identifier)}`;
    }

    const el = document.createElement("div");
    el.className = "log";
    el.innerHTML = `<small>${formatDate(log.time)}</small><p>${content}</p>`;
    logsContainer.appendChild(el);
  });
}

async function loadStats(){
  try{
    const r = await fetch(`${API_URL}/stats?hours=24`);
    const s = await r.json();
    statsElements.connections.textContent = s.connections || 0;
    statsElements.kills.textContent      = s.kills || 0;
    statsElements.transfers.textContent  = s.transfers || 0;
    statsElements.amount.textContent     = (s.amount || 0).toLocaleString("fr-FR") + " $";
  }catch{ /* noop */ }
}

// ---- events
searchInput.addEventListener("input", loadData);
dateInput.addEventListener("change", loadData);
typeSelect.addEventListener("change", loadData);
loadData(); loadStats();
