// ===================================
// D&D CHARACTER MANAGER
// D&D 5e - Version 2014
// Script complet compatible avec index.html refondu
// ===================================

"use strict";

const $ = id => document.getElementById(id);

// ===================================
// BASE DE DONNÉES DES CLASSES
// ===================================

let classDatabase = {
  "Guerrier": { hitDie: 10 },
  "Barbare": { hitDie: 12 },
  "Paladin": { hitDie: 10 },
  "Rôdeur": { hitDie: 10 },
  "Roublard": { hitDie: 8 },
  "Moine": { hitDie: 8 },
  "Barde": { hitDie: 8 },
  "Clerc": { hitDie: 8 },
  "Druide": { hitDie: 8 },
  "Ensorceleur": { hitDie: 6 },
  "Magicien": { hitDie: 6 },
  "Occultiste": { hitDie: 8 }
};

const abilities = {
  str: "Force",
  dex: "Dextérité",
  con: "Constitution",
  int: "Intelligence",
  wis: "Sagesse",
  cha: "Charisme"
};

const skillData = [
  ["Acrobaties", "dex"],
  ["Arcanes", "int"],
  ["Athlétisme", "str"],
  ["Discrétion", "dex"],
  ["Dressage", "wis"],
  ["Escamotage", "dex"],
  ["Histoire", "int"],
  ["Intimidation", "cha"],
  ["Investigation", "int"],
  ["Médecine", "wis"],
  ["Nature", "int"],
  ["Perception", "wis"],
  ["Perspicacité", "wis"],
  ["Persuasion", "cha"],
  ["Religion", "int"],
  ["Représentation", "cha"],
  ["Survie", "wis"],
  ["Tromperie", "cha"]
];

const SAVE_KEY = "dndCharacter_v2";

// ===================================
// OUTILS GÉNÉRAUX
// ===================================

function abilityMod(value) {
  return Math.floor((Number(value) - 10) / 2);
}

function modifierText(value) {
  const n = Number(value) || 0;
  return n >= 0 ? "+" + n : String(n);
}

function getStat(id) {
  const element = $(id);
  return element ? (Number(element.value) || 0) : 0;
}

function proficiency() {
  const level = Math.max(1, Math.min(20, getStat("level") || 1));
  return 2 + Math.floor((level - 1) / 4);
}

function setValue(id, value) {
  const element = $(id);
  if (element) element.value = value;
}

function addOptions(select, values, selected) {
  select.innerHTML = "";
  values.forEach(([value, label]) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = label;
    select.appendChild(option);
  });
  if (selected !== undefined) select.value = selected;
}

// ===================================
// CLASSES
// ===================================

function refreshClasses(selectedName) {
  const select = $("class");
  if (!select) return;

  const current = selectedName || select.value;
  select.innerHTML = "";

  Object.keys(classDatabase).forEach(name => {
    const option = document.createElement("option");
    option.value = name;
    option.textContent = name;
    select.appendChild(option);
  });

  if (classDatabase[current]) select.value = current;
  calculate();
}

function addClass() {
  const name = prompt("Nom de la nouvelle classe :");
  if (!name || !name.trim()) return;

  const className = name.trim();
  if (classDatabase[className]) {
    alert("Cette classe existe déjà !");
    return;
  }

  const die = Number(prompt("Dé de vie : 6, 8, 10 ou 12", "8"));
  if (![6, 8, 10, 12].includes(die)) {
    alert("Dé de vie invalide !");
    return;
  }

  classDatabase[className] = { hitDie: die };
  refreshClasses(className);
  saveCharacter(false);
  alert("Classe créée !");
}

// ===================================
// CRÉATION DES SAUVEGARDES / COMPÉTENCES
// ===================================

function buildSaveAndSkillLists() {
  const saves = $("saves");
  const skills = $("skills");

  if (saves) {
    saves.innerHTML = Object.entries(abilities).map(([id, name]) => `
      <div class="skill-line" data-save="${id}">
        <label>
          <input type="checkbox" aria-label="Maîtrise ${name}">
          <span>${name}</span>
        </label>
        <strong>+0</strong>
      </div>
    `).join("");
  }

  if (skills) {
    skills.innerHTML = skillData.map(([name, stat]) => `
      <div class="skill-line" data-skill="${name}" data-stat="${stat}">
        <label>
          <input type="checkbox" aria-label="Maîtrise ${name}">
          <span>${name}</span>
        </label>
        <strong>+0</strong>
      </div>
    `).join("");
  }
}

// ===================================
// CALCULS AUTOMATIQUES
// ===================================

function calculate() {
  if (!$("class") || !$("str")) return;

  const mods = {};
  Object.keys(abilities).forEach(id => {
    mods[id] = abilityMod(getStat(id));
  });

  const prof = proficiency();
  setValue("prof", modifierText(prof));

  const modifiers = $("modifiers");
  if (modifiers) {
    modifiers.innerHTML = Object.entries(abilities)
      .map(([id, name]) => `${name} : <b>${modifierText(mods[id])}</b>`)
      .join(" · ");
  }

  setValue("initiative", modifierText(mods.dex));

  // Classe d'armure selon les règles de base 5e 2014.
  let ac = 10 + mods.dex;
  const armor = $("armor")?.value || "none";

  if (armor === "light") ac = 11 + mods.dex;
  if (armor === "medium") ac = 14 + Math.min(2, mods.dex);
  if (armor === "heavy") ac = 16;
  if (armor === "custom") ac = getStat("customAC");

  ac += Number($("shield")?.value || 0);
  setValue("ac", ac);

  // PV maximum : niveau 1 au maximum du dé, puis moyenne arrondie supérieure.
  const className = $("class").value;
  const die = classDatabase[className]?.hitDie || 8;
  const level = Math.max(1, Math.min(20, getStat("level") || 1));
  const con = mods.con;
  const maxHP = die + con + (level - 1) * (Math.floor(die / 2) + 1 + con);
  setValue("maxhp", Math.max(1, maxHP));

  document.querySelectorAll("[data-save]").forEach(row => {
    const stat = row.dataset.save;
    const trained = !!row.querySelector('input[type="checkbox"]')?.checked;
    const bonus = mods[stat] + (trained ? prof : 0);
    const output = row.querySelector("strong");
    if (output) output.textContent = modifierText(bonus);
  });

  document.querySelectorAll("[data-skill]").forEach(row => {
    const stat = row.dataset.stat;
    const trained = !!row.querySelector('input[type="checkbox"]')?.checked;
    const bonus = mods[stat] + (trained ? prof : 0);
    const output = row.querySelector("strong");
    if (output) output.textContent = modifierText(bonus);
  });

  const magicStat = $("magicStat")?.value || "int";
  setValue("spellDC", 8 + prof + (mods[magicStat] || 0));
  setValue("spellAttack", modifierText(prof + (mods[magicStat] || 0)));

  document.querySelectorAll("[data-attack]").forEach(row => {
    const stat = row.querySelector(".attack-stat")?.value || "str";
    const trained = !!row.querySelector(".attack-prof")?.checked;
    const bonus = (mods[stat] || 0) + (trained ? prof : 0);
    const output = row.querySelector(".attack-bonus");
    if (output) output.textContent = modifierText(bonus);
  });
}

// ===================================
// OUTILS POUR LES FICHES DYNAMIQUES
// ===================================

function makeField(labelText, className, value = "", type = "text") {
  const label = document.createElement("label");
  label.textContent = labelText;

  const input = document.createElement("input");
  input.type = type;
  input.className = className;
  input.value = value;
  label.appendChild(input);

  return label;
}

function makeTextarea(labelText, className, value = "") {
  const label = document.createElement("label");
  label.textContent = labelText;

  const textarea = document.createElement("textarea");
  textarea.className = className;
  textarea.value = value;
  label.appendChild(textarea);

  return label;
}

function makeSelect(labelText, className, options, selected) {
  const label = document.createElement("label");
  label.textContent = labelText;

  const select = document.createElement("select");
  select.className = className;

  options.forEach(([value, text]) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = text;
    select.appendChild(option);
  });

  if (selected !== undefined) select.value = selected;
  label.appendChild(select);

  return label;
}

function makeDeleteButton(container) {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = "Supprimer";
  button.addEventListener("click", () => {
    container.remove();
    calculate();
  });
  return button;
}

// ===================================
// ATTAQUES
// ===================================

function addAttack(data = {}) {
  const container = document.createElement("div");
  container.className = "row-item";
  container.dataset.attack = "true";

  container.appendChild(makeField("Nom de l'attaque", "attack-name", data.name || ""));
  container.appendChild(makeSelect("Caractéristique utilisée", "attack-stat", [
    ["str", "Force"], ["dex", "Dextérité"], ["int", "Intelligence"],
    ["wis", "Sagesse"], ["cha", "Charisme"]
  ], data.stat || "str"));

  const profLabel = document.createElement("label");
  profLabel.textContent = "Maîtrise de l'arme";
  const profInput = document.createElement("input");
  profInput.type = "checkbox";
  profInput.className = "attack-prof";
  profInput.checked = !!data.prof;
  profLabel.appendChild(profInput);
  container.appendChild(profLabel);

  const bonus = document.createElement("p");
  bonus.innerHTML = 'Bonus d’attaque : <strong class="attack-bonus">+0</strong>';
  container.appendChild(bonus);

  container.appendChild(makeField("Dégâts (ex : 1d8+3)", "attack-damage", data.damage || "1d8"));
  container.appendChild(makeField("Type de dégâts", "attack-type", data.type || "Tranchant"));
  container.appendChild(makeField("Portée", "attack-range", data.range || "Corps-à-corps"));
  container.appendChild(makeTextarea("Description", "attack-description", data.description || ""));
  container.appendChild(makeDeleteButton(container));

  $("attacks").appendChild(container);
  container.querySelectorAll("input, select, textarea").forEach(el => {
    el.addEventListener("input", calculate);
    el.addEventListener("change", calculate);
  });
  calculate();
}

// ===================================
// CAPACITÉS
// ===================================

function addAbility(data = {}) {
  const container = document.createElement("div");
  container.className = "row-item";

  container.appendChild(makeField("Nom", "ability-name", data.name || ""));
  container.appendChild(makeSelect("Type", "ability-type", [
    ["Passive", "Passive"], ["Active", "Active"], ["Réaction", "Réaction"]
  ], data.type || "Passive"));
  container.appendChild(makeTextarea("Description", "ability-description", data.description || ""));
  container.appendChild(makeField("Utilisations / recharge", "ability-uses", data.uses || ""));
  container.appendChild(makeDeleteButton(container));

  $("abilities").appendChild(container);
}

// ===================================
// SORTS
// ===================================

function addSpell(data = {}) {
  const container = document.createElement("div");
  container.className = "row-item";

  container.appendChild(makeField("Nom du sort", "spell-name", data.name || ""));
  container.appendChild(makeField("Niveau du sort", "spell-level", data.level ?? 0, "number"));
  container.appendChild(makeField("Temps d'incantation", "spell-time", data.time || ""));
  container.appendChild(makeField("Portée", "spell-range", data.range || ""));
  container.appendChild(makeTextarea("Description", "spell-description", data.description || ""));
  container.appendChild(makeDeleteButton(container));

  $("spells").appendChild(container);
}

// ===================================
// ÉQUIPEMENT / INVENTAIRE
// ===================================

function addEquipment(data = {}) {
  addSimpleItem("equipment", data);
}

function addItem(data = {}) {
  addSimpleItem("inventory", data);
}

function addSimpleItem(target, data = {}) {
  const container = document.createElement("div");
  container.className = "row-item";

  container.appendChild(makeField("Nom", "item-name", data.name || ""));
  container.appendChild(makeField("Quantité", "item-quantity", data.quantity ?? 1, "number"));
  container.appendChild(makeTextarea("Description", "item-description", data.description || ""));
  container.appendChild(makeDeleteButton(container));

  $(target).appendChild(container);
}

// ===================================
// QUÊTES
// ===================================

function addQuest(data = {}) {
  const container = document.createElement("div");
  container.className = "row-item";

  container.appendChild(makeField("Nom de la quête", "quest-name", data.name || ""));
  container.appendChild(makeTextarea("Objectif", "quest-objective", data.objective || ""));
  container.appendChild(makeSelect("Statut", "quest-status", [
    ["À faire", "À faire"], ["En cours", "En cours"], ["Terminée", "Terminée"]
  ], data.status || "À faire"));
  container.appendChild(makeDeleteButton(container));

  $("quests").appendChild(container);
}

// ===================================
// EMPLACEMENTS DE SORTS
// ===================================

function buildSpellSlots() {
  const slots = $("slots");
  if (!slots) return;
  slots.innerHTML = "";

  for (let level = 1; level <= 9; level++) {
    const label = document.createElement("label");
    label.textContent = `Niv. ${level}`;

    const input = document.createElement("input");
    input.type = "number";
    input.min = "0";
    input.value = "0";
    input.dataset.slot = String(level);

    label.appendChild(input);
    slots.appendChild(label);
  }
}

// ===================================
// SAUVEGARDE / CHARGEMENT
// ===================================

function collectCharacter() {
  const fields = {};

  document.querySelectorAll("input, select, textarea").forEach((el, index) => {
    // Ne pas stocker les champs calculés comme seules sources de vérité.
    fields[index] = {
      id: el.id || null,
      className: el.className || "",
      value: el.value,
      checked: !!el.checked
    };
  });

  const data = {
    version: 2,
    classDatabase,
    fields,
    attacks: Array.from(document.querySelectorAll("[data-attack]")).map(row => ({
      name: row.querySelector(".attack-name")?.value || "",
      stat: row.querySelector(".attack-stat")?.value || "str",
      prof: !!row.querySelector(".attack-prof")?.checked,
      damage: row.querySelector(".attack-damage")?.value || "",
      type: row.querySelector(".attack-type")?.value || "",
      range: row.querySelector(".attack-range")?.value || "",
      description: row.querySelector(".attack-description")?.value || ""
    })),
    abilities: Array.from(document.querySelectorAll("#abilities .row-item")).map(row => ({
      name: row.querySelector(".ability-name")?.value || "",
      type: row.querySelector(".ability-type")?.value || "Passive",
      description: row.querySelector(".ability-description")?.value || "",
      uses: row.querySelector(".ability-uses")?.value || ""
    })),
    spells: Array.from(document.querySelectorAll("#spells .row-item")).map(row => ({
      name: row.querySelector(".spell-name")?.value || "",
      level: row.querySelector(".spell-level")?.value || 0,
      time: row.querySelector(".spell-time")?.value || "",
      range: row.querySelector(".spell-range")?.value || "",
      description: row.querySelector(".spell-description")?.value || ""
    })),
    equipment: collectSimpleItems("equipment"),
    inventory: collectSimpleItems("inventory"),
    quests: Array.from(document.querySelectorAll("#quests .row-item")).map(row => ({
      name: row.querySelector(".quest-name")?.value || "",
      objective: row.querySelector(".quest-objective")?.value || "",
      status: row.querySelector(".quest-status")?.value || "À faire"
    }))
  };

  return data;
}

function collectSimpleItems(id) {
  return Array.from(document.querySelectorAll(`#${id} .row-item`)).map(row => ({
    name: row.querySelector(".item-name")?.value || "",
    quantity: row.querySelector(".item-quantity")?.value ?? 1,
    description: row.querySelector(".item-description")?.value || ""
  }));
}

function saveCharacter(showAlert = true) {
  try {
    const data = collectCharacter();
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    // Maintient une compatibilité avec l'ancienne clé de sauvegarde.
    localStorage.setItem("dndCharacter", JSON.stringify(data));
    if (showAlert) alert("Personnage sauvegardé !");
  } catch (error) {
    console.error("Erreur sauvegarde :", error);
    alert("Impossible de sauvegarder ce personnage.");
  }
}

function restoreFieldValues(fields) {
  if (!fields) return;

  // Priorité aux identifiants stables.
  Object.entries(fields).forEach(([index, saved]) => {
    if (!saved) return;

    let element = saved.id ? $(saved.id) : null;

    // Anciennes sauvegardes indexées : tentative de restauration si aucun ID.
    if (!element && !saved.id) {
      element = document.querySelectorAll("input, select, textarea")[Number(index)];
    }

    if (!element) return;
    element.value = saved.value ?? "";
    if (element.type === "checkbox") element.checked = !!saved.checked;
  });
}

function loadCharacter() {
  const raw = localStorage.getItem(SAVE_KEY) || localStorage.getItem("dndCharacter");

  if (!raw) {
    alert("Aucune sauvegarde trouvée.");
    return;
  }

  try {
    const data = JSON.parse(raw);

    if (data.classDatabase) {
      classDatabase = { ...classDatabase, ...data.classDatabase };
    }

    // Reconstruit les éléments dynamiques avant de restaurer les champs.
    ["attacks", "abilities", "spells", "equipment", "inventory", "quests"]
      .forEach(id => { if ($(id)) $(id).innerHTML = ""; });

    (data.attacks || []).forEach(addAttack);
    (data.abilities || []).forEach(addAbility);
    (data.spells || []).forEach(addSpell);
    (data.equipment || []).forEach(addEquipment);
    (data.inventory || []).forEach(addItem);
    (data.quests || []).forEach(addQuest);

    refreshClasses();
    restoreFieldValues(data.fields);
    calculate();

    alert("Personnage chargé !");
  } catch (error) {
    console.error("Erreur chargement :", error);
    alert("La sauvegarde est illisible ou incompatible.");
  }
}

// ===================================
// EXPORT PDF MULTIPAGES SANS COMPRESSION
// ===================================

async function exportPDF() {
  let clone = null;

  try {
    if (typeof html2pdf === "undefined") {
      alert("Le moteur PDF n'est pas chargé. Vérifie ta connexion internet.");
      return;
    }

    const original = $("character-sheet");
    if (!original) {
      alert("Fiche de personnage introuvable.");
      return;
    }

    clone = original.cloneNode(true);

    const sourceFields = original.querySelectorAll("input, select, textarea");
    const copyFields = clone.querySelectorAll("input, select, textarea");

    sourceFields.forEach((field, index) => {
      const copy = copyFields[index];
      if (!copy) return;
      copy.value = field.value;
      copy.checked = field.checked;
    });

    clone.classList.add("pdf-exporting");
    clone.querySelectorAll("button").forEach(button => button.remove());

    // Cache les labels vides facultatifs sans cacher les cases à cocher.
    clone.querySelectorAll("label").forEach(label => {
      if (label.querySelector('input[type="checkbox"]')) return;
      const fields = label.querySelectorAll('input:not([type="checkbox"]), textarea');
      if (!fields.length) return;
      const filled = Array.from(fields).some(field => String(field.value || "").trim());
      if (!filled) label.style.display = "none";
    });

    const name = ($("name")?.value || "Personnage").trim() || "Personnage";

    await html2pdf().set({
      margin: [10, 10, 10, 10],
      filename: `${name}.pdf`,
      image: { type: "jpeg", quality: 0.96 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false
      },
      jsPDF: {
        unit: "mm",
        format: "a4",
        orientation: "portrait"
      },
      pagebreak: {
        mode: ["css", "legacy"],
        avoid: [".skill-line", ".stat-box", ".combat-stat"]
      }
    }).from(clone).save();

  } catch (error) {
    console.error("Erreur PDF :", error);
    alert("Une erreur est survenue pendant la création du PDF.");
  }
}

// ===================================
// INITIALISATION
// ===================================

function initialize() {
  buildSaveAndSkillLists();
  buildSpellSlots();
  refreshClasses();

  // Un seul gestionnaire général pour les champs statiques et dynamiques.
  document.addEventListener("input", event => {
    if (event.target.matches("input, select")) calculate();
  });
  document.addEventListener("change", event => {
    if (event.target.matches("input, select")) calculate();
  });

  calculate();
  console.log("D&D Character Manager chargé !");
}

// Exposition des fonctions appelées depuis le HTML.
window.addClass = addClass;
window.addAttack = addAttack;
window.addAbility = addAbility;
window.addSpell = addSpell;
window.addEquipment = addEquipment;
window.addItem = addItem;
window.addQuest = addQuest;
window.saveCharacter = saveCharacter;
window.loadCharacter = loadCharacter;
window.exportPDF = exportPDF;

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initialize);
} else {
  initialize();
}
