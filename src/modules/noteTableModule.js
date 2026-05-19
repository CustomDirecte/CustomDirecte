log.script("MODULES/NOTETABLEMODULE.JS");

/**
 * @fileOverview Module tableau des notes : recalcul des moyennes, notes custom, tooltips Tippy.
 * @author Bastian NOEL
 * @author Viktorabe
 */

var noteTableModule = {
  groupId: "notesTable",
  _observer: null,
  _params: {},
  _averageTable: false,
  _tippyState: false,

  /* ─── start ─────────────────────────────────────────── */

  /**
   * Démarre le module : synchronise les attributs HTML, injecte CSS et Tippy,
   * puis lance le MutationObserver pour détecter et analyser les tableaux de notes.
   * @param {Object} params - Paramètres du groupe "notesTable".
   */
  start(params) {
    log.info("NOTETABLE", "Démarrage");
    this._params = params;

    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) document.documentElement.setAttribute(key, value);
    }
    log.debug("NOTETABLE", `${Object.keys(params).length} attribut(s) HTML synchronisés`);

    if (this._observer) {
      this._observer.disconnect();
      this._observer = null;
      log.debug("NOTETABLE", "Observer précédent déconnecté");
    }

    this._setupCSS();
    this._injectTippy();

    this._observer = new MutationObserver(() => {
      const tableParent = document.getElementById("encart-notes");
      const periodeElement = document.getElementById("unePeriode");

      if (typeof this._averageTable === "undefined") this._averageTable = false;

      let averageTableSearch;
      try {
        averageTableSearch = periodeElement.dataset.averageTableSearch || false;
      } catch {
        averageTableSearch = true;
      }

      if (tableParent && periodeElement && !averageTableSearch) {
        periodeElement.dataset.averageTableSearch = true;
        try {
          const activeTab = periodeElement.querySelector("li.active > a");
          const tabs = periodeElement.querySelectorAll("[role=tab]");
          const averageTableFound = periodeElement.dataset.averageTableFound;

          if (tabs && !averageTableFound && activeTab) {
            try {
              for (let i = 0; i < tabs.length; i++) {
                const element = tabs[i];
                if (element === activeTab) continue;
                element.click();
                if (!document.getElementById("encart-moyennes")) continue;
                if (document.getElementById("encart-moyennes").querySelector("table")) {
                  log.debug("NOTETABLE", "averageTable trouvé");
                  this._averageTable = document.getElementById("encart-moyennes").querySelector("table").cloneNode(true);
                  periodeElement.dataset.averageTableFound = true;
                  break;
                }
              }
            } catch (err) {
              log.warn("NOTETABLE", `Erreur recherche averageTable : ${err}`);
            }
            activeTab.click();
            return;
          }
        } catch (err) {
          log.warn("NOTETABLE", `averageTable introuvable : ${err}`);
        }
      }

      if (tableParent && tableParent.dataset.averageCalculator !== "true") {
        log.debug("NOTETABLE", "Nouveau tableau détecté");
        tableParent.dataset.averageCalculator = true;
        this._calculator(tableParent, this._averageTableAnalysis(this._averageTable));
      }
    });

    this._observer.observe(document.body, { childList: true, subtree: true });
    log.info("NOTETABLE", "Démarrage complet — MutationObserver actif");
  },

  /* ─── onParamChange ─────────────────────────────────── */

  /**
   * Réagit à un changement de paramètre : met à jour le cache interne, l'attribut HTML,
   * et active/désactive les tooltips Tippy si nécessaire.
   * @param {string} paramId - Identifiant du paramètre modifié.
   * @param {*} newValue - Nouvelle valeur.
   */
  onParamChange(paramId, newValue) {
    this._params[paramId] = newValue;
    document.documentElement.setAttribute(paramId, newValue);
    log.debug("NOTETABLE", `${paramId} → ${newValue}`);

    if (paramId === "AveragesInfluenceTooltips") {
      window.postMessage(newValue === "none" ? "tippy-noteEvent-disable" : "tippy-noteEvent-enable", "*");
    }
  },

  /* ─── CSS injection ─────────────────────────────────── */

  /**
   * Injecte la feuille de style CSS des notes et matières custom dans le <head>.
   * Protégé contre les injections multiples via un id unique.
   */
  _setupCSS() {
    if (document.getElementById("cd-custom-note-css")) return;
    const s = document.createElement("style");
    s.id = "cd-custom-note-css";
    s.textContent = `
      .cd-custom-note-wrapper { position: relative; display: inline-block; margin: 1px 4px; vertical-align: middle; }
      .cd-custom-note-wrapper button.cd-custom-note-btn { opacity: 0.5; filter: grayscale(20%); cursor: default; border: none; background: none; padding: 0; }
      .cd-custom-note-delete {
        position: absolute; top: -5px; right: -5px;
        width: 13px; height: 13px; border-radius: 50%; border: none;
        background: var(--primary-color); color: white;
        cursor: pointer; padding: 0;
        display: flex; align-items: center; justify-content: center;
        opacity: 0; transition: opacity 0.15s; z-index: 10;
      }
      .cd-custom-note-wrapper:hover .cd-custom-note-delete { opacity: 1; }
      .cd-add-note-btn {
        display: inline-flex; align-items: center; justify-content: center;
        width: 18px; height: 18px; border-radius: 50%;
        border: 2px solid var(--primary-color); background: transparent; color: var(--primary-color);
        cursor: pointer; padding: 0; margin-left: 4px; vertical-align: middle; transition: all 0.15s;
      }
      .cd-add-note-btn:hover { background: var(--primary-color); color: white; }
      .cd-clear-notes-btn {
        display: inline-flex; align-items: center; justify-content: center;
        width: 18px; height: 18px; border-radius: 50%;
        border: 2px solid var(--primary-color); background: transparent; color: var(--primary-color);
        cursor: pointer; padding: 0; margin-left: 2px; vertical-align: middle; transition: all 0.15s;
      }
      .cd-clear-notes-btn:hover { background: var(--primary-color); color: white; }
      .cd-modal-confirm-msg { margin: 0 0 16px; font-size: 13px; }
      .cd-global-clear-wrapper { display: flex; justify-content: flex-end; margin-top: 8px; }
      .cd-global-clear-btn {
        display: inline-flex; align-items: center;
        padding: 4px 14px; border-radius: 999px; border: none;
        cursor: pointer; font-size: 11px; font-weight: 600;
        font-family: inherit; transition: all 0.15s;
        background: var(--smalldark-placeholder-color); color: inherit;
      }
      .cd-global-clear-btn:hover { background: var(--dark-placeholder-color); }
      .cd-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 99999; display: flex; align-items: center; justify-content: center; }
      @keyframes cd-animate-pop { 0% { opacity: 0; transform: scale(0.5, 0.5); } 100% { opacity: 1; transform: scale(1, 1); } }
      .cd-modal { background: var(--body-color); border-radius: var(--table-radius); padding: 24px 28px; min-width: 300px; box-shadow: 0 20px 60px rgba(0,0,0,0.3); animation: cd-animate-pop 0.5s cubic-bezier(0.26, 0.53, 0.74, 1.48); }
      .cd-modal h3 { margin: 0 0 4px; color: var(--primary-color); font-size: 15px; font-weight: 700; }
      .cd-modal-subject { margin: 0 0 16px; font-size: 12px; color: var(--dark-placeholder-color); }
      .cd-modal-row { display: flex; gap: 8px; align-items: flex-end; }
      .cd-modal-field { display: flex; flex-direction: column; gap: 4px; }
      .cd-modal-field label { font-size: 10px; color: var(--dark-placeholder-color); font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
      .cd-modal-field input { width: 64px; padding: 7px 8px; border: 1.5px solid var(--smalldark-placeholder-color); border-radius: var(--borderRadius-thin); font-size: 14px; text-align: center; outline: none; transition: border-color 0.15s; font-family: inherit; background: var(--light-placeholder-color); color: inherit; }
      .cd-modal-field input:focus { border-color: var(--primary-color); }
      .cd-modal-sep { font-size: 22px; color: var(--dark-placeholder-color); padding-bottom: 3px; font-weight: 300; }
      .cd-modal-coef-wrap { margin-left: 8px; }
      .cd-modal-error { color: var(--primary-color); font-size: 11px; margin-top: 8px; display: none; }
      .cd-modal-actions { display: flex; gap: 8px; margin-top: 16px; justify-content: flex-end; }
      .cd-modal-btn { padding: 8px 20px; border-radius: 999px; border: none; cursor: pointer; font-size: 13px; font-weight: 600; transition: all 0.15s; font-family: inherit; }
      .cd-modal-btn-primary { background: var(--primary-color); color: white; }
      .cd-modal-btn-primary:hover { background: var(--smalldark-primary-color); }
      .cd-modal-btn-secondary { background: var(--smalldark-placeholder-color); color: inherit; }
      .cd-modal-btn-secondary:hover { background: var(--dark-placeholder-color); }
      .cd-add-subject-btn {
        display: inline-flex; align-items: center; gap: 5px;
        padding: 4px 14px; border-radius: 999px;
        border: 1.5px solid var(--primary-color); background: transparent; color: var(--primary-color);
        cursor: pointer; font-size: 11px; font-weight: 600; font-family: inherit; transition: all 0.15s;
      }
      .cd-add-subject-btn:hover { background: var(--primary-color); color: white; }
      .cd-subject-delete-btn {
        display: inline-flex; align-items: center; justify-content: center;
        width: 18px; height: 18px; border-radius: 50%;
        border: 2px solid var(--primary-color); background: transparent; color: var(--primary-color);
        cursor: pointer; padding: 0; margin-left: 6px; vertical-align: middle; transition: all 0.15s;
      }
      .cd-subject-delete-btn:hover { background: var(--primary-color); color: white; }
      .cd-custom-subject-badge {
        display: inline-block; font-size: 9px; font-weight: 700;
        color: var(--primary-color); border: 1px solid var(--primary-color);
        border-radius: 3px; padding: 1px 4px; margin-left: 6px; opacity: 0.7; vertical-align: middle;
      }
      .cd-edit-note-wrapper { position: relative; display: inline-block; }
      .cd-edit-note-btn {
        position: absolute; top: -5px; left: -5px;
        width: 13px; height: 13px; border-radius: 50%; border: none;
        background: var(--primary-color); color: white;
        cursor: pointer; padding: 0;
        display: flex; align-items: center; justify-content: center;
        opacity: 0; transition: opacity 0.15s; z-index: 10;
      }
      .cd-edit-note-wrapper:hover .cd-edit-note-btn { opacity: 1; }
      .cd-reset-note-btn {
        position: absolute; top: -5px; right: -5px;
        width: 13px; height: 13px; border-radius: 50%; border: none;
        background: var(--smalldark-placeholder-color); color: var(--primary-color);
        cursor: pointer; padding: 0;
        display: flex; align-items: center; justify-content: center;
        opacity: 0; transition: opacity 0.15s; z-index: 10;
      }
      .cd-edit-note-wrapper:hover .cd-reset-note-btn { opacity: 1; }
      .cd-note-modified > button { outline: 1.5px solid var(--primary-color); border-radius: 3px; }
      .cd-reset-all-mods-btn {
        display: inline-flex; align-items: center;
        padding: 4px 14px; border-radius: 999px; border: none;
        cursor: pointer; font-size: 11px; font-weight: 600; font-family: inherit; transition: all 0.15s;
        background: var(--smalldark-placeholder-color); color: inherit;
      }
      .cd-reset-all-mods-btn:hover { background: var(--dark-placeholder-color); }
      .cd-custom-data-switch-label {
        display: flex; align-items: center; gap: 7px;
        cursor: pointer; font-size: 11px; font-weight: 600; margin-right: auto; user-select: none;
      }
      .cd-custom-data-switch-label input[type="checkbox"] { position: absolute; opacity: 0; width: 0; height: 0; }
      .cd-custom-data-switch-track {
        position: relative; display: inline-block;
        width: 28px; height: 16px;
        background: var(--smalldark-placeholder-color); border-radius: 16px; transition: background 0.2s; flex-shrink: 0;
      }
      .cd-custom-data-switch-track::before {
        content: ""; position: absolute;
        width: 12px; height: 12px; left: 2px; top: 2px;
        background: white; border-radius: 50%; transition: transform 0.2s;
      }
      .cd-custom-data-switch-label input:checked ~ .cd-custom-data-switch-track { background: var(--primary-color); }
      .cd-custom-data-switch-label input:checked ~ .cd-custom-data-switch-track::before { transform: translateX(12px); }
    `;
    document.head.appendChild(s);
    log.debug("NOTETABLE", "CSS custom notes injecté");
  },

  /* ─── Tippy injection ───────────────────────────────── */

  /**
   * Injecte le script tippy.js dans le <head>.
   * _tippyState est positionné à true immédiatement (optimiste) et corrigé à false sur erreur.
   */
  _injectTippy() {
    try {
      const tippyScript = document.createElement("script");
      tippyScript.src = browser.runtime.getURL("/scripts/tippy.js");
      this._tippyState = true;
      tippyScript.onload = () => {
        log.debug("NOTETABLE", "tippy.js chargé avec succès");
      };
      tippyScript.onerror = () => {
        this._tippyState = false;
        log.warn("NOTETABLE", "Erreur chargement tippy.js");
      };
      document.head.appendChild(tippyScript);
      log.debug("NOTETABLE", "tippy.js injecté");
    } catch (err) {
      this._tippyState = false;
      log.warn("NOTETABLE", `Erreur injection tippy.js : ${err}`);
    }
  },

  /* ─── averageTableAnalysis ──────────────────────────── */

  /**
   * Analyse le tableau du relevé de moyennes (cloné, hors DOM) pour extraire
   * les moyennes élève et classe par matière.
   * Utilise textContent (et non innerText) pour compatibilité avec les nœuds détachés.
   * @param {HTMLTableElement|false} averageTable - Clone du tableau relevé, ou false si absent.
   * @returns {Object.<string, {average: number, classAverage: number|false}>|false}
   */
  _averageTableAnalysis(averageTable) {
    if (!averageTable) return false;
    log.debug("NOTETABLE", "Analyse averageTable");

    const lines = {};
    try {
      for (const line of averageTable.tBodies[0].rows) {
        const labelEl = line.querySelector(".libellediscipline");
        if (!labelEl || !labelEl.textContent?.trim()) continue;

        const parse = (el) => {
          try {
            const v = parseFloat(el.textContent.replace(",", "."));
            if (isNaN(v)) return false;
            return v;
          } catch {
            return false;
          }
        };

        const average = line.querySelector(".moyenneeleve") ? parse(line.querySelector(".moyenneeleve")) : false;
        const classAverage = line.querySelector(".moyenneclasse") ? parse(line.querySelector(".moyenneclasse")) : false;
        if (!average) continue;

        lines[labelEl.textContent.trim()] = { average, classAverage };
      }
    } catch (err) {
      log.warn("NOTETABLE", `Erreur analyse averageTable : ${err}`);
      return false;
    }

    const count = Object.keys(lines).length;
    if (count) log.debug("NOTETABLE", `averageTable : ${count} matière(s) extraite(s)`);
    else log.warn("NOTETABLE", "averageTable analysé mais aucune matière extraite");
    return count ? lines : false;
  },

  /* ─── Calculator ────────────────────────────────────── */

  /**
   * Calcule et affiche les moyennes par matière et la moyenne générale dans le tableau des notes.
   * Injecte les colonnes manquantes, les notes custom, les boutons de modification et les tooltips.
   * @param {HTMLElement} tableParent - Élément #encart-notes contenant le tableau.
   * @param {Object.<string, {average: number, classAverage: number|false}>|false} averageTableInfos - Infos du relevé.
   */
  _calculator(tableParent, averageTableInfos) {
    log.debug("NOTETABLE", "Calculator démarré");
    const p = this._params;
    const cdIncludeCustomData = localStorage.getItem("cd-include-custom-data") !== "false";

    function refreshNotes() {
      tableParent.dataset.averageCalculator = "";
      try {
        noteTableModule._calculator(tableParent, noteTableModule._averageTableAnalysis(noteTableModule._averageTable));
      } catch (err) {
        log.error("NOTETABLE", `Erreur lors du recalcul : ${err}`);
      }
      tableParent.dataset.averageCalculator = "true";
    }

    let effectiveClassAveragesDisplay = p["ClassAveragesDisplay"];
    if (averageTableInfos) {
      const classAverages = Object.values(averageTableInfos).map((i) => i.classAverage);
      if (classAverages.every((a) => !a)) {
        effectiveClassAveragesDisplay = false;
        log.debug("NOTETABLE", "ClassAverages désactivé — aucune moyenne de classe disponible");
      }
    }

    if (!tableParent.querySelector("table")) {
      log.warn("NOTETABLE", "Table introuvable");
      return;
    }
    const gradeTable = tableParent.querySelector("table");
    gradeTable.classList.add("newTable");

    try {
      tableParent.querySelector("p").innerHTML = "<b>Moyennes calculées par l'extension : " + browser.runtime.getManifest().name + "</b>";
    } catch {
      /* non-critique */
    }

    let averageDiv;
    if (p["generalAverageDisplay"]) {
      try {
        const old = document.querySelector("table").querySelector("tr > td.moyennegenerale-valeur")?.parentNode;
        if (old) old.remove();
      } catch {
        /* non-critique */
      }
      try {
        document.getElementById("averageDiv")?.parentNode?.remove();
      } catch {
        /* non-critique */
      }

      const footerRow = gradeTable.createTFoot().insertRow(0);
      footerRow.classList.add("ng-star-inserted");
      averageDiv = footerRow.insertCell(0);
      averageDiv.colSpan = gradeTable.tHead.rows[0].cells.length;
      averageDiv.classList.add("moyennegenerale-valeur", "averageDisplay");
      averageDiv.id = "averageDiv";
      averageDiv.innerText = "Erreur";
    }

    /* ── Table configuration ── */
    const tableConfig = {
      discipline: [false, undefined],
      coef: [false, undefined],
      moyenneclasse: [false, undefined],
      relevemoyenne: [false, undefined],
      notes: [false, undefined],
    };

    const getIndex = () => {
      [...gradeTable.tHead.rows[0].cells].forEach((cell, idx) => {
        if (cell.classList.contains("discipline")) {
          tableConfig.discipline[0] = idx;
          if (tableConfig.discipline[1] === undefined) tableConfig.discipline[1] = true;
        }
        if (cell.classList.contains("coef")) {
          tableConfig.coef[0] = idx;
          if (tableConfig.coef[1] === undefined) tableConfig.coef[1] = true;
        }
        if (cell.classList.contains("moyenneclasse")) {
          tableConfig.moyenneclasse[0] = idx;
          if (tableConfig.moyenneclasse[1] === undefined) tableConfig.moyenneclasse[1] = true;
        }
        if (cell.classList.contains("relevemoyenne")) {
          tableConfig.relevemoyenne[0] = idx;
          if (tableConfig.relevemoyenne[1] === undefined) tableConfig.relevemoyenne[1] = true;
        }
        if (cell.classList.contains("notes")) {
          tableConfig.notes[0] = idx;
          if (tableConfig.notes[1] === undefined) tableConfig.notes[1] = true;
        }
      });
    };
    getIndex();

    if (tableConfig.coef[1] === undefined && p["AveragesPerSubjectDisplay"]) {
      const th = gradeTable.tHead.rows[0].insertCell(tableConfig.discipline[0] + 1);
      th.outerHTML = `<th class="coef ng-star-inserted">Coef.</th>`;
      if (p["generalAverageDisplay"] && averageDiv) averageDiv.colSpan += 1;
      tableConfig.coef[1] = false;
      getIndex();
    }

    if (tableConfig.moyenneclasse[1] === undefined && effectiveClassAveragesDisplay && averageTableInfos) {
      const th = gradeTable.tHead.rows[0].insertCell(tableConfig.coef[0] + 1);
      th.outerHTML = `<th class="moyenneclasse ng-star-inserted">Classe</th>`;
      if (p["generalAverageDisplay"] && averageDiv) averageDiv.colSpan += 1;
      tableConfig.moyenneclasse[1] = false;
      getIndex();
    }

    if (tableConfig.relevemoyenne[1] === undefined && p["AveragesPerSubjectDisplay"]) {
      const insertAfter = effectiveClassAveragesDisplay && averageTableInfos ? tableConfig.moyenneclasse[0] : tableConfig.coef[0];
      const th = gradeTable.tHead.rows[0].insertCell(insertAfter + 1);
      th.outerHTML = `<th class="relevemoyenne ng-star-inserted">Moyennes</th>`;
      if (p["generalAverageDisplay"] && averageDiv) averageDiv.colSpan += 1;
      tableConfig.relevemoyenne[1] = false;
      getIndex();
    }

    for (const item in tableConfig) {
      if (tableConfig[item][0] === false) tableConfig[item] = false;
    }

    if (!tableConfig["notes"] || tableConfig["notes"][0] === false) {
      if (p["generalAverageDisplay"] && averageDiv) averageDiv.innerText = "Colonne des notes introuvable";
      log.warn("NOTETABLE", "Colonne notes introuvable");
      return;
    }

    /* ── Global action buttons ── */
    tableParent.querySelector(".cd-global-clear-wrapper")?.remove();

    const cdWrapper = document.createElement("div");
    cdWrapper.className = "cd-global-clear-wrapper";

    const cdSwitchLabel = document.createElement("label");
    cdSwitchLabel.className = "cd-custom-data-switch-label";
    cdSwitchLabel.title = "Prendre en compte les notes custom, modifications et matières custom dans le recalcul de la moyenne";
    const cdSwitchChk = document.createElement("input");
    cdSwitchChk.type = "checkbox";
    cdSwitchChk.checked = cdIncludeCustomData;
    cdSwitchChk.addEventListener("change", (e) => {
      e.stopPropagation();
      localStorage.setItem("cd-include-custom-data", cdSwitchChk.checked ? "true" : "false");
      refreshNotes();
    });
    const cdSwitchTrack = document.createElement("span");
    cdSwitchTrack.className = "cd-custom-data-switch-track";
    const cdSwitchText = document.createElement("span");
    cdSwitchText.textContent = "Prendre en compte les données custom";
    cdSwitchLabel.appendChild(cdSwitchChk);
    cdSwitchLabel.appendChild(cdSwitchTrack);
    cdSwitchLabel.appendChild(cdSwitchText);
    cdWrapper.appendChild(cdSwitchLabel);

    const cdCustomSubjectsList = getCustomSubjects();

    const cdAddSubjectBtn = document.createElement("button");
    cdAddSubjectBtn.type = "button";
    cdAddSubjectBtn.className = "cd-add-subject-btn";
    cdAddSubjectBtn.innerHTML = '<svg width="10" height="10" viewBox="0 0 10 10" fill="none" style="pointer-events:none"><line x1="5" y1="1" x2="5" y2="9" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/><line x1="1" y1="5" x2="9" y2="5" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/></svg> Nouvelle matière custom';
    cdAddSubjectBtn.addEventListener("click", () => {
      openAddSubjectModal(refreshNotes);
    });
    cdWrapper.appendChild(cdAddSubjectBtn);

    const cdAllKeys = Object.keys(localStorage).filter((k) => k.startsWith("customNotes_"));
    const cdTotalCount = cdAllKeys.reduce((sum, k) => {
      try {
        return sum + JSON.parse(localStorage.getItem(k) || "[]").length;
      } catch {
        return sum;
      }
    }, 0);
    if (cdTotalCount > 0) {
      const cdSubjectCount = cdAllKeys.filter((k) => {
        try {
          return JSON.parse(localStorage.getItem(k) || "[]").length > 0;
        } catch {
          return false;
        }
      }).length;
      const cdGlobalClearBtn = document.createElement("button");
      cdGlobalClearBtn.type = "button";
      cdGlobalClearBtn.className = "cd-global-clear-btn";
      cdGlobalClearBtn.textContent = `Supprimer toutes les notes custom (${cdTotalCount})`;
      cdGlobalClearBtn.addEventListener("click", () => {
        openClearAllNotesModal(cdTotalCount, cdSubjectCount, () => {
          cdAllKeys.forEach((k) => localStorage.removeItem(k));
          refreshNotes();
        });
      });
      cdWrapper.appendChild(cdGlobalClearBtn);
    }

    const cdModAllKeys = Object.keys(localStorage).filter((k) => k.startsWith("modifiedNotes_"));
    const cdTotalMods = cdModAllKeys.reduce((sum, k) => {
      try {
        return sum + Object.keys(JSON.parse(localStorage.getItem(k) || "{}")).length;
      } catch {
        return sum;
      }
    }, 0);
    if (cdTotalMods > 0) {
      const cdResetAllModsBtn = document.createElement("button");
      cdResetAllModsBtn.type = "button";
      cdResetAllModsBtn.className = "cd-reset-all-mods-btn";
      cdResetAllModsBtn.textContent = `Rétablir toutes les notes modifiées (${cdTotalMods})`;
      cdResetAllModsBtn.addEventListener("click", () => {
        openResetAllModsModal(cdTotalMods, () => {
          cdModAllKeys.forEach((k) => localStorage.removeItem(k));
          refreshNotes();
        });
      });
      cdWrapper.appendChild(cdResetAllModsBtn);
    }

    if (cdWrapper.children.length > 0) gradeTable.after(cdWrapper);

    /* ── Custom subject rows ── */
    gradeTable.tBodies[0].querySelectorAll("tr.cd-custom-subject-row").forEach((r) => r.remove());

    cdCustomSubjectsList.forEach((subject) => {
      const tr = document.createElement("tr");
      tr.className = "ng-star-inserted cd-custom-subject-row";
      const totalCols = gradeTable.tHead.rows[0].cells.length;
      for (let i = 0; i < totalCols; i++) tr.insertCell(i).className = "ng-star-inserted";

      const disCol = tableConfig.discipline[0];
      const coefCol = tableConfig.coef ? tableConfig.coef[0] : false;
      const notesCol = tableConfig.notes ? tableConfig.notes[0] : false;
      const avgCol = tableConfig.relevemoyenne ? tableConfig.relevemoyenne[0] : false;
      const classAvgCol = tableConfig.moyenneclasse ? tableConfig.moyenneclasse[0] : false;

      tr.cells[disCol].classList.add("discipline");
      const nameSpan = document.createElement("span");
      nameSpan.className = "nommatiere ng-star-inserted";
      nameSpan.textContent = subject.name;
      tr.cells[disCol].appendChild(nameSpan);
      const badge = document.createElement("span");
      badge.className = "cd-custom-subject-badge";
      badge.textContent = "custom";
      tr.cells[disCol].appendChild(badge);

      const csDelBtn = document.createElement("button");
      csDelBtn.type = "button";
      csDelBtn.className = "cd-subject-delete-btn";
      csDelBtn.title = "Supprimer cette matière";
      csDelBtn.innerHTML = '<svg width="9" height="9" viewBox="0 0 9 9" fill="none" style="pointer-events:none"><line x1="1.5" y1="1.5" x2="7.5" y2="7.5" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><line x1="7.5" y1="1.5" x2="1.5" y2="7.5" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>';
      const capturedName = subject.name;
      csDelBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        openDeleteSubjectModal(capturedName, () => {
          const subs = getCustomSubjects();
          const idx = subs.findIndex((s) => s.name === capturedName);
          if (idx !== -1) subs.splice(idx, 1);
          saveCustomSubjects(subs);
          localStorage.removeItem("customNotes_" + capturedName);
          refreshNotes();
        });
      });
      tr.cells[disCol].appendChild(csDelBtn);

      if (coefCol !== false) {
        tr.cells[coefCol].classList.add("coef");
        const coefSpan = document.createElement("span");
        coefSpan.className = "ng-star-inserted";
        coefSpan.textContent = String(subject.coef);
        tr.cells[coefCol].appendChild(coefSpan);
      }
      if (notesCol !== false) tr.cells[notesCol].classList.add("notes");
      if (avgCol !== false) tr.cells[avgCol].classList.add("relevemoyenne");
      if (classAvgCol !== false) tr.cells[classAvgCol].classList.add("moyenneclasse");

      gradeTable.tBodies[0].appendChild(tr);
    });

    /* ── Line-by-line analysis ── */
    const linesGradesAndCoef = [];
    const lines = [];
    let masterLineProperties;

    for (const line of gradeTable.tBodies[0].rows) {
      if (line.querySelector("td.moyennegenerale-valeur")) continue;

      const lineTitle = line.cells[tableConfig.discipline[0]]?.querySelector(".nommatiere")?.innerText || false;

      if (tableConfig.coef && tableConfig.coef[1] === false && p["AveragesPerSubjectDisplay"] && !line.classList.contains("cd-custom-subject-row")) {
        const cell = line.insertCell(tableConfig.coef[0]);
        cell.innerHTML = `<span class="ng-star-inserted">1</span>`;
        cell.classList.add("coef", "ng-star-inserted");
      }

      if (tableConfig.moyenneclasse && tableConfig.moyenneclasse[1] === false && effectiveClassAveragesDisplay && averageTableInfos && !line.classList.contains("cd-custom-subject-row")) {
        const cell = line.insertCell(tableConfig.moyenneclasse[0]);
        cell.classList.add("moyenneclasse", "ng-star-inserted");
        const mSpan = document.createElement("span");
        mSpan.classList.add("ng-star-inserted");
        cell.appendChild(mSpan);
        if (averageTableInfos[lineTitle]?.classAverage) {
          mSpan.innerHTML = hundredthRound(averageTableInfos[lineTitle].classAverage);
        }
      }

      if (tableConfig.relevemoyenne && tableConfig.relevemoyenne[1] === false && p["AveragesPerSubjectDisplay"] && !line.classList.contains("cd-custom-subject-row")) {
        const cell = line.insertCell(tableConfig.relevemoyenne[0]);
        cell.classList.add("relevemoyenne", "ng-star-inserted");
      }

      /* ── Inject edit controls & custom notes ── */
      if (lineTitle && tableConfig.notes[0] !== false) {
        const cdNotesCell = line.cells[tableConfig.notes[0]];
        const cdSubjectName = lineTitle;
        if (cdNotesCell) {
          cdNotesCell.querySelectorAll(".cd-custom-note-wrapper, .cd-add-note-btn, .cd-clear-notes-btn").forEach((el) => el.remove());
          cdNotesCell.querySelectorAll(".cd-edit-note-wrapper").forEach((wrapper) => {
            const btn = wrapper.querySelector(":scope > button");
            if (btn) wrapper.replaceWith(btn);
            else wrapper.remove();
          });

          const cdMods = getModifiedNotes(cdSubjectName);
          [...cdNotesCell.querySelectorAll("button")].forEach((btn, cdEdIdx) => {
            const valeurSpan = btn.querySelector(":scope > span.valeur");
            if (!valeurSpan) return;

            if (btn.dataset.cdOrigNote === undefined) {
              let origTextNode = null;
              for (const node of valeurSpan.childNodes) {
                if (node.nodeType === Node.TEXT_NODE) {
                  origTextNode = node;
                  break;
                }
              }
              btn.dataset.cdOrigNote = origTextNode ? origTextNode.nodeValue.trim() : "";
              btn.dataset.cdOrigSur = valeurSpan.querySelector(".quotien") ? valeurSpan.querySelector(".quotien").textContent.replace("/", "") : "20";
              btn.dataset.cdOrigCoef = valeurSpan.querySelector(".coef") ? valeurSpan.querySelector(".coef").textContent.replace("(", "").replace(")", "") : "1";
            }

            let textNode = null;
            for (const node of valeurSpan.childNodes) {
              if (node.nodeType === Node.TEXT_NODE) {
                textNode = node;
                break;
              }
            }
            if (textNode) textNode.nodeValue = btn.dataset.cdOrigNote;
            else valeurSpan.prepend(document.createTextNode(btn.dataset.cdOrigNote));

            let qEl = valeurSpan.querySelector(".quotien");
            if (btn.dataset.cdOrigSur !== "20") {
              if (!qEl) {
                qEl = document.createElement("span");
                qEl.className = "quotien ng-star-inserted";
                valeurSpan.appendChild(qEl);
              }
              qEl.textContent = "/" + btn.dataset.cdOrigSur;
            } else if (qEl) {
              qEl.remove();
            }

            let cEl = valeurSpan.querySelector(".coef");
            if (btn.dataset.cdOrigCoef !== "1") {
              if (!cEl) {
                cEl = document.createElement("span");
                cEl.className = "coef ng-star-inserted";
                valeurSpan.appendChild(cEl);
              }
              cEl.textContent = "(" + btn.dataset.cdOrigCoef + ")";
            } else if (cEl) {
              cEl.remove();
            }

            const mod = cdMods[cdEdIdx];
            if (cdIncludeCustomData && mod) {
              let tn = null;
              for (const node of valeurSpan.childNodes) {
                if (node.nodeType === Node.TEXT_NODE) {
                  tn = node;
                  break;
                }
              }
              if (tn) tn.nodeValue = String(mod.note).replace(".", ",");
              else valeurSpan.prepend(document.createTextNode(String(mod.note).replace(".", ",")));

              let qEl2 = valeurSpan.querySelector(".quotien");
              if (mod.sur !== 20) {
                if (!qEl2) {
                  qEl2 = document.createElement("span");
                  qEl2.className = "quotien ng-star-inserted";
                  valeurSpan.appendChild(qEl2);
                }
                qEl2.textContent = "/" + mod.sur;
              } else if (qEl2) {
                qEl2.remove();
              }

              let cEl2 = valeurSpan.querySelector(".coef");
              if (mod.coef !== 1) {
                if (!cEl2) {
                  cEl2 = document.createElement("span");
                  cEl2.className = "coef ng-star-inserted";
                  valeurSpan.appendChild(cEl2);
                }
                cEl2.textContent = "(" + mod.coef + ")";
              } else if (cEl2) {
                cEl2.remove();
              }
            }

            const edWrapper = document.createElement("span");
            edWrapper.className = "cd-edit-note-wrapper" + (mod ? " cd-note-modified" : "");
            btn.parentNode.insertBefore(edWrapper, btn);
            edWrapper.appendChild(btn);

            const origNote = parseFloat(btn.dataset.cdOrigNote.replace(",", ".")) || 0;
            const origSur = parseFloat(btn.dataset.cdOrigSur) || 20;
            const origCoef = parseFloat(btn.dataset.cdOrigCoef) || 1;
            const capturedEdIdx = cdEdIdx;

            const editBtn = document.createElement("button");
            editBtn.type = "button";
            editBtn.className = "cd-edit-note-btn";
            editBtn.title = "Modifier cette note";
            editBtn.innerHTML = '<svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor" style="pointer-events:none"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>';
            editBtn.addEventListener("click", (e) => {
              e.stopPropagation();
              openEditNoteModal(cdSubjectName, capturedEdIdx, origNote, origSur, origCoef, refreshNotes);
            });
            edWrapper.appendChild(editBtn);

            if (mod) {
              const resetBtn = document.createElement("button");
              resetBtn.type = "button";
              resetBtn.className = "cd-reset-note-btn";
              resetBtn.title = "Rétablir la note originale";
              resetBtn.innerHTML = '<svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor" style="pointer-events:none"><path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/></svg>';
              resetBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                const m = getModifiedNotes(cdSubjectName);
                delete m[capturedEdIdx];
                saveModifiedNotes(cdSubjectName, m);
                refreshNotes();
              });
              edWrapper.appendChild(resetBtn);
            }
          });

          getCustomNotes(cdSubjectName).forEach((cn, cdIndex) => {
            const wrapper = document.createElement("span");
            wrapper.className = "cd-custom-note-wrapper";
            const noteBtn = document.createElement("button");
            noteBtn.type = "button";
            noteBtn.className = "cd-custom-note-btn";
            const valeurSpan = document.createElement("span");
            valeurSpan.className = "valeur ng-star-inserted";
            valeurSpan.appendChild(document.createTextNode(String(cn.note).replace(".", ",")));
            if (cn.sur !== 20) {
              const q = document.createElement("span");
              q.className = "quotien ng-star-inserted";
              q.appendChild(document.createTextNode("/" + cn.sur));
              valeurSpan.appendChild(q);
            }
            if (cn.coef !== 1) {
              const c = document.createElement("span");
              c.className = "coef ng-star-inserted";
              c.appendChild(document.createTextNode("(" + cn.coef + ")"));
              valeurSpan.appendChild(c);
            }
            noteBtn.appendChild(valeurSpan);
            const delBtn = document.createElement("button");
            delBtn.type = "button";
            delBtn.className = "cd-custom-note-delete";
            delBtn.title = "Supprimer cette note custom";
            delBtn.innerHTML = '<svg width="7" height="7" viewBox="0 0 7 7" fill="none" style="pointer-events:none"><line x1="1" y1="1" x2="6" y2="6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="6" y1="1" x2="1" y2="6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
            delBtn.addEventListener("click", (e) => {
              e.stopPropagation();
              const arr = getCustomNotes(cdSubjectName);
              arr.splice(cdIndex, 1);
              saveCustomNotes(cdSubjectName, arr);
              refreshNotes();
            });
            wrapper.appendChild(noteBtn);
            wrapper.appendChild(delBtn);
            cdNotesCell.appendChild(wrapper);
          });

          const addBtn = document.createElement("button");
          addBtn.type = "button";
          addBtn.className = "cd-add-note-btn";
          addBtn.title = "Ajouter une note custom";
          addBtn.innerHTML = '<svg width="10" height="10" viewBox="0 0 10 10" fill="none" style="pointer-events:none"><line x1="5" y1="1" x2="5" y2="9" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/><line x1="1" y1="5" x2="9" y2="5" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/></svg>';
          addBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            openCustomNoteModal(cdSubjectName, refreshNotes);
          });
          cdNotesCell.appendChild(addBtn);

          const cdExistingNotes = getCustomNotes(cdSubjectName);
          if (cdExistingNotes.length > 0) {
            const clearBtn = document.createElement("button");
            clearBtn.type = "button";
            clearBtn.className = "cd-clear-notes-btn";
            clearBtn.title = "Supprimer toutes les notes custom";
            clearBtn.innerHTML = '<svg width="9" height="9" viewBox="0 0 9 9" fill="none" style="pointer-events:none"><line x1="1.5" y1="1.5" x2="7.5" y2="7.5" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><line x1="7.5" y1="1.5" x2="1.5" y2="7.5" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>';
            clearBtn.addEventListener("click", (e) => {
              e.stopPropagation();
              openClearNotesModal(cdSubjectName, cdExistingNotes.length, refreshNotes);
            });
            cdNotesCell.appendChild(clearBtn);
          }

          const hasCustom = cdIncludeCustomData && getCustomNotes(cdSubjectName).length > 0;
          const hasMods = cdIncludeCustomData && Object.keys(getModifiedNotes(cdSubjectName)).length > 0;
          line.dataset.cdHasCustomNotes = hasCustom || hasMods ? "1" : "";
        }
      }

      /* ── Line properties ── */
      const lineProperties = {
        this: line,
        title: lineTitle,
        HasNotes: line.cells[tableConfig.notes[0]].childNodes.length > 1,
        IsMaster: line.classList.contains("master"),
        IsSecondary: line.classList.contains("secondary"),
        IsSecondaryButNotlast: line.classList.contains("secondarynotlast"),
        notes: [],
        average: false,
        averageSpan: false,
        coef: false,
        GradesAndCoef: [],
      };

      if (!(lineProperties.HasNotes || lineProperties.IsMaster || lineProperties.IsSecondary)) continue;

      /* ── Average display span ── */
      let averageSpan = false;
      if (tableConfig.relevemoyenne) {
        const avgCol = tableConfig.relevemoyenne[0];
        averageSpan = line.cells[avgCol]?.querySelector("span");
        if (!averageSpan) {
          averageSpan = document.createElement("span");
          averageSpan.classList.add("ng-star-inserted");
          line.cells[avgCol]?.appendChild(averageSpan);
        }
        averageSpan.innerText = "";
      }

      /* ── Coef ── */
      lineProperties.coef = 1;
      if (tableConfig.coef) {
        const coefSpan = line.cells[tableConfig.coef[0]]?.querySelector("span");
        if (coefSpan) lineProperties.coef = parseFloat(coefSpan.innerText) || 1;
      }

      if (lineProperties.IsMaster) {
        masterLineProperties = lineProperties;
        masterLineProperties.averageSpan = averageSpan;
        masterLineProperties.GradesAndCoef = [];
        continue;
      }

      lineProperties.averageSpan = averageSpan;

      /* ── Parse notes ── */
      for (const notesSpan of line.cells[tableConfig.notes[0]].querySelectorAll("button > span:nth-of-type(1).valeur")) {
        if (!cdIncludeCustomData && notesSpan.closest(".cd-custom-note-wrapper")) continue;
        let note,
          coef = 1;
        try {
          note = parseFloat(notesSpan.childNodes[0].nodeValue.replace(",", "."));
          if (isNaN(note)) continue;
        } catch {
          continue;
        }

        if (notesSpan.querySelector(".quotien")) {
          try {
            const q = parseFloat(notesSpan.querySelector(".quotien").childNodes[0].nodeValue.replace("/", ""));
            if (isNaN(q)) continue;
            note = note * (20 / q);
          } catch {
            continue;
          }
        }

        if (notesSpan.querySelector(".coef")) {
          try {
            coef = parseFloat(notesSpan.querySelector(".coef").childNodes[0].nodeValue.replace("(", "").replace(")", ""));
            if (isNaN(coef)) coef = 1;
          } catch {
            coef = 1;
          }
        }

        lineProperties.GradesAndCoef.push([note, coef]);
        lineProperties.notes.push([note, coef, notesSpan]);
      }

      if (!lineProperties.GradesAndCoef.length) {
        if (lineProperties.IsSecondary && !lineProperties.IsSecondaryButNotlast) {
          if (masterLineProperties?.GradesAndCoef.length) {
            masterLineProperties.average = moyennePondere(masterLineProperties.GradesAndCoef);
            masterLineProperties.GradesAndCoef.push([masterLineProperties.average, masterLineProperties.coef]);
            if (masterLineProperties.averageSpan) {
              masterLineProperties.averageSpan.innerText = hundredthRound(masterLineProperties.average);
              lines.push(masterLineProperties);
            }
          }
        }
        continue;
      }

      /* ── Average calculation ── */
      lineProperties.average = moyennePondere(lineProperties.GradesAndCoef);
      if (!p["AveragesPerSubjectRecalculation"] && !line.dataset.cdHasCustomNotes && averageTableInfos?.[lineTitle]?.average) {
        lineProperties.average = averageTableInfos[lineTitle].average;
      }
      lines.push(lineProperties);

      if (tableConfig.relevemoyenne && averageSpan) {
        averageSpan.innerText = hundredthRound(lineProperties.average);
      }

      if (lineProperties.IsSecondary) {
        masterLineProperties?.GradesAndCoef.push([lineProperties.average, lineProperties.coef]);
        if (!lineProperties.IsSecondaryButNotlast && masterLineProperties?.GradesAndCoef.length) {
          masterLineProperties.average = moyennePondere(masterLineProperties.GradesAndCoef);
          linesGradesAndCoef.push([masterLineProperties.average, masterLineProperties.coef]);
          if (masterLineProperties.averageSpan) {
            masterLineProperties.averageSpan.innerText = hundredthRound(masterLineProperties.average);
            lines.push(masterLineProperties);
          }
        }
      } else if (lineProperties.HasNotes) {
        linesGradesAndCoef.push([lineProperties.average, lineProperties.coef]);
      }
    }

    /* ── Final average ── */
    const finalAverage = moyennePondere(linesGradesAndCoef);
    if (isNaN(finalAverage)) {
      log.warn("NOTETABLE", "Moyenne générale invalide");
      if (p["generalAverageDisplay"] && averageDiv) averageDiv.innerText = "Notes introuvables";
      return;
    }

    if (p["generalAverageDisplay"] && averageDiv) {
      averageDiv.innerText = "MOYENNE GENERALE : " + hundredthRound(finalAverage);
    }
    log.info("NOTETABLE", `Recalcul terminé — ${lines.length} matière(s) analysée(s), moyenne générale : ${hundredthRound(finalAverage)}`);

    if (!this._tippyState) return;

    const linesSommeCoef = lines.reduce((total, item) => (item.IsSecondary ? total : total + item.coef), 0);
    for (const line of lines) {
      if (line.IsSecondary) continue;
      const lineInfluence = (line.coef * (line.average - finalAverage)) / (linesSommeCoef - line.coef);
      if (line.averageSpan) {
        let theme = "verybad";
        if (lineInfluence > -0.2) theme = "bad";
        if (lineInfluence > -0.07) theme = "neutral";
        if (lineInfluence > 0.07) theme = "good";
        if (lineInfluence > 0.2) theme = "verygood";
        line.averageSpan.parentNode.dataset.tippyTheme = theme;
        line.averageSpan.parentNode.dataset.tippyContent = `<center><span class="tippyText">Influence sur la moyenne générale :<br></span>` + `<strong>${lineInfluence > 0 ? "+" : ""}${hundredthRound(lineInfluence)}</strong></center>`;
        line.averageSpan.parentNode.classList.add("notesAdvancedInformation");
        line.averageSpan.classList.add(`influence-${theme}`, "influence");
      }
    }

    window.postMessage(p["AveragesInfluenceTooltips"] === "none" ? "tippy-noteEvent-disable" : "tippy-noteEvent-enable", "*");

    if (Settings.stored?.development?.parameters?.captureTable === true) {
      this._captureSnapshot(tableParent);
    }
  },

  /**
   * Capture un snapshot HTML anonymisé du tableau des notes et le stocke via log.snap.
   * Les noms de matières et de professeurs sont remplacés par des identifiants génériques.
   * @param {HTMLElement} tableParent - Élément #encart-notes à capturer.
   */
  _captureSnapshot(tableParent) {
    try {
      const clone = tableParent.cloneNode(true);
      let mIdx = 1;
      clone.querySelectorAll(".nommatiere").forEach((el) => {
        el.textContent = `Matière ${mIdx++}`;
      });
      clone.querySelectorAll(".libellediscipline").forEach((el) => {
        el.textContent = `Matière ${mIdx++}`;
      });
      let pIdx = 1;
      clone.querySelectorAll(`[class*="prof"], [class*="enseignant"]`).forEach((el) => {
        el.textContent = `Professeur ${pIdx++}`;
      });
      log.snap("NOTETABLE", clone.outerHTML);
      log.debug("NOTETABLE", "Snapshot HTML capturé et anonymisé");
    } catch (err) {
      log.warn("NOTETABLE", `Erreur capture snapshot : ${err}`);
    }
  },

  /**
   * Arrête le module : déconnecte le MutationObserver.
   */
  _teardown() {
    if (this._observer) {
      this._observer.disconnect();
      this._observer = null;
      log.info("NOTETABLE", "Teardown — Observer déconnecté");
    }
  },
};

/* ═══════════════════════════════════════════════════════
   Modales
   ═══════════════════════════════════════════════════════ */

function openCustomNoteModal(subjectName, onSuccess) {
  log.debug("NOTETABLE", `Modal note custom — ${subjectName}`);
  const overlay = document.createElement("div");
  overlay.className = "cd-modal-overlay";
  overlay.innerHTML =
    '<div class="cd-modal">' +
    "<h3>Note custom</h3>" +
    '<p class="cd-modal-subject">' +
    subjectName +
    "</p>" +
    '<div class="cd-modal-row">' +
    '<div class="cd-modal-field"><label>Note</label><input type="number" id="cd-f-note" min="0" step="0.5" value="10"></div>' +
    '<div class="cd-modal-sep">/</div>' +
    '<div class="cd-modal-field"><label>Sur</label><input type="number" id="cd-f-sur" min="1" step="1" value="20"></div>' +
    '<div class="cd-modal-field cd-modal-coef-wrap"><label>Coef.</label><input type="number" id="cd-f-coef" min="0.1" step="0.5" value="1"></div>' +
    "</div>" +
    '<div class="cd-modal-error" id="cd-modal-error"></div>' +
    '<div class="cd-modal-actions">' +
    '<button class="cd-modal-btn cd-modal-btn-secondary" id="cd-cancel">Annuler</button>' +
    '<button class="cd-modal-btn cd-modal-btn-primary" id="cd-add">Ajouter</button>' +
    "</div></div>";
  document.body.appendChild(overlay);
  overlay.querySelector("#cd-f-note").focus();
  overlay.querySelector("#cd-cancel").addEventListener("click", () => overlay.remove());
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) overlay.remove();
  });
  overlay.addEventListener("keydown", (e) => {
    if (e.key === "Escape") overlay.remove();
    if (e.key === "Enter") overlay.querySelector("#cd-add").click();
  });
  overlay.querySelector("#cd-add").addEventListener("click", () => {
    const note = parseFloat(overlay.querySelector("#cd-f-note").value);
    const sur = parseFloat(overlay.querySelector("#cd-f-sur").value);
    const coef = parseFloat(overlay.querySelector("#cd-f-coef").value);
    const err = overlay.querySelector("#cd-modal-error");
    if (isNaN(note) || isNaN(sur) || isNaN(coef) || note < 0 || sur <= 0 || coef <= 0) {
      err.textContent = "Valeurs invalides.";
      err.style.display = "block";
      return;
    }
    if (note > sur) {
      err.textContent = `La note ne peut pas dépasser le barème (${sur}).`;
      err.style.display = "block";
      return;
    }
    const arr = getCustomNotes(subjectName);
    arr.push({ note, sur, coef });
    saveCustomNotes(subjectName, arr);
    log.info("NOTETABLE", `Note custom ajoutée — ${subjectName} : ${note}/${sur} coef=${coef}`);
    overlay.remove();
    onSuccess();
  });
}

function openClearAllNotesModal(totalNotes, subjectCount, onConfirm) {
  log.debug("NOTETABLE", `Modal suppression globale — ${totalNotes} note(s) sur ${subjectCount} matière(s)`);
  const overlay = document.createElement("div");
  overlay.className = "cd-modal-overlay";
  overlay.innerHTML =
    '<div class="cd-modal"><h3>Tout supprimer</h3>' +
    '<p class="cd-modal-confirm-msg">' +
    totalNotes +
    " note custom sur " +
    subjectCount +
    " matière custom seront supprimées.</p>" +
    '<div class="cd-modal-actions">' +
    '<button class="cd-modal-btn cd-modal-btn-secondary" id="cd-cancel">Annuler</button>' +
    '<button class="cd-modal-btn cd-modal-btn-primary" id="cd-confirm">Supprimer tout</button>' +
    "</div></div>";
  document.body.appendChild(overlay);
  overlay.querySelector("#cd-cancel").addEventListener("click", () => overlay.remove());
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) overlay.remove();
  });
  overlay.addEventListener("keydown", (e) => {
    if (e.key === "Escape") overlay.remove();
    if (e.key === "Enter") overlay.querySelector("#cd-confirm").click();
  });
  overlay.querySelector("#cd-confirm").addEventListener("click", () => {
    log.info("NOTETABLE", `Suppression globale confirmée — ${totalNotes} note(s)`);
    overlay.remove();
    onConfirm();
  });
}

function openClearNotesModal(subjectName, count, onSuccess) {
  log.debug("NOTETABLE", `Modal suppression notes — ${subjectName} (${count})`);
  const overlay = document.createElement("div");
  overlay.className = "cd-modal-overlay";
  overlay.innerHTML =
    '<div class="cd-modal"><h3>Supprimer tout</h3>' +
    '<p class="cd-modal-subject">' +
    subjectName +
    "</p>" +
    '<p class="cd-modal-confirm-msg">' +
    count +
    " note custom seront supprimées.</p>" +
    '<div class="cd-modal-actions">' +
    '<button class="cd-modal-btn cd-modal-btn-secondary" id="cd-cancel">Annuler</button>' +
    '<button class="cd-modal-btn cd-modal-btn-primary" id="cd-confirm">Supprimer</button>' +
    "</div></div>";
  document.body.appendChild(overlay);
  overlay.querySelector("#cd-cancel").addEventListener("click", () => overlay.remove());
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) overlay.remove();
  });
  overlay.addEventListener("keydown", (e) => {
    if (e.key === "Escape") overlay.remove();
    if (e.key === "Enter") overlay.querySelector("#cd-confirm").click();
  });
  overlay.querySelector("#cd-confirm").addEventListener("click", () => {
    saveCustomNotes(subjectName, []);
    log.info("NOTETABLE", `Notes custom supprimées — ${subjectName}`);
    overlay.remove();
    onSuccess();
  });
}

function openAddSubjectModal(onSuccess) {
  log.debug("NOTETABLE", "Modal nouvelle matière custom");
  const overlay = document.createElement("div");
  overlay.className = "cd-modal-overlay";
  overlay.innerHTML =
    '<div class="cd-modal"><h3>Nouvelle matière custom</h3>' +
    '<p class="cd-modal-subject">Matière custom</p>' +
    '<div style="display:flex;flex-direction:column;gap:12px;">' +
    '<div class="cd-modal-field"><label>Nom</label><input type="text" id="cd-f-subj-name" placeholder="ex. Philosophie" style="width:180px;text-align:left;"></div>' +
    '<div class="cd-modal-field"><label>Coef.</label><input type="number" id="cd-f-subj-coef" min="0.1" step="0.5" value="1"></div>' +
    '</div><div class="cd-modal-error" id="cd-modal-subj-error"></div>' +
    '<div class="cd-modal-actions">' +
    '<button class="cd-modal-btn cd-modal-btn-secondary" id="cd-subj-cancel">Annuler</button>' +
    '<button class="cd-modal-btn cd-modal-btn-primary" id="cd-subj-add">Ajouter</button>' +
    "</div></div>";
  document.body.appendChild(overlay);
  overlay.querySelector("#cd-f-subj-name").focus();
  overlay.querySelector("#cd-subj-cancel").addEventListener("click", () => overlay.remove());
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) overlay.remove();
  });
  overlay.addEventListener("keydown", (e) => {
    if (e.key === "Escape") overlay.remove();
    if (e.key === "Enter") overlay.querySelector("#cd-subj-add").click();
  });
  overlay.querySelector("#cd-subj-add").addEventListener("click", () => {
    const name = overlay.querySelector("#cd-f-subj-name").value.trim();
    const coef = parseFloat(overlay.querySelector("#cd-f-subj-coef").value);
    const err = overlay.querySelector("#cd-modal-subj-error");
    if (!name) {
      err.textContent = "Le nom ne peut pas être vide.";
      err.style.display = "block";
      return;
    }
    if (isNaN(coef) || coef <= 0) {
      err.textContent = "Le coefficient doit être supérieur à 0.";
      err.style.display = "block";
      return;
    }
    const subjects = getCustomSubjects();
    if (subjects.some((s) => s.name === name)) {
      err.textContent = "Une matière avec ce nom existe déjà.";
      err.style.display = "block";
      return;
    }
    subjects.push({ name, coef });
    saveCustomSubjects(subjects);
    log.info("NOTETABLE", `Matière custom ajoutée : "${name}" coef=${coef}`);
    overlay.remove();
    onSuccess();
  });
}

function openEditNoteModal(subjectName, noteIndex, origNote, origSur, origCoef, onSuccess) {
  log.debug("NOTETABLE", `Modal édition note — ${subjectName} #${noteIndex}`);
  const mods = getModifiedNotes(subjectName);
  const current = mods[noteIndex] || { note: origNote, sur: origSur, coef: origCoef };
  const overlay = document.createElement("div");
  overlay.className = "cd-modal-overlay";
  overlay.innerHTML =
    '<div class="cd-modal"><h3>Modifier la note</h3>' +
    '<p class="cd-modal-subject">' +
    subjectName +
    "</p>" +
    '<p style="font-size:11px;color:var(--dark-placeholder-color);margin:0 0 12px;">Note originale : <strong>' +
    String(origNote).replace(".", ",") +
    "/" +
    origSur +
    (origCoef !== 1 ? " (coef. " + origCoef + ")" : "") +
    "</strong></p>" +
    '<div class="cd-modal-row">' +
    '<div class="cd-modal-field"><label>Note</label><input type="number" id="cd-f-edit-note" min="0" step="0.5" value="' +
    current.note +
    '"></div>' +
    '<div class="cd-modal-sep">/</div>' +
    '<div class="cd-modal-field"><label>Sur</label><input type="number" id="cd-f-edit-sur" min="1" step="1" value="' +
    current.sur +
    '"></div>' +
    '<div class="cd-modal-field cd-modal-coef-wrap"><label>Coef.</label><input type="number" id="cd-f-edit-coef" min="0.1" step="0.5" value="' +
    current.coef +
    '"></div>' +
    '</div><div class="cd-modal-error" id="cd-edit-modal-error"></div>' +
    '<div class="cd-modal-actions">' +
    (mods[noteIndex] ? '<button class="cd-modal-btn cd-modal-btn-secondary" id="cd-edit-reset" style="margin-right:auto;">Réinitialiser</button>' : "") +
    '<button class="cd-modal-btn cd-modal-btn-secondary" id="cd-edit-cancel">Annuler</button>' +
    '<button class="cd-modal-btn cd-modal-btn-primary" id="cd-edit-save">Enregistrer</button>' +
    "</div></div>";
  document.body.appendChild(overlay);
  overlay.querySelector("#cd-f-edit-note").focus();
  overlay.querySelector("#cd-f-edit-note").select();
  overlay.querySelector("#cd-edit-cancel").addEventListener("click", () => overlay.remove());
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) overlay.remove();
  });
  overlay.addEventListener("keydown", (e) => {
    if (e.key === "Escape") overlay.remove();
    if (e.key === "Enter") overlay.querySelector("#cd-edit-save").click();
  });
  if (mods[noteIndex]) {
    overlay.querySelector("#cd-edit-reset").addEventListener("click", () => {
      const m = getModifiedNotes(subjectName);
      delete m[noteIndex];
      saveModifiedNotes(subjectName, m);
      overlay.remove();
      onSuccess();
    });
  }
  overlay.querySelector("#cd-edit-save").addEventListener("click", () => {
    const note = parseFloat(overlay.querySelector("#cd-f-edit-note").value);
    const sur = parseFloat(overlay.querySelector("#cd-f-edit-sur").value);
    const coef = parseFloat(overlay.querySelector("#cd-f-edit-coef").value);
    const err = overlay.querySelector("#cd-edit-modal-error");
    if (isNaN(note) || isNaN(sur) || isNaN(coef) || note < 0 || sur <= 0 || coef <= 0) {
      err.textContent = "Valeurs invalides.";
      err.style.display = "block";
      return;
    }
    if (note > sur) {
      err.textContent = `La note ne peut pas dépasser le barème (${sur}).`;
      err.style.display = "block";
      return;
    }
    const m = getModifiedNotes(subjectName);
    m[noteIndex] = { note, sur, coef };
    saveModifiedNotes(subjectName, m);
    log.info("NOTETABLE", `Note modifiée — ${subjectName} #${noteIndex} : ${note}/${sur} coef=${coef}`);
    overlay.remove();
    onSuccess();
  });
}

function openResetAllModsModal(count, onConfirm) {
  log.debug("NOTETABLE", `Modal rétablissement — ${count} modification(s)`);
  const overlay = document.createElement("div");
  overlay.className = "cd-modal-overlay";
  overlay.innerHTML =
    '<div class="cd-modal"><h3>Rétablir toutes les notes</h3>' +
    '<p class="cd-modal-confirm-msg">' +
    count +
    " modification" +
    (count > 1 ? "s" : "") +
    " seront annulées.</p>" +
    '<div class="cd-modal-actions">' +
    '<button class="cd-modal-btn cd-modal-btn-secondary" id="cd-cancel">Annuler</button>' +
    '<button class="cd-modal-btn cd-modal-btn-primary" id="cd-confirm">Rétablir tout</button>' +
    "</div></div>";
  document.body.appendChild(overlay);
  overlay.querySelector("#cd-cancel").addEventListener("click", () => overlay.remove());
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) overlay.remove();
  });
  overlay.addEventListener("keydown", (e) => {
    if (e.key === "Escape") overlay.remove();
    if (e.key === "Enter") overlay.querySelector("#cd-confirm").click();
  });
  overlay.querySelector("#cd-confirm").addEventListener("click", () => {
    log.info("NOTETABLE", `Rétablissement global confirmé — ${count} modification(s) annulée(s)`);
    overlay.remove();
    onConfirm();
  });
}

function openDeleteSubjectModal(subjectName, onConfirm) {
  log.debug("NOTETABLE", `Modal suppression matière — ${subjectName}`);
  const overlay = document.createElement("div");
  overlay.className = "cd-modal-overlay";
  overlay.innerHTML =
    '<div class="cd-modal"><h3>Supprimer la matière custom</h3>' +
    '<p class="cd-modal-confirm-msg">La matière custom <strong>' +
    subjectName +
    "</strong> et toutes ses notes custom seront supprimées.</p>" +
    '<div class="cd-modal-actions">' +
    '<button class="cd-modal-btn cd-modal-btn-secondary" id="cd-cancel">Annuler</button>' +
    '<button class="cd-modal-btn cd-modal-btn-primary" id="cd-confirm">Supprimer</button>' +
    "</div></div>";
  document.body.appendChild(overlay);
  overlay.querySelector("#cd-cancel").addEventListener("click", () => overlay.remove());
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) overlay.remove();
  });
  overlay.addEventListener("keydown", (e) => {
    if (e.key === "Escape") overlay.remove();
    if (e.key === "Enter") overlay.querySelector("#cd-confirm").click();
  });
  overlay.querySelector("#cd-confirm").addEventListener("click", () => {
    log.info("NOTETABLE", `Matière custom supprimée : "${subjectName}"`);
    overlay.remove();
    onConfirm();
  });
}

ModuleRunner.register(noteTableModule);
