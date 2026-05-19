# Guide dev - Ajouter un parametre, du code actif ou un groupe

Ce guide explique comment ajouter facilement un parametre dans CustomDirecte, le relier a du code actif, ou creer un groupe complet avec son module.

> [!TIP] Pour aller vite : declare l'option dans `scripts/parameters.js`, lis-la dans le module associe, puis loggue ce que tu fais. Le reste est surtout de la rigueur.

## Sommaire

- [Les 3 fichiers a connaitre](#les-3-fichiers-a-connaitre)
- [Ajouter un parametre a un groupe existant](#ajouter-un-parametre-a-un-groupe-existant)
- [Relier le parametre au code actif](#relier-le-parametre-au-code-actif)
- [Ajouter un groupe entier](#ajouter-un-groupe-entier)
- [Choisir le bon type de parametre](#choisir-le-bon-type-de-parametre)
- [Creer un nouveau type de parametre](#creer-un-nouveau-type-de-parametre)
- [Logs et commentaires](#logs-et-commentaires)
- [Rigueur CSS](#rigueur-css)
- [Ressources et manifest](#ressources-et-manifest)
- [Credits contributeurs](#credits-contributeurs)
- [Popup Tailwind](#popup-tailwind)
- [Viewer de logs dev](#viewer-de-logs-dev)
- [Tests rapides](#tests-rapides)
- [Standards du projet](#standards-du-projet)

## Les 3 fichiers a connaitre

| Fichier                        | Quand le modifier                                                                 |
| ------------------------------ | --------------------------------------------------------------------------------- |
| `scripts/parameters.js`      | Pour ajouter un groupe, un parametre, un bouton, un selecteur.                    |
| `modules/<feature>Module.js` | Pour faire agir le parametre sur EcoleDirecte.                                    |
| `manifest.json`              | Pour ajouter un module JS, un CSS content-script ou une ressource web accessible. |

Le systeme fait ensuite le lien automatiquement :

```text
parameters.js -> Settings.storage -> ModuleRunner -> module.start(params)
                                             └── module.onParamChange(...)
```

## Ajouter un parametre a un groupe existant

Exemple : ajouter un switch dans le groupe `customizations`.

### 1. Declarer le parametre

Dans `scripts/parameters.js`, ajoute le parametre apres la creation du groupe, avant `genSettings()`.

```js
new Switch(customizations, "showFancyBorders", "draw-square", "Bordures visibles", "Ajoute une bordure plus visible sur certains blocs", false, false);
```

Arguments d'un `Switch` :

```js
new Switch(group, id, icon, name, description, defaultValue, reloadingRequired, warning);
```

| Argument              | Exemple                 | Role                                          |
| --------------------- | ----------------------- | --------------------------------------------- |
| `group`             | `customizations`      | Groupe parent.                                |
| `id`                | `"showFancyBorders"`  | Cle stockee + attribut HTML.                  |
| `icon`              | `"draw-square"`       | Icone dans `pages/popup/svg/icons/`.        |
| `name`              | `"Bordures visibles"` | Titre affiche dans le popup.                  |
| `description`       | `"Ajoute..."`         | Tooltip d'aide.                               |
| `defaultValue`      | `false`               | Valeur par defaut.                            |
| `reloadingRequired` | `false`               | `true` si le changement demande un refresh. |
| `warning`           | `false` ou texte      | Avertissement affiche sous l'option.          |

> [!IMPORTANT] L'id doit etre stable. Si tu renommes un id, les utilisateurs perdent la valeur stockee sauf si tu ajoutes une migration dans `scripts/settings.js`.

### 2. Utiliser le parametre dans le module

Dans `modules/customizationModule.js`, `params.showFancyBorders` sera disponible dans `start(params)`.

```js
start(params) {
  log.info("CUSTOMIZATION", "Demarrage");

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) document.documentElement.setAttribute(key, value);
  }

  if (params.showFancyBorders === true) {
    log.info("CUSTOMIZATION", "Bordures visibles activees");
  }
}
```

### 3. Gerer le changement live

Si le parametre peut etre applique sans refresh :

```js
onParamChange(paramId, newValue) {
  document.documentElement.setAttribute(paramId, newValue);
  log.debug("CUSTOMIZATION", `${paramId} -> ${newValue}`);

  if (paramId === "showFancyBorders") {
    log.info("CUSTOMIZATION", `Bordures visibles ${newValue ? "activees" : "desactivees"}`);
  }
}
```

Si le changement demande de reconstruire beaucoup de DOM, mets `reloadingRequired` a `true`.

```js
new Switch(customizations, "showFancyBorders", "draw-square", "Bordures visibles", "Ajoute une bordure plus visible", false, true);
```

> [!NOTE] Quand `reloadingRequired` vaut `true`, le popup indique que la page doit etre actualisee.

## Relier le parametre au code actif

Il y a deux strategies principales.

### Strategie A - CSS conditionnel

Le module pose l'attribut :

```js
document.documentElement.setAttribute("showFancyBorders", true);
```

Puis le CSS reagit :

```css
@scope (html[group-customizations-active]) {
  :scope[showFancyBorders="true"] .some-class {
    border: 2px solid var(--primary-color);
  }
}
```

Cette strategie est ideale pour :

- couleurs;
- visibilite;
- arrondis;
- espacements;
- petites variations d'interface.

### Strategie B - JS actif

Le module observe ou modifie le DOM :

```js
if (params.showFancyBorders === true) {
  document.querySelectorAll(".some-class").forEach((element) => {
    element.classList.add("cd-fancy-border");
  });
}
```

Cette strategie est ideale pour :

- boutons ajoutes;
- recalculs;
- modifications structurelles;
- observers;
- interactions.

> [!CAUTION] Si tu utilises un `MutationObserver`, stocke-le dans le module (`_observer`) et deconnecte l'ancien observer avant d'en creer un nouveau. Regarde `sidebarModule.js` et `noteTableModule.js`.

## Ajouter un groupe entier

Exemple : creer un groupe `homework`.

### 1. Declarer le groupe et ses parametres

Dans `scripts/parameters.js` :

```js
const homework = new Group("homework", "file-bookmark", "Cahier de texte", "Parametres du cahier de texte", false);

new Switch(homework, "highlightLateHomework", "eye-slash", "Mettre en avant les devoirs en retard", "Ajoute un style visible aux devoirs dont la date est depassee", true, false);
```

### 2. Creer le module

Nouveau fichier : `modules/homeworkModule.js`.

```js
log.script("MODULES/HOMEWORKMODULE.JS");

/**
 * @fileOverview Module cahier de texte : mise en avant des devoirs et options associees.
 * @author Ton Nom
 */

var homeworkModule = {
  groupId: "homework",
  _observer: null,

  start(params) {
    log.info("HOMEWORK", "Demarrage");

    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) document.documentElement.setAttribute(key, value);
    }

    if (this._observer) {
      this._observer.disconnect();
      this._observer = null;
      log.debug("HOMEWORK", "Observer precedent deconnecte");
    }

    this._observer = new MutationObserver(() => {
      if (params.highlightLateHomework !== true) return;
      this.highlightLateHomework();
    });

    this._observer.observe(document.body, { childList: true, subtree: true });
    log.info("HOMEWORK", "Demarrage complet");
  },

  onParamChange(paramId, newValue) {
    document.documentElement.setAttribute(paramId, newValue);
    log.debug("HOMEWORK", `${paramId} -> ${newValue}`);
  },

  highlightLateHomework() {
    // TODO: cibler les elements EcoleDirecte concernes.
    log.debug("HOMEWORK", "Analyse des devoirs");
  },
};

ModuleRunner.register(homeworkModule);
```

### 3. Ajouter le module au manifest

Dans `manifest.json`, ajoute le fichier a la fin de `content_scripts[0].js`.

```jsonc
"/modules/homeworkModule.js"
```

> [!WARNING] Le module doit etre charge apres `scripts/main.js`, sinon `ModuleRunner` n'existe pas encore.

### 4. Ajouter l'icone si besoin

Le groupe et les parametres utilisent des icones depuis :

```text
pages/popup/svg/icons/<icon>.svg
```

Si tu utilises `"file-bookmark"`, il faut que ce fichier existe :

```text
pages/popup/svg/icons/file-bookmark.svg
```

## Choisir le bon type de parametre

<details>
<summary><strong>Switch</strong> - Activer/desactiver une fonctionnalite</summary>

```js
new Switch(group, "mySwitch", "check", "Mon switch", "Description", false, false);
```

Utilise-le pour une valeur `true` / `false`.

</details>

<details>
<summary><strong>RowSelector</strong> - Choix unique avec previews SVG</summary>

```js
new RowSelector(
  group,
  "displayMode",
  "shapes",
  "Mode d'affichage",
  "Choisit le rendu visuel",
  "compact",
  [
    { id: "compact", name: "Compact" },
    { id: "large", name: "Large" },
  ],
  false,
);
```

Previews attendues :

```text
pages/popup/svg/displayMode/1.svg
pages/popup/svg/displayMode/2.svg
```

</details>

<details>
<summary><strong>CustomSelector</strong> - Choix unique avec styles inline</summary>

```js
new CustomSelector(
  group,
  "cornerMode",
  "draw-square",
  "Angles",
  "Change les coins",
  "none",
  [
    { id: "none", name: "Aucune", style: { first: "border-radius: 0px;" } },
    { id: "wide", name: "Large", style: { first: "border-radius: 20px;" } },
  ],
  false,
);
```

</details>

<details>
<summary><strong>MultiRowSelector</strong> - Plusieurs choix lies</summary>

```js
new MultiRowSelector(
  group,
  "buttonStyle",
  "swatchbook",
  "Style du bouton",
  "Configure plusieurs aspects du bouton",
  ["iconAndText", "ile"],
  [
    [
      { id: "icon", name: "Icone" },
      { id: "iconAndText", name: "Texte & icone" },
    ],
    [
      { id: "ile", name: "En ile" },
      { id: "border", name: "Bordure" },
    ],
  ],
  false,
);
```

</details>

<details>
<summary><strong>ColorSelector</strong> - Couleur HSL</summary>

```js
new ColorSelector(group, "accentColor", "colors", "Couleur", "Couleur principale", 340, false);
```

La valeur est un nombre entier entre `0` et `360`.

</details>

<details>
<summary><strong>Button</strong> - Action ponctuelle</summary>

```js
new Button(development, "downloadlog", "download", "Telecharger les logs", "Telecharger les logs", false);
```

Un clic stocke un timestamp. Le code actif doit reagir au changement de valeur.

</details>

## Creer un nouveau type de parametre

Un nouveau type de parametre se cree uniquement si les classes existantes ne suffisent pas. Dans la plupart des cas, il vaut mieux reutiliser `Switch`, `RowSelector`, `CustomSelector`, `MultiRowSelector`, `ColorSelector` ou `Button`.

> [!CAUTION]
> Ajouter un nouveau type demande de modifier `scripts/settings.js`, qui est le moteur generique du popup. Fais-le seulement si le besoin revient plusieurs fois ou si le composant apporte une vraie difference d'UX.

### Quand creer un nouveau type

Creer une nouvelle classe est pertinent si :

- la valeur stockee a une forme speciale;
- le rendu HTML ne ressemble a aucun type existant;
- la validation doit etre centralisee;
- plusieurs futurs parametres vont reutiliser ce meme comportement.

Ne cree pas un type juste pour changer le style d'un seul parametre. Dans ce cas, prefere `CustomSelector` ou du CSS conditionnel.

### Structure minimale

Un type de parametre est une classe qui herite de `Parameter`.

```js
class NumberStepper extends Parameter {
  constructor(group, id, icon, name, description, defaultValue, min, max, reloadingRequired = false, warning = false) {
    super(group, id, icon, name, description, "numberstepper", defaultValue, reloadingRequired, warning);
    this.min = min;
    this.max = max;
  }

  importValue(defaultValue) {
    const storedValue = Settings.stored[this.group.id]?.parameters[this.id];
    this.value = Number.isInteger(storedValue) && storedValue >= this.min && storedValue <= this.max ? storedValue : defaultValue;
  }

  updateValue() {
    const input = this.htmlElement.querySelector("input[type=number]");
    if (input) input.value = this.value;
    this.htmlElement.setAttribute("data-actived", this.value != false ? "enabled" : "desabled");
  }

  createEventListener(htmlElement, particularity) {
    if (!particularity) return;

    particularity.querySelector("input").addEventListener("change", (event) => {
      const value = Number(event.currentTarget.value);
      const clamped = Math.min(this.max, Math.max(this.min, value));
      this.exportValue(clamped);
    });
  }

  genParameterParticularity(htmlElement) {
    const particularity = stringToHtml(`
      <div class="cd-option-stepper mx-[54px] my-5">
        <input type="number" min="${this.min}" max="${this.max}" value="${this.value}">
      </div>
    `);

    htmlElement.appendChild(particularity);
    return particularity;
  }
}
```

### Les methodes a comprendre

| Methode                                             | Obligatoire      | Role                                                                               |
| --------------------------------------------------- | ---------------- | ---------------------------------------------------------------------------------- |
| `constructor(...)`                                | Oui              | Appelle `super(...)`, definit le type et stocke les options internes.            |
| `importValue(defaultValue)`                       | Souvent          | Valide la valeur stockee et retombe sur la valeur par defaut si elle est invalide. |
| `updateValue()`                                   | Oui si UI custom | Synchronise le HTML quand le storage change.                                       |
| `genParameterParticularity(htmlElement)`          | Oui si UI custom | Ajoute la partie specifique du composant sous la ligne principale.                 |
| `createEventListener(htmlElement, particularity)` | Oui              | Ecoute les changements utilisateur et appelle `this.exportValue(...)`.           |

> [!IMPORTANT]
> `exportValue(...)` est le point d'entree normal vers le storage. Ne modifie pas `Settings.stored` directement depuis un composant, sauf cas tres particulier deja gere par le moteur.

### Exemple d'utilisation

Une fois la classe ajoutee dans `scripts/settings.js`, le nouveau type s'utilise dans `scripts/parameters.js`.

```js
new NumberStepper(
  notesTable,
  "maximumDisplayedNotes",
  "table",
  "Nombre de notes affichees",
  "Limite le nombre de notes visibles par matiere",
  10,
  1,
  50,
  true
);
```

### Checklist avant de valider un nouveau type

- [ ] La valeur stockee est validee dans `importValue`.
- [ ] Le composant appelle `this.exportValue(...)` au changement.
- [ ] `updateValue()` remet l'UI dans le bon etat.
- [ ] Le type a un nom stable dans `super(..., "type", ...)`.
- [ ] Le rendu utilise des classes CSS prefixees ou scopees.
- [ ] `node --check scripts/settings.js` passe.
- [ ] Au moins un parametre reel utilise le nouveau type.

## Logs et commentaires

### Logs recommandes

```js
log.info("MODULE", "Demarrage");
log.debug("MODULE", "Detail utile seulement en dev");
log.warn("MODULE", "Etat inattendu mais non bloquant");
log.error("MODULE", `Erreur pendant l'injection : ${error}`);
```

Utilise :

- `log.info` pour les etapes importantes;
- `log.debug` pour les details repetitifs;
- `log.warn` pour un cas anormal mais gere;
- `log.error` dans les `catch`.

> [!CAUTION] Evite `console.log` dans le code final. Les logs CustomDirecte sont structures, telechargeables et centralises par le background.

### Commentaires recommandes

En haut d'un nouveau fichier :

```js
log.script("MODULES/HOMEWORKMODULE.JS");

/**
 * @fileOverview Module cahier de texte : description courte du role.
 * @author Ton Nom
 */
```

Pour une fonction publique ou importante :

```js
/**
 * Met en avant les devoirs en retard dans la page courante.
 * @param {HTMLElement} root - Racine DOM a analyser.
 */
function highlightLateHomework(root) {
  // ...
}
```

> [!TIP] Commente l'intention, pas l'evidence. `// ajoute une classe` est inutile; `// EcoleDirecte regenere ce bloc apres chaque changement d'onglet` est utile.

## Rigueur CSS

Le CSS de l'extension est injecte sur un site externe. Il faut donc etre strict : un selecteur trop large peut casser EcoleDirecte ou une autre partie de CustomDirecte.

### Regle principale

Scope toujours les styles d'un groupe avec l'attribut `group-<groupId>-active`.

```css
@scope (html[group-sidebar-active]) {
  :scope .menuMoreOptions {
    display: flex;
  }
}
```

Pour les personnalisations :

```css
@scope (html[group-customizations-active]) {
  :scope[colorCustomization="340"] {
    --primary-color: hsl(340 80% 45%);
  }
}
```

> [!CAUTION]
> Evite les selecteurs globaux comme `div`, `button`, `table`, `.card` ou `span` sans scope. Sur EcoleDirecte, ils touchent vite trop de choses.

### Nommage des classes ajoutees par l'extension

Quand tu ajoutes une classe en JS, prefixe-la avec `cd-` ou utilise un nom deja etabli par le module.

```js
element.classList.add("cd-homework-late");
```

```css
@scope (html[group-homework-active]) {
  :scope .cd-homework-late {
    border-left: 3px solid var(--primary-color);
  }
}
```

Bonnes classes :

- `cd-custom-note-wrapper`
- `cd-custom-subject-row`
- `cd-homework-late`
- `menuMoreOptions` si le module a deja une convention historique

Classes a eviter :

- `active`
- `selected`
- `new`
- `button`
- `red`

### Utiliser les attributs HTML des parametres

Les modules synchronisent souvent les parametres sur `<html>`.

```js
document.documentElement.setAttribute("hideCustomizationButton", true);
```

Le CSS doit lire l'attribut :

```css
@scope (html[group-sidebar-active]) {
  :scope[hideCustomizationButton="true"] .settings-button {
    display: none;
  }
}
```

> [!TIP]
> Les attributs sont pratiques pour les styles simples. Pour une modification structurelle ou un calcul, garde le comportement en JS dans le module.

### Variables CSS

Prefere les variables CSS pour les couleurs ou valeurs reutilisees.

```css
@scope (html[group-customizations-active]) {
  :scope {
    --cd-accent: var(--primary-color);
  }

  :scope .cd-surface-highlight {
    border-color: var(--cd-accent);
  }
}
```

Ne duplique pas une couleur brute dans plusieurs fichiers si elle peut devenir une variable.

### Organisation des fichiers CSS

| Type de style                        | Fichier conseille                  |
| ------------------------------------ | ---------------------------------- |
| Base de l'extension injectee partout | `styles/default.css`             |
| Personnalisation globale             | `styles/customizations.css`      |
| Bouton de personnalisation           | `styles/customizationButton.css` |
| Tableau de notes                     | `styles/notesTable.css`          |
| Barre laterale                       | `styles/sidebar.css`             |
| Nouveau gros module                  | `styles/<module>.css`            |

Si tu ajoutes un nouveau CSS charge avec `fetch(browser.runtime.getURL(...))`, ajoute-le aussi dans `web_accessible_resources`.

### Checklist CSS

- [ ] Le style est scope avec `html[group-<groupId>-active]`.
- [ ] Les classes ajoutees par l'extension sont prefixees ou clairement propres au module.
- [ ] Aucun selecteur global dangereux.
- [ ] Les valeurs reutilisees passent par des variables.
- [ ] Le CSS ne depend pas d'un ordre fragile si possible.
- [ ] Le responsive/mobile n'est pas casse.
- [ ] Les styles sont dans le fichier du module concerne.

## Ressources et manifest

Si ton code charge une ressource avec :

```js
browser.runtime.getURL("/styles/my-style.css");
```

elle doit etre accessible via `web_accessible_resources` si elle est lue depuis la page.

Exemple :

```jsonc
"web_accessible_resources": [{
  "resources": [
    "/styles/my-style.css",
    "/icons/EcoleDirecte/magenta.ico"
  ],
  "matches": ["*://*.ecoledirecte.com/*"]
}]
```

Si tu ajoutes un nouveau module JS :

```jsonc
"content_scripts": [{
  "js": [
    "/scripts/main.js",
    "/modules/homeworkModule.js"
  ]
}]
```

## Credits contributeurs

Quand tu ouvres une PR avec une vraie contribution au projet, ajoute ton pseudo dans la liste `thanks` de `scripts/settings.js`.

```js
const thanks = ["⭐ Viktorabe", "Alerymin", "TonPseudo"];
```

Regles :

- ajoute uniquement le pseudo, pas de lien, pas de mention `@`;
- garde les pseudos avec `⭐` au debut de la liste;
- n'ajoute pas toi-meme l'etoile : elle est donnee par le mainteneur du projet;
- l'ordre des pseudos normaux n'est pas important, car il est randomise dans le popup;
- les pseudos etoiles restent affiches avant les autres, meme si leur ordre interne peut aussi etre randomise.

> [!NOTE]
> La liste est affichee dans le popup CustomDirecte. Elle sert a remercier les devs/contributeurs, pas a documenter tout l'historique Git.

## Popup Tailwind

Le popup visible dans l'extension utilise les fichiers de `src/pages/popup/`, mais le travail de design/generation se fait dans `Popups/current/`.

```text
Popups/current/
├── interface.html
├── interface.js
├── tailwind.css
├── tailwind.config.js
├── tailwindform.js
└── tailwindcss.exe
```

Quand tu ajoutes un groupe, un parametre ou un nouveau style qui touche le popup :

1. verifie que le rendu genere par `scripts/settings.js` utilise des classes Tailwind disponibles;
2. modifie les sources de popup dans `Popups/current/` si la structure ou le design de reference change;
3. regenere `src/pages/popup/interface.css`;
4. teste le popup dans l'extension.

Commande de generation depuis la racine du repo :

```bash
cd Popups/current
./tailwindcss.exe -i tailwind.css -o ../../src/pages/popup/interface.css --minify
```

> [!CAUTION]
> `src/pages/popup/interface.css` est le CSS final adapte pour l'extension. Evite de le modifier seul si la source Tailwind doit aussi changer, sinon la prochaine generation risque d'ecraser ton travail.

Bonnes pratiques popup :

- garde les classes Tailwind dans le HTML/JS du popup, pas dans des styles inline inutiles;
- ajoute les nouvelles couleurs ou shadows dans `tailwind.config.js` si elles deviennent reutilisables;
- conserve les variables CSS du theme (`--text`, `--custom-pink`, `--switch-main`, etc.);
- verifie que les icones existent dans `src/pages/popup/svg/icons/`;
- regenere le CSS apres une modification de classes Tailwind.

## Viewer de logs dev

Le dossier `dev/` contient `dev/log-viewer.html`, un viewer local pour les fichiers de logs telecharges depuis CustomDirecte.

Il sert a analyser les fichiers NDJSON generes par `downloadlog`.

Fonctionnalites :

- chargement par bouton ou drag and drop;
- tri chronologique avec la colonne `+ms`;
- filtres par niveau (`INFO`, `WARN`, `ERR`, `DBG`, `SET`, `SNAP`);
- filtres par contexte (`ED`, `POP`, `BG`);
- recherche dans module, message, source et URL;
- bandeau d'erreurs avec acces rapide a la premiere erreur;
- affichage des snapshots `SNAP` du tableau de notes.

Pour capturer le tableau de notes dans les logs :

1. ouvre le popup CustomDirecte;
2. va dans `Developpement`;
3. active `Activer les logs`;
4. active `Capturer le tableau des notes`;
5. reproduis le comportement a analyser;
6. clique `Telecharger les logs`;
7. ouvre le fichier dans `dev/log-viewer.html`.

> [!IMPORTANT]
> Les snapshots de tableau sont anonymises avant d'etre ajoutes aux logs. Les noms de matieres et de professeurs sont remplaces par des identifiants generiques.

> [!WARNING]
> `captureTable` peut ajouter du poids aux logs et impacter legerement les performances. Active-le seulement quand tu dois diagnostiquer le tableau de notes.

## Tests rapides

Avant de considerer le changement termine, dans le navigateur :

- recharge l'extension;
- recharge une page EcoleDirecte;
- ouvre le popup CustomDirecte;
- verifie que le groupe/parametre apparait;
- active/desactive l'option;
- regarde les logs avec le mode developpement si besoin.
- si tu as touche au popup, regenere `src/pages/popup/interface.css` depuis `Popups/current`;
- si tu as touche aux logs ou au tableau de notes, teste un fichier dans `dev/log-viewer.html`.

<details>
<summary>Debug avec les logs CustomDirecte</summary>

1. Ouvre le popup CustomDirecte.
2. Va dans `Developpement`.
3. Active `Activer les logs`.
4. Reproduis le probleme.
5. Clique `Telecharger les logs`.
6. Lis le fichier NDJSON genere.

</details>

## Standards du projet

### A faire

- Utiliser `camelCase` pour les ids de parametres.
- Utiliser un `groupId` court et stable.
- Garder le code actif dans `modules/`.
- Utiliser `log.*`.
- Mettre `reloadingRequired` a `true` quand un changement live serait fragile.
- Verifier que les icones et previews existent.
- Garder les modifications scopees au groupe concerne.
- Scoper le CSS avec `group-<groupId>-active`.
- Prefixer les classes creees par l'extension avec `cd-` quand c'est nouveau.
- Ajouter son pseudo dans `thanks` lors d'une PR de contribution.
- Regenerer le CSS Tailwind du popup quand les classes ou le design du popup changent.
- Utiliser `dev/log-viewer.html` pour verifier les logs complexes ou les snapshots de tableau.

### A eviter

- Ajouter du comportement directement dans `scripts/parameters.js`.
- Renommer un parametre sans migration.
- Injecter plusieurs fois le meme observer sans deconnecter l'ancien.
- Ajouter des `console.log` permanents.
- Creer des variables globales implicites dans un nouveau module.
- Modifier `settings.js` pour un simple nouveau parametre.
- Ajouter un nouveau type de parametre si un type existant suffit.
- Ecrire du CSS global non scope.
- Modifier uniquement `src/pages/popup/interface.css` si la source Tailwind correspondante doit aussi changer.
- Partager un snapshot de tableau non anonymise.

> [!IMPORTANT] `scripts/settings.js` est le moteur generique. Pour ajouter une fonctionnalite normale, tu ne devrais presque jamais avoir besoin de le modifier.

## Recette courte

```text
1. Ajouter le parametre dans scripts/parameters.js.
2. Lire params.<id> dans modules/<group>Module.js.
3. Gerer onParamChange si possible.
4. Ajouter CSS/ressources si necessaire.
5. Regenerer le CSS du popup si Tailwind est concerne.
6. Verifier avec node --check.
7. Tester dans EcoleDirecte.
8. Lire les logs dans dev/log-viewer.html si le changement touche le debug ou le tableau de notes.
```
