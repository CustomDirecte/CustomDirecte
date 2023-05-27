document.querySelectorAll("[groupButton]").forEach((ele) => ele.addEventListener('click', () => {
  document.querySelectorAll("[selected]").forEach((selectedEle) => selectedEle.removeAttribute('selected'));
  ele.toggleAttribute("selected");
}));