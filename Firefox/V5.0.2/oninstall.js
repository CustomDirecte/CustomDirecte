browser.runtime.onInstalled.addListener((reason) => {
  if (reason === browser.runtime.OnInstalledReason.INSTALL) {
    browser.storage.local.set({
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
