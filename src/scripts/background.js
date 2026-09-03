/**
 * @fileOverview Gestion du script de fond de l'extension CustomDirecte.
 * Centralise les logs de tous les contextes (ED, POP) et gère le téléchargement CDL1.
 * @author Bastian NOEL
 */

var isBackground = true;
importScripts(chrome.runtime.getURL("scripts/browser.js"));
importScripts(chrome.runtime.getURL("scripts/log.js"));

log.script("BACKGROUND.JS");

/* GLOBALS INTENTIONNELS — partagés dans le service worker */
/* eslint-disable no-implicit-globals */

// Synchronise devModeActive depuis le storage dès l'init du background
chrome.storage.sync.get("settings", (data) => {
  if (data?.settings?.development?.parameters?.dev === true) devModeActive = true;
});

// Logs émis directement par le background
bgDevLogs = devLogs;

// Logs reçus des autres contextes (ED, POP) via CD_LOG
allDevLogs = [];

/**
 * Listener de messages runtime pour la collecte de logs et le téléchargement CDL1.
 * @param {{ type: string, entry?: object }} msg - Message reçu.
 * @returns {true|undefined}
 */
browser.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "CD_LOG" && msg.entry) {
    allDevLogs.push(msg.entry);
    return;
  }

  if (msg.type === "CD_DOWNLOAD_LOGS") {
    const contextLogs = Array.isArray(msg.contextLogs) ? msg.contextLogs : allDevLogs;
    const allEntries = [...bgDevLogs, ...contextLogs].sort((a, b) => a.t - b.t);
    sendResponse({ file: buildLogFile(allEntries) });
    return true;
  }

  if (msg.type === "CD_OPEN_BAC_CALCULATOR" && sender?.tab?.id !== undefined) {
    chrome.sidePanel.open({ tabId: sender.tab.id }).catch((error) => log.warn("BACKGROUND", `Impossible d'ouvrir le calculateur : ${error}`));
    return;
  }
});
