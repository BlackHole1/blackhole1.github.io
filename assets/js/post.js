const supportPrism = () => {
  // diff highlight
  document.querySelectorAll("content > pre[class^='language-diff-']").forEach((element) => {
    element.classList.add("diff-highlight");
  });

  // match braces
  document.getElementById("main-content").classList.add("match-braces", "rainbow-braces", "no-brace-hover");
};

const imageModal = () => {
  const modalElement = document.getElementById("modal");
  const imgElement = modalElement.getElementsByTagName("img")[0];

  document.querySelectorAll("img:not(.modal-img)").forEach((element) => {
    element.addEventListener("click", () => {
      modalElement.classList.replace("hide", "show");
      imgElement.src = element.src;
    });
  });

  modalElement.addEventListener("click", (e) => {
    if (e.target.tagName === "IMG") {
      return;
    }

    modalElement.classList.replace("show", "hide");
  });
}

window.onload = function() {
  supportPrism();
  imageModal();
};
