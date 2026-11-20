import * as THREE from 'three';
import { useEffect, useMemo, useRef } from 'react';
import { InstancedRigidBodies } from '@react-three/rapier';
import { MeshTransmissionMaterial } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';

const cameraZ = 20;
const tangent = Math.tan(Math.PI / 18);
const { clamp } = THREE.MathUtils;
const colors = ['#21212a', '#5062ee', '#222537', '#8f7bef', '#6579f4', '#4854b6', '#8eb6c9'];
function SphereBodies({ bodies, instances, children }) {
  return (
    <InstancedRigidBodies ref={bodies} instances={instances} type="dynamic" colliders="ball" linearDamping={0.72} angularDamping={1.1} friction={0.14} restitution={0.79}>
      {children}
    </InstancedRigidBodies>
  );
}

function populate(compact) {
  const count = compact ? 32 : 64;
  const solid = [];
  const glass = [];
  const entries = [];
  const tints = [];
  const color = new THREE.Color();
  for (let index = 0; index < count; index += 1) {
    const crystal = index % 7 === 3;
    const batch = crystal ? glass : solid;
    // A low-discrepancy sequence distributes all finishes across the full frame.
    const x = 2 * ((0.5 + index * 0.7548776662) % 1) - 1;
    const y = 2 * ((0.5 + index * 0.569840291) % 1) - 1;
    const z = ((index * 0.381966) % 1) * 3.4 - 1.8;
    const radius = (compact ? 0.25 : 0.34) + ((index * 0.618034) % 1) ** 1.35 * (compact ? 0.46 : 0.59);
    if (!crystal) tints.push(...color.set(colors[index % colors.length]).toArray());
    entries.push({ x, y, z, radius, crystal, slot: batch.length, phase: index * 1.48 });
    batch.push({ key: `ball-${index}`, position: [x * 5.5, y * 3, z], scale: radius });
  }
  return { solid, glass, entries, tints: new Float32Array(tints) };
}

export default function FloatRigidBody({ compact, interactionRef, reducedMotion, onRendered }) {
  const solids = useRef([]);
  const crystals = useRef([]);
  const force = useMemo(() => new THREE.Vector3(), []);
  const field = useMemo(() => populate(compact), [compact]);
  const initialized = useRef(false);
  const input = useRef({
    x: 0,
    y: 0,
    previousX: 0,
    previousY: 0,
    velocityX: 0,
    velocityY: 0,
    active: false,
    fresh: true,
    press: false,
    down: false,
    release: false,
    scroll: 0,
    kickX: 0,
    kickY: 0,
    aspect: 1.5,
    visible: true,
    held: null,
    pointerId: null,
    touch: false,
    lastMove: 0,
  });

  useEffect(() => {
    const panel = interactionRef.current;
    const scroller = panel?.closest('main');
    if (!panel || !scroller) return undefined;
    const controls = input.current;
    let bounds = panel.getBoundingClientRect();
    let lastScroll = scroller.scrollTop;
    const measure = () => {
      bounds = panel.getBoundingClientRect();
      controls.aspect = bounds.width / Math.max(1, bounds.height);
      controls.visible = bounds.bottom > 0 && bounds.top < scroller.clientHeight;
    };
    const move = (event) => {
      if (controls.pointerId !== null && event.pointerId !== controls.pointerId) return;
      controls.touch = event.pointerType === 'touch';
      controls.x = ((event.clientX - bounds.left) / Math.max(1, bounds.width)) * 2 - 1;
      controls.y = 1 - ((event.clientY - bounds.top) / Math.max(1, bounds.height)) * 2;
      if (!controls.active) controls.fresh = true;
      controls.active = true;
      controls.lastMove = performance.now();
    };
    const press = (event) => {
      if (!event.isPrimary || event.button !== 0) return;
      measure();
      move(event);
      controls.down = true;
      controls.press = true;
      controls.release = false;
      controls.pressX = controls.x;
      controls.pressY = controls.y;
      controls.pointerId = event.pointerId;
      // Touch browsers retain native vertical pan and issue pointercancel as needed.
      if (!controls.touch) panel.setPointerCapture(event.pointerId);
    };
    const release = (event) => {
      if (event?.pointerId != null && controls.pointerId !== event.pointerId) return;
      controls.down = false;
      controls.release = true;
      if (event?.type === 'pointercancel' || event?.type === 'blur') {
        controls.velocityX = 0;
        controls.velocityY = 0;
        controls.press = false;
        controls.lastMove = 0;
      }
      if (controls.pointerId !== null && panel.hasPointerCapture(controls.pointerId)) panel.releasePointerCapture(controls.pointerId);
      controls.pointerId = null;
      if (controls.touch || event?.type === 'blur') controls.active = false;
    };
    const leave = () => {
      if (!controls.down) controls.active = false;
    };
    const scroll = () => {
      measure();
      const amount = scroller.scrollTop - lastScroll;
      if (controls.visible && !reducedMotion) controls.scroll = clamp(controls.scroll + amount * 0.036, -7, 7);
      lastScroll = scroller.scrollTop;
    };
    const key = (event) => {
      const impulses = { ArrowLeft: [-7, 0], ArrowRight: [7, 0], ArrowUp: [0, 7], ArrowDown: [0, -7], ' ': [3, 6] };
      if (event.key === 'Escape') release();
      if (impulses[event.key]) {
        event.preventDefault();
        [controls.kickX, controls.kickY] = impulses[event.key];
      }
    };
    const resize = new ResizeObserver(measure);
    resize.observe(panel);
    measure();
    panel.addEventListener('pointermove', move, { passive: true });
    panel.addEventListener('pointerdown', press);
    panel.addEventListener('pointerleave', leave);
    panel.addEventListener('keydown', key);
    window.addEventListener('pointerup', release);
    window.addEventListener('pointercancel', release);
    window.addEventListener('blur', release);
    scroller.addEventListener('scroll', scroll, { passive: true });
    return () => {
      panel.style.cursor = '';
      resize.disconnect();
      panel.removeEventListener('pointermove', move);
      panel.removeEventListener('pointerdown', press);
      panel.removeEventListener('pointerleave', leave);
      panel.removeEventListener('keydown', key);
      window.removeEventListener('pointerup', release);
      window.removeEventListener('pointercancel', release);
      window.removeEventListener('blur', release);
      scroller.removeEventListener('scroll', scroll);
    };
  }, [interactionRef, reducedMotion]);

  useFrame((state, frameDelta) => {
    const c = input.current;
    if (!c.visible && !c.held) return;
    const dt = clamp(frameDelta, 1 / 240, 1 / 25);
    const t = state.clock.elapsedTime;
    const speedX = c.fresh ? 0 : clamp((c.x - c.previousX) / dt, -8, 8);
    const speedY = c.fresh ? 0 : clamp((c.y - c.previousY) / dt, -8, 8);
    if (c.fresh) {
      c.previousX = c.x;
      c.previousY = c.y;
      c.fresh = false;
    }
    c.velocityX = THREE.MathUtils.lerp(c.velocityX, speedX, 1 - Math.exp(-dt * 24));
    c.velocityY = THREE.MathUtils.lerp(c.velocityY, speedY, 1 - Math.exp(-dt * 24));

    const bodyAt = (entry) => (entry.crystal ? crystals.current?.[entry.slot] : solids.current?.[entry.slot]);
    const panel = interactionRef.current;
    if (c.press) {
      c.press = false;
      let best = null;
      let closest = Infinity;
      field.entries.forEach((entry) => {
        const body = bodyAt(entry);
        if (!body) return;
        const { x, y, z } = body.translation();
        const half = (cameraZ - z) * tangent;
        const dx = x - c.pressX * half * c.aspect;
        const dy = y - c.pressY * half;
        const distance = Math.hypot(dx, dy);
        const paddedRadius = entry.radius + (compact ? 0.28 : 0.17);
        if (distance > paddedRadius) return;
        // Prefer an actual frontmost hit, falling back to the near rim.
        const score = distance <= entry.radius ? cameraZ - z - Math.sqrt(entry.radius ** 2 - distance ** 2) : 40 + distance;
        if (score < closest) {
          closest = score;
          best = { body, z, dx, dy };
        }
      });
      c.held = best;
      if (best && panel) panel.style.cursor = 'grabbing';
    }
    if (c.release) {
      if (c.held && performance.now() - c.lastMove < 120) {
        const { body } = c.held;
        const mass = body.mass();
        force
          .set(c.velocityX * c.aspect, c.velocityY, -0.35)
          .multiplyScalar(1.4)
          .clampLength(0, 11)
          .multiplyScalar(mass);
        body.applyImpulse(force, true);
      }
      c.held = null;
      c.release = false;
      if (panel) panel.style.cursor = '';
    }
    let bodiesReady = true;
    field.entries.forEach((entry) => {
      const body = bodyAt(entry);
      if (!body) {
        bodiesReady = false;
        return;
      }
      const halfHome = (cameraZ - entry.z) * tangent;
      const homeX = entry.x * Math.max(0.05, halfHome * c.aspect - entry.radius);
      const homeY = entry.y * (halfHome - entry.radius);
      if (!initialized.current) body.setTranslation({ x: homeX, y: homeY, z: entry.z }, true);
      const pos = body.translation();
      const velocity = body.linvel();
      const held = c.held?.body === body;
      const half = (cameraZ - pos.z) * tangent;
      const halfX = half * c.aspect;
      const px = c.x * halfX;
      const py = c.y * half;
      if (held) {
        const plane = (cameraZ - c.held.z) * tangent;
        force.set((c.x * plane * c.aspect + c.held.dx - pos.x) * 190 - velocity.x * 20, (c.y * plane + c.held.dy - pos.y) * 190 - velocity.y * 20, (c.held.z - pos.z) * 100 - velocity.z * 13);
      } else {
        const drift = reducedMotion ? 0 : 0.31;
        force.set((homeX + Math.sin(t * 0.56 + entry.phase) * drift - pos.x) * 2.25, (homeY + Math.cos(t * 0.54 + entry.phase) * drift - pos.y) * 2.25, (entry.z - pos.z) * 4.3 - velocity.z * 0.55);
        if (c.active && !reducedMotion) {
          // Sweep the complete pointer segment so fast crossings still strike a ball.
          const mx = (c.x - c.previousX) * halfX;
          const my = (c.y - c.previousY) * half;
          const fraction = clamp(((pos.x - px) * -mx + (pos.y - py) * -my) / (mx * mx + my * my || 1), 0, 1);
          const dx = pos.x - (px - mx * fraction);
          const dy = pos.y - (py - my * fraction);
          const reach = entry.radius + (compact ? 0.95 : 1.48);
          const distance = Math.hypot(dx, dy);
          if (distance < reach) {
            const falloff = (1 - distance / reach) ** 1.3;
            const speed = Math.min(Math.hypot(c.velocityX * c.aspect, c.velocityY), 6);
            const shove = falloff * (1.35 + speed * 14);
            force.x += (dx / (distance || 1)) * shove + clamp(c.velocityX * halfX * 6, -80, 80) * falloff;
            force.y += (dy / (distance || 1)) * shove + clamp(c.velocityY * half * 6, -80, 80) * falloff;
            force.z -= falloff * speed * 1.75;
          }
        }
        // Tangential acceleration turns scrolling into a visible rotating current.
        force.x += (-pos.y * 2.8 + Math.sin(entry.phase) * 1.2) * c.scroll;
        force.y += (entry.x * 5.5 - 2.6) * c.scroll;
        if (c.kickX || c.kickY) {
          const strength = 0.55 + (Math.sin(entry.phase) + 1) * 0.18;
          body.applyImpulse({ x: c.kickX * body.mass() * strength, y: c.kickY * body.mass() * strength, z: 0 }, true);
        }
      }
      // Soft walls keep thrown balls visible and allow a real rebound.
      const limitX = Math.max(0.08, halfX - entry.radius * 0.76);
      const limitY = Math.max(0.08, half - entry.radius * 0.76);
      force.x += (clamp(pos.x, -limitX, limitX) - pos.x) * 49;
      force.y += (clamp(pos.y, -limitY, limitY) - pos.y) * 49;
      force.clampLength(0, held ? 360 : 145).multiplyScalar(body.mass() * dt);
      body.applyImpulse(force, true);
    });
    if (bodiesReady) initialized.current = true;
    c.previousX = c.x;
    c.previousY = c.y;
    c.scroll *= Math.exp(-dt * 3.7);
    c.kickX = 0;
    c.kickY = 0;
  });

  return (
    <>
      <SphereBodies bodies={solids} instances={field.solid}>
        <instancedMesh args={[null, null, field.solid.length]} frustumCulled={false} onAfterRender={onRendered}>
          <sphereGeometry args={[1, compact ? 24 : 32, compact ? 16 : 20]}>
            <instancedBufferAttribute attach="attributes-color" args={[field.tints, 3]} />
          </sphereGeometry>
          <meshPhysicalMaterial vertexColors roughness={0.22} metalness={0.32} clearcoat={0.62} clearcoatRoughness={0.2} />
        </instancedMesh>
      </SphereBodies>
      <SphereBodies bodies={crystals} instances={field.glass}>
        <instancedMesh args={[null, null, field.glass.length]} frustumCulled={false}>
          <sphereGeometry args={[1, compact ? 24 : 32, compact ? 16 : 20]} />
          {compact ? (
            <meshPhysicalMaterial color="#b9c8de" metalness={0.9} roughness={0.12} clearcoat={1} />
          ) : (
            <MeshTransmissionMaterial samples={3} resolution={256} transmission={1} roughness={0.045} thickness={1.15} ior={1.48} chromaticAberration={0.035} clearcoat={1} />
          )}
        </instancedMesh>
      </SphereBodies>
    </>
  );
}
