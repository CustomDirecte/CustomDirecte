function handleInstalled(details) {
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

chrome.runtime.onInstalled.addListener(handleInstalled);
