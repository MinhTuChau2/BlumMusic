import * as Tone from "tone";
import { useRef } from "react";
import { drumPattern } from "./Drums";
import { progressions } from "./Progression";

export function useMusicEngine() {
  const synthRef = useRef(null);
  const recorderRef = useRef(null);
  const reverbRef = useRef(null);
  const delayRef = useRef(null);
  const stepRef = useRef(0);
  const drumPartRef = useRef(null);

  const startMusic = ({
    bpm,
    progressionName,
    reverbWet,
    delayWet,
    swing,
    drumsOn,
    setCurrentChord,
    setNextChord
  }) => {
    // ----- SYNTH + EFFECTS -----
    reverbRef.current = new Tone.Reverb({ decay: 3, wet: reverbWet });
    delayRef.current = new Tone.FeedbackDelay({ delayTime: "8n", feedback: 0.35, wet: delayWet });

    synthRef.current = new Tone.PolySynth(Tone.Synth).chain(
      reverbRef.current,
      delayRef.current,
      Tone.Destination
    );

    // ----- DRUMS -----
    if (drumsOn) {
      const kick = new Tone.MembraneSynth().toDestination();
      const snare = new Tone.Synth().toDestination();
      const hat = new Tone.NoiseSynth().toDestination();

      drumPartRef.current = new Tone.Part((time, e) => {
        if (e.type === "kick") kick.triggerAttackRelease("C1", "8n", time);
        if (e.type === "snare") snare.triggerAttackRelease("D2", "8n", time);
        if (e.type === "hat") hat.triggerAttackRelease("16n", time);
      }, drumPattern);

      drumPartRef.current.loop = true;
      drumPartRef.current.loopEnd = "2m";
      drumPartRef.current.start(0);

      Tone.Transport.swingSubdivision = "8n";
      Tone.Transport.swing = swing;
    } else if (drumPartRef.current) {
      drumPartRef.current.stop();
    }

    // ----- RECORDER -----
    if (!recorderRef.current) {
      recorderRef.current = new Tone.Recorder();
      Tone.Destination.connect(recorderRef.current);
    }

    // ----- CHORD PROGRESSION -----
    stepRef.current = 0;
    Tone.Transport.scheduleRepeat((time) => {
      const prog = progressions[progressionName];
      const current = prog[stepRef.current];
      const next = prog[(stepRef.current + 1) % prog.length];

      synthRef.current.triggerAttackRelease(current.notes, "1m", time);

      Tone.Draw.schedule(() => {
        setCurrentChord(current.name);
        setNextChord(next.name);
      }, time);

      stepRef.current = (stepRef.current + 1) % prog.length;
    }, "1m");

    Tone.Transport.bpm.value = bpm;
    Tone.Transport.start();
  };

  // ----- LIVE CONTROLS -----
  const setReverb = (value) => {
    reverbRef.current?.wet.rampTo(value, 0.2);
  };

  const setDelay = (value) => {
    delayRef.current?.wet.rampTo(value, 0.2);
  };

  const setDrums = (value) => {
    if (drumPartRef.current) {
      if (value) {
        drumPartRef.current.start(0);
      } else {
        drumPartRef.current.stop();
      }
    }
  };

  return {
    startMusic,
    recorderRef,
    setReverb,
    setDelay,
    setDrums
  };
}
