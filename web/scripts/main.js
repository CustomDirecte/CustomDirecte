/* ------------------- Infos ------------------- */
// --> A Bastoon Creation
/* --------------------------------------------- */

/* ----------------- Console Log ----------------- */
const logStyle = {
  title: "font-size: 20px; color:#C8194A; font-weight: bold;",
  optionTrue: "font-size: 12px; color:#a2ff99; font-weight: bold;",
  optionError: "font-size: 12px; color:#ffcc99; font-weight: bold;",
  optionFalse: "font-size: 12px; color:#ff9999; font-weight: bold;",
  debugTrue: "font-size: 12px; color:#921ebd; font-weight: bold;",
  debug: "font-size: 10px; color:#bd4ee6; font-weight: bold;",
  debugRed: "font-size: 10px; color:#e64e53; font-weight: bold;",
};
console.log("%cCustomDirecte", logStyle.title);
/* ----------------------------------------------- */

/* ------------ Check If Is Login Page ----------- */
// Teste si la page de connextion est afficher
function isLoginPage() {
  return /(?:http|https)(?::\/\/)(.+\.|)(?:ecoledirecte\.com\/login).*/.test(window.location.href) ? true : false;
}
/* ----------------------------------------------- */

/* ----------------- Console Log ----------------- */
const debug = new (class Debug {
  constructor() {
    this.active = false;
  }

  start() {
    this.active = true;
    console.log(`%cDebug [Enabled]`, logStyle.optionTrue);
    this.log("Extension Version " + chrome.runtime.getManifest().version);
    return true;
  }

  log(module, str) {
    if (this.active) {
      str ? (str = `[${module}] ${str}`) : (str = `${module}`);
      console.log(`%cDebug | ${str}`, logStyle.debug);
    }
  }

  startOptionLog(module, state) {
    state ? console.log(`%c${module} [Enabled]`, logStyle.optionTrue) : console.log(`%c${module} [Disabled]`, logStyle.optionFalse);
  }
})();
/* ----------------------------------------------- */

/* ----------- Get option changements ------------ */
const target = new EventTarget();

chrome.storage.sync.onChanged.addListener((changes) => {
  let [key, { oldValue, newValue }] = Object.entries(changes)[0];

  if (key !== "options") return;

  function convert(inputOptions) {
    inputOptions;
    let option = {};
    inputOptions.forEach((item) => {
      option[item.option] = item.Value === null ? item.Default : item.Value;
    });
    return option;
  }

  const differences = [];

  for (const key in convert(oldValue)) {
    if (Array.isArray(convert(oldValue)[key]) && Array.isArray(convert(newValue)[key])) {
      if (JSON.stringify(convert(oldValue)[key]) !== JSON.stringify(convert(newValue)[key])) differences.push([key, convert(newValue)[key]]);
    } else if (convert(oldValue)[key] !== convert(newValue)[key]) differences.push([key, convert(newValue)[key]]);
  }

  if (differences != []) {
    target.dispatchEvent(new CustomEvent("optionEvent", { detail: differences }));
  }
});
/* ----------------------------------------------- */

/* ------------------ Register ------------------- */
registedOptions = {};

function register(func) {
  registedOptions[func.name] = func;
}
/* ----------------------------------------------- */

/* --------------- optionsConfig ----------------- */
function optionsConfig(options, setOption, params, toparam) {
  if (options == false) {
    funcName = optionsConfig.caller.name;
    for (param of Object.entries(toparam(params))) {
      setOption(param);
    }
    target.addEventListener("optionEvent", (e) => {
      for (param of e.detail) {
        if (param[0] == funcName) {
          console.log(param);
          for (ele of Object.entries(toparam(param[1]))) {
            setOption(ele);
          }
        }
      }
    });
    return;
  }
  for (option of Object.entries(options)) {
    setOption(option);
  }
  target.addEventListener("optionEvent", (e) => {
    for (option of e.detail) {
      if (options[option[0]] != undefined) {
        options[option[0]] = option[1];
        setOption(option);
      }
    }
  });
}
/* ----------------------------------------------- */

/* --------- Options Initialitialisator ---------- */
function Start(statue) {
  // Active le mode de debugage si activé
  // if (statue.debug) debug.start();

  // Change le logo si l'une des options est activé
  if (Object.values(statue).some((obj) => obj.value === true)) document.querySelector("link[rel*='icon']").href = chrome.runtime.getURL(`/icons/EcoleDirecte/magenta.ico`);

  // Execusion des modules avec message dans la console
  for (ele in statue) {
    let func = registedOptions[ele];
    let value = statue[ele].value;
    if (!value) {
      debug.startOptionLog(func.name, false);
      continue;
    }
    try {
      func(statue[ele].secondary, value);
      debug.startOptionLog(func.name, true);
      debug.log(func.name + " >>> Successful execution");
    } catch (error) {
      console.error(error);
      debug.startOptionLog(`%c${func.name} [Error]`, true);
      debug.log(func.name + " >>> Error on execution");
    }
  }
}

chrome.storage.sync.get((inputOptions) => {
  inputOptions = inputOptions.options ? inputOptions.options : inputOptions;
  let option = {};
  let secondaryOption = [];
  inputOptions.forEach((item) => {
    if (item.lock === false) {
      option[item.option] = { value: item.Value === null ? item.Default : item.Value, secondary: {} };
    } else {
      secondaryOption.push({ option: item.option, value: item.Value === null ? item.Default : item.Value, secondary: item.lock });
    }
  });
  secondaryOption.forEach((item) => {
    option[item.secondary].secondary[item.option] = item.value;
  });

  Start(option);
});
/* ----------------------------------------------- */

/* -------------- Options Fonctions -------------- */

function noteTableAnalysis(options) {
  // Setup Module internal log
  let logName = arguments.callee.name;

  function log(str) {
    debug.log(logName, str);
  }

  optionsConfig(options, (option) => {
    document.documentElement.setAttribute(option[0], option[1]);
    if (option[0] == "AveragesInfluenceTooltips") {
      switch (option[1]) {
        case "textAndValue":
        case "value":
          window.postMessage("tippy-noteEvent-enable", "*");
          break;
        case "none":
          window.postMessage("tippy-noteEvent-disable", "*");
          break;
      }
    }
  });

  try {
    const tippy = document.createElement("script");
    tippy.src = chrome.runtime.getURL("/scripts/tippy.js");
    document.head.appendChild(tippy);
    tippyState = true;
  } catch {
    tippyState = false;
  }

  // Fonction Arrondie
  function hundredthRound(x) {
    return parseFloat(x.toFixed(2)).toString().replace(".", ",");
  }

  // Detecte les changement du body et execute quand nécésaire 'Calculator()'
  log("BodyObserver -> [ Starting ]");
  const averageTableObserver = new MutationObserver(() => {
    let TableParent = document.getElementById("encart-notes");
    // execute 'Calculator()' si le tableau actuellement affiché n'a pas déjà été modifié
    if (TableParent && TableParent.dataset.averageCalculator != "true") {
      log("New gradeTable not calculated -> [ Found ]");
      TableParent.dataset.averageCalculator = true;
      Calculator(TableParent);
    }
  });
  averageTableObserver.observe(document.body, {
    childList: true,
    subtree: true,
  });

  function Calculator(TableParent) {
    log("GradeTable editing -> [ Starting ]");

    // Verifie la pressence du tableau
    if (!TableParent.querySelector("table")) {
      log(" > Table -> [ 🛑 Non-existent ]");
      return;
    }
    gradeTable = TableParent.querySelector("table");
    log(" > Table -> [ Find ]");

    // Met a jour le design
    gradeTable.classList.add("newTable");
    log(" > Table design -> [ Updated ]");

    try {
      // Change le message avec la date du dernier calcule de la moyenne
      TableParent.querySelector("p").innerHTML = "<b>Moyennes calculées par l'extension : " + chrome.runtime.getManifest().name + "</b>";
      log(" > Message with last calculation date -> [ Updated ]");
    } catch {
      log(" > Message with last calculation date -> [ ⚠️ Non-existent or Untouchable ]");
    }

    if (options["generalAverageDisplay"]) {
      try {
        // Supprime l'ancienne ligne contenant la moyenne si il y en a une
        OldAverageLine = document.querySelector("table").querySelector("tr > td.moyennegenerale-valeur").parentNode;
        OldAverageLine.parentNode.removeChild(OldAverageLine);
        log(" > Old Average line -> [ Remove ]");
      } catch {
        log(" > Old Average line -> [ Non-existent or Untouchable ]");
      }

      try {
        // Supprime l'ancienne ligne contenant la moyenne si il y en a une
        oldAverageDiv = document.getElementById("averageDiv").parentNode;
        oldAverageDiv.parentNode.removeChild(oldAverageDiv);
        log(" > Old Average Display Div -> [ Remove ]");
      } catch {
        log(" > Old Average Display Div -> [ Non-existent or Untouchable ]");
      }

      // Ajoute une colone en pied du tableau
      gradeTableFooterRow = gradeTable.createTFoot().insertRow(0);
      gradeTableFooterRow.classList.add("ng-star-inserted");
      log(" > Table Footer -> [ Added ]");

      // Ajoute une div dans laquelle afficher la moyenne
      averageDiv = gradeTableFooterRow.insertCell(0);
      averageDiv.colSpan = gradeTable.tHead.rows[0].cells.length;
      averageDiv.classList.add("moyennegenerale-valeur", "averageDisplay");
      averageDiv.id = "averageDiv";
      averageDiv.innerText = "Erreur";
      log(" > Average Display Div -> [ Added ]");
    }

    // ### Analyse des notes et calcules des moyennes ###
    log(" > Grade analysis and Average calculation -> [ Starting ]");

    TotalGradesAndCoef = [];

    AllGradeAndAverage = [];

    // Recherche la configuration du tableau
    log(" > > Table configuration finding -> [ Starting ]");
    tableConfiguration = {
      discipline: [false, undefined],
      coef: [false, undefined],
      relevemoyenne: [false, undefined],
      notes: [false, undefined],
    };

    // Cherche l'index de chaque colones
    function tableGetIndex() {
      [...gradeTable.tHead.rows[0].cells].forEach((cell, index) => {
        if (cell.classList.contains("discipline")) {
          log(" > > > Column {discipline} -> [ Found ]");
          tableConfiguration["discipline"][0] = index;
          if (tableConfiguration["discipline"][1] == undefined) tableConfiguration["discipline"][1] = true;
        }
        if (cell.classList.contains("coef")) {
          log(" > > > Column {coef} -> [ Found ]");
          tableConfiguration["coef"][0] = index;
          if (tableConfiguration["coef"][1] == undefined) tableConfiguration["coef"][1] = true;
        }
        if (cell.classList.contains("relevemoyenne")) {
          log(" > > > Column {relevemoyenne} -> [ Found ]");
          tableConfiguration["relevemoyenne"][0] = index;
          if (tableConfiguration["relevemoyenne"][1] == undefined) tableConfiguration["relevemoyenne"][1] = true;
        }
        if (cell.classList.contains("notes")) {
          log(" > > > Column {notes} -> [ Found ]");
          tableConfiguration["notes"][0] = index;
          if (tableConfiguration["notes"][1] == undefined) tableConfiguration["notes"][1] = true;
        }
      });
    }
    tableGetIndex();

    if (tableConfiguration["coef"][1] == undefined && options["AveragesPerSubjectDisplay"]) {
      log(" > > > Column {coef} -> [ ⚠️ Non-existent ] -> [ Genere ] -> [ Reload module ]");
      coefTitleRow = gradeTable.tHead.rows[0].insertCell(tableConfiguration["discipline"][0] + 1);
      coefTitleRow.outerHTML = `<th class="coef ng-star-inserted">Coef.</th>`;
      if (options["generalAverageDisplay"]) averageDiv.colSpan += 1;
      tableConfiguration["coef"][1] = false;
      tableGetIndex();
    }

    if (tableConfiguration["relevemoyenne"][1] == undefined && options["AveragesPerSubjectDisplay"]) {
      log(" > > > Column {relevemoyenne} -> [ ⚠️ Non-existent ] -> [ Genere ] -> [ Reload module ]");
      relevemoyenneTitleRow = gradeTable.tHead.rows[0].insertCell(tableConfiguration["coef"][0] + 1);
      relevemoyenneTitleRow.outerHTML = `<th class="relevemoyenne ng-star-inserted">Moyennes</th>`;
      if (options["generalAverageDisplay"]) averageDiv.colSpan += 1;
      tableConfiguration["relevemoyenne"][1] = false;
      tableGetIndex();
    }

    // Vérifi la presence de chaque index
    log(" > > Table configuration Analysis -> [ Starting ]");
    for (item in tableConfiguration) {
      log(` > > > Column {${item}} -> [ ${tableConfiguration[item][1] === true ? "Here" : "⚠️ Not Here"} ]`);
      tableConfiguration[item][0] ? undefined : (tableConfiguration[item] = false);
    }

    // Verifie la pressence de la colonne des notes
    if (!tableConfiguration["notes"][0]) {
      if (options["generalAverageDisplay"]) averageDiv.innerText = "Colonne des notes introuvables";
      log(" > > Column Note -> [ 🛑 Non-existent ]");
      return;
    }

    // Fonction moyennePondere
    const moyennePondere = (liste) => liste.reduce((total, [combre, coeficient]) => total + combre * coeficient, 0) / liste.reduce((total, [_, coeficient]) => total + coeficient, 0);

    // Pour chaque ligne
    log(" > > Line by Line analysis -> [ Starting ]");
    for (line of gradeTable.tBodies[0].rows) {
      if (line.querySelector("td.moyennegenerale-valeur") != null) {
        continue;
      }

      if (tableConfiguration["coef"][1] == false && options["AveragesPerSubjectDisplay"]) {
        log(" > > > Line Element {coef} -> [ ⚠️ Non-existent ] -> [ Genere ]");
        coefTitleCell = line.insertCell(tableConfiguration["coef"][0]);
        coefTitleCell.innerHTML = `<span class="ng-star-inserted">1</span>`;
        coefTitleCell.classList.add("coef", "ng-star-inserted");
      }

      if (tableConfiguration["relevemoyenne"][1] == false && options["AveragesPerSubjectDisplay"]) {
        log(" > > > Line Element {relevemoyenne} -> [ ⚠️ Non-existent ] -> [ Genere ]");
        relevemoyenneTitleCell = line.insertCell(tableConfiguration["relevemoyenne"][0]);
        relevemoyenneTitleCell.classList.add("relevemoyenne", "ng-star-inserted");
      }

      // Si il y au moins une note ou si la matiere contient des sous-matiere
      lineProperties = {
        Length: line.cells[tableConfiguration["notes"][0]].childNodes.length > 1,
        IsMaster: line.classList.contains("master"),
        IsSecondary: line.classList.contains("secondary"),
        IsSecondaryButNotlast: line.classList.contains("secondarynotlast"),
      };

      if (!(lineProperties["Length"] || lineProperties["IsMaster"] || lineProperties["IsSecondary"])) {
        log(" > > > This line does not contain any notes and is neither Master ou Secondary -> [⚠️]");
        continue;
      }

      // Defini la zone d'afficharge de la moyenne de la ligne
      if (tableConfiguration["relevemoyenne"] && (averageColumn = tableConfiguration["relevemoyenne"][0])) {
        // Si il n'y a pas de span pour afficher la moyenne
        if (!(averageSpan = line.cells[averageColumn].querySelector("span"))) {
          log(` > > > Element for average display -> [ ⚠️ Non-existent ]`);
          averageSpan = document.createElement("span");
          averageSpan.classList.add("ng-star-inserted");
          line.cells[averageColumn].appendChild(averageSpan);
          log(` > > > Element for average display -> [ Added ]`);
        }
        if (debug.active) averageSpan.setAttribute("style", "border: solid darkblue;");
        averageSpan.innerText = "";
        log(` > > > Element for average display -> [ Defined ]`);
      } else {
        averageSpan = false;
        log(` > > > Element for average display -> [ ⚠️ Undefined ] <- because Column relevemoyenne Non-existent`);
      }

      // Defini la zone d'afficharge de la moyenne de la ligne
      if (tableConfiguration["relevemoyenne"] && (averageColumn = tableConfiguration["relevemoyenne"][0])) {
      }

      // Si il n'y a pas de span pour afficher la moyenne
      if (tableConfiguration["relevemoyenne"] && !(averageSpan = line.cells[averageColumn].querySelector("span"))) {
        log(` > > > Element for average display -> [ ⚠️ Non-existent ]`);
        averageSpan = document.createElement("span");
        averageSpan.classList.add("ng-star-inserted");
        line.cells[averageColumn].appendChild(averageSpan);
        log(` > > > Element for average display -> [ Added ]`);
      }

      if (tableConfiguration["relevemoyenne"]) {
        if (debug.active) averageSpan.setAttribute("style", "border: solid darkblue;");
        averageSpan.innerText = "";
        log(` > > > Element for average display -> [ Defined ]`);
      }

      // Trouve l'affichage du coef
      LineCoef = 1;
      if (tableConfiguration["coef"] && (coefColumn = tableConfiguration["coef"][0])) {
        if ((coefSpan = line.cells[coefColumn].querySelector("span"))) {
          if (debug.active) coefSpan.setAttribute("style", "border: solid orange;");
          LineCoef = parseFloat(coefSpan.innerText);
        }
      }

      // Dans le cas de ligne de type "Master"
      if (lineProperties["IsMaster"]) {
        log(` > > > New Master line Analysis -> [ Starting ]`);
        masterLineAverageSpan = averageSpan;
        masterLineCoef = LineCoef;
        masterLineGradesAndCoef = [];
        continue;
      }
      // Dans le cas des autres types

      log(` > > > New line Analysis -> [ Starting ]`);

      LineAllGradeAndAverage = {
        notes: [],
        average: false,
        averageSpan: averageSpan,
        coef: LineCoef,
        secondary: lineProperties["IsSecondary"],
        master: lineProperties["IsMaster"],
      };

      LineGradesAndCoef = [];

      // Pour chaque notes
      for (notes of line.cells[tableConfiguration["notes"][0]].querySelectorAll("button > span:nth-of-type(1).valeur")) {
        // Récuperation de la note
        try {
          note = parseFloat(notes.childNodes[0].nodeValue.replace(",", "."));
          if (isNaN(note)) throw new Exception();
        } catch {
          if (debug.active) notes.setAttribute("style", "border: dashed red;");
          log(` > > > > Note {${note}} format -> [ ⚠️ Invalid ]`);
          continue;
        }

        // Si un quotien est spécifié
        if (notes.querySelector(".quotien") != null) {
          try {
            quotient = parseFloat(notes.querySelector(".quotien").childNodes[0].nodeValue.replace("/", ""));
            if (isNaN(quotient)) throw new Exception();
          } catch {
            log(` > > > > Quotient {${quotient}} format -> [ ⚠️ Invalid ]`);
            continue;
          }
          note = note * (20 / quotient);
        }

        // Si un coef est spécifié
        coef = 1;
        if (notes.querySelector(".coef") != null) {
          try {
            coef = parseFloat(notes.querySelector(".coef ").childNodes[0].nodeValue.replace("(", "").replace(")", ""));
            if (isNaN(coef)) throw new Exception();
          } catch {
            log(` > > > > Coef {${coef}} format -> [ ⚠️ Invalid ]`);
            continue;
          }
        }

        if (debug.active) notes.setAttribute("style", "border: solid green;");

        log(` > > > > New Note {${note}} with coef {${coef}} -> [ Added ] `);

        // Ajout des notes et coefs pour la ligne
        LineGradesAndCoef.push([note, coef]);
        LineAllGradeAndAverage["notes"].push([note, coef, notes]);
      }

      if (!(LineGradesAndCoef.length > 0)) {
        log(` > > > > No note in this line -> [⚠️]`);
        if (!lineProperties["IsSecondaryButNotlast"]) {
          // Si c'est la derniere ligne secondaire, calcule la somme de la principale
          masterLineAverage = moyennePondere(masterLineGradesAndCoef);
          TotalGradesAndCoef.push([masterLineAverage, masterLineCoef]);
          if (masterLineAverageSpan) {
            masterLineAverageSpan.innerText = hundredthRound(masterLineAverage);
            AllGradeAndAverage.push({
              average: masterLineAverage,
              averageSpan: masterLineAverageSpan,
              coef: masterLineCoef,
              secondary: false,
              master: true,
            });
          }
          log(` > > > > Master line average {${LineAverage}} with coef {${LineCoef}}`);
        }
        continue;
      }

      // Calcule de la moyenne de la ligne
      LineAverage = moyennePondere(LineGradesAndCoef);
      LineAllGradeAndAverage["average"] = LineAverage;
      AllGradeAndAverage.push(LineAllGradeAndAverage);

      // Affiche la nouvelle moyenne de la ligne
      if (tableConfiguration["relevemoyenne"][0]) {
        if (debug.active && !lineProperties["IsSecondary"]) averageSpan.setAttribute("style", "border: solid blue;");
        if (debug.active && lineProperties["IsSecondary"]) averageSpan.setAttribute("style", "border: solid red;");
        if (averageSpan) averageSpan.innerText = hundredthRound(LineAverage);
      }

      if (lineProperties["IsSecondary"]) {
        // Ajout des notes et coefs pour la ligne Master
        masterLineGradesAndCoef.push([LineAverage, LineCoef]);
        log(` > > > > Secondary line average {${LineAverage}} with coef {${LineCoef}}`);

        if (!lineProperties["IsSecondaryButNotlast"]) {
          // Si c'est la derniere ligne secondaire, calcule la somme de la principale
          masterLineAverage = moyennePondere(masterLineGradesAndCoef);
          TotalGradesAndCoef.push([masterLineAverage, masterLineCoef]);
          if (masterLineAverageSpan) {
            masterLineAverageSpan.innerText = hundredthRound(masterLineAverage);
            AllGradeAndAverage.push({
              average: masterLineAverage,
              averageSpan: masterLineAverageSpan,
              coef: masterLineCoef,
              secondary: false,
              master: true,
            });
          }
          log(` > > > > Master line average {${LineAverage}} with coef {${LineCoef}}`);
        }
      }

      if (!lineProperties["IsSecondary"] && lineProperties["Length"]) {
        // Ajout des notes et coefs pour la moyenne générale
        TotalGradesAndCoef.push([LineAverage, LineCoef]);
        log(` > > > > Line average {${LineAverage}} with coef {${LineCoef}}`);
      }
    }

    // Calcule la moyenne
    FinalAverage = moyennePondere(TotalGradesAndCoef);

    if (isNaN(FinalAverage)) {
      log(`Moyenne générale non valide -> [🛑]`);
      if (options["generalAverageDisplay"]) if (averageDiv) averageDiv.innerText = "Notes Introuvables";
      return;
    }

    // Affiche la moyenne
    log(` > Final Average : ${FinalAverage}`);
    if (options["generalAverageDisplay"]) if (averageDiv) averageDiv.innerText = "MOYENNE GENERALE : " + hundredthRound(FinalAverage);

    // Si le module de tooltip fonctionne
    if (!tippyState) return;

    // Calcule la somme des coef des matières
    AllGradeAndAverage_SommeCoef = AllGradeAndAverage.reduce((total, item) => (item.secondary ? total : total + item.coef), 0);
    log(` > Total Coef {${AllGradeAndAverage_SommeCoef}} -> [ Defined ]`);

    // Pour chaque ligne du tableau
    log(` > List of All Grade And Average Analysis -> [ Starting ]`);
    for (line of AllGradeAndAverage) {
      log(` > > New Line Analysis -> [ Starting ]`);
      // Si elle n'est pas secondaire
      if (line.secondary) continue;
      // Calcule sont influence
      LineInfluence = (line.coef * (line.average - FinalAverage)) / (AllGradeAndAverage_SommeCoef - line.coef);
      log(` > > > Line Influence {${LineInfluence}} -> [ Defined ]`);
      // Si un span existe
      if (line.averageSpan) {
        // Parametrage de tippy
        tippytheme = "verybad";
        if (LineInfluence > -0.2) tippytheme = "bad";
        if (LineInfluence > -0.07) tippytheme = "neutral";
        if (LineInfluence > 0.07) tippytheme = "good";
        if (LineInfluence > 0.2) tippytheme = "verygood";
        line.averageSpan.parentNode.dataset.tippyTheme = tippytheme;
        line.averageSpan.parentNode.dataset.tippyContent = `<center><span class="tippyText" >Influence sur la moyenne générale : <br> </span><strong>${LineInfluence > 0 ? "+" : ""}${hundredthRound(LineInfluence)}</strong></center>`;
        line.averageSpan.parentNode.classList.add("notesAdvancedInformation");
        log(` > > > Line Average Span Tooltip -> [ Configured ]`);
        line.averageSpan.classList.add(`influence-${tippytheme}`);
        line.averageSpan.classList.add(`influence`);
        log(` > > > Line Average Span Color -> [ Added ]`);
      } else {
        log(` > > > Line Average Span -> [ ⚠️ Non-existent or Untouchable ]`);
      }
    }

    // Active tippy
    window.postMessage(options["AveragesInfluenceTooltips"] == "none" ? "tippy-noteEvent-disable" : "tippy-noteEvent-enable", "*");
  }
}
register(noteTableAnalysis);

function newSidebar(options) {
  // Setup Module internal log
  let logName = arguments.callee.name;

  function log(str) {
    debug.log(logName, str);
  }

  optionsConfig(options, (option) => {
    document.documentElement.setAttribute(option[0], option[1]);
  });

  // Ajoute la class "new-menu" au l'element HTML (pour la detection par le css)
  document.querySelector("html").classList.add("new-menu");
  log('css attribute "new-menu" -> [ Added ]');

  // Detecte les changement du body et execute quand nécésaire le code pour changer le menu
  log("BodyObserver -> [ Starting ]");
  const observer = new MutationObserver(() => {
    let loadingScreen = document.querySelector("ed-custom-busy");
    if (loadingScreen && loadingScreen.dataset.newLoadingScreenLoad != "true") {
      loadingScreen.dataset.newLoadingScreenLoad = true;
      loadingScreen.innerHTML = '<div class="lds-default"><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div></div>';
    }

    let menuElem = document.getElementById("container-menu");
    let usernameElem = document.getElementById("user-account-link");
    // execute le code si le menu actuellement affiché n'a pas déjà été modifié
    if (menuElem && usernameElem && menuElem.dataset.newmenuLoad != "true") {
      log("Menu editing -> [ Starting ]");

      // Indique que le menu à été modifié par l'extension
      menuElem.dataset.newmenuLoad = true;

      // Ajoute le nom de l'utilisateur dans un element de style et sous forme de variable css root
      rootName = document.createElement("style");
      rootName.innerHTML = `:root { --userName: "${usernameElem.innerText.trim().replace(/ /, "\\A")}" }`;
      document.head.appendChild(rootName);
      log(" > UserName in CSS Root -> [ Added ]");

      // Crée une div pour insérer dedans les nouveaux boutons du menu
      menuMoreOptions = document.createElement("div");
      menuElem.appendChild(menuMoreOptions);
      menuMoreOptions.classList.add("menuMoreOptions");
      log(" > Div for new button -> [ Added ]");

      // Fonction qui permet d'ajouté un nouveau bouton au menu
      function menuAddNewOptions(id, icon, text, onclick) {
        // Element principale
        moreOptionElement = document.createElement("a");
        menuMoreOptions.appendChild(moreOptionElement);
        moreOptionElement.id = `moreOption-${id}`;
        moreOptionElement.classList.add("moreOption");
        if (onclick) moreOptionElement.onclick = onclick;

        // Icon
        moreOptionElement_Icon = document.createElement("i");
        moreOptionElement.appendChild(moreOptionElement_Icon);
        moreOptionElement_Icon.classList.add("fa", icon);

        // Texte
        moreOptionElement_Span = document.createElement("span");
        moreOptionElement.appendChild(moreOptionElement_Span);
        moreOptionElement_Span.innerText = text;
      }

      // Ajout de nouveaux boutons
      log(" > Creation of news buttons -> [ Starting ]");
      menuAddNewOptions("Options", "fa-cog", "Personnalisation", () => document.querySelector("html").classList.add("optionsPopupActif"));
      log(" > Options button -> [ Added ]");
      menuAddNewOptions("Account", "fa-user", "Mon Compte", () => document.getElementById("user-account-link").click());
      log(" > Account button -> [ Added ]");
      menuAddNewOptions("Déconnexion", "fa-sign-out", "Déconnexion", () => document.querySelector(".logout").click());
      log(" > Deconnexion button -> [ Added ]");

      // Cache la bare qui contiens le nom et la bouton de déconnexion
      if (document.querySelector(".navbar-nav")) document.querySelector(".navbar-nav").style.display = "none";
      log(" > Name & Deco bar -> [ Hidden ]");
    }
  });
  observer.observe(document.body, {
    subtree: true,
    childList: true,
  });
}
register(newSidebar);

function customization(options) {
  document.documentElement.toggleAttribute("customization", true);

  optionsConfig(options, (option) => {
    document.documentElement.setAttribute(option[0], option[1]);
    if (option[0] == "darkmode") {
      switch (option[1]) {
        case true:
          window.postMessage("DarkReader-enable", "*");
          break;
        case false:
          window.postMessage("DarkReader-desable", "*");
          break;
      }
    }
  });

  const darkreader = document.createElement("script");
  darkreader.src = chrome.runtime.getURL("/scripts/darkreader.js");
  document.head.appendChild(darkreader);
}
register(customization);

function customizationButton(options, value) {
  optionsConfig(
    false, // config pour value et pas option
    (option) => {
      // exec / value
      document.documentElement.setAttribute(option[0], option[1]);
    },
    value, // value
    (value) => {
      // Transformeur de value
      return { customizationButton0: value[0], customizationButton1: value[1] };
    }
  );

  // Bouton de personnalisation
  optionsButtonDiv = document.createElement("div");
  optionsButtonDiv.classList.add("optionsButton");
  optionsButtonIcon = document.createElement("i");
  optionsButtonIcon.classList.add("fa", "fa-pencil");
  optionsButtonSpan = document.createElement("span");
  optionsButtonSpan.innerText = "Personnaliser EcoleDirecte";
  document.body.prepend(optionsButtonDiv);
  optionsButtonDiv.appendChild(optionsButtonIcon);
  optionsButtonDiv.appendChild(optionsButtonSpan);
  optionsButtonDiv.onclick = () => {
    if (document.querySelector("html").classList.contains("optionsPopupActif")) document.querySelector("html").classList.remove("optionsPopupActif");
    else document.querySelector("html").classList.add("optionsPopupActif");
  };

  optionsPopupBlur = document.createElement("div");
  optionsPopupBlur.classList.add("optionsPopupBlur");
  document.body.prepend(optionsPopupBlur);

  optionsPopup = document.createElement("iframe");
  optionsPopup.classList.add("optionsPopup");
  document.body.prepend(optionsPopup);
  optionsPopup.src = chrome.runtime.getURL("/pages/popup/interface.html");

  function closeOptionsPopup() {
    optionsPopup.contentWindow.postMessage("close", "*");
  }

  document.body.addEventListener("keyup", (e) => {
    if (e.key == "Escape") closeOptionsPopup();
  });

  optionsPopupBlur.onclick = async () => {
    closeOptionsPopup();
  };

  defaultcss = document.createElement("style");
  fetch(chrome.runtime.getURL("/styles/default.css"))
    .then((response) => response.text())
    .then((data) => {
      defaultcss.innerHTML = data;
    });
  document.head.appendChild(defaultcss);

  window.onmessage = function (e) {
    if (e.data == "closeOptionsPopup") {
      document.querySelector("html").classList.remove("optionsPopupActif");
    }
    if (e.data == "reloadOptionsPopup") {
      location.reload();
    }
  };
}
register(customizationButton);

/* ----------------------------------------------- */
