/*
  Liste des paramettres :
    : averageCalculator True/False
    : newMenu True/False
    : newDesign True/False
    : newColor [default,magenta,purple,turquoise,gold]
    : newFont [tahoma,poppin,openSans,montserrat,roboto,inter]
    : newBorder [default,thin,wide]
    : theme [light,dark]
*/

// --> Affichage de la version
document.querySelector("[version]").innerText =
  "Version " + chrome.runtime.getManifest().version;

// --> Valeurs par défaut
averageCalculator = true;
newMenu = true;
newDesign = false;
newColor = "default";
newFont = "tahoma";
newBorder = "default";
theme = "dark";

// --> Elements
averageCalculatorElement = document.querySelector(
  "[feature='averageCalculator']"
);
newMenuElement = document.querySelector("[feature='newMenu']");
newDesignElement = document.querySelector("[feature='newDesign']");
newColorElements = document.querySelectorAll("[feature='newColor']");
newFontElements = document.querySelectorAll("[feature='newFont']");
newBorderElements = document.querySelectorAll("[feature='newBorder']");
themeElements = document.querySelectorAll("[feature='theme']");

themeOptionElement = document.querySelector(".themeOption");
themeMenuElement = document.querySelector(".themeMenu");

// --> Charge les valeurs enregistrées
chrome.storage.local.get("newEcoleDirecteInterface", function (data) {
  localStoreage = data.newEcoleDirecteInterface;
  if (localStoreage != undefined) {
    averageCalculator = localStoreage.averageCalculator;
    newMenu = localStoreage.newMenu;
    newDesign = localStoreage.newDesign;
    newColor = localStoreage.newColor;
    newFont = localStoreage.newFont;
    newBorder = localStoreage.newBorder;
    theme = localStoreage.theme;
    updateInterface();
  }
});

// --> Met ajour l'interface
function updateInterface() {
  //  : averageCalculator
  if (
    !(averageCalculator == !!averageCalculatorElement.attributes["selected"])
  ) {
    averageCalculatorElement.toggleAttribute("selected");
  }
  //  : newMenu
  if (!(newMenu == !!newMenuElement.attributes["selected"])) {
    newMenuElement.toggleAttribute("selected");
    themeMenuElement.classList.toggle("hidden");
  }
  //  : newDesign
  if (!(newDesign == !!newDesignElement.attributes["selected"])) {
    newDesignElement.toggleAttribute("selected");
    themeOptionElement.classList.toggle("hidden");
  }
  //  : newColor
  newColorElements.forEach(function (item) {
    if (!!item.attributes["selected"]) {
      item.toggleAttribute("selected");
    }
  });
  Array.from(newColorElements)
    .find((element) => element.attributes["listOption"].value == newColor)
    .toggleAttribute("selected");

  //  : newFont
  newFontElements.forEach(function (item) {
    if (!!item.attributes["selected"]) {
      item.toggleAttribute("selected");
    }
  });
  Array.from(newFontElements)
    .find((element) => element.attributes["listOption"].value == newFont)
    .toggleAttribute("selected");

  //  : newBorder
  newBorderElements.forEach(function (item) {
    if (!!item.attributes["selected"]) {
      item.toggleAttribute("selected");
    }
  });
  Array.from(newBorderElements)
    .find((element) => element.attributes["listOption"].value == newBorder)
    .toggleAttribute("selected");

  //  : theme
  themeElements.forEach(function (item) {
    if (!!item.attributes["selected"]) {
      item.toggleAttribute("selected");
    }
  });
  Array.from(themeElements)
    .find((element) => element.attributes["listOption"].value == theme)
    .toggleAttribute("selected");

  // {Met a jour le stockage}
  updateLocalStoreage();
}

// --> Met a jour le stockage
function updateLocalStoreage() {
  chrome.storage.local.set({
    newEcoleDirecteInterface: {
      averageCalculator: averageCalculator,
      newMenu: newMenu,
      newDesign: newDesign,
      newColor: newColor,
      newFont: newFont,
      newBorder: newBorder,
      theme: theme,
    },
  });

  async function reloadTabs() {
    let tabs = await chrome.tabs.query({
      url: "*://*.ecoledirecte.com/*",
    });
    for (tab of tabs) {
      chrome.tabs.reload(tab.id, {
        bypassCache: true,
      });
    }
  }
  reloadTabs();
}

// --> Active/Desacive les options
averageCalculatorElement.addEventListener("click", function () {
  averageCalculator = !averageCalculatorElement.attributes["selected"];
  updateInterface();
});
newMenuElement.addEventListener("click", function () {
  newMenu = !newMenuElement.attributes["selected"];
  updateInterface();
});
newDesignElement.addEventListener("click", function () {
  newDesign = !newDesignElement.attributes["selected"];
  updateInterface();
});
newColorElements.forEach((newColorElement) => {
  newColorElement.addEventListener("click", function () {
    newColor = newColorElement.attributes["listOption"].value;
    updateInterface();
  });
});
newFontElements.forEach((newFontElement) => {
  newFontElement.addEventListener("click", function () {
    newFont = newFontElement.attributes["listOption"].value;
    updateInterface();
  });
});
newBorderElements.forEach((newBorderElement) => {
  newBorderElement.addEventListener("click", function () {
    newBorder = newBorderElement.attributes["listOption"].value;
    updateInterface();
  });
});
themeElements.forEach((themeElement) => {
  themeElement.addEventListener("click", function () {
    theme = themeElement.attributes["listOption"].value;
    updateInterface();
  });
});
