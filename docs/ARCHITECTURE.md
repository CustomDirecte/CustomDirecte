# CustomDirecte - Architecture globale

Ce document explique comment l'extension est structuree dans son etat actuel : fichiers principaux, cycle de chargement, systeme de parametres, modules, logs, versioning et conventions de nommage.

> [!NOTE] Cette documentation decrit le fonctionnement actuel du code. Si une refonte modifie `scripts/settings.js`, `scripts/main.js` ou `scripts/parameters.js`, mets ce fichier a jour dans la meme PR.

## Sommaire

- [Vue d&#39;ensemble](#vue-densemble)
- [Arborescence utile](#arborescence-utile)
- [Cycle de chargement](#cycle-de-chargement)
- [Outillage popup Tailwind](#outillage-popup-tailwind)
- [Parametres et groupes](#parametres-et-groupes)
- [ModuleRunner](#modulerunner)
- [Modules actuels](#modules-actuels)
- [Logs](#logs)
- [Viewer de logs dev](#viewer-de-logs-dev)
- [Versioning](#versioning)
- [Nomenclature](#nomenclature)
- [Bonnes pratiques](#bonnes-pratiques)

## Vue d'ensemble

CustomDirecte est une extension Chrome MV3 injectee sur `*.ecoledirecte.com`.

Le code est separe en quatre grandes zones :

| Zone            | Role                                                                                                                |
| --------------- | ------------------------------------------------------------------------------------------------------------------- |
| `manifest.json` | Declare l'extension, les permissions, les content scripts et les ressources accessibles.                            |
| `scripts/`      | Contient le socle commun : compat navigateur, logs, stockage, runner, popup et background.                          |
| `modules/`      | Contient les fonctionnalites actives sur EcoleDirecte. Un module correspond generalement a un groupe de parametres. |
| `styles/`       | Contient les CSS injectees ou chargees par les modules.                                                             |
| `pages/popup/`  | Interface de personnalisation generee a partir des groupes et parametres.                                           |
| `icons/`        | Icones de l'extension et ressources graphiques EcoleDirecte.                                                        |
| `utils/`        | Fonctions utilitaires partagees.                                                                                    |
| `Popups/`       | Sources de travail du popup, avec Tailwind, pour generer le CSS adapte.                                             |
| `dev/`          | Outils de developpement hors extension, dont le viewer de logs.                                                     |

## Arborescence utile

```text
.
├── Popups/
│   ├── current/              # Sources Tailwind du popup actuel
│   └── old_2025/             # Ancienne version conservee comme reference
├── dev/
│   └── log-viewer.html       # Viewer local des logs NDJSON CustomDirecte
└── src/
    ├── manifest.json
    ├── scripts/
    │   ├── browser.js        # Globals Chrome/browser
    │   ├── log.js            # Logs structures
    │   ├── settings.js       # Classes Group, Parameter, Switch, selectors...
    │   ├── parameters.js     # Declaration des groupes et parametres
    │   ├── main.js           # UI injectee + ModuleRunner
    │   ├── background.js     # Service worker + centralisation des logs
    │   └── darkreader.js     # Librairie DarkReader + pont messages
    ├── modules/
    │   ├── customizationModule.js
    │   ├── sidebarModule.js
    │   └── noteTableModule.js
    ├── styles/
    ├── pages/popup/
    │   ├── interface.html
    │   ├── interface.css     # CSS genere/adapte depuis Popups/current
    │   └── interface.js
    ├── icons/
    └── utils/
```

## Cycle de chargement

Les content scripts sont charges dans l'ordre defini par `manifest.json`.

```jsonc
"js": [
  "/scripts/browser.js",
  "/scripts/log.js",
  "/scripts/settings.js",
  "/scripts/parameters.js",
  "/utils/math.js",
  "/utils/notesStorage.js",
  "/scripts/main.js",
  "/modules/customizationModule.js",
  "/modules/sidebarModule.js",
  "/modules/noteTableModule.js"
]
```

Ordre logique :

1. `browser.js` expose les globals `browser`, `browserStorage`, `browserVersion`, `browserStorageOnChanged`, `browserRuntime`.
2. `log.js` initialise le systeme de logs.
3. `settings.js` declare les classes de groupes et parametres.
4. `parameters.js` declare les groupes et appelle `genSettings()`.
5. `main.js` cree l'interface injectee et demarre `ModuleRunner` quand `settingsReady` est resolu.
6. Les fichiers de `modules/` enregistrent leurs modules via `ModuleRunner.register(...)`.
7. `ModuleRunner.startAll()` demarre uniquement les modules dont le groupe est actif.

> [!IMPORTANT] L'ordre des scripts est important. Un module doit etre charge apres `scripts/main.js`, car il utilise `ModuleRunner`.

## Outillage popup Tailwind

Le dossier `Popups/` sert a travailler sur le popup de personnalisation avec Tailwind CSS.

```text
Popups/
├── current/
│   ├── interface.html
│   ├── interface.js
│   ├── tailwind.css
│   ├── tailwind.config.js
│   ├── tailwindform.js
│   └── tailwindcss.exe
└── old_2025/
```

Role des fichiers importants :

| Fichier | Role |
| --- | --- |
| `Popups/current/interface.html` | Source de travail du HTML du popup. |
| `Popups/current/interface.js` | Source de travail du JS du popup. |
| `Popups/current/tailwind.css` | Entree Tailwind : imports, variables, `@tailwind base/components/utilities`. |
| `Popups/current/tailwind.config.js` | Configuration Tailwind et couleurs basees sur les variables CSS du projet. |
| `Popups/current/tailwindform.js` | Plugin local utilise par Tailwind. |
| `src/pages/popup/interface.css` | CSS final utilise par l'extension. Il est genere/adapte depuis les sources Tailwind. |

Quand l'UI du popup change, il faut regenerer le CSS adapte avant de tester l'extension.

```bash
cd Popups/current
./tailwindcss.exe -i tailwind.css -o ../../src/pages/popup/interface.css --minify
```

> [!CAUTION]
> Ne traite pas `src/pages/popup/interface.css` comme la source principale si le changement vient du popup Tailwind. Modifie d'abord `Popups/current`, regenere le CSS, puis teste dans l'extension.

## Parametres et groupes

Les groupes et parametres sont declares dans `scripts/parameters.js`.

Exemple :

```js
const customizations = new Group("customizations", "swatchbook", "Personnalisation", "Parametres de personnalisation", true);

new Switch(customizations, "darkmode", "moon", "Activer le mode sombre", "L'ensemble du site sera sombre, utile la nuit !", false, false);
```

### Types disponibles

| Type                  | Classe             | Valeur stockee          | Usage                                       |
| --------------------- | ------------------ | ----------------------- | ------------------------------------------- |
| Groupe classique      | `Group`            | `actived: boolean`      | Groupe activable/desactivable.              |
| Groupe action         | `ActionGroup`      | `actived: "action"`     | Groupe special non desactivable.            |
| Interrupteur          | `Switch`           | `boolean`               | Active/desactive une option.                |
| Selecteur ligne       | `RowSelector`      | `string`                | Choix unique avec visuels SVG.              |
| Selecteur custom      | `CustomSelector`   | `string`                | Choix unique avec styles inline de preview. |
| Selecteur multi-ligne | `MultiRowSelector` | `string[]`              | Plusieurs choix coordonnes.                 |
| Selecteur couleur     | `ColorSelector`    | `number` de `0` a `360` | Teinte HSL.                                 |
| Bouton                | `Button`           | timestamp               | Action ponctuelle.                          |

### Structure du storage

Les parametres sont stockes dans `browser.storage.sync` sous la cle `settings`.

```js
{
  customizations: {
    actived: true,
    parameters: {
      darkmode: false,
      colorCustomization: 340
    }
  }
}
```

## ModuleRunner

`ModuleRunner` vit dans `scripts/main.js`.

Son role :

- enregistrer les modules avec `ModuleRunner.register(module)`;
- lire l'etat des groupes depuis `Settings.stored`;
- poser l'attribut HTML `group-<groupId>-active`;
- appeler `module.start(params)` si le groupe est actif;
- dispatcher les changements de parametres vers `module.onParamChange(paramId, newValue, oldValue)`.

Contrat minimal d'un module :

```js
var exampleModule = {
  groupId: "example",

  start(params) {
    log.info("EXAMPLE", "Demarrage");
  },

  onParamChange(paramId, newValue, oldValue) {
    log.debug("EXAMPLE", `${paramId} : ${oldValue} -> ${newValue}`);
  },
};

ModuleRunner.register(exampleModule);
```

> [!CAUTION] `groupId` doit correspondre exactement a l'id du `Group` declare dans `scripts/parameters.js`.

## Modules actuels

### `customizationModule.js`

Groupe : `customizations`

Responsabilites :

- synchronise les attributs HTML des parametres de personnalisation;
- injecte `styles/customizations.css`;
- injecte `scripts/darkreader.js`;
- applique le favicon magenta quand le groupe est actif;
- active/desactive DarkReader via `window.postMessage(...)`.

### `sidebarModule.js`

Groupe : `sidebar`

Responsabilites :

- synchronise les attributs HTML de la barre laterale;
- ajoute la classe `new-menu`;
- observe le DOM pour reconstruire le menu lateral;
- ajoute des boutons : personnalisation, compte, deconnexion.

### `noteTableModule.js`

Groupe : `notesTable`

Responsabilites :

- synchronise les attributs HTML des options de notes;
- injecte les styles et Tippy;
- observe le tableau de notes;
- force/recalcule certaines moyennes;
- gere les notes et matieres custom via `utils/notesStorage.js`;
- peut capturer un snapshot anonymise pour les logs de debug.

## Logs

Le systeme de logs est centralise dans `scripts/log.js`.

API principale :

```js
log.script("MODULES/EXAMPLEMODULE.JS");
log.info("EXAMPLE", "Operation terminee");
log.warn("EXAMPLE", "Cas limite detecte");
log.error("EXAMPLE", `Erreur : ${error}`);
log.debug("EXAMPLE", "Detail utile en mode debug");
log.snap("NOTETABLE", htmlAnonymise);
```

Niveaux :

| Niveau | Fonction                                 | Affichage console                 |
| ------ | ---------------------------------------- | --------------------------------- |
| `INFO` | `log.info`                               | si mode dev actif                 |
| `WARN` | `log.warn`                               | si mode dev actif                 |
| `ERR`  | `log.error`                              | toujours transmis, console.error  |
| `DBG`  | `log.debug`                              | uniquement si mode dev actif      |
| `SNAP` | `log.snap`                               | stocke un snapshot HTML anonymise |
| `SET`  | `log.settingUpdate`, `log.settingAction` | changements de settings           |

Le background (`scripts/background.js`) centralise les logs recus via `CD_LOG` et construit un fichier NDJSON avec `buildLogFile(...)` lors de l'action `downloadlog`.

> [!TIP] Utilise un tag module court, stable et en majuscules : `RUNNER`, `SETTINGS`, `CUSTOMIZATION`, `SIDEBAR`, `NOTETABLE`, `UI`.

## Viewer de logs dev

Le fichier `dev/log-viewer.html` est un outil local pour analyser les logs telecharges depuis le popup.

Il permet de charger un fichier NDJSON CustomDirecte et de :

- trier les entrees par temps `+ms`;
- filtrer par niveau : `INFO`, `WARN`, `ERR`, `DBG`, `SET`, `SNAP`;
- filtrer par contexte : `ED`, `POP`, `BG`;
- rechercher dans le module, le message, la source ou l'URL;
- afficher un bandeau d'erreurs et aller directement a la premiere erreur;
- ouvrir les entrees `SNAP` dans un apercu du tableau de notes capture.

Les snapshots `SNAP` viennent de `noteTableModule.js` quand l'option developpement `captureTable` est activee.

> [!IMPORTANT]
> Les snapshots du tableau de notes sont anonymises avant d'etre stockes dans les logs : les noms de matieres et de professeurs sont remplaces par des valeurs generiques.

Flux d'utilisation :

```text
Popup CustomDirecte
-> Developpement
-> Activer les logs
-> optionnel : Capturer le tableau des notes
-> Telecharger les logs
-> ouvrir le fichier dans dev/log-viewer.html
```

## Versioning

La version de l'extension vient de `manifest.json`.

```json
"version": "30.0.1",
"version_name": "3.0.1"
```

Dans `scripts/settings.js`, `browserVersion` est interprete sous la forme :

```text
<combined>.<patch>.<stageCode>
```

Avec :

- `combined` : version majeure/mineure combinee;
- `patch` : patch;
- `stageCode` :
  - `0` = alpha
  - `1` = beta
  - `2` = release candidate
  - `3` = stable

Exemple actuel :

```text
30.0.1 -> major=3, minor=0, patch=0, stage=beta
```

> [!WARNING] `version_name` est la version affichee humainement, mais le code lit `version` pour calculer `versionInfo`.

## Nomenclature

### Fichiers

| Type         | Convention              | Exemple            |
| ------------ | ----------------------- | ------------------ |
| Module       | `<feature>Module.js`    | `sidebarModule.js` |
| Style module | nom fonctionnel         | `sidebar.css`      |
| Utilitaire   | nom court camelCase     | `notesStorage.js`  |
| Doc          | majuscules descriptives | `ARCHITECTURE.md`  |

### Identifiants

| Element               | Convention                     | Exemple                        |
| --------------------- | ------------------------------ | ------------------------------ |
| `groupId`             | camelCase ou mot simple stable | `notesTable`, `customizations` |
| `paramId`             | camelCase                      | `generalAverageDisplay`        |
| Attribut HTML         | id du parametre tel quel       | `darkmode="true"`              |
| Attribut groupe actif | `group-<groupId>-active`       | `group-sidebar-active`         |
| Module log tag        | MAJUSCULES                     | `SIDEBAR`                      |

### CSS conditionnel

Les CSS de modules utilisent les attributs poses sur `<html>`.

```css
@scope (html[group-customizations-active]) {
  :scope[darkmode="true"] {
    /* styles */
  }
}
```

Pour un parametre `myOption`, le module doit poser :

```js
document.documentElement.setAttribute("myOption", value);
```

## Bonnes pratiques

- Declare les groupes et parametres uniquement dans `scripts/parameters.js`.
- Mets le code actif dans un module de `modules/`.
- Garde `groupId` identique entre le groupe et le module.
- Utilise `log.info`, `log.warn`, `log.error`, `log.debug` plutot que `console.log`.
- Synchronise les parametres dans `start(params)`.
- Gere les changements live dans `onParamChange(...)` quand possible.
- Mets `reloadingRequired` a `true` si le changement ne peut pas etre applique a chaud.
- Ajoute une entree dans `manifest.json` si une nouvelle ressource doit etre chargee par URL via `browser.runtime.getURL(...)`.
- Evite les variables globales implicites dans les nouveaux modules.

<details>
<summary>Checklist rapide avant commit</summary>

- [ ] Le groupe est declare avant `genSettings()`.
- [ ] Le module appelle `ModuleRunner.register(...)`.
- [ ] Le `groupId` est exactement le meme partout.
- [ ] Les logs utilisent un tag stable.
- [ ] Les ressources utilisees sont bien disponibles dans `manifest.json` si necessaire.
- [ ] Les changements de parametres live sont geres ou marques comme necessitant un rechargement.

</details>
