(async () => {
  try {
    const adapter = await createPopupInterface(window.previewInterface);
    adapter.render(window.previewGroups, { major: 3, minor: 0, patch: 1, stage: "stable" });
  } catch (error) {
    console.error(`Preview ${window.previewInterface} impossible`, error);
  }
})();
