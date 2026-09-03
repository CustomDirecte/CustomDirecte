/**
 * Registre des interfaces disponibles dans le popup.
 * Une interface est une factory qui retourne un adaptateur prêt à être utilisé.
 *
 * Ce fichier est le seul endroit qui connaît la stratégie de sélection d'une
 * interface. Le contrôleur du popup ne connaît ainsi ni nom de fallback, ni
 * sélecteur, ni détail de présentation.
 */
window.popupInterfaceConfig = Object.freeze({
  storageKey: "interface",
  defaultId: "classic"
});

window.popupInterfaceRegistry = Object.create(null);

window.registerPopupInterface = function (id, factory) {
  if (typeof id !== "string" || !id) throw new TypeError("L'identifiant d'une interface popup est obligatoire");
  if (typeof factory !== "function") throw new TypeError(`La factory de l'interface popup « ${id} » est invalide`);
  window.popupInterfaceRegistry[id] = factory;
};

window.createPopupInterface = async function (requestedId) {
  const id = requestedId || window.popupInterfaceConfig.defaultId;
  const factory = window.popupInterfaceRegistry[id] || window.popupInterfaceRegistry[window.popupInterfaceConfig.defaultId];
  if (!factory) throw new Error(`Interface popup indisponible : ${id}`);

  const adapter = await factory();
  if (!adapter || typeof adapter.render !== "function") {
    throw new TypeError(`L'interface popup « ${id} » ne fournit pas de méthode render()`);
  }
  return adapter;
};
