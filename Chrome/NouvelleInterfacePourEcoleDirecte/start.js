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
};
console.log("%cNouvelle Interface pour EcoleDirecte", logStyle.title);
/* ----------------------------------------------- */

/* ------------ Options Recuperateur ------------- */
chrome.storage.local.get("newEcoleDirecteInterface", function (data) {
  statue = data.newEcoleDirecteInterface;
  if (statue != undefined) {
    Start(statue);
  }
});
/* ----------------------------------------------- */

/* ----------- Options Initialisateur ------------ */
function Start(statue) {
  // Change le logo par un nouveau logo seulement si au moins une option est chargé
  if (statue.averageCalculator || statue.newMenu || statue.newDesign) {
    document.querySelector("link[rel*='icon']").href =
      chrome.runtime.getURL("/icons/favicon.ico");
  }
  // Informe sur l'état du module 'averageCalculator' (et le lance si il est activé)
  if (statue.averageCalculator) {
    console.log("%c" + "averageCalculator  [Activé]", logStyle.optionTrue);
    averageCalculator();
  } else {
    console.log("%c" + "averageCalculator  [Désativé]", logStyle.optionFalse);
  }
  // Informe sur l'état du module 'newMenu' (et le lance si il est activé)
  if (statue.newMenu) {
    console.log("%c" + "newMenu  [Activé]", logStyle.optionTrue);
    newMenu();
  } else {
    console.log("%c" + "newMenu  [Désativé]", logStyle.optionFalse);
  }
  // Informe sur l'état du module 'newDesign' (et le lance si il est activé)
  if (statue.newDesign) {
    console.log("%c" + "newDesign  [Activé]", logStyle.optionTrue);
    newDesign();
  } else {
    console.log("%c" + "newDesign  [Désativé]", logStyle.optionFalse);
  }
}
/* ----------------------------------------------- */

/* -------------- Options Fonctions -------------- */

function averageCalculator() {
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
            averageLoad();
          };
          if (averageCanLoad == false) {
            averageCanLoad = true;
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
    averageTableObserver.disconnect();

    document.querySelector("ul[role*='tablist']").onclick = function () {
      averageLoad();
    };

    if (document.getElementsByClassName("table releve")[0]) {
      // Change le message d'information sur le calcule de la moyenne
      if (document.getElementsByClassName("help-block ng-star-inserted")[0]) {
        document.getElementsByClassName(
          "help-block ng-star-inserted"
        )[0].innerHTML =
          "<b>Moyennes calculées par l'extension : " +
          chrome.runtime.getManifest().name +
          "</b>";
      }

      // Crée la div dedié a la moyenne générale
      if (document.getElementById("averageDiv")) {
        averageDiv = document.getElementById("averageDiv");
      } else {
        var averageDiv = document.createElement("div");
        document
          .getElementsByClassName("table releve ed-table")[0]
          .appendChild(averageDiv);
        averageDiv.id = "averageDiv";
        averageDiv.innerText = "Moyenne Générale";
        averageDiv.setAttribute(
          "style",
          "font-family: Tahoma,Helvetica,Arial,sans-serif; font-weight: 700; margin-top: 10px; border-radius: 999px; background-color: var(--light-primary-color); color: #fff;padding: 4px; text-align: center;"
        );
      }

      // ..
      NotesCoefsSum = 0;
      Coefs = 0;
      for (line of document.getElementsByClassName("table releve")[0].rows) {
        if (
          line.classList[0] == "ng-star-inserted" &&
          line.cells.item(3).childNodes.length > 1
        ) {
          lineNotesCoefsSum = 0;
          lineCoefs = 0;
          for (notes of line.cells.item(3).querySelectorAll("button>span")) {
            var note = parseFloat(
              notes.childNodes[0].nodeValue.replace(",", ".")
            );
            if (!isNaN(note)) {
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
              coef = 1;
              if (notes.querySelector(".coef ") != null) {
                coef = parseFloat(
                  notes
                    .querySelector(".coef ")
                    .childNodes[0].nodeValue.replace("(", "")
                    .replace(")", "")
                );
              }
              lineNotesCoefsSum += note * coef;
              lineCoefs += coef;
            }
          }
          lineAverage = lineNotesCoefsSum / lineCoefs;
          line.cells.item(2).querySelector("span").innerText = hundredthRound(
            lineAverage
          )
            .toString()
            .replace(".", ",");
          coef = parseFloat(line.cells.item(1).querySelector("span").innerText);
          NotesCoefsSum += lineAverage * coef;
          Coefs += coef;
        }
      }
      averageDiv.innerText =
        "MOYENNE GENERALE : " +
        hundredthRound(NotesCoefsSum / Coefs)
          .toString()
          .replace(".", ",");
    }
  }
}

function newMenu() {
  // Retire l'affichage de l'ancien menu, par injection css
  var removeOldMenu = document.createElement("style");
  removeOldMenu.innerHTML = "#container-menu {display: none !important;}";
  document.head.appendChild(removeOldMenu);

  // Ajoute la library "boxicons" pour l'affichage des icons
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
      // Recupere les information du menu dans un dictionnaire "menu"
      // --> Cherche le titre
      var menuTitle = menuElement.querySelector("strong").innerText;
      // --> Cherche l'url de la photo
      var menuPhoto = menuElement
        .querySelector("ed-menu > div > div > a > div")
        .style.backgroundImage.slice(5, 89);
      // --> Crée la liste
      var menu = {
        Title: menuTitle,
        Photo: menuPhoto,
        Elements: [],
      };
      // --> Ajoute chaque element du menu a la liste
      menuElement
        .querySelectorAll("ed-menu > div > div > div > ul > li")
        .forEach((element) => {
          // --> Cherche le lien dans l'element
          var menuElmentLink = element.querySelector(
            "li > ed-menu-block-item > div > a"
          ).href;
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
          // --> Cherche le texte associer à l'element
          var menuElmentNom = element.querySelector(
            "li > ed-menu-block-item > div > a > span"
          ).innerText;
          // --> Cherche si l'element est selectionné
          var menuElmentClass =
            element.querySelector("li > ed-menu-block-item > div > a")
              .classList[0] == "item-actif";
          menu.Elements.push({
            Lien: menuElmentLink,
            Icon: menuElmentIcon,
            Name: menuElmentNom,
            Class: menuElmentClass,
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

      // Création du nouveau menu
      var nav = document.createElement("nav");
      nav.classList.add("sidebar");

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

        // Assemblage des elements conposant les boutons
        _2_1_div.appendChild(_2_1_1_ul);
        _2_1_1_ul.appendChild(_2_1_1_1_li);
        _2_1_1_1_li.appendChild(_2_1_1_1_1_a);
        _2_1_1_1_1_a.appendChild(_2_1_1_1_1_1_i);
        _2_1_1_1_1_a.appendChild(_2_1_1_1_1_2_span);
      }

      // Mise en place (à l'aide du css injecté) de l'ouverture fermeture du menu
      document.getElementById("main-part").classList.add("sidebarnothover");
      document.getElementById("menu-header").classList.add("none");

      // Ajout du nouveau menu crée dans la page
      menuElement.appendChild(nav);
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

function newDesign() {
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
}
/* ----------------------------------------------- */
