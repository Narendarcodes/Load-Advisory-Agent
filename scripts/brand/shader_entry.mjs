/*
 * Saral shaders: Paper Shaders (vanilla build), Apache-2.0,
 * https://github.com/paper-design/shaders  ("Powered by Paper Shaders: https://shaders.paper.design").
 *
 * Bundled to public/js/vendor/saral-shader.js by scripts/brand/build_shader.sh and loaded lazily by
 * public/js/shader.js. v6 placement (DESIGN_PRINCIPLES §1 "Shader placement (v6)"): shaders live on flat
 * surfaces, never behind an illustration. This core chunk holds the MeshGradient looks:
 *   wash     the very quiet page wash on large flat cream areas (sign-in background, empty side areas)
 *   band     the thin animated strip on the top bar and the footer
 *   loading  the calm band shown while a page is loading
 *   orb      the assistant's glow behind the Saral mark (empty state)
 *   stream   the shimmer on the edge of an answer that is still streaming
 * shader_extra.mjs adds PulsingBorder (card rings, thinking, composer), SmokeRing (voice orb) and
 * GrainGradient (application processing) in a separate lazy chunk.
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

const MESH = {
	/* Barely-there: paper, blush and lilac a few steps off the cream, slow, so text on the page stays calm. */
	wash: { colors: ["#F7F3EE", "#FCE9DE", "#F7F3EE", "#F6EEF1", "#FAEEE2"], distortion: 0.9, swirl: 0.35, grain: 0.03, speed: 0.1, scale: 0.75, pixels: 220000 },
	/* The brand ramp, compressed into a thin strip. */
	band: { colors: ["#FFB089", "#FF8F68", "#E25F4B", "#7E3550", "#FFC4A8"], distortion: 0.9, swirl: 0.6, grain: 0.08, speed: 0.32, scale: 1.4, pixels: 90000 },
	loading: { colors: ["#FFD9C4", "#FF8F68", "#E25F4B", "#F2A65A", "#7E3550"], distortion: 1, swirl: 0.8, grain: 0.06, speed: 0.7, scale: 1.2, pixels: 90000 },
	/* Deeper than v5: apricot core, coral and plum depth, a cool lilac edge; slower and smoother. */
	orb: { colors: ["#FFE3D3", "#FFB089", "#FF8F68", "#E25F4B", "#6A2C52", "#C9A3D8"], distortion: 1, swirl: 0.85, grain: 0, speed: 0.34, scale: 0.9 },
	stream: { colors: ["#FFC4A8", "#FF8F68", "#E25F4B", "#7E3550", "#FFE3D3"], distortion: 1, swirl: 0.9, grain: 0, speed: 0.9, scale: 1.6, pixels: 30000 },
};

function handle(mount) {
	return {
		dispose: () => mount.dispose(),
		setMaxPixelCount: (n) => mount.setMaxPixelCount(n),
		setState: () => {},
	};
}

/** Mount a mesh-gradient look into el. opts: { maxPixels, frame }. Returns { dispose, setMaxPixelCount, setState }. */
export function mount(el, name, opts = {}) {
	const p = MESH[name] || MESH.wash;
	const cap = p.pixels ? Math.min(p.pixels, opts.maxPixels || p.pixels) : opts.maxPixels || 1280 * 720;
	const colors = rgba(p.colors);
	const m = new ShaderMount(
		el,
		meshGradientFragmentShader,
		{ u_colors: colors, u_colorsCount: colors.length, u_distortion: p.distortion, u_swirl: p.swirl, u_grainMixer: 0, u_grainOverlay: p.grain, ...sizing, u_scale: p.scale || 1 },
		{ alpha: false, premultipliedAlpha: false },
		p.speed,
		opts.frame || 0,
		1,
		cap,
	);
	const h = handle(m);
	// Wash, bands and the stream edge are smooth fields: a low pixel cap is invisible and keeps software GL cheap.
	h.setMaxPixelCount = (n) => m.setMaxPixelCount(p.pixels ? Math.min(p.pixels, n) : n);
	return h;
}
