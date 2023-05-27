document.querySelectorAll("[group]").forEach((ele) => {
  ele.onclick = () => {
    ele.classList.toggle("clic");
  };
});
