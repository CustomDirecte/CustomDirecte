/**
 * @fileOverview Gestion des groupes et paramètres de l'extension CustomDirecte.
 *
 * C'est ici que l'on peut ajouter des groupes et des paramètres.
 * Chaque groupe contient des paramètres, qui permettent de personnaliser l'expérience utilisateur.
 * Les groupes peuvent être activés ou désactivés.
 * Les groupes d'actions sont des groupes spéciaux qui ne peuvent pas être désactivés.
 * Les groupes d'actions contiennent des boutons ou des options à comportements spécifiques.
 *
 * Les paramètres sont de types variés et permettent de personnaliser l'expérience.
 *
 * Chaque paramètre ou groupe est généré automatiquement dans l'interface et dispose de systèmes de vérification et de protection.
 *
 * @author Bastian NOEL
 */

const customizations = new Group("customizations", "swatchbook", "Personnalisation", "Paramètres de personnalisation", true);

new Switch(customizations, "customization", "sidebar", "Activer les options de personnalisation", "Permet l'activation des options de personnalisation", true, true);
new Switch(customizations, "darkmode", "sidebar", "Activer le mode sombre", "L'ensemble du site sera sombre, utile la nuit !", false, false);
new ColorSelector(customizations, "colorCustomization", "sidebar", "Couleur", "Couleur", 340, false);
new CustomSelector(
  customizations,
  "cornerCustomization",
  "sidebar",
  "Angle des coins",
  "Angle des coins",
  "none",
  [
    { id: "none", name: "Aucune", style: { first: "border-radius: 0px;" } },
    { id: "thin", name: "Fin", style: { first: "border-radius: 10px;" } },
    { id: "wide", name: "Large", style: { first: "border-radius: 20px;" } },
  ],
  false
);
new CustomSelector(
  customizations,
  "fontCustomization",
  "sidebar",
  "Police d'écriture",
  "Police d'écriture",
  "tahoma",
  [
    { id: "tahoma", name: "Tahoma", style: { third: "font-family: var(--font-comicSans);" } },
    { id: "roboto", name: "Roboto", style: { third: "font-family: var(--font-roboto);" } },
    { id: "poppin", name: "Poppin", style: { third: "font-family: var(--font-poppin);" } },
    { id: "openSans", name: "Open Sans", style: { third: "font-family: var(--font-openSans);" } },
    { id: "openDyslexic", name: "Open Dyslexic", style: { third: "font-family: var(--font-comicSans);" } },
    { id: "montserrat", name: "Montserrat", style: { third: "font-family: var(--font-montserrat);" } },
    { id: "merriweather", name: "Merriweather", style: { third: "font-family: var(--font-merriweather);" } },
    { id: "leckerliOne", name: "Leckerli One", style: { third: "font-family: var(--font-leckerliOne);" } },
    { id: "inter", name: "Inter", style: { third: "font-family: var(--font-openDyslexic);" } },
    { id: "comicSans", name: "Comic Sans", style: { third: "font-family: var(--font-comicSans);" } },
  ],
  false
);

const development = new ActionGroup("development", "gear", "Développement", "Paramètres de développement");

new Switch(development, "dev", "sidebar", "Activer les logs", "Active les logs pour le débuggage", false, true);
new Button(development, "downloadlog", "sidebar", "Télécharger les logs", "Télécharger les logs", false, false);

/*
 * Initialisation des paramètres
 *
 * NE PAS SUPPRIMER CETTE FONCTION
 * NE PAS CRÉER DE GROUPE OU DE PARAMÈTRE APRÈS CETTE FONCTION
 *
 * Cette fonction est appelée pour initialiser les paramètres de l'extension.
 * Elle crée les groupes de paramètres et les paramètres individuels.
 */
genSettings();
