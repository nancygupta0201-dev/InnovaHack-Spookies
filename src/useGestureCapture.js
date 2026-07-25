import { useRef } from "react";

export default function useGestureCapture() {
  const faceLandmarkerRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const rafIdRef = useRef(null);
  const capturingRef = useRef(false);

  // Accumulators
  const frameCount = useRef(0);
  const eyeContactFrames = useRef(0);
  const smileSum = useRef(0);
  const fidgetCount = useRef(0);
  const blinkCount = useRef(0);
  const wasBlinking = useRef(false);
  const lastNoseX = useRef(null);
  const lastNoseY = useRef(null);
  const tiltSamples = useRef([]);
  const startTime = useRef(null);

  const FIDGET_THRESHOLD = 0.03;
  const EYE_CONTACT_YAW_THRESHOLD = 0.15;

  const initFaceLandmarker = async () => {
    if (faceLandmarkerRef.current) return faceLandmarkerRef.current;

    const { FaceLandmarker, FilesetResolver } = await import(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/vision_bundle.mjs"
    );

    const filesetResolver = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"
    );

    faceLandmarkerRef.current = await FaceLandmarker.createFromOptions(filesetResolver, {
      baseOptions: {
        modelAssetPath:
          "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
        delegate: "GPU",
      },
      outputFaceBlendshapes: true,
      outputFacialTransformationMatrixes: true,
      runningMode: "VIDEO",
      numFaces: 1,
    });

    return faceLandmarkerRef.current;
  };

  const resetAccumulators = () => {
    frameCount.current = 0;
    eyeContactFrames.current = 0;
    smileSum.current = 0;
    fidgetCount.current = 0;
    blinkCount.current = 0;
    wasBlinking.current = false;
    lastNoseX.current = null;
    lastNoseY.current = null;
    tiltSamples.current = [];
    startTime.current = performance.now();
  };

  const getBlendshapeScore = (blendshapes, name) => {
    const cat = blendshapes?.categories?.find((c) => c.categoryName === name);
    return cat ? cat.score : 0;
  };

  const processResult = (result) => {
    if (!result.faceLandmarks || result.faceLandmarks.length === 0) return;

    frameCount.current++;
    const landmarks = result.faceLandmarks[0];
    const blendshapes = result.faceBlendshapes?.[0];

    const smileLeft = getBlendshapeScore(blendshapes, "mouthSmileLeft");
    const smileRight = getBlendshapeScore(blendshapes, "mouthSmileRight");
    smileSum.current += (smileLeft + smileRight) / 2;

    const blinkLeft = getBlendshapeScore(blendshapes, "eyeBlinkLeft");
    const blinkRight = getBlendshapeScore(blendshapes, "eyeBlinkRight");
    const isBlinking = (blinkLeft + blinkRight) / 2 > 0.5;
    if (isBlinking && !wasBlinking.current) blinkCount.current++;
    wasBlinking.current = isBlinking;

    const matrix = result.facialTransformationMatrixes?.[0]?.data;
    if (matrix) {
      const yaw = Math.asin(Math.max(-1, Math.min(1, -matrix[2])));
      if (Math.abs(yaw) < EYE_CONTACT_YAW_THRESHOLD) eyeContactFrames.current++;
      tiltSamples.current.push(yaw);
    }

    const nose = landmarks[1];
    if (nose) {
      if (lastNoseX.current !== null) {
        const dx = nose.x - lastNoseX.current;
        const dy = nose.y - lastNoseY.current;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > FIDGET_THRESHOLD) fidgetCount.current++;
      }
      lastNoseX.current = nose.x;
      lastNoseY.current = nose.y;
    }
  };

  const detectLoop = () => {
    if (!capturingRef.current) return;
    const now = performance.now();
    const result = faceLandmarkerRef.current.detectForVideo(videoRef.current, now);
    processResult(result);
    rafIdRef.current = requestAnimationFrame(detectLoop);
  };

  const startGestureCapture = async (existingVideoElement) => {
    await initFaceLandmarker();

    // Reuse existing video stream if provided (from camera already on)
    if (existingVideoElement) {
      videoRef.current = existingVideoElement;
    } else {
      const vid = document.createElement("video");
      vid.autoplay = true;
      vid.playsInline = true;
      vid.muted = true;
      vid.style.display = "none";
      document.body.appendChild(vid);

      streamRef.current = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
        audio: false,
      });
      vid.srcObject = streamRef.current;
      await vid.play();
      videoRef.current = vid;
    }

    resetAccumulators();
    capturingRef.current = true;
    detectLoop();
  };

  const stopGestureCapture = () => {
    capturingRef.current = false;
    if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }

    const durationSeconds = (performance.now() - startTime.current) / 1000;
    const durationMinutes = durationSeconds / 60;

    let postureScore = null;
    if (tiltSamples.current.length > 1) {
      const mean = tiltSamples.current.reduce((a, b) => a + b, 0) / tiltSamples.current.length;
      const variance =
        tiltSamples.current.reduce((sum, v) => sum + (v - mean) ** 2, 0) / tiltSamples.current.length;
      postureScore = Math.max(0, 1 - variance * 20);
    }

    return {
      eye_contact_ratio: frameCount.current > 0 ? eyeContactFrames.current / frameCount.current : null,
      smile_intensity: frameCount.current > 0 ? smileSum.current / frameCount.current : null,
      fidget_count: fidgetCount.current,
      posture_score: postureScore,
      blink_rate: durationMinutes > 0 ? blinkCount.current / durationMinutes : null,
    };
  };

  return { startGestureCapture, stopGestureCapture };
}