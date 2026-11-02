
"use strict";

// ===================================
// D&D CHARACTER MANAGER
// D&D 5e - Version 2014
// ===================================

const $ = id => document.getElementById(id);
const SAVE_KEY = "dndCharacter_v3";

// ===================================
// DONNÉES
// ===================================

const abilityNames = {
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

const classDatabase = {
  "Barbare": { hitDie: 12 },
  "Barde": { hitDie: 8 },
  "Clerc": { hitDie: 8 },
  "Druide": { hitDie: 8 },
  "Ensorceleur": { hitDie: 6 },
  "Guerrier": { hitDie: 10 },
  "Magicien": { hitDie: 6 },
  "Moine": { hitDie: 8 },
  "Occultiste": { hitDie: 8 },
  "Paladin": { hitDie: 10 },
  "Rôdeur": { hitDie: 10 },
  "Roublard": { hitDie: 8 }
};

// ===================================
// OUTILS
// ===================================

function number(value, fallback = 0) {
  const result = Number(value);
  return Number.isFinite(result) ? result : fallback;
}

function mod(score) {
  return Math.floor((number(score, 10) - 10) / 2);
}

function signed(value) {
  return value >= 0 ? `+${value}` : `${value}`;
}

function set(id, value) {
  const element = $(id);
  if (element) element.value = value;
}

function profBonus(level) {
  return Math.ceil(number(level, 1) / 4) + 1;
}

function getValue(id, fallback = 0) {
  const element = $(id);
  return element ? number(element.value, fallback) : fallback;
}

function getStat(stat) {
  return mod(getValue(stat, 10));
}

function makeElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

// ===================================
// CHAMPS DYNAMIQUES
// ===================================

function field(label, className, type = "text", placeholder = "") {
  const wrapper = makeElement("label", "dynamic-field");
  wrapper.append(makeElement("span", "", label));

  const input = makeElement("input", className);
  input.type = type;
  input.placeholder = placeholder;

  wrapper.append(input);
  return wrapper;
}

function textarea(label, className, placeholder = "") {
  const wrapper = makeElement("label", "dynamic-field");
  wrapper.append(makeElement("span", "", label));

  const input = makeElement("textarea", className);
  input.placeholder = placeholder;
  input.rows = 2;

  wrapper.append(input);
  return wrapper;
}

function selectField(label, className, options) {
  const wrapper = makeElement("label", "dynamic-field");
  wrapper.append(makeElement("span", "", label));

  const select = makeElement("select", className);

  options.forEach(option => {
    const opt = document.createElement("option");
    opt.value = option.value;
    opt.textContent = option.label;
    select.append(opt);
  });

  wrapper.append(select);
  return wrapper;
}

function checkboxField(label, className) {
  const wrapper = makeElement("label", "dynamic-checkbox");
  const input = makeElement("input", className);
  input.type = "checkbox";

  wrapper.append(input);
  wrapper.append(makeElement("span", "", label));

  return wrapper;
}

function deleteButton() {
  const button = makeElement("button", "delete-button", "✕");
  button.type = "button";
  button.title = "Supprimer";

  button.addEventListener("click", () => {
    const row = button.closest(".row-item");
    if (row) row.remove();
    calculate();
  });

  return button;
}

function createRow(containerId, className) {
  const container = $(containerId);
  if (!container) return null;

  const row = makeElement("div", `row-item ${className}`);
  container.append(row);

  return row;
}

// ===================================
// CLASSES
// ===================================

function refreshClasses() {
  const select = $("class");
  if (!select) return;

  const current = select.value;
  select.innerHTML = "";

  Object.keys(classDatabase).forEach(name => {
    const option = document.createElement("option");
    option.value = name;
    option.textContent = name;
    select.append(option);
  });

  const custom = document.querySelectorAll(".custom-class-name");

  custom.forEach(input => {
    const name = input.value.trim();

    if (name && !classDatabase[name]) {
      classDatabase[name] = { hitDie: 8 };
    }
  });

  Object.keys(classDatabase).forEach(name => {
    if (![...select.options].some(option => option.value === name)) {
      const option = document.createElement("option");
      option.value = name;
      option.textContent = name;
      select.append(option);
    }
  });

  if (current && classDatabase[current]) {
    select.value = current;
  }
}

function addClass() {
  const name = prompt("Nom de la classe ?");
  if (!name || !name.trim()) return;

  const cleanName = name.trim();

  if (classDatabase[cleanName]) {
    alert("Cette classe existe déjà.");
    return;
  }

  const hitDieInput = prompt(
    "Dé de vie ? (6, 8, 10 ou 12)",
    "8"
  );

  const hitDie = [6, 8, 10, 12].includes(Number(hitDieInput))
    ? Number(hitDieInput)
    : 8;

  classDatabase[cleanName] = { hitDie };
  refreshClasses();

  $("class").value = cleanName;
  calculate();
}

// ===================================
// JETS DE SAUVEGARDE ET COMPÉTENCES
// ===================================

function buildSaveAndSkillLists() {
  const saves = $("saves");
  const skills = $("skills");

  if (saves) {
    saves.innerHTML = "";

    Object.entries(abilityNames).forEach(([key, name]) => {
      const label = makeElement("label", "check-line");
      const checkbox = document.createElement("input");

      checkbox.type = "checkbox";
      checkbox.dataset.save = key;

      label.append(checkbox);
      label.append(makeElement("span", "", name));
      saves.append(label);
    });
  }

  if (skills) {
    skills.innerHTML = "";

    skillData.forEach(([name, stat]) => {
      const label = makeElement("label", "check-line");
      const checkbox = document.createElement("input");

      checkbox.type = "checkbox";
      checkbox.dataset.skill = name;

      label.append(checkbox);
      label.append(makeElement("span", "", name));
      label.append(makeElement("small", "skill-bonus", "+0"));

      skills.append(label);
    });
  }
}

// ===================================
// EMPLACEMENTS DE SORTS
// ===================================

function buildSpellSlots() {
  const container = $("slots");
  if (!container) return;

  container.innerHTML = "";

  for (let level = 1; level <= 9; level++) {
    const wrapper = makeElement("label", "slot-line");

    wrapper.append(
      makeElement("span", "", `Niv. ${level}`)
    );

    const input = makeElement("input", "slot-input");
    input.type = "number";
    input.min = "0";
    input.max = "9";
    input.value = "0";
    input.dataset.slot = level;

    wrapper.append(input);
    container.append(wrapper);
  }
}

// ===================================
// CALCUL DES CARACTÉRISTIQUES
// ===================================

function calculate() {
  const stats = ["str", "dex", "con", "int", "wis", "cha"];

  const modifiers = {};

  stats.forEach(stat => {
    modifiers[stat] = getStat(stat);
  });

  const modifierContainer = $("modifiers");

  if (modifierContainer) {
    modifierContainer.innerHTML = stats.map(stat => `
      <div class="modifier-item">
        <strong>${abilityNames[stat]}</strong>
        <span>${signed(modifiers[stat])}</span>
      </div>
    `).join("");
  }

  const level = Math.max(1, getValue("level", 1));
  const proficiency = profBonus(level);

  set("prof", signed(proficiency));

  // Initiative
  set("initiative", signed(modifiers.dex));

  // Classe d'armure
  const armor = $("armor")?.value || "none";
  const dex = modifiers.dex;
  const shield = $("shield")?.checked ? 2 : 0;
  let ac = 10 + dex;

  switch (armor) {
    case "light":
      ac = 11 + dex;
      break;

    case "medium":
      ac = 14 + Math.min(2, dex);
      break;

    case "heavy":
      ac = 16;
      break;

    case "none":
    default:
      ac = 10 + dex;
      break;
  }

  if ($("customAC")?.value.trim()) {
    ac = number($("customAC").value, ac);
  }

  ac += shield;
  set("ac", ac);

  // Points de vie maximum
  const className = $("class")?.value;
  const hitDie = classDatabase[className]?.hitDie || 8;
  const constitution = modifiers.con;

  const firstLevel = hitDie + constitution;
  const otherLevels = Math.max(0, level - 1) *
    (Math.floor(hitDie / 2) + 1 + constitution);

  const maxHP = Math.max(
    level,
    firstLevel + otherLevels
  );

  set("maxhp", maxHP);

  // Jets de sauvegarde
  document.querySelectorAll("[data-save]").forEach(checkbox => {
    const stat = checkbox.dataset.save;
    const bonus = modifiers[stat] +
      (checkbox.checked ? proficiency : 0);

    const output = checkbox.closest("label")?.querySelector("small");

    if (output) output.textContent = signed(bonus);
  });

  // Compétences
  document.querySelectorAll("[data-skill]").forEach(checkbox => {
    const skill = skillData.find(
      item => item[0] === checkbox.dataset.skill
    );

    if (!skill) return;

    const stat = skill[1];
    const bonus = modifiers[stat] +
      (checkbox.checked ? proficiency : 0);

    const output = checkbox.closest("label")?.querySelector("small");

    if (output) output.textContent = signed(bonus);
  });

  // Magie
  const magicStat = $("magicStat")?.value || "int";
  const magicModifier = modifiers[magicStat];

  set("spellDC", 8 + proficiency + magicModifier);
  set("spellAttack", signed(proficiency + magicModifier));

  // Bonus des attaques
  document.querySelectorAll("[data-attack]").forEach(row => {
    const stat = row.querySelector(".attack-stat")?.value || "str";
    const proficient = row.querySelector(".attack-prof")?.checked;

    const bonus = modifiers[stat] +
      (proficient ? proficiency : 0);

    const output = row.querySelector(".attack-bonus");

    if (output) output.value = signed(bonus);
  });
}

// ===================================
// ATTAQUES
// ===================================

function addAttack(data = {}) {
  const row = createRow("attacks", "attack-row");
  if (!row) return;

  row.dataset.attack = "true";

  row.append(
    field("Arme / attaque", "attack-name"),
    selectField("Caractéristique", "attack-stat", [
      { value: "str", label: "Force" },
      { value: "dex", label: "Dextérité" }
    ]),
    checkboxField("Maîtrise", "attack-prof"),
    field("Bonus", "attack-bonus"),
    field("Dégâts", "attack-damage"),
    field("Type", "attack-type"),
    field("Portée", "attack-range"),
    textarea("Description", "attack-description"),
    deleteButton()
  );

  row.querySelector(".attack-name").value = data.name || "";
  row.querySelector(".attack-stat").value = data.stat || "str";
  row.querySelector(".attack-prof").checked = !!data.proficient;
  row.querySelector(".attack-bonus").value = data.bonus || "";
  row.querySelector(".attack-damage").value = data.damage || "";
  row.querySelector(".attack-type").value = data.type || "";
  row.querySelector(".attack-range").value = data.range || "";
  row.querySelector(".attack-description").value = data.description || "";

  wireCalculation(row);
  calculate();
}

// ===================================
// CAPACITÉS DE COMBAT
// ===================================

function addAbility(data = {}) {
  const row = createRow("abilities", "ability-row");
  if (!row) return;

  row.append(
    field("Nom", "ability-name"),
    field("Type", "ability-type"),
    field("Utilisations", "ability-uses"),
    textarea("Description", "ability-description"),
    deleteButton()
  );

  row.querySelector(".ability-name").value = data.name || "";
  row.querySelector(".ability-type").value = data.type || "";
  row.querySelector(".ability-uses").value = data.uses || "";
  row.querySelector(".ability-description").value =
    data.description || "";

  wireCalculation(row);
}

// ===================================
// CAPACITÉS HORS COMBAT
// ===================================

function addExtraAbility(data = {}) {
  const row = createRow("extra-abilities", "extra-ability-row");
  if (!row) return;

  row.append(
    field("Nom", "extra-ability-name"),
    field("Type", "extra-ability-type"),
    field("Utilisations", "extra-ability-uses"),
    textarea("Description", "extra-ability-description"),
    deleteButton()
  );

  row.querySelector(".extra-ability-name").value = data.name || "";
  row.querySelector(".extra-ability-type").value = data.type || "";
  row.querySelector(".extra-ability-uses").value = data.uses || "";
  row.querySelector(".extra-ability-description").value =
    data.description || "";

  wireCalculation(row);
}

// ===================================
// SORTS DE COMBAT
// ===================================

function addCombatSpell(data = {}) {
  const row = createRow("combat-spells", "combat-spell-row");
  if (!row) return;

  row.append(
    field("Sort", "combat-spell-name"),
    field("Niveau", "combat-spell-level", "number"),
    field("Temps d'incantation", "combat-spell-time"),
    field("Portée", "combat-spell-range"),
    checkboxField("Concentration", "combat-spell-concentration"),
    textarea("Effet", "combat-spell-description"),
    deleteButton()
  );

  row.querySelector(".combat-spell-name").value = data.name || "";
  row.querySelector(".combat-spell-level").value = data.level ?? 0;
  row.querySelector(".combat-spell-time").value = data.time || "";
  row.querySelector(".combat-spell-range").value = data.range || "";
  row.querySelector(".combat-spell-concentration").checked =
    !!data.concentration;
  row.querySelector(".combat-spell-description").value =
    data.description || "";

  wireCalculation(row);
}

// ===================================
// SORTS
// ===================================

function addSpell(data = {}) {
  const row = createRow("spells", "spell-row");
  if (!row) return;

  row.append(
    field("Nom du sort", "spell-name"),
    field("Niveau", "spell-level", "number"),
    field("Temps d'incantation", "spell-time"),
    field("Portée", "spell-range"),
    textarea("Description / effets", "spell-description"),
    deleteButton()
  );

  row.querySelector(".spell-name").value = data.name || "";
  row.querySelector(".spell-level").value = data.level ?? 0;
  row.querySelector(".spell-time").value = data.time || "";
  row.querySelector(".spell-range").value = data.range || "";
  row.querySelector(".spell-description").value =
    data.description || "";

  wireCalculation(row);
}

// ===================================
// ÉQUIPEMENT ET INVENTAIRE
// ===================================

function addEquipment(data = {}) {
  addSimpleItem("equipment", "equipment-row", data);
}

function addItem(data = {}) {
  addSimpleItem("inventory", "inventory-row", data);
}

function addSimpleItem(containerId, className, data = {}) {
  const row = createRow(containerId, className);
  if (!row) return;

  row.append(
    field("Objet", "item-name"),
    field("Quantité", "item-quantity", "number"),
    field("Poids", "item-weight"),
    textarea("Description", "item-description"),
    deleteButton()
  );

  row.querySelector(".item-name").value = data.name || "";
  row.querySelector(".item-quantity").value = data.quantity ?? 1;
  row.querySelector(".item-weight").value = data.weight || "";
  row.querySelector(".item-description").value =
    data.description || "";

  wireCalculation(row);
}

// ===================================
// QUÊTES
// ===================================

function addQuest(data = {}) {
  const row = createRow("quests", "quest-row");
  if (!row) return;

  row.append(
    field("Nom de la quête", "quest-name"),
    selectField("Statut", "quest-status", [
      { value: "En cours", label: "En cours" },
      { value: "Terminée", label: "Terminée" },
      { value: "Échouée", label: "Échouée" }
    ]),
    textarea("Objectif / détails", "quest-objective"),
    deleteButton()
  );

  row.querySelector(".quest-name").value = data.name || "";
  row.querySelector(".quest-status").value =
    data.status || "En cours";
  row.querySelector(".quest-objective").value =
    data.objective || "";

  wireCalculation(row);
}

// ===================================
// AJOUT DES BOUTONS MANQUANTS
// ===================================

function addDynamicButton(containerId, label, callback, buttonId) {
  const container = $(containerId);
  if (!container || $(buttonId)) return;

  const button = makeElement("button", "add-button", label);
  button.type = "button";
  button.id = buttonId;
  button.addEventListener("click", callback);

  container.insertAdjacentElement("afterend", button);
}

// ===================================
// ÉVÉNEMENTS
// ===================================

function wireCalculation(element) {
  element.querySelectorAll("input, select, textarea").forEach(input => {
    input.addEventListener("input", calculate);
    input.addEventListener("change", calculate);
  });
}

// ===================================
// COLLECTE DES DONNÉES
// ===================================

function collectRows(containerId, selector, mapper) {
  const container = $(containerId);
  if (!container) return [];

  return [...container.querySelectorAll(selector)].map(mapper);
}

function collectCharacter() {
  const character = {
    fields: {},
    checkboxes: {},
    slots: {},
    classes: { ...classDatabase }
  };

  // Champs fixes
  document.querySelectorAll(
    "#character-sheet input[id], " +
    "#character-sheet select[id], " +
    "#character-sheet textarea[id]"
  ).forEach(element => {
    if (element.type === "checkbox") {
      character.checkboxes[element.id] = element.checked;
    } else {
      character.fields[element.id] = element.value;
    }
  });

  // Cases de maîtrise
  document.querySelectorAll("[data-save]").forEach(element => {
    character.checkboxes[`save:${element.dataset.save}`] =
      element.checked;
  });

  document.querySelectorAll("[data-skill]").forEach(element => {
    character.checkboxes[`skill:${element.dataset.skill}`] =
      element.checked;
  });

  // Emplacements de sorts
  document.querySelectorAll("[data-slot]").forEach(element => {
    character.slots[element.dataset.slot] = element.value;
  });

  // Attaques
  character.attacks = collectRows(
    "attacks",
    "[data-attack]",
    row => ({
      name: row.querySelector(".attack-name")?.value || "",
      stat: row.querySelector(".attack-stat")?.value || "str",
      proficient: !!row.querySelector(".attack-prof")?.checked,
      bonus: row.querySelector(".attack-bonus")?.value || "",
      damage: row.querySelector(".attack-damage")?.value || "",
      type: row.querySelector(".attack-type")?.value || "",
      range: row.querySelector(".attack-range")?.value || "",
      description:
        row.querySelector(".attack-description")?.value || ""
    })
  );

  // Capacités de combat
  character.abilities = collectRows(
    "abilities",
    ".ability-row",
    row => ({
      name: row.querySelector(".ability-name")?.value || "",
      type: row.querySelector(".ability-type")?.value || "",
      uses: row.querySelector(".ability-uses")?.value || "",
      description:
        row.querySelector(".ability-description")?.value || ""
    })
  );

  // Capacités hors combat
  character.extraAbilities = collectRows(
    "extra-abilities",
    ".extra-ability-row",
    row => ({
      name: row.querySelector(".extra-ability-name")?.value || "",
      type: row.querySelector(".extra-ability-type")?.value || "",
      uses: row.querySelector(".extra-ability-uses")?.value || "",
      description:
        row.querySelector(".extra-ability-description")?.value || ""
    })
  );

  // Sorts de combat
  character.combatSpells = collectRows(
    "combat-spells",
    ".combat-spell-row",
    row => ({
      name: row.querySelector(".combat-spell-name")?.value || "",
      level: row.querySelector(".combat-spell-level")?.value || 0,
      time: row.querySelector(".combat-spell-time")?.value || "",
      range: row.querySelector(".combat-spell-range")?.value || "",
      concentration:
        !!row.querySelector(".combat-spell-concentration")?.checked,
      description:
        row.querySelector(".combat-spell-description")?.value || ""
    })
  );

  // Sorts
  character.spells = collectRows(
    "spells",
    ".spell-row",
    row => ({
      name: row.querySelector(".spell-name")?.value || "",
      level: row.querySelector(".spell-level")?.value || 0,
      time: row.querySelector(".spell-time")?.value || "",
      range: row.querySelector(".spell-range")?.value || "",
      description:
        row.querySelector(".spell-description")?.value || ""
    })
  );

  // Équipement
  character.equipment = collectRows(
    "equipment",
    ".equipment-row",
    row => ({
      name: row.querySelector(".item-name")?.value || "",
      quantity: row.querySelector(".item-quantity")?.value || 1,
      weight: row.querySelector(".item-weight")?.value || "",
      description:
        row.querySelector(".item-description")?.value || ""
    })
  );

  // Inventaire
  character.inventory = collectRows(
    "inventory",
    ".inventory-row",
    row => ({
      name: row.querySelector(".item-name")?.value || "",
      quantity: row.querySelector(".item-quantity")?.value || 1,
      weight: row.querySelector(".item-weight")?.value || "",
      description:
        row.querySelector(".item-description")?.value || ""
    })
  );

  // Quêtes
  character.quests = collectRows(
    "quests",
    ".quest-row",
    row => ({
      name: row.querySelector(".quest-name")?.value || "",
      status: row.querySelector(".quest-status")?.value || "En cours",
      objective: row.querySelector(".quest-objective")?.value || ""
    })
  );

  return character;
}

// ===================================
// SAUVEGARDE
// ===================================

function saveCharacter() {
  try {
    const character = collectCharacter();

    localStorage.setItem(
      SAVE_KEY,
      JSON.stringify(character)
    );

    alert("Personnage sauvegardé !");
  } catch (error) {
    console.error(error);
    alert("Erreur lors de la sauvegarde.");
  }
}

// ===================================
// CHARGEMENT
// ===================================

function loadCharacter() {
  let raw;

  try {
    raw = localStorage.getItem(SAVE_KEY);

    if (!raw) {
      alert("Aucune sauvegarde trouvée.");
      return;
    }

    const character = JSON.parse(raw);

    // Classes personnalisées
    if (character.classes) {
      Object.assign(classDatabase, character.classes);
    }

    refreshClasses();

    // Champs fixes
    Object.entries(character.fields || {}).forEach(([id, value]) => {
      const element = $(id);
      if (element) element.value = value;
    });

    // Cases à cocher fixes
    Object.entries(character.checkboxes || {}).forEach(([id, value]) => {
      if (id.startsWith("save:")) {
        const element = document.querySelector(
          `[data-save="${id.slice(5)}"]`
        );
        if (element) element.checked = value;
        return;
      }

      if (id.startsWith("skill:")) {
        const element = document.querySelector(
          `[data-skill="${id.slice(6)}"]`
        );
        if (element) element.checked = value;
        return;
      }

      const element = $(id);
      if (element && element.type === "checkbox") {
        element.checked = value;
      }
    });

    // Emplacements de sorts
    Object.entries(character.slots || {}).forEach(([level, value]) => {
      const element = document.querySelector(
        `[data-slot="${level}"]`
      );
      if (element) element.value = value;
    });

    // Nettoyage des anciennes lignes
    [
      "attacks",
      "abilities",
      "extra-abilities",
      "combat-spells",
      "spells",
      "equipment",
      "inventory",
      "quests"
    ].forEach(id => {
      if ($(id)) $(id).innerHTML = "";
    });

    // Reconstruction des lignes
    (character.attacks || []).forEach(addAttack);
    (character.abilities || []).forEach(addAbility);
    (character.extraAbilities || []).forEach(addExtraAbility);
    (character.combatSpells || []).forEach(addCombatSpell);
    (character.spells || []).forEach(addSpell);
    (character.equipment || []).forEach(addEquipment);
    (character.inventory || []).forEach(addItem);
    (character.quests || []).forEach(addQuest);

    calculate();

    alert("Personnage chargé !");
  } catch (error) {
    console.error(error);
    alert("Impossible de charger cette sauvegarde.");
  }
}

// ===================================
// EXPORT PDF
// ===================================

async function exportPDF() {
  const original = $("character-sheet");

  if (!original) {
    alert("Fiche introuvable.");
    return;
  }

  if (typeof html2pdf === "undefined") {
    alert("La bibliothèque PDF n'est pas chargée.");
    return;
  }

  const clone = original.cloneNode(true);

  // Recopie des valeurs des champs
  const originalFields = original.querySelectorAll(
    "input, textarea, select"
  );

  const clonedFields = clone.querySelectorAll(
    "input, textarea, select"
  );

  originalFields.forEach((field, index) => {
    const copy = clonedFields[index];
    if (!copy) return;

    if (field.type === "checkbox") {
      copy.checked = field.checked;
    } else {
      copy.value = field.value;
    }
  });

  // Remplacement des zones de texte par du texte imprimable
  const originalTextareas = original.querySelectorAll("textarea");
  const clonedTextareas = clone.querySelectorAll("textarea");

  originalTextareas.forEach((field, index) => {
    const copy = clonedTextareas[index];
    if (!copy) return;

    const content = makeElement(
      "div",
      "pdf-textarea-content"
    );

    content.textContent = field.value || " ";
    content.style.whiteSpace = "pre-wrap";
    content.style.overflowWrap = "anywhere";
    content.style.wordBreak = "break-word";
    content.style.minHeight =
      Math.max(field.scrollHeight, field.clientHeight) + "px";

    copy.replaceWith(content);
  });

  // Retrait des boutons d'interface
  clone.querySelectorAll(
    "button, .delete-button, .add-button, .no-print"
  ).forEach(element => element.remove());

  // Nom du fichier
  const characterName =
    $("name")?.value.trim() || "personnage";

  const safeName = characterName
    .replace(/[^a-z0-9-_]/gi, "_");

  clone.classList.add("pdf-exporting");

  const holder = makeElement("div", "pdf-export-holder");
  holder.style.position = "absolute";
  holder.style.left = "-100000px";
  holder.style.top = "0";
  holder.style.width = original.offsetWidth + "px";
  holder.style.background = "#ffffff";

  holder.append(clone);
  document.body.append(holder);

  try {
    await html2pdf()
      .set({
        margin: 0,
        filename: `${safeName}.pdf`,
        image: {
          type: "jpeg",
          quality: 0.98
        },
        html2canvas: {
          scale: 2,
          useCORS: true,
          backgroundColor: "#ffffff",
          windowWidth: original.scrollWidth
        },
        jsPDF: {
          unit: "mm",
          format: "a4",
          orientation: "portrait"
        },
        pagebreak: {
          mode: ["css", "legacy"],
          avoid: [
            ".attack-row",
            ".ability-row",
            ".skill-line",
            ".stat-box"
          ]
        }
      })
      .from(clone)
      .save();
  } catch (error) {
    console.error(error);
    alert("Erreur lors de la création du PDF.");
  } finally {
    holder.remove();
  }
}

// ===================================
// INITIALISATION
// ===================================

function initialize() {
function initialize() {
  // Construction des emplacements de sorts
  buildSpellSlots();

  // Chargement des classes
  refreshClasses();

  // Bouton pour ajouter les sorts de combat
  addDynamicButton(
    "combat-spells",
    "+ Ajouter un sort de combat",
    () => addCombatSpell(),
    "add-combat-spell"
  );

  // Bouton pour ajouter les capacités hors combat
  addDynamicButton(
    "extra-abilities",
    "+ Ajouter une capacité hors combat",
    () => addExtraAbility(),
    "add-extra-ability"
  );

  // Calcul automatique
  document.querySelectorAll(
    "#character-sheet input, " +
    "#character-sheet select, " +
    "#character-sheet textarea"
  ).forEach(element => {
    element.addEventListener("input", calculate);
    element.addEventListener("change", calculate);
  });

  calculate();
}

  // Calcul automatique
  document.querySelectorAll(
    "#character-sheet input, " +
    "#character-sheet select, " +
    "#character-sheet textarea"
  ).forEach(element => {
    element.addEventListener("input", calculate);
    element.addEventListener("change", calculate);
  });

  calculate();
}

// ===================================
// EXPOSITION DES FONCTIONS HTML
// ===================================

window.saveCharacter = saveCharacter;
window.loadCharacter = loadCharacter;
window.exportPDF = exportPDF;
window.addClass = addClass;
window.addAttack = addAttack;
window.addAbility = addAbility;
window.addSpell = addSpell;
window.addEquipment = addEquipment;
window.addItem = addItem;
window.addQuest = addQuest;
window.addCombatSpell = addCombatSpell;
window.addExtraAbility = addExtraAbility;

// ===================================
// DÉMARRAGE
// ===================================

document.addEventListener("DOMContentLoaded", initialize);
