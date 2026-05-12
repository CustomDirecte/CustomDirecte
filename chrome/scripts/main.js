/* IMPORT CHROME LIB */
browser = chrome;
browserStorage = browser.storage.sync;
browserVersion = browser.runtime.getManifest().version_name;
browserStorageOnChanged = browser.storage.sync.onChanged;
/* ----------------- */

/* ----------------- Console Log ----------------- */
const logStyle = {
  title: "font-size: 20px; color:#C8194A; font-weight: bold;",
  optionTrue: "font-size: 12px; color:#a2ff99; font-weight: bold;",
  optionError: "font-size: 12px; color:#ffcc99; font-weight: bold;",
  optionFalse: "font-size: 12px; color:#ff9999; font-weight: bold;",
  debugTrue: "font-size: 12px; color:#921ebd; font-weight: bold;",
  debug: "font-size: 10px; color:#bd4ee6; font-weight: bold;",
  debugRed: "font-size: 10px; color:#e64e53; font-weight: bold;",
};
console.log("%cCustomDirecte", logStyle.title);
/* ----------------------------------------------- */

/* ------------ Check If Is Login Page ----------- */
// Teste si la page de connextion est afficher
function isLoginPage() {
  return /(?:http|https)(?::\/\/)(.+\.|)(?:ecoledirecte\.com\/login).*/.test(window.location.href) ? true : false;
}
/* ----------------------------------------------- */

/* --------------- optionsConfig ----------------- */
function optionsConfig(options, setOption, params, toparam) {
  if (options == false) {
    funcName = optionsConfig.caller.name;
    for (param of Object.entries(toparam(params))) {
      setOption(param);
    }
    document.documentElement.addEventListener("optionEvent", (e) => {
      for (param of e.detail) {
        if (param[0] == funcName) {
          for (ele of Object.entries(toparam(param[1]))) {
            setOption(ele);
          }
        }
      }
    });
    return;
  }
  for (option of Object.entries(options)) {
    setOption(option);
  }
  document.documentElement.addEventListener("optionEvent", (e) => {
    for (option of e.detail) {
      if (options[option[0]] != undefined) {
        options[option[0]] = option[1];
        setOption(option);
      }
    }
  });
}
/* ----------------------------------------------- */

/* ----------------- Update Value ---------------- */
function updateValue(Option, value) {
  browserStorage.get((data) => {
    let option = data.options.find((el) => el.option == Option);
    option.Value = value;
    browserStorage.set(data);
  });
}
/* ----------------------------------------------- */

/* ---------------- TXT Downloader ---------------- */
function txtDownloader(content, fileName) {
  var a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([content], { type: "text/plain" }));
  a.download = `${fileName}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
/* ----------------------------------------------- */

/* ----------------- Console Log ----------------- */
const debug = new (class Debug {
  constructor() {
    this.active = false;
    this.logs = [];
  }

  startLog(close = false) {
    this.active = !close;
    console.log(close ? `%c> Debug [Disabled]` : `%c> Debug [Enabled]`, close ? logStyle.optionFalse : logStyle.optionTrue);
  }

  log(module, str) {
    str ? (str = `[${module}] ${str}`) : (str = `${module}`);
    if (this.active) {
      console.log(`%cDebug | ${str}`, logStyle.debug);
    }
    if (str != undefined) this.logs.push(str);
  }

  dev(options) {
    this.startLog(!option[1]);
    optionsConfig(options, (option) => {
      if (option[0] == "downloadlog" && option[1]) {
        updateValue("downloadlog", false);
        txtDownloader(`Version ${browserVersion} ; Timestamp ${Date.now()}\n` + this.logs.join("\n"), "logs");
      }
    });
  }

  startOptionLog(module, state) {
    state ? console.log(`%c${module} [Enabled]`, logStyle.optionTrue) : console.log(`%c${module} [Disabled]`, logStyle.optionFalse);
  }
})();
/* ----------------------------------------------- */

/* ----------- Get option changements ------------ */
browserStorageOnChanged.addListener((changes) => {
  let [key, { oldValue, newValue }] = Object.entries(changes)[0];
  if (key !== "options") return;

  function convert(inputOptions) {
    inputOptions;
    let option = {};
    inputOptions.forEach((item) => {
      option[item.option] = item.Value === null ? item.Default : item.Value;
    });
    return option;
  }

  const differences = [];

  for (const key in convert(oldValue)) {
    if (Array.isArray(convert(oldValue)[key]) && Array.isArray(convert(newValue)[key])) {
      if (JSON.stringify(convert(oldValue)[key]) !== JSON.stringify(convert(newValue)[key])) differences.push([key, convert(newValue)[key]]);
    } else if (convert(oldValue)[key] !== convert(newValue)[key]) differences.push([key, convert(newValue)[key]]);
  }

  if (differences != []) {
    document.documentElement.dispatchEvent(new CustomEvent("optionEvent", { detail: differences }));
  }
});
/* ----------------------------------------------- */

/* ------------------ Register ------------------- */
registedOptions = {};

function register(func) {
  registedOptions[func.name] = func;
}
/* ----------------------------------------------- */

/* --------- Options Initialitialisator ---------- */
function Start(statue) {
  // Change le logo si l'une des options est activé
  if (Object.values(statue).some((obj) => obj.value === true) && document.querySelector("link[rel*='icon']")) document.querySelector("link[rel*='icon']").href = browser.runtime.getURL(`/icons/EcoleDirecte/magenta.ico`);

  // Execusion des modules avec message dans la console
  for (ele in statue) {
    let func = registedOptions[ele];
    let value = statue[ele].value;

    // Active le mode de debugage si activé
    if (ele == "dev" && value) debug.dev(statue[ele].secondary);

    // Option lié a aucune fonction
    if (!func) continue;

    if (!value) {
      debug.startOptionLog(func.name, false);
      continue;
    }

    try {
      func(statue[ele].secondary, value);
      debug.startOptionLog(func.name, true);
      debug.log(func.name + " >>> Successful execution");
    } catch (error) {
      console.error(error);
      debug.startOptionLog(`${func.name} [Error]`, true);
      debug.log(func.name + " >>> Error on execution");
    }
  }
}

function Run() {
  browserStorage.get((inputOptions) => {
    if (!inputOptions.options) console.log(inputOptions);
    if (!inputOptions.options) return;
    inputOptions = inputOptions.options ? inputOptions.options : inputOptions;
    let option = {};
    let secondaryOption = [];
    inputOptions.forEach((item) => {
      if (item.lock === false) {
        option[item.option] = { value: item.Value === null ? item.Default : item.Value, secondary: {} };
      } else {
        secondaryOption.push({ option: item.option, value: item.Value === null ? item.Default : item.Value, secondary: item.lock });
      }
    });
    secondaryOption.forEach((item) => {
      option[item.secondary].secondary[item.option] = item.value;
    });

    const readystateHandler = () => {
      if (["complete", "interactive"].includes(document.readyState)) {
        Start(option);
        document.removeEventListener("readystatechange", readystateHandler);
      }
    };

    document.addEventListener("readystatechange", readystateHandler);
    readystateHandler();
  });
}
Run();
/* ----------------------------------------------- */

/* -------------- Options Fonctions -------------- */
function noteTableAnalysis(options) {
  // Setup Module internal log
  let logName = arguments.callee.name;

  function log(str) {
    debug.log(logName, str);
  }

  optionsConfig(options, (option) => {
    document.documentElement.setAttribute(option[0], option[1]);
    if (option[0] == "AveragesInfluenceTooltips") {
      switch (option[1]) {
        case "textAndValue":
        case "value":
          window.postMessage("tippy-noteEvent-enable", "*");
          break;
        case "none":
          window.postMessage("tippy-noteEvent-disable", "*");
          break;
      }
    }
  });

  try {
    const tippy = document.createElement("script");
    tippy.src = browser.runtime.getURL("/scripts/tippy.js");
    document.head.appendChild(tippy);
    tippyState = true;
    log("Tippy -> [ Added ]");
  } catch {
    tippyState = false;
    log("Tippy -> [ ⚠️ Can't be added ]");
  }

  // Fonction Arrondie
  function hundredthRound(x) {
    return parseFloat(x.toFixed(2)).toString().replace(".", ",");
  }

  // --- Custom Notes: CSS + helpers ---
  if (!document.getElementById("cd-custom-note-css")) {
    const customNoteCSS = document.createElement("style");
    customNoteCSS.id = "cd-custom-note-css";
    customNoteCSS.textContent = `
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
        cursor: pointer; padding: 0; margin-left: 4px;
        vertical-align: middle; transition: all 0.15s;
      }
      .cd-add-note-btn:hover { background: var(--primary-color); color: white; }
      .cd-clear-notes-btn {
        display: inline-flex; align-items: center; justify-content: center;
        width: 18px; height: 18px; border-radius: 50%;
        border: 2px solid var(--primary-color); background: transparent; color: var(--primary-color);
        cursor: pointer; padding: 0; margin-left: 2px;
        vertical-align: middle; transition: all 0.15s;
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
        cursor: pointer; font-size: 11px; font-weight: 600;
        font-family: inherit; transition: all 0.15s;
      }
      .cd-add-subject-btn:hover { background: var(--primary-color); color: white; }
      .cd-subject-delete-btn {
        display: inline-flex; align-items: center; justify-content: center;
        width: 18px; height: 18px; border-radius: 50%;
        border: 2px solid var(--primary-color); background: transparent; color: var(--primary-color);
        cursor: pointer; padding: 0; margin-left: 6px;
        vertical-align: middle; transition: all 0.15s;
      }
      .cd-subject-delete-btn:hover { background: var(--primary-color); color: white; }
      .cd-custom-subject-badge {
        display: inline-block; font-size: 9px; font-weight: 700;
        color: var(--primary-color); border: 1px solid var(--primary-color);
        border-radius: 3px; padding: 1px 4px; margin-left: 6px;
        opacity: 0.7; vertical-align: middle;
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
        cursor: pointer; font-size: 11px; font-weight: 600;
        font-family: inherit; transition: all 0.15s;
        background: var(--smalldark-placeholder-color); color: inherit;
      }
      .cd-reset-all-mods-btn:hover { background: var(--dark-placeholder-color); }
    `;
    document.head.appendChild(customNoteCSS);
  }

  function getCustomNotes(subjectName) {
    try { return JSON.parse(localStorage.getItem("customNotes_" + subjectName) || "[]"); }
    catch { return []; }
  }

  function saveCustomNotes(subjectName, notes) {
    localStorage.setItem("customNotes_" + subjectName, JSON.stringify(notes));
  }

  function getCustomSubjects() {
    try { return JSON.parse(localStorage.getItem("customSubjects") || "[]"); }
    catch { return []; }
  }

  function saveCustomSubjects(subjects) {
    localStorage.setItem("customSubjects", JSON.stringify(subjects));
  }

  function getModifiedNotes(subjectName) {
    try { return JSON.parse(localStorage.getItem("modifiedNotes_" + subjectName) || "{}"); }
    catch { return {}; }
  }

  function saveModifiedNotes(subjectName, mods) {
    localStorage.setItem("modifiedNotes_" + subjectName, JSON.stringify(mods));
  }

  function openCustomNoteModal(subjectName, onSuccess) {
    const overlay = document.createElement("div");
    overlay.className = "cd-modal-overlay";
    overlay.innerHTML =
      '<div class="cd-modal">' +
        '<h3>Note simulée</h3>' +
        '<p class="cd-modal-subject">' + subjectName + '</p>' +
        '<div class="cd-modal-row">' +
          '<div class="cd-modal-field"><label>Note</label><input type="number" id="cd-f-note" min="0" step="0.5" value="10"></div>' +
          '<div class="cd-modal-sep">/</div>' +
          '<div class="cd-modal-field"><label>Sur</label><input type="number" id="cd-f-sur" min="1" step="1" value="20"></div>' +
          '<div class="cd-modal-field cd-modal-coef-wrap"><label>Coef.</label><input type="number" id="cd-f-coef" min="0.1" step="0.5" value="1"></div>' +
        '</div>' +
        '<div class="cd-modal-error" id="cd-modal-error">Valeurs invalides.</div>' +
        '<div class="cd-modal-actions">' +
          '<button class="cd-modal-btn cd-modal-btn-secondary" id="cd-cancel">Annuler</button>' +
          '<button class="cd-modal-btn cd-modal-btn-primary" id="cd-add">Ajouter</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(overlay);
    overlay.querySelector("#cd-f-note").focus();

    overlay.querySelector("#cd-cancel").addEventListener("click", () => overlay.remove());
    overlay.addEventListener("click", (e) => { if (e.target === overlay) overlay.remove(); });
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
        err.textContent = "La note ne peut pas dépasser le barème (" + sur + ").";
        err.style.display = "block";
        return;
      }
      const arr = getCustomNotes(subjectName);
      arr.push({ note, sur, coef });
      saveCustomNotes(subjectName, arr);
      overlay.remove();
      onSuccess();
    });
  }

  function openClearAllNotesModal(totalNotes, subjectCount, onConfirm) {
    const overlay = document.createElement("div");
    overlay.className = "cd-modal-overlay";
    overlay.innerHTML =
      '<div class="cd-modal">' +
        '<h3>Tout supprimer</h3>' +
        '<p class="cd-modal-confirm-msg">' +
          totalNotes + ' note simulée' + (totalNotes > 1 ? 's' : '') +
          ' sur ' + subjectCount + ' matière' + (subjectCount > 1 ? 's' : '') +
          ' seront supprimées.' +
        '</p>' +
        '<div class="cd-modal-actions">' +
          '<button class="cd-modal-btn cd-modal-btn-secondary" id="cd-cancel">Annuler</button>' +
          '<button class="cd-modal-btn cd-modal-btn-primary" id="cd-confirm">Supprimer tout</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(overlay);

    overlay.querySelector("#cd-cancel").addEventListener("click", () => overlay.remove());
    overlay.addEventListener("click", (e) => { if (e.target === overlay) overlay.remove(); });
    overlay.addEventListener("keydown", (e) => {
      if (e.key === "Escape") overlay.remove();
      if (e.key === "Enter") overlay.querySelector("#cd-confirm").click();
    });

    overlay.querySelector("#cd-confirm").addEventListener("click", () => {
      overlay.remove();
      onConfirm();
    });
  }

  function openClearNotesModal(subjectName, count, onSuccess) {
    const overlay = document.createElement("div");
    overlay.className = "cd-modal-overlay";
    overlay.innerHTML =
      '<div class="cd-modal">' +
        '<h3>Supprimer tout</h3>' +
        '<p class="cd-modal-subject">' + subjectName + '</p>' +
        '<p class="cd-modal-confirm-msg">' + count + ' note simulée' + (count > 1 ? 's' : '') + ' seront supprimées.</p>' +
        '<div class="cd-modal-actions">' +
          '<button class="cd-modal-btn cd-modal-btn-secondary" id="cd-cancel">Annuler</button>' +
          '<button class="cd-modal-btn cd-modal-btn-primary" id="cd-confirm">Supprimer</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(overlay);

    overlay.querySelector("#cd-cancel").addEventListener("click", () => overlay.remove());
    overlay.addEventListener("click", (e) => { if (e.target === overlay) overlay.remove(); });
    overlay.addEventListener("keydown", (e) => {
      if (e.key === "Escape") overlay.remove();
      if (e.key === "Enter") overlay.querySelector("#cd-confirm").click();
    });

    overlay.querySelector("#cd-confirm").addEventListener("click", () => {
      saveCustomNotes(subjectName, []);
      overlay.remove();
      onSuccess();
    });
  }

  function openAddSubjectModal(onSuccess) {
    const overlay = document.createElement("div");
    overlay.className = "cd-modal-overlay";
    overlay.innerHTML =
      '<div class="cd-modal">' +
        '<h3>Nouvelle matière</h3>' +
        '<p class="cd-modal-subject">Matière personnalisée</p>' +
        '<div style="display:flex;flex-direction:column;gap:12px;">' +
          '<div class="cd-modal-field">' +
            '<label>Nom</label>' +
            '<input type="text" id="cd-f-subj-name" placeholder="ex. Philosophie" style="width:180px;text-align:left;">' +
          '</div>' +
          '<div class="cd-modal-field">' +
            '<label>Coef.</label>' +
            '<input type="number" id="cd-f-subj-coef" min="0.1" step="0.5" value="1">' +
          '</div>' +
        '</div>' +
        '<div class="cd-modal-error" id="cd-modal-subj-error"></div>' +
        '<div class="cd-modal-actions">' +
          '<button class="cd-modal-btn cd-modal-btn-secondary" id="cd-subj-cancel">Annuler</button>' +
          '<button class="cd-modal-btn cd-modal-btn-primary" id="cd-subj-add">Ajouter</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(overlay);
    overlay.querySelector("#cd-f-subj-name").focus();

    overlay.querySelector("#cd-subj-cancel").addEventListener("click", () => overlay.remove());
    overlay.addEventListener("click", (e) => { if (e.target === overlay) overlay.remove(); });
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
      if (subjects.some(s => s.name === name)) {
        err.textContent = "Une matière avec ce nom existe déjà.";
        err.style.display = "block";
        return;
      }
      subjects.push({ name, coef });
      saveCustomSubjects(subjects);
      overlay.remove();
      onSuccess();
    });
  }

  function openEditNoteModal(subjectName, noteIndex, origNote, origSur, origCoef, onSuccess) {
    const mods = getModifiedNotes(subjectName);
    const current = mods[noteIndex] || { note: origNote, sur: origSur, coef: origCoef };
    const overlay = document.createElement("div");
    overlay.className = "cd-modal-overlay";
    overlay.innerHTML =
      '<div class="cd-modal">' +
        '<h3>Modifier la note</h3>' +
        '<p class="cd-modal-subject">' + subjectName + '</p>' +
        '<p style="font-size:11px;color:var(--dark-placeholder-color);margin:0 0 12px;">Note originale : <strong>' + String(origNote).replace(".", ",") + '/' + origSur + (origCoef !== 1 ? ' (coef. ' + origCoef + ')' : '') + '</strong></p>' +
        '<div class="cd-modal-row">' +
          '<div class="cd-modal-field"><label>Note</label><input type="number" id="cd-f-edit-note" min="0" step="0.5" value="' + current.note + '"></div>' +
          '<div class="cd-modal-sep">/</div>' +
          '<div class="cd-modal-field"><label>Sur</label><input type="number" id="cd-f-edit-sur" min="1" step="1" value="' + current.sur + '"></div>' +
          '<div class="cd-modal-field cd-modal-coef-wrap"><label>Coef.</label><input type="number" id="cd-f-edit-coef" min="0.1" step="0.5" value="' + current.coef + '"></div>' +
        '</div>' +
        '<div class="cd-modal-error" id="cd-edit-modal-error"></div>' +
        '<div class="cd-modal-actions">' +
          (mods[noteIndex] ? '<button class="cd-modal-btn cd-modal-btn-secondary" id="cd-edit-reset" style="margin-right:auto;">Réinitialiser</button>' : '') +
          '<button class="cd-modal-btn cd-modal-btn-secondary" id="cd-edit-cancel">Annuler</button>' +
          '<button class="cd-modal-btn cd-modal-btn-primary" id="cd-edit-save">Enregistrer</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(overlay);
    overlay.querySelector("#cd-f-edit-note").focus();
    overlay.querySelector("#cd-f-edit-note").select();

    overlay.querySelector("#cd-edit-cancel").addEventListener("click", () => overlay.remove());
    overlay.addEventListener("click", (e) => { if (e.target === overlay) overlay.remove(); });
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
        err.textContent = "La note ne peut pas dépasser le barème (" + sur + ").";
        err.style.display = "block";
        return;
      }
      const m = getModifiedNotes(subjectName);
      m[noteIndex] = { note, sur, coef };
      saveModifiedNotes(subjectName, m);
      overlay.remove();
      onSuccess();
    });
  }

  function openResetAllModsModal(count, onConfirm) {
    const overlay = document.createElement("div");
    overlay.className = "cd-modal-overlay";
    overlay.innerHTML =
      '<div class="cd-modal">' +
        '<h3>Rétablir toutes les notes</h3>' +
        '<p class="cd-modal-confirm-msg">' +
          count + ' modification' + (count > 1 ? 's' : '') + ' seront annulées.' +
        '</p>' +
        '<div class="cd-modal-actions">' +
          '<button class="cd-modal-btn cd-modal-btn-secondary" id="cd-cancel">Annuler</button>' +
          '<button class="cd-modal-btn cd-modal-btn-primary" id="cd-confirm">Rétablir tout</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(overlay);
    overlay.querySelector("#cd-cancel").addEventListener("click", () => overlay.remove());
    overlay.addEventListener("click", (e) => { if (e.target === overlay) overlay.remove(); });
    overlay.addEventListener("keydown", (e) => {
      if (e.key === "Escape") overlay.remove();
      if (e.key === "Enter") overlay.querySelector("#cd-confirm").click();
    });
    overlay.querySelector("#cd-confirm").addEventListener("click", () => {
      overlay.remove();
      onConfirm();
    });
  }

  function openDeleteSubjectModal(subjectName, onConfirm) {
    const overlay = document.createElement("div");
    overlay.className = "cd-modal-overlay";
    overlay.innerHTML =
      '<div class="cd-modal">' +
        '<h3>Supprimer la matière</h3>' +
        '<p class="cd-modal-confirm-msg">La matière <strong>' + subjectName + '</strong> et toutes ses notes simulées seront supprimées.</p>' +
        '<div class="cd-modal-actions">' +
          '<button class="cd-modal-btn cd-modal-btn-secondary" id="cd-cancel">Annuler</button>' +
          '<button class="cd-modal-btn cd-modal-btn-primary" id="cd-confirm">Supprimer</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(overlay);

    overlay.querySelector("#cd-cancel").addEventListener("click", () => overlay.remove());
    overlay.addEventListener("click", (e) => { if (e.target === overlay) overlay.remove(); });
    overlay.addEventListener("keydown", (e) => {
      if (e.key === "Escape") overlay.remove();
      if (e.key === "Enter") overlay.querySelector("#cd-confirm").click();
    });

    overlay.querySelector("#cd-confirm").addEventListener("click", () => {
      overlay.remove();
      onConfirm();
    });
  }
  // --- End Custom Notes Setup ---

  // Detecte les changement du body et execute quand nécésaire 'Calculator()'
  log("BodyObserver -> [ Starting ]");
  const averageTableObserver = new MutationObserver(() => {
    let TableParent = document.getElementById("encart-notes");
    let periodeElement = document.getElementById("unePeriode");

    // Si le tableau des moyennes n'existe pas, le crée
    if (typeof averageTable == "undefined") averageTable = false;
    if (!averageTable) averageTable = false;

    // Cherche si le tableau des moyennes a été cherché
    try {
      averageTableSearch = periodeElement.dataset.averageTableSearch;
      if (!averageTableSearch) averageTableSearch = false;
    } catch (error) {
      averageTableSearch = true;
    }

    // Si le tableau des moyennes n'a pas encore été cherché
    if (TableParent && periodeElement && !averageTableSearch) {
      periodeElement.dataset.averageTableSearch = averageTableSearch = true;
      // Cherche le tableau des moyennes
      try {
        log(" > averageTable conditions analysis  -> [ Starting ]");
        activeTab = periodeElement.querySelector("li.active > a");
        tabs = periodeElement.querySelectorAll("[role=tab]");
        averageTableFound = periodeElement.dataset.averageTableFound;

        // Si les conditions de recherche sont valides
        if (tabs && !averageTableFound && activeTab) {
          log(" > > averageTable search conditions -> [ Valid ]");
          // Pour chaque onglet
          try {
            for (let i = 0; i < tabs.length; i++) {
              // Si l'onglet est l'onglet actif, le saute
              const element = tabs[i];
              if (element === activeTab) continue;

              element.click();

              if (!document.getElementById("encart-moyennes")) continue;

              // Si le tableau des moyennes est trouvé
              if (document.getElementById("encart-moyennes").querySelector("table")) {
                log(" > > averageTable -> [ Found ]");
                averageTable = document.getElementById("encart-moyennes").querySelector("table").cloneNode(true);
                periodeElement.dataset.averageTableFound = true;
                break;
              }
            }
          } catch (error) {
            log(" > > averageTable -> [ ⚠️ Error ]");
          }
          if (!averageTable) log(" > > averageTable -> [ ⚠️ Non-existent ]");

          activeTab.click();
          return;
        }
      } catch (error) {
        log(" > > averageTable -> [ ⚠️ Impossible to find ]");
      }
    }

    // execute 'Calculator()' si le tableau actuellement affiché n'a pas déjà été modifié
    if (TableParent && TableParent.dataset.averageCalculator != "true") {
      log("New gradeTable not calculated -> [ Found ]");

      TableParent.dataset.averageCalculator = true;
      Calculator(TableParent, averageTableAnalysis(averageTable));
    }
  });
  averageTableObserver.observe(document.body, {
    childList: true,
    subtree: true,
  });

  function averageTableAnalysis(averageTable) {
    if (!averageTable) return false;
    log("AverageTable analysis -> [ Starting ]");

    averageTableLines = {};

    try {
      for (line of averageTable.tBodies[0].rows) {
        if (!line.querySelector(".libellediscipline").innerText) continue;
        if (line.querySelector(".libellediscipline").innerText == "") continue;

        newFormat = (ele) => {
          try {
            newEle = parseFloat(ele.innerText.replace(",", "."));
            if (isNaN(newEle) || typeof newEle !== "number") {
              throw new Exception();
            }
            return newEle;
          } catch {
            try {
              if (debug.active) ele.setAttribute("style", "border: dashed red;");
            } catch {}
            return false;
          }
        };

        average = line.querySelector(".moyenneeleve") ? newFormat(line.querySelector(".moyenneeleve")) : false;
        classAverage = line.querySelector(".moyenneclasse") ? newFormat(line.querySelector(".moyenneclasse")) : false;

        if (!average) continue;

        averageTableLines[line.querySelector(".libellediscipline").innerText] = { average: average, classAverage: classAverage };
      }
    } catch (error) {
      log(" > AverageTable analysis -> [ ⚠️ Error ]");
      return false;
    }

    log(" > AverageTable analysis -> [ Finish ]");
    if (averageTableLines == {}) return false;
    return averageTableLines;
  }

  function Calculator(TableParent, averageTableInfos) {
    log("GradeTable editing -> [ Starting ]");

    if (averageTableInfos) {
      const classAverages = Object.values(averageTableInfos).map((info) => info.classAverage);
      if (classAverages.every((average) => !average)) {
        options["ClassAveragesDisplay2"] = false;
      }
    }

    // Verifie la pressence du tableau
    if (!TableParent.querySelector("table")) {
      log(" > Table -> [ 🛑 Non-existent ]");
      return;
    }
    gradeTable = TableParent.querySelector("table");
    log(" > Table -> [ Find ]");

    // Met a jour le design
    gradeTable.classList.add("newTable");
    log(" > Table design -> [ Updated ]");

    try {
      // Change le message avec la date du dernier calcule de la moyenne
      TableParent.querySelector("p").innerHTML = "<b>Moyennes calculées par l'extension : " + browser.runtime.getManifest().name + "</b>";
      log(" > Message with last calculation date -> [ Updated ]");
    } catch {
      log(" > Message with last calculation date -> [ ⚠️ Non-existent or Untouchable ]");
    }

    if (options["generalAverageDisplay"]) {
      try {
        // Supprime l'ancienne ligne contenant la moyenne si il y en a une
        OldAverageLine = document.querySelector("table").querySelector("tr > td.moyennegenerale-valeur").parentNode;
        OldAverageLine.parentNode.removeChild(OldAverageLine);
        log(" > Old Average line -> [ Remove ]");
      } catch {
        log(" > Old Average line -> [ Non-existent or Untouchable ]");
      }

      try {
        // Supprime l'ancienne ligne contenant la moyenne si il y en a une
        oldAverageDiv = document.getElementById("averageDiv").parentNode;
        oldAverageDiv.parentNode.removeChild(oldAverageDiv);
        log(" > Old Average Display Div -> [ Remove ]");
      } catch {
        log(" > Old Average Display Div -> [ Non-existent or Untouchable ]");
      }

      // Ajoute une colone en pied du tableau
      gradeTableFooterRow = gradeTable.createTFoot().insertRow(0);
      gradeTableFooterRow.classList.add("ng-star-inserted");
      log(" > Table Footer -> [ Added ]");

      // Ajoute une div dans laquelle afficher la moyenne
      averageDiv = gradeTableFooterRow.insertCell(0);
      averageDiv.colSpan = gradeTable.tHead.rows[0].cells.length;
      averageDiv.classList.add("moyennegenerale-valeur", "averageDisplay");
      averageDiv.id = "averageDiv";
      averageDiv.innerText = "Erreur";
      log(" > Average Display Div -> [ Added ]");
    }

    // ### Analyse des notes et calcules des moyennes ###
    log(" > Grade analysis and Average calculation -> [ Starting ]");

    LinesGradesAndCoef = [];

    Lines = [];

    // Recherche la configuration du tableau
    log(" > > Table configuration finding -> [ Starting ]");
    tableConfiguration = {
      discipline: [false, undefined],
      coef: [false, undefined],
      moyenneclasse: [false, undefined],
      relevemoyenne: [false, undefined],
      notes: [false, undefined],
    };

    // Cherche l'index de chaque colones
    tableGetIndex = () => {
      [...gradeTable.tHead.rows[0].cells].forEach((cell, index) => {
        if (cell.classList.contains("discipline")) {
          log(" > > > Column {discipline} -> [ Found ]");
          tableConfiguration["discipline"][0] = index;
          if (tableConfiguration["discipline"][1] == undefined) tableConfiguration["discipline"][1] = true;
        }
        if (cell.classList.contains("coef")) {
          log(" > > > Column {coef} -> [ Found ]");
          tableConfiguration["coef"][0] = index;
          if (tableConfiguration["coef"][1] == undefined) tableConfiguration["coef"][1] = true;
        }
        if (cell.classList.contains("moyenneclasse")) {
          log(" > > > Column {moyenneclasse} -> [ Found ]");
          tableConfiguration["moyenneclasse"][0] = index;
          if (tableConfiguration["moyenneclasse"][1] == undefined) tableConfiguration["moyenneclasse"][1] = true;
        }
        if (cell.classList.contains("relevemoyenne")) {
          log(" > > > Column {relevemoyenne} -> [ Found ]");
          tableConfiguration["relevemoyenne"][0] = index;
          if (tableConfiguration["relevemoyenne"][1] == undefined) tableConfiguration["relevemoyenne"][1] = true;
        }
        if (cell.classList.contains("notes")) {
          log(" > > > Column {notes} -> [ Found ]");
          tableConfiguration["notes"][0] = index;
          if (tableConfiguration["notes"][1] == undefined) tableConfiguration["notes"][1] = true;
        }
      });
    };
    tableGetIndex();

    if (tableConfiguration["coef"][1] == undefined && options["AveragesPerSubjectDisplay"]) {
      log(" > > > Column {coef} -> [ ⚠️ Non-existent ] -> [ Genere ] -> [ Reload module ]");
      coefTitleRow = gradeTable.tHead.rows[0].insertCell(tableConfiguration["discipline"][0] + 1);
      coefTitleRow.outerHTML = `<th class="coef ng-star-inserted">Coef.</th>`;
      if (options["generalAverageDisplay"]) averageDiv.colSpan += 1;
      tableConfiguration["coef"][1] = false;
      tableGetIndex();
    }

    if (tableConfiguration["moyenneclasse"][1] == undefined && options["ClassAveragesDisplay2"] && averageTableInfos) {
      log(" > > > Column {moyenneclasse} -> [ Genere ] -> [ Reload module ]");
      moyenneclasseTitleRow = gradeTable.tHead.rows[0].insertCell(tableConfiguration["coef"][0] + 1);
      moyenneclasseTitleRow.outerHTML = `<th class="moyenneclasse ng-star-inserted">Classe</th>`;
      if (options["generalAverageDisplay"]) averageDiv.colSpan += 1;
      tableConfiguration["moyenneclasse"][1] = false;
      tableGetIndex();
    }

    if (tableConfiguration["relevemoyenne"][1] == undefined && options["AveragesPerSubjectDisplay"]) {
      log(" > > > Column {relevemoyenne} -> [ ⚠️ Non-existent ] -> [ Genere ] -> [ Reload module ]");
      if (options["ClassAveragesDisplay2"] && averageTableInfos) relevemoyenneTitleRow = gradeTable.tHead.rows[0].insertCell(tableConfiguration["moyenneclasse"][0] + 1);
      else relevemoyenneTitleRow = gradeTable.tHead.rows[0].insertCell(tableConfiguration["coef"][0] + 1);
      relevemoyenneTitleRow.outerHTML = `<th class="relevemoyenne ng-star-inserted">Moyennes</th>`;
      if (options["generalAverageDisplay"]) averageDiv.colSpan += 1;
      tableConfiguration["relevemoyenne"][1] = false;
      tableGetIndex();
    }

    // Vérifi la presence de chaque index
    log(" > > Table configuration Analysis -> [ Starting ]");
    for (item in tableConfiguration) {
      log(` > > > Column {${item}} -> [ ${tableConfiguration[item][1] === true ? "Here" : "⚠️ Not Here"} ]`);
      tableConfiguration[item][0] !== false ? undefined : (tableConfiguration[item] = false);
    }

    // Verifie la pressence de la colonne des notes
    if (!tableConfiguration["notes"][0]) {
      if (options["generalAverageDisplay"]) averageDiv.innerText = "Colonne des notes introuvables";
      log(" > > Column Note -> [ 🛑 Non-existent ]");
      return;
    }

    // Fonction moyennePondere
    const moyennePondere = (liste) => liste.reduce((total, [combre, coeficient]) => total + combre * coeficient, 0) / liste.reduce((total, [_, coeficient]) => total + coeficient, 0);

    // --- Custom notes: refresh helper ---
    function refreshNotes() {
      TableParent.dataset.averageCalculator = "";
      Calculator(TableParent, averageTableAnalysis(averageTable));
      TableParent.dataset.averageCalculator = "true";
    }

    // --- Global action buttons (add subject + clear notes) ---
    const cdExistingWrapper = TableParent.querySelector(".cd-global-clear-wrapper");
    if (cdExistingWrapper) cdExistingWrapper.remove();

    const cdAllKeys = Object.keys(localStorage).filter(k => k.startsWith("customNotes_"));
    const cdTotalCount = cdAllKeys.reduce((sum, k) => {
      try { return sum + JSON.parse(localStorage.getItem(k) || "[]").length; } catch { return sum; }
    }, 0);

    const cdWrapper = document.createElement("div");
    cdWrapper.className = "cd-global-clear-wrapper";

    const cdAddSubjectBtn = document.createElement("button");
    cdAddSubjectBtn.type = "button";
    cdAddSubjectBtn.className = "cd-add-subject-btn";
    cdAddSubjectBtn.innerHTML = '<svg width="10" height="10" viewBox="0 0 10 10" fill="none" style="pointer-events:none"><line x1="5" y1="1" x2="5" y2="9" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/><line x1="1" y1="5" x2="9" y2="5" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/></svg> Nouvelle matière';
    cdAddSubjectBtn.addEventListener("click", () => { openAddSubjectModal(refreshNotes); });
    cdWrapper.appendChild(cdAddSubjectBtn);

    if (cdTotalCount > 0) {
      const cdSubjectCount = cdAllKeys.filter(k => {
        try { return JSON.parse(localStorage.getItem(k) || "[]").length > 0; } catch { return false; }
      }).length;
      const cdGlobalClearBtn = document.createElement("button");
      cdGlobalClearBtn.type = "button";
      cdGlobalClearBtn.className = "cd-global-clear-btn";
      cdGlobalClearBtn.textContent = "Supprimer toutes les notes simulées (" + cdTotalCount + ")";
      cdGlobalClearBtn.addEventListener("click", () => {
        openClearAllNotesModal(cdTotalCount, cdSubjectCount, () => {
          cdAllKeys.forEach(k => localStorage.removeItem(k));
          refreshNotes();
        });
      });
      cdWrapper.appendChild(cdGlobalClearBtn);
    }

    const cdModAllKeys = Object.keys(localStorage).filter(k => k.startsWith("modifiedNotes_"));
    const cdTotalMods = cdModAllKeys.reduce((sum, k) => {
      try { return sum + Object.keys(JSON.parse(localStorage.getItem(k) || "{}")).length; } catch { return sum; }
    }, 0);
    if (cdTotalMods > 0) {
      const cdResetAllModsBtn = document.createElement("button");
      cdResetAllModsBtn.type = "button";
      cdResetAllModsBtn.className = "cd-reset-all-mods-btn";
      cdResetAllModsBtn.textContent = "Rétablir toutes les notes modifiées (" + cdTotalMods + ")";
      cdResetAllModsBtn.addEventListener("click", () => {
        openResetAllModsModal(cdTotalMods, () => {
          cdModAllKeys.forEach(k => localStorage.removeItem(k));
          refreshNotes();
        });
      });
      cdWrapper.appendChild(cdResetAllModsBtn);
    }

    gradeTable.after(cdWrapper);
    // --- End global action buttons ---

    // --- Inject custom subject rows ---
    gradeTable.tBodies[0].querySelectorAll("tr.cd-custom-subject-row").forEach(r => r.remove());

    const cdCustomSubjectsList = getCustomSubjects();
    cdCustomSubjectsList.forEach((subject) => {
      const tr = document.createElement("tr");
      tr.className = "ng-star-inserted cd-custom-subject-row";

      const totalCols = gradeTable.tHead.rows[0].cells.length;
      for (let i = 0; i < totalCols; i++) tr.insertCell(i).className = "ng-star-inserted";

      const disCol = tableConfiguration["discipline"][0];
      const coefCol = tableConfiguration["coef"] ? tableConfiguration["coef"][0] : false;
      const notesCol = tableConfiguration["notes"] ? tableConfiguration["notes"][0] : false;
      const avgCol = tableConfiguration["relevemoyenne"] ? tableConfiguration["relevemoyenne"][0] : false;
      const classAvgCol = tableConfiguration["moyenneclasse"] ? tableConfiguration["moyenneclasse"][0] : false;

      tr.cells[disCol].classList.add("discipline");
      const nameSpan = document.createElement("span");
      nameSpan.className = "nommatiere ng-star-inserted";
      nameSpan.textContent = subject.name;
      tr.cells[disCol].appendChild(nameSpan);

      const badge = document.createElement("span");
      badge.className = "cd-custom-subject-badge";
      badge.textContent = "perso";
      tr.cells[disCol].appendChild(badge);

      const csDelBtn = document.createElement("button");
      csDelBtn.type = "button";
      csDelBtn.className = "cd-subject-delete-btn";
      csDelBtn.title = "Supprimer cette matière";
      csDelBtn.innerHTML = '<svg width="9" height="9" viewBox="0 0 9 9" fill="none" style="pointer-events:none"><line x1="1.5" y1="1.5" x2="7.5" y2="7.5" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><line x1="7.5" y1="1.5" x2="1.5" y2="7.5" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>';
      const capturedSubjectName = subject.name;
      csDelBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        openDeleteSubjectModal(capturedSubjectName, () => {
          const subs = getCustomSubjects();
          const idx = subs.findIndex(s => s.name === capturedSubjectName);
          if (idx !== -1) subs.splice(idx, 1);
          saveCustomSubjects(subs);
          localStorage.removeItem("customNotes_" + capturedSubjectName);
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
    // --- End inject custom subject rows ---

    // Pour chaque ligne
    log(" > > Line by Line analysis -> [ Starting ]");
    for (line of gradeTable.tBodies[0].rows) {
      if (line.querySelector("td.moyennegenerale-valeur") != null) {
        continue;
      }

      lineTitle = line.cells[tableConfiguration["discipline"][0]].querySelector(".nommatiere") ? line.cells[tableConfiguration["discipline"][0]].querySelector(".nommatiere").innerText : false;

      if (tableConfiguration["coef"][1] == false && options["AveragesPerSubjectDisplay"] && !line.classList.contains("cd-custom-subject-row")) {
        log(" > > > Line Element {coef} -> [ ⚠️ Non-existent ] -> [ Genere ]");
        coefTitleCell = line.insertCell(tableConfiguration["coef"][0]);
        coefTitleCell.innerHTML = `<span class="ng-star-inserted">1</span>`;
        coefTitleCell.classList.add("coef", "ng-star-inserted");
      }

      if (tableConfiguration["moyenneclasse"][1] == false && options["ClassAveragesDisplay2"] && averageTableInfos && !line.classList.contains("cd-custom-subject-row")) {
        log(" > > > Line Element {moyenneclasse} -> [ Genere ]");
        moyenneclasseTitleCell = line.insertCell(tableConfiguration["moyenneclasse"][0]);
        moyenneclasseTitleCell.classList.add("moyenneclasse", "ng-star-inserted");
        moyenneclasseSpan = document.createElement("span");
        moyenneclasseSpan.classList.add("ng-star-inserted");
        moyenneclasseTitleCell.appendChild(moyenneclasseSpan);
        if (averageTableInfos && averageTableInfos[lineTitle]) {
          if (averageTableInfos[lineTitle].classAverage) moyenneclasseSpan.innerHTML = hundredthRound(averageTableInfos[lineTitle].classAverage);
        }
      }

      if (tableConfiguration["relevemoyenne"][1] == false && options["AveragesPerSubjectDisplay"] && !line.classList.contains("cd-custom-subject-row")) {
        log(" > > > Line Element {relevemoyenne} -> [ ⚠️ Non-existent ] -> [ Genere ]");
        relevemoyenneTitleCell = line.insertCell(tableConfiguration["relevemoyenne"][0]);
        relevemoyenneTitleCell.classList.add("relevemoyenne", "ng-star-inserted");
      }

      // --- Inject custom notes (after artificial cells are in correct positions) ---
      if (lineTitle && tableConfiguration["notes"][0] !== false) {
        const cdNotesCell = line.cells[tableConfiguration["notes"][0]];
        const cdSubjectName = lineTitle; // capture before next iteration overwrites lineTitle
        if (cdNotesCell) {
          cdNotesCell.querySelectorAll(".cd-custom-note-wrapper, .cd-add-note-btn, .cd-clear-notes-btn").forEach((el) => el.remove());

          // Unwrap previous edit wrappers, restoring original ED buttons as direct children
          cdNotesCell.querySelectorAll(".cd-edit-note-wrapper").forEach(wrapper => {
            const btn = wrapper.querySelector(":scope > button");
            if (btn) wrapper.replaceWith(btn);
            else wrapper.remove();
          });

          // Wrap each ED note button with edit controls and apply any modifications
          const cdMods = getModifiedNotes(cdSubjectName);
          [...cdNotesCell.querySelectorAll("button")].forEach((btn, cdEdIdx) => {
            const valeurSpan = btn.querySelector(":scope > span.valeur");
            if (!valeurSpan) return;

            // Store original values on first encounter (before any modification)
            if (btn.dataset.cdOrigNote === undefined) {
              let origTextNode = null;
              for (const node of valeurSpan.childNodes) {
                if (node.nodeType === Node.TEXT_NODE) { origTextNode = node; break; }
              }
              btn.dataset.cdOrigNote = origTextNode ? origTextNode.nodeValue.trim() : "";
              btn.dataset.cdOrigSur = valeurSpan.querySelector(".quotien") ? valeurSpan.querySelector(".quotien").textContent.replace("/", "") : "20";
              btn.dataset.cdOrigCoef = valeurSpan.querySelector(".coef") ? valeurSpan.querySelector(".coef").textContent.replace("(", "").replace(")", "") : "1";
            }

            // Restore DOM to original values before applying any modification
            let textNode = null;
            for (const node of valeurSpan.childNodes) {
              if (node.nodeType === Node.TEXT_NODE) { textNode = node; break; }
            }
            if (textNode) textNode.nodeValue = btn.dataset.cdOrigNote;
            else valeurSpan.prepend(document.createTextNode(btn.dataset.cdOrigNote));

            let qEl = valeurSpan.querySelector(".quotien");
            if (btn.dataset.cdOrigSur !== "20") {
              if (!qEl) { qEl = document.createElement("span"); qEl.className = "quotien ng-star-inserted"; valeurSpan.appendChild(qEl); }
              qEl.textContent = "/" + btn.dataset.cdOrigSur;
            } else if (qEl) { qEl.remove(); }

            let cEl = valeurSpan.querySelector(".coef");
            if (btn.dataset.cdOrigCoef !== "1") {
              if (!cEl) { cEl = document.createElement("span"); cEl.className = "coef ng-star-inserted"; valeurSpan.appendChild(cEl); }
              cEl.textContent = "(" + btn.dataset.cdOrigCoef + ")";
            } else if (cEl) { cEl.remove(); }

            // Apply stored modification to DOM (Calculator will read these values)
            const mod = cdMods[cdEdIdx];
            if (mod) {
              let tn = null;
              for (const node of valeurSpan.childNodes) {
                if (node.nodeType === Node.TEXT_NODE) { tn = node; break; }
              }
              if (tn) tn.nodeValue = String(mod.note).replace(".", ",");
              else valeurSpan.prepend(document.createTextNode(String(mod.note).replace(".", ",")));

              let qEl2 = valeurSpan.querySelector(".quotien");
              if (mod.sur !== 20) {
                if (!qEl2) { qEl2 = document.createElement("span"); qEl2.className = "quotien ng-star-inserted"; valeurSpan.appendChild(qEl2); }
                qEl2.textContent = "/" + mod.sur;
              } else if (qEl2) { qEl2.remove(); }

              let cEl2 = valeurSpan.querySelector(".coef");
              if (mod.coef !== 1) {
                if (!cEl2) { cEl2 = document.createElement("span"); cEl2.className = "coef ng-star-inserted"; valeurSpan.appendChild(cEl2); }
                cEl2.textContent = "(" + mod.coef + ")";
              } else if (cEl2) { cEl2.remove(); }
            }

            // Wrap button with edit controls
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
          // --- End inject ED note edit controls ---

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
            delBtn.title = "Supprimer cette note simulée";
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
          addBtn.title = "Ajouter une note simulée";
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
            clearBtn.title = "Supprimer toutes les notes simulées";
            clearBtn.innerHTML = '<svg width="9" height="9" viewBox="0 0 9 9" fill="none" style="pointer-events:none"><line x1="1.5" y1="1.5" x2="7.5" y2="7.5" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><line x1="7.5" y1="1.5" x2="1.5" y2="7.5" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>';
            clearBtn.addEventListener("click", (e) => {
              e.stopPropagation();
              openClearNotesModal(cdSubjectName, cdExistingNotes.length, refreshNotes);
            });
            cdNotesCell.appendChild(clearBtn);
          }
          // Mark the row so the average override is skipped when custom or modified notes exist
          line.dataset.cdHasCustomNotes = (getCustomNotes(cdSubjectName).length > 0 || Object.keys(getModifiedNotes(cdSubjectName)).length > 0) ? "1" : "";
        }
      }
      // --- End inject custom notes ---

      // Si il y au moins une note ou si la matiere contient des sous-matiere
      lineProperties = {
        this: line,
        title: lineTitle,
        HasNotes: line.cells[tableConfiguration["notes"][0]].childNodes.length > 1,
        IsMaster: line.classList.contains("master"),
        IsSecondary: line.classList.contains("secondary"),
        IsSecondaryButNotlast: line.classList.contains("secondarynotlast"),
        notes: [],
        average: false,
        averageSpan: false,
        coef: false,
        GradesAndCoef: [],
      };

      if (!(lineProperties["HasNotes"] || lineProperties["IsMaster"] || lineProperties["IsSecondary"])) {
        log(" > > > This line does not contain any notes and is neither Master ou Secondary -> [⚠️]");
        continue;
      }

      // Defini la zone d'afficharge de la moyenne de la ligne
      if (tableConfiguration["relevemoyenne"] && (averageColumn = tableConfiguration["relevemoyenne"][0])) {
        // Si il n'y a pas de span pour afficher la moyenne
        if (!(averageSpan = line.cells[averageColumn].querySelector("span"))) {
          log(` > > > Element for average display -> [ ⚠️ Non-existent ]`);
          averageSpan = document.createElement("span");
          averageSpan.classList.add("ng-star-inserted");
          line.cells[averageColumn].appendChild(averageSpan);
          log(` > > > Element for average display -> [ Added ]`);
        }
        if (debug.active) averageSpan.setAttribute("style", "border: solid darkblue;");
        averageSpan.innerText = "";
        log(` > > > Element for average display -> [ Defined ]`);
      } else {
        averageSpan = false;
        log(` > > > Element for average display -> [ ⚠️ Undefined ] <- because Column relevemoyenne Non-existent`);
      }

      // Defini la zone d'afficharge de la moyenne de la ligne
      if (tableConfiguration["relevemoyenne"] && (averageColumn = tableConfiguration["relevemoyenne"][0])) {
      }

      // Si il n'y a pas de span pour afficher la moyenne
      if (tableConfiguration["relevemoyenne"] && !(averageSpan = line.cells[averageColumn].querySelector("span"))) {
        log(` > > > Element for average display -> [ ⚠️ Non-existent ]`);
        averageSpan = document.createElement("span");
        averageSpan.classList.add("ng-star-inserted");
        line.cells[averageColumn].appendChild(averageSpan);
        log(` > > > Element for average display -> [ Added ]`);
      }

      if (tableConfiguration["relevemoyenne"]) {
        if (debug.active) averageSpan.setAttribute("style", "border: solid darkblue;");
        averageSpan.innerText = "";
        log(` > > > Element for average display -> [ Defined ]`);
      }

      // Trouve l'affichage du coef
      lineProperties.coef = 1;
      if (tableConfiguration["coef"] && (coefColumn = tableConfiguration["coef"][0])) {
        if ((coefSpan = line.cells[coefColumn].querySelector("span"))) {
          if (debug.active) coefSpan.setAttribute("style", "border: solid orange;");
          lineProperties.coef = parseFloat(coefSpan.innerText);
        }
      }

      // Dans le cas de ligne de type "Master"
      if (lineProperties["IsMaster"]) {
        log(` > > > New Master line Analysis -> [ Starting ]`);
        masterLineProperties = lineProperties;
        masterLineProperties.averageSpan = averageSpan;
        masterLineProperties.coef = lineProperties.coef;
        masterLineProperties.GradesAndCoef = [];
        continue;
      }
      // Dans le cas des autres types

      log(` > > > New line Analysis -> [ Starting ]`);

      lineProperties.averageSpan = averageSpan;
      lineProperties.coef = lineProperties.coef;

      // Pour chaque notes
      for (notes of line.cells[tableConfiguration["notes"][0]].querySelectorAll("button > span:nth-of-type(1).valeur")) {
        // Récuperation de la note
        try {
          note = parseFloat(notes.childNodes[0].nodeValue.replace(",", "."));
          if (isNaN(note)) throw new Exception();
        } catch {
          if (debug.active) notes.setAttribute("style", "border: dashed red;");
          log(` > > > > Note {${note}} format -> [ ⚠️ Invalid ]`);
          continue;
        }

        // Si un quotien est spécifié
        if (notes.querySelector(".quotien") != null) {
          try {
            quotient = parseFloat(notes.querySelector(".quotien").childNodes[0].nodeValue.replace("/", ""));
            if (isNaN(quotient)) throw new Exception();
          } catch {
            log(` > > > > Quotient {${quotient}} format -> [ ⚠️ Invalid ]`);
            continue;
          }
          note = note * (20 / quotient);
        }

        // Si un coef est spécifié
        coef = 1;
        if (notes.querySelector(".coef") != null) {
          try {
            coef = parseFloat(notes.querySelector(".coef ").childNodes[0].nodeValue.replace("(", "").replace(")", ""));
            if (isNaN(coef)) throw new Exception();
          } catch {
            log(` > > > > Coef {${coef}} format -> [ ⚠️ Invalid ]`);
            continue;
          }
        }

        if (debug.active) notes.setAttribute("style", "border: solid green;");

        log(` > > > > New Note {${note}} with coef {${coef}} -> [ Added ] `);

        // Ajout des notes et coefs pour la ligne
        lineProperties.GradesAndCoef.push([note, coef]);
        lineProperties["notes"].push([note, coef, notes]);
      }

      if (!(lineProperties.GradesAndCoef.length > 0)) {
        log(` > > > > No note in this line -> [⚠️]`);
        if (!lineProperties["IsSecondaryButNotlast"] && lineProperties["IsSecondary"]) {
          if (!masterLineProperties.GradesAndCoef.length) continue;
          // Si c'est la derniere ligne secondaire, calcule la somme de la principale
          masterLineProperties.average = moyennePondere(masterLineProperties.GradesAndCoef);
          masterLineProperties.GradesAndCoef.push([masterLineProperties.average, masterLineProperties.coef]);
          if (masterLineProperties.averageSpan) {
            masterLineProperties.averageSpan.innerText = hundredthRound(masterLineProperties.average);
            Lines.push(masterLineProperties);
          }
          log(` > > > > Master line average {${masterLineProperties.average}} with coef {${masterLineProperties.coef}}`);
        }
        continue;
      }

      // Calcule de la moyenne de la ligne
      lineProperties.average = moyennePondere(lineProperties.GradesAndCoef);
      if (!options["AveragesPerSubjectRecalculation"] && !line.dataset.cdHasCustomNotes && averageTableInfos && averageTableInfos[lineTitle]) {
        if (averageTableInfos[lineTitle].average) lineProperties.average = averageTableInfos[lineTitle].average;
      }
      Lines.push(lineProperties);

      // Affiche la nouvelle moyenne de la ligne
      if (tableConfiguration["relevemoyenne"][0]) {
        if (debug.active && !lineProperties["IsSecondary"]) averageSpan.setAttribute("style", "border: solid blue;");
        if (debug.active && lineProperties["IsSecondary"]) averageSpan.setAttribute("style", "border: solid red;");
        if (averageSpan) averageSpan.innerText = hundredthRound(lineProperties.average);
      }

      if (lineProperties["IsSecondary"]) {
        // Ajout des notes et coefs pour la ligne Master
        masterLineProperties.GradesAndCoef.push([lineProperties.average, lineProperties.coef]);
        log(` > > > > Secondary line average {${lineProperties.average}} with coef {${lineProperties.coef}}`);

        if (!lineProperties["IsSecondaryButNotlast"]) {
          if (!masterLineProperties.GradesAndCoef.length) continue;
          // Si c'est la derniere ligne secondaire, calcule la somme de la principale
          masterLineProperties.average = moyennePondere(masterLineProperties.GradesAndCoef);
          LinesGradesAndCoef.push([masterLineProperties.average, masterLineProperties.coef]);
          if (masterLineProperties.averageSpan) {
            masterLineProperties.averageSpan.innerText = hundredthRound(masterLineProperties.average);
            Lines.push(masterLineProperties);
          }
          log(` > > > > Master line average {${masterLineProperties.average}} with coef {${masterLineProperties.coef}}`);
        }
      }

      if (!lineProperties["IsSecondary"] && lineProperties["HasNotes"]) {
        // Ajout des notes et coefs pour la moyenne générale
        LinesGradesAndCoef.push([lineProperties.average, lineProperties.coef]);
        log(` > > > > Line average {${lineProperties.average}} with coef {${lineProperties.coef}}`);
      }
    }

    // Calcule la moyenne
    FinalAverage = moyennePondere(LinesGradesAndCoef);

    if (isNaN(FinalAverage)) {
      log(`Moyenne générale non valide -> [🛑]`);
      if (options["generalAverageDisplay"]) if (averageDiv) averageDiv.innerText = "Notes Introuvables";
      return;
    }

    // Affiche la moyenne
    log(` > Final Average : ${FinalAverage}`);
    if (options["generalAverageDisplay"]) if (averageDiv) averageDiv.innerText = "MOYENNE GENERALE : " + hundredthRound(FinalAverage);

    // Si le module de tooltip fonctionne
    if (!tippyState) return;

    // Calcule la somme des coef des matières
    Lines_SommeCoef = Lines.reduce((total, item) => (item.IsSecondary ? total : total + item.coef), 0);
    log(` > Total Coef {${Lines_SommeCoef}} -> [ Defined ]`);

    // Pour chaque ligne du tableau
    log(` > List of All Grade And Average Analysis -> [ Starting ]`);
    for (line of Lines) {
      log(` > > New Line Analysis -> [ Starting ]`);
      // Si elle n'est pas secondaire
      if (line.IsSecondary) continue;
      // Calcule sont influence
      LineInfluence = (line.coef * (line.average - FinalAverage)) / (Lines_SommeCoef - line.coef);
      log(` > > > Line Influence {${LineInfluence}} -> [ Defined ]`);
      // Si un span existe
      if (line.averageSpan) {
        // Parametrage de tippy
        tippytheme = "verybad";
        if (LineInfluence > -0.2) tippytheme = "bad";
        if (LineInfluence > -0.07) tippytheme = "neutral";
        if (LineInfluence > 0.07) tippytheme = "good";
        if (LineInfluence > 0.2) tippytheme = "verygood";
        line.averageSpan.parentNode.dataset.tippyTheme = tippytheme;
        line.averageSpan.parentNode.dataset.tippyContent = `<center><span class="tippyText" >Influence sur la moyenne générale : <br> </span><strong>${LineInfluence > 0 ? "+" : ""}${hundredthRound(LineInfluence)}</strong></center>`;
        line.averageSpan.parentNode.classList.add("notesAdvancedInformation");
        log(` > > > Line Average Span Tooltip -> [ Configured ]`);
        line.averageSpan.classList.add(`influence-${tippytheme}`);
        line.averageSpan.classList.add(`influence`);
        log(` > > > Line Average Span Color -> [ Added ]`);
      } else {
        log(` > > > Line Average Span -> [ ⚠️ Non-existent or Untouchable ]`);
      }
    }

    // Active tippy
    window.postMessage(options["AveragesInfluenceTooltips"] == "none" ? "tippy-noteEvent-disable" : "tippy-noteEvent-enable", "*");
  }
}
register(noteTableAnalysis);

function newSidebar(options) {
  // Setup Module internal log
  let logName = arguments.callee.name;

  function log(str) {
    debug.log(logName, str);
  }

  optionsConfig(options, (option) => {
    document.documentElement.setAttribute(option[0], option[1]);
  });

  // Ajoute la class "new-menu" au l'element HTML (pour la detection par le css)
  document.querySelector("html").classList.add("new-menu");
  log('css attribute "new-menu" -> [ Added ]');

  // Detecte les changement du body et execute quand nécésaire le code pour changer le menu
  log("BodyObserver -> [ Starting ]");
  const observer = new MutationObserver(() => {
    let loadingScreen = document.querySelector("ed-custom-busy");
    if (loadingScreen && loadingScreen.dataset.newLoadingScreenLoad != "true") {
      loadingScreen.dataset.newLoadingScreenLoad = true;
      loadingScreen.innerHTML = '<div class="lds-default"><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div></div>';
    }

    let menuElem = document.getElementById("container-menu");
    let usernameElem = document.getElementById("user-account-link");
    // execute le code si le menu actuellement affiché n'a pas déjà été modifié
    if (menuElem && usernameElem && menuElem.dataset.newmenuLoad != "true") {
      log("Menu editing -> [ Starting ]");

      // Indique que le menu à été modifié par l'extension
      menuElem.dataset.newmenuLoad = true;

      // Ajoute le nom de l'utilisateur dans un element de style et sous forme de variable css root
      rootName = document.createElement("style");
      rootName.innerHTML = `:root { --userName: "${usernameElem.innerText.trim().replace(/ /, "\\A ")}" }`;
      document.head.appendChild(rootName);
      log(" > UserName in CSS Root -> [ Added ]");

      // Crée une div pour insérer dedans les nouveaux boutons du menu
      menuMoreOptions = document.createElement("div");
      menuElem.appendChild(menuMoreOptions);
      menuMoreOptions.classList.add("menuMoreOptions");
      log(" > Div for new button -> [ Added ]");

      // Fonction qui permet d'ajouté un nouveau bouton au menu
      function menuAddNewOptions(id, icon, text, onclick) {
        // li
        li = document.createElement("li");
        menuMoreOptions.appendChild(li);

        // Element principale
        moreOptionElement = document.createElement("a");
        li.appendChild(moreOptionElement);
        moreOptionElement.id = `moreOption-${id}`;
        moreOptionElement.classList.add("moreOption");
        if (onclick) moreOptionElement.onclick = onclick;

        // Icon
        moreOptionElement_Icon = document.createElement("i");
        moreOptionElement.appendChild(moreOptionElement_Icon);
        moreOptionElement_Icon.classList.add("fa", icon);

        // Texte
        moreOptionElement_Span = document.createElement("span");
        moreOptionElement.appendChild(moreOptionElement_Span);
        moreOptionElement_Span.innerText = text;
      }

      // Ajout de nouveaux boutons
      log(" > Creation of news buttons -> [ Starting ]");
      menuAddNewOptions("Options", "fa-cog", "Personnalisation", () => document.querySelector("html").classList.add("optionsPopupActif"));
      log(" > Options button -> [ Added ]");
      menuAddNewOptions("Account", "fa-user", "Mon Compte", () => document.getElementById("user-account-link").click());
      log(" > Account button -> [ Added ]");
      menuAddNewOptions("Déconnexion", "fa-sign-out", "Déconnexion", () => document.querySelector(".logout").click());
      log(" > Deconnexion button -> [ Added ]");

      // Cache la bare qui contiens le nom et la bouton de déconnexion
      if (document.querySelector(".navbar-nav")) document.querySelector(".navbar-nav").style.display = "none";
      log(" > Name & Deco bar -> [ Hidden ]");
    }
  });
  observer.observe(document.body, {
    subtree: true,
    childList: true,
  });
}
register(newSidebar);

function customization(options) {
  document.documentElement.toggleAttribute("customization", true);

  optionsConfig(options, (option) => {
    document.documentElement.setAttribute(option[0], option[1]);
    if (option[0] == "darkmode") {
      switch (option[1]) {
        case true:
          window.postMessage("DarkReader-enable", "*");
          break;
        case false:
          window.postMessage("DarkReader-desable", "*");
          break;
      }
    }
  });

  customizationscss = document.createElement("style");
  fetch(browser.runtime.getURL("/styles/customizations.css"))
    .then((response) => response.text())
    .then((data) => {
      customizationscss.innerHTML = data;
    });
  document.head.appendChild(customizationscss);

  const darkreader = document.createElement("script");
  darkreader.src = browser.runtime.getURL("/scripts/darkreader.js");
  document.head.appendChild(darkreader);
}
register(customization);

function customizationButton(options, value) {
  optionsConfig(
    false, // config pour value et pas option
    (option) => {
      // exec / value
      document.documentElement.setAttribute(option[0], option[1]);
    },
    value, // value
    (value) => {
      // Transformeur de value
      return { customizationButton0: value[0], customizationButton1: value[1] };
    }
  );

  // Bouton de personnalisation
  optionsButtonDiv = document.createElement("div");
  optionsButtonDiv.classList.add("optionsButton");
  optionsButtonIcon = document.createElement("i");
  optionsButtonIcon.classList.add("fa", "fa-pencil");
  optionsButtonSpan = document.createElement("span");
  optionsButtonSpan.innerText = "Personnaliser EcoleDirecte";
  document.body.prepend(optionsButtonDiv);
  optionsButtonDiv.appendChild(optionsButtonIcon);
  optionsButtonDiv.appendChild(optionsButtonSpan);
  optionsButtonDiv.onclick = () => {
    if (document.querySelector("html").classList.contains("optionsPopupActif")) document.querySelector("html").classList.remove("optionsPopupActif");
    else document.querySelector("html").classList.add("optionsPopupActif");
  };

  optionsPopupBlur = document.createElement("div");
  optionsPopupBlur.classList.add("optionsPopupBlur");
  document.body.prepend(optionsPopupBlur);

  optionsPopup = document.createElement("iframe");
  optionsPopup.classList.add("optionsPopup");
  document.body.prepend(optionsPopup);
  optionsPopup.src = browser.runtime.getURL("/pages/popup/interface.html");

  function closeOptionsPopup() {
    optionsPopup.contentWindow.postMessage("close", "*");
  }

  document.body.addEventListener("keyup", (e) => {
    if (e.key == "Escape") closeOptionsPopup();
  });

  optionsPopupBlur.onclick = async () => {
    closeOptionsPopup();
  };

  defaultcss = document.createElement("style");
  fetch(browser.runtime.getURL("/styles/default.css"))
    .then((response) => response.text())
    .then((data) => {
      defaultcss.innerHTML = data;
    });
  document.head.appendChild(defaultcss);

  window.addEventListener("message", (e) => {
    if (e.data == "closeOptionsPopup") {
      document.querySelector("html").classList.remove("optionsPopupActif");
    }
    if (e.data == "reloadOptionsPopup") {
      location.reload();
    }
  });
}
register(customizationButton);

/* ----------------------------------------------- */
