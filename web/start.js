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
chrome.storage.sync.get("newEcoleDirecteInterface", function (data) {
  statue = data.newEcoleDirecteInterface;
  if (statue != undefined) Start(statue);
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
  // Retire l'affichage de l'ancien menu, par injection css
  debug.log(logName + "Suppression de l'affichage de l'ancien menu");
  var removeOldMenu = document.createElement("style");
  removeOldMenu.innerHTML = "#container-menu {display: none !important;}";
  document.head.appendChild(removeOldMenu);

  // Ajoute la library "boxicons" pour l'affichage des icons
  debug.log(logName + "Importe la library boxicons");
  var boxiconslink = document.createElement("link");
  boxiconslink.href = "https://unpkg.com/boxicons@2.1.1/css/boxicons.min.css";
  boxiconslink.rel = "stylesheet";
  document.head.appendChild(boxiconslink);

  // Scrip à executer apres le chargement
  window.onload = () => {
    // Definition de la variable "menuElement" sur le menu par defaut
    menuElement = document.querySelector("div[id*='container-menu']");

    // Scrip à executer seulement lors de la presence du menu
    if (menuElement != null) {
      debug.log(logName + "> Création du nouveau Menu");
      // Recupere les information du menu dans un dictionnaire "menu"
      // --> Cherche le titre
      var menuTitle = menuElement.querySelector("strong").innerText;
      debug.log(logName + `> --> Récupération du titre : ${menuTitle}`);
      // --> Cherche l'url de la photo
      var menuPhoto = menuElement.querySelector("ed-menu > div > div > a > div").style.backgroundImage.match(/url\(["']?([^"']*)["']?\)/)[1];
      debug.log(logName + `> --> Récupération de la photo de profile : ${menuPhoto}`);
      // --> Crée la liste
      var menu = {
        Title: menuTitle,
        Photo: menuPhoto,
        Elements: [],
      };
      // --> Ajoute chaque element du menu a la liste
      debug.log(logName + "> --> Récupération des onglets");
      menuElement.querySelectorAll("ed-menu > div > div > div > ul > li").forEach((element) => {
        debug.log(logName + "> --> --> Analyse d'un nouvelle onglet");
        // --> Cherche le lien dans l'element
        var menuElmentLink = element.querySelector("li > ed-menu-block-item > div > a").href;
        debug.log(logName + `> --> --> > Récupération du lien : ${menuElmentLink}`);
        // --> Cherche l'icon de l'element
        var menuElmentIcon = [];
        for (let i = 0; i < element.querySelector("li > ed-menu-block-item > div > a > i").classList.length; i++) {
          menuElmentIcon.push(element.querySelector("li > ed-menu-block-item > div > a > i").classList[i]);
        }
        debug.log(logName + `> --> --> > Récupération de l'icon : ${menuElmentIcon}`);
        // --> Cherche le texte associer à l'element
        var menuElmentNom = element.querySelector("li > ed-menu-block-item > div > a > span").innerText;
        debug.log(logName + `> --> --> > Récupération du texte : ${menuElmentNom}`);
        // --> Cherche si l'element est selectionné
        var menuElmentClass = element.querySelector("li > ed-menu-block-item > div > a").classList[0] == "item-actif";
        debug.log(logName + `> --> --> > Virifie si l'élément est selectionné : ${menuElmentClass}`);
        // --> Cherche si l'element à un indice
        var menuElmentIndice = "";
        if (element.querySelector("li > ed-menu-block-item > div > a > span.badge ")) {
          var menuElmentIndice = element.querySelector("li > ed-menu-block-item > div > a > span.badge ").innerText;
        }
        debug.log(logName + `> --> --> > Virifie si l'élément à un indice : ${menuElmentIndice}`);
        menu.Elements.push({
          Lien: menuElmentLink,
          Icon: menuElmentIcon,
          Name: menuElmentNom,
          Class: menuElmentClass,
          Indice: menuElmentIndice,
        });
      });

      // Suprimme le menu
      menuElement.removeChild(document.querySelector("div[id*='container-menu'] > ed-menu"));
      menuElement.removeChild(document.querySelector("div[id*='container-menu'] > strong"));
      menuElement.id = "newMenu";
      debug.log(logName + `> --> Suprimme definitive de l'ancien Menu`);

      // Création du nouveau menu
      var nav = document.createElement("nav");
      nav.classList.add("sidebar");
      debug.log(logName + `> --> Ajout du nouveau Menu`);

      // Mise en place (à l'aide du css injecté) de l'ouverture fermeture du menu
      nav.onmouseover = function () {
        document.getElementById("main-part").classList.add("sidebarhover");
        document.querySelector(".menu-bar").style.overflowY = "hidden";
        if (document.querySelector(".menu-bar").scrollHeight != document.querySelector(".menu-bar").clientHeight) {
          document.querySelector(".menu-bar").style.overflowY = "scroll";
        }
      };
      nav.onmouseout = function () {
        document.getElementById("main-part").classList.remove("sidebarhover");
      };

      debug.log(logName + `> --> > Création d'un mode Hover [1/2]`);

      function creerElement(element, classList = null, src = null, innerText = null, onclick = null, tooltip = null, href = null) {
        let newElement = document.createElement(element);
        if (classList) newElement.classList.add(...classList);
        if (src) newElement.src = src;
        if (innerText) newElement.innerText = innerText;
        if (onclick) newElement.onclick = onclick;
        if (tooltip) newElement.setAttribute("tooltip", tooltip);
        if (href) newElement.href = href;
        return newElement;
      }

      debug.log(logName + `> --> > Création du contenu du menu`);

      let header = creerElement("header"),
        imageTextDiv = creerElement("div", ["image-text"]),
        imageSpan = creerElement("span", ["image"]),
        image = creerElement("img", null, menu.Photo),
        textDiv = creerElement("div", ["text", "logo-text"]),
        nameSpan = creerElement("span", ["name"], null, document.getElementById("user-account-link").innerText),
        professionSpan = creerElement("span", ["profession"], null, menu.Title),
        menuBarDiv = creerElement("div", ["menu-bar"]),
        menuDiv = creerElement("div", ["menu"]),
        bottomContentDiv = creerElement("div", ["bottom-content"]),
        mode2Li = creerElement("li", ["mode2"]),
        mode2a = creerElement("a", null, null, null, () => document.getElementById("user-account-link").click()),
        mode2i = creerElement("i", ["bx", "bxs-user", "icon"]),
        mode2span = creerElement("span", ["text", "nav-text"], null, "Mon Compte"),
        modeLi = creerElement("li", ["mode"]),
        modea = creerElement("a", null, null, null, () => {
          sessionStorage.clear();
          window.location.reload();
        }),
        modei = creerElement("i", ["icon-ed_deconnexion", "icon"]),
        modespan = creerElement("span", ["text", "nav-text"], null, "Déconnection");

      nav.appendChild(header);
      header.appendChild(imageTextDiv);
      imageTextDiv.appendChild(imageSpan);
      imageSpan.appendChild(image);
      imageTextDiv.appendChild(textDiv);
      textDiv.appendChild(nameSpan);
      textDiv.appendChild(professionSpan);

      nav.appendChild(menuBarDiv);
      menuBarDiv.appendChild(menuDiv);
      menuBarDiv.appendChild(bottomContentDiv);
      bottomContentDiv.appendChild(mode2Li);
      mode2Li.appendChild(mode2a);
      mode2a.appendChild(mode2i);
      mode2a.appendChild(mode2span);
      bottomContentDiv.appendChild(modeLi);
      modeLi.appendChild(modea);
      modea.appendChild(modei);
      modea.appendChild(modespan);

      debug.log(logName + `> --> > Injection du contenu`);

      let menuLinksUl = creerElement("ul", ["menu-links"]);

      for (let i = 0; i < menu.Elements.length; i++) {
        let navLinkLi = creerElement("li", ["nav-link"]),
          navLinka = creerElement("a", menu.Elements[i].Class ? ["selected"] : null, null, null, null, null, menu.Elements[i].Lien),
          navLinki = creerElement("i", [...["icon"], ...menu.Elements[i].Icon, ...(menu.Elements[i].Icon.includes("fa") ? [] : ["iconED"])]),
          navLinkspan = creerElement("span", ["text", "nav-text"], null, menu.Elements[i].Name),
          navLinkSpanIndice = creerElement("span", ["indice-text"], null, menu.Elements[i].Indice);

        navLinka.classList.add("text-underline");

        menuDiv.appendChild(menuLinksUl);
        menuLinksUl.appendChild(navLinkLi);
        navLinkLi.appendChild(navLinka);
        navLinka.appendChild(navLinki);
        navLinki.appendChild(navLinkSpanIndice);
        navLinka.appendChild(navLinkspan);
      }

      debug.log(logName + `> --> > Création des boutons`);

      // Mise en place (à l'aide du css injecté) de l'ouverture fermeture du menu
      document.getElementById("main-part").classList.add("sidebarnothover");
      document.querySelector(".navbar-nav").style.display = "none";

      debug.log(logName + `> --> > Création d'un mode Hover [2/2]`);

      // Ajout du nouveau menu crée dans la page
      menuElement.appendChild(nav);
      debug.log(logName + `> --> >> Injection du menu`);
    } else if (
      // Scrip à executer seulement lorsque la page est celle de login (verifi l'url grace à un paterne 'regex', verifi la presence du bouton 'connexion')
      /(?:http|https)(?::\/\/)(.+\.|)(?:ecoledirecte\.com\/login).*/.test(window.location.href) &&
      document.getElementById("connexion")
    ) {
      // Recharge la page lors de la supression du formulaire de connection (quand l'utilisateur viens juste de ce connecté)
      // --> Pour que le scripte de changement de menu puisse s'executé correctement
      function onElementRemoved(element, callback) {
        new MutationObserver(function (mutations) {
          if (!document.body.contains(element)) {
            callback();
            this.disconnect();
          }
        }).observe(element.parentElement, {
          childList: true,
        });
      }
      onElementRemoved(document.querySelector("ng-component"), function () {
        window.location.reload();
      });
    }
  };
}

function newDesign(logName) {
  let style = document.createElement("style"),
    newColorStyle = "",
    newFontStyle = "",
    newBorderStyle = "",
    themeStyle = "";
  const themeThemes = {
    dark: "--theme-body-color: #fff; --theme-sidebar-color: #1C2130; --theme-text-color:#ccc",
    light: "--theme-body-color: #fff; --theme-sidebar-color: var(--smalldark-primary-color); --theme-text-color:#ebebeb",
  };

  if (!!statue.newColor) {
    const newColorThemes = {
      default: ["#edf3fd", "#aad8ea", "#0f8fd1", "#2e6ac8", "#0e3e85", "#092354", "15, 143, 209"],
      magenta: ["#FFB3C0", "#FE90A3", "#C8194A", "#A3133C", "#7F0F2F", "#5a0920", "200, 25, 74"],
      purple: ["#ecb3ff", "#e290fe", "#9c19c8", "#8013a4", "#640f80", "#440958", "156, 25, 200"],
      turquoise: ["#b3ffec", "#90fee2", "#19c89c", "#13a480", "#0f8064", "#095844", "25, 200, 156"],
      gold: ["#ffffb3", "#fefe90", "#c8c819", "#a4a413", "#80800f", "#585809", "200, 200, 25"],
    }[statue.newColor];

    newColorStyle = `--footer-primary-color: ${newColorThemes[0]};  --hover-primary-color: ${newColorThemes[1]};  --light-primary-color: ${newColorThemes[2]};  --smalldark-primary-color: ${newColorThemes[3]};  --dark-primary-color: ${newColorThemes[4]};  --ultradark-primary-color: ${newColorThemes[5]}; --bs-primary-rgb:${newColorThemes[6]}; --bs-success-rgb:${newColorThemes[6]}; --ultralight-secondary-color: #f7e0e6; --light-secondary-color: #e46bad; --secondary-color: #cd1478; --dark-secondary-color: #960b56; --light-placeholder-color: #f5f6f7; --smalldark-placeholder-color: #e4e7ea; --dark-placeholder-color: #c3c3c3; --ultradark-placeholder-color: #887f7f; --warning-primary-color: #ffc107; --warning-secondary-color: #8a6d3b; --light-notice-color: #fffca0; --middle-notice-color: #fff575; --dark-notice-color: #f2ec9e; --dark-has-succes-color: #3c763d; --light-has-succes-color: #dff0d8; --travail-color: #6aaf11; --contenu-color: #0c91c6; --search-color: #a5a7ab; --menu-hover-color: #f5f5f5; --bs-secondary-rgb: 205, 20, 120; --bs-danger-rgb: 205, 20, 120; --bs-border-color: var(--smalldark-placeholder-color); --bs-warning-rgb: 138,109,59;`;
  }

  if (!!statue.newFont) newFontStyle = `font-family: var(--font-${statue.newFont});`;

  if (!!statue.newBorder) newBorderStyle = `border-radius: var(--borderRadius-${statue.newBorder});`;

  if (!!statue.theme) themeStyle = themeThemes[statue.theme];

  style.innerHTML = `:root {${newColorStyle} ${themeStyle}; --font-family:${statue.newFont}; --font-family-malvoyant:${statue.newFont}; } \n * {${newFontStyle}} \n #main div {${newBorderStyle}} \n #header-commun, .navbar { background: var(--light-placeholder-color) !important} \n .container-fluid{color: var(--ultradark-primary-color)}`;

  document.head.appendChild(style);

  debug.log(logName + `Injection d'un css personnalisé`);
}
/* ----------------------------------------------- */
