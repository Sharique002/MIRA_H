#!/usr/bin/env python3
"""
MIRA-H: Landmark Preprocessing & Normalization Pipeline
Applies translation centering relative to wrist (joint 0), scale normalization by hand span,
and temporal resampling to fixed sequence length T=30.
"""

import numpy as np
from typing import List, Dict, Any

TARGET_TEMPORAL_FRAMES = 30
JOINTS_PER_HAND = 21
COORDINATES_PER_JOINT = 3

def normalize_single_hand_landmarks(landmarks: np.ndarray) -> np.ndarray:
    """
    Normalizes a single hand landmark array of shape (21, 3).
    - Centers wrist at (0, 0, 0)
    - Scales by maximum coordinate spread across hand
    """
    if landmarks.shape != (JOINTS_PER_HAND, COORDINATES_PER_JOINT):
        raise ValueError(f"Expected shape ({JOINTS_PER_HAND}, {COORDINATES_PER_JOINT}), got {landmarks.shape}")

    # Center at wrist
    wrist = landmarks[0:1, :]
    centered = landmarks - wrist

    # Scale normalization
    span = np.max(np.ptp(centered[:, :2], axis=0))
    scale = max(span, 1e-4)

    normalized = centered / scale
    return normalized

def resample_temporal_sequence(sequence: np.ndarray, target_length: int = TARGET_TEMPORAL_FRAMES) -> np.ndarray:
    """
    Resamples variable length sequence (N, D) to fixed target_length (T, D) via linear interpolation.
    """
    orig_length = len(sequence)
    if orig_length == 0:
        return np.zeros((target_length, sequence.shape[1] if sequence.ndim > 1 else 0))
    if orig_length == target_length:
        return sequence

    orig_indices = np.linspace(0, orig_length - 1, orig_length)
    target_indices = np.linspace(0, orig_length - 1, target_length)

    resampled = np.empty((target_length, sequence.shape[1]), dtype=np.float32)
    for dim in range(sequence.shape[1]):
        resampled[:, dim] = np.interp(target_indices, orig_indices, sequence[:, dim])

    return resampled

if __name__ == "__main__":
    print("[MIRA-H Preprocessing Engine] Testing synthetic landmark normalization...")
    dummy_hand = np.random.uniform(0.4, 0.7, (21, 3))
    norm_hand = normalize_single_hand_landmarks(dummy_hand)
    assert norm_hand[0, 0] == 0.0 and norm_hand[0, 1] == 0.0, "Wrist centering failed"

    dummy_seq = np.random.uniform(-1.0, 1.0, (18, 63))
    resampled = resample_temporal_sequence(dummy_seq, TARGET_TEMPORAL_FRAMES)
    assert resampled.shape == (30, 63), f"Resample target failed: {resampled.shape}"
    print(f"[PASSED] Pipeline verified: Shape={resampled.shape}, Wrist centered at (0,0,0).")
