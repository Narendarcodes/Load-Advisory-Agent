/*
 * Saral shaders, extra chunk: Paper Shaders GrainGradient ("calm") and PulsingBorder ("pulse"), Apache-2.0,
 * https://shaders.paper.design. These need Paper's noise texture, so they load only on pages that show them.
 */
import { ShaderMount } from "paper-shaders-dist/shader-mount.js";
import { grainGradientFragmentShader, GrainGradientShapes } from "paper-shaders-dist/shaders/grain-gradient.js";
import { pulsingBorderFragmentShader } from "paper-shaders-dist/shaders/pulsing-border.js";
import { getShaderNoiseTexture } from "paper-shaders-dist/get-shader-noise-texture.js";
import { getShaderColorFromString } from "paper-shaders-dist/get-shader-color-from-string.js";
import { ShaderFitOptions } from "paper-shaders-dist/shader-sizing.js";

const sizing = { u_fit: ShaderFitOptions.cover, u_scale: 1, u_rotation: 0, u_offsetX: 0, u_offsetY: 0, u_originX: 0.5, u_originY: 0.5, u_worldWidth: 0, u_worldHeight: 0 };
const rgba = (list) => list.map(getShaderColorFromString);

/* Paper's noise texture is a data-URI image; ShaderMount needs it decoded before mounting. */
const noise = getShaderNoiseTexture();
export const ready = noise.decode
	? noise.decode().catch(() => {})
	: new Promise((resolve) => {
			noise.onload = resolve;
	  });

/* Calm, neutral-warm and slow: shown while an application is submitted or its checks are running. */
function calm(el, opts) {
	const colors = rgba(["#F6C9B3", "#E9C3CF", "#FFAE8C", "#C9A3B8"]);
	return new ShaderMount(
		el,
		grainGradientFragmentShader,
		{
			u_colorBack: getShaderColorFromString("#F7EFE7"),
			u_colors: colors,
			u_colorsCount: colors.length,
			u_softness: 0.85,
			u_intensity: 0.3,
			u_noise: 0.22,
			u_shape: GrainGradientShapes.wave,
			u_noiseTexture: noise,
			...sizing,
		},
		{ alpha: false, premultipliedAlpha: false },
		0.55,
		opts.frame,
		1,
		opts.maxPixels,
	);
}

/* A soft pulsing ring for the assistant thinking state. Transparent outside the ring. */
function pulse(el, opts) {
	const colors = rgba(["#FF8F68", "#E25F4B", "#7E3550", "#FFC4A8"]);
	return new ShaderMount(
		el,
		pulsingBorderFragmentShader,
		{
			u_colorBack: [0, 0, 0, 0],
			u_colors: colors,
			u_colorsCount: colors.length,
			u_roundness: 1,
			u_thickness: 0.12,
			u_softness: 0.8,
			u_marginLeft: 0.12,
			u_marginRight: 0.12,
			u_marginTop: 0.12,
			u_marginBottom: 0.12,
			u_aspectRatio: 1,
			u_intensity: 0.3,
			u_bloom: 0.3,
			u_spots: 3,
			u_spotSize: 0.45,
			u_pulse: 0.35,
			u_smoke: 0.35,
			u_smokeSize: 0.55,
			u_noiseTexture: noise,
			...sizing,
		},
		{ alpha: true, premultipliedAlpha: true },
		0.8,
		opts.frame,
		1,
		opts.maxPixels,
	);
}

/** Mount "calm" (GrainGradient) or "pulse" (PulsingBorder) into el. */
export function mount(el, name, opts = {}) {
	const o = { maxPixels: opts.maxPixels || 1280 * 720, frame: opts.frame || 0 };
	return name === "pulse" ? pulse(el, o) : calm(el, o);
}
