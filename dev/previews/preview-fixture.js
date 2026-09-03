const option = (id, name) => ({ id, name });
const listenable = (value) => {
  const listeners = new Set();
  return {
    ...value,
    onChange(listener) { listeners.add(listener); return () => listeners.delete(listener); },
    emitChange() { listeners.forEach((listener) => listener(this)); },
    async exportValue(nextValue) {
      this.value = nextValue;
      Settings.stored[this.groupId].parameters[this.id] = nextValue;
      this.emitChange();
    },
  };
};

const previewGroups = [
  listenable({ id: "notesTable", icon: "chart-mixed", name: "Notes", description: "Paramètres du tableau des notes", actived: true, parameters: [] }),
  listenable({ id: "sidebar", icon: "sidebar", name: "Barre latérale", description: "Paramètres de la barre latérale", actived: false, parameters: [] }),
  listenable({ id: "interface", icon: "swatchbook", name: "Interface", description: "Choisissez le style de cette interface", actived: true, parameters: [] }),
];

const definitions = [
  { group: 0, id: "generalAverageDisplay", icon: "chart-mixed", name: "Moyenne générale", description: "Force l'affichage de la moyenne générale.", type: "switch", value: true, reloadingRequired: true },
  { group: 0, id: "lockedPreviewSwitch", icon: "lock", name: "Option verrouillée (preview)", description: "Cette option ne doit pas réagir aux clics.", type: "switch", value: false, locked: true },
  { group: 0, id: "AveragesColorIndicator", icon: "shapes", name: "Indicateur coloré", description: "Choisissez le style de l'indicateur.", type: "rowselector", value: "background", options: [option("none", "Aucun"), option("round", "Rond"), option("background", "Fond"), option("outline", "Contour")] },
  { group: 1, id: "customizationButton", icon: "swatchbook", name: "Bouton de personnalisation", description: "Choisissez deux variantes visuelles.", type: "multirowselector", value: ["iconAndText", "ile"], options: [[option("icon", "Icône"), option("iconAndText", "Texte & icône")], [option("ile", "En île"), option("border", "En bordure")]] },
  { group: 1, id: "fontCustomization", icon: "font-case", name: "Police d'écriture", description: "Prévisualisez la police de l'interface.", type: "customselector", value: "tahoma", options: [{ id: "tahoma", name: "Tahoma", style: { third: "font-family: Tahoma, sans-serif;" } }, { id: "roboto", name: "Roboto", style: { third: "font-family: Roboto, sans-serif;" } }] },
  { group: 2, id: "interfaceStyle", icon: "shapes", name: "Style de l'interface", description: "Sélectionnez l'interface du popup.", type: "rowselector", value: window.previewInterface, options: [option("classic", "Moderne"), option("legacy", "Classique")], reloadingRequired: true },
];

definitions.forEach((definition) => {
  const group = previewGroups[definition.group];
  const parameter = listenable({ ...definition, groupId: group.id, warning: false });
  group.parameters.push(parameter);
});

window.previewGroups = previewGroups;
window.Settings = { stored: {}, storageSet: async () => {} };
previewGroups.forEach((group) => {
  Settings.stored[group.id] = { actived: group.actived, parameters: {} };
  group.parameters.forEach((parameter) => { Settings.stored[group.id].parameters[parameter.id] = parameter.value; });
});
window.Group = { reloadingNeeded: [] };
window.browserVersion = "30.0.1";
window.tippy = () => {};
