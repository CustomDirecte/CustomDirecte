/* IMPORT CHROME LIB */
browser = chrome;
browserStorage = browser.storage.sync;
browserVersion = browser.runtime.getManifest().version_name;
browserStorageOnChanged = browser.storage.sync.onChanged;
scrollIntoView = (ele) => {
  ele.scrollIntoViewIfNeeded();
};
/* ----------------- */

/*  ██████╗  ███████╗ ███╗   ██╗ ███████╗ ██████╗   █████╗  ████████╗ ██╗  ██████╗  ███╗   ██╗ */
/* ██╔════╝  ██╔════╝ ████╗  ██║ ██╔════╝ ██╔══██╗ ██╔══██╗ ╚══██╔══╝ ██║ ██╔═══██╗ ████╗  ██║ */
/* ██║  ███╗ █████╗   ██╔██╗ ██║ █████╗   ██████╔╝ ███████║    ██║    ██║ ██║   ██║ ██╔██╗ ██║ */
/* ██║   ██║ ██╔══╝   ██║╚██╗██║ ██╔══╝   ██╔══██╗ ██╔══██║    ██║    ██║ ██║   ██║ ██║╚██╗██║ */
/* ╚██████╔╝ ███████╗ ██║ ╚████║ ███████╗ ██║  ██║ ██║  ██║    ██║    ██║ ╚██████╔╝ ██║ ╚████║ */
/*  ╚═════╝  ╚══════╝ ╚═╝  ╚═══╝ ╚══════╝ ╚═╝  ╚═╝ ╚═╝  ╚═╝    ╚═╝    ╚═╝  ╚═════╝  ╚═╝  ╚═══╝ */

close = () => {
  urlParams.has("reload") ? window.top.postMessage("reloadOptionsPopup", "*") : window.top.postMessage("closeOptionsPopup", "*");
};

window.onmessage = function (e) {
  if (e.data == "close") {
    close();
  }
};

var urlParams = new URLSearchParams(window.location.search);

const updateValue = (optionId, isSwitch, Value = false, i = false) => {
  browserStorage.get((data) => {
    let option = data.options.find((el) => el.option == optionId);
    if (i !== false) {
      if (option.Value == null) option.Value = option.Default;
      option.Value[i] = Value;
    } else option.Value = isSwitch ? !(option.Value == null ? option.Default : option.Value) : Value;
    browserStorage.set(data, () => {
      urlParams.set("scoll", document.querySelector("[group]:not([hide])").scrollTop);
      if (isSwitch && option.reloadingRequired) urlParams.has("reload", option.option) ? urlParams.delete("reload", option.option) : urlParams.append("reload", option.option);
      genere();
    });
  });
};

genere = () => {
  browserStorage.get((data) => {
    const main = document.querySelector("main");
    main.innerHTML = "";
    const groups = document.createElement("div");
    const separator = document.createElement("hr");

    groups.classList.add(...["groups"]);
    separator.classList.add(...["separator", "vertical"]);

    main.appendChild(groups);
    main.appendChild(separator);

    function getOptionValue(optionId, i = false) {
      let option = data.options.find((el) => el.option == optionId);
      if (i !== false) return option.Value == null ? option.Default[i] : option.Value[i];
      return option.Value == null ? option.Default : option.Value;
    }

    const makeAGroupButton = (ID, Title, isClose, isSelected) => {
      const groupSelection = document.createElement("div");

      groups.appendChild(groupSelection);

      groupSelection.classList.add(...(isClose ? ["group", "close"] : ["group"]));
      groupSelection.textContent = isClose ? (urlParams.has("reload") ? Title.reload : Title.close) : Title;
      groupSelection.setAttribute("groupButton", ID);
      groupSelection.toggleAttribute("selected", urlParams.has("groupSelection") ? (urlParams.get("groupSelection") == ID ? true : false) : isSelected);
      !urlParams.has("groupSelection") && isSelected ? urlParams.set("groupSelection", ID) : null;
      groupSelection.addEventListener("click", () => {
        if (isClose) close();
        else {
          urlParams.set("groupSelection", ID);
          document.querySelector("[selected]").removeAttribute("selected");
          groupSelection.toggleAttribute("selected");
          document.querySelectorAll("[group]").forEach((group) => {
            group.toggleAttribute("hide", true);
            group.scrollTo(0, 0);
          });
          document.querySelector(`[group="${groupSelection.getAttribute("groupButton")}"]`).removeAttribute("hide");
        }
      });
    };

    const makeAOptionsGroup = (ID, Title, Subtitle, isSelected) => {
      const OptionsGroup = document.createElement("div");
      const groupInfoElement = document.createElement("div");
      const groupTitleElement = document.createElement("span");
      const groupSubtitleElement = document.createElement("span");
      const separatorElement = document.createElement("hr");

      OptionsGroup.classList.add("options");
      OptionsGroup.setAttribute("group", ID);
      OptionsGroup.toggleAttribute("hide", urlParams.has("groupSelection") ? (urlParams.get("groupSelection") == ID ? false : true) : !isSelected);

      groupInfoElement.classList.add("groupInfo");
      groupInfoElement.appendChild(groupTitleElement);
      groupInfoElement.appendChild(groupSubtitleElement);

      groupTitleElement.classList.add("groupTitle");
      groupTitleElement.textContent = Title;

      groupSubtitleElement.classList.add("groupSubtitle");
      groupSubtitleElement.textContent = Subtitle;

      separatorElement.classList.add("separator");

      OptionsGroup.appendChild(groupInfoElement);
      OptionsGroup.appendChild(separatorElement);

      main.appendChild(OptionsGroup);
    };

    for (const group of data.groups) {
      const isClose = group.ID === "close";
      const isSelected = group === data.groups[0];
      makeAGroupButton(group.ID, group.Title, isClose, isSelected);
      makeAOptionsGroup(group.ID, group.Title, group.Subtitle, isSelected);
    }

    for (const option of data.options) {
      const optionElement = document.createElement("div");
      const optionInfoElement = document.createElement("div");
      const optionTitleElement = document.createElement("span");
      if (option.Subtitle) var optionSubtitleElement = document.createElement("span");
      if (option.Warning) var optionWarningElement = document.createElement("span");

      optionElement.classList.add("option");
      option.reloadingRequired ? optionElement.setAttribute("reloadingRequired", "") : null;
      option.lock && !getOptionValue(option.lock) ? optionElement.setAttribute("disabled", "") : null;
      optionElement.setAttribute("option", option.option);
      optionElement.appendChild(optionInfoElement);

      optionInfoElement.classList.add("optionInfo");
      optionInfoElement.appendChild(optionTitleElement);
      if (option.Subtitle) optionInfoElement.appendChild(optionSubtitleElement);
      if (option.Warning) optionInfoElement.appendChild(optionWarningElement);

      optionTitleElement.classList.add("optionTitle");
      optionTitleElement.textContent = option.Title;

      if (option.Subtitle) optionSubtitleElement.classList.add("optionSubtitle");
      if (option.Subtitle) optionSubtitleElement.textContent = option.Subtitle;

      if (option.Warning) optionWarningElement.classList.add("optionWarning");
      if (option.Warning) optionWarningElement.textContent = option.Warning;

      document.querySelector(`[group="${option.Group}"]`).appendChild(optionElement);

      if (option.lock) {
        optionElement.addEventListener("click", () => {
          const lock = document.querySelector("[option=" + option.lock + "]");
          if (lock && !getOptionValue(option.lock)) {
            scrollIntoView(lock);
            lock.classList.remove("showMe");
            lock.offsetWidth;
            lock.classList.add("showMe");
          }
        });
      }

      switch (option.Type) {
        case "Switch":
          const optionSwitchElement = document.createElement("div");
          optionSwitchElement.classList.add("optionSwitch");
          if (getOptionValue(option.option)) optionSwitchElement.setAttribute("active", "");

          document.documentElement.setAttribute(option.option, getOptionValue(option.option));

          optionElement.appendChild(optionSwitchElement);

          optionElement.addEventListener("click", () => ((option.lock && getOptionValue(option.lock)) || !option.lock ? updateValue(option.option, true) : null));

          break;
        case "Button":
          const optionButtonElement = document.createElement("div");
          optionButtonElement.classList.add("optionButton");
          if (option.Content == "download") optionButtonElement.classList.add("content-download");

          optionElement.appendChild(optionButtonElement);

          optionElement.addEventListener("click", () => ((option.lock && getOptionValue(option.lock)) || !option.lock ? updateValue(option.option, false, true) : null));

          break;
        case "Color":
          const optionSelectionElement = document.createElement("div");
          optionSelectionElement.setAttribute("color", getOptionValue(option.option));
          optionElement.classList.add("optionSelectionParent");
          optionSelectionElement.classList.add("optionSelection");
          optionElement.appendChild(optionSelectionElement);

          for (const selectionOption of option.ColorHTML) {
            let line = new DOMParser().parseFromString(selectionOption, "text/html");
            optionSelectionElement.appendChild(line.body.firstChild);
          }

          document.querySelector(".colorSlider").value = getOptionValue(option.option);
          document.querySelector(".colorSlider").addEventListener("mouseup", (event) => {
            (option.lock && getOptionValue(option.lock)) || !option.lock ? updateValue(option.option, false, event.target.value) : null;
          });
          document.querySelector(".colorSlider").addEventListener("input", (event) => {
            (option.lock && getOptionValue(option.lock)) || !option.lock ? optionSelectionElement.setAttribute("color", event.target.value) : null;
          });
          break;
        case "MultiSelection":
        case "CustomSelection":
        case "Selection":
          const isMultiSelection = option.Type == "MultiSelection";
          const isCustomSelection = option.Type == "CustomSelection";

          for (let i = 0; i < (isMultiSelection ? option.SelectionRange : 1); i++) {
            const optionSelectionElement = document.createElement("div");

            optionSelectionElement.classList.add("optionSelection");
            optionElement.classList.add("optionSelectionParent");
            optionElement.appendChild(optionSelectionElement);

            for (const selectionOption of isMultiSelection ? option.MultiOptions[i] : option.Options) {
              const optionBoxElement = document.createElement("div");
              if (!isCustomSelection) {
                imgElement = document.createElement("img");
                spanElement = document.createElement("span");
              } else divElement = document.createElement("div");

              optionBoxElement.classList.add("optionBox");
              optionBoxElement.style.setProperty("--Xplacement", option["--Xplacement"] + "px");
              optionBoxElement.setAttribute("selection", selectionOption.Selection);
              if (selectionOption.Selection === (isMultiSelection ? getOptionValue(option.option, i) : getOptionValue(option.option))) optionBoxElement.setAttribute("active", "");
              if (!isCustomSelection) {
                optionBoxElement.appendChild(imgElement);
                optionBoxElement.appendChild(spanElement);
              } else {
                optionBoxElement.appendChild(divElement);
                divElement.textContent = selectionOption.Title;
                divElement.classList.add(option.Custom);
                divElement.setAttribute("style", selectionOption.CSS);
              }

              if (!isCustomSelection) {
                imgElement.src = selectionOption.Img;
                spanElement.textContent = selectionOption.Title;
              }

              optionSelectionElement.appendChild(optionBoxElement);

              optionBoxElement.addEventListener("click", () => ((option.lock && getOptionValue(option.lock)) || !option.lock ? updateValue(option.option, false, selectionOption.Selection, isMultiSelection ? i : false) : null));
            }
          }

          break;
      }
    }
    urlParams.has("scoll") ? document.querySelector("[group]:not([hide])").scroll(0, urlParams.get("scoll")) : null;

    document.body.addEventListener("keyup", (e) => {
      if (e.key == "Escape") close();
    });

    var version = document.getElementById("version");
    version.innerText = `Version ${browserVersion}`;
  });
};

/* ██╗ ███╗   ██╗ ████████╗ ███████╗ ██████╗   █████╗   ██████╗ ████████╗ ██╗ ██╗   ██╗ ███████╗ */
/* ██║ ████╗  ██║ ╚══██╔══╝ ██╔════╝ ██╔══██╗ ██╔══██╗ ██╔════╝ ╚══██╔══╝ ██║ ██║   ██║ ██╔════╝ */
/* ██║ ██╔██╗ ██║    ██║    █████╗   ██████╔╝ ███████║ ██║         ██║    ██║ ██║   ██║ █████╗   */
/* ██║ ██║╚██╗██║    ██║    ██╔══╝   ██╔══██╗ ██╔══██║ ██║         ██║    ██║ ╚██╗ ██╔╝ ██╔══╝   */
/* ██║ ██║ ╚████║    ██║    ███████╗ ██║  ██║ ██║  ██║ ╚██████╗    ██║    ██║  ╚████╔╝  ███████╗ */
/* ╚═╝ ╚═╝  ╚═══╝    ╚═╝    ╚══════╝ ╚═╝  ╚═╝ ╚═╝  ╚═╝  ╚═════╝    ╚═╝    ╚═╝   ╚═══╝   ╚══════╝ */

genere();
