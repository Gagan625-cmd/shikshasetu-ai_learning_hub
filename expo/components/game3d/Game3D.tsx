import { useEffect, useMemo, useRef } from 'react';
import { StyleSheet, View, Platform } from 'react-native';
import { GLView } from 'expo-gl';
import { Renderer } from 'expo-three';
import * as THREE from 'three';

export type Game3DVariant = 'coin' | 'gem' | 'dice' | 'star' | 'orb';

const ACCENTS: Record<Game3DVariant, number> = {
  coin: 0xf59e0b,
  gem: 0x10b981,
  dice: 0x8b5cf6,
  star: 0x38bdf8,
  orb: 0xa855f7,
};

function makeStarGeometry(): THREE.ExtrudeGeometry {
  const shape = new THREE.Shape();
  const spikes = 5;
  const outer = 0.75;
  const inner = 0.32;
  for (let i = 0; i < spikes * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = (i / (spikes * 2)) * Math.PI * 2 - Math.PI / 2;
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  shape.closePath();
  const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.22, bevelEnabled: true, bevelSize: 0.06, bevelThickness: 0.06, bevelSegments: 2 });
  geo.center();
  return geo;
}

function addPips(face: THREE.Object3D, positions: [number, number][]) {
  const pipGeo = new THREE.SphereGeometry(0.09, 12, 12);
  const pipMat = new THREE.MeshStandardMaterial({ color: 0x1e1b4b, roughness: 0.4 });
  for (const [x, y] of positions) {
    const pip = new THREE.Mesh(pipGeo, pipMat);
    pip.position.set(x, y, 0.51);
    face.add(pip);
  }
}

function buildScene(variant: Game3DVariant, accent: number): { scene: THREE.Scene; mesh: THREE.Group } {
  const scene = new THREE.Scene();
  const group = new THREE.Group();
  scene.add(group);

  scene.add(new THREE.AmbientLight(0xffffff, 0.85));
  const key = new THREE.DirectionalLight(0xffffff, 2.2);
  key.position.set(2.5, 4, 6);
  scene.add(key);
  const rim = new THREE.PointLight(accent, 30, 12);
  rim.position.set(-3, -2, 3);
  scene.add(rim);

  if (variant === 'coin') {
    const body = new THREE.Mesh(
      new THREE.CylinderGeometry(0.62, 0.62, 0.14, 48),
      new THREE.MeshStandardMaterial({ color: 0xfbbf24, metalness: 0.85, roughness: 0.22, emissive: 0x7c4a03, emissiveIntensity: 0.35 })
    );
    body.rotation.x = Math.PI / 2;
    const rim2 = new THREE.Mesh(
      new THREE.TorusGeometry(0.5, 0.045, 12, 48),
      new THREE.MeshStandardMaterial({ color: 0xf97316, metalness: 0.7, roughness: 0.3 })
    );
    rim2.position.z = 0.08;
    const rim3 = rim2.clone();
    rim3.position.z = -0.08;
    body.add(rim2, rim3);
    group.add(body);
  } else if (variant === 'gem') {
    const gem = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.78),
      new THREE.MeshStandardMaterial({ color: 0x34d399, metalness: 0.55, roughness: 0.12, emissive: 0x065f46, emissiveIntensity: 0.45 })
    );
    const halo = new THREE.Mesh(
      new THREE.TorusGeometry(0.95, 0.035, 10, 48),
      new THREE.MeshStandardMaterial({ color: 0x6ee7b7, emissive: 0x10b981, emissiveIntensity: 0.9, transparent: true, opacity: 0.85 })
    );
    halo.rotation.x = Math.PI / 2.4;
    group.add(gem, halo);
  } else if (variant === 'dice') {
    const dice = new THREE.Mesh(
      new THREE.BoxGeometry(0.95, 0.95, 0.95),
      new THREE.MeshStandardMaterial({ color: 0xf8fafc, metalness: 0.15, roughness: 0.3 })
    );
    const front = new THREE.Object3D();
    const top = new THREE.Object3D();
    top.rotation.x = Math.PI / 2;
    top.position.y = 0;
    addPips(front, [[0, 0]]);
    addPips(top, [[-0.22, -0.22], [0.22, -0.22], [0, 0], [-0.22, 0.22], [0.22, 0.22]]);
    const side = new THREE.Object3D();
    side.rotation.y = Math.PI / 2;
    addPips(side, [[-0.22, 0], [0.22, 0]]);
    dice.add(front, top, side);
    group.add(dice);
  } else if (variant === 'star') {
    const star = new THREE.Mesh(
      makeStarGeometry(),
      new THREE.MeshStandardMaterial({ color: 0x60a5fa, metalness: 0.6, roughness: 0.2, emissive: 0x1d4ed8, emissiveIntensity: 0.4 })
    );
    group.add(star);
  } else {
    // orb
    const core = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.62, 1),
      new THREE.MeshStandardMaterial({ color: 0xc084fc, metalness: 0.4, roughness: 0.25, emissive: 0x7c3aed, emissiveIntensity: 0.55 })
    );
    const shell = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.86, 1),
      new THREE.MeshStandardMaterial({ color: 0xa855f7, wireframe: true, transparent: true, opacity: 0.55 })
    );
    group.add(core, shell);
  }

  return { scene, mesh: group };
}

/**
 * Real 3D game emblem rendered with three.js in expo-gl.
 * Spins gently on its own — no interaction needed.
 */
export default function Game3D({
  variant,
  size = 64,
  speed = 1,
  style,
}: {
  variant: Game3DVariant;
  size?: number;
  speed?: number;
  style?: object;
}) {
  const accent = ACCENTS[variant];
  const paused = useRef(false);
  const cleanupRef = useRef<(() => void) | null>(null);

  const onContextCreate = useMemo(() => {
    return async (gl: any) => {
      const sceneModule = buildScene(variant, accent);
      const renderer = new Renderer({ gl, alpha: true, antialias: true });
      renderer.setSize(gl.drawingBufferWidth, gl.drawingBufferHeight);
      renderer.setClearColor(0x000000, 0);
      const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
      camera.position.z = 3.1;

      let raf = 0;
      const start = Date.now();
      const loop = () => {
        if (paused.current) return;
        const t = (Date.now() - start) / 1000;
        sceneModule.mesh.rotation.y = t * 0.9 * speed;
        sceneModule.mesh.rotation.x = Math.sin(t * 0.7 * speed) * 0.22;
        sceneModule.mesh.position.y = Math.sin(t * 1.3 * speed) * 0.08;
        renderer.render(sceneModule.scene, camera);
        gl.endFrameEXP();
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);

      // Stop the loop when the GLView unmounts.
      cleanupRef.current = () => {
        paused.current = true;
        cancelAnimationFrame(raf);
        sceneModule.scene.traverse((obj: any) => {
          obj.geometry?.dispose?.();
          if (Array.isArray(obj.material)) obj.material.forEach((m: any) => m.dispose?.());
          else obj.material?.dispose?.();
        });
        renderer.dispose();
      };
    };
  }, [variant, accent, speed]);

  useEffect(() => {
    return () => {
      cleanupRef.current?.();
      cleanupRef.current = null;
    };
  }, []);

  return (
    <View style={[styles.wrap, { width: size, height: size }, style]}>
      <GLView
        style={StyleSheet.absoluteFill}
        onContextCreate={onContextCreate}
        msaaSamples={Platform.OS === 'web' ? 0 : 4}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
