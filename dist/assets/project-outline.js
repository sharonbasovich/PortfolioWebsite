/* Mount the two decorative layers used by Motion Primitives Border Trail. */
(() => {
  for (const imageLink of document.querySelectorAll(".project-photo")) {
    const outline = document.createElement("span");
    outline.className = "project-outline";
    outline.setAttribute("aria-hidden", "true");

    const trail = document.createElement("span");
    trail.className = "project-outline__trail";
    outline.append(trail);
    imageLink.append(outline);
  }
})();
