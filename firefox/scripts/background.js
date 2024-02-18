/* IMPORT FIREFOX LIB */
browser = browser;
browserStorage = browser.storage.local;
browserVersion = browser.runtime.getManifest().version;
browserStorageOnChanged = browser.storage.onChanged;
/* ----------------- */

defaultOptions = {
  groups: [
    {
      ID: "notesTable",
      Title: "Tableau de notes",
      Subtitle: "Ajoute des fonctionnalités visuelles et pratiques à votre tableau de notes",
    },
    {
      ID: "sidebar",
      Title: "Barre latérale",
      Subtitle: "Une nouvelle barre, de nouvelles fonctionnalités",
    },
    {
      ID: "customizations",
      Title: "Personnalisation",
      Subtitle: "Permet de personnaliser un grand nombre d'éléments du site",
    },
    {
      ID: "development",
      Title: "Développeur",
      Subtitle: "Options conçues pour les développeurs",
    },
    {
      ID: "close",
      Title: { close: "Fermer", reload: "Recharger" },
      Subtitle: false,
    },
  ],
  options: [
    {
      Group: "notesTable",
      Type: "Switch",
      Value: null,
      Default: true,
      option: "noteTableAnalysis",
      Title: "Activer l’analyse du tableau de note",
      Subtitle: "Active les fonctionnalitées ci-dessous",
      reloadingRequired: true,
      lock: false,
    },
    {
      Group: "notesTable",
      Type: "Switch",
      Value: null,
      Default: true,
      option: "generalAverageDisplay",
      Title: "Forcer l’affichage de la moyenne générale",
      Subtitle: "Forcer l’affichage des moyennes par matières",
      reloadingRequired: true,
      lock: "noteTableAnalysis",
    },
    {
      Group: "notesTable",
      Type: "Switch",
      Value: null,
      Default: false,
      option: "AveragesPerSubjectDisplay",
      Title: "Forcer l’affichage des moyennes par matières",
      Subtitle: "Force l’affichage des moyennes par matières et les recalcule",
      reloadingRequired: true,
      lock: "noteTableAnalysis",
    },
    {
      Group: "notesTable",
      Type: "Switch",
      Value: null,
      Default: false,
      option: "ClassAveragesDisplay",
      Title: "Afficher les moyennes de classe",
      Subtitle: "Affiche les moyennes de classe dans le tableau de notes",
      reloadingRequired: true,
      lock: "noteTableAnalysis",
    },
    {
      Group: "notesTable",
      Type: "Switch",
      Value: null,
      Default: false,
      option: "AveragesPerSubjectRecalculation",
      Title: "Recalculer les moyennes par matières",
      Subtitle: "Force le recalcul des moyennes par matières",
      Warning: "Si votre établissement désactive les coeficients, les moyennes par matières ne seront pas correctes",
      reloadingRequired: true,
      lock: "noteTableAnalysis",
    },
    {
      Group: "notesTable",
      Type: "Selection",
      "--Xplacement": -170,
      Options: [
        {
          Title: "Aucun",
          Selection: "none",
          Img: "svg/AveragesColorIndicator/1.svg",
        },
        {
          Title: "Ronds",
          Selection: "round",
          Img: "svg/AveragesColorIndicator/2.svg",
        },
        {
          Title: "Fonds",
          Selection: "background",
          Img: "svg/AveragesColorIndicator/3.svg",
        },
        {
          Title: "Contours",
          Selection: "outline",
          Img: "svg/AveragesColorIndicator/4.svg",
        },
      ],
      Value: null,
      Default: "background",
      option: "AveragesColorIndicator",
      Title: "Indicateurs colorés sur les moyennes par matières",
      Subtitle: "Indique à l’aide de couleurs si les moyennes réduisent ou augmentent la moyenne générale",
      reloadingRequired: false,
      lock: "noteTableAnalysis",
    },
    {
      Group: "notesTable",
      Type: "Selection",
      "--Xplacement": -232,
      Options: [
        {
          Title: "Aucun",
          Selection: "none",
          Img: "svg/AveragesInfluenceTooltips/1.svg",
        },
        {
          Title: "Valeur",
          Selection: "value",
          Img: "svg/AveragesInfluenceTooltips/2.svg",
        },
        {
          Title: "Texte & Valeur",
          Selection: "textAndValue",
          Img: "svg/AveragesInfluenceTooltips/3.svg",
        },
      ],
      Value: null,
      Default: "textAndValue",
      option: "AveragesInfluenceTooltips",
      Title: "Info-bulles indiquant l’influence des moyennes par matières",
      Subtitle: "Info-bulles qui affichent combien de points cette moyenne fait perdre/gagner à la moyenne générale",
      reloadingRequired: false,
      lock: "noteTableAnalysis",
    },
    {
      Group: "sidebar",
      Type: "Switch",
      Value: null,
      Default: false,
      option: "newSidebar",
      Title: "Nouveau design pour la barre latérale",
      Subtitle: "Donne une allure moderne à la barre permettant l’ajout d’options",
      reloadingRequired: true,
      lock: false,
    },
    {
      Group: "sidebar",
      Type: "Switch",
      Value: null,
      Default: false,
      option: "sidebarDarkmode",
      Title: "Mode sombre pour la barre latérale",
      Subtitle: "Rend les couleurs de fond de la barre latérale plus sombres, pour une meilleure lisibilité",
      reloadingRequired: false,
      lock: "newSidebar",
    },
    {
      Group: "sidebar",
      Type: "Switch",
      Value: null,
      Default: false,
      option: "pinnedSidebar",
      Title: "Laisser la barre latérale déployée en continu",
      Subtitle: "Empêche la barre latérale de se réduire lorsqu'elle n’est plus survolée par la souris",
      reloadingRequired: false,
      lock: "newSidebar",
    },
    {
      Group: "sidebar",
      Type: "Switch",
      Value: null,
      Default: false,
      option: "hideCustomizationButton",
      Title: "Cacher le bouton de personnalisation",
      Subtitle: "Si cette option est activée, vous devez uiliser le bouton de la barre latérale pour accéder à ce menu",
      reloadingRequired: false,
      lock: "newSidebar",
    },
    {
      Group: "sidebar",
      Type: "MultiSelection",
      SelectionRange: 2,
      "--Xplacement": -300,
      MultiOptions: [
        [
          {
            Title: "Icon",
            Selection: "icon",
            Img: "svg/customizationButton/1.svg",
          },
          {
            Title: "Icon & Texte",
            Selection: "iconAndText",
            Img: "svg/customizationButton/2.svg",
          },
        ],
        [
          {
            Title: "Bordure",
            Selection: "border",
            Img: "svg/customizationButton/3.svg",
          },
          {
            Title: "Ile",
            Selection: "ile",
            Img: "svg/customizationButton/4.svg",
          },
        ],
      ],
      Value: null,
      Default: ["iconAndText", "ile"],
      option: "customizationButton",
      Title: "Style du bouton de personnalisation",
      Subtitle: "Changer le style du bouton de personnalisation pour vous correspondre au mieux",
      reloadingRequired: false,
      lock: false,
    },
    {
      Group: "customizations",
      Type: "Switch",
      Value: null,
      Default: true,
      option: "customization",
      Title: "Activer les options de personnalisation",
      Subtitle: "Permet l'activation des options de personnalisation",
      reloadingRequired: true,
      lock: false,
    },
    {
      Group: "customizations",
      Type: "Switch",
      Value: null,
      Default: false,
      option: "darkmode",
      Title: "Activer le mode sombre",
      Subtitle: "L'ensemble du site sera sombre, utile la nuit !",
      reloadingRequired: false,
      lock: "customization",
    },
    {
      Group: "customizations",
      Type: "Color",
      ColorHTML: [
        "<input type='range' value='0' class='colorSlider' min='0' max='360' step='1'>",
        "<div class='colorSimulation' style='background-color: var(--colorSimulation-6);'></div>",
        "<div class='colorSimulation' style='background-color: var(--colorSimulation-5);'></div>",
        "<div class='colorSimulation' style='background-color: var(--colorSimulation-4);'></div>",
        "<div class='colorSimulation' style='background-color: var(--colorSimulation-3);'></div>",
        "<div class='colorSimulation' style='background-color: var(--colorSimulation-2);'></div>",
        "<div class='colorSimulation' style='background-color: var(--colorSimulation-1);'></div>",
      ],
      Value: null,
      Default: 340,
      option: "colorCustomization",
      Title: "Couleur",
      Subtitle: false,
      reloadingRequired: false,
      lock: "customization",
    },
    {
      Group: "customizations",
      Type: "CustomSelection",
      Custom: "cornerDemo",
      "--Xplacement": -165,
      Options: [
        {
          Title: "Aucun",
          Selection: "none",
          CSS: "border-radius: 0px;",
        },
        {
          Title: "Faible",
          Selection: "thin",
          CSS: "border-radius: 10px;",
        },
        {
          Title: "Moyen",
          Selection: "wide",
          CSS: "border-radius: 20px;",
        },
      ],
      Value: null,
      Default: "none",
      option: "cornerCustomization",
      Title: "Angle des coins",
      Subtitle: false,
      reloadingRequired: false,
      lock: "customization",
    },
    {
      Group: "customizations",
      Type: "CustomSelection",
      Custom: "fontDemo",
      "--Xplacement": -165,
      Options: [
        {
          Title: "tahoma",
          Selection: "tahoma",
          CSS: "font-family: var(--font-tahoma);",
        },
        {
          Title: "roboto",
          Selection: "roboto",
          CSS: "font-family: var(--font-roboto);",
        },
        {
          Title: "poppin",
          Selection: "poppin",
          CSS: "font-family: var(--font-poppin);",
        },
        {
          Title: "openSans",
          Selection: "openSans",
          CSS: "font-family: var(--font-openSans);",
        },
        {
          Title: "openDyslexic",
          Selection: "openDyslexic",
          CSS: "font-family: var(--font-openDyslexic);",
        },
        {
          Title: "montserrat",
          Selection: "montserrat",
          CSS: "font-family: var(--font-montserrat);",
        },
        {
          Title: "merriweather",
          Selection: "merriweather",
          CSS: "font-family: var(--font-merriweather);",
        },
        {
          Title: "leckerliOne",
          Selection: "leckerliOne",
          CSS: "font-family: var(--font-leckerliOne);",
        },
        {
          Title: "inter",
          Selection: "inter",
          CSS: "font-family: var(--font-inter);",
        },
        {
          Title: "comicSans",
          Selection: "comicSans",
          CSS: "font-family: var(--font-comicSans);",
        },
      ],
      Value: null,
      Default: "tahoma",
      option: "fontCustomization",
      Title: "Police d'écriture",
      Subtitle: false,
      reloadingRequired: false,
      lock: "customization",
    },
    {
      Group: "development",
      Type: "Switch",
      Value: null,
      Default: false,
      option: "dev",
      Title: "Activer les options de développement",
      Subtitle: "Permet l'activation des options de développement",
      reloadingRequired: true,
      lock: false,
    },
    {
      Group: "development",
      Type: "Switch",
      Value: null,
      Default: false,
      option: "log",
      Title: "Activer les logs (journaux d'événements)",
      Subtitle: "Affiche tous les événements du programme dans la console",
      reloadingRequired: false,
      lock: "dev",
    },
    {
      Group: "development",
      Type: "Button",
      Value: null,
      Default: false,
      option: "downloadlog",
      Content: "download",
      Title: "Télécharger les logs",
      Subtitle: false,
      reloadingRequired: false,
      lock: "dev",
    },
  ],
};

function optionsCorrector(inputOptions = false) {
  // Use the base "defaultOptions" and apply the actual options if they are correct
  function fixedOptions(inputOptions) {
    return {
      // Reset storage with Defaults Options or New Defaults Options
      groups: defaultOptions.groups,
      // Keep same value if possible
      options: defaultOptions.options.map((option) => {
        // Get value of same id old option [optionFound]
        const optionFound = inputOptions.options.find((o) => o.option === option.option);
        // If old option exist with value =>
        if (optionFound && optionFound.Value !== null) {
          // If the option have property "Options" { CustomSelection } =>
          if (optionFound.Options && option.Options !== undefined) {
            if (option.Options.some((x) => x.Selection === optionFound.Value)) option.Value = optionFound.Value;
          }
          // If the option have property "MultiOptions" { MultiSelection } =>
          else if (optionFound.MultiOptions && option.MultiOptions !== undefined) {
            option.Value = option.Default.map((value, i) => (optionFound.Value[i] && option.MultiOptions[i].some((x) => x.Selection === optionFound.Value[i]) ? optionFound.Value[i] : value));
          }
          // If the option have bool value { Switch } =>
          else if (typeof option.Default === "boolean" && typeof optionFound.Value === "boolean") option.Value = optionFound.Value;
          // If the option have number value { Color } =>
          else if (typeof option.Default === "number" && !isNaN(Number(optionFound.Value))) option.Value = optionFound.Value;
        }
        return option;
      }),
    };
  }

  if (inputOptions) return fixedOptions(inputOptions);

  browserStorage.get((syncOptions) => {
    if (syncOptions.options) {
      browserStorage.clear();
      browserStorage.set(fixedOptions(syncOptions));
    } else browserStorage.set(defaultOptions);
  });
}

browser.runtime.onInstalled.addListener((reason) => {
  if (reason.reason === browser.runtime.OnInstalledReason.INSTALL) {
    // Initiate sync values with default
    browserStorage.set(defaultOptions);
  } else {
    // Check all sync values on update
    optionsCorrector();
  }
});

optionsCorrector();
