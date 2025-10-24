import * as THREE from 'three';

/**
 * JavaScript implementation of noise functions for geometry creation
 * These match the GLSL versions but run on CPU for initial geometry setup
 */

const step3 = (edge: THREE.Vector3, x: THREE.Vector3): THREE.Vector3 =>
  new THREE.Vector3(
    x.x < edge.x ? 0.0 : 1.0,
    x.y < edge.y ? 0.0 : 1.0,
    x.z < edge.z ? 0.0 : 1.0
  );

const step4 = (edge: THREE.Vector4, x: THREE.Vector4): THREE.Vector4 =>
  new THREE.Vector4(
    x.x < edge.x ? 0.0 : 1.0,
    x.y < edge.y ? 0.0 : 1.0,
    x.z < edge.z ? 0.0 : 1.0,
    x.w < edge.w ? 0.0 : 1.0
  );

const abs4 = (v: THREE.Vector4): THREE.Vector4 =>
  new THREE.Vector4(Math.abs(v.x), Math.abs(v.y), Math.abs(v.z), Math.abs(v.w));

const mod289_3 = (x: THREE.Vector3): THREE.Vector3 =>
  x.sub(x.clone().multiplyScalar(1.0 / 289.0).floor().multiplyScalar(289.0));

const mod289_4 = (x: THREE.Vector4): THREE.Vector4 =>
  x.sub(x.clone().multiplyScalar(1.0 / 289.0).floor().multiplyScalar(289.0));

const permute_4 = (x: THREE.Vector4): THREE.Vector4 =>
  mod289_4(x.clone().multiplyScalar(34.0).addScalar(1.0).multiply(x));

const taylorInvSqrt_4 = (r: THREE.Vector4): THREE.Vector4 =>
  r.clone().multiplyScalar(-0.85373472095314).addScalar(1.79284291400159);

/**
 * Simplex Noise 3D
 * Returns a noise value between -1 and 1
 */
export const snoise3D = (v: THREE.Vector3): number => {
  const C = new THREE.Vector2(1.0 / 6.0, 1.0 / 3.0);
  const D = new THREE.Vector4(0.0, 0.5, 1.0, 2.0);

  const v_dot_Cyyy = v.dot(new THREE.Vector3(C.y, C.y, C.y));
  const i = v.clone().add(new THREE.Vector3(v_dot_Cyyy, v_dot_Cyyy, v_dot_Cyyy)).floor();

  const i_dot_Cxxx = i.dot(new THREE.Vector3(C.x, C.x, C.x));
  const x0 = v.clone().sub(i).add(new THREE.Vector3(i_dot_Cxxx, i_dot_Cxxx, i_dot_Cxxx));

  const g = step3(x0.clone().set(x0.y, x0.z, x0.x), x0);
  const l = new THREE.Vector3(1.0, 1.0, 1.0).sub(g);
  const i1 = g.clone().min(l.clone().set(l.z, l.x, l.y));
  const i2 = g.clone().max(l.clone().set(l.z, l.x, l.y));

  const x1 = x0.clone().sub(i1).addScalar(C.x);
  const x2 = x0.clone().sub(i2).addScalar(C.y);
  const x3 = x0.clone().subScalar(D.y);

  const i_mod = mod289_3(i);
  const p = permute_4(
    permute_4(
      permute_4(new THREE.Vector4(0.0, i1.z, i2.z, 1.0).addScalar(i_mod.z)).add(
        new THREE.Vector4(0.0, i1.y, i2.y, 1.0).addScalar(i_mod.y)
      )
    ).add(new THREE.Vector4(0.0, i1.x, i2.x, 1.0).addScalar(i_mod.x))
  );

  const n_ = 0.142857142857;
  const nsVec = new THREE.Vector3(D.w, D.y, D.z);
  const ns = nsVec.clone().multiplyScalar(n_).sub(new THREE.Vector3(D.x, D.z, D.x));

  const j = p.clone().sub(p.clone().multiplyScalar(ns.z * ns.z).floor().multiplyScalar(49.0));
  const x_ = j.clone().multiplyScalar(ns.z).floor();
  const y_ = j.clone().sub(x_.clone().multiplyScalar(7.0)).floor();

  const x = x_.clone().multiplyScalar(ns.x).addScalar(ns.y);
  const y = y_.clone().multiplyScalar(ns.x).addScalar(ns.y);
  const h = new THREE.Vector4(1.0, 1.0, 1.0, 1.0).sub(abs4(x)).sub(abs4(y));

  const b0 = new THREE.Vector4(x.x, x.y, y.x, y.y);
  const b1 = new THREE.Vector4(x.z, x.w, y.z, y.w);

  const s0 = b0.clone().floor().multiplyScalar(2.0).addScalar(1.0);
  const s1 = b1.clone().floor().multiplyScalar(2.0).addScalar(1.0);
  const sh = step4(new THREE.Vector4(0.0, 0.0, 0.0, 0.0), h).multiplyScalar(-1.0);

  const a0 = b0
    .clone()
    .set(b0.x, b0.z, b0.y, b0.w)
    .add(s0.clone().set(s0.x, s0.z, s0.y, s0.w).multiply(sh.clone().set(sh.x, sh.x, sh.y, sh.y)));
  const a1 = b1
    .clone()
    .set(b1.x, b1.z, b1.y, b1.w)
    .add(s1.clone().set(s1.x, s1.z, s1.y, s1.w).multiply(sh.clone().set(sh.z, sh.z, sh.w, sh.w)));

  const p0 = new THREE.Vector3(a0.x, a0.y, h.x);
  const p1 = new THREE.Vector3(a0.z, a0.w, h.y);
  const p2 = new THREE.Vector3(a1.x, a1.y, h.z);
  const p3 = new THREE.Vector3(a1.z, a1.w, h.w);

  const norm = taylorInvSqrt_4(
    new THREE.Vector4(p0.dot(p0), p1.dot(p1), p2.dot(p2), p3.dot(p3))
  );

  p0.multiplyScalar(norm.x);
  p1.multiplyScalar(norm.y);
  p2.multiplyScalar(norm.z);
  p3.multiplyScalar(norm.w);

  const m = new THREE.Vector4(x0.dot(x0), x1.dot(x1), x2.dot(x2), x3.dot(x3))
    .multiplyScalar(-1.0)
    .addScalar(0.6)
    .max(new THREE.Vector4(0.0, 0.0, 0.0, 0.0));

  m.multiply(m);

  return 42.0 * m.dot(new THREE.Vector4(p0.dot(x0), p1.dot(x1), p2.dot(x2), p3.dot(x3)));
};

/**
 * Fractal Brownian Motion (FBM)
 * Combines multiple octaves of noise for more natural variation
 */
export const fbm3D = (p: THREE.Vector3, octaves = 3): number => {
  let value = 0.0;
  let amplitude = 0.5;
  let frequency = 0.8;

  for (let i = 0; i < octaves; i++) {
    value += amplitude * snoise3D(p.clone().multiplyScalar(frequency));
    amplitude *= 0.5;
    frequency *= 2.0;
  }

  return value;
};
