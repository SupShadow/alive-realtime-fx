import React, { useCallback, useEffect, useRef, useState } from 'react';
import Hud from './ui/Hud';
import SafeGuides, { SafeGuideMode } from './ui/SafeGuides';
import { RenderGraph, RenderParams } from './engine/renderGraph';
import { FrameScheduler } from './engine/scheduler';
import { AudioBus } from './engine/audioBus';

const defaultParams: RenderParams = {
  contrastK: 8.0,
  blackClamp: 0.03,
  gammaOut: 1.05,
  grainIntensity: 0.18,
  grainSize: 1.3,
  vignette: 0.75,
  crimsonGate: true,
  crimsonAmount: 0.4,
  chromaAberration: 0.006,
  recordSafe: false,
  freezeFrame: false,
  peakBoost: 0
};

const App: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const renderGraphRef = useRef<RenderGraph | null>(null);
  const schedulerRef = useRef<FrameScheduler | null>(null);
  const audioBusRef = useRef<AudioBus>(new AudioBus());
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const lastVideoUrlRef = useRef<string | null>(null);
  const paramsRef = useRef<RenderParams>(defaultParams);
  const peakBoostRef = useRef(0);
  const recordingRef = useRef(false);

  const [params, setParams] = useState<RenderParams>(defaultParams);
  const [safeMode, setSafeMode] = useState(false);
  const [safeGuide, setSafeGuide] = useState<SafeGuideMode>('16:9');
  const [isRecording, setIsRecording] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [envelope, setEnvelope] = useState({ peak: 0, rms: 0 });
  const [degradeLevel, setDegradeLevel] = useState(0);

  useEffect(() => {
    paramsRef.current = params;
  }, [params]);

  useEffect(() => {
    const video = document.createElement('video');
    video.autoplay = true;
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    videoRef.current = video;
  }, []);

  const updateSchedulerSafety = useCallback(() => {
    const scheduler = schedulerRef.current;
    if (!scheduler) return;
    scheduler.setSafeMode(safeMode || paramsRef.current.recordSafe || recordingRef.current);
  }, [safeMode]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;
    const graph = new RenderGraph(canvas);
    graph.setSource(video);
    renderGraphRef.current = graph;

    const scheduler = new FrameScheduler();
    schedulerRef.current = scheduler;
    updateSchedulerSafety();

    scheduler.start((time, delta) => {
      const targetCanvas = canvasRef.current;
      const currentGraph = renderGraphRef.current;
      if (!targetCanvas || !currentGraph) return;
      const env = audioBusRef.current.getEnvelope();
      setEnvelope((prev) => {
        if (Math.abs(prev.peak - env.peak) > 0.01 || Math.abs(prev.rms - env.rms) > 0.01) {
          return env;
        }
        return prev;
      });
      const degrade = scheduler.getDegradeLevel();
      setDegradeLevel((prev) => (prev !== degrade ? degrade : prev));
      const width = targetCanvas.clientWidth || targetCanvas.width;
      const height = targetCanvas.clientHeight || targetCanvas.height;
      const scale = degrade === 0 ? 1 : degrade === 1 ? 0.75 : 0.5;
      const renderWidth = Math.max(320, Math.floor(width * scale));
      const renderHeight = Math.max(180, Math.floor(height * scale));
      currentGraph.resize(renderWidth, renderHeight);
      const activeParams: RenderParams = {
        ...paramsRef.current,
        peakBoost: paramsRef.current.peakBoost + peakBoostRef.current
      };
      if (isRecording || activeParams.recordSafe) {
        activeParams.freezeFrame = false;
      }
      currentGraph.render(activeParams, {
        time,
        delta,
        audioPeak: env.peak,
        audioRms: env.rms
      });
      peakBoostRef.current = Math.max(0, peakBoostRef.current - 0.02);
    });

    return () => {
      scheduler.stop();
      renderGraphRef.current?.destroy();
      renderGraphRef.current = null;
    };
  }, [updateSchedulerSafety]);

  useEffect(() => {
    updateSchedulerSafety();
  }, [safeMode, params.recordSafe, updateSchedulerSafety]);

  useEffect(() => {
    recordingRef.current = isRecording;
    updateSchedulerSafety();
  }, [isRecording, updateSchedulerSafety]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.repeat) return;
      if (event.key === 'r' || event.key === 'R') {
        setParams((prev) => ({ ...prev, crimsonGate: !prev.crimsonGate }));
      } else if (event.key === 'f' || event.key === 'F') {
        setParams((prev) => ({ ...prev, freezeFrame: !prev.freezeFrame }));
      } else if (event.key === 'p' || event.key === 'P') {
        peakBoostRef.current = 0.6;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const stopCurrentStream = () => {
    mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    mediaStreamRef.current = null;
    setCameraActive(false);
  };

  const handleCameraStart = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 1920, height: 1080 }, audio: true });
      const video = videoRef.current;
      if (!video) return;
      video.srcObject = stream;
      await video.play().catch(() => undefined);
      mediaStreamRef.current = stream;
      setCameraActive(true);
      await audioBusRef.current.connectMicrophone(stream);
      renderGraphRef.current?.setSource(video);
    } catch (error) {
      console.error('Camera start failed', error);
    }
  }, []);

  const handleCameraStop = useCallback(() => {
    stopCurrentStream();
    const video = videoRef.current;
    if (video) {
      video.srcObject = null;
      video.pause();
    }
  }, []);

  const handleVideoFile = useCallback((file: File) => {
    stopCurrentStream();
    const url = URL.createObjectURL(file);
    if (lastVideoUrlRef.current) {
      URL.revokeObjectURL(lastVideoUrlRef.current);
    }
    lastVideoUrlRef.current = url;
    const video = videoRef.current;
    if (!video) return;
    video.srcObject = null;
    video.src = url;
    video.loop = true;
    video.play().catch(() => undefined);
    renderGraphRef.current?.setSource(video);
  }, []);

  const handleAudioFile = useCallback(async (file: File) => {
    await audioBusRef.current.connectFile(file);
  }, []);

  const handleParamChange = useCallback((changes: Partial<RenderParams>) => {
    setParams((prev) => ({ ...prev, ...changes }));
  }, []);

  const handlePreset = useCallback((preset: Partial<RenderParams>) => {
    setParams((prev) => ({ ...prev, ...preset }));
  }, []);

  const handleToggleRecord = useCallback(() => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const stream = canvas.captureStream(60);
    const audioStream = audioBusRef.current.getMediaStream();
    if (audioStream) {
      audioStream.getAudioTracks().forEach((track) => stream.addTrack(track));
    }
    const mimeCandidates = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm', 'video/mp4;codecs=h264'];
    const mimeType = mimeCandidates.find((candidate) => MediaRecorder.isTypeSupported(candidate)) ?? 'video/webm';
    const recorder = new MediaRecorder(stream, { mimeType });
    recordedChunksRef.current = [];
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        recordedChunksRef.current.push(event.data);
      }
    };
    recorder.onstop = () => {
      const blob = new Blob(recordedChunksRef.current, { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `alive-realtime-fx-${Date.now()}.webm`;
      a.click();
      URL.revokeObjectURL(url);
      recordingRef.current = false;
      setIsRecording(false);
      updateSchedulerSafety();
    };
    recorder.start();
    mediaRecorderRef.current = recorder;
    recordingRef.current = true;
    setIsRecording(true);
    updateSchedulerSafety();
  }, [isRecording, updateSchedulerSafety]);

  useEffect(() => {
    return () => {
      stopCurrentStream();
      mediaRecorderRef.current?.stop();
      renderGraphRef.current?.destroy();
      if (lastVideoUrlRef.current) {
        URL.revokeObjectURL(lastVideoUrlRef.current);
        lastVideoUrlRef.current = null;
      }
    };
  }, []);

  return (
    <div className="app-shell">
      <div className="canvas-wrapper">
        <canvas ref={canvasRef} width={1280} height={720} />
        <SafeGuides mode={safeGuide} />
        <Hud
          params={params}
          onParamChange={handleParamChange}
          onPreset={handlePreset}
          onStartCamera={handleCameraStart}
          onStopCamera={handleCameraStop}
          onVideoFile={handleVideoFile}
          onAudioFile={handleAudioFile}
          onToggleRecord={handleToggleRecord}
          isRecording={isRecording}
          cameraActive={cameraActive}
          safeMode={safeMode}
          onSafeModeChange={setSafeMode}
          safeGuide={safeGuide}
          onSafeGuideChange={setSafeGuide}
          envelope={envelope}
          degradeStep={degradeLevel}
        />
      </div>
      <footer>
        Hotkeys: <strong>R</strong> crimson gate &nbsp;|&nbsp; <strong>F</strong> freeze frame &nbsp;|&nbsp; <strong>P</strong> peak punch-in
      </footer>
    </div>
  );
};

export default App;
