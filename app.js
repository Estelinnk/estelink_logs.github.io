// =====================
// CONFIG
// =====================
const RAW_API_URL = "https://fivem-logs-api.onrender.com"; // <-- mets ton URL si différente
const API_URL = RAW_API_URL.replace(/\/+$/, "");            // normalise (retire slash final)
const REFRESH_MS = 5000; // si tu actives un mode live plus tard

// =====================
// STATE + DOM
// =====================
let filters = {}; // { q, date, type, identifier, victim, weapon, minAmount, maxAmount, cursor, limit }
const $ = s => document.querySelector(s);

const elError = $("#errorBanner");
const elApiUrlText = $("#apiUrlText");
const elApiLed = $("#apiLed");
const elList = $("#list");

// Inputs
const elSearch = $("#search");
const elDate = $("#date");
const elType = $("#type");
const elOpenFilters = $("#openFilters");
const elFilters = $("#filtersModal");
const elCloseFilters = $("#closeFilters");
const elApply = $("#applyFilters");
const elClear = $("#clearFilters");

// (KPIs gardés pour compat si tu veux les réafficher)
const kpiConnect = $("#kpiConnect");
const kpiKill = $("#kpiKill");
const kpiTransfer = $("#kpiTransfer");
const kpiAmount = $("#kpiAmount");

// =====================
// UTILS RENDER
// =====================
function safeJson(v){ if(!v) return null; if(typeof v === "object") return v; try{ return JSON.parse(v); }catch{ return null; } }
function fmtId(id){ return id ? `[${id}]` : ``; }
function fmtAmount(a){ if(a==null) return ``; const n=Number(a)||0; return `${n.toLocaleString("fr-FR")} $`; }

function renderLine(log){
  const d = safeJson(log.details);
  switch(log.type){
    case "kill":
      return `${log.player_name} ${fmtId(log.identifier)} a tué ${log.victim_name||"???"} ${fmtId(log.victim_identifier)} avec ${log.weapon||"[TYPE D’ARME]"}.`;
    case "stash": {
      const item = d?.item || "[OBJET]";
      const veh  = d?.vehicle_id || "[ID-VÉHICULE]";
      const act  = (d?.action === "withdraw") ? "retiré" : "mis";
      return `${log.player_name} ${fmtId(log.identifier)} a ${act} ${item} dans un coffre de voiture ${veh}.`;
    }
    case "transfer": {
      const from = d?.account_from || "[ID-COMPTE-BANCAIRE]";
      const to   = d?.account_to   || "[ID-COMPTE-BANCAIRE]";
      return `${log.player_name} ${fmtId(log.identifier)} a transféré ${fmtAmount(log.amount)} depuis son compte ${from} au compte personnel ${to} de ${log.target_name||"???"} ${fmtId(log.target_identifier)}.`;
    }
    case "connect":
      return `${log.player_name} ${fmtId(log.identifier)} s’est connecté.`;
    case "disconnect":
      return `${log.player_name} ${fmtId(log.identifier)} s’est déconnecté.`;
    default:
      return `${log.type} — ${log.player_name}`;
  }
}

function setApiStatus(ok){
  elApiLed && (elApiLed.style.background = ok ? "#79e079" : "#ff6b6b");
  elError.style.display = ok ? "none" : "block";
  elApiUrlText.textContent = API_URL || "";
}

// =====================
// FETCH
// =====================
async function loadData(){
  try{
    const qs = new URLSearchParams();
    Object.entries(filters).forEach(([k,v]) => { if(v!=null && v!=="") qs.set(k,v); });

    const res = await fetch(`${API_URL}/logs?` + qs.toString(), { mode: "cors" });
    if(!res.ok) throw new Error(`API error ${res.status}`);
    const { data } = await res.json();

    // render list
    elList.innerHTML = "";
    data.forEach(log=>{
      const item = document.createElement("div");
      item.className = "item";
      item.innerHTML = `
        <div class="time">${new Date(log.created_at).toLocaleString("fr-FR")}</div>
        <div class="msg">${renderLine(log)}</div>
      `;
      elList.appendChild(item);
    });

    setApiStatus(true);
  }catch(err){
    console.error("loadData:", err);
    setApiStatus(false);
  }
}

async function loadStats(){
  try{
    const res = await fetch(`${API_URL}/stats?hours=24`, { mode:"cors" });
    if(!res.ok) throw new Error(`API error ${res.status}`);
    const s = await res.json();
    if(kpiConnect)  kpiConnect.textContent  = s.connects   ?? 0;
    if(kpiKill)     kpiKill.textContent     = s.kills      ?? 0;
    if(kpiTransfer) kpiTransfer.textContent = s.transfers  ?? 0;
    if(kpiAmount)   kpiAmount.textContent   = (s.amount_sum ?? 0).toLocaleString("fr-FR") + " $";
  }catch(err){
    console.warn("loadStats:", err);
  }
}

// =====================
// FILTERS
// =====================
function refresh(){
  loadData();
  loadStats();
}

function applyBasics(){
  filters.q = elSearch.value || undefined;
  filters.date = elDate.value || undefined;
  filters.type = elType.value || undefined;
}

function applyAdvanced(){
  filters.identifier = ($("#identifier")?.value) || undefined;
  filters.victim     = ($("#victim")?.value)     || undefined;
  filters.weapon     = ($("#weapon")?.value)     || undefined;
  filters.minAmount  = ($("#minAmount")?.value)  || undefined;
  filters.maxAmount  = ($("#maxAmount")?.value)  || undefined;
}

function clearAdvanced(){
  ["identifier","victim","weapon","minAmount","maxAmount"].forEach(id=>{
    const el = document.getElementById(id);
    if(el) el.value = "";
  });
  filters.identifier = filters.victim = filters.weapon = filters.minAmount = filters.maxAmount = undefined;
}

// =====================
// EVENTS
// =====================
document.addEventListener("DOMContentLoaded", ()=>{
  // init banner
  elApiUrlText.textContent = API_URL;

  // basics
  elSearch.addEventListener("input", ()=>{ applyBasics(); refresh(); });
  elDate.addEventListener("change", ()=>{ applyBasics(); refresh(); });
  elType.addEventListener("change", ()=>{ applyBasics(); refresh(); });

  // modal
  elOpenFilters.addEventListener("click", ()=> elFilters.showModal());
  elCloseFilters.addEventListener("click", ()=> elFilters.close());
  elApply.addEventListener("click", ()=>{ applyAdvanced(); elFilters.close(); refresh(); });
  elClear.addEventListener("click", ()=>{ clearAdvanced(); });

  // first load
  applyBasics();
  refresh();
});
