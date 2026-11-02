/*
 * Saral hero shader: Paper Shaders mesh gradient (vanilla build), Apache-2.0,
 * https://github.com/paper-design/shaders  ("Powered by Paper Shaders: https://shaders.paper.design").
 *
 * Bundled to public/js/vendor/saral-shader.js by scripts/brand/build_shader.sh. Only ShaderMount and the
 * mesh-gradient fragment shader are included (tree-shaken). Loaded lazily by public/js/shader.js.
 * Paper's ShaderMount already pauses when the element is off-screen or the tab is hidden.
 */
import { ShaderMount, meshGradientFragmentShader, getShaderColorFromString, ShaderFitOptions } from "@paper-design/shaders";

/** Very soft warm palette: cream, peach and a hint of coral. Text never sits on top of it. */
const PALETTES = {
	warm: ["#F7F3EE", "#FCE6DC", "#F8D3C3", "#FDF1EA"],
	approved: ["#F7F3EE", "#FCE9DF", "#F6CDBD", "#EEF0E6"],
};

export function mount(el, name) {
	const colors = (PALETTES[name] || PALETTES.warm).map(getShaderColorFromString);
	const uniforms = {
		u_colors: colors,
		u_colorsCount: colors.length,
		u_distortion: 0.8,
		u_swirl: 0.12,
		u_grainMixer: 0,
		u_grainOverlay: 0,
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
	// speed 0.25: a slow drift. minPixelRatio 1 and a small pixel budget keep it cheap.
	return new ShaderMount(el, meshGradientFragmentShader, uniforms, { alpha: false, premultipliedAlpha: false }, 0.25, 0, 1, 640 * 480);
}
