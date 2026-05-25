log.script("SETTINGS.JS");

/**
 * @fileOverview Gestion des paramètres de l'extension.
 * @author Bastian NOEL
 */

/* █ █ █▀▀ █▀█ █▀ █ █▀█ █▄ █ */
/* ▀▄▀ ██▄ █▀▄ ▄█ █ █▄█ █ ▀█ */

/**
 * Valeurs extraites de la version de l'extension.
 * @type {number} combined - Version combinée majeure et mineure "MajorMinor" (Major * 10 + Minor).
 * @type {number} patch - Numéro de patch.
 * @type {number} stageCode - L'étape de développement de l'extension (alpha, beta, release candidate, stable).
 */
const [combined, patch, stageCode] = browserVersion.split(".").map(Number);

/**
 * @constant {Object} versionInfo - Informations sur la version de l'extension.
 * @property {number} major - La version majeure.
 * @property {number} minor - La version mineure.
 * @property {number} patch - Le numéro de patch.
 * @property {string} stage - L'étape de développement de l'extension (alpha, beta, release candidate, stable).
 */
const versionInfo = {
  major: combined >= 10 ? Math.floor(combined / 10) : 0,
  minor: combined >= 10 ? combined % 10 : combined,
  patch: patch,
  stage: { 0: "alpha", 1: "beta", 2: "release candidate", 3: "stable" }[stageCode] || "stable",
};

/* █ █ █▀█ █▀▄ ▄▀█ ▀█▀ █▀▀ */
/* █▄█ █▀▀ █▄▀ █▀█  █  ██▄ */

/**
 * Fonctions de mise à jour des paramètres.
 * @namespace Updates
 * @example
 * // Retourne les paramètres ('settings') mis à jour de la version 0 à la version 1
 * Updates[1][0](settings);
 */
var Updates = {
  1: {
    // Met à jour les paramètres de la version 0 à la version 1
    0: function (settings) {
      log.warn("SETTINGS", `Migration des paramètres : version 0 → version 1 (${Date.now()})`);  
      return {};
    },
  },
  2: {
    // Met à jour les paramètres de la version 1 à la version 2
    1: function (settings) {
      log.warn("SETTINGS", `Migration des paramètres : version 1 → version 2 (${Date.now()})`);  
      return {};
    },
    // Met à jour les paramètres de la version 0 à la version 2
    0: function (settings) {
      log.warn("SETTINGS", `Migration des paramètres : version 0 → version 2 (${Date.now()})`);  
      return {};
    },
  },
};

/* █▀ █▀▀ ▀█▀ ▀█▀ █ █▄ █ █▀▀ █▀ */
/* ▄█ ██▄  █   █  █ █ ▀█ █▄█ ▄█ */

/**
 * Objet permettant de gérer les paramètres de l'extension.
 * @namespace Settings
 * @property {number} version La version des paramètres.
 * @property {Object} stored Les paramètres de l'extension.
 * @property {function} storageSet Enregistre les paramètres de l'extension.
 * @property {function} updateSettings Vérifie si une mise à jour est nécessaire et l'applique.
 * @property {function} storageGet Récupère les paramètres de l'extension.
 */
var Settings = {
  version: 2,
  stored: {},

  /**
   * Enregistre les paramètres de l'extension.
   * @function
   * @description Enregistre les paramètres du script actuel dans le stockage du navigateur.
   */
  async storageSet() {
    // Enregistre les nouveaux paramètres
    try {
      await browserStorage.set({ settings: this.stored, version: this.version });
    } catch (error) {
      log.error("SETTINGS", `Erreur lors de l'enregistrement des paramètres : ${error}`);
    }
  },

  /**
   * Vérifie si une mise à jour est nécessaire et l'applique.
   * @function
   * @param {Object} result - L'objet contenant les paramètres de l'extension.
   */
  async updateSettings(result) {
    try {
      if (this.version == result.version) return;
      // Applique les mises à jour nécessaires
      let current = this.version;
      while (result.version < this.version) {
        if (Updates[current]?.[result.version] != undefined) {
          result.settings = Updates[current][result.version](result.settings);
          result.version = current;
          current = this.version;
        } else current--;
      }
      this.stored = result.settings;
      // Vide le stockage
      await browserStorage.clear();
      await this.storageSet();
    } catch (error) {
      log.error("SETTINGS", `Erreur lors de la mise à jour des paramètres : ${error}`);
    }
  },

  /**
   * Récupère les paramètres de l'extension.
   * @function
   * @returns {Object} Les paramètres de l'extension.
   */
  async storageGet() {
    try {
      var result = await browserStorage.get();
      // Si la version est la même, on récupère les paramètres
      if (result.version == this.version) this.stored = result.settings;
      else {
        // Si la version n'est pas définie, definit la version à 0
        if (result.version == undefined) result = { settings: result, version: 0 };
        // Met à jour les paramètres
        await this.updateSettings(result);
      }
    } catch (error) {
      log.error("SETTINGS", `Erreur lors de la récupération des paramètres : ${error}`);

    }
  },
};

/* █▀█ ▄▀█ █▀█ ▄▀█ █▀▄▀█ █▀▀ ▀█▀ █▀▀ █▀█ █▀ */
/* █▀▀ █▀█ █▀▄ █▀█ █ ▀ █ ██▄  █  ██▄ █▀▄ ▄█ */

/**
 * Convertit une chaîne de caractères en un élément HTML.
 * @param {string} string - La chaîne de caractères à convertir.
 * @return {HTMLElement} Unn elément HTML créé à partir de la chaîne.
 */
function stringToHtml(string) {
  const html = document.createElement("div");
  html.innerHTML = string.trim();
  return html.firstChild;
}

/**
 * Classe de base pour tous ce qui est configurable.
 * @description C'est une base qui ce définit par un identifiant, une icône, un nom et une description.
 */
class Identity {
  /**
   * Crée une instance d'identité.
   * @constructor
   * @param {string} id - L'identifiant unique.
   * @param {string} icon - L'icône associée.
   * @param {string} name - Le nom .
   * @param {string} description - La description.
   */
  constructor(id, icon, name, description) {
    this.id = id;
    this.icon = icon;
    this.name = name;
    this.description = description;
  }
}

/**
 * Classe représentant un groupe de paramètres.
 * @extends Identity
 * @description Un groupe est une collection de paramètres liés entre eux.
 */
class Group extends Identity {
  /**
   * Liste des groupes existants.
   * @type {Group[]}
   */
  static groups = [];

  /**
   * Liste des groupes nécessitant un rechargement.
   * @type {Group[]}
   */
  static reloadingNeeded = [];

  /**
   * Crée une instance de groupe.
   * @constructor
   * @param {string} id - L'identifiant unique du groupe.
   * @param {string} icon - L'icône associée au groupe.
   * @param {string} name - Le nom du groupe.
   * @param {string} description - La description du groupe.
   * @param {boolean} defaultActived - Indique si le groupe est activé par défaut.
   */
  constructor(id, icon, name, description, defaultActived) {
    super(id, icon, name, description);
    this.parameters = [];
    this.defaultActived = defaultActived;
    Group.groups.push(this);
  }

  /**
   * Déterminer si le groupe doit être activé ou non.
   * @param {boolean} defaultActived - La valeur par défaut pour l'activation du groupe.
   */
  updateActived(defaultActived) {
    this.actived = typeof Settings.stored[this.id]?.actived === "boolean" ? Settings.stored[this.id]?.actived ?? defaultActived : defaultActived;
  }

  /**
   * Mettre à jour l’état du groupe.
   */
  updateValue() {
    if (this.tabElement) {
      this.tabElement.querySelector("#switch").checked = this.actived != false;
      this.tabElement.setAttribute("data-state", this.actived === true ? "enabled" : this.actived || "desabled");
    }
    if (this.homerowElement) {
      this.homerowElement.setAttribute("data-state", this.actived === true ? "enabled" : this.actived || "desabled");
    }
  }

  /**
   * Ajoute un paramètre au groupe.
   * @param {Parameter} parameter - Le paramètre à ajouter.
   */
  addParameter(parameter) {
    this.parameters.push(parameter);
  }

  /**
   * Génère la barre de navigation pour le groupe.
   * @param {HTMLElement} navbar - L'élément de la barre de navigation où le groupe sera ajouté.
   */
  genNavbar(navbar) {
    const selected = false;
    const icon = this.icon;
    const content = this.name;

    this.navbarElement = stringToHtml(`
    <li data-selected="${selected}" class="transition-all duration-150 ease-in-out cursor-pointer group/li flex items-center rounded-[5px] bg-none data-[selected=true]:bg-custom-pink-transp py-1 px-2">
    <img class="h-[26px] filter-mainColor pr-2" src="./svg/icons/${icon}.svg" />
    <span class="text-[18px] transition-all duration-150 ease-in-out font-medium text-text group-data-[selected=true]/li:text-text-pink group-hover/li:text-text-pink">${content}</span>
    </li>
    `);

    navbar.appendChild(this.navbarElement);
  }

  /**
   * Génère la ligne dans la page d'accueil pour le groupe.
   * @param {HTMLElement} main - L'élément principal où la ligne sera ajoutée.
   */
  genHomeRow(main) {
    const state = this.actived === true ? "enabled" : this.actived || "desabled";
    const icon = this.icon;
    const title = this.name;
    const description = this.description;

    this.homerowElement = stringToHtml(`
    <div data-state="${state}" class="transition-all duration-150 ease-in-out group/home cursor-pointer rounded-[18px] flex flex-none w-full border border-solid border-custom-gray-verydark-transp bg-custom-white data-[state=desabled]:bg-custom-white-dark p-3 shadow-lg">
      <div class="flex w-full gap-5">
        <div class="flex flex-col flex-1">
          <div class="gap-[18px] flex items-center self-stretch">
            <img src="./svg/icons/state/enabled.svg" class="h-[22px] hidden group-data-[state=enabled]/home:block">
            <img src="./svg/icons/state/desabled.svg" class="h-[22px] hidden group-data-[state=desabled]/home:block">
            <img src="./svg/icons/state/action.svg" class="h-[22px] hidden group-data-[state=action]/home:block">
            <h2 class="text-[22px] font-semibold text-text">
            ${title}
            </h2>
          </div>
          <p class="text-[16px] ml-10 font-medium text-text-light">
            ${description}
          </p>
        </div>
        <div class="gap-[26px] flex items-center">
          <img src="./svg/icons/next.svg" class="h-[26px] filter-white-on-dark">
          <img src="./svg/icons/${icon}.svg" class="mr-1.5 h-[50px] filter-mainColor">
        </div>
      </div>
    </div>
    `);

    main.appendChild(this.homerowElement);
  }

  /**
   * Génère l'onglet de paramètres pour le groupe.
   * @param {HTMLElement} setting - L'élément de paramètres où le groupe sera ajouté.
   */
  genTab(setting) {
    const state = this.actived === true ? "enabled" : this.actived || "desabled";
    const icon = this.icon;
    const title = this.name;
    const description = this.description;
    const id = this.id;

    this.tabElement = stringToHtml(`
      <div data-state="${state}" data-show="false" class="group/setting flex data-[show=false]:hidden rounded-[18px] my-6 mx-[38px] flex-col flex-none border border-solid border-custom-gray-verydark-transp bg-custom-white p-3 shadow-lg">

        <!-- header -->
        <div class="flex flex-row justify-between w-full p-2">
          <!-- left side -->
          <div class="flex flex-row">
            <!-- icon area -->
            <div class="">
              <div class="flex rounded-full bg-custom-pink-transp h-[38px] w-[38px] items-center justify-center">
                <img src="./svg/icons/${icon}.svg" class="h-[24px] filter-mainColor">
              </div>
            </div>
            <!-- text area -->
            <div class="flex flex-col ml-5">
              <h2 class="text-[22px] font-semibold text-text">
                ${title}
              </h2>
              <p class="text-[16px] font-medium text-text-light">
                ${description}
              </p>
            </div>
          </div>
          <!-- right side -->
          <div class="flex flex-row items-center group-data-[state=action]/setting:hidden">
            <!-- Reload -->
            <div id="needReload" class="flex items-center justify-center w-8 h-8 mr-4 rounded-full bg-custom-pink-transp">
              <img src="./svg/icons/needreload.svg" class="h-3.5 filter-mainColor">
            </div>
            <!-- Switch -->
            <label class="flex items-center cursor-pointer select-none ">
              <div class="relative">
                <input id="switch" type="checkbox" class="sr-only peer" />
                <div class="block h-8 rounded-full border-[1.5px] bg-switch-off border-switch-stroke peer-checked:bg-switch-main peer-checked:border-switch-stroke w-14"></div>
                <div class="absolute flex items-center justify-center w-6 h-6 transition border-\[1\.5px\] rounded-full group bg-switch-circle border-switch-circle-stroke left-1 top-1 peer-checked:translate-x-full">
                  <span class="transition-all duration-[10ms] ease-in absolute text-switch-off peer-checked:group-[]:invisible">
                    <svg class="w-4 h-4 stroke-current" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                  </span>
                  <span class="transition-all duration-[10ms] ease-in absolute text-switch-main invisible peer-checked:group-[]:visible">
                    <svg class="w-4 h-4 fill-current stroke-current" width="11" height="8" viewBox="0 0 11 8" xmlns="http://www.w3.org/2000/svg">
                      <path d="M10.0915 0.951972L10.0867 0.946075L10.0813 0.940568C9.90076 0.753564 9.61034 0.753146 9.42927 0.939309L4.16201 6.22962L1.58507 3.63469C1.40401 3.44841 1.11351 3.44879 0.932892 3.63584C0.755703 3.81933 0.755703 4.10875 0.932892 4.29224L0.932878 4.29225L0.934851 4.29424L3.58046 6.95832C3.73676 7.11955 3.94983 7.2 4.1473 7.2C4.36196 7.2 4.55963 7.11773 4.71406 6.9584L10.0468 1.60234C10.2436 1.4199 10.2421 1.1339 10.0915 0.951972ZM4.2327 6.30081L4.2317 6.2998C4.23206 6.30015 4.23237 6.30049 4.23269 6.30082L4.2327 6.30081Z" stroke-width="0.4" />
                    </svg>
                  </span>
                </div>
              </div>
            </label>
          </div>
        </div>

        <!-- Options -->
        <div id="options" class="flex flex-col w-full gap-4 my-4 group-data-[state=desabled]/setting:blur-[3px] group-data-[state=desabled]/setting:grayscale group-data-[state=desabled]/setting:pointer-events-none">

        </div>

      </div>
      `);

    setting.appendChild(this.tabElement);
    this.tabElement.querySelector("#switch").checked = this.actived != false;

    this.tabElement.querySelector("#switch").addEventListener("change", (event) => {
      Settings.stored[id].actived = event.currentTarget.checked;
      Settings.storageSet();
    });
  }

  /**
   * Génère l'interface utilisateur pour tous les groupes et paramètres.
   */
  static genInterface() {
    log.info("UI", `Génération de l'interface — ${Group.groups.length} groupe(s)`);
    try {
      const thanks = ["⭐ Viktorabe", "Alerymin", "Mattia P.", "S1w2a3", "Leo539", "Fefedu973", "JULES2011", "TimotheeMM", "TapsHTS", "DarkEarth", "Soleil", "Taps", "Codealuxz", "Sanchaton"];
      const randomize = (items) => items.sort(() => Math.random() - 0.5);
      const starredThanks = randomize(thanks.filter((name) => name.startsWith("⭐")));
      const regularThanks = randomize(thanks.filter((name) => !name.startsWith("⭐")));
      thanks.splice(0, thanks.length, ...starredThanks, ...regularThanks);

      // Reprend le dernier onglet ouvert
      function groupById(id) {
        return Group.groups.find((group) => group.id === id);
      }

      // Version
      const versionElement = document.getElementById("version");
      if (versionElement) {
        versionElement.innerText = `V${versionInfo.major} | ${versionInfo.minor}.${versionInfo.patch}` + (versionInfo.stage !== "stable" ? ` | ${versionInfo.stage.toUpperCase()}` : "");
      }

      // Navbar + HomeRow + Tab
      for (const group of Group.groups) {
        document.getElementById("thanks").innerText = thanks.map((name, index) => (index % 4 === 3 ? name + "\n" : name + " - ")).join(" ");
        group.genNavbar(document.getElementById("navbar"));
        group.genHomeRow(document.getElementById("main"));
        group.genTab(document.getElementById("setting"));
        log.debug("UI", `Groupe "${group.id}" — navbar+homerow+tab générés`);
        // Genere les parametres
        for (const parameter of group.parameters) {
          parameter.genParameter(group.tabElement);
          log.debug("UI", `  └ Paramètre "${parameter.id}" (${parameter.type}) rendu`);
        }
      }

      // HideSettings
      function hideSettings() {
        sessionStorage.setItem("tab", "home");
        for (const group of Group.groups) {
          group.navbarElement.setAttribute("data-selected", "false");
          group.tabElement.setAttribute("data-show", "false");
        }
      }

      // ShowSettings
      function showSetting(group) {
        hideSettings();
        sessionStorage.setItem("tab", group.id);
        group.navbarElement.setAttribute("data-selected", "true");
        group.tabElement.setAttribute("data-show", "true");
        document.getElementById("body").setAttribute("data-tab", "setting");
      }

      // Event listener for the navbar
      for (const group of Group.groups) {
        group.navbarElement.addEventListener("click", () => showSetting(group));
        group.homerowElement.addEventListener("click", () => showSetting(group));
      }

      // HomeButtons
      const HomeButtons = {
        return: {
          element: document.getElementById("returnButton"),
          action: function () {
            const needReload = this.getAttribute("data-needreload") === "true";
            window.parent.postMessage(needReload ? "reload" : "close", "*");
          },
        },
        title: {
          element: document.getElementById("title"),
          action: function () {
            hideSettings();
            document.getElementById("body").setAttribute("data-tab", "home");
          },
        },
        stars: {
          element: document.getElementById("starsButton"),
          action: function () {
            window.open("https://chromewebstore.google.com/detail/customdirecte/ngibpoegkheookihjcnjihkfhfnglfei/reviews", "_blank");
          },
        },
        github: {
          element: document.getElementById("githubButton"),
          action: function () {
            window.open("https://github.com/CustomDirecte/CustomDirecte", "_blank");
          },
        },
      };

      // Ecoute les événements pour les boutons de la page d'accueil
      for (const button of Object.values(HomeButtons)) {
        button.element.addEventListener("click", button.action);
      }

      // Quand un message est reçu du parent
      window.addEventListener("message", (event) => {
        if (event.data === "closed") document.querySelector("#returnButton")?.click();
      });
      document.addEventListener("keydown", (e) => {
        if (e.key == "Escape") document.querySelector("#returnButton")?.click();
      });

      // Retourne au dernier onglet ouvert
      const lastTab = sessionStorage.getItem("tab");
      log.debug("UI", `Dernier onglet : ${lastTab ?? "aucun"} — restauration${lastTab ? " en cours" : " ignorée"}`);
      if (lastTab) {
        document.getElementById("body").setAttribute("data-tab", lastTab === "home" ? "home" : "setting");
        if (lastTab !== "home") {
          if (groupById(lastTab)) showSetting(groupById(lastTab));
        }
      }

      // Tooltip pour le bouton de retour
      try {
        const reloadTooltip = stringToHtml(`
      <div style="font-size: 16px;"> Nécessite de rafraîchir la page ! </div>
    `);
        document.querySelectorAll("#needReload").forEach((element) => {
          tippy(element, { placement: "left", allowHTML: true, content: reloadTooltip.cloneNode(true), appendTo: () => document.querySelector(".tippyParent") });
        });
      } catch (error) {
        log.error("UI", `Erreur lors de la création de tooltips : ${error}`);
      }
      log.info("UI", "Interface générée avec succès");
    } catch (error) {
      log.error("UI", `Erreur lors de la génération de l'interface : ${error}`);
    }
  }

  /**
   * Genère les paramètres de l'extension : recuperation, initialisation et changement des paramètres.
   */
  static async genSettings() {
    log.info("SETTINGS", `Initialisation — ${Group.groups.length} groupe(s) déclaré(s)`);
    // Récupérer les paramètres stockés
    log.debug("SETTINGS", "Récupération du storage...");
    await Settings.storageGet();
    log.debug("SETTINGS", "Storage récupéré");

    // Si les paramètres ne sont pas définis, on les initialise
    const stored = {};

    // Pour chaque groupe, mettre à jour l'état activé et les paramètres par défaut
    for (const group of Group.groups) {
      group.updateActived(group.defaultActived);
      stored[group.id] = {
        actived: group.actived,
        parameters: {},
      };
      log.debug("SETTINGS", `Groupe "${group.id}" — actived=${group.actived}, ${group.parameters.length} param(s)`);
      for (const parameter of group.parameters) {
        parameter.importValue(parameter.defaultValue, parameter.options ?? undefined);
        stored[group.id].parameters[parameter.id] = parameter.value;
        log.debug("SETTINGS", `  └ "${parameter.id}" (${parameter.type}) = ${JSON.stringify(parameter.value)}`);
      }
    }

    // Mettre à jour les paramètres stockés
    Settings.stored = stored;
    log.debug("SETTINGS", "Écriture dans le storage...");
    await Settings.storageSet();
    log.info("SETTINGS", "Paramètres initialisés et sauvegardés");

    browserStorageOnChanged.addListener((changes) => {
      const oldSettings = changes["settings"].oldValue;
      const newSettings = changes["settings"].newValue;

      log.debug("SETTINGS", "Changement storage détecté — traitement...");
      // Pour chaque groupe, vérifier si les paramètres ont été modifiés
      Group.groups.forEach((group) => {
        const groupSettings = newSettings[group.id];
        const oldGroupSettings = oldSettings[group.id];

        // Verifier si le groupe a été modifié
        if (groupSettings.actived != oldGroupSettings.actived && typeof groupSettings.actived === "boolean") {
          log.debug("SETTINGS", `Groupe "${group.id}" actived : ${oldGroupSettings.actived} → ${groupSettings.actived}`);
          log.settingUpdate(group.id, oldGroupSettings.actived, groupSettings.actived, "Groupe");
          Settings.stored[group.id].actived = groupSettings.actived;
          group.updateActived(group.actived);
          group.updateValue();
          // Mettre à jour l'état de l'interface si la page a besion de recharger
          if (typeof document !== "undefined") {
            var returnButton = document.getElementById("returnButton");
            if (!returnButton) return;
            // Si le paramètre est dans la liste des paramètres à recharger, on le retire, sinon on l'ajoute
            if (Group.reloadingNeeded.includes(group.id)) Group.reloadingNeeded = Group.reloadingNeeded.filter((id) => id !== group.id);
            else Group.reloadingNeeded.push(group.id);
            // Mettre à jour le bouton de retour
            if (Group.reloadingNeeded.length > 0) returnButton.setAttribute("data-needreload", "true");
            else returnButton.setAttribute("data-needreload", "false");
          }
        }

        // Verifier si les paramètres du groupe ont été modifiés
        for (const parameter of group.parameters) {
          const parameterId = parameter.id;
          const parameterSettings = groupSettings.parameters[parameterId];
          const oldParameterSettings = oldGroupSettings.parameters[parameterId];

          // Si le paramètre a été modifié
          if (parameterSettings != oldParameterSettings) {
            // Si le paramètre n'a pas été modifié, on ne fait rien
            if (Array.isArray(parameterSettings) && Array.isArray(oldParameterSettings) && parameterSettings.length == oldParameterSettings.length && parameterSettings.every((value, index) => value === oldParameterSettings[index])) return;
            // Afficher un message de log
            if (parameter.type === "button") { if (parameterSettings > 0) log.settingAction(parameterId); }
            else log.settingUpdate(parameterId, oldParameterSettings, parameterSettings, "Paramettre");
            // Mettre à jour le paramètre dans les paramètres stockés
            Settings.stored[group.id].parameters[parameterId] = parameterSettings;
            // Mettre à jour le paramètre dans la classe
            parameter.importValue(parameter.value, parameter.options ?? undefined);
            // Mettre à jour la valeur du paramètre dans l'interface
            if (parameter.htmlElement != undefined) parameter.updateValue();
            // Mettre à jour l'état de l'interface si la page a besion de recharger
            if (typeof document !== "undefined" && parameter.reloadingRequired) {
              var returnButton = document.getElementById("returnButton");
              if (!returnButton) return;
              // Si le paramètre est dans la liste des paramètres à recharger, on le retire, sinon on l'ajoute
              if (Group.reloadingNeeded.includes(parameter.id)) Group.reloadingNeeded = Group.reloadingNeeded.filter((id) => id !== parameter.id);
              else Group.reloadingNeeded.push(parameter.id);
              // Mettre à jour le bouton de retour
              if (Group.reloadingNeeded.length > 0) returnButton.setAttribute("data-needreload", "true");
              else returnButton.setAttribute("data-needreload", "false");
            }
          }
        }
      });

      // Réapplique les dépendances entre paramètres (option "requires")
      Group.groups.forEach((group) => {
        for (const parameter of group.parameters) {
          if (parameter.requires) parameter.applyDependencyState();
        }
      });
    });
  }
}

/**
 * Représente un groupe d'actions : un groupe spécial qui ne peut pas être désactivé.
 * @extends Group
 */
class ActionGroup extends Group {
  /**
   * Crée une instance de ActionGroup.
   * @constructor
   * @param {string} id - L'identifiant unique du groupe d'actions.
   * @param {string} icon - L'icône associée au groupe d'actions.
   * @param {string} name - Le nom du groupe d'actions.
   * @param {string} description - La description du groupe d'actions.
   */
  constructor(id, icon, name, description) {
    super(id, icon, name, description, true);
  }

  updateActived(defaultActived) {
    this.actived = "action";
  }
}

/**
 * Classe représentant un paramètre configurable.
 * @extends Identity
 * @description Un paramètre est une option configurable appartenant à un groupe.
 */
class Parameter extends Identity {
  /**
   * Crée une instance de paramètre.
   * @constructor
   * @param {Group} group - Le groupe auquel le paramètre appartient.
   * @param {string} id - L'identifiant unique du paramètre.
   * @param {string} icon - L'icône associée au paramètre.
   * @param {string} name - Le nom du paramètre.
   * @param {string} description - La description du paramètre.
   * @param {string} type - Le type de paramètre (ex: "switch", "button").
   * @param {*} defaultValue - La valeur par défaut du paramètre.
   * @param {boolean} reloadingRequired - Indique si un rechargement est nécessaire après la modification du paramètre.
   * @param {string|boolean} warning - Un avertissement à afficher si nécessaire.
   * @param {string|boolean} requires - Identifiant d'un autre paramètre du même groupe qui doit être activé pour que celui-ci le soit.
   */
  constructor(group, id, icon, name, description, type, defaultValue, reloadingRequired = false, warning = false, requires = false) {
    super(id, icon, name, description);
    this.group = group;
    group.addParameter(this);
    this.type = type;
    this.reloadingRequired = reloadingRequired;
    this.warning = warning;
    this.defaultValue = defaultValue;
    this.requires = requires;
  }

  /**
   * Applique l'état de dépendance d'un paramètre lié à un autre (option "requires").
   * Si le paramètre parent est désactivé, ce paramètre est forcé à false et verrouillé dans l'UI.
   */
  applyDependencyState() {
    if (!this.requires) return;
    const parent = this.group.parameters.find((parameter) => parameter.id === this.requires);
    if (!parent) return;
    const parentOn = parent.value != false;

    // Force la valeur à false tant que le parent est désactivé
    if (!parentOn && this.value != false) {
      this.value = false;
      this.exportValue(false);
    }

    // Verrouille / déverrouille l'UI (uniquement dans le popup)
    if (this.htmlElement) {
      const input = this.htmlElement.querySelector("#switch");
      if (input) input.disabled = !parentOn;
      this.htmlElement.style.opacity = parentOn ? "" : "0.5";
      this.htmlElement.style.pointerEvents = parentOn ? "" : "none";
      this.htmlElement.setAttribute("data-locked", parentOn ? "false" : "true");
    }
  }

  /**
   * Importe la valeur du paramètre depuis les paramètres stockés.
   * @param {*} defaultValue - La valeur par défaut du paramètre.
   */
  importValue(defaultValue) {
    this.value = defaultValue;
  }

  /**
   * Exporte la nouvelle valeur du paramètre vers les paramètres stockés.
   * @param {*} newValue - La nouvelle valeur du paramètre.
   */
  async exportValue(newValue) {
    Settings.stored[this.group.id].parameters[this.id] = newValue;
    await Settings.storageSet();
  }

  /**
   * Met à jour l'élément HTML du paramètre en fonction de sa valeur.
   */
  updateValue() {
    this.htmlElement.setAttribute("data-actived", this.value != false ? "enabled" : "desabled");
  }

  /**
   * Génère le selecteur de paramètre spécifique au type de paramètre.
   * @param {HTMLElement} htmlElement - L'élément HTML du paramètre.
   */
  genParameterParticularity(htmlElement) {
    return;
  }

  /**
   * Crée les écouteurs d'événements qui ecouteront les changements de valeur du paramètre.
   * @param {HTMLElement} htmlElement - L'élément HTML du paramètre.
   * @param {*} particularity - Les particularités spécifiques au type de paramètre.
   */
  createEventListener(htmlElement, particularity) {
    return;
  }

  /**
   * Génère l'élément HTML du paramètre et l'ajoute à l'onglet du groupe.
   * @param {HTMLElement} groupTab - L'élément HTML de l'onglet du groupe.
   */
  genParameter(groupTab) {
    const icon = this.icon;
    const title = this.name;
    const description = this.description;
    const reloadingRequired = this.reloadingRequired;
    const actived = this.value != false ? "enabled" : "desabled";
    const warning = this.warning;
    const needWarning = this.warning ? "true" : "false";
    const type = this.type;

    this.htmlElement = stringToHtml(`
      <div data-actived="${actived}" data-warning="${needWarning}" data-type="${type}" class="group/option data-[actived=desabled]:grayscale p-[7.5px] m-2 mb-0 border shadow-lg bg-transparent data-[actived=enabled]:bg-custom-pink-ulttransp rounded-xl border-solid border-custom-gray-verydark-transp data-[actived=enabled]:border-custom-pink">
        <div class="flex flex-row items-center w-full">
          <div class="w-6 h-6 mx-4">
            <img src="./svg/icons/${icon}.svg" class="filter-mainColor">
          </div>
          <div class="flex-1 text-xl font-semibold text-text">${title}</div>
          <!-- Info -->
          <div id="description" class="flex items-center justify-center w-8 h-8 mr-2 text-center rounded-full bg-custom-pink-transp">
            <div class="flex-1 text-xl font-semibold text-custom-pink">?</div>
          </div>
          <!-- Reload -->
          <div id="needReload" class="${reloadingRequired ? "flex" : "hidden"} items-center justify-center w-8 h-8 mr-2 rounded-full bg-custom-pink-transp">
            <img src="./svg/icons/needreload.svg" class="h-3.5 filter-mainColor">
          </div>
          <!-- Switch -->
          <label class="items-center mr-4 cursor-pointer select-none hidden group-data-[type=switch]/option:flex">
            <div class="relative">
              <input id="switch" type="checkbox" class="sr-only peer" />
              <div class="block h-8 rounded-full border-[1.5px] bg-switch-off border-switch-stroke peer-checked:bg-custom-pink peer-checked:border-switch-stroke w-14"></div>
              <div class="absolute flex items-center justify-center w-6 h-6 transition border-\[1\.5px\] rounded-full group bg-switch-circle border-switch-circle-stroke left-1 top-1 peer-checked:translate-x-full"></div>
            </div>
          </label>
          <!-- Button -->
          <button class="hidden group-data-[type=button]/option:flex transition-all duration-150 ease-in-out group/button cursor-pointer ml-1 px-2 py-1 hover:bg-custom-pink-transp active:bg-custom-pink flex-none rounded-lg focus:outline-none focus:ring-4 focus:ring-custom-pink-transp border border-solid border-custom-gray-verydark-transp shadow-xl items-center">
            <p class="text-[18px] font-medium text-text group-active/button:text-text-white-full">${title}</p>
          </button>
        </div>
        <div class="flex flex-row items-center w-full">
          <div class="w-6 mx-4">
          </div>
          <div class="flex-1 text-base font-medium text-custom-pink hidden group-data-[warning=true]/option:block">${warning}</div>
        </div>
      </div>
    `);

    groupTab.querySelector("#options").appendChild(this.htmlElement);
    this.htmlElement.querySelector("#switch").checked = this.value != false;

    const particularity = this.genParameterParticularity(this.htmlElement) ?? undefined;
    this.createEventListener(this.htmlElement, particularity);

    // Tooltip
    const descriptionTooltip = stringToHtml(`
      <div style="font-size: 16px;"> ${description} </div>
      `);
    tippy(this.htmlElement.querySelector("#description"), { placement: "left", allowHTML: true, content: descriptionTooltip, appendTo: () => document.querySelector(".tippyParent") });

    // Verrouille le paramètre si sa dépendance n'est pas satisfaite
    if (this.requires) this.applyDependencyState();
  }
}

/**
 * Représente un paramètre de type interrupteur (switch).
 * @extends Parameter
 * @description Un interrupteur permet d'activer ou de désactiver une fonctionnalité.
 */
class Switch extends Parameter {
  constructor(group, id, icon, name, description, defaultValue = true, reloadingRequired = false, warning = false, requires = false) {
    super(group, id, icon, name, description, "switch", defaultValue, reloadingRequired, warning, requires);
  }

  importValue(defaultValue) {
    this.value = typeof Settings.stored[this.group.id]?.parameters[this.id] === "boolean" ? Settings.stored[this.group.id].parameters[this.id] : defaultValue;
  }

  updateValue() {
    this.htmlElement.setAttribute("data-actived", this.value != false ? "enabled" : "desabled");
    this.htmlElement.querySelector("#switch").checked = this.value != false;
  }

  createEventListener(htmlElement, particularity) {
    htmlElement.querySelector("input")?.addEventListener("change", (event) => {
      var newValue = event.currentTarget.checked;
      this.exportValue(newValue);
    });
  }
}

/** Représente un paramètre de type sélecteur en ligne (row selector).
 * @extends Parameter
 * @description Un sélecteur en ligne permet de choisir une option parmi plusieurs, affichées en ligne avec des illustrations.
 */
class RowSelector extends Parameter {
  constructor(group, id, icon, name, description, defaultValue, options, reloadingRequired = false, warning = false) {
    super(group, id, icon, name, description, "rowselector", defaultValue, reloadingRequired, warning);
    this.options = options;
  }

  importValue(defaultValue, options) {
    this.value = options.map((option) => option.id).includes(Settings.stored[this.group.id]?.parameters[this.id]) ? Settings.stored[this.group.id].parameters[this.id] : defaultValue;
  }

  updateValue() {
    var activedOption = undefined;
    this.htmlElement.querySelectorAll("div[data-actived]").forEach((element) => {
      element.setAttribute("data-actived", "desabled");
      if (this.value == element.querySelector("input")?.value) activedOption = element;
    });
    if (!activedOption) return;
    activedOption.setAttribute("data-actived", "enabled");
    activedOption.querySelector("input").checked = true;
  }

  createEventListener(htmlElement, particularity) {
    if (!particularity) return;
    particularity.querySelectorAll("div[data-actived]").forEach((element) => {
      element.addEventListener("click", (event) => {
        if (event.target.tagName === "INPUT") return;
        element.querySelector("input").click();
      });
      element.querySelector("input").addEventListener("change", (event) => {
        if (event.currentTarget.checked) {
          var newValue = event.currentTarget.value;
          this.exportValue(newValue);
        }
      });
    });
  }

  genParameterParticularity(htmlElement) {
    const id = this.id;

    const particularity = stringToHtml(`
      <div class="flex flex-row items-center flex-wrap mx-[54px] my-5 gap-8">
      </div>
      `);

    // Pour chaque option avec i comme index
    for (const [i, option] of this.options.entries()) {
      const actived = this.value == option.id ? "enabled" : "desabled";

      const optionElement = stringToHtml(`
        <div data-actived="${actived}" class="cursor-pointer flex flex-col border rounded-xl border-custom-gray-verydark-transp data-[actived=enabled]:bg-custom-pink-ulttransp data-[actived=enabled]:border-custom-pink">
          <div class="flex flex-row items-center gap-4 mx-4 my-2">
            <input name="${id}" type="radio" value="${option.id}" class="w-5 h-5 transition-all duration-150 ease-in-out border-2 cursor-pointer border-custom-gray-dark text-custom-pink focus:ring-0 focus:ring-offset-0" />
            <div class="text-xl font-semibold text-text">${option.name}</div>
          </div>
          <div class="m-4 mt-0 rounded-lg bg-text-white-full">
            <img src="./svg/${id}/${i + 1}.svg">
          </div>
        </div>
      `);

      optionElement.querySelector("input").checked = this.value == option.id;
      particularity.appendChild(optionElement);
    }

    htmlElement.appendChild(particularity);
    return particularity;
  }
}

/** Représente un paramètre de type sélecteur en ligne personnalisé (custom row selector).
 * @extends Parameter
 * @description Un sélecteur en ligne personnalisé permet de choisir une option parmi plusieurs, affichées en ligne avec des styles personnalisés.
 */
class CustomSelector extends Parameter {
  constructor(group, id, icon, name, description, defaultValue, options, reloadingRequired = false, warning = false) {
    super(group, id, icon, name, description, "rowselector", defaultValue, reloadingRequired, warning);
    this.options = options;
  }

  importValue(defaultValue, options) {
    this.value = options.map((option) => option.id).includes(Settings.stored[this.group.id]?.parameters[this.id]) ? Settings.stored[this.group.id].parameters[this.id] : defaultValue;
  }

  updateValue() {
    var activedOption = undefined;
    this.htmlElement.querySelectorAll("div[data-actived]").forEach((element) => {
      element.setAttribute("data-actived", "desabled");
      if (this.value == element.querySelector("input")?.value) activedOption = element;
    });
    if (!activedOption) return;
    activedOption.setAttribute("data-actived", "enabled");
    activedOption.querySelector("input").checked = true;
  }

  createEventListener(htmlElement, particularity) {
    if (!particularity) return;
    particularity.querySelectorAll("div[data-actived]").forEach((element) => {
      element.addEventListener("click", (event) => {
        if (event.target.tagName === "INPUT") return;
        element.querySelector("input").click();
      });
      element.querySelector("input").addEventListener("change", (event) => {
        if (event.currentTarget.checked) {
          var newValue = event.currentTarget.value;
          this.exportValue(newValue);
        }
      });
    });
  }

  genParameterParticularity(htmlElement) {
    const id = this.id;

    const particularity = stringToHtml(`
      <div class="flex flex-row items-center flex-wrap mx-[54px] my-5 gap-8">
      </div>
      `);

    for (const option of this.options) {
      const actived = this.value == option.id ? "enabled" : "desabled";
      const style = option.style;

      const optionElement = stringToHtml(`
        <div style="${style.first ?? ""}" data-actived="${actived}" class="cursor-pointer flex flex-col border rounded-xl border-custom-gray-verydark-transp data-[actived=enabled]:bg-custom-pink-ulttransp data-[actived=enabled]:border-custom-pink">
          <div style="${style.seconde ?? ""}" class="flex flex-row items-center gap-4 mx-4 my-2">
            <input style="${style.input ?? ""}" name="${id}" type="radio" value="${option.id}" class="w-5 h-5 transition-all duration-150 ease-in-out border-2 cursor-pointer border-custom-gray-dark text-custom-pink focus:ring-0 focus:ring-offset-0" />
            <div style="${style.third ?? ""}" class="text-xl font-semibold text-text">${option.name}</div>
          </div>
        </div>
      `);

      optionElement.querySelector("input").checked = this.value == option.id;
      particularity.appendChild(optionElement);
    }

    htmlElement.appendChild(particularity);
    return particularity;
  }
}

/** Représente un paramètre de type sélecteur multi-lignes (multi row selector).
 * @extends Parameter
 * @description Un sélecteur multi-lignes permet de choisir une option pour chaque ligne parmi plusieurs, affichées en ligne avec des illustrations.
 */
class MultiRowSelector extends Parameter {
  constructor(group, id, icon, name, description, defaultValue, options, reloadingRequired = false, warning = false) {
    super(group, id, icon, name, description, "multirowselector", defaultValue, reloadingRequired, warning);
    this.options = options;
  }

  importValue(defaultValue, options) {
    if (Settings.stored[this.group.id]?.parameters[this.id]) {
      const storedParams = Settings.stored[this.group.id].parameters[this.id].slice(0, this.options.length);
      var isValid = true;
      var i = 0;
      for (const subOptions of options) {
        storedParams[i] ? (isValid = isValid && subOptions.map((option) => option.id).includes(storedParams[i])) : (isValid = false);
        i++;
      }
      this.value = isValid ? storedParams : defaultValue;
    } else {
      this.value = defaultValue;
    }
  }

  updateValue() {
    var activedOptions = [];
    this.htmlElement.querySelectorAll("div[data-actived]").forEach((element) => {
      element.setAttribute("data-actived", "desabled");
      if (element.querySelector("input")) if (this.value.includes(element.querySelector("input")?.value)) activedOptions.push(element);
    });
    activedOptions.forEach((element) => {
      element.setAttribute("data-actived", "enabled");
      element.querySelector("input").checked = true;
    });
  }

  createEventListener(htmlElement, allParticularity) {
    if (!allParticularity) return;
    allParticularity.forEach((element) => {
      const particularity = element[0];
      const j = element[1];
      particularity.querySelectorAll("div[data-actived]").forEach((element) => {
        element.addEventListener("click", (event) => {
          if (event.target.tagName === "INPUT") return;
          element.querySelector("input").click();
        });
        element.querySelector("input").addEventListener("change", (event) => {
          if (event.currentTarget.checked) {
            var newValue = this.value;
            newValue[j] = event.currentTarget.value;
            this.exportValue(newValue);
          }
        });
      });
    });
  }

  genParameterParticularity(htmlElement) {
    const id = this.id;
    var allParticularity = [];

    var h = 0;

    for (const [j, subOptions] of this.options.entries()) {
      const particularity = stringToHtml(`
      <div class="flex flex-row items-center flex-wrap mx-[54px] my-5 gap-8">
      </div>
      `);

      // Pour chaque option avec i comme index
      for (const [i, option] of subOptions.entries()) {
        const actived = this.value?.[j] == option.id ? "enabled" : "desabled";

        h += 1;

        const optionElement = stringToHtml(`
        <div data-actived="${actived}" class="cursor-pointer flex flex-col border rounded-xl border-custom-gray-verydark-transp data-[actived=enabled]:bg-custom-pink-ulttransp data-[actived=enabled]:border-custom-pink">
          <div class="flex flex-row items-center gap-4 mx-4 my-2">
            <input name="${id}${j}" type="radio" value="${option.id}" class="w-5 h-5 transition-all duration-150 ease-in-out border-2 cursor-pointer border-custom-gray-dark text-custom-pink focus:ring-0 focus:ring-offset-0" />
            <div class="text-xl font-semibold text-text">${option.name}</div>
          </div>
          <div class="m-4 mt-0 rounded-lg bg-text-white-full">
            <img src="./svg/${id}/${h}.svg">
          </div>
        </div>
      `);

        optionElement.querySelector("input").checked = this.value?.[j] == option.id;
        particularity.appendChild(optionElement);
      }

      htmlElement.appendChild(particularity);
      if (j != this.options.length) htmlElement.appendChild(stringToHtml(`<hr class="flex flex-row items-center mx-[54px] my-5 gap-8">`));

      allParticularity.push([particularity, j]);
    }

    return allParticularity;
  }
}

/** Représente un paramètre de type sélecteur de couleur (color selector).
 * @extends Parameter
 * @description Un sélecteur de couleur permet de choisir une couleur parmi un spectre de couleurs.
 */
class ColorSelector extends Parameter {
  constructor(group, id, icon, name, description, defaultValue, reloadingRequired = false, warning = false) {
    super(group, id, icon, name, description, "colorselector", defaultValue, reloadingRequired, warning);
  }

  importValue(defaultValue) {
    const val = Settings.stored[this.group.id]?.parameters[this.id];
    this.value = Number.isInteger(val) && val >= 0 && val <= 360 ? val : defaultValue;
  }

  updateValue() {
    const colorDiv = this.htmlElement.querySelector("div[color]");
    const colorSlider = this.htmlElement.querySelector("input[type=range]");
    if (colorDiv) colorDiv.setAttribute("color", this.value);
    if (colorSlider) colorSlider.value = this.value;
  }

  createEventListener(htmlElement, particularity) {
    if (!particularity) return;
    particularity.querySelector("input").addEventListener("change", (event) => {
      const color = Number(event.currentTarget.value);
      this.exportValue(color);
    });
  }

  genParameterParticularity(htmlElement) {
    const value = this.value;

    const particularity = stringToHtml(`
      <div color="${value}" class="optionSelection mx-[54px] my-5">
        <input type="range" value="${value}" class="colorSlider" min="0" max="360" step="1">
        <div class="colorSimulation" style="background-color: var(--colorSimulation-6);"></div>
        <div class="colorSimulation" style="background-color: var(--colorSimulation-5);"></div>
        <div class="colorSimulation" style="background-color: var(--colorSimulation-4);"></div>
        <div class="colorSimulation" style="background-color: var(--colorSimulation-3);"></div>
        <div class="colorSimulation" style="background-color: var(--colorSimulation-2);"></div>
        <div class="colorSimulation" style="background-color: var(--colorSimulation-1);"></div>
      </div>
      `);

    htmlElement.appendChild(particularity);

    particularity.querySelector("input").addEventListener("input", (event) => {
      particularity.setAttribute("color", event.currentTarget.value);
    });

    return particularity;
  }
}

/** Représente un paramètre de type bouton (button).
 * @extends Parameter
 * @description Un bouton permet d'exécuter une action lorsqu'il est cliqué.
 */
class Button extends Parameter {
  constructor(group, id, icon, name, description, warning = false) {
    super(group, id, icon, name, description, "button", 0, false, warning);
  }

  createEventListener(htmlElement) {
    htmlElement.querySelector("button").addEventListener("click", () => {
      this.exportValue(Date.now());
    });
  }
}

/* █▀▀ █▀▀ █▄ █ █▀ █▀▀ ▀█▀ ▀█▀ █ █▄ █ █▀▀ █▀ */
/* █▄█ ██▄ █ ▀█ ▄█ ██▄  █   █  █ █ ▀█ █▄█ ▄█ */

/**
 * Génère les paramètres de l'extension et gère les erreurs éventuelles.
 * @returns {Promise<void>} Une promesse qui se résout lorsque les paramètres sont générés.
 * @description Cette fonction appelle la méthode statique genSettings de la classe Group pour générer les paramètres. En cas d'erreur, elle affiche un message d'erreur dans la console.
 */
let settingsReady;
function genSettings() {
  try {
    settingsReady = Group.genSettings();
  } catch (error) {
    log.error("SETTINGS", `Erreur lors de la génération des paramètres : ${error}`);
  }
}
