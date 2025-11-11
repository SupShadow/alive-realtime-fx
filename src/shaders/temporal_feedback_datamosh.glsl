#version 300 es
precision highp float;

uniform sampler2D u_input;
uniform sampler2D u_history;
uniform float u_feedback;

in vec2 v_uv;
out vec4 fragColor;

void main() {
  vec3 current = texture(u_input, v_uv).rgb;
  vec3 history = texture(u_history, v_uv).rgb;
  vec3 mixed = mix(current, history, u_feedback);
  fragColor = vec4(mixed, 1.0);
}
