defaultOptions = {
  groups: [
    {
      ID: "notesTable",
      Title: "Tableaux de notes",
      Subtitle: "Ajoute des fonctionnalité visuel et pratique à votre tableau de notes",
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
      ID: "close",
      Title: "Fermer",
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
      Subtitle: "Permet le fonctionnement des focntionnalitées ci-dessous",
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
      Subtitle: "Force l’affichage des moyennes par matières et les recalcules",
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
      Default: "none",
      option: "AveragesColorIndicator",
      Title: "Forcer l’affichage de la moyenne générale",
      Subtitle: "Forcer l’affichage des moyennes par matières",
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
      Default: "none",
      option: "AveragesInfluenceTooltips",
      Title: "Info-bulles indiquent l’influence des moyennes par matières",
      Subtitle: "Info-bulles qui affiche combien de point cette moyenne fait perdre/gagner à la moyenne générale",
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
      Subtitle: "Rend les couleurs de fond de la barre latéral plus sombre, pour une meilleur lisibilité",
      reloadingRequired: false,
      lock: "newSidebar",
    },
    {
      Group: "sidebar",
      Type: "Switch",
      Value: null,
      Default: false,
      option: "pinnedSidebar",
      Title: "Laisser la barre latérale ouverte en continue",
      Subtitle: "Permet que la barre latérale ne ce minimise pas quand elle n’est plus survolé par la souris",
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
      Subtitle: "Si cette option est activé vous devez uiliser le bouton de la barre latérale pour accéder à ce menu",
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
            Img: "svg/AveragesColorIndicator/1.svg",
          },
          {
            Title: "Icon & Texte",
            Selection: "iconAndText",
            Img: "svg/AveragesColorIndicator/2.svg",
          },
        ],
        [
          {
            Title: "Bordure",
            Selection: "border",
            Img: "svg/AveragesColorIndicator/3.svg",
          },
          {
            Title: "Ile",
            Selection: "ile",
            Img: "svg/AveragesColorIndicator/4.svg",
          },
        ],
      ],
      Value: null,
      Default: ["iconAndText", "ile"],
      option: "customizationButton",
      Title: "Style du bouton de personnalisation",
      Subtitle: "Changer le style du bouton de personnalisation pour vous correspondre au mieuxs",
      reloadingRequired: false,
      lock: false,
    },
    {
      Group: "customizations",
      Type: "Switch",
      Value: null,
      Default: true,
      option: "customization",
      Title: "Activer l’analyse du tableau de note",
      Subtitle: "Permet à l'extension de préparer le site au option de personnalisation",
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
        "<input type='range' value='0' class='colorSlider'>",
        "<div class='colorSimulation' style='background-color: var(--colorSimulation-6);'></div>",
        "<div class='colorSimulation' style='background-color: var(--colorSimulation-5);'></div>",
        "<div class='colorSimulation' style='background-color: var(--colorSimulation-4);'></div>",
        "<div class='colorSimulation' style='background-color: var(--colorSimulation-3);'></div>",
        "<div class='colorSimulation' style='background-color: var(--colorSimulation-2);'></div>",
        "<div class='colorSimulation' style='background-color: var(--colorSimulation-1);'></div>",
      ],
      Value: null,
      Default: false,
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
      Title: "Angles des coins",
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
  ],
};

chrome.runtime.onInstalled.addListener((reason) => {
  if (reason.reason === chrome.runtime.OnInstalledReason.INSTALL) {
    chrome.storage.sync.set(defaultOptions);
  } else {
    chrome.storage.sync.get(function (data) {
      newOptions = {};
      newOptions.groups = defaultOptions.groups;
      newOptions.options = defaultOptions.options;

      for (let option of newOptions.options) {
        optionFound = data.options.find((o) => o.option == option.option);

        if (optionFound != undefined && optionFound.Value != null) {
          // option registered
          if (optionFound.Options != undefined && option.Options != undefined) {
            // option type Selection

            if (option.Options.map((x) => x.Selection).includes(optionFound.Value)) {
              option.Value = optionFound.Value;
            }
          } else if (optionFound.MultiOptions != undefined && option.MultiOptions != undefined) {
            // option type MultiSelection

            option.Value = [...option.Default];

            for (let i = 0; i < option.Default.length; i++) {
              if (option.MultiOptions[i].map((x) => x.Selection).includes(optionFound.Value[i])) {
                option.Value[i] = optionFound.Value[i];
              }
            }
          } else {
            //  option type Switch

            if ((option.Default == true || option.Default == false) && (optionFound.Value == true || optionFound.Value == false)) {
              option.Value = optionFound.Value;
            }
          }
        }
      }

      chrome.storage.sync.set(newOptions);
    });
  }
});
