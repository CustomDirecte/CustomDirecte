/* IMPORT CHROME LIB */
browser = chrome;
browserStorage = browser.storage.sync;
browserVersion = browser.runtime.getManifest().version_name;
browserStorageOnChanged = browser.storage.sync.onChanged;
/* ----------------- */

importScripts("/scripts/schema.js");


// "lock" n'est volontairement pas persisté : il appartient au schéma, et une
// copie dans le storage devient périmée dès qu'une option change de module
function compactOption(defOpt, value) {
  return { option: defOpt.option, Value: value, Default: defOpt.Default };
}

function compactStorage(storedOptions) {
  return {
    options: defaultOptions.options.map((defOpt) => {
      const stored = storedOptions.find((o) => o.option === defOpt.option);
      const storedValue = stored ? stored.Value : null;
      let validValue = null;
      if (storedValue !== null) {
        if (defOpt.Options) {
          if (defOpt.Options.some((x) => x.Selection === storedValue)) validValue = storedValue;
        } else if (defOpt.MultiOptions) {
          validValue = defOpt.Default.map((def, i) =>
            storedValue?.[i] && defOpt.MultiOptions[i].some((x) => x.Selection === storedValue[i]) ? storedValue[i] : def
          );
        } else if (typeof defOpt.Default === "boolean" && typeof storedValue === "boolean") {
          validValue = storedValue;
        } else if (typeof defOpt.Default === "number" && !isNaN(Number(storedValue))) {
          validValue = storedValue;
        }
      }
      return compactOption(defOpt, validValue);
    }),
  };
}

function optionsCorrector() {
  browserStorage.get((syncOptions) => {
    if (syncOptions.options) {
      browserStorage.clear();
      browserStorage.set(compactStorage(syncOptions.options));
    } else {
      browserStorage.set(compactStorage([]));
    }
  });
}

browser.runtime.onInstalled.addListener((reason) => {
  if (reason.reason === browser.runtime.OnInstalledReason.INSTALL) {
    browserStorage.set(compactStorage([]));
  } else {
    optionsCorrector();
  }
});

optionsCorrector();
