export interface AudioEnvelope {
  peak: number;
  rms: number;
}

export class AudioBus {
  private context: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private dataArray: Float32Array | null = null;
  private microphone: MediaStreamAudioSourceNode | null = null;
  private fileSource: AudioBufferSourceNode | null = null;
  private gain: GainNode | null = null;
  private monitorGain: GainNode | null = null;
  private destination: MediaStreamAudioDestinationNode | null = null;

  async ensureContext(): Promise<AudioContext> {
    if (!this.context) {
      this.context = new AudioContext();
      this.gain = this.context.createGain();
      this.gain.gain.value = 1.0;
      this.monitorGain = this.context.createGain();
      this.monitorGain.gain.value = 0.3;
      this.destination = this.context.createMediaStreamDestination();
      this.analyser = this.context.createAnalyser();
      this.analyser.fftSize = 1024;
      this.analyser.smoothingTimeConstant = 0.7;
      this.dataArray = new Float32Array(this.analyser.fftSize);
      this.gain.connect(this.analyser);
      this.analyser.connect(this.destination);
      this.gain.connect(this.monitorGain);
      this.monitorGain.connect(this.context.destination);
    }
    return this.context;
  }

  async connectMicrophone(stream: MediaStream): Promise<void> {
    const ctx = await this.ensureContext();
    this.disconnectFile();
    this.disconnectMicrophone();
    this.microphone = ctx.createMediaStreamSource(stream);
    this.microphone.connect(this.gain!);
  }

  disconnectMicrophone(): void {
    if (!this.microphone) {
      return;
    }
    try {
      this.microphone.disconnect();
    } catch (e) {
      // ignore disconnect errors
    }
    const stream = this.microphone.mediaStream;
    stream
      .getAudioTracks()
      .forEach((track) => {
        if (track.readyState !== 'ended') {
          track.stop();
        }
      });
    this.microphone = null;
  }

  async connectFile(file: File): Promise<void> {
    const ctx = await this.ensureContext();
    const arrayBuffer = await file.arrayBuffer();
    const buffer = await ctx.decodeAudioData(arrayBuffer.slice(0));
    this.disconnectFile();
    this.fileSource = ctx.createBufferSource();
    this.fileSource.buffer = buffer;
    this.fileSource.loop = true;
    this.fileSource.connect(this.gain!);
    this.fileSource.start(0);
  }

  disconnectFile(): void {
    if (this.fileSource) {
      try {
        this.fileSource.stop();
      } catch (e) {
        // ignore stop errors
      }
      this.fileSource.disconnect();
      this.fileSource = null;
    }
  }

  getEnvelope(): AudioEnvelope {
    if (!this.analyser || !this.dataArray) {
      return { peak: 0, rms: 0 };
    }
    this.analyser.getFloatTimeDomainData(this.dataArray);
    let peak = 0;
    let sum = 0;
    for (let i = 0; i < this.dataArray.length; i++) {
      const sample = this.dataArray[i];
      peak = Math.max(peak, Math.abs(sample));
      sum += sample * sample;
    }
    const rms = Math.sqrt(sum / this.dataArray.length);
    return { peak, rms };
  }

  getMediaStream(): MediaStream | null {
    return this.destination?.stream ?? null;
  }
}
