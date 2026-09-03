/* Moteur commun des campagnes de popup : conditions, rendu, suivi et commandes de test. */
(function () {
  "use strict";

  if (window.top !== window || window.__customDirectePopupManager) return;
  window.__customDirectePopupManager = true;

  const campaigns = window.CustomDirectePopupCampaigns;
  const KEYS = Object.freeze({
    appVersion: "customdirecte:popup:app-version",
    legacyDetected: "customdirecte:legacy-detected",
    existingSettings: "customdirecte:existing-settings",
    opened: "customdirecte:popup:ed-opened",
    v3InstalledAt: "customdirecte:popup:v3-installed-at",
    firstSeenLegacy: "customdirecte:popup:first-seen",
    updateSeen: "customdirecte:popup:update-seen",
    reminderSeen: "customdirecte:popup:reminder-seen",
    displayCounts: "customdirecte:popup:display-counts",
    lastShown: "customdirecte:popup:last-shown",
    lastAction: "customdirecte:popup:last-action",
    legacyHistory: "customdirecte:popup:history",
  });
  const UPDATE_MAJOR = 3;
  const GITHUB_URL = "https://github.com/CustomDirecte/CustomDirecte";
const RATE_URL = "https://chromewebstore.google.com/detail/customdirecte/ngibpoegkheookihjcnjihkfhfnglfei/reviews";
  const MESSAGE_SOURCE = "customdirecte-popup-console";
  const manifest = browser.runtime.getManifest();
  const version = manifest.version_name || manifest.version || "3.0.0";
  const major = Number.parseInt(version, 10) || UPDATE_MAJOR;
  let activeCampaign = null;

  const safeGet = (key) => { try { return localStorage.getItem(key); } catch { return null; } };
  const safeSet = (key, value) => { try { localStorage.setItem(key, String(value)); } catch {} };
  const safeRemove = (key) => { try { localStorage.removeItem(key); } catch {} };
  const safeJson = (key, fallback) => { try { return JSON.parse(safeGet(key) || "null") || fallback; } catch { return fallback; } };
  const isLogin = () => /\/login(?:[/?#]|$)/i.test(location.href);
  const asset = (path) => browser.runtime.getURL(path.replace(/^\//, ""));
  const el = (tag, className, text) => { const node = document.createElement(tag); if (className) node.className = className; if (text !== undefined) node.textContent = text; return node; };

  function record(type, event, extra = {}) {
    const entry = { type, event, version, timestamp: Date.now(), ...extra };
    if (event === "shown") {
      const counts = safeJson(KEYS.displayCounts, {});
      counts[type] = Number(counts[type] || 0) + 1;
      safeSet(KEYS.displayCounts, JSON.stringify(counts));
      safeSet(KEYS.lastShown, JSON.stringify(entry));
    } else safeSet(KEYS.lastAction, JSON.stringify(entry));
  }

  function getState() { return { version, opened: Number(safeGet(KEYS.opened) || 0), v3InstalledAt: Number(safeGet(KEYS.v3InstalledAt) || safeGet(KEYS.firstSeenLegacy) || 0), displayCounts: safeJson(KEYS.displayCounts, {}), lastShown: safeJson(KEYS.lastShown, null), lastAction: safeJson(KEYS.lastAction, null) }; }
  function respond(requestId, value, error) { window.postMessage({ source: MESSAGE_SOURCE, kind: "response", requestId, value, error }, "*"); }

  function setSetting(groupId, parameterId, value) {
    return browser.storage.sync.get("settings").then((result) => {
      const settings = result?.settings || {};
      settings[groupId] = settings[groupId] || { actived: true, parameters: {} };
      settings[groupId].parameters = settings[groupId].parameters || {};
      settings[groupId].parameters[parameterId] = value;
      return browser.storage.sync.set({ settings });
    });
  }

  function setNotesEnabled(enabled) {
    return browser.storage.sync.get("settings").then((result) => {
      const settings = result?.settings || {};
      settings.notesTable = settings.notesTable || { actived: true, parameters: {} };
      settings.notesTable.parameters = settings.notesTable.parameters || {};
      settings.notesTable.parameters.customNotesEnabled = enabled;
      if (enabled && settings.notesTable.actived === false) settings.notesTable.actived = true;
      return browser.storage.sync.set({ settings });
    });
  }

  function currentSetting(groupId, parameterId, fallback) { return browser.storage.sync.get("settings").then((result) => result?.settings?.[groupId]?.parameters?.[parameterId] ?? fallback); }

  function applyTheme(modal) {
    const style = getComputedStyle(document.documentElement);
    const value = (name, fallback) => style.getPropertyValue(name).trim() || fallback;
    modal.style.setProperty("--cd-accent", value("--primary-color", "#c8194a"));
    modal.style.setProperty("--cd-accent-light", value("--custom-pink-transp", "#f5d9e1"));
    modal.style.setProperty("--cd-surface", value("--custom-white", "#ffffff"));
    modal.style.setProperty("--cd-surface-soft", value("--custom-gray", "#fcfcfd"));
    modal.style.setProperty("--cd-text", value("--text", "#242126"));
    modal.style.setProperty("--cd-muted", value("--text-light", "#565158"));
    modal.style.setProperty("--cd-border", value("--custom-gray-verydark-transp", "#00000026"));
  }

  function createVideo(item) {
    const section = el("article", "cd-popup-video-card");
    if (item.key) section.id = `cd-popup-video-${item.key}`;
    section.append(el("h3", "", item.title), el("p", "cd-popup-video-text", item.text));
    const wrap = el("div", "cd-popup-video-wrap");
    const player = el("video", "cd-popup-video");
    player.src = asset(`/videos/${item.source}`); player.autoplay = true; player.loop = true; player.muted = true; player.playsInline = true; player.preload = "auto"; player.setAttribute("aria-label", item.title);
    const controls = el("div", "cd-popup-video-controls");
    const play = el("button", "cd-popup-video-play"); play.type = "button"; play.dataset.state = "pause"; play.setAttribute("aria-label", "Mettre en pause");
    const progress = el("input", "cd-popup-video-progress"); progress.type = "range"; progress.min = 0; progress.max = 100; progress.value = 0; progress.setAttribute("aria-label", "Avancement de la vidéo");
    const fullscreen = el("button", "cd-popup-video-fullscreen"); fullscreen.type = "button"; fullscreen.dataset.state = "enter"; fullscreen.setAttribute("aria-label", "Afficher en plein écran");
    const updateProgress = () => { if (!player.duration) return; const percentage = (player.currentTime / player.duration) * 100; progress.value = percentage; progress.style.setProperty("--cd-video-progress", `${percentage}%`); };
    const updatePlay = () => { play.dataset.state = player.paused ? "play" : "pause"; play.setAttribute("aria-label", player.paused ? "Lire la vidéo" : "Mettre en pause"); };
    const updateFullscreen = () => { if (!wrap.isConnected) { document.removeEventListener("fullscreenchange", updateFullscreen); document.removeEventListener("webkitfullscreenchange", updateFullscreen); return; } const isFullscreen = document.fullscreenElement === wrap || document.webkitFullscreenElement === wrap; fullscreen.dataset.state = isFullscreen ? "exit" : "enter"; fullscreen.setAttribute("aria-label", isFullscreen ? "Quitter le plein écran" : "Afficher en plein écran"); };
    const togglePlay = () => player.paused ? player.play().catch(() => {}) : player.pause();
    play.addEventListener("click", togglePlay); player.addEventListener("click", togglePlay); player.addEventListener("timeupdate", updateProgress); player.addEventListener("play", updatePlay); player.addEventListener("pause", updatePlay);
    progress.addEventListener("input", () => { if (player.duration) player.currentTime = (Number(progress.value) / 100) * player.duration; updateProgress(); });
    fullscreen.addEventListener("click", async () => { try { if (document.fullscreenElement || document.webkitFullscreenElement) await (document.exitFullscreen?.() || document.webkitExitFullscreen?.()); else await wrap.requestFullscreen?.(); } catch {} updateFullscreen(); });
    document.addEventListener("fullscreenchange", updateFullscreen); document.addEventListener("webkitfullscreenchange", updateFullscreen);
    controls.append(play, progress, fullscreen); wrap.append(player, controls); section.appendChild(wrap); setTimeout(() => player.play().catch(() => {}), 0); return section;
  }

  function addDeveloperInfo(parent, text) { const info = el("p", "cd-popup-developer", `${text} `); const link = el("a", "", "Voir le projet sur GitHub"); link.href = GITHUB_URL; link.target = "_blank"; link.rel = "noopener noreferrer"; info.appendChild(link); parent.appendChild(info); }

  function chromeStoreLink() {
    const wrap = el("span", "cd-chrome-button-wrap");
    const logo = el("span", "cd-chrome-logo");
    logo.setAttribute("aria-hidden", "true");
    const link = el("a", "cd-chrome-button", "Noter sur le Chrome Web Store");
    link.href = RATE_URL;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    wrap.append(logo, link);
    return wrap;
  }

  function scrollToVideo(key) { document.getElementById(`cd-popup-video-${key}`)?.scrollIntoView({ behavior: "smooth", block: "center" }); }

  function addTopbar(modal, kind, onLater, onClose) {
    const topbar = el("header", "cd-popup-header");
    const brand = el("div", "cd-popup-brand"); brand.append(el("strong", "", "CustomDirecte"), el("span", "", kind === "update" ? "Mise à jour" : kind === "reminder" ? "Merci" : "Bienvenue"));
    const actions = el("div", "cd-popup-top-actions");
    if (onLater) { const later = el("button", "cd-popup-top-button", "Plus tard"); later.type = "button"; later.addEventListener("click", onLater); actions.appendChild(later); }
    const close = el("button", "cd-popup-close", "×"); close.type = "button"; close.setAttribute("aria-label", "Fermer"); close.addEventListener("click", onClose); actions.appendChild(close);
    topbar.append(brand, actions); modal.appendChild(topbar); return close;
  }

  function addFeatureCards(parent, features) {
    const grid = el("div", "cd-popup-feature-grid");
    features.forEach((feature) => { const card = el("article", `cd-popup-feature-card${feature.isNew ? " is-new" : ""}${feature.videoKey ? " has-video" : ""}`); const copy = el("div", "cd-popup-feature-copy"); copy.append(el("h3", "", feature.title), el("p", "", feature.text)); if (feature.isNew) copy.appendChild(el("span", "cd-popup-feature-tag", "Nouveau")); card.appendChild(copy); if (feature.videoKey) { card.tabIndex = 0; card.setAttribute("role", "button"); card.setAttribute("aria-label", `Voir la vidéo : ${feature.title}`); card.addEventListener("click", () => scrollToVideo(feature.videoKey)); card.addEventListener("keydown", (event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); scrollToVideo(feature.videoKey); } }); } grid.appendChild(card); });
    parent.appendChild(grid);
  }

  function addTip(parent, tip) { const details = el("details", "cd-popup-tip"); const summary = el("summary", "", tip.title); details.appendChild(summary); details.appendChild(el("p", "cd-popup-video-text", tip.text)); details.appendChild(createVideo({ key: "drag-drop", title: tip.title, text: "", source: tip.source })); parent.appendChild(details); }

  function addConfetti(parent) {
    const layer = el("div", "cd-popup-confetti");
    const pieces = ["circle", "square", "triangle", "emoji", "ribbon"];
    const emojis = ["🎉", "💖", "✨", "👏", "😉"];
    for (let index = 0; index < 32; index += 1) {
      const piece = el("span", "cd-popup-confetti-piece");
      const shape = pieces[index % pieces.length];
      piece.dataset.shape = shape;
      if (shape === "emoji") piece.textContent = emojis[index % emojis.length];
      piece.style.setProperty("--confetti-x", `${8 + Math.random() * 84}%`);
      piece.style.setProperty("--confetti-delay", `${Math.random() * 0.7}s`);
      piece.style.setProperty("--confetti-duration", `${3.2 + Math.random() * 2}s`);
      piece.style.setProperty("--confetti-rotate", `${Math.round(Math.random() * 360)}deg`);
      layer.appendChild(piece);
    }
    parent.appendChild(layer);
  }

  class WelcomeCampaign {
    constructor(kind) { this.kind = kind; this.content = campaigns[kind]; }
    render() {
      const overlay = el("div", "cd-popup-overlay"); const modal = el("section", "cd-popup-modal"); modal.setAttribute("role", "dialog"); modal.setAttribute("aria-modal", "true"); modal.setAttribute("aria-labelledby", "cd-popup-title"); applyTheme(modal);
      const close = addTopbar(modal, this.kind, () => this.snooze(), () => this.finish());
      const content = el("div", "cd-popup-content"); const intro = el("div", "cd-popup-intro"); intro.append(el("span", "cd-popup-kicker", this.kind === "update" ? "Nouveautés" : "Première installation"), el("h1", "", this.content.title), el("p", "cd-popup-lead", this.content.text)); intro.querySelector("h1").id = "cd-popup-title"; content.appendChild(intro);
      addFeatureCards(content, this.content.features);
      const videos = el("section", "cd-popup-videos"); this.content.videos.forEach((item) => videos.appendChild(createVideo(item))); if (this.kind === "update" && this.content.tip) addTip(videos, this.content.tip); content.appendChild(videos); addDeveloperInfo(content, this.content.developerText); modal.appendChild(content);
      const footer = el("footer", "cd-popup-footer"); const store = el("a", "cd-popup-secondary-link", "Voir la fiche de l’extension"); store.href = RATE_URL; store.target = "_blank"; store.rel = "noopener noreferrer"; const button = el("button", "cd-popup-button cd-popup-button-primary", "Commencer"); button.type = "button"; button.addEventListener("click", () => this.finish()); footer.append(store, button); modal.appendChild(footer);
      overlay.appendChild(modal); document.body.appendChild(overlay); this.overlay = overlay; this.previousFocus = document.activeElement; this.keyHandler = (event) => { if (event.key === "Escape") this.finish(); if (event.key === "Tab") this.trapFocus(event, modal); }; document.addEventListener("keydown", this.keyHandler); overlay.addEventListener("click", (event) => { if (event.target === overlay) this.finish(); }); close.focus(); activeCampaign = this; record(this.kind, "shown");
    }
    trapFocus(event, modal) { const focusable = [...modal.querySelectorAll("button:not(:disabled),a[href],input:not(:disabled)")]; if (!focusable.length) return; const first = focusable[0]; const last = focusable[focusable.length - 1]; if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); } else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); } }
    snooze() { record(this.kind, "snoozed"); this.remove(); }
    finish() { safeSet(KEYS.appVersion, version); if (!safeGet(KEYS.v3InstalledAt)) safeSet(KEYS.v3InstalledAt, safeGet(KEYS.firstSeenLegacy) || Date.now()); if (this.kind === "update") safeSet(KEYS.updateSeen, version); record(this.kind, "closed"); this.remove(); }
    remove() { document.removeEventListener("keydown", this.keyHandler); this.overlay?.remove(); activeCampaign = null; this.previousFocus?.focus?.(); }
  }

  class ReminderCampaign {
    render() {
      const overlay = el("div", "cd-popup-overlay");
      const modal = el("section", "cd-popup-modal cd-popup-reminder");
      modal.setAttribute("role", "dialog");
      modal.setAttribute("aria-modal", "true");
      modal.setAttribute("aria-labelledby", "cd-popup-title");
      applyTheme(modal);
      addConfetti(overlay);
      const close = addTopbar(modal, "reminder", () => this.defer(), () => this.close());
      const content = el("div", "cd-popup-content");
      const quote = el("blockquote", "cd-popup-quote", "Merci d’avoir fait confiance à CustomDirecte et d’avoir autant partagé l’extension. C’est ce qui fait vivre le projet depuis si longtemps.");
      content.append(el("span", "cd-popup-kicker", "Un petit mot pour vous"), el("h1", "", campaigns.reminder.title), el("p", "cd-popup-lead", campaigns.reminder.text), quote);
      content.querySelector("h1").id = "cd-popup-title";
      addDeveloperInfo(content, campaigns.reminder.developerText);
      const support = el("p", "cd-popup-text", campaigns.reminder.supportText);
      support.append(document.createElement("br"), chromeStoreLink());
      content.appendChild(support);
      modal.appendChild(content);
      overlay.appendChild(modal);
      document.body.appendChild(overlay);
      this.overlay = overlay;
      this.previousFocus = document.activeElement;
      this.keyHandler = (event) => { if (event.key === "Escape") this.close(); if (event.key === "Tab") this.trapFocus(event, modal); };
      document.addEventListener("keydown", this.keyHandler);
      overlay.addEventListener("click", (event) => { if (event.target === overlay) this.close(); });
      close.focus();
      activeCampaign = this;
      record("reminder", "shown");
    }
    trapFocus(event, modal) { const focusable = [...modal.querySelectorAll("button:not(:disabled),a[href]")]; if (!focusable.length) return; const first = focusable[0]; const last = focusable[focusable.length - 1]; if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); } else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); } }
    defer() { safeSet(KEYS.v3InstalledAt, Date.now()); safeSet(KEYS.opened, 0); safeRemove(KEYS.reminderSeen); record("reminder", "snoozed"); this.remove(); }
    close() { safeSet(KEYS.reminderSeen, version); record("reminder", "closed"); this.remove(); }
    remove() { document.removeEventListener("keydown", this.keyHandler); this.overlay?.remove(); activeCampaign = null; this.previousFocus?.focus?.(); }
  }

  function shouldShow() { if (isLogin()) return null; const savedVersion = safeGet(KEYS.appVersion); const hasPreviousInstall = safeGet(KEYS.legacyDetected) === "true" || safeGet(KEYS.existingSettings) === "true"; const hasDisplayHistory = Boolean(safeGet(KEYS.lastShown)) || Object.keys(safeJson(KEYS.displayCounts, {})).length > 0; const lastAction = safeJson(KEYS.lastAction, null); const deferredIntro = lastAction?.event === "snoozed" && (lastAction.type === "welcome" || lastAction.type === "update") && lastAction.version === version; const firstInstall = !savedVersion && !hasPreviousInstall; const update = !firstInstall && savedVersion !== version && major >= UPDATE_MAJOR && safeGet(KEYS.updateSeen) !== version; const installedAt = Number(safeGet(KEYS.v3InstalledAt) || safeGet(KEYS.firstSeenLegacy) || 0); const introPending = (firstInstall && installedAt <= 0) || deferredIntro; if (introPending || update || (major >= UPDATE_MAJOR && !hasDisplayHistory && safeGet(KEYS.updateSeen) !== version)) return firstInstall || !hasPreviousInstall ? "welcome" : "update"; const opened = Number(safeGet(KEYS.opened) || 0); if (opened >= 10 && installedAt > 0 && installedAt <= Date.now() && Date.now() - installedAt >= 14 * 24 * 60 * 60 * 1000 && safeGet(KEYS.reminderSeen) !== version) return "reminder"; return null; }
  function show(type) { if (!["welcome", "update", "reminder"].includes(type)) throw new Error(`Popup inconnue : ${type}`); activeCampaign?.remove?.(); if (type === "reminder") new ReminderCampaign().render(); else new WelcomeCampaign(type).render(); }
  function start() { if (isLogin()) return; safeRemove(KEYS.legacyHistory); const type = shouldShow(); if (major >= UPDATE_MAJOR && !safeGet(KEYS.v3InstalledAt)) safeSet(KEYS.v3InstalledAt, safeGet(KEYS.firstSeenLegacy) || Date.now()); safeSet(KEYS.opened, Number(safeGet(KEYS.opened) || 0) + 1); if (type) show(type); }

  window.addEventListener("message", (event) => { if (event.source !== window || event.data?.source !== MESSAGE_SOURCE || event.data?.kind !== "command") return; const { command, requestId } = event.data; try { if (command === "state") respond(requestId, getState()); else if (command === "reset") { Object.values(KEYS).forEach(safeRemove); respond(requestId, true); } else if (command?.startsWith("show:")) { show(command.slice(5)); respond(requestId, true); } else respond(requestId, null, `Commande inconnue : ${command}`); } catch (error) { respond(requestId, null, error.message); } });
  window.CustomDirectePopups = Object.freeze({ show, state: getState, reset: () => Object.values(KEYS).forEach(safeRemove) });
  if (typeof settingsReady !== "undefined") settingsReady.then(() => setTimeout(start, 900)); else setTimeout(start, 900);
})();
