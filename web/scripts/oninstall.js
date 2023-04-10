defaultOptions = {
  averageCalculator: true,
  newMenu: true,
  newDesign: false,
  newColor: "default",
  newFont: "tahoma",
  newBorder: "default",
  menuTheme: "dark",
  theme: "light",
  debug: false,
};

chrome.runtime.onInstalled.addListener((reason) => {
  if (reason.reason === chrome.runtime.OnInstalledReason.INSTALL) {
    chrome.storage.sync.set(defaultOptions);
  } else {
    chrome.storage.sync.get(["averageCalculator", "newMenu", "newDesign", "newColor", "newFont", "newBorder", "menuTheme", "theme", "debug"], function (data) {
      newOptions = {};
      for (option in defaultOptions) {
        if (data[option] == undefined) newOptions[option] = defaultOptions[option];
        else newOptions[option] = data[option];
      }
      chrome.storage.sync.set(newOptions);
    });
  }
});
