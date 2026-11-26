# MIRA-H: Dataset Management & Signer-Disjoint Evaluation Guide

## 1. Candidate Datasets
- **ISL**:
  - `ISLTranslate`: Continuous sentence videos with aligned gloss annotations.
  - `iSign`: Isolated sign dictionary recording.
- **ASL**:
  - `ASL Citizen`: 83k+ isolated sign videos across 52 signers with CC BY 4.0 license.
  - `How2Sign`: Multimodal continuous signing corpus.

## 2. Preventing Data Leakage
To ensure realistic evaluation, training and testing splits must be partitioned strictly by **signer identity**:
1. Run `python ml/scripts/generate_signer_disjoint_split.py` to create disjoint subsets.
2. Signers present in the training set must never appear in validation or testing.
3. Preprocessing must be uniformly applied via `python ml/scripts/preprocess_landmarks.py`.
