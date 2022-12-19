chrome.runtime.onInstalled.addListener((reason) => {
  if (reason === chrome.runtime.OnInstalledReason.INSTALL) {
    chrome.storage.local.set({
      newEcoleDirecteInterface: {
        averageCalculator: true,
        newMenu: true,
        newDesign: false,
        newColor: "default",
        newFont: "tahoma",
        newBorder: "default",
        theme: "dark",
      },
    });
  }
});
