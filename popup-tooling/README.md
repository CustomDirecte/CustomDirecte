# Outillage des interfaces popup

Le runtime du popup se trouve dans `src/pages/popup/`.

```text
popup-tooling/
├── classic/   # Sources du design moderne + Tailwind
└── legacy/    # Sources du design legacy original + CSS historique
```

## Generer le CSS

Depuis la racine du projet :

```bash
npm run popup:build
```

La commande génère le CSS classic dans `src/pages/popup/interface.css`, copie
les templates dans leurs répertoires runtime et synchronise les SVG communs.
Il ne faut pas modifier les fichiers générés dans `src/pages/popup/` comme
source de design.

## Organisation du runtime

Chaque interface possède son adaptateur dans
`src/pages/popup/interfaces/<nom>/adapter.js`. Ses templates et ses styles sont
produits depuis le dossier de tooling correspondant. Le dossier
`popup-tooling/` ne contient aucun JavaScript nécessaire au fonctionnement de
l'extension.

## Previews locales

```bash
npm run popup:preview:classic
npm run popup:preview:legacy
```

Les previews démarrent respectivement sur `4173` et `4174`, puis ouvrent le
navigateur. Elles utilisent des données de démonstration et les vrais
adaptateurs/templates runtime.
