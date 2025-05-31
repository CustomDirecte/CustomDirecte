/* IMPORT CHROME LIB */
browser = chrome;
browserStorage = browser.storage.sync;
browserVersion = browser.runtime.getManifest().version;
browserStorageOnChanged = browser.storage.sync.onChanged;
/* ----------------- */

/* █▀▀ █▀▀ █▀ ▀█▀ █ █▀█ █▄ █   █▀▄ █▀▀ █▀   █   █▀█ █▀▀ █▀ */
/* █▄█ ██▄ ▄█  █  █ █▄█ █ ▀█   █▄▀ ██▄ ▄█   █▄▄ █▄█ █▄█ ▄█ */

// Titre: CustomDirecte
console.log("%cCustomDirecte", "font-size: 20px; color:#C8194A; font-weight: bold;");

// Genération d'un ID de console unique
consoleID = Date.now().toString(36).slice(-3);

// VARIABLES
headerStyle = (size = false) => `color:#ff9800; font-weight: bold; ${size ? `font-size: ${size}px;` : ""}`;
consoleIDStyle = (size = false) => `color:#CC7900; font-weight: bold; ${size ? `font-size: ${size}px;` : ""}`;
devLogs = [];
devLoggerQueue = [];

// Fonction d'affichage

/**
 * Stocke les messages de debuggage.
 * @param {string} message
 */
function devLogger(message) {
  devLogs.push(message);
  devLoggerQueue.push(message);
}

/**
 * Affiche les changements de paramètres dans la console.
 * @param {string} parameterId - Identifiant du paramètre.
 * @param {any} oldParameterSettings - Anciennes valeurs des paramètres.
 * @param {any} parameterSettings - Nouvelles valeurs des paramètres.
 * @param {string} parameterType - Type de paramètre (par exemple, "groupe", "paramètre").
 */
function settingUpdateLogger(parameterId, oldParameterSettings, parameterSettings, parameterType) {
  // Ne pas afficher dans le script de fond
  if (typeof isBackground !== "undefined") return;

  // Style pour l'affichage dans la console
  const baseStyle = "font-size: 10px; font-weight: bold;";
  const neutralStyle = "font-size: 10px; color:#921ebd; font-weight: normal;";
  const parameterIdStyle = `color:#CA71EB; ${baseStyle}`;

  // Affichage des booléens avec style et symbole
  const getBooleanStyleAndSymbol = (value) => {
    if (typeof value !== "boolean") return { style: parameterIdStyle, symbol: value };
    const style = value ? `color:#a2ff99; ${baseStyle}` : `color:#e64e53; ${baseStyle}`;
    const symbol = value ? "✓" : "✗";
    return { style, symbol };
  };

  // Affichage booleen si le paramètre est un booléen
  const oldParam = getBooleanStyleAndSymbol(oldParameterSettings);
  const newParam = getBooleanStyleAndSymbol(parameterSettings);

  // Affichage dans la console
  console.log(`%c[SETTINGS] %c[${consoleID}] %c${parameterType} %c"${parameterId}" %cmodifié de %c"${oldParam.symbol}" %cà %c"${newParam.symbol}"`, headerStyle(10), consoleIDStyle(10), neutralStyle, parameterIdStyle, neutralStyle, oldParam.style, neutralStyle, newParam.style);
}

/**
 * Affiche le nom du script en cours d'exécution dans la console.
 * @param {string} script - Nom du script.
 */
function scriptLogger(script) {
  console.log(`%c[${script}] %c[${consoleID}] %cScripte en cours d'exécution`, headerStyle(), consoleIDStyle(), "color:#00bcd4; font-weight: normal;");
}

/**
 * Object qui regroupe les fonctions de log.
 * @property {function} script - Affiche le nom du script en cours d'exécution.
 * @property {function} console - Affiche un message dans la console.
 * @property {function} error - Affiche un message d'erreur dans la console.
 * @property {function} dev - Stocke les messages de debuggage.
 * @property {function} settingUpdate - Affiche les changements de paramètres dans la console.
 */
log = {
  script: scriptLogger,
  console: console.log,
  error: console.error,
  dev: devLogger,
  settingUpdate: settingUpdateLogger,
};

log.script("BROWSER.JS");
