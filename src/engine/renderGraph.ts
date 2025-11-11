import chromaticAberrationFrag from '../shaders/chromatic_aberration.glsl?raw';
import grayscaleSCurveFrag from '../shaders/grayscale_scurve.glsl?raw';
import filmGrainFrag from '../shaders/film_grain.glsl?raw';
import vignetteGateWeaveFrag from '../shaders/vignette_gateweave.glsl?raw';
import crimsonHazeFrag from '../shaders/crimson_haze_peak.glsl?raw';
import uvWarpFrag from '../shaders/uv_warp_reality_bend.glsl?raw';
import scanlineGlitchFrag from '../shaders/scanline_glitch.glsl?raw';
import temporalFeedbackFrag from '../shaders/temporal_feedback_datamosh.glsl?raw';
import bloomThresholdFrag from '../shaders/bloom_threshold.glsl?raw';
import { createFullscreenQuad, createGLContext, createProgram, createTexture, resizeTexture } from './glUtils';
import { FboPool, RenderTarget } from './fboPool';

const fullscreenVert = `#version 300 es\nlayout(location=0) in vec2 a_position;\nout vec2 v_uv;\nvoid main() {\n  v_uv = (a_position * 0.5) + 0.5;\n  gl_Position = vec4(a_position, 0.0, 1.0);\n}`;

export interface RenderParams {
  contrastK: number;
  blackClamp: number;
  gammaOut: number;
  grainIntensity: number;
  grainSize: number;
  vignette: number;
  crimsonGate: boolean;
  crimsonAmount: number;
  chromaAberration: number;
  recordSafe: boolean;
  freezeFrame: boolean;
  peakBoost: number;
}

export interface RenderContext {
  time: number;
  delta: number;
  audioPeak: number;
  audioRms: number;
}

interface Pass {
  program: WebGLProgram;
  uniformLocations: Record<string, WebGLUniformLocation | null>;
  draw: (input: WebGLTexture, target: RenderTarget | null, ctx: RenderContext, params: RenderParams) => WebGLTexture;
}

export class RenderGraph {
  private readonly canvas: HTMLCanvasElement;
  private readonly gl: WebGL2RenderingContext;
  private readonly quad: { vao: WebGLVertexArrayObject; buffer: WebGLBuffer };
  private readonly pool: FboPool;
  private readonly passes: Pass[] = [];
  private sourceVideo: HTMLVideoElement | null = null;
  private sourceTexture: WebGLTexture;
  private dimensions: [number, number] = [1280, 720];
  private crimsonLatch = 0;
  private ping: RenderTarget;
  private pong: RenderTarget;
  private enableAdvanced = false;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.gl = createGLContext(canvas);
    this.quad = createFullscreenQuad(this.gl);
    this.pool = new FboPool(this.gl);
    this.sourceTexture = createTexture(this.gl, this.dimensions[0], this.dimensions[1]);
    this.ping = this.pool.acquire(this.dimensions[0], this.dimensions[1]);
    this.pong = this.pool.acquire(this.dimensions[0], this.dimensions[1]);
    this.passes.push(
      this.createChromaticPass(),
      this.createGrayscalePass(),
      this.createFilmGrainPass(),
      this.createVignettePass(),
      this.createCrimsonPass()
    );
    if (this.enableAdvanced) {
      this.passes.push(
        this.createUvWarpPass(),
        this.createScanlinePass(),
        this.createTemporalFeedbackPass(),
        this.createBloomPass()
      );
    }
    this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, true);
  }

  setSource(video: HTMLVideoElement): void {
    this.sourceVideo = video;
  }

  resize(width: number, height: number, cssWidth = width, cssHeight = height): void {
    const [currentWidth, currentHeight] = this.dimensions;
    if (width === currentWidth && height === currentHeight) {
      if (this.canvas.style.width !== `${cssWidth}px` || this.canvas.style.height !== `${cssHeight}px`) {
        this.canvas.style.width = `${cssWidth}px`;
        this.canvas.style.height = `${cssHeight}px`;
      }
      return;
    }
    this.dimensions = [width, height];
    this.canvas.width = width;
    this.canvas.height = height;
    this.canvas.style.width = `${cssWidth}px`;
    this.canvas.style.height = `${cssHeight}px`;
    resizeTexture(this.gl, this.sourceTexture, width, height);
    for (const target of [this.ping, this.pong]) {
      if (target.width !== width || target.height !== height) {
        this.pool.resize(target, width, height);
      }
    }
  }

  render(params: RenderParams, ctx: RenderContext): void {
    if (!this.sourceVideo || this.sourceVideo.readyState < 2) {
      return;
    }
    const gl = this.gl;
    const [width, height] = this.dimensions;
    if (!params.freezeFrame) {
      gl.bindTexture(gl.TEXTURE_2D, this.sourceTexture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.sourceVideo);
      gl.bindTexture(gl.TEXTURE_2D, null);
    }

    gl.viewport(0, 0, width, height);
    gl.bindVertexArray(this.quad.vao);

    let readTexture = this.sourceTexture;
    let writeTarget = this.ping;
    for (let i = 0; i < this.passes.length; i++) {
      const pass = this.passes[i];
      const isLast = i === this.passes.length - 1;
      if (!isLast) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, writeTarget.framebuffer);
        gl.viewport(0, 0, width, height);
      } else {
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, this.canvas.width, this.canvas.height);
      }
      readTexture = pass.draw(readTexture, isLast ? null : writeTarget, ctx, params);
      if (!isLast) {
        writeTarget = writeTarget === this.ping ? this.pong : this.ping;
      }
    }
    gl.bindVertexArray(null);
  }

  destroy(): void {
    const gl = this.gl;
    this.pool.destroy();

    for (const pass of this.passes) {
      gl.deleteProgram(pass.program);
    }

    for (const target of [this.ping, this.pong]) {
      if (target.framebuffer) {
        gl.deleteFramebuffer(target.framebuffer);
      }
      gl.deleteTexture(target.texture);
    }

    gl.deleteTexture(this.sourceTexture);
    gl.deleteVertexArray(this.quad.vao);
    gl.deleteBuffer(this.quad.buffer);
  }

  private bindInputTexture(gl: WebGL2RenderingContext, program: WebGLProgram, texture: WebGLTexture): void {
    gl.useProgram(program);
    const loc = gl.getUniformLocation(program, 'u_input');
    if (loc) {
      gl.uniform1i(loc, 0);
    }
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
  }

  private createChromaticPass(): Pass {
    const gl = this.gl;
    const program = createProgram(gl, fullscreenVert, chromaticAberrationFrag);
    const uniformLocations = {
      u_intensity: gl.getUniformLocation(program, 'u_intensity'),
      u_resolution: gl.getUniformLocation(program, 'u_resolution')
    };
    return {
      program,
      uniformLocations,
      draw: (input, target, _ctx, params) => {
        this.bindInputTexture(gl, program, input);
        if (uniformLocations.u_resolution) {
          gl.uniform2f(uniformLocations.u_resolution, this.dimensions[0], this.dimensions[1]);
        }
        if (uniformLocations.u_intensity) {
          gl.uniform1f(uniformLocations.u_intensity, params.chromaAberration);
        }
        gl.drawArrays(gl.TRIANGLES, 0, 3);
        gl.bindTexture(gl.TEXTURE_2D, null);
        return target ? target.texture : input;
      }
    };
  }

  private createGrayscalePass(): Pass {
    const gl = this.gl;
    const program = createProgram(gl, fullscreenVert, grayscaleSCurveFrag);
    const uniformLocations = {
      u_contrastK: gl.getUniformLocation(program, 'u_contrastK'),
      u_blackClamp: gl.getUniformLocation(program, 'u_blackClamp'),
      u_gammaOut: gl.getUniformLocation(program, 'u_gammaOut')
    };
    return {
      program,
      uniformLocations,
      draw: (input, target, _ctx, params) => {
        this.bindInputTexture(gl, program, input);
        if (uniformLocations.u_contrastK) gl.uniform1f(uniformLocations.u_contrastK, params.contrastK);
        if (uniformLocations.u_blackClamp) gl.uniform1f(uniformLocations.u_blackClamp, params.blackClamp);
        if (uniformLocations.u_gammaOut) gl.uniform1f(uniformLocations.u_gammaOut, params.gammaOut);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
        gl.bindTexture(gl.TEXTURE_2D, null);
        return target ? target.texture : input;
      }
    };
  }

  private createFilmGrainPass(): Pass {
    const gl = this.gl;
    const program = createProgram(gl, fullscreenVert, filmGrainFrag);
    const uniformLocations = {
      u_time: gl.getUniformLocation(program, 'u_time'),
      u_grainIntensity: gl.getUniformLocation(program, 'u_grainIntensity'),
      u_grainSize: gl.getUniformLocation(program, 'u_grainSize')
    };
    return {
      program,
      uniformLocations,
      draw: (input, target, ctx, params) => {
        this.bindInputTexture(gl, program, input);
        if (uniformLocations.u_time) gl.uniform1f(uniformLocations.u_time, ctx.time * 0.001);
        if (uniformLocations.u_grainIntensity) gl.uniform1f(uniformLocations.u_grainIntensity, params.grainIntensity);
        if (uniformLocations.u_grainSize) gl.uniform1f(uniformLocations.u_grainSize, params.grainSize);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
        gl.bindTexture(gl.TEXTURE_2D, null);
        return target ? target.texture : input;
      }
    };
  }

  private createVignettePass(): Pass {
    const gl = this.gl;
    const program = createProgram(gl, fullscreenVert, vignetteGateWeaveFrag);
    const uniformLocations = {
      u_time: gl.getUniformLocation(program, 'u_time'),
      u_vignette: gl.getUniformLocation(program, 'u_vignette')
    };
    return {
      program,
      uniformLocations,
      draw: (input, target, ctx, params) => {
        this.bindInputTexture(gl, program, input);
        if (uniformLocations.u_time) gl.uniform1f(uniformLocations.u_time, ctx.time * 0.001);
        if (uniformLocations.u_vignette) gl.uniform1f(uniformLocations.u_vignette, params.vignette);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
        gl.bindTexture(gl.TEXTURE_2D, null);
        return target ? target.texture : input;
      }
    };
  }

  private createCrimsonPass(): Pass {
    const gl = this.gl;
    const program = createProgram(gl, fullscreenVert, crimsonHazeFrag);
    const uniformLocations = {
      u_time: gl.getUniformLocation(program, 'u_time'),
      u_amount: gl.getUniformLocation(program, 'u_amount'),
      u_gate: gl.getUniformLocation(program, 'u_gate')
    };
    return {
      program,
      uniformLocations,
      draw: (input, target, ctx, params) => {
        const active = params.crimsonGate && this.shouldLatchCrimson(ctx, params);
        this.bindInputTexture(gl, program, input);
        if (uniformLocations.u_time) gl.uniform1f(uniformLocations.u_time, ctx.time * 0.001);
        if (uniformLocations.u_amount) gl.uniform1f(uniformLocations.u_amount, params.crimsonAmount + params.peakBoost);
        if (uniformLocations.u_gate) gl.uniform1f(uniformLocations.u_gate, active ? 1 : 0);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
        gl.bindTexture(gl.TEXTURE_2D, null);
        if (!active) {
          this.crimsonLatch = Math.max(0, this.crimsonLatch - 1);
        }
        return target ? target.texture : input;
      }
    };
  }

  private createUvWarpPass(): Pass {
    const gl = this.gl;
    const program = createProgram(gl, fullscreenVert, uvWarpFrag);
    return {
      program,
      uniformLocations: {},
      draw: (input) => {
        this.bindInputTexture(gl, program, input);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
        gl.bindTexture(gl.TEXTURE_2D, null);
        return input;
      }
    };
  }

  private createScanlinePass(): Pass {
    const gl = this.gl;
    const program = createProgram(gl, fullscreenVert, scanlineGlitchFrag);
    return {
      program,
      uniformLocations: {},
      draw: (input) => {
        this.bindInputTexture(gl, program, input);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
        gl.bindTexture(gl.TEXTURE_2D, null);
        return input;
      }
    };
  }

  private createTemporalFeedbackPass(): Pass {
    const gl = this.gl;
    const program = createProgram(gl, fullscreenVert, temporalFeedbackFrag);
    return {
      program,
      uniformLocations: {},
      draw: (input) => {
        this.bindInputTexture(gl, program, input);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
        gl.bindTexture(gl.TEXTURE_2D, null);
        return input;
      }
    };
  }

  private createBloomPass(): Pass {
    const gl = this.gl;
    const program = createProgram(gl, fullscreenVert, bloomThresholdFrag);
    return {
      program,
      uniformLocations: {},
      draw: (input) => {
        this.bindInputTexture(gl, program, input);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
        gl.bindTexture(gl.TEXTURE_2D, null);
        return input;
      }
    };
  }

  private shouldLatchCrimson(ctx: RenderContext, params: RenderParams): boolean {
    const gate = ctx.audioPeak > 0.35 || ctx.audioRms > 0.2;
    const randomGate = Math.random() < 0.08;
    const shouldTrigger = gate || randomGate || params.peakBoost > 0.01;
    if (shouldTrigger) {
      this.crimsonLatch = Math.floor(3 + Math.random() * 4);
      return true;
    }
    if (this.crimsonLatch > 0) {
      this.crimsonLatch--;
      return true;
    }
    return false;
  }
}
