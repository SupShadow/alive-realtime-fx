#version 300 es
precision highp float;

vec3 applyCurve(vec3 color, float contrastK, float blackClamp, float gammaOut) {
  color = max(color - blackClamp, 0.0);
  color = 1.0 / (1.0 + exp(-contrastK * (color - 0.5)));
  color = pow(color, vec3(gammaOut));
  return color;
}

float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 345.45));
  p += dot(p, p + 34.345);
  return fract(p.x * p.y);
}

float blueNoise(vec2 uv, float time) {
  return hash21(uv * 1024.0 + time);
}
