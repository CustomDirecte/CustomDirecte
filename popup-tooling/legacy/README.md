# Source de l’interface legacy

Cette interface est une présentation complète indépendante de `classic`, pas
un thème. `templates.html` reprend la structure HTML historique et
`interface.css` est son CSS original.

Le comportement runtime est porté par
`src/pages/popup/interfaces/legacy/adapter.js`. Le build copie ces deux
sources vers `src/pages/popup/interfaces/legacy/` et synchronise les SVG.

Pour travailler visuellement :

```bash
npm run popup:preview:legacy
```
