/**
 * @fileOverview Gestion des logs de l'extension.
 * @author Bastian NOEL
 */

/* █▀▀ █▀▀ █▀ ▀█▀ █ █▀█ █▄ █   █▀▄ █▀▀ █▀   █   █▀█ █▀▀ █▀ */
/* █▄█ ██▄ ▄█  █  █ █▄█ █ ▀█   █▄▀ ██▄ ▄█   █▄▄ █▄█ █▄█ ▄█ */

/* GLOBALS INTENTIONNELS — partagés entre content scripts injectés séquentiellement */
/* eslint-disable no-implicit-globals */

// Vérification de l'environnement d'exécution
var isBackground = typeof isBackground !== "undefined" ? isBackground : false;
var isPopup = location.protocol === "chrome-extension:";
const scriptType = isBackground ? "background" : isPopup ? "popup" : "ed";

// Génération d'un ID de console unique
consoleID = Math.random().toString(36).slice(2, 5);

// Horodatage de démarrage de la session
_logStart = Date.now();

// Contrôle l'affichage des messages de niveau DBG dans la console
devModeActive = false;

// Stockage des entrées de log structurées
devLogs = [];
devLoggerQueue = [];

// Styles console
headerStyle = (size = false) => `color:#ff9800; font-weight: bold; ${size ? `font-size: ${size}px;` : ""}`;
consoleIDStyle = (size = false) => `color:#CC7900; font-weight: bold; ${size ? `font-size: ${size}px;` : ""}`;

// Titre: CustomDirecte
console.log(`%cCustomDirecte [${scriptType.toUpperCase()}-${consoleID}]`, "font-size: 20px; color:#C8194A; font-weight: bold;");

/* ---- Fonctions internes ---- */

// Récupère fichier.js:ligne de l'appelant réel via la call stack V8.
// Profondeur : stack[0]=Error, [1]=_getCaller, [2]=_push, [3]=appelant réel
function _getCaller() {
  try {
    const stack = new Error().stack.split("\n");
    const line = stack[3] || "";
    const m = line.match(/([^/\\]+\.js):(\d+)/);
    return m ? `${m[1]}:${m[2]}` : "?";
  } catch {
    return "?";
  }
}

/**
 * Crée une entrée de log structurée, la stocke localement et la transmet au background pour centralisation.
 * @param {string} lvl - Niveau de log : "INFO", "WARN", "ERR", "DBG".
 * @param {string} mod - Identifiant du module source (ex : "INIT", "NOTETABLE", "RUNNER").
 * @param {string} msg - Message de log.
 */
function _push(lvl, mod, msg) {
  const now = Date.now();
  const entry = {
    t: now - _logStart,
    ts: now,
    ctx: scriptType === "background" ? "BG" : scriptType === "popup" ? "POP" : "ED",
    lvl,
    mod: (mod || "CORE").toUpperCase(),
    src: _getCaller(),
    msg: String(msg),
  };
  if (!isBackground && !isPopup && typeof location !== "undefined") entry.url = location.pathname;
  devLogs.push(entry);
  devLoggerQueue.push(entry);

  if ((devModeActive || lvl === "ERR") && lvl !== "SET") {
    const _styles = { "INFO": "color:#4fc3f7;font-weight:bold;", "WARN": "color:#ffb74d;font-weight:bold;", "ERR": "color:#ef5350;font-weight:bold;", "DBG": "color:#b0bec5;" };
    const _icons = { "INFO": "ℹ", "WARN": "⚠", "ERR": "✖", "DBG": "·" };
    console.log(`%c${_icons[lvl] ?? "·"} [${entry.mod}]%c ${entry.msg} %c+${String(entry.t).padStart(5, "0")}ms ${entry.src}`, _styles[lvl] || "color:#fff;font-weight:bold;", "color:inherit;", "color:#888;font-size:10px;");
  }

  if (!isBackground) {
    try { browserRuntime.sendMessage({ type: "CD_LOG", entry }); } catch { /* background inactif */ }
  }
}

/**
 * Construit le contenu complet d'un fichier de log au format NDJSON.
 * Première ligne : objet meta { _meta, format, session, sessionEnd, version, consoleId }.
 * Lignes suivantes : une entrée JSON par log.
 * @param {{ t: number, ts: number, ctx: string, lvl: string, mod: string, src: string, msg: string, url?: string }[]} entries - Entrées triées.
 * @returns {string} Contenu prêt à être téléchargé.
 */
function buildLogFile(entries) {
  const meta = {
    _meta: true,
    format: "CDL2",
    session: _logStart,
    sessionEnd: Date.now(),
    version: browserVersion,
    consoleId: consoleID,
  };
  return [JSON.stringify(meta), ...entries.map((e) => JSON.stringify(e))].join("\n");
}

/* ---- Fonctions publiques ---- */

/**
 * Affiche le nom du script en cours d'exécution dans la console.
 * @param {string} script - Nom du script.
 */
function scriptLogger(script) {
  console.log(`%c[${script}] %c[${consoleID}] %cScript en cours d'exécution`, headerStyle(), consoleIDStyle(), "color:#00bcd4; font-weight: normal;");
}

/**
 * Affiche les changements de paramètres dans la console avec mise en forme colorée.
 * @param {string} parameterId          - Identifiant du paramètre.
 * @param {any}    oldParameterSettings - Ancienne valeur du paramètre.
 * @param {any}    parameterSettings    - Nouvelle valeur du paramètre.
 * @param {string} parameterType        - Type de paramètre (ex : "groupe", "paramètre").
 */
function settingUpdateLogger(parameterId, oldParameterSettings, parameterSettings, parameterType) {
  if (isBackground || isPopup) return;
  const baseStyle = "font-size: 10px; font-weight: bold;";
  const neutralStyle = "font-size: 10px; color:#921ebd; font-weight: normal;";
  const parameterIdStyle = `color:#CA71EB; ${baseStyle}`;
  const getBooleanStyleAndSymbol = (value) => {
    if (typeof value !== "boolean") return { style: parameterIdStyle, symbol: value };
    const style = value ? `color:#a2ff99; ${baseStyle}` : `color:#e64e53; ${baseStyle}`;
    const symbol = value ? "✓" : "✗";
    return { style, symbol };
  };
  const oldParam = getBooleanStyleAndSymbol(oldParameterSettings);
  const newParam = getBooleanStyleAndSymbol(parameterSettings);
  _push("SET", "SETTINGS", `${parameterType} "${parameterId}" : ${oldParam.symbol} → ${newParam.symbol}`);
  if (!devModeActive) return;
  console.log(
    `%c⚙ [SETTINGS]%c ${parameterType} %c"${parameterId}"%c : %c${oldParam.symbol}%c → %c${newParam.symbol} %c+${String(Date.now() - _logStart).padStart(5, "0")}ms`,
    "color:#CA71EB;font-weight:bold;",
    "color:#921ebd;font-size:10px;",
    parameterIdStyle,
    "color:#921ebd;font-size:10px;",
    oldParam.style,
    "color:#921ebd;font-size:10px;",
    newParam.style,
    "color:#888;font-size:10px;",
  );
}

/**
 * Affiche le déclenchement d'un bouton dans la console avec mise en forme colorée.
 * @param {string} parameterId - Identifiant du paramètre bouton.
 */
function settingActionLogger(parameterId) {
  if (isBackground || isPopup) return;
  _push("SET", "SETTINGS", `Action "${parameterId}" déclenchée`);
  if (!devModeActive) return;
  console.log(
    `%c⚙ [SETTINGS]%c Action %c"${parameterId}"%c ▶ déclenché`,
    "color:#CA71EB;font-weight:bold;",
    "color:#921ebd;font-size:10px;",
    "color:#CA71EB;font-size:10px;font-weight:bold;",
    "color:#4fc3f7;font-size:10px;font-weight:bold;",
  );
}

/**
 * Objet centralisant toutes les fonctions de log de l'extension.
 * @namespace log
 * @property {function} script        - Affiche la bannière de chargement d'un fichier script.
 * @property {function} settingUpdate - Affiche les changements de paramètres dans la console.
 * @property {function} module        - Log de démarrage d'un module (niveau INFO, stocké + transmis).
 * @property {function} info          - Log d'information générale (stocké + transmis).
 * @property {function} warn          - Log d'avertissement (stocké + transmis).
 * @property {function} error         - Log d'erreur (stocké + transmis + console.error).
 * @property {function} debug         - Log de débugage (affiché uniquement si devModeActive est vrai).
 * @property {function} dev           - Compatibilité ascendante — redirige vers debug.
 */
log = {
  script: scriptLogger,
  settingUpdate: settingUpdateLogger,
  settingAction: settingActionLogger,
  /**
   * @param {string} mod - Identifiant du module (ex : "NOTETABLE").
   * @param {string} msg - Message de log.
   */
  module(mod, msg) { _push("INFO", mod, msg); },
  /**
   * @param {string} mod - Identifiant du module.
   * @param {string} msg - Message de log.
   */
  info(mod, msg) { _push("INFO", mod, msg); },
  /**
   * @param {string} mod - Identifiant du module.
   * @param {string} msg - Message de log.
   */
  warn(mod, msg) { _push("WARN", mod, msg); },
  /**
   * @param {string} mod - Identifiant du module.
   * @param {string} msg - Message d'erreur.
   */
  error(mod, msg) { _push("ERR", mod, msg); console.error(`[${mod}] ${msg}`); },
  /**
   * @param {string} mod - Identifiant du module.
   * @param {string} msg - Message de débugage.
   */
  debug(mod, msg) { if (devModeActive) { _push("DBG", mod, msg); } },
  /** @deprecated Utiliser log.debug() à la place. */
  dev(message) { _push("DBG", "CORE", message); },
  /**
   * Stocke un snapshot HTML anonymisé dans devLogs (pas de console, pas de relay background).
   * @param {string} mod - Identifiant du module source.
   * @param {string} html - Contenu HTML anonymisé à capturer.
   */
  snap(mod, html) {
    if (isBackground || isPopup) return;
    const now = Date.now();
    const entry = {
      t: now - _logStart,
      ts: now,
      ctx: "ED",
      lvl: "SNAP",
      mod: (mod || "CORE").toUpperCase(),
      src: _getCaller(),
      msg: "Snapshot HTML",
      html,
    };
    devLogs.push(entry);
  },
};

log.script("LOG.JS");
