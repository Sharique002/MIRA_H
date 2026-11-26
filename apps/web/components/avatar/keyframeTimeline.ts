import type { SignKeyframe, SignSequenceItem } from '../../types';

/**
 * Strictly matches the eight animated Three.js skeletal joints in AvatarViewport.tsx
 * and backend PERMITTED_AVATAR_JOINTS in base_adapter.py.
 */
export const PERMITTED_AVATAR_JOINTS = [
  'torso',
  'neck',
  'right_shoulder',
  'right_elbow',
  'right_wrist',
  'left_shoulder',
  'left_elbow',
  'left_wrist',
] as const;

export type PermittedJointName = (typeof PERMITTED_AVATAR_JOINTS)[number];

const PERMITTED_JOINT_SET: ReadonlySet<string> = new Set<string>(PERMITTED_AVATAR_JOINTS);

export interface EulerPose {
  pitch: number;
  yaw: number;
  roll: number;
}

export type AvatarPoseMap = Record<PermittedJointName, EulerPose>;

export interface ResolvedKeyframe {
  timeMs: number;
  poses: AvatarPoseMap;
  handShape: string;
  nonManualMarker: string;
}

export interface NormalizedSignTrack {
  signId: string;
  durationMs: number;
  movementType: string;
  keyframes: ResolvedKeyframe[];
  isDegenerate: boolean;
}

export interface TimelineSegment {
  signIndex: number;
  startMs: number;
  endMs: number;
  track: NormalizedSignTrack;
}

export interface SequenceTimeline {
  segments: TimelineSegment[];
  totalDurationMs: number;
}

export interface TimelineSample {
  signIndex: number;
  signId: string | null;
  movementType: string | null;
  handShape: string | null;
  nonManualMarker: string | null;
  localMs: number;
  poses: AvatarPoseMap;
  isComplete: boolean;
}

export interface TimelinePlaybackState {
  timeline: SequenceTimeline;
  elapsedMs: number;
  isPlaying: boolean;
  activeSignIndex: number;
  isCompleted: boolean;
  revision: number;
}

export const NEUTRAL_EULER_POSE: Readonly<EulerPose> = Object.freeze({
  pitch: 0,
  yaw: 0,
  roll: 0,
});

export function createNeutralPoseMap(): AvatarPoseMap {
  return {
    torso: { pitch: 0, yaw: 0, roll: 0 },
    neck: { pitch: 0, yaw: 0, roll: 0 },
    right_shoulder: { pitch: 0, yaw: 0, roll: 0 },
    right_elbow: { pitch: 0, yaw: 0, roll: 0 },
    right_wrist: { pitch: 0, yaw: 0, roll: 0 },
    left_shoulder: { pitch: 0, yaw: 0, roll: 0 },
    left_elbow: { pitch: 0, yaw: 0, roll: 0 },
    left_wrist: { pitch: 0, yaw: 0, roll: 0 },
  };
}

export function clonePoseMap(source: AvatarPoseMap): AvatarPoseMap {
  return {
    torso: { ...source.torso },
    neck: { ...source.neck },
    right_shoulder: { ...source.right_shoulder },
    right_elbow: { ...source.right_elbow },
    right_wrist: { ...source.right_wrist },
    left_shoulder: { ...source.left_shoulder },
    left_elbow: { ...source.left_elbow },
    left_wrist: { ...source.left_wrist },
  };
}

export function isPermittedJoint(jointName: string): jointName is PermittedJointName {
  return PERMITTED_JOINT_SET.has(jointName);
}

export function clampDeltaMs(rawDeltaMs: number, maxStepMs = 100): number {
  if (!Number.isFinite(rawDeltaMs) || rawDeltaMs <= 0) {
    return 0;
  }
  const boundedMax = Number.isFinite(maxStepMs) && maxStepMs > 0 ? maxStepMs : 100;
  return Math.min(rawDeltaMs, boundedMax);
}

/** Smooth C1-continuous ease weight on [0, 1] without overshoot. */
export function smoothstep(t: number): number {
  if (!Number.isFinite(t) || t <= 0) return 0;
  if (t >= 1) return 1;
  return t * t * (3 - 2 * t);
}

function sanitizeAngle(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function isNonZeroPose(pose: EulerPose): boolean {
  return pose.pitch !== 0 || pose.yaw !== 0 || pose.roll !== 0;
}

export function interpolatePoseMaps(
  fromPoses: AvatarPoseMap,
  toPoses: AvatarPoseMap,
  alpha: number
): AvatarPoseMap {
  const w = Math.max(0, Math.min(1, Number.isFinite(alpha) ? alpha : 0));
  const out = createNeutralPoseMap();
  for (const joint of PERMITTED_AVATAR_JOINTS) {
    const a = fromPoses[joint];
    const b = toPoses[joint];
    out[joint] = {
      pitch: a.pitch + (b.pitch - a.pitch) * w,
      yaw: a.yaw + (b.yaw - a.yaw) * w,
      roll: a.roll + (b.roll - a.roll) * w,
    };
  }
  return out;
}

interface PartialEulerPose {
  pitch?: number;
  yaw?: number;
  roll?: number;
}

interface RawMergedKeyframe {
  timeMs: number;
  explicitJoints: Partial<Record<PermittedJointName, PartialEulerPose>>;
  handShape: string;
  nonManualMarker: string;
}

export function hasPlayableDuration(timeline: SequenceTimeline): boolean {
  return timeline.segments.length > 0 && timeline.totalDurationMs > 0;
}

/**
 * Normalize one SignSequenceItem into dense chronological 8-joint keyframes.
 *
 * Applies binding R-03 sparse-joint & safety policies:
 * - Zero/non-finite durations collapse to a safe neutral 0 ms item.
 * - Empty keyframe lists synthesize a neutral hold across duration_ms.
 * - Uninitialized joints default to neutral (0, 0, 0).
 * - Omitted intermediate joints carry forward their last explicit pose.
 * - Omitted terminal joints that were displaced recover smoothly to neutral at duration_ms.
 */
export function normalizeSignTrack(item: SignSequenceItem): NormalizedSignTrack {
  const signId = typeof item?.sign_id === 'string' && item.sign_id ? item.sign_id : 'UNKNOWN';
  const movementType =
    typeof item?.movement_type === 'string' && item.movement_type ? item.movement_type : 'neutral_hold';

  const rawDuration = item?.duration_ms;
  if (typeof rawDuration !== 'number' || !Number.isFinite(rawDuration) || rawDuration <= 0) {
    return {
      signId,
      durationMs: 0,
      movementType,
      keyframes: [
        {
          timeMs: 0,
          poses: createNeutralPoseMap(),
          handShape: 'open_flat',
          nonManualMarker: 'neutral',
        },
      ],
      isDegenerate: true,
    };
  }

  const durationMs = rawDuration;
  const rawKeyframes: SignKeyframe[] = Array.isArray(item.keyframes) ? item.keyframes : [];

  // Parse, filter valid joints/angles, clamp timestamps, and merge duplicates.
  const mergedByTime = new Map<number, RawMergedKeyframe>();
  for (const kf of rawKeyframes) {
    if (!kf || typeof kf.time_offset_ms !== 'number' || !Number.isFinite(kf.time_offset_ms)) {
      continue;
    }
    const timeMs = Math.max(0, Math.min(durationMs, kf.time_offset_ms));
    const handShape = typeof kf.hand_shape === 'string' && kf.hand_shape ? kf.hand_shape : 'open_flat';
    const nonManualMarker =
      typeof kf.non_manual_marker === 'string' && kf.non_manual_marker
        ? kf.non_manual_marker
        : 'neutral';

    const existing = mergedByTime.get(timeMs) ?? {
      timeMs,
      explicitJoints: {},
      handShape,
      nonManualMarker,
    };
    existing.handShape = handShape;
    existing.nonManualMarker = nonManualMarker;

    if (Array.isArray(kf.joints)) {
      for (const target of kf.joints) {
        if (!target || typeof target.joint !== 'string' || !isPermittedJoint(target.joint)) {
          continue;
        }
        const prevPartial = existing.explicitJoints[target.joint] ?? {};
        const nextPartial: PartialEulerPose = { ...prevPartial };
        const pitch = sanitizeAngle(target.pitch);
        const yaw = sanitizeAngle(target.yaw);
        const roll = sanitizeAngle(target.roll);
        if (pitch !== null) nextPartial.pitch = pitch;
        if (yaw !== null) nextPartial.yaw = yaw;
        if (roll !== null) nextPartial.roll = roll;
        if (
          nextPartial.pitch !== undefined ||
          nextPartial.yaw !== undefined ||
          nextPartial.roll !== undefined
        ) {
          existing.explicitJoints[target.joint] = nextPartial;
        }
      }
    }
    mergedByTime.set(timeMs, existing);
  }

  const sortedFrames = Array.from(mergedByTime.values()).sort((a, b) => a.timeMs - b.timeMs);

  // Guard empty or completely corrupted keyframe arrays with a clean neutral hold.
  if (sortedFrames.length === 0) {
    return {
      signId,
      durationMs,
      movementType,
      keyframes: [
        {
          timeMs: 0,
          poses: createNeutralPoseMap(),
          handShape: 'open_flat',
          nonManualMarker: item.non_manual_marker || 'neutral',
        },
        {
          timeMs: durationMs,
          poses: createNeutralPoseMap(),
          handShape: 'open_flat',
          nonManualMarker: 'neutral',
        },
      ],
      isDegenerate: true,
    };
  }

  // Ensure timeline starts cleanly at t = 0 ms from neutral if first frame starts later.
  if (sortedFrames[0].timeMs > 0) {
    sortedFrames.unshift({
      timeMs: 0,
      explicitJoints: {},
      handShape: 'open_flat',
      nonManualMarker: 'neutral',
    });
  }

  const runningPose = createNeutralPoseMap();
  const displacedJoints = new Set<PermittedJointName>();
  const resolved: ResolvedKeyframe[] = [];

  for (let i = 0; i < sortedFrames.length; i += 1) {
    const raw = sortedFrames[i];
    const isFinalAtDuration = i === sortedFrames.length - 1 && raw.timeMs === durationMs;

    for (const joint of PERMITTED_AVATAR_JOINTS) {
      const explicit = raw.explicitJoints[joint];
      if (explicit) {
        runningPose[joint] = {
          pitch: explicit.pitch ?? runningPose[joint].pitch,
          yaw: explicit.yaw ?? runningPose[joint].yaw,
          roll: explicit.roll ?? runningPose[joint].roll,
        };
        if (isNonZeroPose(runningPose[joint])) {
          displacedJoints.add(joint);
        }
      } else if (isFinalAtDuration && displacedJoints.has(joint)) {
        // Binding Policy A: Omitted active joints at terminal frame restore smoothly to neutral.
        runningPose[joint] = { pitch: 0, yaw: 0, roll: 0 };
      }
      // Intermediate omissions carry forward runningPose[joint] unchanged.
    }

    resolved.push({
      timeMs: raw.timeMs,
      poses: clonePoseMap(runningPose),
      handShape: raw.handShape,
      nonManualMarker: raw.nonManualMarker,
    });
  }

  // Ensure terminal keyframe at durationMs exists and settles all joints to neutral.
  const lastResolved = resolved[resolved.length - 1];
  if (lastResolved.timeMs < durationMs) {
    resolved.push({
      timeMs: durationMs,
      poses: createNeutralPoseMap(),
      handShape: 'open_flat',
      nonManualMarker: 'neutral',
    });
  }

  return {
    signId,
    durationMs,
    movementType,
    keyframes: resolved,
    isDegenerate: false,
  };
}

/**
 * Compile an ordered sequence of backend SignSequenceItem objects into an
 * isolated, boundary-safe SequenceTimeline.
 */
export function buildSequenceTimeline(sequence: ReadonlyArray<SignSequenceItem>): SequenceTimeline {
  if (!Array.isArray(sequence) || sequence.length === 0) {
    return { segments: [], totalDurationMs: 0 };
  }

  const segments: TimelineSegment[] = [];
  let cursorMs = 0;

  for (let i = 0; i < sequence.length; i += 1) {
    const track = normalizeSignTrack(sequence[i]);
    const startMs = cursorMs;
    const endMs = startMs + track.durationMs;
    segments.push({
      signIndex: i,
      startMs,
      endMs,
      track,
    });
    cursorMs = endMs;
  }

  return {
    segments,
    totalDurationMs: cursorMs,
  };
}

export function sampleSignTrackAtLocalTime(
  track: NormalizedSignTrack,
  localMs: number
): { poses: AvatarPoseMap; handShape: string; nonManualMarker: string } {
  const frames = track.keyframes;
  if (frames.length === 0 || track.durationMs <= 0) {
    return {
      poses: createNeutralPoseMap(),
      handShape: frames[0]?.handShape ?? 'open_flat',
      nonManualMarker: frames[0]?.nonManualMarker ?? 'neutral',
    };
  }

  const clampedMs = Math.max(0, Math.min(track.durationMs, Number.isFinite(localMs) ? localMs : 0));
  if (clampedMs <= frames[0].timeMs || frames.length === 1) {
    return {
      poses: clonePoseMap(frames[0].poses),
      handShape: frames[0].handShape,
      nonManualMarker: frames[0].nonManualMarker,
    };
  }

  const lastIdx = frames.length - 1;
  if (clampedMs >= frames[lastIdx].timeMs) {
    return {
      poses: clonePoseMap(frames[lastIdx].poses),
      handShape: frames[lastIdx].handShape,
      nonManualMarker: frames[lastIdx].nonManualMarker,
    };
  }

  for (let i = 0; i < lastIdx; i += 1) {
    const kfA = frames[i];
    const kfB = frames[i + 1];
    if (clampedMs >= kfA.timeMs && clampedMs <= kfB.timeMs) {
      const span = kfB.timeMs - kfA.timeMs;
      if (span <= 0) {
        return {
          poses: clonePoseMap(kfB.poses),
          handShape: kfB.handShape,
          nonManualMarker: kfB.nonManualMarker,
        };
      }
      const alpha = smoothstep((clampedMs - kfA.timeMs) / span);
      return {
        poses: interpolatePoseMaps(kfA.poses, kfB.poses, alpha),
        handShape: alpha < 0.999 ? kfA.handShape : kfB.handShape,
        nonManualMarker: alpha < 0.5 ? kfA.nonManualMarker : kfB.nonManualMarker,
      };
    }
  }

  return {
    poses: clonePoseMap(frames[lastIdx].poses),
    handShape: frames[lastIdx].handShape,
    nonManualMarker: frames[lastIdx].nonManualMarker,
  };
}

/**
 * Sample the entire compiled SequenceTimeline at elapsedMs in [0, totalDurationMs].
 * Restores full neutral pose at empty sequences or completion.
 */
export function sampleTimelineAtTime(
  timeline: SequenceTimeline,
  elapsedMs: number
): TimelineSample {
  const { segments, totalDurationMs } = timeline;
  if (segments.length === 0 || totalDurationMs <= 0) {
    return {
      signIndex: 0,
      signId: segments[0]?.track.signId ?? null,
      movementType: segments[0]?.track.movementType ?? null,
      handShape: null,
      nonManualMarker: null,
      localMs: 0,
      poses: createNeutralPoseMap(),
      isComplete: segments.length > 0 && elapsedMs >= totalDurationMs,
    };
  }

  const safeElapsed = Number.isFinite(elapsedMs) ? elapsedMs : 0;
  if (safeElapsed >= totalDurationMs) {
    const lastSeg = segments[segments.length - 1];
    return {
      signIndex: lastSeg.signIndex,
      signId: lastSeg.track.signId,
      movementType: lastSeg.track.movementType,
      handShape: 'open_flat',
      nonManualMarker: 'neutral',
      localMs: lastSeg.track.durationMs,
      poses: createNeutralPoseMap(),
      isComplete: true,
    };
  }

  const clamped = Math.max(0, safeElapsed);
  for (const seg of segments) {
    if (seg.track.durationMs <= 0) continue;
    if (clamped < seg.endMs) {
      const localMs = clamped - seg.startMs;
      const sampled = sampleSignTrackAtLocalTime(seg.track, localMs);
      return {
        signIndex: seg.signIndex,
        signId: seg.track.signId,
        movementType: seg.track.movementType,
        handShape: sampled.handShape,
        nonManualMarker: sampled.nonManualMarker,
        localMs,
        poses: sampled.poses,
        isComplete: false,
      };
    }
  }

  const fallbackSeg = segments[segments.length - 1];
  return {
    signIndex: fallbackSeg.signIndex,
    signId: fallbackSeg.track.signId,
    movementType: fallbackSeg.track.movementType,
    handShape: 'open_flat',
    nonManualMarker: 'neutral',
    localMs: fallbackSeg.track.durationMs,
    poses: createNeutralPoseMap(),
    isComplete: true,
  };
}

export function resolveSignIndexAtTime(timeline: SequenceTimeline, elapsedMs: number): number {
  const { segments, totalDurationMs } = timeline;
  if (segments.length === 0) return 0;
  const safeElapsed = Number.isFinite(elapsedMs) ? Math.max(0, elapsedMs) : 0;
  if (totalDurationMs <= 0 || safeElapsed >= totalDurationMs) {
    return segments[segments.length - 1].signIndex;
  }
  for (const seg of segments) {
    if (seg.track.durationMs > 0 && safeElapsed < seg.endMs) {
      return seg.signIndex;
    }
  }
  return segments[segments.length - 1].signIndex;
}

export function createPlaybackState(
  sequence: ReadonlyArray<SignSequenceItem>,
  autoPlay = false
): TimelinePlaybackState {
  const timeline = buildSequenceTimeline(sequence);
  const canPlay = autoPlay && timeline.segments.length > 0 && timeline.totalDurationMs > 0;
  return {
    timeline,
    elapsedMs: 0,
    isPlaying: canPlay,
    activeSignIndex: 0,
    isCompleted: timeline.segments.length > 0 && timeline.totalDurationMs === 0,
    revision: 0,
  };
}

export function advancePlaybackState(
  state: TimelinePlaybackState,
  rawDeltaMs: number
): TimelinePlaybackState {
  if (!state.isPlaying || state.timeline.segments.length === 0) {
    return state;
  }
  if (state.timeline.totalDurationMs <= 0) {
    return {
      ...state,
      elapsedMs: 0,
      isPlaying: false,
      activeSignIndex: Math.max(0, state.timeline.segments.length - 1),
      isCompleted: true,
    };
  }

  const deltaMs = clampDeltaMs(rawDeltaMs, 100);
  const nextElapsed = state.elapsedMs + deltaMs;
  if (nextElapsed >= state.timeline.totalDurationMs) {
    return {
      ...state,
      elapsedMs: state.timeline.totalDurationMs,
      isPlaying: false,
      activeSignIndex: state.timeline.segments[state.timeline.segments.length - 1].signIndex,
      isCompleted: true,
    };
  }

  return {
    ...state,
    elapsedMs: nextElapsed,
    activeSignIndex: resolveSignIndexAtTime(state.timeline, nextElapsed),
    isCompleted: false,
  };
}

export function togglePlaybackState(state: TimelinePlaybackState): TimelinePlaybackState {
  if (state.timeline.segments.length === 0) {
    return { ...state, isPlaying: false, isCompleted: false };
  }
  if (state.timeline.totalDurationMs <= 0) {
    return {
      ...state,
      elapsedMs: 0,
      isPlaying: false,
      activeSignIndex: state.timeline.segments[state.timeline.segments.length - 1].signIndex,
      isCompleted: true,
      revision: state.revision + 1,
    };
  }
  if (state.isPlaying) {
    return { ...state, isPlaying: false };
  }
  if (state.isCompleted || state.elapsedMs >= state.timeline.totalDurationMs) {
    return {
      ...state,
      elapsedMs: 0,
      activeSignIndex: 0,
      isPlaying: true,
      isCompleted: false,
      revision: state.revision + 1,
    };
  }
  return { ...state, isPlaying: true };
}

export function pausePlaybackState(state: TimelinePlaybackState): TimelinePlaybackState {
  return state.isPlaying ? { ...state, isPlaying: false } : state;
}

export function resetPlaybackState(state: TimelinePlaybackState): TimelinePlaybackState {
  return {
    ...state,
    elapsedMs: 0,
    isPlaying: false,
    activeSignIndex: 0,
    isCompleted: false,
    revision: state.revision + 1,
  };
}

export function seekPlaybackToSign(
  state: TimelinePlaybackState,
  signIndex: number
): TimelinePlaybackState {
  const segments = state.timeline.segments;
  if (segments.length === 0) {
    return resetPlaybackState(state);
  }
  const safeIndex = Math.max(0, Math.min(segments.length - 1, Math.trunc(signIndex)));
  const startMs = segments[safeIndex].startMs;
  const atEnd =
    state.timeline.totalDurationMs <= 0 || startMs >= state.timeline.totalDurationMs;
  return {
    ...state,
    elapsedMs: Math.min(startMs, state.timeline.totalDurationMs),
    activeSignIndex: safeIndex,
    isPlaying: atEnd ? false : state.isPlaying,
    isCompleted: atEnd,
    revision: state.revision + 1,
  };
}
