#version 300 es
precision highp float;

uniform sampler2D u_input;
uniform float u_time;
uniform float u_grainIntensity;
uniform float u_grainSize;

in vec2 v_uv;
out vec4 fragColor;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

void main() {
  vec3 base = texture(u_input, v_uv).rgb;
  vec2 grainUv = v_uv * u_grainSize + vec2(u_time * 17.0, u_time * 29.0);
  float grain = hash(floor(grainUv * 512.0)) - 0.5;
  vec3 noisy = base + grain * u_grainIntensity;
  fragColor = vec4(clamp(noisy, 0.0, 1.0), 1.0);
}
