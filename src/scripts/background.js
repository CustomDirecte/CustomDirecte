/**
 * @fileOverview Gestion du script de fond de l'extension CustomDirecte.
 * @author Bastian NOEL
 */

var isBackground = true;
importScripts(chrome.runtime.getURL("scripts/browser.js"));
importScripts(chrome.runtime.getURL("scripts/log.js"));
importScripts(chrome.runtime.getURL("scripts/settings.js"));
importScripts(chrome.runtime.getURL("scripts/parameters.js"));

log.script("BACKGROUND.JS");
