log.script("MODULES/CUSTOMIZATIONMODULE.JS");

/**
 * @fileOverview Module de personnalisation : injection CSS, DarkReader, attributs HTML.
 * @author Bastian NOEL
 */

var customizationModule = {
  groupId: "customizations",

  setFavicon() {
    if (window.top !== window) return;

    let favicon = document.querySelector('link[rel~="icon"]');
    if (!favicon) {
      favicon = document.createElement("link");
      favicon.rel = "icon";
      document.head.appendChild(favicon);
    }
    favicon.type = "image/x-icon";
    favicon.href = browser.runtime.getURL("/icons/EcoleDirecte/magenta.ico");
    log.debug("CUSTOMIZATION", "Favicon magenta appliqué");
  },

  /**
   * Démarre le module : synchronise les attributs HTML, injecte le CSS custom et DarkReader.
   * @param {Object} params - Paramètres du groupe "customizations".
   */
  start(params) {
    log.info("CUSTOMIZATION", "Démarrage");

    this.setFavicon();

    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) document.documentElement.setAttribute(key, value);
    }
    log.debug("CUSTOMIZATION", `${Object.keys(params).length} attribut(s) HTML synchronisés`);

    try {
      const css = document.createElement("style");
      css.dataset.customDirecteCustomizationsCss = "";
      fetch(browser.runtime.getURL("/styles/customizations.css"))
        .then((r) => r.text())
        .then((d) => { css.innerHTML = d; })
        .catch((err) => log.error("CUSTOMIZATION", `Erreur chargement customizations.css : ${err}`));
      document.head.appendChild(css);
      log.debug("CUSTOMIZATION", "customizations.css injecté");
    } catch (err) {
      log.error("CUSTOMIZATION", `Erreur injection CSS : ${err}`);
    }

    try {
      const dr = document.createElement("script");
      dr.src = browser.runtime.getURL("/scripts/darkreader.js");
      dr.onload = () => {
        const msg = params.darkmode === true ? "DarkReader-enable" : "DarkReader-disable";
        window.postMessage(msg, "*");
        log.info("CUSTOMIZATION", `Mode sombre ${params.darkmode === true ? "activé" : "désactivé"} au démarrage`);
      };
      dr.onerror = () => log.error("CUSTOMIZATION", "Échec chargement darkreader.js");
      document.head.appendChild(dr);
      log.debug("CUSTOMIZATION", "darkreader.js injecté");
    } catch (err) {
      log.error("CUSTOMIZATION", `Erreur injection darkreader : ${err}`);
    }
    log.info("CUSTOMIZATION", "Démarrage complet");
  },

  /**
   * Réagit à un changement de paramètre : met à jour l'attribut HTML et gère le mode sombre.
   * @param {string} paramId - Identifiant du paramètre modifié.
   * @param {*} newValue - Nouvelle valeur.
   */
  onParamChange(paramId, newValue) {
    document.documentElement.setAttribute(paramId, newValue);
    log.debug("CUSTOMIZATION", `${paramId} → ${newValue}`);
    if (paramId === "darkmode") {
      window.postMessage(newValue === true ? "DarkReader-enable" : "DarkReader-disable", "*");
      log.info("CUSTOMIZATION", `Mode sombre ${newValue === true ? "activé" : "désactivé"}`);
    }
  },
};

ModuleRunner.register(customizationModule);
