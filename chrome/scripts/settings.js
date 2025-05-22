console.log("SETTINGS.JS");

/**
 * @fileOverview Gestion des paramètres de l'extension.
 * @author Bastian NOEL
 * @version 2.0
 */

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
      console.log(`Update settings from version 0 to version 1 ${Date.now()}`);
      return {};
    },
  },
  2: {
    // Met à jour les paramètres de la version 1 à la version 2
    1: function (settings) {
      console.log(`Update settings from version 1 to version 2 ${Date.now()}`);
      return {};
    },
    // Met à jour les paramètres de la version 0 à la version 2
    0: function (settings) {
      console.log(`Update settings from version 0 to version 2 ${Date.now()}`);
      return {};
    },
  },
};

/* █▀ █▀▀ ▀█▀ ▀█▀ █ █▄ █ █▀▀ █▀ */
/* ▄█ ██▄  █   █  █ █ ▀█ █▄█ ▄█ */

/**
 * Objet contenant les paramètres de l'extension.
 * @namespace Settings
 * @property {number} version La version des paramètres.
 * @property {Object} stored Les paramètres de l'extension.
 * @property {function} storageSet Enregistre les paramètres de l'extension.
 * @property {function} updateSettings Met à jour les paramètres de l'extension.
 * @property {function} storageGet Récupère les paramètres de l'extension.
 */
var Settings = {
  version: 2,
  stored: {},

  /**
   * Enregistre les paramètres de l'extension.
   */
  async storageSet() {
    // Enregistre les nouveaux paramètres
    await browserStorage.set({ settings: this.stored, version: this.version });
  },

  /**
   * Vérifie si une mise à jour est nécessaire et l'applique.
   * @param {Object} result L'objet contenant les paramètres de l'extension.
   */
  async updateSettings(result) {
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
  },

  /**
   * Récupère les paramètres de l'extension.
   * @returns {Object} Les paramètres de l'extension.
   */
  async storageGet() {
    var result = await browserStorage.get();
    // Si la version est la même, on récupère les paramètres
    if (result.version == this.version) this.stored = result.settings;
    else {
      // Si la version n'est pas définie, definit la version à 0
      if (result.version == undefined) result = { settings: result, version: 0 };
      // Met à jour les paramètres
      await this.updateSettings(result);
    }
  },
};

/* █▀█ ▄▀█ █▀█ ▄▀█ █▀▄▀█ █▀▀ ▀█▀ █▀▀ █▀█ █▀ */
/* █▀▀ █▀█ █▀▄ █▀█ █ ▀ █ ██▄  █  ██▄ █▀▄ ▄█ */

function stringToHtml(string) {
  const html = document.createElement("div");
  html.innerHTML = string.trim();
  return html.firstChild;
}

class Identity {
  constructor(id, icon, name, description) {
    this.id = id;
    this.icon = icon;
    this.name = name;
    this.description = description;
  }
}

class Group extends Identity {
  static groups = [];
  constructor(id, icon, name, description, defaultActived) {
    super(id, icon, name, description);
    this.parameters = [];
    this.defaultActived = defaultActived;
    Group.groups.push(this);
  }

  updateActived(defaultActived) {
    this.actived = typeof Settings.stored[this.id]?.actived === "boolean" ? Settings.stored[this.id]?.actived ?? defaultActived : defaultActived;
  }

  updateValue() {
    if (!this.tabElement) return;
    this.tabElement.querySelector("#switch").checked = this.actived != false;
    this.tabElement.setAttribute("data-state", this.actived === true ? "enabled" : this.actived || "desabled");
  }

  addParameter(parameter) {
    // Ajoute le parametre au groupe
    this.parameters.push(parameter);
  }

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

  static genInterface() {
    const thanks = ["Bastian NOEL", "Lorem Ipsum", "Dolor Sit", "Amet Consectetur", "Adipiscing Elit", "Sed Do", "Eiusmod Tempor", "Incididunt Ut", "Labore Et", "Dolore Magna", "Aliqua Ut", "Enim Ad", "Minim Veniam", "Quis Nostrud", "Exercitation Ullamco", "Laboris Nisi", "Ut Aliquip", "Ex Ea"];

    // Reprend le dernier onglet ouvert
    function groupById(id) {
      return Group.groups.find((group) => group.id === id);
    }

    // Navbar + HomeRow + Tab
    for (const group of Group.groups) {
      document.getElementById("thanks").innerText = thanks.map((name, index) => (index % 4 === 3 ? name + "\n" : name + " - ")).join(" ");
      group.genNavbar(document.getElementById("navbar"));
      group.genHomeRow(document.getElementById("main"));
      group.genTab(document.getElementById("setting"));
      // Genere les parametres
      for (const parameter of group.parameters) {
        parameter.genParameter(group.tabElement);
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
        action: function () {},
        setReload: function () {
          this.setAttribute("data-needreload", "true");
        },
        setReturn: function () {
          this.setAttribute("data-needreload", "false");
        },
      },
      return: {
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

    // Event listener for the HomeButtons
    for (const button of Object.values(HomeButtons)) {
      button.element.addEventListener("click", button.action);
    }

    // Reprend le dernier onglet ouvert
    const lastTab = sessionStorage.getItem("tab");
    if (lastTab) {
      document.getElementById("body").setAttribute("data-tab", lastTab === "home" ? "home" : "setting");
      if (lastTab !== "home") {
        if (groupById(lastTab)) showSetting(groupById(lastTab));
      }
    }

    // Reload tooltip
    const reloadTooltip = stringToHtml(`
      <div style="font-size: 16px;"> Nécessite de rafraîchir la page ! </div>
    `);
    document.querySelectorAll("#needReload").forEach((element) => {
      tippy(element, { placement: "left", allowHTML: true, content: reloadTooltip.cloneNode(true) });
    });
  }

  static async genSettings() {
    // Get the stored settings
    await Settings.storageGet();

    // Create a new object to store the settings
    const stored = {};

    // For each group, store the actived state and the parameters
    for (const group of Group.groups) {
      group.updateActived(group.defaultActived);
      stored[group.id] = {
        actived: group.actived,
        parameters: {},
      };
      for (const parameter of group.parameters) {
        parameter.importValue(parameter.defaultValue, parameter.options ?? undefined);
        stored[group.id].parameters[parameter.id] = parameter.value;
      }
    }

    // Update the stored settings
    Settings.stored = stored;
    await Settings.storageSet();

    browserStorageOnChanged.addListener((changes) => {
      const oldSettings = changes["settings"].oldValue;
      const newSettings = changes["settings"].newValue;

      // for every group in settings and for every parameter in group
      Group.groups.forEach((group) => {
        const groupSettings = newSettings[group.id];
        const oldGroupSettings = oldSettings[group.id];

        // Check if the group is actived
        if (groupSettings.actived != oldGroupSettings.actived && typeof groupSettings.actived === "boolean") {
          Settings.stored[group.id].actived = groupSettings.actived;
          group.updateActived(group.actived);
          group.updateValue();
        }

        // Check if the parameters are actived
        for (const parameter of group.parameters) {
          const parameterId = parameter.id;
          const parameterSettings = groupSettings.parameters[parameterId];
          const oldParameterSettings = oldGroupSettings.parameters[parameterId];

          if (parameterSettings != oldParameterSettings) {
            if (Array.isArray(parameterSettings) && Array.isArray(oldParameterSettings) && parameterSettings.length == oldParameterSettings.length && parameterSettings.every((value, index) => value === oldParameterSettings[index])) return;
            console.log(`Parameter ${parameterId} updated from ${oldParameterSettings} to ${parameterSettings}`);
            Settings.stored[group.id].parameters[parameterId] = parameterSettings;
            parameter.importValue(parameter.value, parameter.options ?? undefined);
            if (parameter.htmlElement != undefined) parameter.updateValue();
          }
        }
      });
    });

    console.log("Settings generated");
    console.log(Settings.stored);
  }
}

class ActionGroup extends Group {
  constructor(id, icon, name, description) {
    super(id, icon, name, description, true);
  }

  updateActived(defaultActived) {
    this.actived = "action";
  }
}

class Parameter extends Identity {
  constructor(group, id, icon, name, description, type, defaultValue, reloadingRequired = false, warning = false) {
    super(id, icon, name, description);
    this.group = group;
    group.addParameter(this);
    this.type = type;
    this.reloadingRequired = reloadingRequired;
    this.warning = warning;
    this.defaultValue = defaultValue;
  }

  importValue(defaultValue) {
    this.value = defaultValue;
  }

  async exportValue(newValue) {
    Settings.stored[this.group.id].parameters[this.id] = newValue;
    await Settings.storageSet();
  }

  updateValue() {
    this.htmlElement.setAttribute("data-actived", this.value != false ? "enabled" : "desabled");
  }

  genParameterParticularity(htmlElement) {
    return;
  }

  createEventListener(htmlElement, particularity) {
    return;
  }

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
    tippy(this.htmlElement.querySelector("#description"), { placement: "left", allowHTML: true, content: descriptionTooltip });
  }
}

class Switch extends Parameter {
  constructor(group, id, icon, name, description, defaultValue = true, reloadingRequired = false, warning = false) {
    super(group, id, icon, name, description, "switch", defaultValue, reloadingRequired, warning);
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

    for (const [j, subOptions] of this.options.entries()) {
      const particularity = stringToHtml(`
      <div class="flex flex-row items-center flex-wrap mx-[54px] my-5 gap-8">
      </div>
      `);

      // Pour chaque option avec i comme index
      for (const [i, option] of subOptions.entries()) {
        const actived = this.value?.[j] == option.id ? "enabled" : "desabled";

        const optionElement = stringToHtml(`
        <div data-actived="${actived}" class="cursor-pointer flex flex-col border rounded-xl border-custom-gray-verydark-transp data-[actived=enabled]:bg-custom-pink-ulttransp data-[actived=enabled]:border-custom-pink">
          <div class="flex flex-row items-center gap-4 mx-4 my-2">
            <input name="${id}${j}" type="radio" value="${option.id}" class="w-5 h-5 transition-all duration-150 ease-in-out border-2 cursor-pointer border-custom-gray-dark text-custom-pink focus:ring-0 focus:ring-offset-0" />
            <div class="text-xl font-semibold text-text">${option.name}</div>
          </div>
          <div class="m-4 mt-0 rounded-lg bg-text-white-full">
            <img src="./svg/${id}/${i + 1}.svg">
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

class ColorSelector extends Parameter {
  constructor(group, id, icon, name, description, defaultValue, reloadingRequired = false, warning = false) {
    super(group, id, icon, name, description, "colorselector", defaultValue, reloadingRequired, warning);
  }

  importValue(defaultValue) {
    this.value = Number.isInteger(Settings.stored[this.group.id]?.parameters[this.id]) && 360 >= Settings.stored[this.group.id]?.parameters[this.id] >= 0 ? Settings.stored[this.group.id].parameters[this.id] : defaultValue;
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

class Button extends Parameter {
  constructor(group, id, icon, name, description, warning = false) {
    super(group, id, icon, name, description, "button", true, false, warning);
  }
}

const notesTable = new Group("notesTable", "chart-mixed", "Notes", "Paramètres du tableau des notes", true);

new Switch(notesTable, "noteTableAnalysis", "sidebar", "Activer l'analyse du tableau de notes", "Active les fonctionnalités ci-dessous", true, true);
new Switch(notesTable, "generalAverageDisplay", "sidebar", "Forcer l'affichage de la moyenne générale", "Force l'affichage des moyennes par matières", true, true);
new Switch(notesTable, "AveragesPerSubjectDisplay", "sidebar", "Forcer l'affichage des moyennes par matières", "Force l'affichage des moyennes par matières et les recalcule", true, true);
new Switch(notesTable, "ClassAveragesDisplay", "sidebar", "Afficher les moyennes de classe", "Affiche les moyennes de classe dans le tableau de notes", true, true);
new Switch(notesTable, "AveragesPerSubjectRecalculation", "sidebar", "Recalculer les moyennes par matières", "Force le recalcul des moyennes par matières", false, true, "Si votre établissement désactive les coeficients, les moyennes par matières ne seront pas correctes");
new RowSelector(
  notesTable,
  "AveragesColorIndicator",
  "sidebar",
  "Indicateurs colorés sur les moyennes par matières",
  "Indique à l’aide de couleurs si les moyennes réduisent ou augmentent la moyenne générale",
  "background",
  [
    { id: "none", name: "Aucun" },
    { id: "round", name: "Rond" },
    { id: "background", name: "Fond" },
    { id: "outline", name: "Contour" },
  ],
  false
);
new RowSelector(
  notesTable,
  "AveragesInfluenceTooltips",
  "sidebar",
  "Info-bulles indiquant l’influence des moyennes par matières",
  "Info-bulles qui affichent combien de points cette moyenne fait perdre/gagner à la moyenne générale",
  "textAndValue",
  [
    { id: "none", name: "Aucun" },
    { id: "value", name: "Valeur" },
    { id: "textAndValue", name: "Texte & Valeur" },
  ],
  false
);

const sidebar = new Group("sidebar", "sidebar", "Barre latérale", "Paramètres de la barre latérale", false);

new Switch(sidebar, "newSidebar", "sidebar", "Nouveau design pour la barre latérale", "Donne une allure moderne à la barre permettant l’ajout d’options", false, true);
new Switch(sidebar, "sidebarDarkmode", "sidebar", "Mode sombre pour la barre latérale", "Rend les couleurs de fond de la barre latérale plus sombres, pour une meilleure lisibilité", true, false);
new Switch(sidebar, "pinnedSidebar", "sidebar", "Laisser la barre latérale déployée en continu", "Empêche la barre latérale de se réduire lorsqu'elle n’est plus survolée par la souris", false, false);
new Switch(sidebar, "hideCustomizationButton", "sidebar", "Cacher le bouton de personnalisation", "Si cette option est activée, vous devez uiliser le bouton de la barre latérale pour accéder à ce menu", false, false);
new MultiRowSelector(
  sidebar,
  "customizationButton",
  "sidebar",
  "Style du bouton de personnalisation",
  "Changer le style du bouton de personnalisation pour vous correspondre au mieux",
  ["iconAndText", "ile"],
  [
    [
      { id: "icon", name: "Icon" },
      { id: "iconAndText", name: "Texte & Icon" },
    ],
    [
      { id: "ile", name: "En Île" },
      { id: "border", name: "En Bordure" },
    ],
  ],
  false
);

const customizations = new Group("customizations", "swatchbook", "Personnalisation", "Paramètres de personnalisation", true);

new Switch(customizations, "customization", "sidebar", "Activer les options de personnalisation", "Permet l'activation des options de personnalisation", true, true);
new Switch(customizations, "darkmode", "sidebar", "Activer le mode sombre", "L'ensemble du site sera sombre, utile la nuit !", false, false);
new ColorSelector(customizations, "colorCustomization", "sidebar", "Couleur", "Couleur", 340, false);
new CustomSelector(
  customizations,
  "cornerCustomization",
  "sidebar",
  "Angle des coins",
  "Angle des coins",
  "none",
  [
    { id: "none", name: "Aucune", style: { first: "border-radius: 0px;" } },
    { id: "thin", name: "Fin", style: { first: "border-radius: 10px;" } },
    { id: "wide", name: "Large", style: { first: "border-radius: 20px;" } },
  ],
  false
);
new CustomSelector(
  customizations,
  "fontCustomization",
  "sidebar",
  "Police d'écriture",
  "Police d'écriture",
  "tahoma",
  [
    { id: "tahoma", name: "Tahoma", style: { third: "font-family: var(--font-comicSans);" } },
    { id: "roboto", name: "Roboto", style: { third: "font-family: var(--font-roboto);" } },
    { id: "poppin", name: "Poppin", style: { third: "font-family: var(--font-poppin);" } },
    { id: "openSans", name: "Open Sans", style: { third: "font-family: var(--font-openSans);" } },
    { id: "openDyslexic", name: "Open Dyslexic", style: { third: "font-family: var(--font-comicSans);" } },
    { id: "montserrat", name: "Montserrat", style: { third: "font-family: var(--font-montserrat);" } },
    { id: "merriweather", name: "Merriweather", style: { third: "font-family: var(--font-merriweather);" } },
    { id: "leckerliOne", name: "Leckerli One", style: { third: "font-family: var(--font-leckerliOne);" } },
    { id: "inter", name: "Inter", style: { third: "font-family: var(--font-openDyslexic);" } },
    { id: "comicSans", name: "Comic Sans", style: { third: "font-family: var(--font-comicSans);" } },
  ],
  false
);

const development = new ActionGroup("development", "gear", "Développement", "Paramètres de développement");

new Switch(development, "dev", "sidebar", "Activer les logs", "Active les logs pour le débuggage", false, true);
new Button(development, "downloadlog", "sidebar", "Télécharger les logs", "Télécharger les logs", false, false);

Group.genSettings();
