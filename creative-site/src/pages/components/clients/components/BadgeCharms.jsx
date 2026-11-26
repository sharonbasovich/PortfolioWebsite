import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import { CubicBezierCurve3, MathUtils, Object3D, Vector3 } from 'three';

const CHARMS = [
  {
    file: '/sharon/charms/skyline.glb',
    hook: [0, 0.156, -0.03],
    landing: [-1.32, 0.34, 0.19],
    rotation: [0.30, 0.91, -0.16],
    scale: 1.18,
    links: 15,
  },
  {
    file: '/sharon/charms/switch.glb',
    hook: [0, 0.44, -0.07],
    landing: [1.22, 0.62, 0.20],
    rotation: [0.12, -0.22, 0.10],
    scale: 0.82,
    links: 14,
  },
];
const CHARM_ASSETS = CHARMS.map(({ file }) => file);
const UP = new Vector3(0, 1, 0);

function HangingCharm({ asset, charm, track }) {
  const chain = useRef(null);
  const pendant = useRef(null);
  const spring = useRef({ angle: 0, velocity: 0, yaw: 0 });
  const model = useMemo(() => asset.scene.clone(), [asset]);
  const { curve, link, orientation } = useMemo(() => ({
    curve: new CubicBezierCurve3(),
    link: new Object3D(),
    orientation: new Vector3(),
  }), []);
  const [restX, restY, restZ] = charm.landing;
  const side = Math.sign(restX);

  useFrame((_, rawDelta) => {
    if (!chain.current || !pendant.current) return;
    const dt = Math.min(rawDelta, 0.045);
    const badge = track.current;
    const motion = spring.current;
    const force = MathUtils.clamp(-badge.vx * 0.12 + badge.roll * 0.42 - badge.scrollMotion * 0.36, -0.62, 0.62);
    const stiffness = side < 0 ? 37 : 52;
    motion.velocity += ((force - motion.angle) * stiffness - motion.velocity * 5.4) * dt;
    motion.angle += motion.velocity * dt;
    motion.yaw = MathUtils.damp(motion.yaw, -badge.twist * 0.5 + motion.angle * 0.42, 6, dt);

    const fit = badge.charmFit;
    const swing = Math.sin(motion.angle);
    curve.v0.set(side * 0.079, 1.296, 0.032);
    curve.v1.set(side * 0.54 * fit, 1.19, 0.14);
    curve.v2.set(side * 1.01 * fit, 1.0, restZ);
    curve.v3.set(restX * fit + swing * 0.33, restY + (1 - Math.cos(motion.angle)) * 0.25, restZ + Math.abs(swing) * 0.11);
    for (let index = 0; index < charm.links; index += 1) {
      const t = (index + 0.5) / charm.links;
      curve.getPoint(t, link.position);
      curve.getPoint(t + 0.015, orientation).sub(link.position).normalize();
      link.quaternion.setFromUnitVectors(UP, orientation);
      link.rotateY(index % 2 ? Math.PI * 0.45 : -0.18);
      link.scale.set(0.62, 1.12, 1);
      link.updateMatrix();
      chain.current.setMatrixAt(index, link.matrix);
    }
    chain.current.instanceMatrix.needsUpdate = true;
    pendant.current.position.copy(curve.v3);
    pendant.current.rotation.set(-badge.pitch * 0.45 - motion.velocity * 0.029, motion.yaw, motion.angle);
    pendant.current.scale.setScalar(fit);
  });

  return (
    <>
      <instancedMesh ref={chain} args={[null, null, charm.links]} frustumCulled={false}>
        <torusGeometry args={[0.052, 0.0115, 7, 16]} />
        <meshStandardMaterial color="#a5aab5" metalness={0.83} roughness={0.29} />
      </instancedMesh>
      <group ref={pendant}>
        <group rotation={charm.rotation} scale={charm.scale}>
          <group position={charm.hook.map(value => -value)}>
            <primitive object={model} dispose={null} />
          </group>
        </group>
      </group>
    </>
  );
}

export default function BadgeCharms({ track }) {
  const assets = useGLTF(CHARM_ASSETS, false, false);
  return CHARMS.map((charm, index) => (
    <HangingCharm key={charm.file} asset={assets[index]} charm={charm} track={track} />
  ));
}
