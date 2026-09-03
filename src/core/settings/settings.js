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
   * Liste des réglages modifiés qui nécessitent un rechargement.
   * @type {string[]}
   */
  static reloadingNeeded = [];

  /** Valeurs présentes au chargement de l'interface, utilisées comme référence. */
  static reloadBaseline = new Map();

  static cloneReloadValue(value) {
    return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
  }

  static reloadKey(groupId, parameterId = undefined) {
    return parameterId === undefined ? `group:${groupId}` : `parameter:${groupId}.${parameterId}`;
  }

  static initializeReloadingState() {
    Group.reloadingNeeded = [];
    Group.reloadBaseline = new Map();
    Group.groups.forEach((group) => {
      Group.reloadBaseline.set(Group.reloadKey(group.id), Group.cloneReloadValue(group.actived));
      group.parameters.forEach((parameter) => {
        if (parameter.reloadingRequired) {
          Group.reloadBaseline.set(Group.reloadKey(group.id, parameter.id), Group.cloneReloadValue(parameter.value));
        }
      });
    });
  }

  static syncReloading(groupId, currentValue, parameterId = undefined) {
    const key = Group.reloadKey(groupId, parameterId);
    const baseline = Group.reloadBaseline.get(key);
    const changed = JSON.stringify(baseline) !== JSON.stringify(currentValue);
    const index = Group.reloadingNeeded.indexOf(key);

    if (changed && index === -1) Group.reloadingNeeded.push(key);
    if (!changed && index !== -1) Group.reloadingNeeded.splice(index, 1);
  }

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
    this.listeners = new Set();
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

  onChange(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  emitChange() {
    this.listeners.forEach((listener) => listener(this));
  }

  /**
   * Ajoute un paramètre au groupe.
   * @param {Parameter} parameter - Le paramètre à ajouter.
   */
  addParameter(parameter) {
    this.parameters.push(parameter);
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
    // Conserver les metadonnees qui ne sont pas des groupes sans leur donner
    // une signification metier. Cela permet aux couches externes d'ajouter
    // leur configuration sans coupler le modele a une interface particuliere.
    const stored = { ...Settings.stored };

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
    Group.initializeReloadingState();
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
          group.updateActived(group.defaultActived);
          Group.syncReloading(group.id, groupSettings.actived);
          group.emitChange();
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
            // Mettre à jour l'état de l'interface si la page a besion de recharger
            if (parameter.reloadingRequired) Group.syncReloading(group.id, parameter.value, parameter.id);
            // Notifier l'interface après la synchronisation du bouton de rechargement.
            parameter.emitChange();
          }
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
   */
  constructor(group, id, icon, name, description, type, defaultValue, reloadingRequired = false, warning = false) {
    super(id, icon, name, description);
    this.group = group;
    group.addParameter(this);
    this.type = type;
    this.reloadingRequired = reloadingRequired;
    this.warning = warning;
    this.defaultValue = defaultValue;
    this.listeners = new Set();
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

  onChange(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  emitChange() {
    this.listeners.forEach((listener) => listener(this));
  }

}

/** Représente un paramètre de type interrupteur. */
class Switch extends Parameter {
  constructor(group, id, icon, name, description, defaultValue = true, reloadingRequired = false, warning = false) {
    super(group, id, icon, name, description, "switch", defaultValue, reloadingRequired, warning);
  }

  importValue(defaultValue) {
    const value = Settings.stored[this.group.id]?.parameters[this.id];
    this.value = typeof value === "boolean" ? value : defaultValue;
  }
}

/** Représente un paramètre de type sélecteur en ligne. */
class RowSelector extends Parameter {
  constructor(group, id, icon, name, description, defaultValue, options, reloadingRequired = false, warning = false) {
    super(group, id, icon, name, description, "rowselector", defaultValue, reloadingRequired, warning);
    this.options = options;
  }

  importValue(defaultValue, options) {
    const value = Settings.stored[this.group.id]?.parameters[this.id];
    this.value = options.some((option) => option.id === value) ? value : defaultValue;
  }
}

/** Représente un paramètre de type sélecteur en ligne personnalisé. */
class CustomSelector extends Parameter {
  constructor(group, id, icon, name, description, defaultValue, options, reloadingRequired = false, warning = false) {
    super(group, id, icon, name, description, "customselector", defaultValue, reloadingRequired, warning);
    this.options = options;
  }

  importValue(defaultValue, options) {
    const value = Settings.stored[this.group.id]?.parameters[this.id];
    this.value = options.some((option) => option.id === value) ? value : defaultValue;
  }
}

/** Représente un paramètre de type sélecteur multi-lignes. */
class MultiRowSelector extends Parameter {
  constructor(group, id, icon, name, description, defaultValue, options, reloadingRequired = false, warning = false) {
    super(group, id, icon, name, description, "multirowselector", defaultValue, reloadingRequired, warning);
    this.options = options;
  }

  importValue(defaultValue, options) {
    const value = Settings.stored[this.group.id]?.parameters[this.id];
    if (!Array.isArray(value) || value.length !== options.length) {
      this.value = defaultValue;
      return;
    }
    this.value = options.every((row, index) => row.some((option) => option.id === value[index])) ? value : defaultValue;
  }
}

/** Représente un paramètre de type sélecteur de couleur. */
class ColorSelector extends Parameter {
  constructor(group, id, icon, name, description, defaultValue, reloadingRequired = false, warning = false) {
    super(group, id, icon, name, description, "colorselector", defaultValue, reloadingRequired, warning);
  }

  importValue(defaultValue) {
    const value = Settings.stored[this.group.id]?.parameters[this.id];
    this.value = Number.isInteger(value) && value >= 0 && value <= 360 ? value : defaultValue;
  }
}

/** Représente un paramètre de type bouton. */
class Button extends Parameter {
  constructor(group, id, icon, name, description, warning = false) {
    super(group, id, icon, name, description, "button", 0, false, warning);
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
