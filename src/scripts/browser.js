// log.script("BROWSER.JS");

/**
 * @fileOverview Ce fichier contient les focntion relatives au navigateur.
 * @author Bastian NOEL
 */

/* IMPORT CHROME LIB */
browser = chrome;
browserStorage = browser.storage.sync;
browserVersion = browser.runtime.getManifest().version;
browserStorageOnChanged = browser.storage.sync.onChanged;
browserRuntime = browser.runtime;
/* ----------------- */
