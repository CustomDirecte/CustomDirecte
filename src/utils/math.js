log.script("UTILS/MATH.JS");

/**
 * @fileOverview Utilitaires mathématiques pour le calcul des notes.
 * @author Bastian NOEL
 */

/* eslint-disable no-implicit-globals */

/**
 * Arrondit un nombre à deux décimales et le formate avec une virgule (convention française).
 * @param {number} x - Le nombre à arrondir.
 * @returns {string} Le nombre arrondi, formaté avec une virgule.
 */
function hundredthRound(x) {
  return parseFloat(x.toFixed(2)).toString().replace(".", ",");
}

/**
 * Calcule une moyenne pondérée.
 * @param {Array<[number, number]>} liste - Tableau de paires [valeur, coefficient].
 * @returns {number} La moyenne pondérée.
 */
function moyennePondere(liste) {
  return (
    liste.reduce((total, [valeur, coef]) => total + valeur * coef, 0) /
    liste.reduce((total, [, coef]) => total + coef, 0)
  );
}

/**
 * Retarde l'exécution d'une fonction jusqu'à la fin d'une série d'appels rapides.
 * @param {Function} fn - La fonction à retarder.
 * @param {number} delay - Délai en millisecondes.
 * @returns {Function} La fonction anti-rebond.
 */
function debounce(fn, delay) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}
