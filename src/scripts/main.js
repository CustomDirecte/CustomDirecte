log.script("MAIN.JS");

/**
 * @fileOverview Gere le fonctionnement des cripts dans la page.
 * @author Bastian NOEL
 */

/* █ █▄ █ █ ▀█▀ █ ▄▀█ █   █ █▀ ▄▀█ ▀█▀ █ █▀█ █▄ █ */
/* █ █ ▀█ █  █  █ █▀█ █▄▄ █ ▄█ █▀█  █  █ █▄█ █ ▀█ */

var initialize = {
  /**
   * Ajoute le CSS par défaut à la page.
   */
  defaultCSS() {
    try {
      defaultcss = document.createElement("style");
      defaultcss.dataset.customDirecteDefaultCss = "";
      fetch(browser.runtime.getURL("/styles/default.css"))
        .then((response) => response.text())
        .then((data) => {
          defaultcss.innerHTML = data;
        });
      document.head.appendChild(defaultcss);
    } catch (error) {
      log.error("INIT", `Erreur lors de l'ajout du CSS par défaut : ${error}`);
    }
  },

  /**
   * Affiche ou masque le popup des options.
   */
  closeSettingsPopup(settingsPopup) {
    if (document.documentElement.classList.contains("settings-popup-active")) settingsPopup.contentWindow.postMessage("closed", "*");
  },

  /**
   * Demande de fermeture du popup des options.
   */
  closeSettingsPopupEvent(settingsPopup) {
    window.addEventListener("message", (e) => {
      if (e.source !== settingsPopup.contentWindow) return;
      else if (e.data == "reload") location.reload();
      else if (e.data == "close") if (document.documentElement.classList.contains("settings-popup-active")) document.documentElement.classList.remove("settings-popup-active");
    });
  },

  /**
   * Crée le bouton de menu pour accéder aux options de l'extension.
   */
  menuButton() {
    try {
      // Bouton de menu
      settingsButtonDiv = document.createElement("div");
      settingsButtonDiv.classList.add("settings-button");
      settingsButtonIcon = document.createElement("div");
      settingsButtonIcon.classList.add("settings-button-icon");
      settingsButtonSpan = document.createElement("span");
      settingsButtonSpan.innerText = "Personnaliser EcoleDirecte";
      document.body.prepend(settingsButtonDiv);
      settingsButtonDiv.appendChild(settingsButtonIcon);
      settingsButtonDiv.appendChild(settingsButtonSpan);
      return settingsButtonDiv;
    } catch (error) {
      log.error("INIT", `Erreur lors de la création du bouton de menu : ${error}`);
    }
  },

  /**
   * Popup des options de l'extension.
   */
  popupFrame() {
    try {
      // Flou de fond du popup des options
      settingsPopupBlur = document.createElement("div");
      settingsPopupBlur.classList.add("settings-popup-blur");
      document.body.prepend(settingsPopupBlur);

      // Iframe du popup des options
      settingsPopup = document.createElement("iframe");
      settingsPopup.classList.add("settings-popup");
      document.body.prepend(settingsPopup);
      settingsPopup.src = browser.runtime.getURL("/pages/popup/interface.html");

      return [settingsPopup, settingsPopupBlur];
    } catch (error) {
      log.error("INIT", `Erreur lors de la création du popup des options : ${error}`);
    }
  },

  /**
   * Lance l'initialisation de l'interface utilisateur de l'extension.
   */
  all() {
    initialize.defaultCSS();
    settingsButton = initialize.menuButton();
    [settingsPopup, settingsPopupBlur] = initialize.popupFrame();
    if (!settingsButton || !settingsPopup || !settingsPopupBlur) {
      log.error("INIT", "Erreur lors de l'initialisation de l'interface : un élément n'a pas pu être créé.");
      return;
    }
    // Ajoute les événements pour ouvrir/fermer le popup des options
    settingsPopupBlur.onclick = settingsButton.onclick = () => {
      if (!document.documentElement.classList.contains("settings-popup-active")) document.documentElement.classList.add("settings-popup-active");
      else initialize.closeSettingsPopup(settingsPopup);
    };
    document.addEventListener("keydown", (e) => {
      if (e.key == "Escape") initialize.closeSettingsPopup(settingsPopup);
    });

    initialize.closeSettingsPopupEvent(settingsPopup);
  },
};

/**
 * Attend que le document soit prêt avant d'initialiser l'interface utilisateur de l'extension.
 */
if (document.readyState === "loading")
  document.addEventListener("readystatechange", function listener() {
    if (document.readyState !== "loading") {
      document.removeEventListener("readystatechange", listener);
      initialize.all();
    }
  });
else initialize.all();

/* █▀█ █ █ ▀█▀ █ █   █▀ */
/* █▄█ █▄█  █  █ █▄▄ ▄█ */

var tools = {
  /**
   * Vérifie si la page actuelle est la page de connexion.
   * @returns {boolean} True si c'est la page de connexion, sinon false.
   */
  isLoginPage() {
    return /(?:http|https)(?::\/\/)(.+\.|)(?:ecoledirecte\.com\/login).*/.test(window.location.href) ? true : false;
  },
  /**
   * Telecharge du texte dans un fichier .txt
   * @param {string} content - Le contenu à télécharger
   * @param {string} fileName - Le nom du fichier sans l'extension
   */
  txtDownloader(content, fileName, mime = "text/plain", ext = "txt") {
    var a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([content], { type: mime }));
    a.download = `${fileName}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  },
};

/* █▀▄ █▀▀ █ █ */
/* █▄▀ ██▄ ▀▄▀ */

/**
 * Gère les changements du groupe "development" en temps réel.
 * - Paramètre "dev"         : active/désactive les logs de débugage (devModeActive).
 * - Paramètre "downloadlog" : déclenche le téléchargement du fichier CDL1 depuis le background.
 * @param {string} paramId  - Identifiant du paramètre modifié.
 * @param {*}      newValue - Nouvelle valeur du paramètre.
 */
function developmentParamHandler(paramId, newValue) {
  if (paramId === "dev") {
    devModeActive = newValue === true;
    log.info("DEV", `Mode débugage ${devModeActive ? "activé" : "désactivé"}`);
  }

  if (paramId === "downloadlog" && newValue > 0) {
    log.info("DEV", "Téléchargement des logs demandé");
    browserRuntime.sendMessage({ type: "CD_DOWNLOAD_LOGS", contextLogs: devLogs })
      .then(({ file }) => {
        tools.txtDownloader(file, `cd-logs_${Date.now()}`, "application/x-ndjson", "ndjson");
        log.info("DEV", "Fichier de logs téléchargé");
      })
      .catch((err) => log.error("DEV", `Échec du téléchargement des logs : ${err}`));
    Settings.stored["development"].parameters["downloadlog"] = 0;
    Settings.storageSet();
  }
}

/* █▀▀ █▀▄▀█ █▀█ █▀▄ █ █ █   █▀▀ █▀█ █ █ █▄ █ █▄ █ █▀▀ █▀█ */
/* █▄█ █ ▀ █ █▄█ █▄▀ █▄█ █▄▄ █▀▄ █▄█ █▄█ █ ▀█ █ ▀█ ██▄ █▀▄ */

/**
 * Dispatcher central qui enregistre les modules fonctionnels et gère leur cycle de vie
 * en fonction de l'état des groupes de paramètres.
 * @namespace ModuleRunner
 * @property {Object} _registry - Dictionnaire des modules enregistrés indexés par groupId.
 */
var ModuleRunner = {
  _registry: {},

  /**
   * Enregistre un module fonctionnel dans le runner.
   * Le module doit exposer au minimum : { groupId, start(params), onParamChange(id, newVal, oldVal) }.
   * @param {{ groupId: string, start: function, onParamChange: function, _teardown?: function }} module
   */
  register(module) {
    this._registry[module.groupId] = module;
    log.info("RUNNER", `Module enregistré — groupId=${module.groupId}`);
  },

  /**
   * Démarre tous les modules enregistrés selon l'état courant des paramètres.
   * Pose/retire l'attribut HTML group-<groupId>-active pour le CSS conditionnel.
   * Appelé une seule fois après la résolution de settingsReady.
   */
  startAll() {
    log.info("RUNNER", `Démarrage — ${Object.keys(this._registry).length} module(s) enregistré(s)`);

    for (const [groupId, module] of Object.entries(this._registry)) {
      const groupData = Settings.stored[groupId];
      const isActive = groupData?.actived !== false;
      const params = groupData?.parameters ?? {};

      document.documentElement.toggleAttribute(`group-${groupId}-active`, isActive);

      if (!isActive) {
        log.warn("RUNNER", `${groupId} inactif — ignoré`);
        continue;
      }

      try {
        module.start(params);
        log.info("RUNNER", `${groupId} démarré`);
      } catch (err) {
        log.error("RUNNER", `Échec du démarrage de ${groupId} : ${err}`);
      }
    }

    const devParams = Settings.stored?.development?.parameters;
    if (devParams?.dev === true) {
      devModeActive = true;
      log.info("DEV", "Mode débugage activé au démarrage");
    }
  },

  /**
   * Dispatche un changement de paramètre vers le module concerné.
   * Gère aussi l'activation/désactivation dynamique d'un groupe.
   * @param {string} groupId   - Identifiant du groupe.
   * @param {string} paramId   - Identifiant du paramètre modifié.
   * @param {*}      newValue  - Nouvelle valeur.
   * @param {*}      oldValue  - Ancienne valeur.
   */
  onSettingChange(groupId, paramId, newValue, oldValue) {
    log.debug("RUNNER", `Changement — ${groupId}.${paramId}: ${JSON.stringify(oldValue)} → ${JSON.stringify(newValue)}`);

    if (groupId === "development") {
      developmentParamHandler(paramId, newValue);
      return;
    }

    const module = this._registry[groupId];
    if (!module?.onParamChange) return;

    if (!document.documentElement.hasAttribute(`group-${groupId}-active`)) return;

    try {
      module.onParamChange(paramId, newValue, oldValue);
    } catch (err) {
      log.error("RUNNER", `Erreur onParamChange ${groupId}.${paramId} : ${err}`);
    }
  },
};

// Démarre les modules dès que les paramètres sont chargés
settingsReady
  .then(() => ModuleRunner.startAll())
  .catch((err) => log.error("RUNNER", `Erreur lors du démarrage des modules : ${err}`));

// Écoute les changements de paramètres depuis le popup ou d'autres onglets
browserStorageOnChanged.addListener((changes) => {
  if (!changes.settings) return;
  const oldSettings = changes.settings.oldValue;
  const newSettings = changes.settings.newValue;
  if (!oldSettings || !newSettings) return;

  for (const groupId in newSettings) {
    const oldGroup = oldSettings[groupId];
    const newGroup = newSettings[groupId];
    if (!oldGroup || !newGroup) continue;

    if (oldGroup.actived !== newGroup.actived) {
      ModuleRunner.onSettingChange(groupId, "actived", newGroup.actived, oldGroup.actived);
    }

    for (const paramId in (newGroup.parameters ?? {})) {
      const oldParam = oldGroup.parameters?.[paramId];
      const newParam = newGroup.parameters[paramId];
      if (JSON.stringify(oldParam) !== JSON.stringify(newParam)) {
        ModuleRunner.onSettingChange(groupId, paramId, newParam, oldParam);
      }
    }
  }
});
