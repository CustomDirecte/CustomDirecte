# Documentation technique de CustomDirecte

Ce document décrit la structure du projet, le chargement de l’extension, les modules fonctionnels, le stockage des paramètres et le workflow de développement.

## Vue d’ensemble

CustomDirecte est une extension Chrome Manifest V3 injectée sur EcoleDirecte. Elle est organisée autour de quatre responsabilités :

- un modèle de paramètres indépendant de l’interface ;
- des modules injectés qui appliquent les fonctionnalités au site ;
- une interface de réglages avec plusieurs adaptateurs visuels ;
- un calculateur du bac chargé dans le side panel.

## Structure du projet

```text
src/
├── manifest.json                 Manifeste Chrome MV3 et ordre de chargement
├── core/
│   └── settings/                 Modèle, migration et définition des paramètres
├── modules/                      Fonctionnalités exécutées sur EcoleDirecte
│   ├── customizationModule.js    Personnalisation, thème et favicon
│   ├── sidebarModule.js          Barre latérale et interactions du menu
│   ├── noteTableModule.js        Notes, moyennes, notes custom et BAC
│   ├── popupManager.js           Campagnes de popup et suivi d’affichage
│   ├── popupConsoleBridge.js     Commandes de test depuis la console du site
│   └── popups/campaigns.js        Contenus éditoriaux des campagnes
├── pages/
│   ├── popup/                    Interface de réglages
│   │   ├── interface.html        Point d’entrée du popup
│   │   ├── interface.js          Initialisation et sélection d’adaptateur
│   │   └── interfaces/            Adaptateurs classic et legacy
│   └── bac/                      Application React du calculateur du bac
├── styles/                       CSS injectés dans EcoleDirecte
├── utils/                        Fonctions mathématiques et stockage des notes
├── scripts/                      Bootstrap, logs, background et bibliothèques
└── videos/                       Démonstrations utilisées par les popups

dev/
├── build-popup.js                Génération des ressources popup
├── preview-popup.js              Prévisualisation des interfaces
└── validate-popup-architecture.js Vérifications structurelles
```

## Chargement de l’extension

Le fichier `src/manifest.json` charge les scripts sur les pages EcoleDirecte dans cet ordre :

1. `scripts/browser.js` expose l’API navigateur utilisée par le projet ;
2. `scripts/log.js` initialise le système de logs ;
3. `core/settings/settings.js` initialise le modèle et la migration du stockage ;
4. `core/settings/parameters.js` déclare les groupes et les paramètres ;
5. `utils/` charge les fonctions partagées ;
6. `scripts/main.js` démarre le gestionnaire de modules ;
7. les modules de `src/modules/` s’enregistrent et appliquent leurs fonctionnalités ;
8. `popups/campaigns.js` puis `popupManager.js` gèrent les messages contextuels.

Le script `popupConsoleBridge.js` est injecté dans le monde principal afin d’exposer les commandes de test à la console du site. Le service worker `scripts/background.js` gère le contexte d’arrière-plan de l’extension.

## Paramètres et stockage

Les groupes sont déclarés dans `src/core/settings/parameters.js`. Le modèle est indépendant du DOM : les interfaces affichent les définitions existantes et les changements sont sauvegardés via `browser.storage.sync`.

Les types de paramètres disponibles sont : `Switch`, `Button`, `RowSelector`, `CustomSelector`, `MultiRowSelector` et `ColorSelector`.

Le stockage synchronisé contient principalement :

- `settings` : groupes, activation et valeurs des paramètres ;
- `version` : version du format de stockage, indépendante de la version de l’application ;
- les données nécessaires aux migrations depuis l’ancien format V0.

La migration doit toujours transformer l’ancien format vers le nouveau avant de supprimer ou remplacer l’ancien contenu, afin de limiter la durée pendant laquelle deux formats sont présents. Toute nouvelle clé ou tout nouvel identifiant de paramètre doit rester stable.

## Modules fonctionnels

### Personnalisation

`customizationModule.js` applique la couleur, la police, les bordures, le mode sombre, les styles personnalisés et le favicon. Les règles sont encapsulées dans `styles/customizations.css`.

### Barre latérale

`sidebarModule.js` construit la barre latérale, applique son thème, gère son verrouillage et ouvre le panneau de personnalisation. Les options de présentation sont pilotées par le groupe `sidebar`.

### Tableau des notes

`noteTableModule.js` ajoute ou adapte les éléments du tableau des notes :

- affichage et recalcul des moyennes ;
- gestion globale des notes custom ;
- ajout, modification et suppression des éléments custom ;
- glisser-déposer d’une moyenne vers les champs compatibles du BAC ;
- affichage du bouton d’ouverture du calculateur du bac.

Lorsque les notes custom sont désactivées, le module doit retirer leur logique et leurs résultats dérivés, pas seulement masquer les boutons.

## Interface de réglages

Le point d’entrée est `src/pages/popup/interface.html`. `interface.js` transmet les groupes et `versionInfo` au registre des interfaces.

Le registre sélectionne l’adaptateur selon `interfaceStyle` :

- `interfaces/classic/adapter.js` utilise les templates modernes générés depuis Tailwind ;
- `interfaces/legacy/adapter.js` conserve l’apparence historique tout en utilisant le modèle et le fonctionnement actuels.

Les templates et sources Tailwind se trouvent dans `popup-tooling/`. `src/pages/popup/interface.css` est généré : il ne faut pas le modifier directement comme source principale.

## Popup et campagnes

Le gestionnaire est dans `src/modules/popupManager.js` et les textes dans `src/modules/popups/campaigns.js`.

Les campagnes disponibles sont :

- `welcome` : première installation ;
- `update` : arrivée d’une nouvelle version pour une installation existante ;
- `reminder` : message après un nombre d’ouvertures et un délai minimum.

Le suivi compact est stocké dans le `localStorage` de la page EcoleDirecte : compteur d’ouvertures, date d’installation V3, dernière popup affichée, dernière action et compteurs par campagne. « Plus tard » conserve l’absence de validation et permet une nouvelle apparition selon les règles de la campagne.

Commandes disponibles depuis la console du site :

```js
CustomDirectePopups.show("welcome")
CustomDirectePopups.show("update")
CustomDirectePopups.show("reminder")
CustomDirectePopups.state()
CustomDirectePopups.reset()
```

## Calculateur du bac

Les sources du calculateur sont dans `src/pages/bac/source/` :

- `App.jsx` contient l’application et le calcul des résultats ;
- `main.jsx` monte l’application React ;
- `app.css` contient ses styles ;
- `sidebar.html` et `assets/` sont les fichiers produits par le build.

Le calculateur est chargé dans le side panel déclaré par le manifeste. Les moyennes envoyées depuis le tableau utilisent les événements de glisser-déposer et le format `application/x-customdirecte-average`.

## Commandes de développement

Prérequis : Node.js et npm.

```bash
npm install
npm run popup:build
npm run bac:build
npm run popup:validate
```

Prévisualisation des interfaces :

```bash
npm run popup:preview:classic
npm run popup:preview:legacy
```

Pour tester l’extension, charger le dossier `src/` dans Chrome via `chrome://extensions`, en activant le mode développeur.

## Règles de contribution

- conserver le modèle de paramètres sans accès au DOM ;
- placer le comportement EcoleDirecte dans un module dédié ;
- préfixer les classes injectées avec `cd-` ;
- modifier les sources de `popup-tooling/`, jamais uniquement les fichiers générés ;
- conserver la compatibilité avec les identifiants de stockage existants ;
- vérifier le mode classique et le mode legacy après toute modification d’interface ;
- lancer la validation, la vérification syntaxique et `git diff --check` avant une publication.

## Publication

Avant publication :

1. vérifier la version dans `src/manifest.json` ;
2. reconstruire le popup et le calculateur BAC ;
3. lancer `npm run popup:validate` ;
4. vérifier l’installation depuis `src/` ;
5. tester les paramètres, les notes custom, le side panel BAC et les popups ;
6. vérifier que le stockage existant est migré sans conserver inutilement deux formats ;
7. examiner les fichiers modifiés avant le commit et le push.
