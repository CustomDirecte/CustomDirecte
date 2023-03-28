defaultOptions = {
  averageCalculator: true,
  newMenu: true,
  newDesign: false,
  newColor: "default",
  newFont: "tahoma",
  newBorder: "default",
  theme: "dark",
  debug: false,
};

chrome.runtime.onInstalled.addListener((reason) => {
  if (reason.reason === chrome.runtime.OnInstalledReason.INSTALL) {
    chrome.storage.local.set({
      newEcoleDirecteInterface: defaultOptions,
    });
  } else {
    chrome.storage.local.get("newEcoleDirecteInterface", function (data) {
      localStoreage = data.newEcoleDirecteInterface;
      if (localStoreage != undefined) {
        for (option in defaultOptions) {
          if (localStoreage[option] == undefined) {
            localStoreage[option] = defaultOptions[option];
          }
        }
      }
      chrome.storage.local.set({
        newEcoleDirecteInterface: localStoreage,
      });
    });
  }
});
