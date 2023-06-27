/* ------------------- Infos ------------------- */
/*
--> A Bastoon Creation

  Liste des paramettres :
    : averageCalculator True/False
    : newMenu True/False
    : newDesign True/False
    : newColor [default,magenta,purple,turquoise,gold]
    : newFont [tahoma,poppin,openSans,montserrat,roboto,inter]
    : newBorder [default,thin,wide]
    : theme [light,dark]
*/
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

/* ------------ Options Recuperateur ------------- */
let statue = false;
chrome.storage.sync.get(["averageCalculator", "newMenu", "newDesign", "newColor", "newFont", "newBorder", "menuTheme", "theme", "debug"], function (data) {
  statue = data;
  Start(data);
});
/* ----------------------------------------------- */

/* ----------------- Console Log ----------------- */
const debug = new (class Debug {
  constructor() {
    this.active = false;
    this.modules = [];
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

  startModule(module) {
    try {
      module(module.name);
      console.log(`%c${module.name} [Enabled]`, logStyle.optionTrue);
      this.log(module.name + " >>> Successful execution");
    } catch (error) {
      console.error(error);
      console.log(`%c${module.name} [Enabled but Error]`, logStyle.optionError);
      this.log(module.name + " >>> Error on execution");
    }
  }
})();
/* ----------------------------------------------- */

/* ------------------ Login Page ----------------- */
// Teste si la page de connextion est afficher
function isLoginPage() {
  return /(?:http|https)(?::\/\/)(.+\.|)(?:ecoledirecte\.com\/login).*/.test(window.location.href) ? true : false;
}
/* ----------------------------------------------- */

/* ----------- Options Initialisateur ------------ */
function Start(statue) {
  // Active le mode de debugage si activé
  if (statue.debug) debug.start();

  // Modules de l'extension et statue d'activation
  Modules = [
    [averageCalculator, statue.averageCalculator],
    [newMenu, statue.newMenu],
    [newDesign, statue.newDesign],
    [options, true],
  ];

  // Change le logo si l'une des options est activé
  if (Modules.slice(0, -1).some((e) => e[1] == true)) document.querySelector("link[rel*='icon']").href = chrome.runtime.getURL(`/icons/EcoleDirecte/magenta.ico`);

  // Execusion des modules avec message dans la console
  for ([module, statue] of Modules) statue ? debug.startModule(module) : console.log(`%c${module.name} [Disabled]`, logStyle.optionFalse);
}
/* ----------------------------------------------- */

/* -------------- Options Fonctions -------------- */

function averageCalculator() {
  try {
    const tippy = document.createElement("script");
    tippy.src = chrome.runtime.getURL("/scripts/tippy.js");
    document.head.appendChild(tippy);
    tippyState = true;
  } catch {
    tippyState = false;
  }

  // Setup Module internal log
  let logName = arguments.callee.name;

  function log(str) {
    debug.log(logName, str);
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

    // ### Analyse des notes et calcules des moyennes ###
    log(" > Grade analysis and Average calculation -> [ Starting ]");

    TotalGradesAndCoef = [];

    AllGradeAndAverage = [];

    // Recherche la configuration du tableau
    log(" > > Table configuration finding -> [ Starting ]");
    tableConfiguration = {
      coef: false,
      relevemoyenne: false,
      notes: false,
    };

    // Cherche l'index de chaque colones
    [...gradeTable.tHead.rows[0].cells].forEach((cell, index) => {
      if (cell.classList.contains("coef")) {
        log(" > > > Column {coef} -> [ Found ]");
        tableConfiguration["coef"] = index;
      }
      if (cell.classList.contains("relevemoyenne")) {
        log(" > > > Column {relevemoyenne} -> [ Found ]");
        tableConfiguration["relevemoyenne"] = index;
      }
      if (cell.classList.contains("notes")) {
        log(" > > > Column {notes} -> [ Found ]");
        tableConfiguration["notes"] = index;
      }
    });

    // Vérifi la presence de chaque index
    log(" > > Table configuration Analysis -> [ Starting ]");
    for (item in tableConfiguration) {
      log(` > > > Column {${item}} -> [ ${tableConfiguration[item] ? "Here" : "⚠️ Not Here"} ]`);
    }

    // Verifie la pressence de la colonne des notes
    if (!tableConfiguration["notes"]) {
      averageDiv.innerText = "Colonne des notes introuvables";
      log(" > > Column Note -> [ 🛑 Non-existent ]");
      return;
    }

    // Fonction moyennePondere
    const moyennePondere = (liste) => liste.reduce((total, [combre, coeficient]) => total + combre * coeficient, 0) / liste.reduce((total, [_, coeficient]) => total + coeficient, 0);

    // Pour chaque ligne
    log(" > > Line by Line analysis -> [ Starting ]");
    for (line of gradeTable.tBodies[0].rows) {
      // Si il y au moins une note ou si la matiere contient des sous-matiere

      lineProperties = {
        Length: line.cells[tableConfiguration["notes"]].childNodes.length > 1,
        IsMaster: line.classList.contains("master"),
        IsSecondary: line.classList.contains("secondary"),
        IsSecondaryButNotlast: line.classList.contains("secondarynotlast"),
      };

      if (!(lineProperties["Length"] || lineProperties["IsMaster"] || lineProperties["IsSecondary"])) {
        log(" > > > This line does not contain any notes and is neither Master ou Secondary -> [⚠️]");
        continue;
      }

      // Defini la zone d'afficharge de la moyenne de la ligne
      if ((averageColumn = tableConfiguration["relevemoyenne"])) {
        // Si il n'y a pas de span pour afficher la moyenne
        if (!(averageSpan = line.cells[averageColumn].querySelector("span"))) {
          log(` > > > Element for average display -> [ ⚠️ Non-existent ]`);
          averageSpan = document.createElement("span");
          averageSpan.classList.add("ng-star-inserted");
          line.cells[averageColumn].appendChild(averageSpan);
          log(` > > > Element for average display -> [ Added ]`);
        }
        if (debug.active) averageSpan.setAttribute("style", "border: solid darkblue;");
        averageSpan.innerText = "...";
        log(` > > > Element for average display -> [ Defined ]`);
      } else {
        averageSpan = false;
        log(` > > > Element for average display -> [ ⚠️ Undefined ] <- because Column relevemoyenne Non-existent`);
      }

      // Trouve l'affichage du coef
      LineCoef = 1;
      if ((coefColumn = tableConfiguration["coef"])) {
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
      for (notes of line.cells[tableConfiguration["notes"]].querySelectorAll("button > span:nth-of-type(1).valeur")) {
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
        continue;
      }

      // Calcule de la moyenne de la ligne
      LineAverage = moyennePondere(LineGradesAndCoef);
      LineAllGradeAndAverage["average"] = LineAverage;
      AllGradeAndAverage.push(LineAllGradeAndAverage);

      // Affiche la nouvelle moyenne de la ligne
      if (tableConfiguration["relevemoyenne"]) {
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
      if (averageDiv) averageDiv.innerText = "Notes Introuvables";
      return;
    }

    // Affiche la moyenne
    log(` > Final Average : ${FinalAverage}`);
    if (averageDiv) averageDiv.innerText = "MOYENNE GENERALE : " + hundredthRound(FinalAverage);

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
        line.averageSpan.parentNode.dataset.tippyContent = `<center>Influence sur la moyenne générale : <br> <strong>${LineInfluence > 0 ? "+" : ""}${hundredthRound(LineInfluence)}</strong></center>`;
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
    window.postMessage("tippy-noteEvent", "*");
  }
}

function newMenu() {
  // Setup Module internal log
  let logName = arguments.callee.name;

  function log(str) {
    debug.log(logName, str);
  }

  // Ajoute la class "new-menu" au l'element HTML (pour la detection par le css)
  document.querySelector("html").classList.add("new-menu");
  log('css attribute "new-menu" -> [ Added ]');

  // Detecte les changement du body et execute quand nécésaire le code pour changer le menu
  log("BodyObserver -> [ Starting ]");
  const observer = new MutationObserver(() => {
    let menuElem = document.getElementById("container-menu");
    let usernameElem = document.getElementById("user-account-link");
    // execute le code si le menu actuellement affiché n'a pas déjà été modifié
    if (menuElem && usernameElem && menuElem.dataset.newmenuLoad != "true") {
      log("Menu editing -> [ Starting ]");

      // Indique que le menu à été modifié par l'extension
      menuElem.dataset.newmenuLoad = true;

      // Ajoute le nom de l'utilisateur dans un element de style et sous forme de variable css root
      rootName = document.createElement("style");
      rootName.id = "rootName";
      rootName.innerHTML = `:root { --userName: "${usernameElem.innerText}" }`;
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
      menuAddNewOptions("Déconnection", "fa-sign-out", "Déconnection", () => document.querySelector(".logout").click());
      log(" > Deconnection button -> [ Added ]");

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

function newDesign(logName) {
  document.documentElement.toggleAttribute("newDesign", true);
  document.addEventListener(
    "newMessage",
    (e) => {
      if (["newColor", "newFont", "newBorder", "menuTheme", "theme"].includes(e.detail[1])) document.documentElement.setAttribute(e.detail[1], e.detail[2]);
      e.detail[1] == "theme" && e.detail[2] == "dark" ? window.postMessage("DarkReader-enable", "*") : window.postMessage("DarkReader-desable", "*");
    },
    false
  );

  const darkreader = document.createElement("script");
  darkreader.src = chrome.runtime.getURL("/scripts/darkreader.js");
  document.head.appendChild(darkreader);
}

function options(logName) {
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
    document.querySelector("html").classList.remove("optionsPopupActif");
  }

  document.body.addEventListener("keyup", (e) => {
    if (e.key == "Escape") closeOptionsPopup();
  });

  optionsPopupBlur.onclick = () => {
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
      closeOptionsPopup();
    } else if (e.data == "reload") {
      location.reload();
    } else if (e.data.startsWith("optionChanged")) {
      document.dispatchEvent(
        new CustomEvent("newMessage", {
          detail: e.data.split(";"),
        })
      );
    }
  };
}

/* ----------------------------------------------- */
