import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import type { SignSequenceItem } from '../../types';

const require = createRequire(import.meta.url);
const timelineMod = require('./keyframeTimeline.ts') as typeof import('./keyframeTimeline');

const {
  PERMITTED_AVATAR_JOINTS,
  buildSequenceTimeline,
  sampleTimelineAtTime,
  createPlaybackState,
  advancePlaybackState,
  togglePlaybackState,
  pausePlaybackState,
  resetPlaybackState,
  seekPlaybackToSign,
  hasPlayableDuration,
  clampDeltaMs,
  createNeutralPoseMap,
} = timelineMod;

function assertAllNeutral(poses: ReturnType<typeof createNeutralPoseMap>, tol = 1e-9) {
  for (const joint of PERMITTED_AVATAR_JOINTS) {
    assert.ok(Math.abs(poses[joint].pitch) <= tol, `${joint}.pitch expected 0, got ${poses[joint].pitch}`);
    assert.ok(Math.abs(poses[joint].yaw) <= tol, `${joint}.yaw expected 0, got ${poses[joint].yaw}`);
    assert.ok(Math.abs(poses[joint].roll) <= tol, `${joint}.roll expected 0, got ${poses[joint].roll}`);
  }
}

function makeR02IslYes(): SignSequenceItem {
  return {
    sign_id: 'YES',
    temporal_order: 0,
    duration_ms: 700,
    hand_configuration: 'isl_closed_fist_thumb_up',
    movement_type: 'isl_wrist_nod_and_head_nod',
    body_position: 'upright_neutral',
    non_manual_marker: 'affirmative_head_nod',
    spatial_reference: 'chest_right_front',
    keyframes: [
      {
        time_offset_ms: 0,
        hand_shape: 'isl_fist_affirm',
        non_manual_marker: 'affirmative_head_nod',
        joints: [
          { joint: 'right_shoulder', pitch: -0.3, yaw: 0.1, roll: 0.0 },
          { joint: 'right_elbow', pitch: 1.35, yaw: 0.0, roll: 0.0 },
          { joint: 'right_wrist', pitch: 0.2, yaw: 0.0, roll: 0.0 },
          { joint: 'neck', pitch: 0.18, yaw: 0.0, roll: 0.0 },
        ],
      },
      {
        time_offset_ms: 700,
        hand_shape: 'open_flat',
        non_manual_marker: 'neutral',
        joints: [
          { joint: 'right_shoulder', pitch: 0.0, yaw: 0.0, roll: 0.0 },
          { joint: 'right_elbow', pitch: 0.0, yaw: 0.0, roll: 0.0 },
          { joint: 'right_wrist', pitch: 0.0, yaw: 0.0, roll: 0.0 },
          { joint: 'neck', pitch: 0.0, yaw: 0.0, roll: 0.0 },
        ],
      },
    ],
  };
}

function makeR02IslNamaste(): SignSequenceItem {
  return {
    sign_id: 'NAMASTE',
    temporal_order: 0,
    duration_ms: 1200,
    hand_configuration: 'isl_two_hands_anjali_mudra',
    movement_type: 'isl_palms_joined_chest_bow',
    body_position: 'slight_forward_torso_bow',
    non_manual_marker: 'reverent_head_bow',
    spatial_reference: 'chest_center',
    keyframes: [
      {
        time_offset_ms: 0,
        hand_shape: 'anjali_palms_together',
        non_manual_marker: 'neutral',
        joints: [
          { joint: 'left_shoulder', pitch: -0.4, yaw: -0.3, roll: 0.0 },
          { joint: 'right_shoulder', pitch: -0.4, yaw: 0.3, roll: 0.0 },
          { joint: 'left_elbow', pitch: 1.6, yaw: 0.0, roll: 0.0 },
          { joint: 'right_elbow', pitch: 1.6, yaw: 0.0, roll: 0.0 },
        ],
      },
      {
        time_offset_ms: 650,
        hand_shape: 'anjali_palms_together',
        non_manual_marker: 'reverent_head_bow',
        joints: [
          { joint: 'neck', pitch: 0.22, yaw: 0.0, roll: 0.0 },
          { joint: 'torso', pitch: 0.08, yaw: 0.0, roll: 0.0 },
          { joint: 'left_elbow', pitch: 1.75, yaw: 0.0, roll: 0.0 },
          { joint: 'right_elbow', pitch: 1.75, yaw: 0.0, roll: 0.0 },
        ],
      },
      {
        time_offset_ms: 1200,
        hand_shape: 'open_flat',
        non_manual_marker: 'neutral',
        joints: [
          { joint: 'neck', pitch: 0.0, yaw: 0.0, roll: 0.0 },
          { joint: 'torso', pitch: 0.0, yaw: 0.0, roll: 0.0 },
          { joint: 'left_shoulder', pitch: 0.0, yaw: 0.0, roll: 0.0 },
          { joint: 'right_shoulder', pitch: 0.0, yaw: 0.0, roll: 0.0 },
        ],
      },
    ],
  };
}

function makeR02AslHelp(): SignSequenceItem {
  return {
    sign_id: 'HELP',
    temporal_order: 0,
    duration_ms: 900,
    hand_configuration: 'asl_a_fist_on_open_left_palm',
    movement_type: 'asl_upward_lift_left_palm_right_fist',
    body_position: 'upright_neutral',
    non_manual_marker: 'supportive_nod',
    spatial_reference: 'chest_center',
    keyframes: [
      {
        time_offset_ms: 0,
        hand_shape: 'asl_a_fist_palm',
        non_manual_marker: 'supportive_nod',
        joints: [
          { joint: 'left_shoulder', pitch: -0.32, yaw: -0.15, roll: 0.0 },
          { joint: 'left_elbow', pitch: 1.3, yaw: 0.0, roll: 0.0 },
          { joint: 'right_shoulder', pitch: -0.38, yaw: 0.1, roll: 0.0 },
          { joint: 'right_elbow', pitch: 1.5, yaw: 0.0, roll: 0.0 },
        ],
      },
      {
        time_offset_ms: 450,
        hand_shape: 'asl_a_fist_palm',
        non_manual_marker: 'supportive_nod',
        joints: [
          { joint: 'left_shoulder', pitch: -0.55, yaw: -0.15, roll: 0.0 },
          { joint: 'right_shoulder', pitch: -0.6, yaw: 0.1, roll: 0.0 },
        ],
      },
      {
        time_offset_ms: 900,
        hand_shape: 'open_flat',
        non_manual_marker: 'neutral',
        joints: [
          { joint: 'left_shoulder', pitch: 0.0, yaw: 0.0, roll: 0.0 },
          { joint: 'left_elbow', pitch: 0.0, yaw: 0.0, roll: 0.0 },
          { joint: 'right_shoulder', pitch: 0.0, yaw: 0.0, roll: 0.0 },
          { joint: 'right_elbow', pitch: 0.0, yaw: 0.0, roll: 0.0 },
        ],
      },
    ],
  };
}

function makeR02AslHello(): SignSequenceItem {
  return {
    sign_id: 'HELLO',
    temporal_order: 0,
    duration_ms: 900,
    hand_configuration: 'asl_flat_b_palm_outward',
    movement_type: 'asl_forehead_salute_arc',
    body_position: 'upright_neutral',
    non_manual_marker: 'friendly_smile',
    spatial_reference: 'right_temple_to_side',
    keyframes: [
      {
        time_offset_ms: 0,
        hand_shape: 'asl_flat_b',
        non_manual_marker: 'friendly_smile',
        joints: [
          { joint: 'right_shoulder', pitch: -0.5, yaw: 0.25, roll: 0.35 },
          { joint: 'right_elbow', pitch: 1.7, yaw: 0.0, roll: 0.0 },
          { joint: 'right_wrist', pitch: -0.1, yaw: 0.15, roll: 0.0 },
        ],
      },
      {
        time_offset_ms: 450,
        hand_shape: 'asl_flat_b',
        non_manual_marker: 'friendly_smile',
        joints: [
          { joint: 'right_shoulder', pitch: -0.35, yaw: 0.55, roll: 0.55 },
          { joint: 'right_elbow', pitch: 1.15, yaw: 0.2, roll: 0.0 },
          { joint: 'right_wrist', pitch: 0.05, yaw: 0.3, roll: 0.0 },
        ],
      },
      {
        time_offset_ms: 900,
        hand_shape: 'open_flat',
        non_manual_marker: 'neutral',
        joints: [
          { joint: 'right_shoulder', pitch: 0.0, yaw: 0.0, roll: 0.0 },
          { joint: 'right_elbow', pitch: 0.0, yaw: 0.0, roll: 0.0 },
          { joint: 'right_wrist', pitch: 0.0, yaw: 0.0, roll: 0.0 },
        ],
      },
    ],
  };
}

test('AT-U01: two-keyframe smooth interpolation for ISL YES', () => {
  const tl = buildSequenceTimeline([makeR02IslYes()]);
  assert.equal(tl.totalDurationMs, 700);

  const s0 = sampleTimelineAtTime(tl, 0);
  assert.ok(Math.abs(s0.poses.right_wrist.pitch - 0.2) < 1e-9);
  assert.ok(Math.abs(s0.poses.neck.pitch - 0.18) < 1e-9);

  // Midpoint t=0.5 => smoothstep(0.5)=0.5
  const sMid = sampleTimelineAtTime(tl, 350);
  assert.ok(Math.abs(sMid.poses.right_wrist.pitch - 0.1) < 1e-6);
  assert.ok(Math.abs(sMid.poses.neck.pitch - 0.09) < 1e-6);

  const sEnd = sampleTimelineAtTime(tl, 700);
  assert.equal(sEnd.isComplete, true);
  assertAllNeutral(sEnd.poses);
});

test('AT-U02 & AT-U05: three-keyframe unequal intervals and terminal missing-joint neutral restoration (ISL NAMASTE)', () => {
  const tl = buildSequenceTimeline([makeR02IslNamaste()]);
  assert.equal(tl.totalDurationMs, 1200);

  // Uninitialized neck/torso at t=0 starts neutral, reaches peak at 650 ms
  const sStart = sampleTimelineAtTime(tl, 0);
  assert.equal(sStart.poses.neck.pitch, 0);
  assert.equal(sStart.poses.torso.pitch, 0);

  const sPeak = sampleTimelineAtTime(tl, 650);
  assert.ok(Math.abs(sPeak.poses.neck.pitch - 0.22) < 1e-6);
  assert.ok(Math.abs(sPeak.poses.torso.pitch - 0.08) < 1e-6);
  // Intermediate omitted shoulders carried forward from t=0 ms
  assert.ok(Math.abs(sPeak.poses.left_shoulder.pitch - (-0.4)) < 1e-6);
  assert.ok(Math.abs(sPeak.poses.right_shoulder.yaw - 0.3) < 1e-6);
  assert.ok(Math.abs(sPeak.poses.left_elbow.pitch - 1.75) < 1e-6);

  // Midpoint of asymmetric 650..1200 span = 925 ms: omitted terminal elbows restore smoothly toward 0
  const sReturnMid = sampleTimelineAtTime(tl, 925);
  assert.ok(Math.abs(sReturnMid.poses.left_elbow.pitch - 0.875) < 1e-6);
  assert.ok(Math.abs(sReturnMid.poses.right_elbow.pitch - 0.875) < 1e-6);

  // Exact completion restores all 8 joints cleanly to neutral
  const sEnd = sampleTimelineAtTime(tl, 1200);
  assert.equal(sEnd.isComplete, true);
  assertAllNeutral(sEnd.poses);
});

test('AT-U03 & AT-U04: all eight joints & intermediate carry-forward (ASL HELP)', () => {
  const allEightSign: SignSequenceItem = {
    sign_id: 'ALL_EIGHT',
    temporal_order: 0,
    duration_ms: 400,
    hand_configuration: 'test',
    movement_type: 'test',
    body_position: 'upright_neutral',
    spatial_reference: 'chest_center',
    keyframes: [
      {
        time_offset_ms: 0,
        hand_shape: 'open_flat',
        joints: PERMITTED_AVATAR_JOINTS.map((joint, idx) => ({
          joint,
          pitch: (idx + 1) * 0.1,
          yaw: -(idx + 1) * 0.05,
          roll: (idx + 1) * 0.02,
        })),
      },
      {
        time_offset_ms: 400,
        hand_shape: 'open_flat',
        joints: PERMITTED_AVATAR_JOINTS.map((joint) => ({
          joint,
          pitch: 0,
          yaw: 0,
          roll: 0,
        })),
      },
    ],
  };

  const tlEight = buildSequenceTimeline([allEightSign]);
  const sMid = sampleTimelineAtTime(tlEight, 200);
  PERMITTED_AVATAR_JOINTS.forEach((joint, idx) => {
    assert.ok(Math.abs(sMid.poses[joint].pitch - (idx + 1) * 0.05) < 1e-6);
    assert.ok(Math.abs(sMid.poses[joint].yaw - -(idx + 1) * 0.025) < 1e-6);
    assert.ok(Math.abs(sMid.poses[joint].roll - (idx + 1) * 0.01) < 1e-6);
  });

  // Intermediate omitted elbows in ASL:HELP hold 1.3 / 1.5 at 450 ms, then settle to 0 at 900 ms
  const tlHelp = buildSequenceTimeline([makeR02AslHelp()]);
  const helpAt450 = sampleTimelineAtTime(tlHelp, 450);
  assert.ok(Math.abs(helpAt450.poses.left_elbow.pitch - 1.3) < 1e-6);
  assert.ok(Math.abs(helpAt450.poses.right_elbow.pitch - 1.5) < 1e-6);
  assert.ok(Math.abs(helpAt450.poses.left_shoulder.pitch - (-0.55)) < 1e-6);
});

test('AT-U06 & AT-U14: boundary isolation across multi-sign sequences and ISL vs ASL divergence', () => {
  const islSeq = buildSequenceTimeline([makeR02IslNamaste(), makeR02IslYes()]);
  const aslSeq = buildSequenceTimeline([makeR02AslHello(), makeR02AslHelp()]);
  assert.equal(islSeq.totalDurationMs, 1900);
  assert.equal(aslSeq.totalDurationMs, 1800);

  // Just before boundary (NAMASTE active, left arm lifted)
  const beforeBoundary = sampleTimelineAtTime(islSeq, 1199);
  assert.equal(beforeBoundary.signIndex, 0);
  assert.equal(beforeBoundary.signId, 'NAMASTE');

  // Inside second sign YES (only right_* and neck defined; left_* must remain 0, no NAMASTE leakage)
  const inSecond = sampleTimelineAtTime(islSeq, 1250);
  assert.equal(inSecond.signIndex, 1);
  assert.equal(inSecond.signId, 'YES');
  assert.equal(inSecond.poses.left_shoulder.pitch, 0);
  assert.equal(inSecond.poses.left_elbow.pitch, 0);
  assert.equal(inSecond.poses.torso.pitch, 0);

  // ASL HELLO vs ISL NAMASTE start poses remain distinct
  const islStart = sampleTimelineAtTime(islSeq, 0);
  const aslStart = sampleTimelineAtTime(aslSeq, 0);
  assert.notEqual(islStart.signId, aslStart.signId);
  assert.equal(islStart.poses.left_elbow.pitch, 1.6);
  assert.equal(aslStart.poses.left_elbow.pitch, 0);
});

test('AT-U07, AT-U08, AT-U09, AT-U13: playback progression, pause/resume, clamping, restart, reset, and seek', () => {
  let state = createPlaybackState([makeR02IslNamaste(), makeR02IslYes()], true);
  assert.equal(state.isPlaying, true);
  assert.equal(state.activeSignIndex, 0);

  // Advance with clamped tab-jump delta (>100 ms gets clamped to 100 ms)
  assert.equal(clampDeltaMs(2500), 100);
  state = advancePlaybackState(state, 2500);
  assert.equal(state.elapsedMs, 100);

  // Pause freezes elapsed time
  state = togglePlaybackState(state);
  assert.equal(state.isPlaying, false);
  const pausedState = advancePlaybackState(state, 50);
  assert.equal(pausedState.elapsedMs, 100);

  // Resume advances across sign boundary at cumulative 1200 ms
  state = togglePlaybackState(state);
  assert.equal(state.isPlaying, true);
  for (let i = 0; i < 12; i += 1) {
    state = advancePlaybackState(state, 100);
  }
  assert.equal(state.elapsedMs, 1300);
  assert.equal(state.activeSignIndex, 1);

  // Advance to exact completion
  for (let i = 0; i < 10; i += 1) {
    state = advancePlaybackState(state, 100);
  }
  assert.equal(state.elapsedMs, 1900);
  assert.equal(state.isPlaying, false);
  assert.equal(state.isCompleted, true);
  assertAllNeutral(sampleTimelineAtTime(state.timeline, state.elapsedMs).poses);

  // Toggle Play at completion restarts cleanly from 0 ms / index 0
  state = togglePlaybackState(state);
  assert.equal(state.isPlaying, true);
  assert.equal(state.elapsedMs, 0);
  assert.equal(state.activeSignIndex, 0);
  assert.equal(state.isCompleted, false);

  // Seek directly to sign 1 and bump revision
  const prevRev = state.revision;
  state = seekPlaybackToSign(state, 1);
  assert.equal(state.elapsedMs, 1200);
  assert.equal(state.activeSignIndex, 1);
  assert.ok(state.revision > prevRev);

  // Reset restores elapsed=0, index=0, paused
  state = resetPlaybackState(state);
  assert.equal(state.elapsedMs, 0);
  assert.equal(state.activeSignIndex, 0);
  assert.equal(state.isPlaying, false);
  assert.equal(state.isCompleted, false);
});

test('AT-U10, AT-U11, AT-U12: empty sequence, empty keyframes, invalid durations, duplicate/unsorted timestamps, NaN & bad joints', () => {
  // Empty sequence
  const emptyTl = buildSequenceTimeline([]);
  assert.equal(emptyTl.totalDurationMs, 0);
  assertAllNeutral(sampleTimelineAtTime(emptyTl, 0).poses);

  // Missing/empty keyframes
  const missingKfTl = buildSequenceTimeline([
    {
      sign_id: 'WATER',
      temporal_order: 0,
      duration_ms: 800,
      hand_configuration: 'cupped',
      movement_type: 'tilt',
      body_position: 'upright_neutral',
      spatial_reference: 'lower_face_lips',
      keyframes: [],
    },
  ]);
  assert.equal(missingKfTl.totalDurationMs, 800);
  assertAllNeutral(sampleTimelineAtTime(missingKfTl, 400).poses);

  // Degenerate durations, negative/duplicate timestamps, NaN pitch, unknown joint string
  const corrupted: SignSequenceItem[] = [
    {
      sign_id: 'BAD_ZERO',
      temporal_order: 0,
      duration_ms: 0,
      hand_configuration: 'x',
      movement_type: 'y',
      body_position: 'upright_neutral',
      spatial_reference: 'chest_center',
      keyframes: [
        {
          time_offset_ms: 0,
          hand_shape: 'open_flat',
          joints: [{ joint: 'neck', pitch: 1.0, yaw: 0, roll: 0 }],
        },
      ],
    },
    {
      sign_id: 'CORRUPT_TIMESTAMPS',
      temporal_order: 1,
      duration_ms: 500,
      hand_configuration: 'x',
      movement_type: 'y',
      body_position: 'upright_neutral',
      spatial_reference: 'chest_center',
      keyframes: [
        {
          time_offset_ms: 400,
          hand_shape: 'open_flat',
          joints: [
            { joint: 'neck', pitch: Number.NaN, yaw: 0.2, roll: 0 },
            { joint: 'invalid_finger' as string, pitch: 99, yaw: 99, roll: 99 },
          ],
        },
        {
          time_offset_ms: -10,
          hand_shape: 'open_flat',
          joints: [{ joint: 'right_wrist', pitch: 0.4, yaw: 0, roll: 0 }],
        },
        {
          time_offset_ms: 400,
          hand_shape: 'open_flat',
          joints: [{ joint: 'right_wrist', pitch: 0.2, yaw: 0, roll: 0 }],
        },
      ],
    },
  ];

  const badTl = buildSequenceTimeline(corrupted);
  assert.equal(badTl.totalDurationMs, 500);
  for (const t of [0, 150, 400, 450, 500]) {
    const s = sampleTimelineAtTime(badTl, t);
    for (const joint of PERMITTED_AVATAR_JOINTS) {
      assert.ok(Number.isFinite(s.poses[joint].pitch));
      assert.ok(Number.isFinite(s.poses[joint].yaw));
      assert.ok(Number.isFinite(s.poses[joint].roll));
    }
  }
  assertAllNeutral(sampleTimelineAtTime(badTl, 500).poses);
});

test('AT-U15 (R03-FND-01): all-zero, single-zero, mixed zero+positive durations, replay & pause after completion, and empty sequence', () => {
  const zeroSign = (id: string, durationMs = 0): SignSequenceItem => ({
    sign_id: id,
    temporal_order: 0,
    duration_ms: durationMs,
    hand_configuration: 'zero',
    movement_type: 'zero',
    body_position: 'upright_neutral',
    spatial_reference: 'chest_center',
    keyframes: [
      {
        time_offset_ms: 0,
        hand_shape: 'open_flat',
        joints: [{ joint: 'right_elbow', pitch: 1.2, yaw: 0, roll: 0 }],
      },
    ],
  });

  // 1. All-zero-duration multi-sign sequence
  const allZeroSeq = [zeroSign('Z1', 0), zeroSign('Z2', -50)];
  let zeroState = createPlaybackState(allZeroSeq, true);
  assert.equal(hasPlayableDuration(zeroState.timeline), false);
  assert.equal(zeroState.timeline.totalDurationMs, 0);
  assert.equal(zeroState.isPlaying, false);
  assert.equal(zeroState.isCompleted, true);
  assertAllNeutral(sampleTimelineAtTime(zeroState.timeline, 0).poses);

  // Replay attempt after immediate completion cannot enter playing state
  const prevRevZero = zeroState.revision;
  zeroState = togglePlaybackState(zeroState);
  assert.equal(zeroState.isPlaying, false);
  assert.equal(zeroState.isCompleted, true);
  assert.ok(zeroState.revision > prevRevZero);

  // 2. Single zero-duration sign
  const singleZero = createPlaybackState([zeroSign('ONLY_ZERO', 0)], true);
  assert.equal(hasPlayableDuration(singleZero.timeline), false);
  assert.equal(singleZero.isPlaying, false);
  assert.equal(singleZero.isCompleted, true);
  const pausedCompleted = pausePlaybackState(singleZero);
  assert.equal(pausedCompleted.isPlaying, false);
  assert.equal(pausedCompleted.isCompleted, true);

  // 3. Mixed zero-duration and positive-duration signs
  const mixedSeq = [
    zeroSign('Z_START', 0),
    makeR02IslYes(), // 700 ms (index 1)
    zeroSign('Z_MID', 0),
    makeR02AslHello(), // 900 ms (index 3)
    zeroSign('Z_END', 0),
  ];
  let mixedState = createPlaybackState(mixedSeq, true);
  assert.equal(hasPlayableDuration(mixedState.timeline), true);
  assert.equal(mixedState.timeline.totalDurationMs, 1600);
  assert.equal(mixedState.isPlaying, true);
  assert.equal(sampleTimelineAtTime(mixedState.timeline, 0).signIndex, 1);

  for (let i = 0; i < 8; i += 1) {
    mixedState = advancePlaybackState(mixedState, 100);
  }
  assert.equal(mixedState.elapsedMs, 800);
  assert.equal(mixedState.activeSignIndex, 3);

  for (let i = 0; i < 10; i += 1) {
    mixedState = advancePlaybackState(mixedState, 100);
  }
  assert.equal(mixedState.elapsedMs, 1600);
  assert.equal(mixedState.isPlaying, false);
  assert.equal(mixedState.isCompleted, true);
  assertAllNeutral(sampleTimelineAtTime(mixedState.timeline, mixedState.elapsedMs).poses);

  // Seeking directly to trailing zero-duration sign settles safely as completed
  const seekEndZero = seekPlaybackToSign(mixedState, 4);
  assert.equal(seekEndZero.isPlaying, false);
  assert.equal(seekEndZero.isCompleted, true);
  assert.equal(seekEndZero.elapsedMs, 1600);

  // 4. Pause after completion remains non-playing; explicit replay restarts positive sequence
  const afterPauseComplete = pausePlaybackState(mixedState);
  assert.equal(afterPauseComplete.isPlaying, false);
  assert.equal(afterPauseComplete.isCompleted, true);
  const replayed = togglePlaybackState(mixedState);
  assert.equal(replayed.isPlaying, true);
  assert.equal(replayed.elapsedMs, 0);
  assert.equal(replayed.isCompleted, false);

  // 5. Empty sequence safety
  let emptyState = createPlaybackState([], true);
  assert.equal(hasPlayableDuration(emptyState.timeline), false);
  assert.equal(emptyState.isPlaying, false);
  assert.equal(emptyState.isCompleted, false);
  emptyState = togglePlaybackState(emptyState);
  assert.equal(emptyState.isPlaying, false);
  emptyState = pausePlaybackState(emptyState);
  assert.equal(emptyState.isPlaying, false);
});

test('AT-U16 (R03-FND-04): non-finite NaN/Infinity axis does not overwrite prior explicit valid pose & continuous terminal settle', () => {
  const preserveSign: SignSequenceItem = {
    sign_id: 'NAN_PRESERVE',
    temporal_order: 0,
    duration_ms: 600,
    hand_configuration: 'test',
    movement_type: 'test',
    body_position: 'upright_neutral',
    spatial_reference: 'chest_center',
    keyframes: [
      {
        time_offset_ms: 0,
        hand_shape: 'open_flat',
        joints: [{ joint: 'neck', pitch: 0.6, yaw: 0.1, roll: 0 }],
      },
      {
        time_offset_ms: 300,
        hand_shape: 'open_flat',
        joints: [{ joint: 'neck', pitch: Number.NaN, yaw: Number.POSITIVE_INFINITY, roll: 0.25 }],
      },
    ],
  };

  const tl = buildSequenceTimeline([preserveSign]);
  // At 300 ms, valid prior pitch (0.6) and yaw (0.1) stay preserved rather than being wiped to 0
  const atMid = sampleTimelineAtTime(tl, 300);
  assert.ok(Math.abs(atMid.poses.neck.pitch - 0.6) < 1e-6);
  assert.ok(Math.abs(atMid.poses.neck.yaw - 0.1) < 1e-6);
  assert.ok(Math.abs(atMid.poses.neck.roll - 0.25) < 1e-6);

  // Settle smoothly to neutral without snapping right before duration_ms
  const justBeforeEnd = sampleTimelineAtTime(tl, 599);
  assert.ok(Math.abs(justBeforeEnd.poses.neck.pitch) < 0.01);
  assert.ok(Math.abs(justBeforeEnd.poses.neck.roll) < 0.01);
  assertAllNeutral(sampleTimelineAtTime(tl, 600).poses);

  // Real ISL NAMASTE approaches 0 continuously prior to 1200 ms without terminal snap
  const namasteTl = buildSequenceTimeline([makeR02IslNamaste()]);
  const namasteNearEnd = sampleTimelineAtTime(namasteTl, 1195);
  assert.ok(Math.abs(namasteNearEnd.poses.left_elbow.pitch) < 0.01);
  assert.ok(Math.abs(namasteNearEnd.poses.neck.pitch) < 0.01);
});
