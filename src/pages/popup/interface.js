log.script("INTERFACE.JS");

/**
 * @fileOverview Lance la genération de l'interface utilisateur.
 * @author Bastian NOEL
 */

window.onload = async function () {
  try {
    await settingsReady;
    const interfaceId = Settings.stored?.[popupInterfaceConfig.storageKey]?.parameters?.interfaceStyle;
    const adapter = await createPopupInterface(interfaceId);
    if (Settings.stored?.development?.parameters?.dev === true) devModeActive = true;
    adapter.render(Group.groups, versionInfo);

    // Le choix de l’apparence concerne le popup lui-même : on recharge uniquement
    // cette page d’interface pour monter le nouvel adaptateur, sans recharger EcoleDirecte.
    const interfaceParameter = Group.groups
      .find((group) => group.id === popupInterfaceConfig.storageKey)
      ?.parameters.find((parameter) => parameter.id === "interfaceStyle");
    interfaceParameter?.onChange(() => window.location.reload());
  } catch (error) {
    log.error("UI", `Erreur lors de l'initialisation de l'interface : ${error}`);
  }
};
