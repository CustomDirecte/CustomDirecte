# CustomDirecte

Extension Chrome MV3 pour personnaliser EcoleDirecte et enrichir le tableau des notes.

## Développement

```bash
npm install
npm run popup:build
npm run bac:build
npm run popup:validate
```

Pour tester les interfaces du popup :

```bash
npm run popup:preview:classic
npm run popup:preview:legacy
```

Le chargement de l’extension se fait depuis le dossier `src/` dans Chrome, en mode développeur.

## Fonctionnalités principales

- moyennes et notes custom dans le tableau EcoleDirecte ;
- calculateur BAC dans le side panel ;
- glisser-déposer d’une moyenne vers un champ BAC ;
- personnalisation visuelle et mode sombre ;
- popup avec interfaces classic et legacy ;
- logs de développement téléchargeables.

## Architecture

| Dossier | Rôle |
| --- | --- |
| `src/core/settings/` | Modèle des groupes et paramètres, sans DOM. |
| `src/modules/` | Fonctionnalités injectées dans EcoleDirecte. |
| `src/pages/popup/` | Runtime du popup et adaptateurs d’interfaces. |
| `src/pages/bac/` | Source React et build du calculateur BAC. |
| `src/styles/` | Styles injectés dans EcoleDirecte. |
| `src/utils/` | Utilitaires partagés. |
| `popup-tooling/` | Sources Tailwind/templates des interfaces popup. |
| `dev/` | Build, preview et validation. |

Voir [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) pour le fonctionnement détaillé.
