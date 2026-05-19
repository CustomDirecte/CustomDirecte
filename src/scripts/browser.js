/**
 * @fileOverview Ce fichier contient les globals relatifs à l'API Chrome/navigateur.
 * @author Bastian NOEL
 */

/* GLOBALS INTENTIONNELS — partagés entre content scripts injectés séquentiellement */
/* eslint-disable no-implicit-globals */

/* IMPORT CHROME LIB */
browser = chrome;
browserStorage = browser.storage.sync;
browserVersion = browser.runtime.getManifest().version;
browserStorageOnChanged = browser.storage.sync.onChanged;
browserRuntime = browser.runtime;
/* ----------------- */
// Note : log.script() n'est pas appelé ici car log.js est chargé après browser.js.
