const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const failures = [];

function read(relativePath) {
  const absolutePath = path.join(root, relativePath);
  if (!fs.existsSync(absolutePath)) {
    failures.push(`Fichier manquant : ${relativePath}`);
    return "";
  }
  return fs.readFileSync(absolutePath, "utf8");
}

function assert(condition, message) {
  if (!condition) failures.push(message);
}

const core = read("src/core/settings/settings.js");
const parameters = read("src/core/settings/parameters.js");
const controller = read("src/pages/popup/interface.js");
const adapter = read("src/pages/popup/interfaces/classic/adapter.js");
const templates = read("popup-tooling/classic/templates.html");
const legacyAdapter = read("src/pages/popup/interfaces/legacy/adapter.js");
const legacyTemplates = read("popup-tooling/legacy/templates.html");
const legacyStyles = read("popup-tooling/legacy/interface.css");
const popupHtml = read("src/pages/popup/interface.html");
const bacPage = read("src/pages/bac/sidebar.html");
const bacSource = read("src/pages/bac/source/App.jsx");
const noteModule = read("src/modules/noteTableModule.js");
const manifestText = read("src/manifest.json");
const packageText = read("package.json");
const buildScript = read("dev/build-popup.js");

assert(
  !/(document|querySelector|innerHTML|outerHTML|classList|setAttribute|createElement|addEventListener)/.test(core),
  "Le cœur des paramètres contient une référence DOM."
);
assert(!/popupInterface|popup|\bui\s*:/.test(core), "Le cœur des paramètres connaît la configuration d'une interface.");
assert(
  !/(document|querySelector|innerHTML|outerHTML|classList|setAttribute|createElement|addEventListener)/.test(controller),
  "Le contrôleur du popup contient une référence DOM."
);
const htmlTag = /<(?:div|span|button|input|template|svg|img|p|h[1-6]|label|ul|li|hr)\b/i;
assert(!htmlTag.test(core), "Le cœur des paramètres contient du HTML inline.");
assert(!htmlTag.test(controller), "Le contrôleur du popup contient du HTML inline.");
assert(adapter.includes("registerPopupInterface(\"classic\""), "L'adaptateur classic n'est pas enregistré.");
assert(legacyAdapter.includes("registerPopupInterface(\"legacy\""), "L'adaptateur legacy n'est pas enregistré.");
assert(legacyAdapter.includes("Group.reloadingNeeded"), "L'adaptateur legacy ne reflète pas l'état Actualiser.");
assert(legacyStyles.includes(".optionBox"), "Le CSS legacy original n'est pas présent dans les sources.");
assert(legacyAdapter.includes("legacy-interface"), "L'adaptateur legacy n'isole pas son interface.");
assert(popupHtml.includes("interfaces/legacy/adapter.js"), "Le point d'entrée popup ne charge pas l'adaptateur legacy.");
assert(!fs.existsSync(path.join(root, "popup-tooling/legacy/interface.js")), "L'ancien JavaScript legacy est encore présent.");
assert(!fs.existsSync(path.join(root, "popup-tooling/current")), "L'ancien dossier popup-tooling/current existe encore.");
assert(!adapter.includes("querySelector(\".parameter-options\")"), "Le rendu des options utilise encore le sélecteur descendant fragile.");
assert(parameters.includes('new Group("interface"'), "Le groupe de configuration des interfaces est absent.");
assert(parameters.includes('"interfaceStyle"'), "Le paramètre de sélection d'interface est absent.");
assert(parameters.includes('"bacCalculator"'), "L'option du calculateur du bac est absente du groupe Notes.");
assert(bacPage.includes("assets/") && bacSource.includes("Calculateur du bac"), "Le calculateur du bac n'est pas intégré.");
assert(noteModule.includes("cd-bac-draggable-average") && noteModule.includes("application/x-customdirecte-average"), "Les moyennes du tableau ne sont pas glissables vers le BAC.");
assert(bacSource.includes("readDraggedAverage") && bacSource.includes("data-bac-drop-target"), "Les champs du calculateur BAC n'acceptent pas le glisser-déposer.");

for (const match of popupHtml.matchAll(/<script[^>]+src=["']([^"']+)["']/gi)) {
  const source = match[1];
  if (/^(?:https?:|\/\/|data:)/i.test(source)) continue;
  const scriptPath = path.normalize(path.join(root, "src/pages/popup", source));
  assert(fs.existsSync(scriptPath), `Script du popup introuvable : ${source}`);
}

for (const templateId of [
  "classic-navbar-item",
  "classic-home-row",
  "classic-group-tab",
  "classic-parameter",
  "classic-tooltip",
  "classic-options-row",
  "classic-option",
  "classic-custom-option",
  "classic-color-option",
]) {
  assert(new RegExp(`<template\\s+id=[\"']${templateId}[\"']`).test(templates), `Template manquant : ${templateId}`);
}

try {
  const manifest = JSON.parse(manifestText);
  const contentScripts = manifest.content_scripts?.flatMap((entry) => entry.js || []) || [];
  assert(contentScripts.includes("/core/settings/settings.js"), "Le manifest ne charge pas le cœur des paramètres.");
  assert(contentScripts.includes("/core/settings/parameters.js"), "Le manifest ne charge pas la déclaration des paramètres.");
  assert(!contentScripts.includes("/scripts/settings.js"), "L'ancien chemin scripts/settings.js est encore déclaré.");
  assert(!contentScripts.includes("/scripts/parameters.js"), "L'ancien chemin scripts/parameters.js est encore déclaré.");

  const resources = manifest.web_accessible_resources?.flatMap((entry) => entry.resources || []) || [];
  assert(resources.includes("/pages/popup/interfaces/classic/templates.html"), "Les templates classic ne sont pas accessibles à l'extension.");
  assert(resources.includes("/pages/popup/interfaces/legacy/templates.html"), "Les templates legacy ne sont pas accessibles à l'extension.");
  assert(resources.includes("/pages/popup/interfaces/legacy/interface.css"), "Les styles legacy ne sont pas accessibles à l'extension.");
  assert(resources.includes("/pages/bac/sidebar.html"), "Le panneau du calculateur n'est pas déclaré dans le manifest.");
  assert(manifest.icons?.["16"] === "/icons/EcoleDirecte/default/icon16.png", "Le chemin de l'icône 16px du manifeste est invalide.");
  assert(fs.existsSync(path.join(root, "src/icons/EcoleDirecte/default/icon16.png")), "L'icône 16px déclarée n'existe pas dans src.");
} catch (error) {
  failures.push(`Manifest invalide : ${error.message}`);
}

try {
  const packageJson = JSON.parse(packageText);
  assert(packageJson.scripts?.["popup:build"] === "node dev/build-popup.js", "Le script npm popup:build n'utilise pas le générateur central.");
  assert(packageJson.scripts?.["popup:validate"] === "node dev/validate-popup-architecture.js", "Le script npm popup:validate est absent ou incohérent.");
  assert(packageJson.scripts?.["popup:preview:classic"] === "node dev/preview-popup.js classic", "La preview classic est absente ou incohérente.");
  assert(packageJson.scripts?.["popup:preview:legacy"] === "node dev/preview-popup.js legacy", "La preview legacy est absente ou incohérente.");
} catch (error) {
  failures.push(`package.json invalide : ${error.message}`);
}

assert(buildScript.includes('path.join(root, "popup-tooling", "classic")'), "Le build ne pointe pas vers popup-tooling/classic.");
assert(buildScript.includes('path.join(root, "popup-tooling", "legacy")'), "Le build ne synchronise pas popup-tooling/legacy.");
assert(new RegExp(`<template\\s+id=["']legacy-header["']`).test(legacyTemplates), "Template legacy-header manquant.");
assert(new RegExp(`<template\\s+id=["']legacy-parameter["']`).test(legacyTemplates), "Template legacy-parameter manquant.");

if (failures.length) {
  console.error("Validation popup échouée :");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exitCode = 1;
} else {
  console.log("Validation popup OK : cœur découplé, templates présents, registre et manifest cohérents.");
}
