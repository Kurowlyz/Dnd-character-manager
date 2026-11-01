// ===================================
// D&D CHARACTER MANAGER
// D&D 5e - Version 2014
// ===================================

const $ = id => document.getElementById(id);

// ===================================
// GESTION DES CLASSES PERSONNALISÉES
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
  const current = select.value;

  select.innerHTML = "";

  Object.keys(classDatabase).forEach(name => {
    const option = document.createElement("option");
    option.value = name;
    option.textContent = name;
    select.appendChild(option);
  });

  if(classDatabase[current]) {
    select.value = current;
  }

  calculate();
}

function addClass() {
  const name = prompt("Nom de la nouvelle classe :");

  if(!name || !name.trim()) return;

  if(classDatabase[name.trim()]) {
    alert("Cette classe existe déjà !");
    return;
  }

  const die = prompt(
    "Dé de vie : 6, 8, 10 ou 12",
    "8"
  );

  if(![6,8,10,12].includes(Number(die))) {
    alert("Dé de vie invalide !");
    return;
  }

  classDatabase[name.trim()] = {
    hitDie: Number(die)
  };

  refreshClasses();
  $("class").value = name.trim();

  calculate();

  alert("Classe créée !");
}

const abilities = {
  str: "Force",
  dex: "Dextérité",
  con: "Constitution",
  int: "Intelligence",
  wis: "Sagesse",
  cha: "Charisme"
};

const skillData = [
  ["Acrobaties","dex"],["Arcanes","int"],
  ["Athlétisme","str"],["Discrétion","dex"],
  ["Dressage","wis"],["Escamotage","dex"],
  ["Histoire","int"],["Intimidation","cha"],
  ["Investigation","int"],["Médecine","wis"],
  ["Nature","int"],["Perception","wis"],
  ["Perspicacité","wis"],["Persuasion","cha"],
  ["Religion","int"],["Représentation","cha"],
  ["Survie","wis"],["Tromperie","cha"]
];

const classes = {
  "Guerrier":10, "Barbare":12, "Paladin":10,
  "Rôdeur":10, "Roublard":8, "Moine":8,
  "Barde":8, "Clerc":8, "Druide":8,
  "Ensorceleur":6, "Magicien":6, "Occultiste":8
};

function abilityMod(value) {
  return Math.floor((Number(value)-10)/2);
}

function modifierText(value) {
  return value >= 0 ? "+"+value : value;
}

function getStat(id) {
  return Number($(id).value) || 0;
}

function proficiency() {
  return 2 + Math.floor((getStat("level")-1)/4);
}

function calculate() {
  const mods = {};

  Object.keys(abilities).forEach(id => {
    mods[id] = abilityMod(getStat(id));
  });

  // Bonus de maîtrise
  const prof = proficiency();
  $("prof").value = "+"+prof;

  // Affichage des modificateurs
  $("modifiers").innerHTML =
    Object.entries(abilities).map(([id,name]) =>
      `${name}: <b>${modifierText(mods[id])}</b>`
    ).join(" | ");

  // Initiative
  $("initiative").value = modifierText(mods.dex);

  // Classe d'armure
  let ac = 10 + mods.dex;
  const armor = $("armor").value;

  if(armor === "light") ac = 11 + mods.dex;
  if(armor === "medium") ac = 14 + Math.min(2,mods.dex);
  if(armor === "heavy") ac = 16;
  if(armor === "custom") ac = getStat("customAC");

  ac += Number($("shield").value);
  $("ac").value = ac;

  // Points de vie
  const className = $("class").value;
const die = classDatabase[className]?.hitDie || 8;
  const level = Math.max(1,Math.min(20,getStat("level")));
  const con = mods.con;

  const maxHP = die + con +
    (level-1)*(Math.floor(die/2)+1+con);

  $("maxhp").value = Math.max(1,maxHP);

  // Sauvegardes
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
  $("spellAttack").value = modifierText(prof + mods[magic]);

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

Object.entries(abilities).forEach(([id,name]) => {
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

skillData.forEach(([name,stat]) => {
  skillsContainer.innerHTML += `
    <div class="skill-line" data-skill="${name}" data-stat="${stat}">
      <label>
        <input type="checkbox">
        ${name}
      </label>
      <strong>+0</strong>
    </div>`;
});

// ===================================
// AJOUTS PERSONNALISÉS
// ===================================

function addAttack(data = {}) {
  const div = document.createElement("div");
  div.className = "row-item";
  div.dataset.attack = "true";

  div.innerHTML = `
    <label>Nom de l'attaque
      <input class="attack-name" value="${data.name || ""}">
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
      <input type="checkbox" class="attack-prof"
        ${data.prof ? "checked" : ""}>
    </label>

    <p>Bonus d'attaque : <strong class="attack-bonus">+0</strong></p>

    <label>Dégâts (ex : 1d8+3)
      <input class="attack-damage" value="${data.damage || "1d8"}">
    </label>

    <label>Type de dégâts
      <input class="attack-type" value="${data.type || "Tranchant"}">
    </label>

    <label>Portée
      <input class="attack-range" value="${data.range || "Corps-à-corps"}">
    </label>

    <label>Description
      <textarea class="attack-description">${data.description || ""}</textarea>
    </label>

    <button onclick="this.parentElement.remove();calculate()">
      Supprimer
    </button>
  `;

  $("attacks").appendChild(div);

  div.querySelector(".attack-stat").value = data.stat || "str";
  div.querySelectorAll("input,select").forEach(el =>
    el.addEventListener("input",calculate)
  );

  calculate();
}

function addAbility(data = {}) {
  const div = document.createElement("div");
  div.className = "row-item";

  div.innerHTML = `
    <label>Nom
      <input value="${data.name || ""}">
    </label>
    <label>Type
      <select>
        <option>Passive</option>
        <option>Active</option>
        <option>Réaction</option>
      </select>
    </label>
    <label>Description
      <textarea>${data.description || ""}</textarea>
    </label>
    <label>Utilisations / recharge
      <input value="${data.uses || ""}">
    </label>
    <button onclick="this.parentElement.remove()">Supprimer</button>
  `;

  $("abilities").appendChild(div);
  div.querySelector("select").value = data.type || "Passive";
}

function addSpell(data = {}) {
  const div = document.createElement("div");
  div.className = "row-item";

  div.innerHTML = `
    <label>Nom du sort
      <input value="${data.name || ""}">
    </label>
    <label>Niveau du sort
      <input type="number" min="0" max="9"
        value="${data.level || 0}">
    </label>
    <label>Temps d'incantation
      <input value="${data.time || ""}">
    </label>
    <label>Portée
      <input value="${data.range || ""}">
    </label>
    <label>Description
      <textarea>${data.description || ""}</textarea>
    </label>
    <button onclick="this.parentElement.remove()">Supprimer</button>
  `;

  $("spells").appendChild(div);
}

function addEquipment(data = {}) {
  addSimpleItem("equipment",data);
}

function addItem(data = {}) {
  addSimpleItem("inventory",data);
}

function addSimpleItem(container,data = {}) {
  const div = document.createElement("div");
  div.className = "row-item";

  div.innerHTML = `
    <label>Nom
      <input value="${data.name || ""}">
    </label>
    <label>Quantité
      <input type="number" value="${data.quantity || 1}">
    </label>
    <label>Description
      <textarea>${data.description || ""}</textarea>
    </label>
    <button onclick="this.parentElement.remove()">Supprimer</button>
  `;

  $(container).appendChild(div);
}

function addQuest(data = {}) {
  const div = document.createElement("div");
  div.className = "row-item";

  div.innerHTML = `
    <label>Nom de la quête
      <input value="${data.name || ""}">
    </label>
    <label>Objectif
      <textarea>${data.objective || ""}</textarea>
    </label>
    <label>Statut
      <select>
        <option>À faire</option>
        <option>En cours</option>
        <option>Terminée</option>
      </select>
    </label>
    <button onclick="this.parentElement.remove()">Supprimer</button>
  `;

  $("quests").appendChild(div);
}

// ===================================
// EMPLACEMENTS DE SORTS
// ===================================

for(let i=1;i<=9;i++) {
  $("slots").innerHTML += `
    <label>Niv. ${i}
      <input type="number" min="0" value="0"
        data-slot="${i}">
    </label>`;
}

// ===================================
// SAUVEGARDE ET CHARGEMENT
// ===================================

function saveCharacter() {
  const values = {};

  document.querySelectorAll("input,select,textarea").forEach((el,i) => {
    values[i] = {
      value: el.value,
      checked: el.checked
    };
  });

  const containers = [
    "attacks","abilities","spells",
    "equipment","inventory","quests"
  ];

  const html = {};

  containers.forEach(id => {
    html[id] = $(id).innerHTML;
  });

  const save = {
    values,
    html
  };

  localStorage.setItem("dndCharacter",JSON.stringify(save));

  alert("Personnage sauvegardé !");
}

function loadCharacter() {
  const raw = localStorage.getItem("dndCharacter");

  if(!raw) {
    alert("Aucune sauvegarde trouvée.");
    return;
  }

  const save = JSON.parse(raw);

  Object.entries(save.html).forEach(([id,html]) => {
    $(id).innerHTML = html;
  });

  document.querySelectorAll("input,select,textarea").forEach((el,i) => {
    if(save.values[i]) {
      el.value = save.values[i].value;
      el.checked = save.values[i].checked;
    }
  });

  document.querySelectorAll("[data-attack]").forEach(el => {
    el.querySelectorAll("input,select").forEach(input =>
      input.addEventListener("input",calculate)
    );
  });

  calculate();
  alert("Personnage chargé !");
}

// ===================================
// ACTUALISATION AUTOMATIQUE
// ===================================

document.querySelectorAll("input,select").forEach(el => {
  el.addEventListener("input",calculate);
  el.addEventListener("change",calculate);
});
refreshClasses();
calculate();
// ===================================
// EXPORT PDF
// ===================================

async function exportPDF() {

  if(typeof html2pdf === "undefined") {
    alert("Impossible de charger le moteur PDF. Vérifie ta connexion internet.");
    return;
  }

  const element = document.querySelector("main");

  const options = {
    margin: 8,
    filename: ($("name").value || "Personnage") + ".pdf",

    image: {
      type: "jpeg",
      quality: 0.98
    },

    html2canvas: {
      scale: 1.5,
      useCORS: true,
      backgroundColor: "#ffffff"
    },

    jsPDF: {
      unit: "mm",
      format: "a4",
      orientation: "portrait"
    },
pagebreak: {
  mode: ["css", "legacy"]
}
}
    }
  };

  document.body.classList.add("pdf-exporting");

  try {
    await html2pdf()
      .set(options)
      .from(element)
      .save();

  } catch(error) {
    console.error(error);
    alert("Erreur lors de la création du PDF.");

  } finally {
    document.body.classList.remove("pdf-exporting");
  }
}
