#version 300 es
precision highp float;

uniform sampler2D u_input;
uniform float u_time;
uniform float u_vignette;

in vec2 v_uv;
out vec4 fragColor;

float rand(vec2 co) {
  return fract(sin(dot(co.xy, vec2(12.9898,78.233))) * 43758.5453);
}

void main() {
  float weave = (rand(vec2(floor(u_time), v_uv.y)) - 0.5) * 0.002;
  vec2 uv = vec2(v_uv.x + weave, v_uv.y + sin(u_time * 1.3) * 0.0015);
  vec3 base = texture(u_input, uv).rgb;
  vec2 offset = uv - 0.5;
  float vignette = smoothstep(0.9, 0.3, length(offset)) * u_vignette;
  vec3 color = mix(base, base * vignette, 0.6);
  fragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
}
