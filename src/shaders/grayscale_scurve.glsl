#version 300 es
precision highp float;

uniform sampler2D u_input;
uniform float u_contrastK;
uniform float u_blackClamp;
uniform float u_gammaOut;

in vec2 v_uv;
out vec4 fragColor;

void main() {
  vec3 color = texture(u_input, v_uv).rgb;
  float luminance = dot(color, vec3(0.299, 0.587, 0.114));
  float clamped = max(luminance - u_blackClamp, 0.0);
  float logistic = 1.0 / (1.0 + exp(-u_contrastK * (clamped - 0.5)));
  float curved = pow(logistic, u_gammaOut);
  fragColor = vec4(vec3(curved), 1.0);
}
