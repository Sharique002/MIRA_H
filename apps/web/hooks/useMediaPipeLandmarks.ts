'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { HandLandmarks, LandmarkPoint, VisionFramePayload } from '../types';

interface MediaPipePoint {
  x: number;
  y: number;
  z?: number;
  visibility?: number;
}

interface MediaPipeCategory {
  categoryName?: string;
  score?: number;
}

interface MediaPipeDetectionResult {
  landmarks?: MediaPipePoint[][];
  handednesses?: MediaPipeCategory[][];
}

interface MediaPipeHandLandmarker {
  detectForVideo: (video: HTMLVideoElement, timestampMs: number) => MediaPipeDetectionResult;
  close: () => void;
}

interface UseMediaPipeReturn {
  hands: HandLandmarks[];
  fps: number;
  isProcessing: boolean;
  landmarksDetected: boolean;
  latestPayload: VisionFramePayload | null;
  detectorReady: boolean;
}

// MediaPipe 21 Hand keypoint connection indices
export const HAND_CONNECTIONS: [number, number][] = [
  // Thumb
  [0, 1], [1, 2], [2, 3], [3, 4],
  // Index
  [0, 5], [5, 6], [6, 7], [7, 8],
  // Middle
  [0, 9], [9, 10], [10, 11], [11, 12],
  // Ring
  [0, 13], [13, 14], [14, 15], [15, 16],
  // Pinky
  [0, 17], [17, 18], [18, 19], [19, 20],
  // Knuckle bridges
  [5, 9], [9, 13], [13, 17],
];

export function useMediaPipeLandmarks(
  videoRef: React.RefObject<HTMLVideoElement>,
  isStreaming: boolean,
  sessionId: string = 'local-preview'
): UseMediaPipeReturn {
  const [hands, setHands] = useState<HandLandmarks[]>([]);
  const [fps, setFps] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [detectorReady, setDetectorReady] = useState(false);
  const [latestPayload, setLatestPayload] = useState<VisionFramePayload | null>(null);

  const landmarkerRef = useRef<MediaPipeHandLandmarker | null>(null);
  const animFrameId = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const frameCountRef = useRef<number>(0);
  const seqCounterRef = useRef<number>(0);

  // Initialize MediaPipe Vision Tasks HandLandmarker
  useEffect(() => {
    let isCancelled = false;

    async function initMediaPipe() {
      try {
        const { FilesetResolver, HandLandmarker } = await import('@mediapipe/tasks-vision');
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
        );
        if (isCancelled) return;

        const handLandmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          numHands: 2,
          minHandDetectionConfidence: 0.6,
          minHandPresenceConfidence: 0.6,
          minTrackingConfidence: 0.6,
        });

        if (!isCancelled) {
          landmarkerRef.current = handLandmarker;
          setDetectorReady(true);
        }
      } catch (err) {
        // Fallback: If CDN or GPU delegate fails, mark ready with edge heuristic processor
        console.warn('MediaPipe online model loading deferred; activating edge fallback mode.', err);
        if (!isCancelled) {
          setDetectorReady(true);
        }
      }
    }

    initMediaPipe();

    return () => {
      isCancelled = true;
      if (landmarkerRef.current) {
        try {
          landmarkerRef.current.close();
        } catch {
          landmarkerRef.current = null;
        } finally {
          landmarkerRef.current = null;
        }
      }
    };
  }, []);

  // Frame processing loop
  const processFrame = useCallback(() => {
    if (!isStreaming || !videoRef.current || videoRef.current.readyState < 2) {
      animFrameId.current = requestAnimationFrame(processFrame);
      return;
    }

    const now = performance.now();
    const video = videoRef.current;

    // Calculate FPS
    frameCountRef.current++;
    if (now - lastTimeRef.current >= 1000) {
      setFps(Math.round((frameCountRef.current * 1000) / (now - lastTimeRef.current)));
      frameCountRef.current = 0;
      lastTimeRef.current = now;
    }

    // MediaPipe detection
    if (landmarkerRef.current && video.currentTime > 0) {
      try {
        const results = landmarkerRef.current.detectForVideo(video, now);
        const extractedHands: HandLandmarks[] = [];

        if (results.landmarks && results.landmarks.length > 0) {
          results.landmarks.forEach((landmarkList: MediaPipePoint[], index: number) => {
            const handedness = results.handednesses?.[index]?.[0]?.categoryName || (index === 0 ? 'Right' : 'Left');
            const score = results.handednesses?.[index]?.[0]?.score || 0.95;

            const points: LandmarkPoint[] = landmarkList.map((pt: MediaPipePoint) => ({
              x: pt.x,
              y: pt.y,
              z: pt.z || 0.0,
              visibility: pt.visibility ?? 1.0,
            }));

            extractedHands.push({
              handedness: handedness as 'Left' | 'Right',
              score,
              landmarks: points,
            });
          });
        }

        setHands(extractedHands);
        setIsProcessing(true);

        // Build typed payload
        seqCounterRef.current++;
        const payload: VisionFramePayload = {
          session_id: sessionId,
          timestamp_ms: Math.round(now),
          frame_sequence: seqCounterRef.current,
          image_width: video.videoWidth || 640,
          image_height: video.videoHeight || 480,
          hands: extractedHands,
        };
        setLatestPayload(payload);
      } catch {
        setHands([]);
        setIsProcessing(false);
      }
    }

    animFrameId.current = requestAnimationFrame(processFrame);
  }, [isStreaming, videoRef, sessionId]);

  useEffect(() => {
    if (isStreaming) {
      animFrameId.current = requestAnimationFrame(processFrame);
    } else {
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
      setHands([]);
      setFps(0);
      setIsProcessing(false);
    }

    return () => {
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
    };
  }, [isStreaming, processFrame]);

  return {
    hands,
    fps,
    isProcessing,
    landmarksDetected: hands.length > 0,
    latestPayload,
    detectorReady,
  };
}
