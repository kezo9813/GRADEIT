"use client";

import { useEffect, useRef, useState } from "react";

type AudioRecorderProps = {
  onRecorded: (file: File) => void;
};

export function AudioRecorder({ onRecorded }: AudioRecorderProps) {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const [recording, setRecording] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  // new refs to hold latest values so cleanup doesn't run on state change
  const streamRef = useRef<MediaStream | null>(null);
  const previewUrlRef = useRef<string | null>(null);

  const [elapsedMs, setElapsedMs] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const cutoffRef = useRef<NodeJS.Timeout | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [levels, setLevels] = useState<number[]>([]);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const rafRef = useRef<number | null>(null);

  // keep refs in sync whenever state changes
  useEffect(() => {
    streamRef.current = stream;
  }, [stream]);

  useEffect(() => {
    previewUrlRef.current = previewUrl;
  }, [previewUrl]);

  // mount/unmount cleanup only — uses refs to access latest stream/previewUrl
  useEffect(() => {
    return () => {
      mediaRecorderRef.current?.stop();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      if (timerRef.current) clearInterval(timerRef.current);
      if (cutoffRef.current) clearTimeout(cutoffRef.current);
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
        previewUrlRef.current = null;
      }
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => null);
        audioCtxRef.current = null;
      }
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const start = async () => {
    if (!navigator?.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setStatus("Recording not supported in this browser. Try Chrome/Firefox/Edge.");
      return;
    }
    setStatus(null);
    try {
      const userStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(userStream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        if (cutoffRef.current) {
          clearTimeout(cutoffRef.current);
          cutoffRef.current = null;
        }
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        if (blob.size === 0) {
          setStatus("Aucune capture audio. Vérifiez votre micro et réessayez.");
        } else {
          const file = new File([blob], `recording_${Date.now()}.webm`, { type: "audio/webm" });
          onRecorded(file);
          const url = URL.createObjectURL(blob);
          setPreviewUrl(url);
          previewUrlRef.current = url;
          setStatus("Enregistré");
        }
        userStream.getTracks().forEach((t) => t.stop());
        setStream(null);
        streamRef.current = null;
        setRecording(false);
        setElapsedMs(0);
        setPlaying(false);
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
        }
        stopVisualizer();
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setStream(userStream);
      streamRef.current = userStream;
      setRecording(true);
      setStatus("Recording…");
      setElapsedMs(0);
      timerRef.current = setInterval(() => {
        setElapsedMs((ms) => ms + 200);
      }, 200);
      cutoffRef.current = setTimeout(() => {
        stop();
        setStatus("Arrêt automatique à 30s");
      }, 30_000);
    } catch (err) {
        setStatus("Microphone blocked or unavailable.");
    }
  };

  const stop = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (cutoffRef.current) {
      clearTimeout(cutoffRef.current);
      cutoffRef.current = null;
    }
  };

  const togglePlay = () => {
    if (!previewUrl || !audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      audioRef.current
        .play()
        .then(() => {
          setPlaying(true);
          startVisualizer();
        })
        .catch(() => setStatus("Impossible de lire l'audio"));
    }
  };

  const startVisualizer = () => {
    if (!audioRef.current) return;
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext();
    }
    const ctx = audioCtxRef.current;
    const source = ctx.createMediaElementSource(audioRef.current);
    analyserRef.current = ctx.createAnalyser();
    analyserRef.current.fftSize = 64;
    const bufferLength = analyserRef.current.frequencyBinCount;
    dataArrayRef.current = new Uint8Array(bufferLength);
    source.connect(analyserRef.current);
    analyserRef.current.connect(ctx.destination);

    const draw = () => {
      if (!analyserRef.current || !dataArrayRef.current) return;
      analyserRef.current.getByteFrequencyData(dataArrayRef.current);
      const slice = Array.from(dataArrayRef.current).slice(0, 24);
      setLevels(slice);
      rafRef.current = requestAnimationFrame(draw);
    };
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(draw);
  };

  const stopVisualizer = () => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    setLevels([]);
  };

  return (
    <div className="stack">
      <div className="row" style={{ gap: 8 }}>
        <button className="btn" type="button" onClick={() => void start()} disabled={recording}>
          Rec
        </button>
        <button className="btn secondary" type="button" onClick={stop} disabled={!recording}>
          Stop
        </button>
        <button
          className="btn secondary"
          type="button"
          onClick={togglePlay}
          disabled={!previewUrl}
        >
          {playing ? "Pause" : "Play"}
        </button>
        {recording ? <span className="stat small">{(elapsedMs / 1000).toFixed(1)}s</span> : null}
      </div>
      {previewUrl ? (
        <audio
          ref={audioRef}
          src={previewUrl}
          style={{ width: "100%", marginTop: 8 }}
          aria-label="Aperçu audio"
          onEnded={() => {
            setPlaying(false);
            stopVisualizer();
          }}
          onPause={() => {
            setPlaying(false);
            stopVisualizer();
          }}
          onPlay={() => {
            setPlaying(true);
            startVisualizer();
          }}
        />
      ) : null}
      {levels.length > 0 ? (
        <div
          style={{
            display: "flex",
            gap: 2,
            alignItems: "flex-end",
            height: 48,
            marginTop: 8,
          }}
        >
          {levels.map((v, i) => (
            <div
              key={i}
              style={{
                width: 6,
                height: `${(v / 255) * 48}px`,
                background: "linear-gradient(180deg, #4de2c6, #7ff1d8)",
                borderRadius: 3,
                opacity: 0.8,
              }}
            />
          ))}
        </div>
      ) : null}
      {status ? <div className="muted">{status}</div> : null}
    </div>
  );
}
