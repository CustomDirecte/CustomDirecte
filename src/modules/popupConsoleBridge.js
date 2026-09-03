(function () {
  "use strict";
  if (window.CustomDirectePopups) return;

  let requestId = 0;
  const pending = new Map();
  const messageSource = "customdirecte-popup-console";

  window.addEventListener("message", (event) => {
    if (event.source !== window || event.data?.source !== messageSource || event.data?.kind !== "response") return;
    const payload = event.data;
    const request = pending.get(payload.requestId);
    if (!request) return;
    pending.delete(payload.requestId);
    payload.error ? request.reject(new Error(payload.error)) : request.resolve(payload.value);
  });

  function request(command) {
    return new Promise((resolve, reject) => {
      const id = ++requestId;
      pending.set(id, { resolve, reject });
      window.postMessage({ source: messageSource, kind: "command", command, requestId: id }, "*");
      setTimeout(() => {
        if (!pending.has(id)) return;
        pending.delete(id);
        reject(new Error("CustomDirecte n’a pas répondu. Rechargez la page EcoleDirecte."));
      }, 2000);
    });
  }

  window.CustomDirectePopups = Object.freeze({
    show: (type) => request(`show:${type}`),
    state: () => request("state"),
    reset: () => request("reset"),
  });
})();
