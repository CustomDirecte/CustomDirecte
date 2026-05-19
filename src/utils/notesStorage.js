log.script("UTILS/NOTESSTORAGE.JS");

/**
 * @fileOverview Wrappers localStorage pour la persistance des notes custom.
 * Toutes les clés sont préfixées pour éviter les collisions avec le site.
 * @author Bastian NOEL
 */

/* eslint-disable no-implicit-globals */

/**
 * Récupère les notes custom d'une matière depuis le localStorage.
 * @param {string} subjectName - Nom de la matière.
 * @returns {Array<{note: number, sur: number, coef: number}>}
 */
function getCustomNotes(subjectName) {
  try {
    return JSON.parse(localStorage.getItem("customNotes_" + subjectName) || "[]");
  } catch {
    return [];
  }
}

/**
 * Sauvegarde les notes custom d'une matière dans le localStorage.
 * @param {string} subjectName - Nom de la matière.
 * @param {Array<{note: number, sur: number, coef: number}>} notes
 */
function saveCustomNotes(subjectName, notes) {
  localStorage.setItem("customNotes_" + subjectName, JSON.stringify(notes));
}

/**
 * Récupère la liste des matières custom depuis le localStorage.
 * @returns {Array<{name: string, coef: number}>}
 */
function getCustomSubjects() {
  try {
    return JSON.parse(localStorage.getItem("customSubjects") || "[]");
  } catch {
    return [];
  }
}

/**
 * Sauvegarde la liste des matières custom dans le localStorage.
 * @param {Array<{name: string, coef: number}>} subjects
 */
function saveCustomSubjects(subjects) {
  localStorage.setItem("customSubjects", JSON.stringify(subjects));
}

/**
 * Récupère les notes modifiées d'une matière depuis le localStorage.
 * @param {string} subjectName - Nom de la matière.
 * @returns {Object.<number, {note: number, sur: number, coef: number}>}
 */
function getModifiedNotes(subjectName) {
  try {
    return JSON.parse(localStorage.getItem("modifiedNotes_" + subjectName) || "{}");
  } catch {
    return {};
  }
}

/**
 * Sauvegarde les notes modifiées d'une matière dans le localStorage.
 * @param {string} subjectName - Nom de la matière.
 * @param {Object.<number, {note: number, sur: number, coef: number}>} mods
 */
function saveModifiedNotes(subjectName, mods) {
  localStorage.setItem("modifiedNotes_" + subjectName, JSON.stringify(mods));
}
