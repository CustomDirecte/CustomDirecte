// --> Gére la feremeture du menu
function closeOptionsPopup() {
  window.top.postMessage("closeOptionsPopup", "*");
}
function reload() {
  window.top.postMessage("reload", "*");
}
function optionChanged(option, value) {
  window.top.postMessage(`optionChanged;${option};${value}`, "*");
}
document.body.addEventListener("keyup", (e) => {
  if (e.key == "Escape") closeOptionsPopup();
});

// --> Affichage de la version
document.querySelector("[version]").innerText = "Version " + chrome.runtime.getManifest().version;

// --> Get elements
function getFeature(value, all = false) {
  if (all) return document.querySelectorAll(`[feature='${value}']`);
  return document.querySelector(`[feature='${value}']`);
}

/* Special */
PersonnalisationsElement = getFeature("Personnalisations");
menuThemeParentElement = getFeature("menuThemeParent");
debugElement = getFeature("debug");
reloadElement = getFeature("reload");

/* Fonctionnalités */
averageCalculatorElement = getFeature("averageCalculator");
newMenuElement = getFeature("newMenu");
newDesignElement = getFeature("newDesign");

/* Personnalisations */
newColorElements = getFeature("newColor", true);
newFontElements = getFeature("newFont", true);
newBorderElements = getFeature("newBorder", true);
menuThemeElements = getFeature("menuTheme", true);
themeElements = getFeature("theme", true);

AllElements = {
  averageCalculator: [averageCalculatorElement, false],
  newMenu: [newMenuElement, false, [menuThemeParentElement, "hidden", true]],
  newDesign: [newDesignElement, false, [PersonnalisationsElement, "desactivation", true]],
  newColor: [newColorElements, true],
  newFont: [newFontElements, true],
  newBorder: [newBorderElements, true],
  menuTheme: [menuThemeElements, true],
  theme: [themeElements, true],
};

/* Default Options */
defaultOptions = {
  averageCalculator: true,
  newMenu: true,
  newDesign: false,
  newColor: "default",
  newFont: "tahoma",
  newBorder: "default",
  menuTheme: "dark",
  theme: "dark",
  debug: false,
};

/* Actual Options */
ActualOptions = {};
chrome.storage.sync.get(["averageCalculator", "newMenu", "newDesign", "newColor", "newFont", "newBorder", "menuTheme", "theme", "debug"], function (data) {
  for (option in defaultOptions) {
    if (data[option] == undefined) ActualOptions[option] = defaultOptions[option];
    else ActualOptions[option] = data[option];
  }
  setEvent();
  updateInterface();
});

// --> Update Visual

function setEvent() {
  function eventlement(element, all, option, more) {
    if (!all) {
      element.onclick = () => {
        ActualOptions[option] = !ActualOptions[option];
        more ? more[0].toggleAttribute(more[1], more[2] ? !ActualOptions[option] : ActualOptions[option]) : false;
        updateInterface();
      };
    } else {
      element.forEach(
        (ele) =>
          (ele.onclick = () => {
            ActualOptions[option] = ele.attributes["listOption"].value;
            updateInterface();
          })
      );
    }
  }
  for (option in AllElements) {
    eventlement(AllElements[option][0], AllElements[option][1], option, AllElements[option][2] ? AllElements[option][2] : false);
  }
  // --> Option de Debug
  debugElement.addEventListener("click", function (e) {
    if (e.detail === 4) {
      if (!ActualOptions["debug"]) {
        if (window.confirm("Activé l'option de Debug ?")) {
          ActualOptions["debug"] = true;
        }
      } else {
        window.alert("Option de Debug Désactivé");
        ActualOptions["debug"] = false;
      }
      updateInterface();
    }
  });
}

function updateInterface() {
  function updateElement(element, all, value, more) {
    if (!all) {
      more ? more[0].toggleAttribute(more[1], more[2] ? !ActualOptions[option] : ActualOptions[option]) : false;
      element.toggleAttribute("selected", value);
    } else {
      element.forEach((ele) => ele.toggleAttribute("selected", false));
      Array.from(element)
        .find((ele) => ele.attributes["listOption"].value == value)
        .toggleAttribute("selected", true);
    }
  }
  for (option in AllElements) {
    optionChanged(option, ActualOptions[option]);
    updateElement(AllElements[option][0], AllElements[option][1], ActualOptions[option], AllElements[option][2] ? AllElements[option][2] : false);
  }
  chrome.storage.sync.set(ActualOptions);
}

reloadElement.onclick = () => {
  reload();
};
