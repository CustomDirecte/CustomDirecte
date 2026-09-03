# Ajouter un paramètre

## 1. Déclarer le paramètre

Dans `src/core/settings/parameters.js`, l’ajouter au groupe concerné :

```js
new Switch(
  group,
  "myOption",
  "check",
  "Mon option",
  "Description courte",
  false,
  false
);
```

Le dernier argument utile indique si un rechargement est nécessaire.

## 2. Réagir dans le module

Le module récupère la valeur dans `start(params)` et peut gérer les changements dans `onParamChange(id, value)`.

```js
onParamChange(id, value) {
  if (id !== "myOption") return;
  // appliquer ou retirer le comportement
}
```

## 3. Vérifier l’interface

Les adaptateurs popup prennent en charge les types existants. Pour un nouveau type, ajouter le rendu et le binding dans les adaptateurs concernés ainsi que les templates nécessaires.

## 4. Valider

```bash
npm run popup:build
npm run popup:validate
node --check src/core/settings/settings.js
node --check src/core/settings/parameters.js
```

Un identifiant de paramètre doit rester stable : prévoir une migration avant de le renommer.
