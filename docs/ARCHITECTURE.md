# Architecture

## Chargement

`src/manifest.json` charge les scripts dans cet ordre :

1. `scripts/browser.js` expose les APIs navigateur ;
2. `scripts/log.js` initialise les logs ;
3. `core/settings/` déclare le modèle et les paramètres ;
4. `scripts/main.js` démarre `ModuleRunner` ;
5. les modules de `src/modules/` s’enregistrent et démarrent.

Les modules actifs sont :

- `customizationModule.js` : thème, favicon et DarkReader ;
- `sidebarModule.js` : barre latérale EcoleDirecte ;
- `noteTableModule.js` : moyennes, notes custom et bouton BAC.

## Paramètres

Les groupes sont déclarés dans `src/core/settings/parameters.js`. Le modèle est indépendant du DOM. Les interfaces lisent ce modèle et appellent `exportValue()` pour sauvegarder les changements dans `browser.storage.sync`.

Types disponibles : `Switch`, `Button`, `RowSelector`, `CustomSelector`, `MultiRowSelector` et `ColorSelector`.

## Popup

Le point d’entrée est `src/pages/popup/interface.html`. Le registre sélectionne un adaptateur selon `interfaceStyle` :

- `interfaces/classic/adapter.js` utilise les templates Tailwind ;
- `interfaces/legacy/adapter.js` réutilise l’apparence historique avec le modèle actuel.

Les sources visuelles sont dans `popup-tooling/`. Après toute modification des templates ou classes Tailwind :

```bash
npm run popup:build
```

Ne pas modifier directement `src/pages/popup/interface.css` : c’est un fichier généré.

## Calculateur BAC

Les sources exactes du calculateur sont dans `src/pages/bac/source/`. Le build Vite produit `src/pages/bac/sidebar.html` et ses assets.

```bash
npm run bac:build
```

`noteTableModule.js` rend les moyennes du tableau glissables. Les champs du side panel BAC acceptent le dépôt et mettent à jour le calcul immédiatement.

## Règles de modification

- garder le modèle de paramètres sans accès au DOM ;
- mettre le comportement EcoleDirecte dans un module ;
- préfixer les nouvelles classes injectées avec `cd-` ;
- modifier les sources de `popup-tooling/`, jamais les fichiers générés seuls ;
- lancer la validation et les vérifications JavaScript avant livraison.
