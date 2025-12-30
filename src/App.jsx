import { useState, useEffect } from "react";
import * as Tone from "tone";
import "./index.css";

import HandGesture from "./HandGesture";
import { useVoiceEngine } from "./audio/UseVoiceEngine";
import { useMusicEngine } from "./audio/useMusicEngine";
import { progressions } from "./audio/Progression";

export default function App() {
  const [bpm, setBpm] = useState(120);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progressionName, setProgressionName] = useState("I–V–vi–IV");

  const [currentChord, setCurrentChord] = useState(null);
  const [nextChord, setNextChord] = useState(null);

  const [reverbWet, setReverbWet] = useState(0.3);
  const [delayWet, setDelayWet] = useState(0.2);
  const [drumsOn, setDrumsOn] = useState(true);

  const [gesture, setGesture] = useState(null);
  const [isRecording, setIsRecording] = useState(false);

  const { startMic, applyGestureEffect } = useVoiceEngine();
  const {
    startMusic,
    recorderRef,
    setReverb,
    setDelay,
    setDrums
  } = useMusicEngine();

  // ▶ PLAY
  const start = async () => {
    if (isPlaying) return;

    await Tone.start();
    await startMic();

    startMusic({
      bpm,
      progressionName,
      reverbWet,
      delayWet,
      swing: 0,
      drumsOn,
      setCurrentChord,
      setNextChord
    });

    setIsPlaying(true);
  };

  // ⏹ STOP
  const stop = () => {
    Tone.Transport.stop();
    Tone.Transport.cancel();
    setIsPlaying(false);
  };

  // 🎙 RECORD
  const startRecording = () => {
  if (!recorderRef.current) {
    console.warn("Recorder not initialized!");
    return;
  }
  recorderRef.current.start();
  setIsRecording(true);
};

const stopRecording = async () => {
  if (!recorderRef.current) return;

  const blob = await recorderRef.current.stop();
  setIsRecording(false);

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "blum_music_voice.wav";
  a.click();
};


  // ✋ Gesture → Voice FX
  useEffect(() => {
    if (gesture) applyGestureEffect(gesture);
  }, [gesture]);

  return (
   <div className="app">
  <h1>Blum Music</h1>

  {/* 🎹 CHORD DISPLAY */}
  <div className="chord-container">
    <div className="chord current">{currentChord || "—"}</div>
    <div className="arrow">→</div>
    <div className="chord next">{nextChord || "—"}</div>
  </div>

  {/* ---------- MAIN PANELS ---------- */}
  <div className="main-panels">
    {/* LEFT PANEL: Camera / Hand Gesture */}
    <div className="camera-panel">
      <HandGesture onGesture={setGesture} />
      <div>Gesture: {gesture || "none"}</div>
    </div>

    {/* RIGHT PANEL: Settings / Controls */}
    <div className="settings-panel">
      <label>
        BPM
        <input
          type="number"
          min="60"
          max="200"
          value={bpm}
          onChange={(e) => {
            const v = +e.target.value;
            setBpm(v);
            Tone.Transport.bpm.rampTo(v, 0.2);
          }}
        />
      </label>

      <label>
        Progression
        <select
          value={progressionName}
          onChange={(e) => setProgressionName(e.target.value)}
        >
          {Object.keys(progressions).map((p) => (
            <option key={p}>{p}</option>
          ))}
        </select>
      </label>

      <div className="sound-panel">
        <h3>Sound Design</h3>

        <label>
          Reverb
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={reverbWet}
            onChange={(e) => {
              const v = +e.target.value;
              setReverbWet(v);
              setReverb(v);
            }}
          />
        </label>

        <label>
          Echo / Delay
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={delayWet}
            onChange={(e) => {
              const v = +e.target.value;
              setDelayWet(v);
              setDelay(v);
            }}
          />
        </label>

        <label>
          Drums
          <input
            type="checkbox"
            checked={drumsOn}
            onChange={(e) => {
              const v = e.target.checked;
              setDrumsOn(v);
              setDrums(v);
            }}
          />
        </label>
      </div>

      <div className="controls">
  <button onClick={start} disabled={isPlaying}>▶ Play</button>
  <button onClick={stop}>⏹ Stop</button>

  {!isRecording ? (
    <button onClick={startRecording}>
      ● Record
    </button>
  ) : (
    <button onClick={stopRecording}>■ Stop Recording</button>
  )}
</div>

    </div>
  </div>
</div>

  );
}
