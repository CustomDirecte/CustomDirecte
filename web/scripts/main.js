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
    console.log("%c" + "Debug [Activé]", logStyle.debugTrue);
    this.log("Extension Version " + chrome.runtime.getManifest().version);
    return true;
  }

  log(str) {
    if (this.active) {
      if (str.constructor == Object) str = JSON.stringify(str);
      console.log("%cDebug | " + str, logStyle.debug);
    }
  }

  startModule(module) {
    this.log(module.name + " --> Start");
    try {
      module(`${module.name} | `);
    } catch (error) {
      console.error(error);
    }
    this.log(module.name + " --> End");
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

  // Change le logo par un nouveau logo seulement si au moins une option est chargé
  icon = statue.averageCalculator || statue.newMenu || statue.newDesign ? "magenta" : "default";
  document.querySelector("link[rel*='icon']").href = chrome.runtime.getURL(`/icons/EcoleDirecte/${icon}.ico`);

  // Modules de l'extension et leurs statue
  Modules = [
    [averageCalculator, statue.averageCalculator],
    [newMenu, statue.newMenu],
    [newDesign, statue.newDesign],
    [options, true],
  ];

  // Execusion des modules
  for ([module, statue] of Modules) {
    if (statue) {
      console.log("%c" + module.name + " [Activé]", logStyle.optionTrue);
      debug.startModule(module);
    } else {
      console.log("%c" + module.name + " [Désativé]", logStyle.optionFalse);
    }
  }

  if (statue.debug) {
    console.log("\n\n");
    debug.log("Debug des scripts sous event :");
    console.log("\n\n");
  }
}
/* ----------------------------------------------- */

/* -------------- Options Fonctions -------------- */

function averageCalculator(logName) {
  // Fonction Arrondie
  function hundredthRound(x) {
    return Math.round(x * 100) / 100;
  }

  // Detecte les changement et execute une fois 'averageLoad()'
  var averageCanLoad = false;
  const averageTableObserver = new MutationObserver(function (mutationsList, averageTableObserver) {
    for (let mutation of mutationsList) {
      if (mutation.type === "childList") {
        if (document.getElementById("encart-notes")) {
          document.getElementById("onglets-periodes").onclick = function () {
            if (document.getElementById("encart-notes")) {
              debug.log(logName + "Changement d'onglet --> Calcule de moyenne");
              averageLoad();
            }
          };
          if (averageCanLoad == false) {
            averageCanLoad = true;
            debug.log(logName + "Page de note chargé --> Calcule de moyenne");
            averageLoad();
          }
        } else {
          if (averageCanLoad == true) averageCanLoad = false;
        }
      }
    }
  });
  averageTableObserver.observe(document.body, {
    childList: true,
    subtree: true,
  });

  function averageLoad() {
    if (document.querySelector("table")) {
      // Met a jour le design
      debug.log(logName + "Design du tableau mis à jour");
      document.querySelector("table.releve").classList.add("newTable");

      // Change le message d'information sur le calcule de la moyenne
      if (document.querySelector("#encart-notes > p")) {
        document.querySelector("#encart-notes > p").innerHTML = "<b>Moyennes calculées par l'extension : " + chrome.runtime.getManifest().name + "</b>";
        debug.log(logName + "Zone de la date du derniere calcule --> Mise à jour");
      } else {
        debug.log(logName + "⚠️ Zone de la date du derniere calcule --> Non Trouver");
      }

      // Supprime les ligne de moyennes générale deja existante
      if ((table_ligneMoyenneGénérale = document.querySelector("table").querySelector("tr > td.moyennegenerale-valeur"))) {
        debug.log(logName + "⚠️ Ligne de moyenne Générale mal placé --> Supprimé");
        var table_ligneMoyenneGénérale = document.querySelector("table").querySelector("tr > td.moyennegenerale-valeur").parentNode;
        table_ligneMoyenneGénérale.parentNode.removeChild(table_ligneMoyenneGénérale);
      }

      // Crée la div dedié a la moyenne générale
      if (document.getElementById("averageDiv")) {
        debug.log(logName + "Ligne de moyenne Générale --> Trouver");
        averageDiv = document.getElementById("averageDiv");
      } else {
        debug.log(logName + "Ligne de moyenne Générale --> Crée");
        var tableEdit_footer = document.querySelector("table").createTFoot();
        var tableEdit_ligneMoyenneGénérale = tableEdit_footer.insertRow(0);
        tableEdit_ligneMoyenneGénérale.classList.add("ng-star-inserted");
        var averageDiv = tableEdit_ligneMoyenneGénérale.insertCell(0);
        averageDiv.innerHTML = "MOYENNE GENERALE :";
        averageDiv.colSpan = document.querySelector("thead > tr").cells.length;
        averageDiv.classList.add("moyennegenerale-valeur", "averageDisplay");
        averageDiv.id = "averageDiv";
      }

      averageDiv.innerText = "Chargement...";

      // --- Analyse et calcules ---

      // ## Formule de la Moyenne pondérée : (Note * Coef) + (Note * Coef) + ... / Coef + Coef + ...

      // Moyenne générale : Note * Coef
      NotesCoefsSum = 0;
      // Moyenne générale : Coef
      Coefs = 0;

      // Recherche la configuration du tableau
      tableConfiguration = {
        coef: false,
        relevemoyenne: false,
        notes: false,
      };
      for (var i = 0; i < document.querySelector("thead > tr").cells.length; i++) {
        var obj = [document.querySelector("thead > tr").cells[i].classList, i];
        if (obj[0].contains("coef")) {
          tableConfiguration["coef"] = obj[1];
        } else if (obj[0].contains("relevemoyenne")) {
          tableConfiguration["relevemoyenne"] = obj[1];
        } else if (obj[0].contains("notes")) {
          tableConfiguration["notes"] = obj[1];
        }
      }

      for (item in tableConfiguration) {
        if (tableConfiguration[item]) {
          debug.log(logName + `Colone : ${item} --> Trouver`);
        } else {
          debug.log(logName + `⚠️ Colone : ${item} --> Non Trouver`);
        }
      }

      if (tableConfiguration["notes"]) {
        debug.log(logName + `> Analyse du Tableau de note`);
        // Pour chaque ligne
        for (line of document.querySelector("tbody").rows) {
          // Si il y au moins une note ou si la matiere contient des sous-matiere
          lineCondition_Length = line.cells[tableConfiguration["notes"]].childNodes.length > 1;
          lineCondition_MasterType = line.classList.contains("master");
          lineCondition_SecondaryType = line.classList.contains("secondary");
          lineCondition_SecondaryNotlastType = line.classList.contains("secondarynotlast");
          if (lineCondition_Length || lineCondition_MasterType || lineCondition_SecondaryType) {
            // Ne calcule pas la moyenne des ligne de type "master"
            if (!lineCondition_MasterType) {
              debug.log(logName + `> --> Analyse d'une nouvelle ligne (Normal ou Secondaire) du tableau`);
              // Moyenne de la ligne : Note * Coef
              lineNotesCoefsSum = 0;
              // Moyenne de la ligne : Coef
              lineCoefs = 0;

              // Pour chaque notes
              for (notes of line.cells[tableConfiguration["notes"]].querySelectorAll("button > span:nth-of-type(1).valeur")) {
                // Récuperation de la note
                var note = parseFloat(notes.childNodes[0].nodeValue.replace(",", "."));
                // Si la note est correcte
                if (!isNaN(note)) {
                  // Si la note n'est pas /20
                  if (notes.querySelector(".quotien") != null) note = note * (20 / parseFloat(notes.querySelector(".quotien").childNodes[0].nodeValue.replace("/", "")));
                  // Defini le coefitien
                  coef = 1;
                  if (notes.querySelector(".coef ") != null) coef = parseFloat(notes.querySelector(".coef ").childNodes[0].nodeValue.replace("(", "").replace(")", ""));
                  if (debug.active) notes.setAttribute("style", "border: solid red;");
                  debug.log(logName + `> --> > Nouvelle note : ${note}  -  coeficient : ${coef}`);
                  // Ajout des notes et coefs pour la ligne
                  lineNotesCoefsSum += note * coef;
                  lineCoefs += coef;
                } else {
                  if (debug.active) notes.setAttribute("style", "border: dashed red;");
                  debug.log(logName + `> --> > ⚠️ Note non valide : ${note}`);
                }
              }
              // Si la ligne à au moins une note correcte
              if (lineCoefs > 0) {
                // Calcule de la moyenne de la ligne
                lineAverage = lineNotesCoefsSum / lineCoefs;
                // Affiche la nouvelle moyenne
                if (tableConfiguration["relevemoyenne"]) {
                  if (
                    !(
                      // Si l'element d'affichage n'existe pas, crée un span
                      line.cells[tableConfiguration["relevemoyenne"]].querySelector("span")
                    )
                  ) {
                    debug.log(logName + `> --> >> ⚠️ L'élément qui permet d'afficher la moyenne est introuvable`);
                    var relevemoyenneSpan = document.createElement("span");
                    relevemoyenneSpan.classList.add("ng-star-inserted");
                    line.cells[tableConfiguration["relevemoyenne"]].appendChild(relevemoyenneSpan);
                    debug.log(logName + `> --> >> L'élément qui permet d'afficher à été crée`);
                  }
                  if (debug.active && !lineCondition_SecondaryType) {
                    line.cells[tableConfiguration["relevemoyenne"]].querySelector("span").setAttribute("style", "border: solid blue;");
                  } else if (debug.active && lineCondition_SecondaryType) {
                    line.cells[tableConfiguration["relevemoyenne"]].querySelector("span").setAttribute("style", "border: solid green;");
                  }
                  line.cells[tableConfiguration["relevemoyenne"]].querySelector("span").innerText = hundredthRound(lineAverage).toString().replace(".", ",");
                }
                // Recherche le coefitiens de la ligne
                coef = 1;
                if (tableConfiguration["coef"]) {
                  if (debug.active && !lineCondition_SecondaryType) {
                    line.cells[tableConfiguration["coef"]].querySelector("span").setAttribute("style", "border: solid yellow;");
                  } else if (debug.active && lineCondition_SecondaryType) {
                    line.cells[tableConfiguration["coef"]].querySelector("span").setAttribute("style", "border: solid lightyellow;");
                  }
                  coef = parseFloat(line.cells[tableConfiguration["coef"]].querySelector("span").innerText);
                }
                if (lineCondition_SecondaryType) {
                  // Ajout des notes et coefs pour la ligne Master
                  masterlineNotesCoefsSum += lineAverage * coef;
                  masterlineCoefs += coef;
                  debug.log(logName + `> --> >> Moyenne de la ligne secondaire ${lineAverage}  -  coeficient : ${coef}`);
                  if (!lineCondition_SecondaryNotlastType) {
                    // Si c'est la derniere ligne secondaire, calcule la somme de la principale
                    masterlineAverage = masterlineNotesCoefsSum / masterlineCoefs;
                    //
                    NotesCoefsSum += masterlineAverage * masterCoef;
                    Coefs += masterCoef;
                    if (masterMoyenneLine) masterMoyenneLine.innerText = hundredthRound(masterlineAverage).toString().replace(".", ",");
                    debug.log(logName + `> --> >> Moyenne de la ligne de type "Master" ${lineAverage}  -  coeficient : ${coef}`);
                  }
                } else if (lineCondition_Length) {
                  // Ajout des notes et coefs pour la moyenne générale
                  NotesCoefsSum += lineAverage * coef;
                  Coefs += coef;
                  debug.log(logName + `> --> >> Moyenne de la ligne ${lineAverage}  -  coeficient : ${coef}`);
                }
              } else {
                debug.log(logName + `> --> >> ⚠️ Pas de note valide dans la ligne`);
              }
            } else {
              debug.log(logName + `> --> Analyse d'une nouvelle ligne de type "Master" du tableau`);
              // Dans le cas de ligne de type "Master"
              // Defini la zone d'afficharge de la moyenne de la ligne
              if (tableConfiguration["relevemoyenne"]) {
                if (
                  !(
                    // Si l'element d'affichage n'existe pas, crée un span
                    line.cells[tableConfiguration["relevemoyenne"]].querySelector("span")
                  )
                ) {
                  debug.log(logName + `> --> >> ⚠️ L'élément qui permet d'afficher la moyenne est introuvable`);
                  var relevemoyenneSpan = document.createElement("span");
                  relevemoyenneSpan.classList.add("ng-star-inserted");
                  line.cells[tableConfiguration["relevemoyenne"]].appendChild(relevemoyenneSpan);
                  debug.log(logName + `> --> >> L'élément qui permet d'afficher à été crée`);
                }
                if (debug.active) line.cells[tableConfiguration["relevemoyenne"]].querySelector("span").setAttribute("style", "border: solid darkblue;");
                masterMoyenneLine = line.cells[tableConfiguration["relevemoyenne"]].querySelector("span");
                masterMoyenneLine.innerText = "...";
              }
              // Recherche et Defini le coefitiens de la ligne
              masterCoef = 1;
              if (tableConfiguration["coef"]) {
                if (debug.active) line.cells[tableConfiguration["coef"]].querySelector("span").setAttribute("style", "border: solid orange;");
                masterCoef = parseFloat(line.cells[tableConfiguration["coef"]].querySelector("span").innerText);
              }
              // Moyenne de la ligne : Note * Coef
              masterlineNotesCoefsSum = 0;
              // Moyenne de la ligne : Coef
              masterlineCoefs = 0;
            }
          }
        }

        // Calcule la moyenne
        moyenneG = hundredthRound(NotesCoefsSum / Coefs);
        if (isNaN(moyenneG)) {
          debug.log(logName + `🛑 Moyenne générale non valide`);
          if (averageDiv) averageDiv.innerText = "Notes Introuvables";
        } else {
          // Affiche la moyenne
          debug.log(logName + `> Moyenne générale : ${moyenneG}`);
          averageDiv.innerText = "MOYENNE GENERALE : " + moyenneG.toString().replace(".", ",");
        }
      } else {
        debug.log(logName + `🛑 Impossible de trouver les notes`);
        if (averageDiv) averageDiv.innerText = "Notes Introuvables";
      }
    }
  }
}

function newMenu(logName) {
  document.querySelector("html").classList.add("new-menu");

  load = true;

  const observer = new MutationObserver(function () {
    if (!document.getElementById("container-menu") || !document.getElementById("user-account-link")) {
      load = true;
    }
    if (load && document.getElementById("container-menu") && document.getElementById("user-account-link")) {
      load = false;

      rootName = document.createElement("style");
      rootName.id = "rootName";
      rootName.innerHTML = `:root { --userName: "${document.getElementById("user-account-link").innerText}" }`;
      document.head.appendChild(rootName);

      // Main Div
      menuMoreOptions = document.createElement("div");
      document.getElementById("container-menu").appendChild(menuMoreOptions);
      menuMoreOptions.classList.add("menuMoreOptions");

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

      menuAddNewOptions("Options", "fa-cog", "Personnalisation", () => document.querySelector("html").classList.add("optionsPopupActif"));

      menuAddNewOptions("Account", "fa-user", "Mon Compte", () => document.getElementById("user-account-link").click());

      menuAddNewOptions("Déconnection", "fa-sign-out", "Déconnection", () => document.querySelector(".logout").click());

      document.querySelector(".navbar-nav").style.display = "none";
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
  optionsPopup.src = chrome.runtime.getURL("../pages/popup/index.html");

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
