/* IMPORT CHROME LIB */
browser = chrome;
browserStorage = browser.storage.sync;
browserVersion = browser.runtime.getManifest().version_name;
browserStorageOnChanged = browser.storage.sync.onChanged;
/* ----------------- */

consoleID = Date.now().toString(36).slice(-3);

const originalLog = console.log;
console.log = function (...args) {
  const stack = new Error().stack;
  const callerLine = stack.split("\n")[2].trim();
  const match = callerLine.match(/:(\d+):\d+\)?$/);
  const lineNumber = match ? match[1] : "inconnue";
  originalLog(`${consoleID} [${lineNumber}]: `, ...args);
};

console.log("BROWSER.JS");
