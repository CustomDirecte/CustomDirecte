log.script("BROWSER.JS");

/* IMPORT CHROME LIB */
browser = chrome;
browserStorage = browser.storage.sync;
browserVersion = browser.runtime.getManifest().version;
browserStorageOnChanged = browser.storage.sync.onChanged;
/* ----------------- */
