log.script("INTERFACE.JS");

/**
 * @fileOverview Lance la genération de l'interface utilisateur.
 * @author Bastian NOEL
 */

window.onload = async function () {
  try {
    await settingsReady;
    Group.genInterface();
  } catch (error) {
    console.error("Erreur lors de l'initialisation de l'interface :", error);
  }
};
