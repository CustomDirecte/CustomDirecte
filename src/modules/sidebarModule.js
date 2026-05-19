log.script("MODULES/SIDEBARMODULE.JS");

/**
 * @fileOverview Module sidebar : nouveau design, boutons de menu, CSS conditionnel.
 * @author Bastian NOEL
 */

var sidebarModule = {
  groupId: "sidebar",
  _observer: null,

  /**
   * Démarre le module : synchronise les attributs HTML, ajoute la classe "new-menu"
   * et lance le MutationObserver pour construire le nouveau menu latéral.
   * @param {Object} params - Paramètres du groupe "sidebar".
   */
  start(params) {
    log.info("SIDEBAR", "Démarrage");

    for (const [key, value] of Object.entries(params)) {
      if (value === undefined) continue;
      if (Array.isArray(value)) {
        value.forEach((v, i) => document.documentElement.setAttribute(key.toLowerCase() + i, v));
      } else {
        document.documentElement.setAttribute(key, value);
      }
    }
    log.debug("SIDEBAR", `${Object.keys(params).length} attribut(s) HTML synchronisés`);

    if (this._observer) {
      this._observer.disconnect();
      this._observer = null;
      log.debug("SIDEBAR", "Observer précédent déconnecté");
    }

    document.documentElement.classList.add("new-menu");
    log.debug("SIDEBAR", 'Classe "new-menu" ajoutée');

    this._observer = new MutationObserver(() => {
      const menuElem = document.getElementById("container-menu");
      const usernameElem = document.getElementById("user-account-link");
      if (!menuElem || !usernameElem || menuElem.dataset.newmenuLoad === "true") return;

      menuElem.dataset.newmenuLoad = true;
      log.debug("SIDEBAR", "Édition du menu");

      const rootName = document.createElement("style");
      rootName.innerHTML = `:root { --userName: "${usernameElem.innerText.trim().replace(/ /, "\\A ")}" }`;
      document.head.appendChild(rootName);
      log.debug("SIDEBAR", "Variable CSS --userName ajoutée");

      const menuMoreOptions = document.createElement("div");
      menuMoreOptions.classList.add("menuMoreOptions");
      menuElem.appendChild(menuMoreOptions);

      const SVG_COG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/></svg>`;
      const SVG_USER = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>`;
      const SVG_LOGOUT = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/></svg>`;

      /**
       * Ajoute un bouton dans le menu latéral custom.
       * @param {string} id - Suffixe de l'id (moreOption-{id}).
       * @param {string} svg - Chaîne SVG inline pour l'icône.
       * @param {string} text - Label affiché.
       * @param {Function|null} onclick - Action au clic.
       */
      function menuAddNewOptions(id, svg, text, onclick) {
        const li = document.createElement("li");
        const a = document.createElement("a");
        a.id = `moreOption-${id}`;
        a.classList.add("moreOption");
        if (onclick) a.onclick = onclick;
        const iconSpan = document.createElement("span");
        iconSpan.classList.add("menu-icon");
        iconSpan.innerHTML = svg;
        const span = document.createElement("span");
        span.classList.add("moreOption-label");
        span.innerText = text;
        a.appendChild(iconSpan);
        a.appendChild(span);
        li.appendChild(a);
        menuMoreOptions.appendChild(li);
      }

      menuAddNewOptions("Options", SVG_COG, "Personnalisation", () =>
        document.documentElement.classList.add("settings-popup-active")
      );
      menuAddNewOptions("Account", SVG_USER, "Mon Compte", () =>
        document.getElementById("user-account-link")?.click()
      );
      menuAddNewOptions("Deconnexion", SVG_LOGOUT, "Déconnexion", () =>
        document.querySelector(".logout")?.click()
      );
      log.info("SIDEBAR", "Menu construit — 3 boutons ajoutés");

      if (document.querySelector(".navbar-nav")) {
        document.querySelector(".navbar-nav").style.display = "none";
        log.debug("SIDEBAR", "Barre nom/déco masquée");
      }
    });

    this._observer.observe(document.body, { subtree: true, childList: true });
    log.info("SIDEBAR", "Démarrage complet — MutationObserver actif");
  },

  /**
   * Réagit à un changement de paramètre : met à jour l'attribut HTML correspondant.
   * @param {string} paramId - Identifiant du paramètre modifié.
   * @param {*} newValue - Nouvelle valeur.
   */
  onParamChange(paramId, newValue) {
    if (Array.isArray(newValue)) {
      newValue.forEach((v, i) => document.documentElement.setAttribute(paramId.toLowerCase() + i, v));
      log.debug("SIDEBAR", `${paramId}[] → [${newValue.join(", ")}]`);
    } else {
      document.documentElement.setAttribute(paramId, newValue);
      log.debug("SIDEBAR", `${paramId} → ${newValue}`);
    }
  },

  /**
   * Arrête le module : déconnecte le MutationObserver.
   */
  _teardown() {
    if (this._observer) {
      this._observer.disconnect();
      this._observer = null;
      log.info("SIDEBAR", "Teardown — Observer déconnecté");
    }
  },
};

ModuleRunner.register(sidebarModule);
