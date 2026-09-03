/**
 * Adaptateur de l'interface legacy originale.
 *
 * Le HTML et le CSS viennent de popup-tooling/legacy. Cet adaptateur ne fait
 * que cloner ces templates et traduire Group/Parameter en attributs, textes,
 * valeurs et événements attendus par cette interface.
 */
class LegacyAdapter {
  constructor(documentRef = document) {
    this.document = documentRef;
    this.templates = new Map();
    this.groups = new Map();
    this.parameters = new Map();
  }

  asset(path) {
    try { return browser.runtime.getURL(path); } catch (error) { return path; }
  }

  async load() {
    const response = await fetch(this.asset("/pages/popup/interfaces/legacy/templates.html"));
    if (!response.ok) throw new Error(`Impossible de charger les templates legacy (${response.status})`);
    const source = await response.text();
    const parsed = new DOMParser().parseFromString(source, "text/html");
    parsed.querySelectorAll("template[id]").forEach((template) => this.templates.set(template.id, template.content.cloneNode(true)));
    this.validateTemplates();
    return this;
  }

  validateTemplates() {
    const required = {
      "legacy-header": ["#titleparent", ".icon", "#title", "#version"],
      "legacy-layout": [".groups", ".separator.vertical"],
      "legacy-group": [],
      "legacy-panel": [".groupInfo", ".groupTitle", ".groupSubtitle", "[data-parameters]"],
      "legacy-parameter": [".optionInfo", ".optionTitle", ".optionSubtitle", ".optionWarning", "[data-control]"],
      "legacy-switch": [".optionSwitch"],
      "legacy-button": [".optionButton"],
      "legacy-selection": [".optionSelection"],
      "legacy-option": [".optionBox", "img", "span"],
      "legacy-custom-option": [".optionBox", "div"],
      "legacy-color": [".optionSelection", ".colorSlider", ".colorSimulation"],
    };
    Object.entries(required).forEach(([id, selectors]) => {
      const fragment = this.templates.get(id);
      const root = fragment?.firstElementChild;
      if (!root) throw new Error(`Template legacy manquant ou vide : ${id}`);
      selectors.forEach((selector) => {
        if (!root.matches(selector) && !root.querySelector(selector)) throw new Error(`Template legacy « ${id} » incomplet : ${selector}`);
      });
    });
  }

  clone(id) {
    const fragment = this.templates.get(id);
    if (!fragment) throw new Error(`Template legacy inconnu : ${id}`);
    const element = fragment.cloneNode(true).firstElementChild;
    if (!element) throw new Error(`Template legacy vide : ${id}`);
    return element;
  }

  render(groups, versionInfo) {
    this.mount(versionInfo);
    this.groups.clear();
    this.parameters.clear();
    this.renderGroups(groups);
    this.bindKeyboardActions();
    this.updateReloadState();
  }

  mount(versionInfo) {
    this.document.body.className = "legacy-interface";
    this.document.body.replaceChildren();
    this.header = this.clone("legacy-header");
    this.layout = this.clone("legacy-layout");
    this.document.body.append(this.header, this.layout);
    this.slots = {
      groups: this.layout.querySelector(".groups"),
      version: this.header.querySelector("#version"),
      title: this.header.querySelector("#title"),
      main: this.layout,
    };
    const logo = this.header.querySelector(".icon");
    logo.setAttribute("data", this.asset("/icons/EcoleDirecte/default/icon.svg"));
    this.slots.version.textContent = `Version ${browserVersion}`;
    this.document.head.querySelector("[data-popup-runtime-css]")?.remove();
    this.stylesheet = this.document.createElement("link");
    this.stylesheet.rel = "stylesheet";
    this.stylesheet.href = this.asset("/pages/popup/interfaces/legacy/interface.css");
    this.document.head.appendChild(this.stylesheet);
  }

  renderGroups(groups) {
    groups.forEach((group, index) => {
      const button = this.clone("legacy-group");
      button.textContent = group.name;
      button.dataset.group = group.id;
      button.toggleAttribute("selected", index === 0);
      button.addEventListener("click", () => this.selectGroup(group));
      this.slots.groups.appendChild(button);
      this.groups.set(group.id, { group, button });

      const panel = this.clone("legacy-panel");
      panel.dataset.group = group.id;
      panel.toggleAttribute("hide", index !== 0);
      panel.querySelector(".groupTitle").textContent = group.name;
      panel.querySelector(".groupSubtitle").textContent = group.description;
      const groupInfo = panel.querySelector(".groupInfo");
      const groupSwitch = panel.querySelector("[data-group-switch]");
      if (group.actived === "action") groupSwitch.remove();
      else {
        groupSwitch.toggleAttribute("active", group.actived !== false);
        groupSwitch.setAttribute("aria-pressed", String(group.actived !== false));
        groupSwitch.addEventListener("click", () => {
          const nextValue = !groupSwitch.hasAttribute("active");
          groupSwitch.toggleAttribute("active", nextValue);
          groupSwitch.setAttribute("aria-pressed", String(nextValue));
          Settings.stored[group.id].actived = nextValue;
          group.actived = nextValue;
          this.updateGroup(group);
          Settings.storageSet();
        });
      }
      this.slots.main.appendChild(panel);
      const options = panel.querySelector("[data-parameters]");
      group.parameters.forEach((parameter) => {
        const element = this.renderParameter(parameter);
        options.appendChild(element);
        this.parameters.set(parameter.id, { parameter, element });
        parameter.onChange(() => this.updateParameter(parameter));
      });
      group.onChange(() => this.updateGroup(group));
    });
    this.selectGroup(groups.find((group) => group.id === sessionStorage.getItem("legacy-interface-group")) || groups[0]);
  }

  renderParameter(parameter) {
    const element = this.clone("legacy-parameter");
    element.dataset.type = parameter.type;
    element.dataset.parameterId = parameter.id;
    element.classList.toggle("optionSelectionParent", ["rowselector", "customselector", "multirowselector", "colorselector"].includes(parameter.type));
    element.toggleAttribute("reloadingrequired", parameter.reloadingRequired);
    element.toggleAttribute("disabled", this.isLocked(parameter));
    element.querySelector(".optionTitle").textContent = parameter.name;
    element.querySelector(".optionSubtitle").textContent = parameter.description;
    element.querySelector(".optionWarning").textContent = parameter.warning || "";
    element.querySelector("[data-control]").replaceWith(this.renderControl(parameter));
    this.setControlsDisabled(element, this.isLocked(parameter));
    return element;
  }

  renderControl(parameter) {
    if (parameter.type === "switch") return this.renderSwitch(parameter);
    if (parameter.type === "button") return this.renderButton(parameter);
    if (parameter.type === "colorselector") return this.renderColor(parameter);
    if (parameter.type === "rowselector" || parameter.type === "customselector") return this.renderSelection(parameter, parameter.options, parameter.type === "customselector");
    if (parameter.type === "multirowselector") {
      const fragment = this.document.createDocumentFragment();
      parameter.options.forEach((options, rowIndex) => {
        fragment.appendChild(this.renderSelection(parameter, options, false, rowIndex));
        if (rowIndex < parameter.options.length - 1) fragment.appendChild(this.clone("legacy-separator"));
      });
      return fragment;
    }
    return this.clone("legacy-empty-control");
  }

  renderSwitch(parameter) {
    const element = this.clone("legacy-switch");
    element.toggleAttribute("active", parameter.value === true);
    element.setAttribute("aria-pressed", String(parameter.value === true));
    element.addEventListener("click", () => {
      if (this.isLocked(parameter)) return;
      const nextValue = !element.hasAttribute("active");
      element.toggleAttribute("active", nextValue);
      element.setAttribute("aria-pressed", String(nextValue));
      parameter.exportValue(nextValue);
    });
    return element;
  }

  renderButton(parameter) {
    const element = this.clone("legacy-button");
    element.classList.toggle("content-download", parameter.id === "downloadlog");
    element.addEventListener("click", () => { if (!this.isLocked(parameter)) parameter.exportValue(Date.now()); });
    return element;
  }

  renderColor(parameter) {
    const element = this.clone("legacy-color");
    element.setAttribute("color", String(parameter.value));
    const input = element.querySelector(".colorSlider");
    input.value = String(parameter.value);
    input.addEventListener("input", () => { if (!this.isLocked(parameter)) element.setAttribute("color", input.value); });
    input.addEventListener("change", () => { if (!this.isLocked(parameter)) parameter.exportValue(Number(input.value)); });
    return element;
  }

  renderSelection(parameter, options, custom, rowIndex) {
    const element = this.clone("legacy-selection");
    options.forEach((option, optionIndex) => {
      const choice = this.clone(custom ? "legacy-custom-option" : "legacy-option");
      const currentValue = rowIndex === undefined ? parameter.value : parameter.value?.[rowIndex];
      choice.toggleAttribute("active", currentValue === option.id);
      choice.style.setProperty("--Xplacement", `${optionIndex * 12}px`);
      choice.dataset.selection = option.id;
      const input = choice.querySelector("input");
      input.name = rowIndex === undefined ? parameter.id : `${parameter.id}${rowIndex}`;
      input.value = option.id;
      input.checked = currentValue === option.id;
      if (custom) {
        const demo = choice.querySelector(".optionBox > div");
        const style = option.style || {};
        if (style.first) demo.style.cssText = style.first;
        if (style.seconde) demo.style.cssText += style.seconde;
        if (style.third) demo.style.cssText += style.third;
        demo.textContent = option.name;
      } else {
        const label = choice.querySelector(".optionBox > span");
        label.textContent = option.name;
        const image = choice.querySelector(".optionBox > img");
        const imageIndex = rowIndex === undefined ? optionIndex + 1 : this.multiRowImageIndex(parameter, rowIndex, option);
        image.src = this.asset(`/pages/popup/svg/${parameter.id}/${imageIndex}.svg`);
      }
      input.addEventListener("change", () => {
        if (!input.checked || this.isLocked(parameter)) return;
        if (rowIndex === undefined) parameter.exportValue(input.value);
        else {
          const value = [...parameter.value];
          value[rowIndex] = input.value;
          parameter.exportValue(value);
        }
      });
      element.appendChild(choice);
    });
    return element;
  }

  multiRowImageIndex(parameter, rowIndex, option) {
    let index = 0;
    for (let row = 0; row <= rowIndex; row++) for (const current of parameter.options[row]) {
      index += 1;
      if (row === rowIndex && current.id === option.id) return index;
    }
    return index;
  }

  parameterValue(parameterId) {
    for (const entry of this.parameters.values()) {
      if (entry.parameter.id === parameterId) return entry.parameter.value;
    }
    for (const group of this.groups.values()) {
      const parameter = group.group.parameters.find((candidate) => candidate.id === parameterId);
      if (parameter) return parameter.value;
    }
    return undefined;
  }

  isLocked(parameter) {
    if (parameter.disabled === true || parameter.locked === true) return true;
    if (parameter.group?.actived === false) return true;
    return [parameter.lock, parameter.requires].some((dependency) => {
      if (dependency === undefined || dependency === null || dependency === false) return false;
      if (dependency === true) return true;
      if (typeof dependency !== "string") return false;
      const [groupId, parameterId] = dependency.split(".");
      if (parameterId) return this.groups.get(groupId)?.group.parameters.some((candidate) => candidate.id === parameterId && candidate.value === true) !== true;
      return this.parameterValue(dependency) !== true;
    });
  }

  setControlsDisabled(element, disabled) {
    element.setAttribute("aria-disabled", String(disabled));
    element.querySelectorAll("button, input").forEach((control) => { control.disabled = disabled; });
  }

  selectGroup(group) {
    if (!group) return;
    this.groups.forEach(({ group: current, button }) => button.toggleAttribute("selected", current === group));
    this.layout.querySelectorAll(".options").forEach((panel) => panel.toggleAttribute("hide", panel.dataset.group !== group.id));
    sessionStorage.setItem("legacy-interface-group", group.id);
  }

  updateGroup(group) {
    const entry = this.groups.get(group.id);
    if (entry) {
      entry.button.dataset.state = group.actived === true ? "enabled" : "disabled";
      const panel = this.layout.querySelector(`.options[data-group="${group.id}"]`);
      const groupSwitch = panel?.querySelector("[data-group-switch]");
      groupSwitch?.toggleAttribute("active", group.actived !== false);
      groupSwitch?.setAttribute("aria-pressed", String(group.actived !== false));
      group.parameters.forEach((parameter) => {
        const element = this.parameters.get(parameter.id)?.element;
        if (element) {
          const locked = group.actived === false || this.isLocked(parameter);
          element.toggleAttribute("disabled", locked);
          this.setControlsDisabled(element, locked);
        }
      });
    }
    this.updateReloadState();
  }

  updateParameter(parameter) {
    const entry = this.parameters.get(parameter.id);
    if (!entry) return;
    const { element } = entry;
    const locked = this.isLocked(parameter);
    element.toggleAttribute("disabled", locked);
    this.setControlsDisabled(element, locked);
    if (parameter.type === "switch") {
      element.querySelector(".optionSwitch").toggleAttribute("active", parameter.value === true);
      element.querySelector(".optionSwitch").setAttribute("aria-pressed", String(parameter.value === true));
    }
    if (parameter.type === "colorselector") {
      element.setAttribute("color", String(parameter.value));
      element.querySelector(".colorSlider").value = String(parameter.value);
    }
    if (["rowselector", "customselector", "multirowselector"].includes(parameter.type)) {
      element.querySelectorAll(".optionBox").forEach((choice) => {
        const input = choice.querySelector("input");
        const row = parameter.type === "multirowselector" ? Number(input.name.slice(parameter.id.length)) : undefined;
        const value = row === undefined ? parameter.value : parameter.value?.[row];
        choice.toggleAttribute("active", input.value === value);
        input.checked = input.value === value;
      });
    }
    this.updateReloadState();
  }

  updateReloadState() {
    const needReload = Group.reloadingNeeded.length > 0;
    this.header.querySelector("#version").textContent = needReload ? `Version ${browserVersion} — Actualiser` : `Version ${browserVersion}`;
  }

  bindKeyboardActions() {
    this.document.addEventListener("keydown", (event) => { if (event.key === "Escape") this.close(); });
    this.document.defaultView?.addEventListener("message", (event) => { if (event.data === "closed") this.close(); });
  }

  close() {
    window.parent.postMessage(Group.reloadingNeeded.length ? "reload" : "close", "*");
  }
}

registerPopupInterface("legacy", async () => new LegacyAdapter().load());
