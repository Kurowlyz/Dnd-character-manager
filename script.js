
// ===================================
// D&D CHARACTER MANAGER
// D&D 5e - Version 2014
// ===================================

const $ = id => document.getElementById(id);

// ===================================
// GESTION DES CLASSES
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

function refreshClasses() {
  const select = $("class");
  if (!select) return;

  const current = select.value;
  select.innerHTML = "";

  Object.keys(classDatabase).forEach(name => {
    const option = document.createElement("option");
    option.value = name;
    option.textContent = name;
    select.appendChild(option);
  });

  if (classDatabase[current]) {
    select.value = current;
  }

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

  const die = prompt("Dé de vie : 6, 8, 10 ou 12", "8");

  if (![6, 8, 10, 12].includes(Number(die))) {
    alert("Dé de vie invalide !");
    return;
  }

  classDatabase[className] = {
    hitDie: Number(die)
  };

  refreshClasses();
  $("class").value = className;
  calculate();

  alert("Classe créée !");
}

// ===================================
// CARACTÉRISTIQUES
// ===================================

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

function abilityMod(value) {
  return Math.floor((Number(value) - 10) / 2);
}

function modifierText(value) {
  return value >= 0 ? "+" + value : String(value);
}

function getStat(id) {
  const element = $(id);
  return element ? Number(element.value) || 0 : 0;
}

function proficiency() {
  const level = Math.max(1, getStat("level"));
  return 2 + Math.floor((level - 1) / 4);
}

// ===================================
// CALCULS AUTOMATIQUES
// ===================================

function calculate() {
  if (!$("str") || !$("class")) return;

  const mods = {};

  Object.keys(abilities).forEach(id => {
    mods[id] = abilityMod(getStat(id));
  });

  const prof = proficiency();

  // Bonus de maîtrise
  $("prof").value = "+" + prof;

  // Modificateurs
  $("modifiers").innerHTML =
    Object.entries(abilities).map(([id, name]) =>
      `${name}: <b>${modifierText(mods[id])}</b>`
    ).join(" | ");

  // Initiative
  $("initiative").value = modifierText(mods.dex);

  // Classe d'armure
  let ac = 10 + mods.dex;
  const armor = $("armor").value;

  if (armor === "light") {
    ac = 11 + mods.dex;
  }

  if (armor === "medium") {
    ac = 14 + Math.min(2, mods.dex);
  }

  if (armor === "heavy") {
    ac = 16;
  }

  if (armor === "custom") {
    ac = getStat("customAC");
  }

  ac += Number($("shield").value);
  $("ac").value = ac;

  // Points de vie
  const className = $("class").value;
  const die = classDatabase[className]?.hitDie || 8;
  const level = Math.max(1, Math.min(20, getStat("level")));
  const con = mods.con;

  const maxHP =
    die + con +
    (level - 1) * (Math.floor(die / 2) + 1 + con);

  $("maxhp").value = Math.max(1, maxHP);

  // Jets de sauvegarde
  document.querySelectorAll("[data-save]").forEach(el => {
    const stat = el.dataset.save;
    const trained = el.querySelector("input").checked;
    const result = mods[stat] + (trained ? prof : 0);

    el.querySelector("strong").textContent =
      modifierText(result);
  });

  // Compétences
  document.querySelectorAll("[data-skill]").forEach(el => {
    const stat = el.dataset.stat;
    const trained = el.querySelector("input").checked;
    const result = mods[stat] + (trained ? prof : 0);

    el.querySelector("strong").textContent =
      modifierText(result);
  });

  // Magie
  const magic = $("magicStat").value;

  $("spellDC").value = 8 + prof + mods[magic];

  $("spellAttack").value =
    modifierText(prof + mods[magic]);

  // Attaques
  document.querySelectorAll("[data-attack]").forEach(el => {
    const stat = el.querySelector(".attack-stat").value;
    const trained = el.querySelector(".attack-prof").checked;

    const bonus = mods[stat] + (trained ? prof : 0);

    el.querySelector(".attack-bonus").textContent =
      modifierText(bonus);
  });
}

// ===================================
// SAUVEGARDES ET COMPÉTENCES
// ===================================

const savesContainer = $("saves");

Object.entries(abilities).forEach(([id, name]) => {
  savesContainer.innerHTML += `
    <div class="skill-line" data-save="${id}">
      <label>
        <input type="checkbox">
        ${name}
      </label>
      <strong>+0</strong>
    </div>`;
});

const skillsContainer = $("skills");

skillData.forEach(([name, stat]) => {
  skillsContainer.innerHTML += `
    <div class="skill-line"
      data-skill="${name}"
      data-stat="${stat}">
      <label>
        <input type="checkbox">
        ${name}
      </label>
      <strong>+0</strong>
    </div>`;
});

// ===================================
// AJOUT D'ATTAQUES
// ===================================

function addAttack(data = {}) {
  const div = document.createElement("div");

  div.className = "row-item";
  div.dataset.attack = "true";

  div.innerHTML = `
    <label>Nom de l'attaque
      <input class="attack-name">
    </label>

    <label>Caractéristique utilisée
      <select class="attack-stat">
        <option value="str">Force</option>
        <option value="dex">Dextérité</option>
        <option value="int">Intelligence</option>
        <option value="wis">Sagesse</option>
        <option value="cha">Charisme</option>
      </select>
    </label>

    <label>Maîtrise de l'arme
      <input type="checkbox" class="attack-prof">
    </label>

    <p>Bonus d'attaque :
      <strong class="attack-bonus">+0</strong>
    </p>

    <label>Dégâts (ex : 1d8+3)
      <input class="attack-damage">
    </label>

    <label>Type de dégâts
      <input class="attack-type">
    </label>

    <label>Portée
      <input class="attack-range">
    </label>

    <label>Description
      <textarea class="attack-description"></textarea>
    </label>

    <button type="button"
      onclick="this.parentElement.remove();calculate()">
      Supprimer
    </button>
  `;

  $("attacks").appendChild(div);

  div.querySelector(".attack-name").value = data.name || "";
  div.querySelector(".attack-stat").value = data.stat || "str";
  div.querySelector(".attack-prof").checked = !!data.prof;
  div.querySelector(".attack-damage").value = data.damage || "1d8";
  div.querySelector(".attack-type").value = data.type || "Tranchant";
  div.querySelector(".attack-range").value = data.range || "Corps-à-corps";
  div.querySelector(".attack-description").value = data.description || "";

  div.querySelectorAll("input, select").forEach(el => {
    el.addEventListener("input", calculate);
    el.addEventListener("change", calculate);
  });

  calculate();
}

// ===================================
// AJOUT DE CAPACITÉS
// ===================================

function addAbility(data = {}) {
  const div = document.createElement("div");
  div.className = "row-item";

  div.innerHTML = `
    <label>Nom
      <input class="ability-name">
    </label>

    <label>Type
      <select class="ability-type">
        <option>Passive</option>
        <option>Active</option>
        <option>Réaction</option>
      </select>
    </label>

    <label>Description
      <textarea class="ability-description"></textarea>
    </label>

    <label>Utilisations / recharge
      <input class="ability-uses">
    </label>

    <button type="button"
      onclick="this.parentElement.remove()">
      Supprimer
    </button>
  `;

  $("abilities").appendChild(div);

  div.querySelector(".ability-name").value = data.name || "";
  div.querySelector(".ability-type").value = data.type || "Passive";
  div.querySelector(".ability-description").value = data.description || "";
  div.querySelector(".ability-uses").value = data.uses || "";
}

// ===================================
// AJOUT DE SORTS
// ===================================

function addSpell(data = {}) {
  const div = document.createElement("div");
  div.className = "row-item";

  div.innerHTML = `
    <label>Nom du sort
      <input class="spell-name">
    </label>

    <label>Niveau du sort
      <input class="spell-level" type="number" min="0" max="9">
    </label>

    <label>Temps d'incantation
      <input class="spell-time">
    </label>

    <label>Portée
      <input class="spell-range">
    </label>

    <label>Description
      <textarea class="spell-description"></textarea>
    </label>

    <button type="button"
      onclick="this.parentElement.remove()">
      Supprimer
    </button>
  `;

  $("spells").appendChild(div);

  div.querySelector(".spell-name").value = data.name || "";
  div.querySelector(".spell-level").value = data.level ?? 0;
  div.querySelector(".spell-time").value = data.time || "";
  div.querySelector(".spell-range").value = data.range || "";
  div.querySelector(".spell-description").value = data.description || "";
}

// ===================================
// ÉQUIPEMENT ET INVENTAIRE
// ===================================

function addEquipment(data = {}) {
  addSimpleItem("equipment", data);
}

function addItem(data = {}) {
  addSimpleItem("inventory", data);
}

function addSimpleItem(container, data = {}) {
  const div = document.createElement("div");
  div.className = "row-item";

  div.innerHTML = `
    <label>Nom
      <input class="item-name">
    </label>

    <label>Quantité
      <input class="item-quantity" type="number" min="0">
    </label>

    <label>Description
      <textarea class="item-description"></textarea>
    </label>

    <button type="button"
      onclick="this.parentElement.remove()">
      Supprimer
    </button>
  `;

  $(container).appendChild(div);

  div.querySelector(".item-name").value = data.name || "";
  div.querySelector(".item-quantity").value = data.quantity ?? 1;
  div.querySelector(".item-description").value = data.description || "";
}

// ===================================
// QUÊTES
// ===================================

function addQuest(data = {}) {
  const div = document.createElement("div");
  div.className = "row-item";

  div.innerHTML = `
    <label>Nom de la quête
      <input class="quest-name">
    </label>

    <label>Objectif
      <textarea class="quest-objective"></textarea>
    </label>

    <label>Statut
      <select class="quest-status">
        <option>À faire</option>
        <option>En cours</option>
        <option>Terminée</option>
      </select>
    </label>

    <button type="button"
      onclick="this.parentElement.remove()">
      Supprimer
    </button>
  `;

  $("quests").appendChild(div);

  div.querySelector(".quest-name").value = data.name || "";
  div.querySelector(".quest-objective").value = data.objective || "";
  div.querySelector(".quest-status").value = data.status || "À faire";
}

// ===================================
// EMPLACEMENTS DE SORTS
// ===================================

for (let i = 1; i <= 9; i++) {
  $("slots").innerHTML += `
    <label>Niv. ${i}
      <input type="number" min="0" value="0"
        data-slot="${i}">
    </label>`;
}

// ===================================
// SAUVEGARDE DU PERSONNAGE
// ===================================

function saveCharacter() {
  const values = {};

  document.querySelectorAll("input, select, textarea").forEach((el, i) => {
    values[i] = {
      value: el.value,
      checked: el.checked
    };
  });

  const containers = [
    "attacks",
    "abilities",
    "spells",
    "equipment",
    "inventory",
    "quests"
  ];

  const html = {};

  containers.forEach(id => {
    html[id] = $(id).innerHTML;
  });

  const save = {
    values,
    html
  };

  localStorage.setItem("dndCharacter", JSON.stringify(save));

  alert("Personnage sauvegardé !");
}

// ===================================
// CHARGEMENT DU PERSONNAGE
// ===================================

function loadCharacter() {
  const raw = localStorage.getItem("dndCharacter");

  if (!raw) {
    alert("Aucune sauvegarde trouvée.");
    return;
  }

  try {
    const save = JSON.parse(raw);

    Object.entries(save.html).forEach(([id, html]) => {
      $(id).innerHTML = html;
    });

    document.querySelectorAll("input, select, textarea").forEach((el, i) => {
      if (save.values[i]) {
        el.value = save.values[i].value;
        el.checked = save.values[i].checked;
      }
    });

    document.querySelectorAll("[data-attack]").forEach(el => {
      el.querySelectorAll("input, select").forEach(input => {
        input.addEventListener("input", calculate);
        input.addEventListener("change", calculate);
      });
    });

    calculate();
    alert("Personnage chargé !");

  } catch (error) {
    console.error(error);
    alert("Erreur lors du chargement de la sauvegarde.");
  }
}

// ===================================
// EXPORT PDF
// ===================================


async function exportPDF() {
  const button = document.activeElement;
  let clone = null;

  try {
    if (typeof html2pdf === "undefined") {
      alert("Le moteur PDF n'est pas chargé. Vérifie ta connexion internet.");
      return;
    }

    const element = document.querySelector("main");

    if (!element) {
      alert("Impossible de trouver le contenu à exporter.");
      return;
    }

    // Crée une copie pour le PDF
    clone = element.cloneNode(true);

    // Supprime les boutons de la copie
    clone.querySelectorAll("button").forEach(el => el.remove());

    // Supprime les lignes dynamiques sans nom
    const emptyRows = [
      [".row-item", ".attack-name"],
      [".row-item", ".ability-name"],
      [".row-item", ".spell-name"],
      [".row-item", ".item-name"],
      [".row-item", ".quest-name"]
    ];

    emptyRows.forEach(([rowSelector, nameSelector]) => {
      clone.querySelectorAll(rowSelector).forEach(row => {
        const name = row.querySelector(nameSelector);

        if (!name || !name.value.trim()) {
          row.remove();
        }
      });
    });

    // Masque les champs facultatifs vides
    clone.querySelectorAll("label").forEach(label => {
      const fields = label.querySelectorAll("input, textarea");

      if (!fields.length) return;

      // Ne masque pas les cases à cocher
      if (label.querySelector('input[type="checkbox"]')) return;

      const hasContent = Array.from(fields).some(field =>
        field.value.trim() !== ""
      );

      if (!hasContent) {
        label.style.display = "none";
      }
    });

    // Prépare l'export
    document.body.classList.add("pdf-exporting");

    const filename =
      (($("name").value || "Personnage").trim() || "Personnage") + ".pdf";

    const options = {
      margin: [8, 8, 8, 8],
      filename: filename,

      image: {
        type: "jpeg",
        quality: 0.98
      },

      html2canvas: {
        scale: 1.5,
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
        mode: ["css", "legacy"]
      }
    };

    await html2pdf()
      .set(options)
      .from(clone)
      .save();

  } catch (error) {
    console.error("Erreur PDF :", error);
    alert("Une erreur est survenue pendant la création du PDF.");

  } finally {
    document.body.classList.remove("pdf-exporting");

    if (button && button.focus) {
      button.focus();
    }
  }
}


// ===================================
// INITIALISATION
// ===================================

// Rend les fonctions accessibles aux boutons HTML
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

// Actualisation automatique des calculs
document.querySelectorAll("input, select").forEach(el => {
  el.addEventListener("input", calculate);
  el.addEventListener("change", calculate);
});

// Initialisation des classes
refreshClasses();
calculate();

console.log("D&D Character Manager chargé !");
