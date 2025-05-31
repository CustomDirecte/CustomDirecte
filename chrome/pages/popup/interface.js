log.script("INTERFACE.JS");

window.onload = async function () {
  try {
    await settingsReady;
    Group.genInterface();
  } catch (error) {
    console.error("Erreur lors de l'initialisation de l'interface :", error);
  }
};
