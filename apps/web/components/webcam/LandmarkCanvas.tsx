'use client';

import React, { useRef, useEffect } from 'react';
import { HandLandmarks } from '../../types';
import { HAND_CONNECTIONS } from '../../hooks/useMediaPipeLandmarks';

interface LandmarkCanvasProps {
  hands: HandLandmarks[];
  width: number;
  height: number;
  className?: string;
}

export const LandmarkCanvas: React.FC<LandmarkCanvasProps> = ({
  hands,
  width,
  height,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);

    if (!hands || hands.length === 0) return;

    hands.forEach((hand) => {
      const isRight = hand.handedness === 'Right';
      const lineColor = isRight ? '#39C6D8' : '#8669E8'; // Cyan for right, Violet for left
      const jointColor = '#FFFFFF';

      // 1. Draw skeletal connections
      ctx.lineWidth = 3;
      ctx.strokeStyle = lineColor;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      HAND_CONNECTIONS.forEach(([startIdx, endIdx]) => {
        const start = hand.landmarks[startIdx];
        const end = hand.landmarks[endIdx];
        if (start && end) {
          ctx.beginPath();
          ctx.moveTo(start.x * width, start.y * height);
          ctx.lineTo(end.x * width, end.y * height);
          ctx.stroke();
        }
      });

      // 2. Draw landmark keypoints (21 joints)
      hand.landmarks.forEach((pt, idx) => {
        const x = pt.x * width;
        const y = pt.y * height;
        const radius = idx === 0 || idx === 4 || idx === 8 || idx === 12 || idx === 16 || idx === 20 ? 5 : 3.5;

        ctx.beginPath();
        ctx.arc(x, y, radius, 0, 2 * Math.PI);
        ctx.fillStyle = jointColor;
        ctx.fill();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = lineColor;
        ctx.stroke();
      });

      // 3. Draw Handedness Label & Confidence
      if (hand.landmarks[0]) {
        const wrist = hand.landmarks[0];
        const labelX = Math.max(10, Math.min(width - 80, wrist.x * width - 30));
        const labelY = Math.max(25, wrist.y * height + 25);

        ctx.fillStyle = 'rgba(24, 42, 83, 0.85)';
        ctx.fillRect(labelX - 4, labelY - 14, 75, 18);
        ctx.fillStyle = '#39C6D8';
        ctx.font = '10px JetBrains Mono, monospace';
        ctx.fillText(`${hand.handedness} ${(hand.score * 100).toFixed(0)}%`, labelX, labelY);
      }
    });
  }, [hands, width, height]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className={`absolute inset-0 pointer-events-none w-full h-full object-cover ${className}`}
    />
  );
};
