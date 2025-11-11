#version 300 es
precision highp float;

uniform sampler2D u_input;
uniform float u_time;
uniform float u_amount;
uniform float u_gate;

in vec2 v_uv;
out vec4 fragColor;

void main() {
  vec3 base = texture(u_input, v_uv).rgb;
  float pulse = smoothstep(0.0, 1.0, sin(u_time * 6.0) * 0.5 + 0.5);
  float haze = u_amount * 0.5 + pulse * 0.5 * u_amount;
  float gate = clamp(u_gate, 0.0, 1.0);
  vec3 crimson = mix(base, vec3(base.r + haze, base.g * 0.6, base.b * 0.6), gate);
  fragColor = vec4(clamp(crimson, 0.0, 1.0), 1.0);
}
