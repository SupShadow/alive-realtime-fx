#version 300 es
precision highp float;

uniform sampler2D u_input;
uniform vec2 u_resolution;
uniform float u_intensity;

in vec2 v_uv;
out vec4 fragColor;

void main() {
  vec2 center = vec2(0.5);
  vec2 dir = v_uv - center;
  float strength = u_intensity / max(u_resolution.x, u_resolution.y);
  vec2 offset = dir * strength * 60.0;
  float r = texture(u_input, v_uv + offset).r;
  float g = texture(u_input, v_uv).g;
  float b = texture(u_input, v_uv - offset).b;
  fragColor = vec4(r, g, b, 1.0);
}
