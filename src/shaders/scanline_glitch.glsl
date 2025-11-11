#version 300 es
precision highp float;

uniform sampler2D u_input;
uniform float u_time;

in vec2 v_uv;
out vec4 fragColor;

float noise(vec2 uv) {
  return fract(sin(dot(uv, vec2(12.9898,78.233))) * 43758.5453);
}

void main() {
  float scan = sin(v_uv.y * 1080.0 + u_time * 6.0) * 0.03;
  float glitch = step(0.97, noise(vec2(v_uv.y, floor(u_time)))) * 0.2;
  vec2 offset = vec2(scan + glitch, 0.0);
  fragColor = texture(u_input, v_uv + offset);
}
