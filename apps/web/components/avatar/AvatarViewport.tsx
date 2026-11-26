'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { Play, Pause, RotateCcw, User } from 'lucide-react';
import { SignSequenceItem } from '../../types';
import { Button } from '../ui/Button';
import {
  AvatarPoseMap,
  PERMITTED_AVATAR_JOINTS,
  SequenceTimeline,
  buildSequenceTimeline,
  clampDeltaMs,
  clonePoseMap,
  createNeutralPoseMap,
  hasPlayableDuration,
  sampleTimelineAtTime,
} from './keyframeTimeline';

interface AvatarViewportProps {
  sequence: SignSequenceItem[];
  isPlaying: boolean;
  onPlayToggle: () => void;
  onReset: () => void;
  currentSignIndex: number;
  onSignIndexChange?: (index: number) => void;
  onPlaybackComplete?: () => void;
  seekRequest?: { index: number; nonce: number } | null;
  resetNonce?: number;
}

const TORSO_BASE_Y = 0.8;

function applyPosesToThreeJoints(
  joints: { [key: string]: THREE.Object3D },
  poses: AvatarPoseMap
): void {
  for (const jointName of PERMITTED_AVATAR_JOINTS) {
    const obj = joints[jointName];
    if (!obj) continue;
    const target = poses[jointName];
    obj.rotation.set(target.pitch, target.yaw, target.roll);
  }
}

function blendRenderedPoses(
  rendered: AvatarPoseMap,
  target: AvatarPoseMap,
  deltaMs: number
): void {
  // Fast tau=16 ms damping softens boundary jumps while keeping keyframe peaks faithful.
  const alpha = 1 - Math.exp(-Math.max(0, deltaMs) / 16);
  for (const jointName of PERMITTED_AVATAR_JOINTS) {
    const cur = rendered[jointName];
    const dst = target[jointName];
    cur.pitch += (dst.pitch - cur.pitch) * alpha;
    cur.yaw += (dst.yaw - cur.yaw) * alpha;
    cur.roll += (dst.roll - cur.roll) * alpha;
  }
}

function updateProgressBarEl(
  el: HTMLDivElement | null,
  elapsedMs: number,
  totalDurationMs: number
): void {
  if (!el) return;
  const pct =
    totalDurationMs > 0
      ? Math.max(0, Math.min(100, (elapsedMs / totalDurationMs) * 100))
      : 0;
  el.style.width = `${pct.toFixed(1)}%`;
}

export const AvatarViewport: React.FC<AvatarViewportProps> = ({
  sequence,
  isPlaying,
  onPlayToggle,
  onReset,
  currentSignIndex,
  onSignIndexChange,
  onPlaybackComplete,
  seekRequest,
  resetNonce,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const progressBarRef = useRef<HTMLDivElement | null>(null);
  const jointsRef = useRef<{ [key: string]: THREE.Object3D }>({});
  const animFrameRef = useRef<number | null>(null);
  const [webglError, setWebglError] = useState<string | null>(null);

  const timeline = useMemo<SequenceTimeline>(
    () => buildSequenceTimeline(sequence),
    [sequence]
  );

  // Authoritative mutable animation refs read by the single mount-owned rAF loop.
  const timelineRef = useRef<SequenceTimeline>(timeline);
  const isPlayingRef = useRef<boolean>(isPlaying);
  const isPlayingPropRef = useRef<boolean>(isPlaying);
  isPlayingPropRef.current = isPlaying;
  const elapsedMsRef = useRef<number>(0);
  const lastRafMsRef = useRef<number | null>(null);
  const lastReportedIndexRef = useRef<number>(0);
  const completedNotifiedRef = useRef<boolean>(false);
  const renderedPosesRef = useRef<AvatarPoseMap>(createNeutralPoseMap());
  const callbacksRef = useRef<{
    onSignIndexChange?: (index: number) => void;
    onPlaybackComplete?: () => void;
  }>({
    onSignIndexChange,
    onPlaybackComplete,
  });

  useEffect(() => {
    callbacksRef.current = { onSignIndexChange, onPlaybackComplete };
  }, [onSignIndexChange, onPlaybackComplete]);

  // Synchronize compiled timeline before evaluating isPlaying so simultaneous
  // empty -> playable transitions see the updated timelineRef immediately.
  useEffect(() => {
    timelineRef.current = timeline;
    elapsedMsRef.current = 0;
    lastRafMsRef.current = null;
    lastReportedIndexRef.current = 0;
    completedNotifiedRef.current = false;

    const playable = hasPlayableDuration(timeline);
    if (!playable && isPlayingPropRef.current) {
      isPlayingRef.current = false;
      if (timeline.segments.length > 0) {
        completedNotifiedRef.current = true;
        callbacksRef.current.onPlaybackComplete?.();
      }
    } else {
      isPlayingRef.current = isPlayingPropRef.current && playable;
    }

    const initialSample = sampleTimelineAtTime(timeline, 0);
    const startPose =
      isPlayingRef.current && playable
        ? initialSample.poses
        : createNeutralPoseMap();
    renderedPosesRef.current = clonePoseMap(startPose);
    applyPosesToThreeJoints(jointsRef.current, renderedPosesRef.current);
    updateProgressBarEl(progressBarRef.current, 0, timeline.totalDurationMs);
  }, [timeline]);

  // Synchronize Play/Pause ref cleanly; never allow empty or zero-duration playback to hang in Pause.
  useEffect(() => {
    const playable = hasPlayableDuration(timelineRef.current);
    isPlayingRef.current = isPlaying && playable;
    lastRafMsRef.current = null;

    if (isPlaying && !playable) {
      elapsedMsRef.current = 0;
      const neutral = createNeutralPoseMap();
      renderedPosesRef.current = clonePoseMap(neutral);
      applyPosesToThreeJoints(jointsRef.current, neutral);
      updateProgressBarEl(progressBarRef.current, 0, 0);
      if (timelineRef.current.segments.length > 0 && !completedNotifiedRef.current) {
        completedNotifiedRef.current = true;
        callbacksRef.current.onPlaybackComplete?.();
      }
      return;
    }

    if (
      isPlaying &&
      playable &&
      (completedNotifiedRef.current ||
        elapsedMsRef.current >= timelineRef.current.totalDurationMs)
    ) {
      elapsedMsRef.current = 0;
      completedNotifiedRef.current = false;
      const startSample = sampleTimelineAtTime(timelineRef.current, 0);
      lastReportedIndexRef.current = startSample.signIndex;
      callbacksRef.current.onSignIndexChange?.(startSample.signIndex);
      renderedPosesRef.current = clonePoseMap(startSample.poses);
      applyPosesToThreeJoints(jointsRef.current, renderedPosesRef.current);
      updateProgressBarEl(progressBarRef.current, 0, timelineRef.current.totalDurationMs);
    }
  }, [isPlaying]);

  // Mount Three.js scene and run a single persistent ref-synchronized animation loop.
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let disposed = false;
    const width = container.clientWidth || 400;
    const height = container.clientHeight || 360;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x182a53);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 1.2, 3.2);
    camera.lookAt(0, 1.1, 0);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      setWebglError(null);
    } catch {
      setWebglError('3D WebGL viewport unavailable in this browser context; timeline controls remain active.');
      return;
    }

    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0x39c6d8, 1.2);
    dirLight.position.set(2, 4, 3);
    scene.add(dirLight);

    const backLight = new THREE.DirectionalLight(0x8669e8, 0.8);
    backLight.position.set(-2, 2, -2);
    scene.add(backLight);

    // 8-Joint Stylized Mannequin (Rigid BoxGeometry hands — no articulated fingers)
    const joints: { [key: string]: THREE.Object3D } = {};

    const torsoGeo = new THREE.CylinderGeometry(0.28, 0.22, 0.65, 16);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0xf7f4ec,
      roughness: 0.3,
      metalness: 0.1,
    });
    const torso = new THREE.Mesh(torsoGeo, bodyMat);
    torso.position.set(0, TORSO_BASE_Y, 0);
    scene.add(torso);
    joints['torso'] = torso;

    const neck = new THREE.Group();
    neck.position.set(0, 0.35, 0);
    torso.add(neck);
    joints['neck'] = neck;

    const headGeo = new THREE.SphereGeometry(0.18, 20, 20);
    const headMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.set(0, 0.2, 0);
    neck.add(head);

    const armMat = new THREE.MeshStandardMaterial({ color: 0x39c6d8, roughness: 0.3 });

    // Right Arm Chain
    const rightShoulder = new THREE.Group();
    rightShoulder.position.set(0.32, 0.25, 0);
    torso.add(rightShoulder);
    joints['right_shoulder'] = rightShoulder;

    const upperArmR = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.055, 0.32, 12), armMat);
    upperArmR.position.set(0, -0.16, 0);
    rightShoulder.add(upperArmR);

    const rightElbow = new THREE.Group();
    rightElbow.position.set(0, -0.32, 0);
    rightShoulder.add(rightElbow);
    joints['right_elbow'] = rightElbow;

    const foreArmR = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.045, 0.3, 12), bodyMat);
    foreArmR.position.set(0, -0.15, 0);
    rightElbow.add(foreArmR);

    const rightWrist = new THREE.Group();
    rightWrist.position.set(0, -0.3, 0);
    rightElbow.add(rightWrist);
    joints['right_wrist'] = rightWrist;

    const handR = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.12, 0.03), armMat);
    handR.position.set(0, -0.06, 0);
    rightWrist.add(handR);

    // Left Arm Chain
    const leftShoulder = new THREE.Group();
    leftShoulder.position.set(-0.32, 0.25, 0);
    torso.add(leftShoulder);
    joints['left_shoulder'] = leftShoulder;

    const upperArmL = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.055, 0.32, 12), armMat);
    upperArmL.position.set(0, -0.16, 0);
    leftShoulder.add(upperArmL);

    const leftElbow = new THREE.Group();
    leftElbow.position.set(0, -0.32, 0);
    leftShoulder.add(leftElbow);
    joints['left_elbow'] = leftElbow;

    const foreArmL = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.045, 0.3, 12), bodyMat);
    foreArmL.position.set(0, -0.15, 0);
    leftElbow.add(foreArmL);

    const leftWrist = new THREE.Group();
    leftWrist.position.set(0, -0.3, 0);
    leftElbow.add(leftWrist);
    joints['left_wrist'] = leftWrist;

    const handL = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.12, 0.03), armMat);
    handL.position.set(0, -0.06, 0);
    leftWrist.add(handL);

    jointsRef.current = joints;

    // Initialize neutral rest pose cleanly on mount
    const initPoses = createNeutralPoseMap();
    renderedPosesRef.current = clonePoseMap(initPoses);
    applyPosesToThreeJoints(joints, initPoses);

    const animate = (nowMs: number) => {
      if (disposed) return;
      animFrameRef.current = requestAnimationFrame(animate);

      const currentTimeline = timelineRef.current;
      const playable = hasPlayableDuration(currentTimeline);
      let activePlay = isPlayingRef.current;
      let deltaMs = 0;

      if (activePlay && !playable) {
        activePlay = false;
        isPlayingRef.current = false;
        lastRafMsRef.current = null;
        elapsedMsRef.current = 0;
        if (currentTimeline.segments.length > 0 && !completedNotifiedRef.current) {
          completedNotifiedRef.current = true;
          callbacksRef.current.onPlaybackComplete?.();
        }
      } else if (!activePlay || !playable) {
        lastRafMsRef.current = null;
      } else {
        const prevNow = lastRafMsRef.current;
        lastRafMsRef.current = nowMs;
        deltaMs = prevNow === null ? 0 : clampDeltaMs(nowMs - prevNow, 100);
        const nextElapsed = Math.min(
          currentTimeline.totalDurationMs,
          elapsedMsRef.current + deltaMs
        );
        elapsedMsRef.current = nextElapsed;

        const sampled = sampleTimelineAtTime(currentTimeline, nextElapsed);
        if (sampled.signIndex !== lastReportedIndexRef.current) {
          lastReportedIndexRef.current = sampled.signIndex;
          callbacksRef.current.onSignIndexChange?.(sampled.signIndex);
        }

        if (nextElapsed >= currentTimeline.totalDurationMs) {
          isPlayingRef.current = false;
          lastRafMsRef.current = null;
          const neutralEnd = createNeutralPoseMap();
          renderedPosesRef.current = clonePoseMap(neutralEnd);
          applyPosesToThreeJoints(joints, neutralEnd);
          torso.position.y = TORSO_BASE_Y;
          updateProgressBarEl(progressBarRef.current, nextElapsed, currentTimeline.totalDurationMs);

          if (!completedNotifiedRef.current) {
            completedNotifiedRef.current = true;
            callbacksRef.current.onPlaybackComplete?.();
          }
          renderer.render(scene, camera);
          return;
        }
      }

      if (currentTimeline.segments.length === 0 || currentTimeline.totalDurationMs <= 0) {
        const neutral = createNeutralPoseMap();
        renderedPosesRef.current = clonePoseMap(neutral);
        applyPosesToThreeJoints(joints, neutral);
        torso.position.y = TORSO_BASE_Y + Math.sin(nowMs * 0.0015) * 0.01;
        updateProgressBarEl(progressBarRef.current, 0, 0);
      } else if (!activePlay && elapsedMsRef.current === 0) {
        const neutral = createNeutralPoseMap();
        renderedPosesRef.current = clonePoseMap(neutral);
        applyPosesToThreeJoints(joints, neutral);
        torso.position.y = TORSO_BASE_Y + Math.sin(nowMs * 0.0015) * 0.01;
        updateProgressBarEl(progressBarRef.current, 0, currentTimeline.totalDurationMs);
      } else {
        torso.position.y = TORSO_BASE_Y;
        const sampled = sampleTimelineAtTime(currentTimeline, elapsedMsRef.current);
        if (activePlay && deltaMs > 0) {
          blendRenderedPoses(renderedPosesRef.current, sampled.poses, deltaMs);
        } else {
          renderedPosesRef.current = clonePoseMap(sampled.poses);
        }
        applyPosesToThreeJoints(joints, renderedPosesRef.current);
        updateProgressBarEl(progressBarRef.current, elapsedMsRef.current, currentTimeline.totalDurationMs);
      }

      renderer.render(scene, camera);
    };

    animFrameRef.current = requestAnimationFrame(animate);

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || 400;
      const h = container.clientHeight || 360;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      disposed = true;
      window.removeEventListener('resize', handleResize);
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          if (Array.isArray(obj.material)) {
            obj.material.forEach((m) => m.dispose());
          } else if (obj.material) {
            obj.material.dispose();
          }
        }
      });
      renderer.dispose();
      jointsRef.current = {};
      container.innerHTML = '';
    };
  }, []);

  // Explicit Queue Seek handler (also snaps pose when paused).
  useEffect(() => {
    if (!seekRequest) return;
    const currentTimeline = timelineRef.current;
    if (currentTimeline.segments.length === 0) return;

    const safeIdx = Math.max(
      0,
      Math.min(currentTimeline.segments.length - 1, Math.trunc(seekRequest.index))
    );
    const startMs = currentTimeline.segments[safeIdx].startMs;
    elapsedMsRef.current = startMs;
    lastRafMsRef.current = null;
    completedNotifiedRef.current = false;
    lastReportedIndexRef.current = safeIdx;

    const sampled = sampleTimelineAtTime(currentTimeline, startMs);
    renderedPosesRef.current = clonePoseMap(sampled.poses);
    applyPosesToThreeJoints(jointsRef.current, renderedPosesRef.current);
    updateProgressBarEl(progressBarRef.current, startMs, currentTimeline.totalDurationMs);
  }, [seekRequest]);

  // Explicit Reset handler (restores neutral pose cleanly even if currentSignIndex was already 0).
  useEffect(() => {
    if (resetNonce === undefined || resetNonce === 0) return;
    isPlayingRef.current = false;
    elapsedMsRef.current = 0;
    lastRafMsRef.current = null;
    completedNotifiedRef.current = false;
    lastReportedIndexRef.current = 0;

    const neutral = createNeutralPoseMap();
    renderedPosesRef.current = clonePoseMap(neutral);
    applyPosesToThreeJoints(jointsRef.current, neutral);
    if (jointsRef.current['torso']) {
      jointsRef.current['torso'].position.y = TORSO_BASE_Y;
    }
    updateProgressBarEl(progressBarRef.current, 0, timelineRef.current.totalDurationMs);
  }, [resetNonce]);

  // Fallback seek synchronization if a caller modifies currentSignIndex without seekRequest.
  useEffect(() => {
    if (seekRequest !== undefined) return;
    const currentTimeline = timelineRef.current;
    if (currentTimeline.segments.length === 0) return;
    const safeIdx = Math.max(
      0,
      Math.min(currentTimeline.segments.length - 1, Math.trunc(currentSignIndex))
    );
    if (safeIdx === lastReportedIndexRef.current) return;
    const startMs = currentTimeline.segments[safeIdx].startMs;
    elapsedMsRef.current = startMs;
    lastRafMsRef.current = null;
    completedNotifiedRef.current = false;
    lastReportedIndexRef.current = safeIdx;
    const sampled = sampleTimelineAtTime(currentTimeline, startMs);
    renderedPosesRef.current = clonePoseMap(sampled.poses);
    applyPosesToThreeJoints(jointsRef.current, renderedPosesRef.current);
    updateProgressBarEl(progressBarRef.current, startMs, currentTimeline.totalDurationMs);
  }, [currentSignIndex, seekRequest]);

  const hasPlayable = hasPlayableDuration(timeline);
  const safeSignIndex =
    sequence.length > 0
      ? Math.max(0, Math.min(sequence.length - 1, currentSignIndex))
      : 0;
  const activeItem = sequence.length > 0 ? sequence[safeSignIndex] : null;

  return (
    <div className="flex flex-col gap-3 w-full">
      <div className="relative w-full aspect-4/3 min-h-[360px] rounded-2xl overflow-hidden bg-navy border-2 border-ink/20 shadow-xl flex items-center justify-center">
        {webglError ? (
          <div className="p-6 text-center text-white/80 font-mono text-xs max-w-sm">
            {webglError}
          </div>
        ) : (
          <div ref={mountRef} className="w-full h-full" />
        )}

        {/* Viewport Overlay Details */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 pointer-events-none">
          <div className="px-3 py-1 rounded-lg bg-navy-dark/80 backdrop-blur-md border border-white/10 text-cyan text-xs font-mono flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-cyan" />
            <span>3D Avatar Engine (Three.js)</span>
          </div>
          <span className="px-2 py-0.5 rounded bg-navy-dark/70 border border-white/10 text-[10px] font-mono text-white/70">
            8-joint rig &bull; rigid block hands
          </span>
        </div>

        {activeItem && (
          <div className="absolute bottom-3 left-3 right-3 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
            <div className="px-3 py-1.5 rounded-lg bg-navy-dark/90 border border-cyan/40 text-white text-xs font-mono">
              <span className="text-cyan font-bold">SIGN: </span>
              <span>{activeItem.sign_id}</span>
              <span className="text-white/50 ml-2">
                ({safeSignIndex + 1}/{sequence.length})
              </span>
            </div>
            <div className="px-2.5 py-1 rounded-md bg-white/10 backdrop-blur-sm text-[10px] font-mono text-white/85">
              {activeItem.movement_type}
              {activeItem.non_manual_marker ? ` • ${activeItem.non_manual_marker}` : ''}
            </div>
          </div>
        )}

        {sequence.length > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
            <div
              ref={progressBarRef}
              className="h-full bg-cyan transition-none"
              style={{ width: '0%' }}
            />
          </div>
        )}
      </div>

      {/* Playback Controls */}
      <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-ink/10 shadow-sm">
        <div className="flex items-center gap-2">
          <Button
            variant={isPlaying && hasPlayable ? 'danger' : 'accent'}
            size="sm"
            onClick={onPlayToggle}
            disabled={!hasPlayable}
            className="flex items-center gap-2"
          >
            {isPlaying && hasPlayable ? (
              <>
                <Pause className="w-3.5 h-3.5" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                <span>Play Animation</span>
              </>
            )}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onReset}
            disabled={sequence.length === 0}
            className="flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </Button>
        </div>

        <span className="text-xs font-mono text-ink-muted">
          {sequence.length} sign{sequence.length === 1 ? '' : 's'} queued
          {timeline.totalDurationMs > 0 ? ` (${(timeline.totalDurationMs / 1000).toFixed(1)}s)` : ''}
        </span>
      </div>
    </div>
  );
};
