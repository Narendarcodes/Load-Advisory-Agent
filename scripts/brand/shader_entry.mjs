/*
 * Saral shaders: Paper Shaders (vanilla build), Apache-2.0,
 * https://github.com/paper-design/shaders  ("Powered by Paper Shaders: https://shaders.paper.design").
 *
 * Bundled to public/js/vendor/saral-shader.js by scripts/brand/build_shader.sh and loaded lazily by
 * public/js/shader.js. This core holds the MeshGradient (brand, approved, muted and the assistant orb);
 * shader_extra.mjs adds GrainGradient (the calm "checks running" banner, whose slow drift doubles as the
 * processing indicator) and PulsingBorder (the assistant thinking state) in a separate lazy chunk.
 * Paper's ShaderMount already pauses when the element is off-screen or the tab is hidden.
 */
import { ShaderMount } from "paper-shaders-dist/shader-mount.js";
import { meshGradientFragmentShader } from "paper-shaders-dist/shaders/mesh-gradient.js";
import { getShaderColorFromString } from "paper-shaders-dist/get-shader-color-from-string.js";
import { ShaderFitOptions } from "paper-shaders-dist/shader-sizing.js";

const sizing = {
	u_fit: ShaderFitOptions.cover,
	u_scale: 1,
	u_rotation: 0,
	u_offsetX: 0,
	u_offsetY: 0,
	u_originX: 0.5,
	u_originY: 0.5,
	u_worldWidth: 0,
	u_worldHeight: 0,
};
const rgba = (list) => list.map(getShaderColorFromString);

/* Warm brand ramp: cream -> peach #FF8F68 -> coral -> a deep plum accent for depth. */
const MESH = {
	brand: { colors: ["#FFF1E6", "#FFB089", "#FF8F68", "#E25F4B", "#4E2440"], distortion: 0.85, swirl: 0.45, grain: 0.16, speed: 0.38 },
	approved: { colors: ["#FFF3E0", "#FFC98C", "#FF8F68", "#F2A65A", "#7E3550"], distortion: 0.9, swirl: 0.55, grain: 0.14, speed: 0.42 },
	muted: { colors: ["#F4EEE9", "#E7DAD3", "#D8C8CB", "#EFE2D8"], distortion: 0.6, swirl: 0.15, grain: 0.12, speed: 0.12 },
	orb: { colors: ["#FFE3D3", "#FF8F68", "#E25F4B", "#6A2C52", "#FFC4A8"], distortion: 1, swirl: 0.7, grain: 0, speed: 0.5 },
};

function mesh(el, p, opts) {
	const colors = rgba(p.colors);
	return new ShaderMount(
		el,
		meshGradientFragmentShader,
		{ u_colors: colors, u_colorsCount: colors.length, u_distortion: p.distortion, u_swirl: p.swirl, u_grainMixer: 0, u_grainOverlay: p.grain, ...sizing },
		{ alpha: false, premultipliedAlpha: false },
		p.speed,
		opts.frame,
		1,
		opts.maxPixels,
	);
}

/** Mount a mesh-gradient palette (brand, approved, muted, orb) into el. opts: { maxPixels, frame }. */
export function mount(el, name, opts = {}) {
	const o = { maxPixels: opts.maxPixels || 1280 * 720, frame: opts.frame || 0 };
	return mesh(el, MESH[name === "warm" ? "brand" : name] || MESH.brand, o);
}
