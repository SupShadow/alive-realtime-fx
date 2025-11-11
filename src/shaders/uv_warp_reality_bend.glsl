#version 300 es
precision highp float;

uniform sampler2D u_input;
uniform float u_time;
uniform float u_envelope;

in vec2 v_uv;
out vec4 fragColor;

void main() {
  vec2 center = v_uv - 0.5;
  float wave = sin(length(center) * 12.0 - u_time * 2.0) * 0.002 * u_envelope;
  vec2 warped = v_uv + normalize(center + 0.0001) * wave;
  fragColor = texture(u_input, warped);
}
