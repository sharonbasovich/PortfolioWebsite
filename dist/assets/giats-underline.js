/* Port of the SVG path in Giats's footer, MIT © 2025 Evangelos Giatsidis.
 * https://github.com/Giats2498/giats-portfolio/blob/1e0b7b0bfc0dce086a91c8d742c3c13cff6cf270/src/components/dom/Footer.jsx
 * Giats license: CONTACT-GRAIN-NOTICE.txt
 *
 * Giats's path is the Iocaste example from Codrops LineHoverStyles.
 * https://github.com/codrops/LineHoverStyles/blob/main/index.html
 *
 * MIT License
 * Copyright (c) 2009 - 2021 Codrops (https://tympanus.net/codrops)
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
(() => {
  const svgNamespace = "http://www.w3.org/2000/svg";
  const track = document.createElementNS(svgNamespace, "svg");
  track.setAttribute("class", "giats-underline-track");
  track.setAttribute("viewBox", "0 0 1200 60");
  track.setAttribute("preserveAspectRatio", "none");
  track.setAttribute("aria-hidden", "true");
  track.setAttribute("focusable", "false");

  const path = document.createElementNS(svgNamespace, "path");
  path.setAttribute("d", "M0,56.5c0,0,298.666,0,399.333,0C448.336,56.5,513.994,46,597,46c77.327,0,135,10.5,200.999,10.5c95.996,0,402.001,0,402.001,0");
  track.append(path);

  for (const link of document.querySelectorAll("a.quiet-link[href], a.email-link[href], .site-header nav a[href], .hero-links a.button[href]")) {
    const text = link.firstChild;
    if (text?.nodeType !== Node.TEXT_NODE || !text.textContent.trim()) continue;

    // Clip to the label so the stroke never moves under the separate arrow.
    const label = document.createElement("span");
    label.className = "giats-underline-label";
    text.before(label);
    label.append(text, track.cloneNode(true));
    link.classList.add("giats-link-ready");
  }
})();
