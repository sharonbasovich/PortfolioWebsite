// From the Lions Robotics site: https://lionsrobotics.vercel.app/grain-reveal.js
// The arena and diagram marks share a fine, world-space grain. Wind the
// progress backward to reverse a reveal without changing which cells appear.
export const GRAIN_GLSL = `
  float grainCell(vec3 worldPosition) {
    vec3 cell = fract(floor(worldPosition * 810.0) * vec3(0.1031, 0.1030, 0.0973));
    cell += dot(cell, cell.yxz + 33.33);
    return fract((cell.x + cell.y) * cell.z);
  }
`;

export function applyGrainReveal(material, progress, {ordered=false} = {}) {
  const sprite = material.isSpriteMaterial;
  const vertexHook = sprite ? 'gl_Position = projectionMatrix * mvPosition;' : '#include <project_vertex>';
  // Sprite vertices are already rotated and offset in view space at this
  // point. The inverse rotation and camera translation anchor their grain.
  const grainPosition = sprite
    ? `vDiagramPosition = cameraPosition + vec3(dot(viewMatrix[0].xyz, mvPosition.xyz),
          dot(viewMatrix[1].xyz, mvPosition.xyz), dot(viewMatrix[2].xyz, mvPosition.xyz));`
    : 'vDiagramPosition = (modelMatrix * vec4(transformed, 1.0)).xyz;';
  const orderVarying = ordered ? 'varying float vRevealOrder;' : '';
  const threshold = ordered ? 'clamp((diagramReveal - vRevealOrder) * 6.0, 0.0, 1.0)' : 'diagramReveal';

  material.customProgramCacheKey = () => `diagram-grain-${sprite ? 'sprite' : 'shape'}-${ordered}`;
  material.onBeforeCompile = shader => {
    shader.uniforms.diagramReveal = progress;
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>
        varying vec3 vDiagramPosition;
        ${orderVarying}
        ${ordered ? 'attribute float revealOrder;' : ''}
      `)
      .replace(vertexHook, `${vertexHook}
        ${grainPosition}
        ${ordered ? 'vRevealOrder = revealOrder;' : ''}
      `);
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>
        varying vec3 vDiagramPosition;
        ${orderVarying}
        uniform float diagramReveal;
        ${GRAIN_GLSL}
      `)
      .replace('#include <alphahash_fragment>', `#include <alphahash_fragment>
        if (diagramReveal < 0.9999) {
          float threshold = ${threshold};
          if (threshold <= 0.0 || grainCell(vDiagramPosition) > threshold) discard;
        }
      `);
  };
  return material;
}
