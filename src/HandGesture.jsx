import { useEffect, useRef } from "react";
import { Hands } from "@mediapipe/hands";
import { Camera } from "@mediapipe/camera_utils";
import {
  drawConnectors,
  drawLandmarks,
  HAND_CONNECTIONS,
} from "@mediapipe/drawing_utils";

export default function HandGesture({ onGesture }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const cameraRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    let isActive = true; // 🛑 lifecycle guard

    const hands = new Hands({
      locateFile: (file) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
    });

    hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.7,
      minTrackingConfidence: 0.5,
      selfieMode: true,
    });

    hands.onResults((results) => {
      if (!isActive) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (results.multiHandLandmarks?.length) {
        const lm = results.multiHandLandmarks[0];

        drawConnectors(ctx, lm, HAND_CONNECTIONS, {
          color: "#00FF00",
          lineWidth: 2,
        });

        drawLandmarks(ctx, lm, {
          color: "#FF0000",
          lineWidth: 1,
        });

        // =============================
        // ✋ GESTURE DETECTION
        // =============================

        const fingers = {
          index: lm[8].y < lm[6].y,
          middle: lm[12].y < lm[10].y,
          ring: lm[16].y < lm[14].y,
          pinky: lm[20].y < lm[18].y,
        };

        const count =
          fingers.index +
          fingers.middle +
          fingers.ring +
          fingers.pinky;

        let gesture = "UNKNOWN";

        if (count === 0) gesture = "FIST";
        else if (count === 4) gesture = "OPEN";
        else if (count === 1 && fingers.index) gesture = "1";
        else if (count === 2 && fingers.index && fingers.middle) gesture = "2";
        else if (
          count === 3 &&
          fingers.index &&
          fingers.middle &&
          fingers.ring
        )
          gesture = "3";

        if (gesture !== "UNKNOWN") {
          onGesture?.(gesture);
        }
      }
    });

    cameraRef.current = new Camera(video, {
      onFrame: async () => {
        if (!isActive) return; // 🛑 CRITICAL
        await hands.send({ image: video });
      },
      width: 640,
      height: 480,
    });

    cameraRef.current.start();

    return () => {
      isActive = false;            // 🛑 stop async calls
      cameraRef.current?.stop();  // stop camera first
      hands.close();               // then destroy WASM
    };
  }, [onGesture]);

  return (
    <div style={{ position: "relative", width: 640, height: 480 }}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{
          width: "100%",
          height: "100%",
          transform: "scaleX(-1)", // mirror video only
        }}
      />
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}
