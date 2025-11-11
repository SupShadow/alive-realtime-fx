#version 300 es
precision highp float;

uniform sampler2D u_input;
uniform float u_threshold;
uniform float u_intensity;

in vec2 v_uv;
out vec4 fragColor;

void main() {
  vec3 color = texture(u_input, v_uv).rgb;
  float lum = dot(color, vec3(0.299, 0.587, 0.114));
  float gate = smoothstep(u_threshold, 1.0, lum);
  vec3 bloom = color * gate * u_intensity;
  fragColor = vec4(bloom, 1.0);
}
