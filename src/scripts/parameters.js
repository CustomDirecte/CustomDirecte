/**
 * @fileOverview Gestion des groupes et paramètres de l’extension **CustomDirecte**.
 *
 * Ce module permet de définir et d’organiser les groupes de paramètres,
 * afin de personnaliser l’expérience utilisateur.
 *
 * - Chaque groupe contient un ensemble de paramètres configurables.
 * - Les groupes peuvent être activés ou désactivés.
 * - Les groupes d’actions sont particuliers :
 *    - Ils ne peuvent pas être désactivés.
 *    - Ils contiennent des boutons ou options avec un comportement spécifique.
 *
 * Les paramètres peuvent être de différents types et offrent une personnalisation fine.
 *
 * Tous les groupes et paramètres sont générés automatiquement dans l’interface
 * et disposent de mécanismes de vérification et de protection intégrés.
 *
 * @author Bastian NOEL
 */

const notesTable = new Group("notesTable", "chart-mixed", "Notes", "Paramètres du tableau des notes", true);

new Switch(notesTable, "noteTableAnalysis", "sidebar", "Activer l'analyse du tableau de notes", "Active les fonctionnalités ci-dessous", true, true);
new Switch(notesTable, "generalAverageDisplay", "sidebar", "Forcer l'affichage de la moyenne générale", "Force l'affichage des moyennes par matières", true, true);
new Switch(notesTable, "AveragesPerSubjectDisplay", "sidebar", "Forcer l'affichage des moyennes par matières", "Force l'affichage des moyennes par matières et les recalcule", true, true);
new Switch(notesTable, "ClassAveragesDisplay", "sidebar", "Afficher les moyennes de classe", "Affiche les moyennes de classe dans le tableau de notes", true, true);
new Switch(notesTable, "AveragesPerSubjectRecalculation", "sidebar", "Recalculer les moyennes par matières", "Force le recalcul des moyennes par matières", false, true, "Si votre établissement désactive les coeficients, les moyennes par matières ne seront pas correctes");
new RowSelector(
  notesTable,
  "AveragesColorIndicator",
  "sidebar",
  "Indicateurs colorés sur les moyennes par matières",
  "Indique à l’aide de couleurs si les moyennes réduisent ou augmentent la moyenne générale",
  "background",
  [
    { id: "none", name: "Aucun" },
    { id: "round", name: "Rond" },
    { id: "background", name: "Fond" },
    { id: "outline", name: "Contour" },
  ],
  false
);
new RowSelector(
  notesTable,
  "AveragesInfluenceTooltips",
  "sidebar",
  "Info-bulles indiquant l’influence des moyennes par matières",
  "Info-bulles qui affichent combien de points cette moyenne fait perdre/gagner à la moyenne générale",
  "textAndValue",
  [
    { id: "none", name: "Aucun" },
    { id: "value", name: "Valeur" },
    { id: "textAndValue", name: "Texte & Valeur" },
  ],
  false
);

const sidebar = new Group("sidebar", "sidebar", "Barre latérale", "Paramètres de la barre latérale", false);

new Switch(sidebar, "newSidebar", "sidebar", "Nouveau design pour la barre latérale", "Donne une allure moderne à la barre permettant l’ajout d’options", false, true);
new Switch(sidebar, "sidebarDarkmode", "sidebar", "Mode sombre pour la barre latérale", "Rend les couleurs de fond de la barre latérale plus sombres, pour une meilleure lisibilité", true, false);
new Switch(sidebar, "pinnedSidebar", "sidebar", "Laisser la barre latérale déployée en continu", "Empêche la barre latérale de se réduire lorsqu'elle n’est plus survolée par la souris", false, false);
new Switch(sidebar, "hideCustomizationButton", "sidebar", "Cacher le bouton de personnalisation", "Si cette option est activée, vous devez uiliser le bouton de la barre latérale pour accéder à ce menu", false, false);
new MultiRowSelector(
  sidebar,
  "customizationButton",
  "sidebar",
  "Style du bouton de personnalisation",
  "Changer le style du bouton de personnalisation pour vous correspondre au mieux",
  ["iconAndText", "ile"],
  [
    [
      { id: "icon", name: "Icon" },
      { id: "iconAndText", name: "Texte & Icon" },
    ],
    [
      { id: "ile", name: "En Île" },
      { id: "border", name: "En Bordure" },
    ],
  ],
  false
);

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
