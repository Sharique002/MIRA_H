#!/usr/bin/env python3
"""
MIRA-H: Signer-Disjoint Partition Generator
Partitions samples strictly by signer ID to ensure zero data leakage between train/val/test splits.
"""

import json
import random
from typing import Dict, List, Any

def create_signer_disjoint_split(
    samples: List[Dict[str, Any]],
    train_ratio: float = 0.70,
    val_ratio: float = 0.15,
    seed: int = 42
) -> Dict[str, List[Dict[str, Any]]]:
    random.seed(seed)
    
    # Collect unique signers
    signers = list(set(s["signer_id"] for s in samples))
    random.shuffle(signers)

    n_total = len(signers)
    n_train = int(n_total * train_ratio)
    n_val = int(n_total * val_ratio)

    train_signers = set(signers[:n_train])
    val_signers = set(signers[n_train:n_train + n_val])
    test_signers = set(signers[n_train + n_val:])

    split_result = {
        "train": [s for s in samples if s["signer_id"] in train_signers],
        "val": [s for s in samples if s["signer_id"] in val_signers],
        "test": [s for s in samples if s["signer_id"] in test_signers]
    }

    # Verify zero leakage
    train_set = set(s["signer_id"] for s in split_result["train"])
    val_set = set(s["signer_id"] for s in split_result["val"])
    test_set = set(s["signer_id"] for s in split_result["test"])

    assert len(train_set.intersection(val_set)) == 0, "Leakage between train and val"
    assert len(train_set.intersection(test_set)) == 0, "Leakage between train and test"
    assert len(val_set.intersection(test_set)) == 0, "Leakage between val and test"

    return split_result

if __name__ == "__main__":
    print("[MIRA-H Disjoint Splitter] Simulating signer dataset partition...")
    mock_samples = [
        {"sample_id": f"samp-{i}", "signer_id": f"signer-{(i % 20) + 1}", "gloss": "NAMASTE"}
        for i in range(200)
    ]
    splits = create_signer_disjoint_split(mock_samples)
    print(f"[PASSED] Signer-disjoint partition verified: Train={len(splits['train'])}, Val={len(splits['val'])}, Test={len(splits['test'])}.")
