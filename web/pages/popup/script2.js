/* GENERATION */



/* USEFULL */
groupButton = document.querySelectorAll("[groupButton]");
group = document.querySelectorAll("[group]");

groupButton.forEach((ele) =>
  ele.addEventListener("click", () => {
    document.querySelector("[selected]").removeAttribute("selected");
    ele.toggleAttribute("selected");

    document.querySelectorAll("[group]").forEach((selectedEle) => {
      selectedEle.toggleAttribute("hide", true);
      selectedEle.scrollTo(0, 0);
    });
    document.querySelector('[group="' + ele.getAttribute("groupButton") + '"]').removeAttribute("hide");
  })
);
