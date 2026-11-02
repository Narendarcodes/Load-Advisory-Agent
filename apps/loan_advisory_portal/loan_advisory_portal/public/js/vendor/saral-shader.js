/* Saral shaders. Paper Shaders (c) 2026 Paper, Apache-2.0, https://shaders.paper.design */
import{a as n,b as c,c as u,d as f,f as v,k as g}from"./saral-chunk-VO66JKRS.js";var m={maxColorCount:10},d=`#version 300 es
precision mediump float;

uniform float u_time;

uniform vec4 u_colors[${m.maxColorCount}];
uniform float u_colorsCount;

uniform float u_distortion;
uniform float u_swirl;
uniform float u_grainMixer;
uniform float u_grainOverlay;

in vec2 v_objectUV;
out vec4 fragColor;

${u}
${f}
${v}

float valueNoise(vec2 st) {
  vec2 i = floor(st);
  vec2 f = fract(st);
  float a = hash21(i);
  float b = hash21(i + vec2(1.0, 0.0));
  float c = hash21(i + vec2(0.0, 1.0));
  float d = hash21(i + vec2(1.0, 1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  float x1 = mix(a, b, u.x);
  float x2 = mix(c, d, u.x);
  return mix(x1, x2, u.y);
}

float noise(vec2 n, vec2 seedOffset) {
  return valueNoise(n + seedOffset);
}

vec2 getPosition(int i, float t) {
  float a = float(i) * .37;
  float b = .6 + fract(float(i) / 3.) * .9;
  float c = .8 + fract(float(i + 1) / 4.);

  float x = sin(t * b + a);
  float y = cos(t * c + a * 1.5);

  return .5 + .5 * vec2(x, y);
}

void main() {
  vec2 uv = v_objectUV;
  uv += .5;
  vec2 grainUV = uv * 1000.;

  float mixerGrain = 0.;
  if (u_grainMixer > 0.) {
    mixerGrain = .4 * u_grainMixer * (noise(grainUV, vec2(0.)) - .5);
  }

  const float firstFrameOffset = 41.5;
  float t = .5 * (u_time + firstFrameOffset);

  float radius = smoothstep(0., 1., length(uv - .5));
  float center = 1. - radius;
  for (float i = 1.; i <= 2.; i++) {
    uv.x += u_distortion * center / i * sin(t + i * .4 * smoothstep(.0, 1., uv.y)) * cos(.2 * t + i * 2.4 * smoothstep(.0, 1., uv.y));
    uv.y += u_distortion * center / i * cos(t + i * 2. * smoothstep(.0, 1., uv.x));
  }

  vec2 uvRotated = uv;
  uvRotated -= vec2(.5);
  float angle = 3. * u_swirl * radius;
  uvRotated = rotate(uvRotated, -angle);
  uvRotated += vec2(.5);

  vec3 color = vec3(0.);
  float opacity = 0.;
  float totalWeight = 0.;

  for (int i = 0; i < ${m.maxColorCount}; i++) {
    if (i >= int(u_colorsCount)) break;

    vec2 pos = getPosition(i, t) + mixerGrain;
    vec3 colorFraction = u_colors[i].rgb * u_colors[i].a;
    float opacityFraction = u_colors[i].a;

    float dist = length(uvRotated - pos);

    dist = pow(dist, 3.5);
    float weight = 1. / (dist + 1e-3);
    color += colorFraction * weight;
    opacity += opacityFraction * weight;
    totalWeight += weight;
  }

  color /= max(1e-4, totalWeight);
  opacity /= max(1e-4, totalWeight);

  if (u_grainOverlay > 0.) {
    float grainOverlay = valueNoise(rotate(grainUV, 1.) + vec2(3.));
    grainOverlay = mix(grainOverlay, valueNoise(rotate(grainUV, 2.) + vec2(-1.)), .5);
    grainOverlay = pow(grainOverlay, 1.3);

    float grainOverlayV = grainOverlay * 2. - 1.;
    vec3 grainOverlayColor = vec3(step(0., grainOverlayV));
    float grainOverlayStrength = u_grainOverlay * abs(grainOverlayV);
    grainOverlayStrength = pow(grainOverlayStrength, .8);
    color = mix(color, grainOverlayColor, .35 * grainOverlayStrength);

    opacity += .5 * grainOverlayStrength;
  }
  opacity = clamp(opacity, 0., 1.);

  fragColor = vec4(color, opacity);
}
`;var F={u_fit:c.cover,u_scale:1,u_rotation:0,u_offsetX:0,u_offsetY:0,u_originX:.5,u_originY:.5,u_worldWidth:0,u_worldHeight:0},h=t=>t.map(g),p={wash:{colors:["#F7F3EE","#FCE9DE","#F7F3EE","#F6EEF1","#FAEEE2"],distortion:.9,swirl:.35,grain:.03,speed:.1,scale:.75,pixels:22e4},band:{colors:["#FFB089","#FF8F68","#E25F4B","#7E3550","#FFC4A8"],distortion:.9,swirl:.6,grain:.08,speed:.32,scale:1.4,pixels:9e4},loading:{colors:["#FFD9C4","#FF8F68","#E25F4B","#F2A65A","#7E3550"],distortion:1,swirl:.8,grain:.06,speed:.7,scale:1.2,pixels:9e4},orb:{colors:["#FFE3D3","#FFB089","#FF8F68","#E25F4B","#6A2C52","#C9A3D8"],distortion:1,swirl:.85,grain:0,speed:.34,scale:.9},stream:{colors:["#FFC4A8","#FF8F68","#E25F4B","#7E3550","#FFE3D3"],distortion:1,swirl:.9,grain:0,speed:.9,scale:1.6,pixels:3e4}};function _(t){return{dispose:()=>t.dispose(),setMaxPixelCount:i=>t.setMaxPixelCount(i),setState:()=>{}}}function S(t,i,e={}){let o=p[i]||p.wash,x=o.pixels?Math.min(o.pixels,e.maxPixels||o.pixels):e.maxPixels||1280*720,a=h(o.colors),r=new n(t,d,{u_colors:a,u_colorsCount:a.length,u_distortion:o.distortion,u_swirl:o.swirl,u_grainMixer:0,u_grainOverlay:o.grain,...F,u_scale:o.scale||1},{alpha:!1,premultipliedAlpha:!1},o.speed,e.frame||0,1,x),l=_(r);return l.setMaxPixelCount=s=>r.setMaxPixelCount(o.pixels?Math.min(o.pixels,s):s),l}export{S as mount};
