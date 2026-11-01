// ===================================
// D&D CHARACTER MANAGER — SCRIPT CORRIGÉ
// D&D 5e / compatible avec index.html fourni
// ===================================

"use strict";

const $ = id => document.getElementById(id);
const SAVE_KEY = "dndCharacter_v3";

const abilities = {
  str: "Force", dex: "Dextérité", con: "Constitution",
  int: "Intelligence", wis: "Sagesse", cha: "Charisme"
};

const skillData = [
  ["Acrobaties","dex"],["Arcanes","int"],["Athlétisme","str"],
  ["Discrétion","dex"],["Dressage","wis"],["Escamotage","dex"],
  ["Histoire","int"],["Intimidation","cha"],["Investigation","int"],
  ["Médecine","wis"],["Nature","int"],["Perception","wis"],
  ["Perspicacité","wis"],["Persuasion","cha"],["Religion","int"],
  ["Représentation","cha"],["Survie","wis"],["Tromperie","cha"]
];

let classDatabase = {
  "Guerrier":{hitDie:10},"Barbare":{hitDie:12},"Paladin":{hitDie:10},
  "Rôdeur":{hitDie:10},"Roublard":{hitDie:8},"Moine":{hitDie:8},
  "Barde":{hitDie:8},"Clerc":{hitDie:8},"Druide":{hitDie:8},
  "Ensorceleur":{hitDie:6},"Magicien":{hitDie:6},"Occultiste":{hitDie:8}
};

function number(id, fallback=0) {
  const el = $(id);
  const n = el ? Number(el.value) : fallback;
  return Number.isFinite(n) ? n : fallback;
}
function mod(score) { return Math.floor((score - 10) / 2); }
function signed(n) { return n >= 0 ? `+${n}` : String(n); }
function set(id, value) { if ($(id)) $(id).value = value; }
function profBonus() { return 2 + Math.floor((Math.max(1, Math.min(20, number("level",1))) - 1) / 4); }

function refreshClasses(selected) {
  const select = $("class");
  if (!select) return;
  const wanted = selected || select.value || "Guerrier";
  select.replaceChildren();
  Object.keys(classDatabase).forEach(name => {
    const opt = document.createElement("option");
    opt.value = name; opt.textContent = name;
    select.appendChild(opt);
  });
  select.value = classDatabase[wanted] ? wanted : "Guerrier";
  calculate();
}

function addClass() {
  const name = prompt("Nom de la nouvelle classe :");
  if (!name || !name.trim()) return;
  const clean = name.trim();
  if (classDatabase[clean]) { alert("Cette classe existe déjà."); return; }
  const die = Number(prompt("Dé de vie : 6, 8, 10 ou 12", "8"));
  if (![6,8,10,12].includes(die)) { alert("Dé de vie invalide."); return; }
  classDatabase[clean] = {hitDie:die};
  refreshClasses(clean);
  saveCharacter(false);
  alert("Classe créée !");
}

function buildSaveAndSkillLists() {
  const saves = $("saves"), skills = $("skills");
  if (saves) {
    saves.replaceChildren();
    Object.entries(abilities).forEach(([id,label]) => {
      const row = document.createElement("div");
      row.className = "skill-line"; row.dataset.save = id;
      const lab = document.createElement("label");
      const cb = document.createElement("input");
      cb.type = "checkbox"; cb.setAttribute("aria-label", `Maîtrise ${label}`);
      const span = document.createElement("span"); span.textContent = label;
      const strong = document.createElement("strong"); strong.textContent = "+0";
      lab.append(cb,span); row.append(lab,strong); saves.appendChild(row);
    });
  }
  if (skills) {
    skills.replaceChildren();
    skillData.forEach(([label,stat]) => {
      const row = document.createElement("div");
      row.className = "skill-line"; row.dataset.skill = label; row.dataset.stat = stat;
      const lab = document.createElement("label");
      const cb = document.createElement("input");
      cb.type = "checkbox"; cb.setAttribute("aria-label", `Maîtrise ${label}`);
      const span = document.createElement("span"); span.textContent = label;
      const strong = document.createElement("strong"); strong.textContent = "+0";
      lab.append(cb,span); row.append(lab,strong); skills.appendChild(row);
    });
  }
}

function buildSpellSlots() {
  const root = $("slots");
  if (!root) return;
  root.replaceChildren();
  for (let i=1;i<=9;i++) {
    const label = document.createElement("label");
    label.appendChild(document.createTextNode(`Niv. ${i}`));
    const input = document.createElement("input");
    input.type="number"; input.min="0"; input.value="0"; input.dataset.slot=String(i);
    label.appendChild(input); root.appendChild(label);
  }
}

function calculate() {
  if (!$("str")) return;
  const mods = {};
  Object.keys(abilities).forEach(id => mods[id] = mod(number(id,10)));
  const pb = profBonus();
  set("prof", signed(pb));

  const summary = $("modifiers");
  if (summary) summary.innerHTML = Object.entries(abilities)
    .map(([id,label]) => `${label} : <b>${signed(mods[id])}</b>`).join(" · ");

  set("initiative", signed(mods.dex));
  let ac = 10 + mods.dex;
  const armor = $("armor")?.value || "none";
  if (armor === "light") ac = 11 + mods.dex;
  if (armor === "medium") ac = 14 + Math.min(2,mods.dex);
  if (armor === "heavy") ac = 16;
  if (armor === "custom") ac = number("customAC",10);
  ac += number("shield",0);
  set("ac", ac);

  const className = $("class")?.value || "Guerrier";
  const die = classDatabase[className]?.hitDie || 8;
  const lvl = Math.max(1,Math.min(20,number("level",1)));
  const hp = die + mods.con + (lvl-1)*(Math.floor(die/2)+1+mods.con);
  set("maxhp", Math.max(1,hp));

  document.querySelectorAll("[data-save], [data-skill]").forEach(row => {
    const stat = row.dataset.save || row.dataset.stat;
    const trained = !!row.querySelector('input[type="checkbox"]')?.checked;
    const output = row.querySelector("strong");
    if (output) output.textContent = signed((mods[stat] || 0) + (trained ? pb : 0));
  });

  const magic = $("magicStat")?.value || "int";
  set("spellDC", 8 + pb + (mods[magic] || 0));
  set("spellAttack", signed(pb + (mods[magic] || 0)));

  document.querySelectorAll("[data-attack]").forEach(row => {
    const stat = row.querySelector(".attack-stat")?.value || "str";
    const trained = !!row.querySelector(".attack-prof")?.checked;
    const out = row.querySelector(".attack-bonus");
    if (out) out.textContent = signed((mods[stat] || 0) + (trained ? pb : 0));
  });
}

function field(labelText, className, value="", type="text") {
  const label = document.createElement("label");
  label.textContent = labelText;
  const input = document.createElement("input");
  input.type = type; input.className = className; input.value = value ?? "";
  label.appendChild(input); return label;
}
function textarea(labelText,className,value="") {
  const label=document.createElement("label"); label.textContent=labelText;
  const el=document.createElement("textarea"); el.className=className; el.value=value ?? "";
  label.appendChild(el); return label;
}
function selectField(labelText,className,options,selected) {
  const label=document.createElement("label"); label.textContent=labelText;
  const el=document.createElement("select"); el.className=className;
  options.forEach(([v,t])=>{const o=document.createElement("option");o.value=v;o.textContent=t;el.appendChild(o);});
  if (selected !== undefined) el.value=selected;
  label.appendChild(el); return label;
}
function deleteButton(row) {
  const b=document.createElement("button"); b.type="button"; b.textContent="Supprimer";
  b.addEventListener("click",()=>row.remove()); return b;
}
function appendRow(target,row) {
  const root=$(target);
  if (!root) { console.error(`Conteneur #${target} introuvable`); return; }
  root.appendChild(row);
}
function wireCalculation(row) {
  row.querySelectorAll("input,select,textarea").forEach(el=>{
    el.addEventListener("input",calculate);
    el.addEventListener("change",calculate);
  });
}

function addAttack(data={}) {
  const row=document.createElement("div"); row.className="row-item"; row.dataset.attack="true";
  row.append(field("Nom de l'attaque","attack-name",data.name||""));
  row.append(selectField("Caractéristique utilisée","attack-stat",[
    ["str","Force"],["dex","Dextérité"],["int","Intelligence"],["wis","Sagesse"],["cha","Charisme"]
  ],data.stat||"str"));
  const lab=document.createElement("label"); lab.textContent="Maîtrise de l'arme";
  const cb=document.createElement("input"); cb.type="checkbox"; cb.className="attack-prof"; cb.checked=!!data.prof; lab.appendChild(cb); row.appendChild(lab);
  const p=document.createElement("p"); p.append("Bonus d’attaque : ");
  const strong=document.createElement("strong"); strong.className="attack-bonus"; strong.textContent="+0"; p.appendChild(strong); row.appendChild(p);
  row.append(field("Dégâts (ex : 1d8+3)","attack-damage",data.damage||"1d8"));
  row.append(field("Type de dégâts","attack-type",data.type||"Tranchant"));
  row.append(field("Portée","attack-range",data.range||"Corps-à-corps"));
  row.append(textarea("Description","attack-description",data.description||""));
  row.append(deleteButton(row)); appendRow("attacks",row); wireCalculation(row); calculate();
}
function addAbility(data={}) {
  const row=document.createElement("div"); row.className="row-item";
  row.append(field("Nom","ability-name",data.name||""));
  row.append(selectField("Type","ability-type",[["Passive","Passive"],["Active","Active"],["Réaction","Réaction"]],data.type||"Passive"));
  row.append(textarea("Description","ability-description",data.description||""));
  row.append(field("Utilisations / recharge","ability-uses",data.uses||""));
  row.append(deleteButton(row)); appendRow("abilities",row);
}
function addSpell(data={}) {
  const row=document.createElement("div"); row.className="row-item";
  row.append(field("Nom du sort","spell-name",data.name||""));
  row.append(field("Niveau du sort","spell-level",data.level??0,"number"));
  row.append(field("Temps d'incantation","spell-time",data.time||""));
  row.append(field("Portée","spell-range",data.range||""));
  row.append(textarea("Description","spell-description",data.description||""));
  row.append(deleteButton(row)); appendRow("spells",row);
}
function addEquipment(data={}) { addSimpleItem("equipment",data); }
function addItem(data={}) { addSimpleItem("inventory",data); }
function addSimpleItem(target,data={}) {
  const row=document.createElement("div"); row.className="row-item";
  row.append(field("Nom","item-name",data.name||""));
  row.append(field("Quantité","item-quantity",data.quantity??1,"number"));
  row.append(textarea("Description","item-description",data.description||""));
  row.append(deleteButton(row)); appendRow(target,row);
}
function addQuest(data={}) {
  const row=document.createElement("div"); row.className="row-item";
  row.append(field("Nom de la quête","quest-name",data.name||""));
  row.append(textarea("Objectif","quest-objective",data.objective||""));
  row.append(selectField("Statut","quest-status",[["À faire","À faire"],["En cours","En cours"],["Terminée","Terminée"]],data.status||"À faire"));
  row.append(deleteButton(row)); appendRow("quests",row);
}

function collectRows(selector, mapper) {
  return Array.from(document.querySelectorAll(selector)).map(mapper);
}
function read(el) { return el ? el.value : ""; }
function collectCharacter() {
  const staticFields={};
  document.querySelectorAll("#character-sheet input[id], #character-sheet select[id], #character-sheet textarea[id]").forEach(el=>{
    staticFields[el.id] = el.type==="checkbox" ? el.checked : el.value;
  });
  const checks={};
  document.querySelectorAll("#saves [data-save], #skills [data-skill]").forEach(row=>{
    const key=row.dataset.save ? `save:${row.dataset.save}` : `skill:${row.dataset.skill}`;
    checks[key]=!!row.querySelector('input[type="checkbox"]')?.checked;
  });
  const slots={};
  document.querySelectorAll("[data-slot]").forEach(el=>slots[el.dataset.slot]=el.value);
  return {
    version:3, classDatabase, staticFields, checks, slots,
    attacks:collectRows("#attacks [data-attack]",r=>({
      name:read(r.querySelector(".attack-name")),stat:read(r.querySelector(".attack-stat")),
      prof:!!r.querySelector(".attack-prof")?.checked,damage:read(r.querySelector(".attack-damage")),
      type:read(r.querySelector(".attack-type")),range:read(r.querySelector(".attack-range")),
      description:read(r.querySelector(".attack-description"))
    })),
    abilities:collectRows("#abilities .row-item",r=>({
      name:read(r.querySelector(".ability-name")),type:read(r.querySelector(".ability-type")),
      description:read(r.querySelector(".ability-description")),uses:read(r.querySelector(".ability-uses"))
    })),
    spells:collectRows("#spells .row-item",r=>({
      name:read(r.querySelector(".spell-name")),level:read(r.querySelector(".spell-level")),
      time:read(r.querySelector(".spell-time")),range:read(r.querySelector(".spell-range")),
      description:read(r.querySelector(".spell-description"))
    })),
    equipment:collectSimple("equipment"), inventory:collectSimple("inventory"),
    quests:collectRows("#quests .row-item",r=>({
      name:read(r.querySelector(".quest-name")),objective:read(r.querySelector(".quest-objective")),
      status:read(r.querySelector(".quest-status"))
    }))
  };
}
function collectSimple(id) {
  return collectRows(`#${id} .row-item`,r=>({
    name:read(r.querySelector(".item-name")),quantity:read(r.querySelector(".item-quantity")),
    description:read(r.querySelector(".item-description"))
  }));
}
function saveCharacter(showAlert=true) {
  try {
    localStorage.setItem(SAVE_KEY,JSON.stringify(collectCharacter()));
    if(showAlert) alert("Personnage sauvegardé !");
  } catch(err) {
    console.error(err); alert("Échec de la sauvegarde. Vérifie que le stockage du navigateur est autorisé.");
  }
}
function loadCharacter() {
  let raw=null;
  try { raw=localStorage.getItem(SAVE_KEY)||localStorage.getItem("dndCharacter_v2")||localStorage.getItem("dndCharacter"); }
  catch(err) { alert("Le stockage local est inaccessible dans ce navigateur."); return; }
  if(!raw) { alert("Aucune sauvegarde trouvée."); return; }
  try {
    const data=JSON.parse(raw);
    if(data.classDatabase) classDatabase={...classDatabase,...data.classDatabase};

    ["attacks","abilities","spells","equipment","inventory","quests"].forEach(id=>{if($(id)) $(id).replaceChildren();});
    (data.attacks||[]).forEach(addAttack);
    (data.abilities||[]).forEach(addAbility);
    (data.spells||[]).forEach(addSpell);
    (data.equipment||[]).forEach(addEquipment);
    (data.inventory||[]).forEach(addItem);
    (data.quests||[]).forEach(addQuest);

    refreshClasses(data.staticFields?.class || undefined);
    if(data.staticFields) Object.entries(data.staticFields).forEach(([id,value])=>{
      const el=$(id); if(!el) return;
      if(el.type==="checkbox") el.checked=!!value; else el.value=value;
    });
    if(data.checks) Object.entries(data.checks).forEach(([key,value])=>{
      let row=null;
      if(key.startsWith("save:")) row=document.querySelector(`[data-save="${CSS.escape(key.slice(5))}"]`);
      if(key.startsWith("skill:")) row=Array.from(document.querySelectorAll("[data-skill]")).find(r=>r.dataset.skill===key.slice(6));
      const cb=row?.querySelector('input[type="checkbox"]'); if(cb) cb.checked=!!value;
    });
    if(data.slots) Object.entries(data.slots).forEach(([level,value])=>{
      const el=document.querySelector(`[data-slot="${level}"]`); if(el) el.value=value;
    });
    calculate();
    alert("Personnage chargé !");
  } catch(err) {
    console.error("Erreur de chargement :",err);
    alert("La sauvegarde est illisible ou incompatible.");
  }
}

async function exportPDF() {
  if(typeof html2pdf==="undefined") {
    alert("La bibliothèque PDF n'est pas chargée. Vérifie ta connexion internet puis réessaie.");
    return;
  }
  const original=$("character-sheet");
  if(!original) { alert("La fiche #character-sheet est introuvable."); return; }
  const clone=original.cloneNode(true);
  const src=original.querySelectorAll("input,select,textarea");
  const dst=clone.querySelectorAll("input,select,textarea");
  src.forEach((el,i)=>{
    if(!dst[i]) return;
    dst[i].value=el.value;
    if(el.type==="checkbox") dst[i].checked=el.checked;
  });
  clone.classList.add("pdf-exporting");
  clone.querySelectorAll("button").forEach(b=>b.remove());
  const filename=(read($("name")).trim()||"Personnage").replace(/[\\/:*?"<>|]/g,"_")+".pdf";
  try {
    await html2pdf().set({
      margin:[10,10,10,10], filename,
      image:{type:"jpeg",quality:0.96},
      html2canvas:{scale:2,useCORS:true,backgroundColor:"#ffffff",logging:false},
      jsPDF:{unit:"mm",format:"a4",orientation:"portrait"},
      pagebreak:{mode:["css","legacy"],avoid:[".skill-line",".stat-box",".combat-stat"]}
    }).from(clone).save();
  } catch(err) {
    console.error("Erreur PDF :",err); alert("Erreur pendant la création du PDF.");
  }
}

// Rendre les fonctions accessibles aux onclick="" du HTML.
Object.assign(window,{
  addClass,addAttack,addAbility,addSpell,addEquipment,addItem,addQuest,
  saveCharacter,loadCharacter,exportPDF,calculate
});

function initialize() {
  if(window.__dndManagerInitialized) return;
  window.__dndManagerInitialized=true;
  buildSaveAndSkillLists();
  buildSpellSlots();
  refreshClasses("Guerrier");
  document.addEventListener("input",e=>{
    if(e.target.matches("input,select")) calculate();
  });
  document.addEventListener("change",e=>{
    if(e.target.matches("input,select")) calculate();
  });
  calculate();
  console.log("D&D Character Manager : initialisé correctement.");
}
if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",initialize);
else initialize();
