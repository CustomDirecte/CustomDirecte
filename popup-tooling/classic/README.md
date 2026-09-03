# Sources de l’interface classic

Ce dossier contient les sources du design classic : templates HTML, classes
Tailwind, configuration et compilateur local. Le runtime canonique est
`src/pages/popup/`; il est alimenté par `npm run popup:build`.

Pour régénérer le CSS utilisé par l’extension depuis la racine :

```bash
npm run popup:build
```

Les previews se lancent depuis la racine avec `npm run popup:preview:classic`.
Ce dossier ne contient aucun adaptateur runtime.
