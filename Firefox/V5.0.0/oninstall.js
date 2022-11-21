function handleInstalled(details) {
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

browser.runtime.onInstalled.addListener(handleInstalled);
