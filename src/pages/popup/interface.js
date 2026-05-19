log.script("INTERFACE.JS");

/**
 * @fileOverview Lance la genération de l'interface utilisateur.
 * @author Bastian NOEL
 */

window.onload = async function () {
  try {
    await settingsReady;
    if (Settings.stored?.development?.parameters?.dev === true) devModeActive = true;
    Group.genInterface();
  } catch (error) {
    log.error("UI", `Erreur lors de l'initialisation de l'interface : ${error}`);
  }
};
