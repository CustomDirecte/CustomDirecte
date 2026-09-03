/* Contenu éditorial des campagnes de popup. Le moteur reste réutilisable. */
window.CustomDirectePopupCampaigns = Object.freeze({
  welcome: Object.freeze({
    title: "Bienvenue sur CustomDirecte",
    text: "Merci d’avoir installé l’extension. Voici l’essentiel pour commencer et profiter d’une expérience plus claire sur EcoleDirecte.",
    features: Object.freeze([
      Object.freeze({ title: "Un calculateur de moyennes instantané", text: "Visualisez rapidement votre moyenne générale et l’évolution de vos résultats." }),
      Object.freeze({ title: "Une barre latérale repensée", text: "Retrouvez les outils importants depuis un espace plus clair et plus pratique." }),
      Object.freeze({ title: "Un mode sombre", text: "Passez à une interface plus confortable quand vous utilisez EcoleDirecte le soir." }),
      Object.freeze({ title: "Des options de personnalisation", text: "Adaptez les couleurs, la police et l’apparence à vos habitudes." }),
    ]),
    videos: Object.freeze([]),
    developerText: "Vous développez ? CustomDirecte est gratuite et open source. L’ajout d’options est maintenant simplifié pour permettre à chacun de proposer ses idées.",
  }),
  update: Object.freeze({
    title: "Une nouvelle version est arrivée",
    text: "Merci d’utiliser CustomDirecte. Vos réglages sont conservés et deux nouveaux outils sont maintenant disponibles.",
    features: Object.freeze([
      Object.freeze({ title: "Un simulateur de notes", text: "Testez l’effet d’une note ou d’un coefficient avant de vous décider.", videoKey: "notes" }),
      Object.freeze({ title: "Un calculateur du bac", text: "Calculez plus facilement votre résultat depuis la barre latérale.", videoKey: "bac" }),
    ]),
    videos: Object.freeze([
      Object.freeze({ key: "notes", title: "Simulateur de notes", text: "Ajoutez une note fictive et observez directement son impact.", source: "custnotes.webm" }),
      Object.freeze({ key: "bac", title: "Calculateur du bac", text: "Accédez rapidement au calculateur depuis EcoleDirecte.", source: "side_open.webm" }),
    ]),
    tip: Object.freeze({ title: "Astuce — glisser-déposer", text: "Une moyenne peut être déplacée du tableau vers le champ correspondant du calculateur.", source: "side_move.webm" }),
    developerText: "Vous développez ? CustomDirecte est gratuite et open source. Le projet est ouvert aux idées et aux contributions.",
  }),
  reminder: Object.freeze({
    title: "Merci d’utiliser CustomDirecte !",
    text: "N’hésitez pas à découvrir les options disponibles : quelques réglages peuvent rendre EcoleDirecte beaucoup plus agréable.",
    supportText: "Un partage ou une note aide énormément le projet à continuer. Merci pour votre soutien !",
    developerText: "L’extension est gratuite et open source. Vous avez une idée ou envie de contribuer ? Le projet est ouvert à tous.",
  }),
});
