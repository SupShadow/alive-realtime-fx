import { sampleJitterOffset } from '../shaders/frame_jitter_policy';

export type FrameCallback = (time: number, delta: number) => void;

export class FrameScheduler {
  private rafId: number | null = null;
  private lastTime = 0;
  private running = false;
  private safeMode = false;
  private degradeStep = 0;
  private callback: FrameCallback | null = null;
  private skipped = 0;

  start(cb: FrameCallback): void {
    this.callback = cb;
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    const loop = (time: number) => {
      if (!this.running || !this.callback) return;
      const delta = time - this.lastTime;
      if (!this.safeMode) {
        this.analyse(delta);
      }
      const maxSkip = this.safeMode ? 0 : this.degradeStep;
      if (this.skipped < maxSkip) {
        this.skipped++;
      } else {
        this.skipped = 0;
        const jitter = this.safeMode ? 0 : sampleJitterOffset(this.degradeStep);
        this.callback(time + jitter, delta);
        this.lastTime = time;
      }
      this.rafId = window.requestAnimationFrame(loop);
    };
    this.rafId = window.requestAnimationFrame(loop);
  }

  stop(): void {
    this.running = false;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  setSafeMode(enabled: boolean): void {
    this.safeMode = enabled;
    if (enabled) {
      this.degradeStep = 0;
      this.skipped = 0;
    }
  }

  getDegradeLevel(): number {
    return this.degradeStep;
  }

  private analyse(delta: number): void {
    if (delta > 26) {
      this.degradeStep = Math.min(2, this.degradeStep + 1);
    } else if (delta < 18 && this.degradeStep > 0) {
      this.degradeStep -= 1;
    }
  }
}
