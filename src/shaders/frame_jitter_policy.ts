export function sampleJitterOffset(level: number): number {
  if (level <= 0) return 0;
  const amplitude = level === 1 ? 0.8 : 1.6;
  return (Math.random() - 0.5) * amplitude;
}
