/*
 * Saral shaders, extra chunk (Paper Shaders, Apache-2.0, https://shaders.paper.design). These need Paper's noise
 * texture, so they load only on pages that show one of them:
 *   ring      PulsingBorder glow ring on the edge of a key card (sign-in, next step, decision, estimate)
 *   pulse     PulsingBorder ring around the assistant while it is thinking
 *   composer  PulsingBorder thin animated edge on the assistant composer while focused or sending
 *   voice     SmokeRing orb for the voice call; states idle | connecting | listening | thinking | speaking | muted
 *   calm      GrainGradient processing band (an application whose checks are running)
 * All are transparent outside their shape, so the card or page underneath shows through.
 */
import { ShaderMount } from "paper-shaders-dist/shader-mount.js";
import { grainGradientFragmentShader, GrainGradientShapes } from "paper-shaders-dist/shaders/grain-gradient.js";
import { pulsingBorderFragmentShader } from "paper-shaders-dist/shaders/pulsing-border.js";
import { smokeRingFragmentShader } from "paper-shaders-dist/shaders/smoke-ring.js";
import { getShaderNoiseTexture } from "paper-shaders-dist/get-shader-noise-texture.js";
import { getShaderColorFromString } from "paper-shaders-dist/get-shader-color-from-string.js";
import { ShaderFitOptions } from "paper-shaders-dist/shader-sizing.js";

const sizing = { u_fit: ShaderFitOptions.cover, u_scale: 1, u_rotation: 0, u_offsetX: 0, u_offsetY: 0, u_originX: 0.5, u_originY: 0.5, u_worldWidth: 0, u_worldHeight: 0 };
const rgba = (list) => list.map(getShaderColorFromString);
const CLEAR = [0, 0, 0, 0];
const GL_ALPHA = { alpha: true, premultipliedAlpha: true };

/* Paper's noise texture is a data-URI image; ShaderMount needs it decoded before mounting. */
const noise = getShaderNoiseTexture();
export const ready = noise.decode
	? noise.decode().catch(() => {})
	: new Promise((resolve) => {
			noise.onload = resolve;
	  });

const BRAND = ["#FF8F68", "#E25F4B", "#7E3550", "#FFC4A8", "#F2A65A"];
/* Ring tones by outcome (data-shader-state): warm for approved, muted and slow for not approved/withdrawn. */
const RING_TONE = {
	brand: { colors: BRAND, speed: 0.45 },
	approved: { colors: ["#FFC98C", "#FF8F68", "#F2A65A", "#7E3550", "#FFE3D3"], speed: 0.5 },
	muted: { colors: ["#D8C8CB", "#C9B6BC", "#E7DAD3", "#B9A3AE"], speed: 0.15 },
};

/* Border looks. `edge` is the distance in CSS px from the layer's edge to the ring (the layer bleeds past
   the card by that much in CSS, so the ring lands on the card's border and the glow falls outside it). */
const BORDER = {
	ring: { colors: BRAND, edge: 14, inset: 3, thickness: 0.012, softness: 0.4, intensity: 0.12, bloom: 0.1, spots: 4, spotSize: 0.5, pulse: 0.06, smoke: 0.05, smokeSize: 0.3, speed: 0.4, roundness: 0.08 },
	composer: { colors: BRAND, edge: 10, inset: 2, thickness: 0.04, softness: 0.5, intensity: 0.16, bloom: 0.15, spots: 4, spotSize: 0.5, pulse: 0.05, smoke: 0.06, smokeSize: 0.3, speed: 0.5, roundness: 0.3 },
	/* Thinking: thinner and smoother than v5, more spots so the light travels round instead of blinking. */
	pulse: { colors: ["#FFC4A8", "#FF8F68", "#E25F4B", "#7E3550", "#C9A3D8"], edge: 0, thickness: 0.06, softness: 0.9, intensity: 0.24, bloom: 0.3, spots: 4, spotSize: 0.5, pulse: 0.22, smoke: 0.22, smokeSize: 0.5, speed: 0.55, roundness: 1, square: true, margin: 0.16 },
};

function borderUniforms(p, el) {
	const w = Math.max(1, el.clientWidth);
	const h = Math.max(1, el.clientHeight);
	// The CSS bleed (a negative inset on the layer) is the distance from the layer's edge to the card's edge.
	const bleed = (Math.abs(parseFloat(getComputedStyle(el).top)) || p.edge) + (p.inset || 0);
	const mx = p.margin != null ? p.margin : bleed / w;
	const my = p.margin != null ? p.margin : bleed / h;
	return { u_marginLeft: mx, u_marginRight: mx, u_marginTop: my, u_marginBottom: my };
}

function border(el, name, opts) {
	const p = BORDER[name];
	const colors = rgba(p.colors);
	const m = new ShaderMount(
		el,
		pulsingBorderFragmentShader,
		{
			u_colorBack: CLEAR,
			u_colors: colors,
			u_colorsCount: colors.length,
			u_roundness: p.roundness,
			u_thickness: p.thickness,
			u_softness: p.softness,
			...borderUniforms(p, el),
			u_aspectRatio: p.square ? 1 : 0,
			u_intensity: p.intensity,
			u_bloom: p.bloom,
			u_spots: p.spots,
			u_spotSize: p.spotSize,
			u_pulse: p.pulse,
			u_smoke: p.smoke,
			u_smokeSize: p.smokeSize,
			u_noiseTexture: noise,
			...sizing,
		},
		GL_ALPHA,
		p.speed,
		opts.frame,
		1,
		opts.maxPixels,
	);
	return {
		dispose: () => m.dispose(),
		setMaxPixelCount: (n) => {
			m.setMaxPixelCount(n);
			m.setUniforms(borderUniforms(p, el));
		},
		setState: (state) => {
			if (name === "composer") {
				// Sending: the light travels faster and a little brighter while the answer is on its way.
				const sending = state === "sending";
				m.setUniforms({ u_intensity: sending ? 0.26 : p.intensity, u_pulse: sending ? 0.25 : p.pulse });
				m.setSpeed(sending ? 1.1 : p.speed);
				return;
			}
			if (name !== "ring") return;
			const tone = RING_TONE[state] || RING_TONE.brand;
			const next = rgba(tone.colors);
			m.setUniforms({ u_colors: next, u_colorsCount: next.length });
			m.setSpeed(tone.speed);
		},
	};
}

/* Voice orb: a soft smoke ring. Each state changes radius, thickness, colour weight and speed; the
   listening level (0..1, from the call's own speaker detection) breathes the ring outward a little. */
const VOICE = {
	idle: { radius: 0.26, thickness: 0.16, inner: 0.7, speed: 0.25, colors: ["#FFC4A8", "#FF8F68", "#E9C3CF"] },
	connecting: { radius: 0.23, thickness: 0.1, inner: 0.5, speed: 0.9, colors: ["#FFC4A8", "#FF8F68", "#C9A3B8"] },
	listening: { radius: 0.27, thickness: 0.2, inner: 0.8, speed: 0.5, colors: ["#FFE3D3", "#FF8F68", "#E25F4B", "#F2A65A"] },
	thinking: { radius: 0.24, thickness: 0.13, inner: 0.55, speed: 1.1, colors: ["#FFC4A8", "#E25F4B", "#7E3550", "#C9A3D8"] },
	speaking: { radius: 0.28, thickness: 0.24, inner: 1, speed: 0.75, colors: ["#FFE3D3", "#FF8F68", "#E25F4B", "#7E3550", "#F2A65A"] },
	muted: { radius: 0.24, thickness: 0.1, inner: 0.6, speed: 0.15, colors: ["#E7DAD3", "#D8C8CB", "#C9A3B8"] },
};

function voiceUniforms(state, level) {
	const v = VOICE[state] || VOICE.idle;
	const colors = rgba(v.colors);
	const lift = state === "listening" || state === "speaking" ? Math.min(1, Math.max(0, level || 0)) : 0;
	return {
		speed: v.speed + lift * 0.4,
		uniforms: {
			u_colors: colors,
			u_colorsCount: colors.length,
			u_radius: v.radius + lift * 0.03,
			u_thickness: v.thickness + lift * 0.08,
			u_innerShape: v.inner,
		},
	};
}

function voice(el, opts) {
	const first = voiceUniforms(opts.state || "idle", 0);
	const m = new ShaderMount(
		el,
		smokeRingFragmentShader,
		{ u_colorBack: CLEAR, ...first.uniforms, u_noiseScale: 1.8, u_noiseIterations: 3, u_noiseTexture: noise, ...sizing, u_scale: 1 },
		GL_ALPHA,
		first.speed,
		opts.frame,
		1,
		opts.maxPixels,
	);
	return {
		dispose: () => m.dispose(),
		setMaxPixelCount: (n) => m.setMaxPixelCount(n),
		setState: (state, level) => {
			const next = voiceUniforms(state, level);
			m.setUniforms(next.uniforms);
			m.setSpeed(next.speed);
		},
	};
}

/* Calm, neutral-warm and slow: the band shown while an application's checks are running. */
function calm(el, opts) {
	const colors = rgba(["#F6C9B3", "#E9C3CF", "#FFAE8C", "#C9A3B8"]);
	const m = new ShaderMount(
		el,
		grainGradientFragmentShader,
		{
			u_colorBack: getShaderColorFromString("#F7EFE7"),
			u_colors: colors,
			u_colorsCount: colors.length,
			u_softness: 0.85,
			u_intensity: 0.35,
			u_noise: 0.2,
			u_shape: GrainGradientShapes.wave,
			u_noiseTexture: noise,
			...sizing,
		},
		{ alpha: false, premultipliedAlpha: false },
		0.6,
		opts.frame,
		1,
		Math.min(opts.maxPixels, 120000),
	);
	return { dispose: () => m.dispose(), setMaxPixelCount: (n) => m.setMaxPixelCount(Math.min(n, 120000)), setState: () => {} };
}

/** Mount ring | pulse | composer | voice | calm into el. opts: { maxPixels, frame, state }. */
export function mount(el, name, opts = {}) {
	const o = { maxPixels: opts.maxPixels || 1280 * 720, frame: opts.frame || 0, state: opts.state };
	if (BORDER[name]) return border(el, name, o);
	if (name === "voice") return voice(el, o);
	return calm(el, o);
}
