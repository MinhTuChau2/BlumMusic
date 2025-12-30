import * as Tone from "tone";
import { useRef, useEffect } from "react";

export function useVoiceEngine() {
  const micRef = useRef(null);
  const micGainRef = useRef(null);
  const chorusRef = useRef(null);
  const echoRef = useRef(null);
  const compressorRef = useRef(null);
  const pitchShiftRef = useRef(null);
  const radioEQRef = useRef(null);
  const analyserRef = useRef(null);

  const startMic = async () => {
    micRef.current = new Tone.UserMedia();
    await micRef.current.open();

    micGainRef.current = new Tone.Gain(3);

    chorusRef.current = new Tone.Chorus({
      frequency: 0.5,
      delayTime: 0.01,
      depth: 0.1,
      wet: 0
    }).start();

    echoRef.current = new Tone.FeedbackDelay({
      delayTime: "8n",
      feedback: 0.85,
      wet: 0
    });

    compressorRef.current = new Tone.Compressor(-30, 12);
    pitchShiftRef.current = new Tone.PitchShift({ pitch: 0, wet: 0 });
    radioEQRef.current = new Tone.EQ3({ low: 0, mid: 0, high: 0 });

    // FFT analyser for pitch detection
    analyserRef.current = new Tone.Analyser("waveform", 2048);

    micRef.current.chain(
      micGainRef.current,
      chorusRef.current,
      echoRef.current,
      pitchShiftRef.current,
      radioEQRef.current,
      compressorRef.current,
      analyserRef.current,
      Tone.Destination
    );
  };

  const applyGestureEffect = (g) => {
    if (!chorusRef.current) return;

    // reset effects
    chorusRef.current.wet.value = 0;
    echoRef.current.wet.value = 0;
    pitchShiftRef.current.wet.value = 0;
    compressorRef.current.threshold.value = -10;
    radioEQRef.current.low.value = 0;
    radioEQRef.current.mid.value = 0;
    radioEQRef.current.high.value = 0;

    switch (g) {
      case "OPEN":
  chorusRef.current.wet.value = 0.7;
  echoRef.current.wet.value = 0.8;
  break;

      case "FIST":
        compressorRef.current.threshold.value = -40;
        break;

      case "1": // DYNAMIC AUTOTUNE TO C MAJOR
    pitchShiftRef.current.wet.value = 0.15;

    const C_FREQUENCIES = [65.41, 130.81, 261.63, 523.25]; // C2, C3, C4, C5

    const getClosestC = (freq) => {
      let closest = C_FREQUENCIES[0];
      let minDiff = Math.abs(freq - closest);
      for (let f of C_FREQUENCIES) {
        const diff = Math.abs(freq - f);
        if (diff < minDiff) {
          minDiff = diff;
          closest = f;
        }
      }
      return closest;
    };

    const updatePitchShift = () => {
      const waveform = analyserRef.current.getValue();
      if (!waveform) return;

      // Estimate frequency using zero-crossing (simple pitch detection)
      let crossings = 0;
      for (let i = 1; i < waveform.length; i++) {
        if (waveform[i - 1] <= 0 && waveform[i] > 0) crossings++;
      }
      const sampleRate = Tone.context.sampleRate;
      const freq = (crossings * sampleRate) / waveform.length / 2;

      if (freq > 0) {
        const targetFreq = getClosestC(freq);
        const semitoneShift = 12 * Math.log2(targetFreq / freq);
        pitchShiftRef.current.pitch = semitoneShift;
      }

      requestAnimationFrame(updatePitchShift);
    };

    updatePitchShift();
    break;


      case "2":
        radioEQRef.current.low.value = -27;
        radioEQRef.current.mid.value = 9;
        radioEQRef.current.high.value = -20;
        compressorRef.current.threshold.value = -35;
        break;
        case "3":
            chorusRef.current.frequency.value = 2;
        chorusRef.current.depth = 0.8;
        chorusRef.current.wet.value = 0.2;

        echoRef.current.delayTime.value = 0.1;
        echoRef.current.feedback.value = 0.5;
        echoRef.current.wet.value = 0.2;
          break;

      default:
        break;
    }
  };

  return { startMic, applyGestureEffect };
}
