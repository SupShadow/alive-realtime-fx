import { createTexture, resizeTexture } from './glUtils';

export interface RenderTarget {
  framebuffer: WebGLFramebuffer | null;
  texture: WebGLTexture;
  width: number;
  height: number;
}

export class FboPool {
  private readonly gl: WebGL2RenderingContext;
  private readonly pool: RenderTarget[] = [];

  constructor(gl: WebGL2RenderingContext) {
    this.gl = gl;
  }

  acquire(width: number, height: number): RenderTarget {
    const existing = this.pool.find((target) => target.width === width && target.height === height);
    if (existing) {
      this.pool.splice(this.pool.indexOf(existing), 1);
      return existing;
    }
    const texture = createTexture(this.gl, width, height);
    const framebuffer = this.gl.createFramebuffer();
    if (!framebuffer) {
      throw new Error('Unable to create framebuffer.');
    }
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, framebuffer);
    this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0, this.gl.TEXTURE_2D, texture, 0);
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
    return { framebuffer, texture, width, height };
  }

  release(target: RenderTarget): void {
    if (!this.pool.includes(target)) {
      this.pool.push(target);
    }
  }

  resize(target: RenderTarget, width: number, height: number): void {
    resizeTexture(this.gl, target.texture, width, height);
    target.width = width;
    target.height = height;
  }

  destroy(): void {
    for (const target of this.pool) {
      if (target.framebuffer) {
        this.gl.deleteFramebuffer(target.framebuffer);
      }
      this.gl.deleteTexture(target.texture);
    }
    this.pool.length = 0;
  }
}
