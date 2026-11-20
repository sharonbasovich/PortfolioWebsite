import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, RoundedBox, useTexture } from '@react-three/drei';
import { Component, Suspense, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import SandTitle from '@src/components/dom/contact/SandTitle';
import styles from './badge.module.scss';

const { clamp } = THREE.MathUtils;
const DEFAULT_HEIGHT = 5.05;
const CARD_Y = -0.45;
const EYE_Y = 1.365;
const SEGMENTS = 30;
const COMPANIES = ['abstract', 'rbc', 'magna'];
const COMPANY_NAMES = { abstract: 'Abstract', rbc: 'RBC', magna: 'Magna' };
const BADGE_ART = ['', 'strap-'].flatMap((prefix) => COMPANIES.map((company) => `/sharon/badges/${prefix}${company}.svg`));

class SceneBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    const { failed } = this.state;
    const { children } = this.props;
    return failed ? null : children;
  }
}

function BadgePoster({ name }) {
  return (
    <div className={styles.poster} aria-hidden="true">
      <span className={styles.posterBand} style={{ backgroundImage: `url("/sharon/badges/strap-${name}.svg")` }} />
      <span className={styles.posterClip} />
      <Image unoptimized alt="" width={810} height={1100} src={`/sharon/badges/${name}.svg`} />
    </div>
  );
}

// The ribbon and its two stitched edges share one surface. The same eye position
// is used for the chrome ring and for the spline endpoint, including during a grab.
function makeRibbon() {
  const geometry = new THREE.BufferGeometry();
  const positions = new THREE.BufferAttribute(new Float32Array((SEGMENTS + 1) * 6), 3);
  positions.setUsage(THREE.DynamicDrawUsage);
  const uvs = [];
  const indices = [];
  for (let i = 0; i <= SEGMENTS; i += 1) {
    const u = i / SEGMENTS;
    uvs.push(u, 0, u, 1);
    if (i < SEGMENTS) indices.push(2 * i, 2 * i + 2, 2 * i + 1, 2 * i + 2, 2 * i + 3, 2 * i + 1);
  }
  geometry.setAttribute('position', positions);
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  return geometry;
}

function BadgeScene({ input, name, progressRef, onReady }) {
  const textures = useTexture(BADGE_ART);
  const [cards, straps] = useMemo(() => [textures.slice(0, COMPANIES.length), textures.slice(COMPANIES.length)], [textures]);
  const pivot = useRef(null);
  const flip = useRef(null);
  const fabric = useRef(null);
  const cardEdge = useRef(null);
  const cardFront = useRef(null);
  const cardBack = useRef(null);
  const didRender = useRef(false);
  const track = useRef({
    x: -0.08,
    y: CARD_Y,
    vx: 0,
    vy: 0,
    twist: -0.08,
    roll: 0.03,
    pitch: 0,
    bandX: 0,
    grabX: 0,
    grabY: 0,
    pointerId: null,
    kick: 0,
    time: 0,
  });
  const ribbon = useMemo(makeRibbon, []);
  const curve = useMemo(() => new THREE.CubicBezierCurve3(...Array.from({ length: 4 }, () => new THREE.Vector3())), []);
  const point = useMemo(() => new THREE.Vector3(), []);
  const tangent = useMemo(() => new THREE.Vector3(), []);
  const brandColors = useMemo(() => ['#131421', '#084a89', '#35373a'].map((color) => new THREE.Color(color)), []);
  const initialBrand = Math.max(0, COMPANIES.indexOf(name));

  useLayoutEffect(() => {
    [...cards, ...straps].forEach((t) => {
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = 4;
      t.needsUpdate = true;
    });
    straps.forEach((t) => {
      t.wrapS = THREE.RepeatWrapping;
      t.repeat.set(1.85, 1);
      t.needsUpdate = true;
    });
  }, [cards, straps]);
  useEffect(() => () => ribbon.dispose(), [ribbon]);

  useFrame((state, rawDelta) => {
    if (!pivot.current || !flip.current || !fabric.current || !cardFront.current || !cardBack.current) return;
    const dt = Math.min(rawDelta, 0.045);
    const p = track.current;
    const c = input.current;
    p.time += dt;
    const aspect = state.size.width / Math.max(1, state.size.height);
    const viewHeight = Math.max(DEFAULT_HEIGHT, 3.55 / aspect);
    const halfW = viewHeight * aspect * 0.5;
    const moveX = Math.min(1.32, Math.max(0.28, halfW - 1.03));
    if (state.camera.isPerspectiveCamera) {
      const fov = THREE.MathUtils.radToDeg(2 * Math.atan(viewHeight / 20));
      if (Math.abs(state.camera.fov - fov) > 0.001) {
        state.camera.fov = fov;
        state.camera.updateProjectionMatrix();
      }
    }
    c.scroll *= Math.exp(-4.3 * dt);
    let goalX = c.inside ? c.x * moveX * 0.88 : Math.sin(p.time * 0.72) * 0.095;
    let goalY = CARD_Y + (c.inside ? c.y * 0.25 : 0);
    if (c.dragging) {
      if (p.pointerId !== c.dragId) {
        p.pointerId = c.dragId;
        p.grabX = p.x - c.startX * halfW;
        p.grabY = p.y - c.startY * viewHeight * 0.5;
      }
      goalX = clamp(c.x * halfW + p.grabX, -moveX, moveX);
      goalY = clamp(c.y * viewHeight * 0.5 + p.grabY, -viewHeight * 0.5 + 1.35, 0.8);
    } else {
      p.pointerId = null;
      goalX = clamp(goalX + c.scroll * 0.92, -moveX, moveX);
      goalY += Math.abs(c.scroll) * 0.15;
    }
    if (c.kickX || c.kickY || c.kickTurn) {
      p.vx += c.kickX;
      p.vy += c.kickY;
      p.kick += c.kickTurn;
      c.kickX = 0;
      c.kickY = 0;
      c.kickTurn = 0;
    }
    // Integrate in short steps so touch reversals and slower GPUs keep the
    // same pendulum response. A held badge tracks faster than a loose one.
    const steps = Math.max(1, Math.ceil(dt * 100));
    const step = dt / steps;
    for (let i = 0; i < steps; i += 1) {
      const spring = c.dragging ? 245 : 44;
      const damping = c.dragging ? 26 : 6.8;
      p.vx += ((goalX - p.x) * spring - p.vx * damping) * step;
      p.vy += ((goalY - p.y) * spring - p.vy * damping) * step;
      p.x += p.vx * step;
      p.y += p.vy * step;
    }
    p.x = clamp(p.x, -moveX * 1.12, moveX * 1.12);
    p.kick *= Math.exp(-3.1 * dt);
    const settle = 1 - Math.exp(-9 * dt);
    p.roll += (clamp(p.x * 0.25 + p.vx * 0.065, -0.48, 0.48) - p.roll) * settle;
    p.twist += (clamp(-0.12 + p.vx * 0.15 + c.scroll * 0.47 + (c.inside ? c.x * 0.38 : 0) + p.kick, -0.95, 0.95) - p.twist) * settle;
    p.pitch += (clamp(-0.08 + p.vy * 0.075 + (c.inside ? -c.y * 0.24 : 0), -0.4, 0.35) - p.pitch) * settle;
    pivot.current.position.set(p.x, p.y, c.dragging ? 0.15 : 0);
    pivot.current.rotation.set(p.pitch, p.twist, p.roll);
    const turns = progressRef?.current ?? c.entrance;
    flip.current.rotation.y = -Math.PI * turns;
    let front = initialBrand;
    let back = initialBrand;
    let previousBrand = initialBrand;
    let nextBrand = initialBrand;
    let phase = 0;
    if (progressRef) {
      // Change artwork on the face pointing away, between the half turns.
      front = turns >= 1 ? 1 : 0;
      back = turns >= 2 ? 2 : 0;
      nextBrand = Math.min(Math.floor(turns), COMPANIES.length - 1);
      previousBrand = Math.max(0, nextBrand - 1);
      phase = turns - nextBrand;
    }
    cardFront.current.map = cards[front];
    cardBack.current.map = cards[back];
    cardEdge.current.color.lerpColors(brandColors[previousBrand], brandColors[nextBrand], phase);
    fabric.current.map = straps[phase < 0.5 ? previousBrand : nextBrand];

    curve.v0.set(-0.09, viewHeight * 0.5 + 0.14, -0.16);
    curve.v3.set(0, EYE_Y, 0).applyQuaternion(pivot.current.quaternion).add(pivot.current.position);
    p.bandX += (p.x - p.bandX) * (1 - Math.exp(-5 * dt));
    curve.v1.set(-0.09 + p.bandX * 0.12, viewHeight * 0.5 - 0.52, -0.08);
    curve.v2.set(curve.v3.x - 0.16 * p.vx - 0.12 * p.roll, curve.v3.y + 0.58, curve.v3.z + 0.06);
    const positions = ribbon.attributes.position;
    for (let i = 0; i <= SEGMENTS; i += 1) {
      const t = i / SEGMENTS;
      curve.getPoint(t, point);
      curve.getTangent(t, tangent);
      const width = 0.125 - 0.026 * Math.sin(t * Math.PI);
      const twist = (0.28 + p.twist * 0.58) * Math.sin(t * Math.PI);
      const length = Math.hypot(tangent.x, tangent.y) || 1;
      const dx = (-tangent.y / length) * width * Math.cos(twist);
      const dy = (tangent.x / length) * width * Math.cos(twist);
      const dz = width * Math.sin(twist);
      positions.setXYZ(2 * i, point.x - dx, point.y - dy, point.z - dz);
      positions.setXYZ(2 * i + 1, point.x + dx, point.y + dy, point.z + dz);
    }
    positions.needsUpdate = true;
    if (!didRender.current) {
      didRender.current = true;
      onReady();
    }
  });

  return (
    <>
      <ambientLight intensity={1.4} />
      <directionalLight position={[2.5, 3, 5]} intensity={3} />
      <directionalLight position={[-3, 1, 2]} intensity={1.2} color="#b6c6e2" />
      <Environment files="/other/studio_small_09_1k.hdr" />
      <mesh geometry={ribbon} frustumCulled={false}>
        <meshBasicMaterial ref={fabric} map={straps[initialBrand]} side={THREE.DoubleSide} toneMapped={false} />
      </mesh>
      <group ref={pivot}>
        <group ref={flip}>
          <RoundedBox args={[1.73, 2.32, 0.085]} radius={0.07} smoothness={3}>
            <meshPhysicalMaterial ref={cardEdge} color={brandColors[initialBrand]} metalness={0.26} roughness={0.27} clearcoat={0.65} />
          </RoundedBox>
          {[
            [cardFront, 1],
            [cardBack, -1],
          ].map(([material, side]) => (
            <mesh key={side} position={[0, 0, side * 0.044]} rotation={[0, side > 0 ? 0 : Math.PI, 0]}>
              <planeGeometry args={[1.64, 2.225]} />
              <meshBasicMaterial ref={material} map={cards[initialBrand]} toneMapped={false} />
            </mesh>
          ))}
        </group>
        <RoundedBox args={[0.32, 0.18, 0.14]} position={[0, 1.13, 0]} radius={0.033} smoothness={3}>
          <meshStandardMaterial color="#d4d6d6" roughness={0.21} metalness={0.92} />
        </RoundedBox>
        <mesh position={[0, 1.265, 0.006]} scale={[0.85, 1.15, 1]}>
          <torusGeometry args={[0.096, 0.031, 10, 30]} />
          <meshStandardMaterial color="#727a85" metalness={0.85} roughness={0.35} />
        </mesh>
        <RoundedBox args={[0.205, 0.14, 0.095]} position={[0, EYE_Y + 0.025, -0.012]} radius={0.022} smoothness={3}>
          <meshStandardMaterial color="#5b6269" roughness={0.32} metalness={0.78} />
        </RoundedBox>
      </group>
    </>
  );
}

export default function Badge({ name = 'rbc', progressRef }) {
  const host = useRef(null);
  const input = useRef({ inside: false, x: 0, y: 0, dragging: false, dragId: 0, startX: 0, startY: 0, scroll: 0, kickX: 0, kickY: 0, kickTurn: 0, entrance: 0 });
  const [visible, setVisible] = useState(false);
  const [reduced, setReduced] = useState(true);
  const [ready, setReady] = useState(false);
  const [grabbing, setGrabbing] = useState(false);
  const markReady = useCallback(() => setReady(true), []);

  useEffect(() => {
    const container = host.current;
    const scroller = container.closest('main');
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updateMotion = () => setReduced(mq.matches);
    updateMotion();
    mq.addEventListener('change', updateMotion);
    const watch = new IntersectionObserver(
      ([entry]) => {
        setVisible(entry.isIntersecting);
        if (!entry.isIntersecting) {
          setReady(false);
          input.current.inside = false;
        }
      },
      { root: scroller, rootMargin: '140px 0px' },
    );
    watch.observe(container);
    return () => {
      mq.removeEventListener('change', updateMotion);
      watch.disconnect();
    };
  }, []);
  useEffect(() => {
    if (!visible || reduced) return undefined;
    const scroller = host.current.closest('main');
    if (!scroller) return undefined;
    let previous = scroller.scrollTop;
    let at = performance.now();
    const sample = () => {
      const now = performance.now();
      const speed = (scroller.scrollTop - previous) / Math.max(12, now - at);
      input.current.scroll = clamp(input.current.scroll * 0.38 + speed * 0.61, -1.35, 1.35);
      if (!progressRef) {
        const rect = host.current.getBoundingClientRect();
        const face = rect.top + rect.height * 0.49 - scroller.getBoundingClientRect().top;
        const height = scroller.clientHeight;
        const progress = clamp((height * 0.92 - face) / Math.max(1, height * 0.37), 0, 1);
        input.current.entrance = progress * progress * (3 - 2 * progress);
      }
      previous = scroller.scrollTop;
      at = now;
    };
    sample();
    scroller.addEventListener('scroll', sample, { passive: true });
    return () => scroller.removeEventListener('scroll', sample);
  }, [visible, reduced, progressRef]);

  const pointer = (event) => {
    if (!event.isPrimary) return;
    const rect = host.current.getBoundingClientRect();
    const c = input.current;
    c.x = clamp(((event.clientX - rect.left) / rect.width) * 2 - 1, -1.3, 1.3);
    c.y = clamp(1 - ((event.clientY - rect.top) / rect.height) * 2, -1.3, 1.3);
    c.inside = true;
  };
  const release = (event) => {
    input.current.dragging = false;
    if (event?.pointerType === 'touch') input.current.inside = false;
    setGrabbing(false);
  };
  useEffect(() => {
    window.addEventListener('blur', release);
    return () => window.removeEventListener('blur', release);
  }, []);
  const live = visible && !reduced;
  return (
    <div ref={host} className={styles.scene} data-brand={name} data-ready={live && ready} data-held={grabbing} role="group" aria-label={`${COMPANY_NAMES[name]} internship badge`}>
      <SandTitle field />
      {!reduced && (
        <button
          type="button"
          className={styles.badgeControl}
          aria-label="Move the badge by dragging or using the arrow keys. Press space or enter to flick it."
          onClick={(event) => {
            if (event.detail === 0) input.current.kickTurn = 1.25;
          }}
          onPointerEnter={pointer}
          onPointerMove={pointer}
          onPointerLeave={() => {
            if (!input.current.dragging) input.current.inside = false;
          }}
          onPointerDown={(event) => {
            if (!live || !event.isPrimary || event.button !== 0) return;
            pointer(event);
            const c = input.current;
            c.dragId += 1;
            c.startX = c.x;
            c.startY = c.y;
            c.dragging = true;
            c.kickTurn = c.x < 0 ? -0.45 : 0.45;
            event.currentTarget.setPointerCapture(event.pointerId);
            setGrabbing(true);
          }}
          onPointerUp={(event) => {
            if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
            release(event);
            if (event.pointerType !== 'touch' && !event.currentTarget.matches(':hover')) input.current.inside = false;
          }}
          onPointerCancel={release}
          onLostPointerCapture={release}
          onBlur={() => {
            release();
            input.current.inside = false;
          }}
          onKeyDown={(event) => {
            if (reduced || !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
            event.preventDefault();
            const c = input.current;
            if (event.key === 'ArrowLeft') c.kickX = -5;
            if (event.key === 'ArrowRight') c.kickX = 5;
            if (event.key === 'ArrowUp') c.kickY = 4;
            if (event.key === 'ArrowDown') c.kickY = -4;
          }}
        />
      )}
      <BadgePoster name={name} />
      {live && (
        <div className={styles.viewport} aria-hidden="true">
          <SceneBoundary>
            <Canvas camera={{ position: [0, 0, 10], fov: 28.34 }} dpr={[1, 1.5]} gl={{ alpha: true, antialias: true, powerPreference: 'low-power' }}>
              <Suspense fallback={null}>
                <BadgeScene input={input} progressRef={progressRef} name={name} onReady={markReady} />
              </Suspense>
            </Canvas>
          </SceneBoundary>
        </div>
      )}
    </div>
  );
}
