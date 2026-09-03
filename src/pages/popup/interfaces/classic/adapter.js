/**
 * Adaptateur de l'interface classique du popup.
 * Toutes les références visuelles et tous les événements DOM sont confinés ici.
 */
class ClassicAdapter {
  constructor(documentRef = document) {
    this.document = documentRef;
    this.templates = new Map();
    this.groups = new Map();
    this.parameterElements = new WeakMap();
    this.parameterEntries = [];
  }

  asset(path) {
    try {
      return browser.runtime.getURL(path);
    } catch (error) {
      return path;
    }
  }

  async load() {
    const response = await fetch(browser.runtime.getURL("/pages/popup/interfaces/classic/templates.html"));
    if (!response.ok) throw new Error(`Impossible de charger les templates classic (${response.status})`);

    const source = await response.text();
    const parsed = new DOMParser().parseFromString(source, "text/html");
    parsed.querySelectorAll("template[id]").forEach((template) => {
      this.templates.set(template.id, template.content.cloneNode(true));
    });
    this.validateTemplates();
    return this;
  }

  validateTemplates() {
    const required = {
      "classic-navbar-item": [".navbar-icon", ".navbar-label"],
      "classic-home-row": [".state-icon", ".home-icon", ".home-title", ".home-description"],
      "classic-group-tab": [".group-icon", ".group-title", ".group-description", ".group-switch", ".group-options"],
      "classic-parameter": [".parameter-icon", ".parameter-title", ".parameter-description", ".parameter-reload", ".parameter-button", ".parameter-button-label", ".parameter-warning", ".parameter-switch-input"],
      "classic-tooltip": [],
      "classic-options-row": [],
      "classic-option": [".parameter-option", ".option-input", ".option-label", ".option-image"],
      "classic-custom-option": [".parameter-option", ".custom-option-content", ".option-input", ".option-label"],
      "classic-color-option": [".color-option", "input[type=range]"]
    };

    Object.entries(required).forEach(([templateId, selectors]) => {
      const fragment = this.templates.get(templateId);
      const root = fragment?.firstElementChild;
      if (!root) throw new Error(`Template classic manquant ou vide : ${templateId}`);
      selectors.forEach((selector) => {
        if (!root.matches(selector) && !root.querySelector(selector)) {
          throw new Error(`Template classic « ${templateId} » incomplet : ${selector}`);
        }
      });
    });
  }

  clone(templateId) {
    const template = this.templates.get(templateId);
    if (!template) throw new Error(`Template inconnu : ${templateId}`);
    const element = template.cloneNode(true).firstElementChild;
    if (!element) throw new Error(`Template vide : ${templateId}`);
    return element;
  }

  mount() {
    this.slots = {
      navbar: this.document.getElementById("navbar"),
      home: this.document.getElementById("main"),
      settings: this.document.getElementById("setting"),
      body: this.document.getElementById("body"),
      version: this.document.getElementById("version"),
      thanks: this.document.getElementById("thanks"),
      returnButton: this.document.getElementById("returnButton"),
      title: this.document.getElementById("title"),
      starsButton: this.document.getElementById("starsButton"),
      githubButton: this.document.getElementById("githubButton"),
      tooltipRoot: this.document.querySelector(".tippyParent")
    };

    const missing = Object.entries(this.slots).filter(([, element]) => !element).map(([name]) => name);
    if (missing.length) throw new Error(`Points d'ancrage classic manquants : ${missing.join(", ")}`);
  }

  render(groups, versionInfo) {
    this.mount();
    this.slots.version.textContent = `V${versionInfo.major} | ${versionInfo.minor}.${versionInfo.patch}` + (versionInfo.stage !== "stable" ? ` | ${versionInfo.stage.toUpperCase()}` : "");
    this.renderThanks();

    groups.forEach((group) => {
      const elements = {
        navbar: this.renderNavbar(group),
        home: this.renderHomeRow(group),
        tab: this.renderGroupTab(group)
      };
      this.slots.navbar.appendChild(elements.navbar);
      this.slots.home.appendChild(elements.home);
      this.slots.settings.appendChild(elements.tab);
      this.groups.set(group.id, elements);

      group.parameters.forEach((parameter) => {
        const element = this.renderParameter(parameter);
        const options = elements.tab.querySelector(".group-options");
        if (!options) throw new Error(`Conteneur des paramètres absent pour le groupe « ${group.id} »`);
        options.appendChild(element);
        this.parameterElements.set(parameter, element);
        this.parameterEntries.push({ parameter, element });
      });

      this.bindGroup(group, elements);
      group.parameters.forEach((parameter) => this.bindParameter(parameter, this.parameterElements.get(parameter)));
      group.onChange(() => this.updateGroup(group));
      group.parameters.forEach((parameter) => parameter.onChange(() => this.updateParameter(parameter)));
    });

    this.bindNavigation(groups);
    this.bindHomeActions();
    this.restoreTab(groups);
    this.bindKeyboardActions();
    this.updateReloadState();
  }

  renderThanks() {
    const names = ["⭐ Viktorabe", "Alerymin", "Mattia P.", "S1w2a3", "Leo539", "Fefedu973", "JULES2011", "TimotheeMM", "TapsHTS", "DarkEarth", "Soleil", "Taps", "Codealuxz", "Sanchaton"];
    const starred = names.filter((name) => name.startsWith("⭐")).sort(() => Math.random() - 0.5);
    const regular = names.filter((name) => !name.startsWith("⭐")).sort(() => Math.random() - 0.5);
    this.slots.thanks.textContent = [...starred, ...regular].map((name, index) => (index % 4 === 3 ? `${name}\n` : `${name} - `)).join(" ");
  }

  renderNavbar(group) {
    const element = this.clone("classic-navbar-item");
    element.querySelector(".navbar-icon").src = this.asset(`/pages/popup/svg/icons/${group.icon}.svg`);
    element.querySelector(".navbar-label").textContent = group.name;
    return element;
  }

  renderHomeRow(group) {
    const element = this.clone("classic-home-row");
    const state = group.actived === true ? "enabled" : group.actived || "desabled";
    element.dataset.state = state;
    element.querySelector(".state-icon").src = this.asset(`/pages/popup/svg/icons/state/${state}.svg`);
    element.querySelector(".home-next").src = this.asset("/pages/popup/svg/icons/next.svg");
    element.querySelector(".home-icon").src = this.asset(`/pages/popup/svg/icons/${group.icon}.svg`);
    element.querySelector(".home-title").textContent = group.name;
    element.querySelector(".home-description").textContent = group.description;
    return element;
  }

  renderGroupTab(group) {
    const element = this.clone("classic-group-tab");
    element.dataset.state = group.actived === true ? "enabled" : group.actived || "desabled";
    element.querySelector(".group-icon").src = this.asset(`/pages/popup/svg/icons/${group.icon}.svg`);
    element.querySelector(".need-reload img").src = this.asset("/pages/popup/svg/icons/needreload.svg");
    element.querySelector(".group-title").textContent = group.name;
    element.querySelector(".group-description").textContent = group.description;
    element.querySelector(".group-switch").checked = group.actived !== false;
    return element;
  }

  renderParameter(parameter) {
    const element = this.clone("classic-parameter");
    element.dataset.actived = parameter.value !== false ? "enabled" : "desabled";
    element.dataset.warning = parameter.warning ? "true" : "false";
    element.dataset.type = parameter.type;
    element.querySelector(".parameter-icon").src = this.asset(`/pages/popup/svg/icons/${parameter.icon}.svg`);
    element.querySelector(".parameter-reload img").src = this.asset("/pages/popup/svg/icons/needreload.svg");
    element.querySelector(".parameter-title").textContent = parameter.name;
    element.querySelector(".parameter-button-label").textContent = parameter.name;
    element.querySelector(".parameter-warning").textContent = parameter.warning || "";
    element.querySelector(".parameter-reload").classList.toggle("hidden", !parameter.reloadingRequired);
    element.querySelector(".parameter-switch-input").checked = parameter.value !== false;

    const particularity = this.renderParticularity(parameter, element);
    if (particularity) element.appendChild(particularity);
    return element;
  }

  renderParticularity(parameter, element) {
    switch (parameter.type) {
      case "rowselector": return this.renderRowSelector(parameter);
      case "customselector": return this.renderCustomSelector(parameter);
      case "multirowselector": return this.renderMultiRowSelector(parameter);
      case "colorselector": return this.renderColorSelector(parameter);
      default: return undefined;
    }
  }

  renderRowSelector(parameter) {
    const options = this.clone("classic-options-row");
    parameter.options.forEach((option, index) => {
      const element = this.clone("classic-option");
      element.dataset.actived = parameter.value === option.id ? "enabled" : "desabled";
      const input = element.querySelector(".option-input");
      input.name = parameter.id;
      input.value = option.id;
      input.checked = parameter.value === option.id;
      element.querySelector(".option-label").textContent = option.name;
      element.querySelector(".option-image").src = this.asset(`/pages/popup/svg/${parameter.id}/${index + 1}.svg`);
      options.appendChild(element);
    });
    return options;
  }

  renderCustomSelector(parameter) {
    const options = this.clone("classic-options-row");
    parameter.options.forEach((option) => {
      const element = this.clone("classic-custom-option");
      element.dataset.actived = parameter.value === option.id ? "enabled" : "desabled";
      const content = element.querySelector(".custom-option-content");
      const input = element.querySelector(".option-input");
      input.name = parameter.id;
      input.value = option.id;
      input.checked = parameter.value === option.id;
      element.querySelector(".option-label").textContent = option.name;
      const style = option.style || {};
      if (style.first) element.style.cssText = style.first;
      if (style.seconde) content.style.cssText = style.seconde;
      if (style.input) input.style.cssText = style.input;
      if (style.third) element.querySelector(".option-label").style.cssText = style.third;
      options.appendChild(element);
    });
    return options;
  }

  renderMultiRowSelector(parameter) {
    const container = this.document.createDocumentFragment();
    parameter.options.forEach((subOptions, rowIndex) => {
      const options = this.clone("classic-options-row");
      subOptions.forEach((option) => {
        const element = this.clone("classic-option");
        element.dataset.actived = parameter.value?.[rowIndex] === option.id ? "enabled" : "desabled";
        const input = element.querySelector(".option-input");
        input.name = `${parameter.id}${rowIndex}`;
        input.value = option.id;
        input.checked = parameter.value?.[rowIndex] === option.id;
        element.querySelector(".option-label").textContent = option.name;
        element.querySelector(".option-image").src = this.asset(`/pages/popup/svg/${parameter.id}/${this.multiRowImageIndex(parameter, rowIndex, option)}.svg`);
        options.appendChild(element);
      });
      container.appendChild(options);
      if (rowIndex < parameter.options.length - 1) {
        const separator = this.document.createElement("hr");
        separator.className = "flex flex-row items-center mx-[54px] my-5 gap-8";
        container.appendChild(separator);
      }
    });
    return container;
  }

  multiRowImageIndex(parameter, rowIndex, option) {
    let index = 0;
    for (let row = 0; row <= rowIndex; row++) {
      for (const current of parameter.options[row]) {
        index += 1;
        if (row === rowIndex && current.id === option.id) return index;
      }
    }
    return index;
  }

  renderColorSelector(parameter) {
    const element = this.clone("classic-color-option");
    element.setAttribute("color", String(parameter.value));
    element.querySelector("input").value = parameter.value;
    return element;
  }

  bindGroup(group, elements) {
    const input = elements.tab.querySelector(".group-switch-input");
    if (!input) return;
    input.addEventListener("change", (event) => {
      Settings.stored[group.id].actived = event.currentTarget.checked;
      group.actived = event.currentTarget.checked;
      this.updateGroup(group);
      Settings.storageSet();
    });
  }

  bindParameter(parameter, element) {
    if (parameter.type === "switch") {
      element.querySelector(".parameter-switch-input").addEventListener("change", (event) => parameter.exportValue(event.currentTarget.checked));
      return;
    }
    if (parameter.type === "button") {
      element.querySelector(".parameter-button").addEventListener("click", () => parameter.exportValue(Date.now()));
      return;
    }
    if (parameter.type === "colorselector") {
      const input = element.querySelector("input[type=range]");
      input.addEventListener("input", () => element.querySelector(".color-option").setAttribute("color", input.value));
      input.addEventListener("change", () => parameter.exportValue(Number(input.value)));
      return;
    }
    element.querySelectorAll(".parameter-option").forEach((option) => {
      const input = option.querySelector("input");
      option.addEventListener("click", (event) => {
        if (event.target !== input) input.click();
      });
      input.addEventListener("change", () => {
        if (!input.checked) return;
        if (parameter.type === "multirowselector") {
          const row = Number(input.name.slice(parameter.id.length));
          const value = [...parameter.value];
          value[row] = input.value;
          parameter.exportValue(value);
        } else parameter.exportValue(input.value);
      });
    });
  }

  updateGroup(group) {
    const elements = this.groups.get(group.id);
    if (!elements) return;
    const state = group.actived === true ? "enabled" : group.actived || "desabled";
    elements.home.dataset.state = state;
    elements.home.querySelector(".state-icon").src = this.asset(`/pages/popup/svg/icons/state/${state}.svg`);
    elements.tab.dataset.state = state;
    elements.tab.querySelector(".group-switch-input").checked = group.actived !== false;
    const groupDisabled = group.actived === false;
    elements.tab.querySelector(".group-options")?.toggleAttribute("aria-disabled", groupDisabled);
    group.parameters.forEach((parameter) => {
      const element = this.parameterElements.get(parameter);
      element?.toggleAttribute("aria-disabled", groupDisabled);
      element?.querySelectorAll("input, button, select, textarea").forEach((control) => { control.disabled = groupDisabled; });
    });
    this.updateReloadState();
  }

  updateParameter(parameter) {
    const element = this.parameterElements.get(parameter);
    if (!element) return;
    element.dataset.actived = parameter.value !== false ? "enabled" : "desabled";
    if (parameter.type === "switch") element.querySelector(".parameter-switch-input").checked = parameter.value !== false;
    if (parameter.type === "rowselector" || parameter.type === "customselector" || parameter.type === "multirowselector") {
      element.querySelectorAll(".parameter-option").forEach((option) => {
        const input = option.querySelector("input");
        const row = parameter.type === "multirowselector" ? Number(input.name.slice(parameter.id.length)) : undefined;
        const expectedValue = row === undefined ? parameter.value : parameter.value?.[row];
        option.dataset.actived = input.value === expectedValue ? "enabled" : "desabled";
        input.checked = input.value === expectedValue;
      });
    }
    if (parameter.type === "colorselector") {
      element.querySelector("input[type=range]").value = parameter.value;
      element.querySelector(".color-option").setAttribute("color", String(parameter.value));
    }
    this.updateReloadState();
  }

  updateReloadState() {
    const needReload = Group.reloadingNeeded.length > 0;
    this.slots.returnButton.dataset.needreload = String(needReload);
    this.slots.returnButton.title = needReload ? "Actualiser la page pour appliquer les changements" : "Fermer";
  }

  bindNavigation(groups) {
    const show = (group) => {
      groups.forEach((current) => {
        this.groups.get(current.id).navbar.dataset.selected = String(current === group);
        this.groups.get(current.id).tab.dataset.show = String(current === group);
      });
      this.slots.body.dataset.tab = "setting";
      sessionStorage.setItem("tab", group.id);
    };
    groups.forEach((group) => {
      const elements = this.groups.get(group.id);
      elements.navbar.addEventListener("click", () => show(group));
      elements.home.addEventListener("click", () => show(group));
    });
    this.showGroup = show;
    this.hideGroups = () => {
      groups.forEach((group) => {
        this.groups.get(group.id).navbar.dataset.selected = "false";
        this.groups.get(group.id).tab.dataset.show = "false";
      });
      this.slots.body.dataset.tab = "home";
      sessionStorage.setItem("tab", "home");
    };
  }

  bindHomeActions() {
    this.slots.title.addEventListener("click", () => this.hideGroups());
    this.slots.returnButton.addEventListener("click", () => {
      const action = this.slots.returnButton.dataset.needreload === "true" ? "reload" : "close";
      window.parent.postMessage(action, "*");
    });
    this.slots.starsButton.addEventListener("click", () => window.open("https://chromewebstore.google.com/detail/customdirecte/ngibpoegkheookihjcnjihkfhfnglfei/reviews", "_blank"));
    this.slots.githubButton.addEventListener("click", () => window.open("https://github.com/CustomDirecte/CustomDirecte", "_blank"));
  }

  restoreTab(groups) {
    const tab = sessionStorage.getItem("tab");
    const group = groups.find((candidate) => candidate.id === tab);
    if (group) this.showGroup(group);
  }

  bindKeyboardActions() {
    this.document.defaultView?.addEventListener("message", (event) => {
      if (event.data === "closed") this.slots.returnButton.click();
    });
    this.document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") this.slots.returnButton.click();
    });
    this.document.querySelectorAll(".need-reload").forEach((element) => {
      tippy(element, { placement: "left", allowHTML: true, content: this.createTooltip("Nécessite de rafraîchir la page !"), appendTo: () => this.slots.tooltipRoot });
    });
    this.document.querySelectorAll(".parameter-description").forEach((element) => {
      const entry = this.parameterEntries.find((candidate) => candidate.element.querySelector(".parameter-description") === element);
      if (entry) tippy(element, { placement: "left", allowHTML: true, content: this.createTooltip(entry.parameter.description), appendTo: () => this.slots.tooltipRoot });
    });
  }

  createTooltip(content) {
    const tooltip = this.clone("classic-tooltip");
    tooltip.style.fontSize = "16px";
    tooltip.textContent = content;
    return tooltip;
  }
}

registerPopupInterface("classic", async () => new ClassicAdapter().load());
