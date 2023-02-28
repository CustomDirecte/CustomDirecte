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
chrome.storage.local.get("newEcoleDirecteInterface", function (data) {
  statue = data.newEcoleDirecteInterface;
  if (statue != undefined) {
    Start(statue);
  }
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
      if (str.constructor == Object) {
        str = JSON.stringify(str);
      }
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

/* ----------- Options Initialisateur ------------ */
function Start(statue) {
  // Active le mode de debugage si activé
  if (statue.debug) {
    debug.start();
  }
  // Change le logo par un nouveau logo seulement si au moins une option est chargé
  if (statue.averageCalculator || statue.newMenu || statue.newDesign) {
    document.querySelector("link[rel*='icon']").href =
      chrome.runtime.getURL("/icons/favicon.ico");
  }

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
  const averageTableObserver = new MutationObserver(function (
    mutationsList,
    averageTableObserver
  ) {
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
          if (averageCanLoad == true) {
            averageCanLoad = false;
          }
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
      // Change le message d'information sur le calcule de la moyenne
      if (document.querySelector("#encart-notes > p")) {
        document.querySelector("#encart-notes > p").innerHTML =
          "<b>Moyennes calculées par l'extension : " +
          chrome.runtime.getManifest().name +
          "</b>";
        debug.log(
          logName + "Zone de la date du derniere calcule --> Mise à jour"
        );
      } else {
        debug.log(
          logName + "⚠️ Zone de la date du derniere calcule --> Non Trouver"
        );
      }

      // Crée la div dedié a la moyenne générale
      if (document.getElementById("averageDiv")) {
        debug.log(logName + "Div de moyenne Générale --> Trouver");
        averageDiv = document.getElementById("averageDiv");
      } else {
        debug.log(logName + "Div de moyenne Générale --> Crée");
        var averageDiv = document.createElement("div");
        document.querySelector("table").appendChild(averageDiv);
        averageDiv.id = "averageDiv";
        averageDiv.setAttribute(
          "style",
          "font-family: Tahoma,Helvetica,Arial,sans-serif; font-weight: 700; margin-top: 10px; border-radius: 999px; background-color: var(--light-primary-color); color: #fff;padding: 4px; text-align: center;"
        );
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
      for (
        var i = 0;
        i < document.querySelector("thead > tr").cells.length;
        i++
      ) {
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
          // Si il y au moins une note
          if (line.cells[tableConfiguration["notes"]].childNodes.length > 1) {
            debug.log(
              logName + `> --> Analyse d'une nouvelle ligne du tableau`
            );
            // Moyenne de la ligne : Note * Coef
            lineNotesCoefsSum = 0;
            // Moyenne de la ligne : Coef
            lineCoefs = 0;

            // Pour chaque notes
            for (notes of line.cells[
              tableConfiguration["notes"]
            ].querySelectorAll("button > span:nth-of-type(1)")) {
              // Récuperation de la note
              var note = parseFloat(
                notes.childNodes[0].nodeValue.replace(",", ".")
              );
              // Si la note est correcte
              if (!isNaN(note)) {
                // Si la note n'est pas /20
                if (notes.querySelector(".quotien") != null) {
                  note =
                    note *
                    (20 /
                      parseFloat(
                        notes
                          .querySelector(".quotien")
                          .childNodes[0].nodeValue.replace("/", "")
                      ));
                }
                // Defini le coefitien
                coef = 1;
                if (notes.querySelector(".coef ") != null) {
                  coef = parseFloat(
                    notes
                      .querySelector(".coef ")
                      .childNodes[0].nodeValue.replace("(", "")
                      .replace(")", "")
                  );
                }
                if (debug.active) {
                  notes.setAttribute("style", "border: solid red;");
                }
                debug.log(
                  logName +
                    `> --> > Nouvelle note : ${note}  -  coeficient : ${coef}`
                );
                // Ajout des notes et coefs pour la ligne
                lineNotesCoefsSum += note * coef;
                lineCoefs += coef;
              } else {
                if (debug.active) {
                  notes.setAttribute("style", "border: dashed red;");
                }
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
                    line.cells[
                      tableConfiguration["relevemoyenne"]
                    ].querySelector("span")
                  )
                ) {
                  debug.log(
                    logName +
                      `> --> >> ⚠️ L'élément qui permet d'afficher la moyenne est introuvable`
                  );
                  var relevemoyenneSpan = document.createElement("span");
                  relevemoyenneSpan.classList.add("ng-star-inserted");
                  line.cells[tableConfiguration["relevemoyenne"]].appendChild(
                    relevemoyenneSpan
                  );
                  debug.log(
                    logName +
                      `> --> >> L'élément qui permet d'afficher à été crée`
                  );
                }
                if (debug.active) {
                  line.cells[tableConfiguration["relevemoyenne"]]
                    .querySelector("span")
                    .setAttribute("style", "border: solid blue;");
                }
                line.cells[tableConfiguration["relevemoyenne"]].querySelector(
                  "span"
                ).innerText = hundredthRound(lineAverage)
                  .toString()
                  .replace(".", ",");
              }
              // Recherche le coefitiens de la ligne
              coef = 1;
              if (tableConfiguration["coef"]) {
                if (debug.active) {
                  line.cells[tableConfiguration["coef"]]
                    .querySelector("span")
                    .setAttribute("style", "border: solid yellow;");
                }
                coef = parseFloat(
                  line.cells[tableConfiguration["coef"]].querySelector("span")
                    .innerText
                );
              }
              // Ajout des notes et coefs pour la moyenne générale
              NotesCoefsSum += lineAverage * coef;
              Coefs += coef;
              debug.log(
                logName +
                  `> --> >> Moyenne de la ligne ${lineAverage}  -  coeficient : ${coef}`
              );
            } else {
              debug.log(
                logName + `> --> >> ⚠️ Pas de note valide dans la ligne`
              );
            }
          }
        }

        // Calcule la moyenne
        moyenneG = hundredthRound(NotesCoefsSum / Coefs);
        if (isNaN(moyenneG)) {
          debug.log(logName + `🛑 Moyenne générale non valide`);
          if (averageDiv) {
            averageDiv.innerText = "Notes Introuvables";
          }
        } else {
          // Affiche la moyenne
          debug.log(logName + `> Moyenne générale : ${moyenneG}`);
          averageDiv.innerText =
            "MOYENNE GENERALE : " + moyenneG.toString().replace(".", ",");
        }
      } else {
        debug.log(logName + `🛑 Impossible de trouver les notes`);
        if (averageDiv) {
          averageDiv.innerText = "Notes Introuvables";
        }
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
      var menuPhoto = menuElement
        .querySelector("ed-menu > div > div > a > div")
        .style.backgroundImage.match(/url\(["']?([^"']*)["']?\)/)[1];
      debug.log(
        logName + `> --> Récupération de la photo de profile : ${menuPhoto}`
      );
      // --> Crée la liste
      var menu = {
        Title: menuTitle,
        Photo: menuPhoto,
        Elements: [],
      };
      // --> Ajoute chaque element du menu a la liste
      debug.log(logName + "> --> Récupération des onglets");
      menuElement
        .querySelectorAll("ed-menu > div > div > div > ul > li")
        .forEach((element) => {
          debug.log(logName + "> --> --> Analyse d'un nouvelle onglet");
          // --> Cherche le lien dans l'element
          var menuElmentLink = element.querySelector(
            "li > ed-menu-block-item > div > a"
          ).href;
          debug.log(
            logName + `> --> --> > Récupération du lien : ${menuElmentLink}`
          );
          // --> Cherche l'icon de l'element
          var menuElmentIcon = [];
          for (
            let i = 0;
            i <
            element.querySelector("li > ed-menu-block-item > div > a > i")
              .classList.length;
            i++
          ) {
            menuElmentIcon.push(
              element.querySelector("li > ed-menu-block-item > div > a > i")
                .classList[i]
            );
          }
          debug.log(
            logName + `> --> --> > Récupération de l'icon : ${menuElmentIcon}`
          );
          // --> Cherche le texte associer à l'element
          var menuElmentNom = element.querySelector(
            "li > ed-menu-block-item > div > a > span"
          ).innerText;
          debug.log(
            logName + `> --> --> > Récupération du texte : ${menuElmentNom}`
          );
          // --> Cherche si l'element est selectionné
          var menuElmentClass =
            element.querySelector("li > ed-menu-block-item > div > a")
              .classList[0] == "item-actif";
          debug.log(
            logName +
              `> --> --> > Virifie si l'élément est selectionné : ${menuElmentClass}`
          );
          // --> Cherche si l'element à un indice
          var menuElmentIndice = "";
          if (
            element.querySelector(
              "li > ed-menu-block-item > div > a > span.badge "
            )
          ) {
            var menuElmentIndice = element.querySelector(
              "li > ed-menu-block-item > div > a > span.badge "
            ).innerText;
          }
          debug.log(
            logName +
              `> --> --> > Virifie si l'élément à un indice : ${menuElmentIndice}`
          );
          menu.Elements.push({
            Lien: menuElmentLink,
            Icon: menuElmentIcon,
            Name: menuElmentNom,
            Class: menuElmentClass,
            Indice: menuElmentIndice,
          });
        });

      // Suprimme le menu
      menuElement.removeChild(
        document.querySelector("div[id*='container-menu'] > ed-menu")
      );
      menuElement.removeChild(
        document.querySelector("div[id*='container-menu'] > strong")
      );
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
        if (
          document.querySelector(".menu-bar").scrollHeight !=
          document.querySelector(".menu-bar").clientHeight
        ) {
          document.querySelector(".menu-bar").style.overflowY = "scroll";
        }
      };
      nav.onmouseout = function () {
        document.getElementById("main-part").classList.remove("sidebarhover");
      };
      debug.log(logName + `> --> > Création d'un mode Hover [1/2]`);

      // Création du contenue du nouveau menu
      var _1_header = document.createElement("header");

      var _1_1_div = document.createElement("div");
      _1_1_div.classList.add("image-text");

      var _1_1_1_span = document.createElement("span");
      _1_1_1_span.classList.add("image");

      var _1_1_1_2_img = document.createElement("img");
      _1_1_1_2_img.src = menu.Photo;

      var _1_1_2_div = document.createElement("div");
      _1_1_2_div.classList.add("text", "logo-text");

      var _1_1_2_1_span = document.createElement("span");
      _1_1_2_1_span.classList.add("name");
      _1_1_2_1_span.innerText =
        document.getElementById("user-account-link").innerText;

      var _1_1_2_2_span = document.createElement("span");
      _1_1_2_2_span.classList.add("profession");
      _1_1_2_2_span.innerText = menu.Title;

      var _2_div = document.createElement("div");
      _2_div.classList.add("menu-bar");

      var _2_1_div = document.createElement("div");
      _2_1_div.classList.add("menu");

      var _2_2_div = document.createElement("div");
      _2_2_div.classList.add("bottom-content");

      var _2_2_1_1_li = document.createElement("li");
      _2_2_1_1_li.classList.add("mode2");

      var _2_2_1_1_1_a = document.createElement("a");
      _2_2_1_1_1_a.onclick = function () {
        document.getElementById("user-account-link").click();
      };

      var _2_2_1_1_1_1_i = document.createElement("i");
      _2_2_1_1_1_1_i.classList.add("bx", "bxs-user", "icon");

      var _2_2_1_1_1_2_span = document.createElement("span");
      _2_2_1_1_1_2_span.classList.add("text", "nav-text");
      _2_2_1_1_1_2_span.innerText = "Mon Compte";

      var _2_2_2_1_li = document.createElement("li");
      _2_2_2_1_li.classList.add("mode");

      var _2_2_2_1_1_a = document.createElement("a");
      _2_2_2_1_1_a.onclick = function () {
        document.querySelector("button[tooltip*='Déconnexion']").click();
      };

      var _2_2_2_1_1_1_i = document.createElement("i");
      _2_2_2_1_1_1_i.classList.add("icon-ed_deconnexion", "icon");

      var _2_2_2_1_1_2_span = document.createElement("span");
      _2_2_2_1_1_2_span.classList.add("text", "nav-text");
      _2_2_2_1_1_2_span.innerText = "Déconnection";

      debug.log(logName + `> --> > Création du contenu du menu`);

      // Assemblage des elements crées precedament
      nav.appendChild(_1_header);
      _1_header.appendChild(_1_1_div);
      _1_1_div.appendChild(_1_1_1_span);
      _1_1_1_span.appendChild(_1_1_1_2_img);
      _1_1_div.appendChild(_1_1_2_div);
      _1_1_2_div.appendChild(_1_1_2_1_span);
      _1_1_2_div.appendChild(_1_1_2_2_span);

      nav.appendChild(_2_div);
      _2_div.appendChild(_2_1_div);

      _2_div.appendChild(_2_2_div);
      _2_2_div.appendChild(_2_2_1_1_li);
      _2_2_1_1_li.appendChild(_2_2_1_1_1_a);
      _2_2_1_1_1_a.appendChild(_2_2_1_1_1_1_i);
      _2_2_1_1_1_a.appendChild(_2_2_1_1_1_2_span);

      _2_2_div.appendChild(_2_2_2_1_li);
      _2_2_2_1_li.appendChild(_2_2_2_1_1_a);
      _2_2_2_1_1_a.appendChild(_2_2_2_1_1_1_i);
      _2_2_2_1_1_a.appendChild(_2_2_2_1_1_2_span);

      debug.log(logName + `> --> > Injection du contenu`);

      // Création des boutons
      for (let i = 0; i < menu.Elements.length; i++) {
        var _2_1_1_ul = document.createElement("ul");
        _2_1_1_ul.classList.add("menu-links");

        var _2_1_1_1_li = document.createElement("li");
        _2_1_1_1_li.classList.add("nav-link");

        var _2_1_1_1_1_a = document.createElement("a");
        _2_1_1_1_1_a.href = menu.Elements[i].Lien;
        if (menu.Elements[i].Class) {
          _2_1_1_1_1_a.classList.add("selected");
        }

        var _2_1_1_1_1_1_i = document.createElement("i");
        _2_1_1_1_1_1_i.classList.add("icon", "iconED");
        for (let i2 = 0; i2 < menu.Elements[i].Icon.length; i2++) {
          _2_1_1_1_1_1_i.classList.add(menu.Elements[i].Icon[i2]);
          if (menu.Elements[i].Icon[i2] == "fa") {
            _2_1_1_1_1_1_i.classList.remove("iconED");
          }
        }

        var _2_1_1_1_1_2_span = document.createElement("span");
        _2_1_1_1_1_2_span.classList.add("text", "nav-text");
        _2_1_1_1_1_2_span.innerText = menu.Elements[i].Name;

        var _2_1_1_1_1_2_span_indice = document.createElement("span");
        _2_1_1_1_1_2_span_indice.classList.add("indice-text");
        _2_1_1_1_1_2_span_indice.innerText = menu.Elements[i].Indice;

        // Assemblage des elements conposant les boutons
        _2_1_div.appendChild(_2_1_1_ul);
        _2_1_1_ul.appendChild(_2_1_1_1_li);
        _2_1_1_1_li.appendChild(_2_1_1_1_1_a);
        _2_1_1_1_1_a.appendChild(_2_1_1_1_1_1_i);
        _2_1_1_1_1_1_i.appendChild(_2_1_1_1_1_2_span_indice);
        _2_1_1_1_1_a.appendChild(_2_1_1_1_1_2_span);
      }

      debug.log(logName + `> --> > Création des boutons`);

      // Mise en place (à l'aide du css injecté) de l'ouverture fermeture du menu
      document.getElementById("main-part").classList.add("sidebarnothover");
      document.getElementById("menu-header").classList.add("none");

      debug.log(logName + `> --> > Création d'un mode Hover [2/2]`);

      // Ajout du nouveau menu crée dans la page
      menuElement.appendChild(nav);
      debug.log(logName + `> --> >> Injection du menu`);
    } else if (
      // Scrip à executer seulement lorsque la page est celle de login (verifi l'url grace à un paterne 'regex', verifi la presence du bouton 'connexion')
      /(?:http|https)(?::\/\/)(.+\.|)(?:ecoledirecte\.com\/login).*/.test(
        window.location.href
      ) &&
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
  // --> crée un css personnalisé
  var style = document.createElement("style");
  newColorStyle = "";
  if (!!statue.newColor) {
    // Chnage la pallete de couleur d'ecole direct par celle choisie
    newColorThemes = {
      default:
        "--footer-primary-color: #edf3fd;  --hover-primary-color: #aad8ea;  --light-primary-color: #0f8fd1;  --smalldark-primary-color: #2e6ac8;  --dark-primary-color: #0e3e85;  --ultradark-primary-color: #092354;",
      magenta:
        "-footer-primary-color: #FFB3C0;  --hover-primary-color: #FE90A3;  --light-primary-color: #C8194A;  --smalldark-primary-color: #A3133C;  --dark-primary-color: #7F0F2F;  --ultradark-primary-color: #5a0920;",
      purple:
        "--footer-primary-color: #ecb3ff;  --hover-primary-color: #e290fe;  --light-primary-color: #9c19c8;  --smalldark-primary-color: #8013a4;  --dark-primary-color: #640f80;  --ultradark-primary-color: #440958;",
      turquoise:
        "--footer-primary-color: #b3ffec;  --hover-primary-color: #90fee2;  --light-primary-color: #19c89c;  --smalldark-primary-color: #13a480;  --dark-primary-color: #0f8064;  --ultradark-primary-color: #095844;",
      gold: "--footer-primary-color: #ffffb3;  --hover-primary-color: #fefe90;  --light-primary-color: #c8c819;  --smalldark-primary-color: #a4a413;  --dark-primary-color: #80800f;  --ultradark-primary-color: #585809;",
    };

    newColorDefault1 =
      "--light-secondary-color: #e46bad;  --secondary-color: #cd1478;  --dark-secondary-color: #960b56;  --light-placeholder-color: #f5f6f7;  --smalldark-placeholder-color: #e4e7ea;  --dark-placeholder-color: #c3c3c3;  --ultradark-placeholder-color: #887f7f;  --light-notice-color: #fffca0;  --middle-notice-color: #fff575;  --dark-notice-color: #f2ec9e;  --travail-color: #6aaf11;  --contenu-color: #0c91c6;  --search-color: #a5a7ab;  --menu-hover-color: #f5f5f5;";

    newColorStyle = newColorThemes[statue.newColor] + newColorDefault1;
  }
  newFontStyle = "";
  if (!!statue.newFont) {
    newFontStyle = "font-family: var(--font-" + statue.newFont + ")";
  }
  newBorderStyle = "";
  if (!!statue.newBorder) {
    newBorderStyle =
      "border-radius: var(--borderRadius-" + statue.newBorder + ")";
  }
  themeStyle = "";
  if (!!statue.theme) {
    themeThemes = {
      dark: "--theme-body-color: #fff; --theme-sidebar-color: #1C2130; --theme-text-color:#ccc",
      light:
        "--theme-body-color: #fff; --theme-sidebar-color: var(--smalldark-primary-color); --theme-text-color:#ebebeb",
    };

    themeStyle = themeThemes[statue.theme];
  }
  style.innerHTML =
    ":root {" +
    newColorStyle +
    themeStyle +
    "} \n * {" +
    newFontStyle +
    "} \n div {" +
    newBorderStyle +
    "}";
  // --> Ajoute le css personnalisé
  document.head.appendChild(style);
  debug.log(logName + `Injection d'un css personnalisé`);
}
/* ----------------------------------------------- */
