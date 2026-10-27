# ECHO adaptations

Source: [ECHO-WEBSITE](https://github.com/Jishnu09-siuu/ECHO-WEBSITE), by Jishnu Mondal.
Upstream revision: `0b7e98d3663dd8f9b2fe9f13008738a0cf1f2ab5`.
The upstream README declares the project MIT licensed. This snapshot contains no
separate LICENSE file; that declaration and attribution are retained here.

`flex-carousel.js` adapts the original liquid carousel shader and controller.
`contact.js` adapts the expanding-card and separating-word choreography from
`scroll-expand-media.js`. No ECHO photographs, illustrations or personal copy
are reused. Sharon's existing project assets and contact content remain in place.

Modifications: the existing GSAP page scroll clock drives every project; nested
wheel capture, dragging, intro autoplay and additional animation loops are disabled.
Transparent logos are composited over explicit surfaces, source crops are retained,
SVGs are rasterized before texture upload, and a DOM image fallback is included.
Rendering is bounded to one million pixels with DPR capped at 1.5. Resources and
listeners are released when layouts change. Touch and reduced-motion layouts
retain native vertical cards. Contact expansion reuses the existing 3D renderer.

The carousel uses [OGL 1.0.11](https://github.com/oframe/ogl), released under the Unlicense in
its official npm package metadata. `vendor/ogl/ogl.js` is the esm.sh ES2022
bundle for that exact version. See the adjacent NOTICE.md for provenance.
