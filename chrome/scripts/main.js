/* IMPORT CHROME LIB */
browser = chrome;
browserStorage = browser.storage.sync;
browserVersion = browser.runtime.getManifest().version_name;
browserStorageOnChanged = browser.storage.sync.onChanged;
/* ----------------- */

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

/* --------------- optionsConfig ----------------- */
function optionsConfig(options, setOption, params, toparam) {
  if (options == false) {
    funcName = optionsConfig.caller.name;
    for (param of Object.entries(toparam(params))) {
      setOption(param);
    }
    document.documentElement.addEventListener("optionEvent", (e) => {
      for (param of e.detail) {
        if (param[0] == funcName) {
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
  document.documentElement.addEventListener("optionEvent", (e) => {
    for (option of e.detail) {
      if (options[option[0]] != undefined) {
        options[option[0]] = option[1];
        setOption(option);
      }
    }
  });
}
/* ----------------------------------------------- */

/* ----------------- Update Value ---------------- */
function updateValue(Option, value) {
  browserStorage.get((data) => {
    let option = data.options.find((el) => el.option == Option);
    option.Value = value;
    browserStorage.set(data);
  });
}
/* ----------------------------------------------- */

/* ---------------- TXT Downloader ---------------- */
function txtDownloader(content, fileName) {
  var a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([content], { type: "text/plain" }));
  a.download = `${fileName}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
/* ----------------------------------------------- */

/* ----------------- Console Log ----------------- */
const debug = new (class Debug {
  constructor() {
    this.active = false;
    this.logs = [];
  }

  startLog(close = false) {
    this.active = !close;
    console.log(close ? `%c> Debug [Disabled]` : `%c> Debug [Enabled]`, close ? logStyle.optionFalse : logStyle.optionTrue);
  }

  log(module, str) {
    str ? (str = `[${module}] ${str}`) : (str = `${module}`);
    if (this.active) {
      console.log(`%cDebug | ${str}`, logStyle.debug);
    }
    if (str != undefined) this.logs.push(str);
  }

  dev(options) {
    this.startLog(!option[1]);
    optionsConfig(options, (option) => {
      if (option[0] == "downloadlog" && option[1]) {
        updateValue("downloadlog", false);
        txtDownloader(`Version ${browserVersion} ; Timestamp ${Date.now()}\n` + this.logs.join("\n"), "logs");
      }
    });
  }

  startOptionLog(module, state) {
    state ? console.log(`%c${module} [Enabled]`, logStyle.optionTrue) : console.log(`%c${module} [Disabled]`, logStyle.optionFalse);
  }
})();
/* ----------------------------------------------- */

/* ----------- Get option changements ------------ */
browserStorageOnChanged.addListener((changes) => {
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
    document.documentElement.dispatchEvent(new CustomEvent("optionEvent", { detail: differences }));
  }
});
/* ----------------------------------------------- */

/* ------------------ Register ------------------- */
registedOptions = {};

function register(func) {
  registedOptions[func.name] = func;
}
/* ----------------------------------------------- */

/* --------- Options Initialitialisator ---------- */
function Start(statue) {
  // Change le logo si l'une des options est activé
  if (Object.values(statue).some((obj) => obj.value === true) && document.querySelector("link[rel*='icon']")) document.querySelector("link[rel*='icon']").href = browser.runtime.getURL(`/icons/EcoleDirecte/magenta.ico`);

  // Execusion des modules avec message dans la console
  for (ele in statue) {
    let func = registedOptions[ele];
    let value = statue[ele].value;

    // Active le mode de debugage si activé
    if (ele == "dev" && value) debug.dev(statue[ele].secondary);

    // Option lié a aucune fonction
    if (!func) continue;

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
      debug.startOptionLog(`${func.name} [Error]`, true);
      debug.log(func.name + " >>> Error on execution");
    }
  }
}

function Run() {
  browserStorage.get((inputOptions) => {
    if (!inputOptions.options) console.log(inputOptions);
    if (!inputOptions.options) return;
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

    const readystateHandler = () => {
      if (["complete", "interactive"].includes(document.readyState)) {
        Start(option);
        document.removeEventListener("readystatechange", readystateHandler);
      }
    };

    document.addEventListener("readystatechange", readystateHandler);
    readystateHandler();
  });
}
Run();
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
    tippy.src = browser.runtime.getURL("/scripts/tippy.js");
    document.head.appendChild(tippy);
    tippyState = true;
    log("Tippy -> [ Added ]");
  } catch {
    tippyState = false;
    log("Tippy -> [ ⚠️ Can't be added ]");
  }

  // Fonction Arrondie
  function hundredthRound(x) {
    return parseFloat(x.toFixed(2)).toString().replace(".", ",");
  }

  // Detecte les changement du body et execute quand nécésaire 'Calculator()'
  log("BodyObserver -> [ Starting ]");
  const averageTableObserver = new MutationObserver(() => {
    let TableParent = document.getElementById("encart-notes");
    let periodeElement = document.getElementById("unePeriode");

    // Si le tableau des moyennes n'existe pas, le crée
    if (typeof averageTable == "undefined") averageTable = false;
    if (!averageTable) averageTable = false;

    // Cherche si le tableau des moyennes a été cherché
    try {
      averageTableSearch = periodeElement.dataset.averageTableSearch;
      if (!averageTableSearch) averageTableSearch = false;
    } catch (error) {
      averageTableSearch = true;
    }

    // Si le tableau des moyennes n'a pas encore été cherché
    if (TableParent && periodeElement && !averageTableSearch) {
      periodeElement.dataset.averageTableSearch = averageTableSearch = true;
      // Cherche le tableau des moyennes
      try {
        log(" > averageTable conditions analysis  -> [ Starting ]");
        activeTab = periodeElement.querySelector("li.active > a");
        tabs = periodeElement.querySelectorAll("[role=tab]");
        averageTableFound = periodeElement.dataset.averageTableFound;

        // Si les conditions de recherche sont valides
        if (tabs && !averageTableFound && activeTab) {
          log(" > > averageTable search conditions -> [ Valid ]");
          // Pour chaque onglet
          try {
            for (let i = 0; i < tabs.length; i++) {
              // Si l'onglet est l'onglet actif, le saute
              const element = tabs[i];
              if (element === activeTab) continue;

              element.click();

              if (!document.getElementById("encart-moyennes")) continue;

              // Si le tableau des moyennes est trouvé
              if (document.getElementById("encart-moyennes").querySelector("table")) {
                log(" > > averageTable -> [ Found ]");
                averageTable = document.getElementById("encart-moyennes").querySelector("table").cloneNode(true);
                periodeElement.dataset.averageTableFound = true;
                break;
              }
            }
          } catch (error) {
            log(" > > averageTable -> [ ⚠️ Error ]");
          }
          if (!averageTable) log(" > > averageTable -> [ ⚠️ Non-existent ]");

          activeTab.click();
          return;
        }
      } catch (error) {
        log(" > > averageTable -> [ ⚠️ Impossible to find ]");
      }
    }

    // execute 'Calculator()' si le tableau actuellement affiché n'a pas déjà été modifié
    if (TableParent && TableParent.dataset.averageCalculator != "true") {
      log("New gradeTable not calculated -> [ Found ]");

      TableParent.dataset.averageCalculator = true;
      Calculator(TableParent, averageTableAnalysis(averageTable));
    }
  });
  averageTableObserver.observe(document.body, {
    childList: true,
    subtree: true,
  });

  function averageTableAnalysis(averageTable) {
    if (!averageTable) return false;
    log("AverageTable analysis -> [ Starting ]");

    averageTableLines = {};

    try {
      for (line of averageTable.tBodies[0].rows) {
        if (!line.querySelector(".libellediscipline").innerText) continue;
        if (line.querySelector(".libellediscipline").innerText == "") continue;

        newFormat = (ele) => {
          try {
            newEle = parseFloat(ele.innerText.replace(",", "."));
            if (isNaN(newEle) || typeof newEle !== "number") {
              throw new Exception();
            }
            return newEle;
          } catch {
            try {
              if (debug.active) ele.setAttribute("style", "border: dashed red;");
            } catch {}
            return false;
          }
        };

        average = line.querySelector(".moyenneeleve") ? newFormat(line.querySelector(".moyenneeleve")) : false;
        classAverage = line.querySelector(".moyenneclasse") ? newFormat(line.querySelector(".moyenneclasse")) : false;

        if (!average) continue;

        averageTableLines[line.querySelector(".libellediscipline").innerText] = { average: average, classAverage: classAverage };
      }
    } catch (error) {
      log(" > AverageTable analysis -> [ ⚠️ Error ]");
      return false;
    }

    log(" > AverageTable analysis -> [ Finish ]");
    if (averageTableLines == {}) return false;
    return averageTableLines;
  }

  function Calculator(TableParent, averageTableInfos) {
    log("GradeTable editing -> [ Starting ]");

    if (averageTableInfos) {
      const classAverages = Object.values(averageTableInfos).map((info) => info.classAverage);
      if (classAverages.every((average) => !average)) {
        options["ClassAveragesDisplay2"] = false;
      }
    }

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
      TableParent.querySelector("p").innerHTML = "<b>Moyennes calculées par l'extension : " + browser.runtime.getManifest().name + "</b>";
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

    LinesGradesAndCoef = [];

    Lines = [];

    // Recherche la configuration du tableau
    log(" > > Table configuration finding -> [ Starting ]");
    tableConfiguration = {
      discipline: [false, undefined],
      coef: [false, undefined],
      moyenneclasse: [false, undefined],
      relevemoyenne: [false, undefined],
      notes: [false, undefined],
    };

    // Cherche l'index de chaque colones
    tableGetIndex = () => {
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
        if (cell.classList.contains("moyenneclasse")) {
          log(" > > > Column {moyenneclasse} -> [ Found ]");
          tableConfiguration["moyenneclasse"][0] = index;
          if (tableConfiguration["moyenneclasse"][1] == undefined) tableConfiguration["moyenneclasse"][1] = true;
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
    };
    tableGetIndex();

    if (tableConfiguration["coef"][1] == undefined && options["AveragesPerSubjectDisplay"]) {
      log(" > > > Column {coef} -> [ ⚠️ Non-existent ] -> [ Genere ] -> [ Reload module ]");
      coefTitleRow = gradeTable.tHead.rows[0].insertCell(tableConfiguration["discipline"][0] + 1);
      coefTitleRow.outerHTML = `<th class="coef ng-star-inserted">Coef.</th>`;
      if (options["generalAverageDisplay"]) averageDiv.colSpan += 1;
      tableConfiguration["coef"][1] = false;
      tableGetIndex();
    }

    if (options["ClassAveragesDisplay2"] && averageTableInfos) {
      log(" > > > Column {moyenneclasse} -> [ Genere ] -> [ Reload module ]");
      moyenneclasseTitleRow = gradeTable.tHead.rows[0].insertCell(tableConfiguration["coef"][0] + 1);
      moyenneclasseTitleRow.outerHTML = `<th class="moyenneclasse ng-star-inserted">Classe</th>`;
      if (options["generalAverageDisplay"]) averageDiv.colSpan += 1;
      tableConfiguration["moyenneclasse"][1] = false;
      tableGetIndex();
    }

    if (tableConfiguration["relevemoyenne"][1] == undefined && options["AveragesPerSubjectDisplay"]) {
      log(" > > > Column {relevemoyenne} -> [ ⚠️ Non-existent ] -> [ Genere ] -> [ Reload module ]");
      if (options["ClassAveragesDisplay2"] && averageTableInfos) relevemoyenneTitleRow = gradeTable.tHead.rows[0].insertCell(tableConfiguration["moyenneclasse"][0] + 1);
      else relevemoyenneTitleRow = gradeTable.tHead.rows[0].insertCell(tableConfiguration["coef"][0] + 1);
      relevemoyenneTitleRow.outerHTML = `<th class="relevemoyenne ng-star-inserted">Moyennes</th>`;
      if (options["generalAverageDisplay"]) averageDiv.colSpan += 1;
      tableConfiguration["relevemoyenne"][1] = false;
      tableGetIndex();
    }

    // Vérifi la presence de chaque index
    log(" > > Table configuration Analysis -> [ Starting ]");
    for (item in tableConfiguration) {
      log(` > > > Column {${item}} -> [ ${tableConfiguration[item][1] === true ? "Here" : "⚠️ Not Here"} ]`);
      tableConfiguration[item][0] !== false ? undefined : (tableConfiguration[item] = false);
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

      lineTitle = line.cells[tableConfiguration["discipline"][0]].querySelector(".nommatiere") ? line.cells[tableConfiguration["discipline"][0]].querySelector(".nommatiere").innerText : false;

      if (tableConfiguration["coef"][1] == false && options["AveragesPerSubjectDisplay"]) {
        log(" > > > Line Element {coef} -> [ ⚠️ Non-existent ] -> [ Genere ]");
        coefTitleCell = line.insertCell(tableConfiguration["coef"][0]);
        coefTitleCell.innerHTML = `<span class="ng-star-inserted">1</span>`;
        coefTitleCell.classList.add("coef", "ng-star-inserted");
      }

      if (tableConfiguration["moyenneclasse"][1] == false && options["ClassAveragesDisplay2"] && averageTableInfos) {
        log(" > > > Line Element {moyenneclasse} -> [ Genere ]");
        moyenneclasseTitleCell = line.insertCell(tableConfiguration["moyenneclasse"][0]);
        moyenneclasseTitleCell.classList.add("moyenneclasse", "ng-star-inserted");
        moyenneclasseSpan = document.createElement("span");
        moyenneclasseSpan.classList.add("ng-star-inserted");
        moyenneclasseTitleCell.appendChild(moyenneclasseSpan);
        if (averageTableInfos && averageTableInfos[lineTitle]) {
          if (averageTableInfos[lineTitle].classAverage) moyenneclasseSpan.innerHTML = hundredthRound(averageTableInfos[lineTitle].classAverage);
        }
      }

      if (tableConfiguration["relevemoyenne"][1] == false && options["AveragesPerSubjectDisplay"]) {
        log(" > > > Line Element {relevemoyenne} -> [ ⚠️ Non-existent ] -> [ Genere ]");
        relevemoyenneTitleCell = line.insertCell(tableConfiguration["relevemoyenne"][0]);
        relevemoyenneTitleCell.classList.add("relevemoyenne", "ng-star-inserted");
      }

      // Si il y au moins une note ou si la matiere contient des sous-matiere
      lineProperties = {
        this: line,
        title: lineTitle,
        HasNotes: line.cells[tableConfiguration["notes"][0]].childNodes.length > 1,
        IsMaster: line.classList.contains("master"),
        IsSecondary: line.classList.contains("secondary"),
        IsSecondaryButNotlast: line.classList.contains("secondarynotlast"),
        notes: [],
        average: false,
        averageSpan: false,
        coef: false,
        GradesAndCoef: [],
      };

      if (!(lineProperties["HasNotes"] || lineProperties["IsMaster"] || lineProperties["IsSecondary"])) {
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
      lineProperties.coef = 1;
      if (tableConfiguration["coef"] && (coefColumn = tableConfiguration["coef"][0])) {
        if ((coefSpan = line.cells[coefColumn].querySelector("span"))) {
          if (debug.active) coefSpan.setAttribute("style", "border: solid orange;");
          lineProperties.coef = parseFloat(coefSpan.innerText);
        }
      }

      // Dans le cas de ligne de type "Master"
      if (lineProperties["IsMaster"]) {
        log(` > > > New Master line Analysis -> [ Starting ]`);
        masterLineProperties = lineProperties;
        masterLineProperties.averageSpan = averageSpan;
        masterLineProperties.coef = lineProperties.coef;
        masterLineProperties.GradesAndCoef = [];
        continue;
      }
      // Dans le cas des autres types

      log(` > > > New line Analysis -> [ Starting ]`);

      lineProperties.averageSpan = averageSpan;
      lineProperties.coef = lineProperties.coef;

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
        lineProperties.GradesAndCoef.push([note, coef]);
        lineProperties["notes"].push([note, coef, notes]);
      }

      if (!(lineProperties.GradesAndCoef.length > 0)) {
        log(` > > > > No note in this line -> [⚠️]`);
        if (!lineProperties["IsSecondaryButNotlast"] && lineProperties["IsSecondary"]) {
          if (!masterLineProperties.GradesAndCoef.length) continue;
          // Si c'est la derniere ligne secondaire, calcule la somme de la principale
          masterLineProperties.average = moyennePondere(masterLineProperties.GradesAndCoef);
          masterLineProperties.GradesAndCoef.push([masterLineProperties.average, masterLineProperties.coef]);
          if (masterLineProperties.averageSpan) {
            masterLineProperties.averageSpan.innerText = hundredthRound(masterLineProperties.average);
            Lines.push(masterLineProperties);
          }
          log(` > > > > Master line average {${masterLineProperties.average}} with coef {${masterLineProperties.coef}}`);
        }
        continue;
      }

      // Calcule de la moyenne de la ligne
      lineProperties.average = moyennePondere(lineProperties.GradesAndCoef);
      if (!options["AveragesPerSubjectRecalculation"] && averageTableInfos && averageTableInfos[lineTitle]) {
        if (averageTableInfos[lineTitle].average) lineProperties.average = averageTableInfos[lineTitle].average;
      }
      Lines.push(lineProperties);

      // Affiche la nouvelle moyenne de la ligne
      if (tableConfiguration["relevemoyenne"][0]) {
        if (debug.active && !lineProperties["IsSecondary"]) averageSpan.setAttribute("style", "border: solid blue;");
        if (debug.active && lineProperties["IsSecondary"]) averageSpan.setAttribute("style", "border: solid red;");
        if (averageSpan) averageSpan.innerText = hundredthRound(lineProperties.average);
      }

      if (lineProperties["IsSecondary"]) {
        // Ajout des notes et coefs pour la ligne Master
        masterLineProperties.GradesAndCoef.push([lineProperties.average, lineProperties.coef]);
        log(` > > > > Secondary line average {${lineProperties.average}} with coef {${lineProperties.coef}}`);

        if (!lineProperties["IsSecondaryButNotlast"]) {
          if (!masterLineProperties.GradesAndCoef.length) continue;
          // Si c'est la derniere ligne secondaire, calcule la somme de la principale
          masterLineProperties.average = moyennePondere(masterLineProperties.GradesAndCoef);
          LinesGradesAndCoef.push([masterLineProperties.average, masterLineProperties.coef]);
          if (masterLineProperties.averageSpan) {
            masterLineProperties.averageSpan.innerText = hundredthRound(masterLineProperties.average);
            Lines.push(masterLineProperties);
          }
          log(` > > > > Master line average {${masterLineProperties.average}} with coef {${masterLineProperties.coef}}`);
        }
      }

      if (!lineProperties["IsSecondary"] && lineProperties["HasNotes"]) {
        // Ajout des notes et coefs pour la moyenne générale
        LinesGradesAndCoef.push([lineProperties.average, lineProperties.coef]);
        log(` > > > > Line average {${lineProperties.average}} with coef {${lineProperties.coef}}`);
      }
    }

    // Calcule la moyenne
    FinalAverage = moyennePondere(LinesGradesAndCoef);

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
    Lines_SommeCoef = Lines.reduce((total, item) => (item.IsSecondary ? total : total + item.coef), 0);
    log(` > Total Coef {${Lines_SommeCoef}} -> [ Defined ]`);

    // Pour chaque ligne du tableau
    log(` > List of All Grade And Average Analysis -> [ Starting ]`);
    for (line of Lines) {
      log(` > > New Line Analysis -> [ Starting ]`);
      // Si elle n'est pas secondaire
      if (line.IsSecondary) continue;
      // Calcule sont influence
      LineInfluence = (line.coef * (line.average - FinalAverage)) / (Lines_SommeCoef - line.coef);
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

  customizationscss = document.createElement("style");
  fetch(browser.runtime.getURL("/styles/customizations.css"))
    .then((response) => response.text())
    .then((data) => {
      customizationscss.innerHTML = data;
    });
  document.head.appendChild(customizationscss);

  const darkreader = document.createElement("script");
  darkreader.src = browser.runtime.getURL("/scripts/darkreader.js");
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
  optionsPopup.src = browser.runtime.getURL("/pages/popup/interface.html");

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
  fetch(browser.runtime.getURL("/styles/default.css"))
    .then((response) => response.text())
    .then((data) => {
      defaultcss.innerHTML = data;
    });
  document.head.appendChild(defaultcss);

  window.addEventListener("message", (e) => {
    if (e.data == "closeOptionsPopup") {
      document.querySelector("html").classList.remove("optionsPopupActif");
    }
    if (e.data == "reloadOptionsPopup") {
      location.reload();
    }
  });
}
register(customizationButton);

/* ----------------------------------------------- */
