import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["service"] == "MIRA-H Core API"

def test_health_endpoint():
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["data"]["status"] == "healthy"
    assert "correlation_id" in data

def test_system_status():
    response = client.get("/api/v1/system/status")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "cpu" in data["data"]
    assert "memory" in data["data"]
    assert "models" in data["data"]

def test_session_lifecycle():
    # 1. Create Session
    create_payload = {
        "sign_language": "ISL",
        "spoken_language": "EN",
        "mode": "sign-to-speech",
        "metadata": {"user_agent": "pytest-test-client"}
    }
    create_res = client.post("/api/v1/sessions", json=create_payload)
    assert create_res.status_code == 201
    created_data = create_res.json()["data"]
    session_id = created_data["session_id"]
    assert created_data["status"] == "ACTIVE"
    assert created_data["sign_language"] == "ISL"

    # 2. Get Session
    get_res = client.get(f"/api/v1/sessions/{session_id}")
    assert get_res.status_code == 200
    assert get_res.json()["data"]["session_id"] == session_id

    # 3. Terminate Session
    delete_res = client.delete(f"/api/v1/sessions/{session_id}")
    assert delete_res.status_code == 200
    assert delete_res.json()["data"]["status"] == "COMPLETED"

    # 4. Get after termination
    get_res2 = client.get(f"/api/v1/sessions/{session_id}")
    assert get_res2.status_code == 200
    assert get_res2.json()["data"]["status"] == "COMPLETED"

def test_vision_landmarks_ingestion():
    # Create session first
    create_res = client.post("/api/v1/sessions", json={"sign_language": "ISL", "spoken_language": "EN"})
    session_id = create_res.json()["data"]["session_id"]

    # Ingest 21 dummy hand landmarks
    dummy_points = [{"x": 0.5 + i*0.01, "y": 0.6 + i*0.01, "z": 0.0, "visibility": 0.99} for i in range(21)]
    payload = {
        "session_id": session_id,
        "timestamp_ms": 1700000000,
        "frame_sequence": 1,
        "image_width": 640,
        "image_height": 480,
        "hands": [
            {
                "handedness": "Right",
                "score": 0.95,
                "landmarks": dummy_points
            }
        ]
    }
    res = client.post("/api/v1/vision/landmarks", json=payload)
    assert res.status_code == 200
    data = res.json()["data"]
    assert data["session_id"] == session_id
    assert data["hands_detected"] == 1
    assert data["is_normalized"] is True

def test_recognition_predict_isl_synthetic():
    """Synthetic landmark regression test for ISL geometric rule-based heuristic."""
    dummy_points = [{"x": 0.5, "y": 0.3, "z": 0.0, "visibility": 0.95} for _ in range(21)]
    payload = {
        "session_id": "mira-test-session",
        "sign_language": "ISL",
        "frames": [
            {
                "session_id": "mira-test-session",
                "timestamp_ms": 1700000000,
                "frame_sequence": 1,
                "image_width": 640,
                "image_height": 480,
                "hands": [
                    {
                        "handedness": "Right",
                        "score": 0.95,
                        "landmarks": dummy_points
                    }
                ]
            }
        ],
        "min_confidence_threshold": 0.50
    }
    res = client.post("/api/v1/recognition/predict", json=payload)
    assert res.status_code == 200
    data = res.json()["data"]
    assert data["sign_language"] == "ISL"
    assert data["status"] in ["prediction_available", "low_confidence"]
    assert data["model_name"] == "isl-geometric-heuristic-v1"

def test_recognition_predict_asl_synthetic():
    """Synthetic landmark regression test for ASL geometric rule-based heuristic."""
    dummy_points = [{"x": 0.5, "y": 0.3, "z": 0.0, "visibility": 0.95} for _ in range(21)]
    payload = {
        "session_id": "mira-test-session",
        "sign_language": "ASL",
        "frames": [
            {
                "session_id": "mira-test-session",
                "timestamp_ms": 1700000000,
                "frame_sequence": 1,
                "image_width": 640,
                "image_height": 480,
                "hands": [
                    {
                        "handedness": "Right",
                        "score": 0.95,
                        "landmarks": dummy_points
                    }
                ]
            }
        ],
        "min_confidence_threshold": 0.50
    }
    res = client.post("/api/v1/recognition/predict", json=payload)
    assert res.status_code == 200
    data = res.json()["data"]
    assert data["sign_language"] == "ASL"
    assert data["model_name"] == "asl-geometric-heuristic-v1"

def test_translation_translate():
    payload = {
        "semantic_representation": {
            "source_sign_language": "ISL",
            "target_spoken_language": "EN",
            "gloss_sequence": ["NAMASTE", "THANK_YOU"],
            "semantic_intent": "greeting",
            "confidence": 0.88
        }
    }
    res = client.post("/api/v1/translation/translate", json=payload)
    assert res.status_code == 200
    data = res.json()["data"]
    assert "Greetings and welcome." in data["translated_text"]
    assert "Thank you very much." in data["translated_text"]
    assert data["evidence_grounded"] is True

def test_speech_endpoints():
    # Transcribe
    trans_res = client.post("/api/v1/speech/transcribe", json={"language": "EN"})
    assert trans_res.status_code == 200
    assert "Hello" in trans_res.json()["data"]["transcription"]

    # Synthesize
    syn_res = client.post("/api/v1/speech/synthesize", json={"text": "Welcome to MIRA-H", "language": "EN"})
    assert syn_res.status_code == 200
    assert syn_res.json()["data"]["text"] == "Welcome to MIRA-H"

def test_sign_generation():
    payload = {
        "text": "Hello, thank you for your help",
        "source_language": "EN",
        "target_sign_language": "ISL"
    }
    res = client.post("/api/v1/sign/generate", json=payload)
    assert res.status_code == 200
    data = res.json()["data"]
    assert len(data["sequence"]) >= 2
    assert data["sequence"][0]["sign_id"] in ["HELLO", "THANK_YOU"]
    assert data["vocabulary_coverage"] > 0.0

def test_models_registry():
    res = client.get("/api/v1/models")
    assert res.status_code == 200
    data = res.json()["data"]
    assert data["total_models_registered"] >= 4
    assert data["torch_available"] is False

    by_id = {m["model_id"]: m for m in data["models"]}

    # 1. ISL & ASL geometric heuristics are truthfully classified
    isl = by_id["isl-geometric-heuristic-v1"]
    asl = by_id["asl-geometric-heuristic-v1"]
    for m, legacy_id in [(isl, "isl-tcn-baseline-v0.1"), (asl, "asl-tcn-baseline-v0.1")]:
        assert m["implementation_type"] == "RULE_BASED_HEURISTIC"
        assert m["training_status"] == "NOT_TRAINED"
        assert m["checkpoint_status"] == "NOT_AVAILABLE"
        assert m["checkpoint_path"] is None
        assert m["status"] == "rule_based_ready"
        assert m["parameters_count"] is None
        assert m["parameter_count_status"] == "NOT_APPLICABLE"
        assert legacy_id in m["legacy_model_ids"]
        assert m["evaluation"]["top1_accuracy"] is None

    # 2. Interface-only / untrained models remain NOT_TRAINED / NOT_AVAILABLE
    isl_cont = by_id["isl-transformer-continuous-v0.0"]
    asl_cont = by_id["asl-spotter-continuous-v0.0"]
    assert isl_cont["implementation_type"] == "INTERFACE_ONLY"
    assert isl_cont["status"] == "not_trained"
    assert isl_cont["checkpoint_status"] == "NOT_AVAILABLE"
    assert isl_cont["parameters_count"] is None

    assert asl_cont["implementation_type"] == "INTERFACE_ONLY"
    assert asl_cont["status"] == "not_available"
    assert asl_cont["checkpoint_status"] == "NOT_AVAILABLE"
    assert asl_cont["parameters_count"] is None

def test_system_status_model_counts_truthful():
    res = client.get("/api/v1/system/status")
    assert res.status_code == 200
    models_info = res.json()["data"]["models"]
    assert models_info["models_loaded"] == 0
    assert models_info["rule_based_active"] == 2
    assert models_info["total_registered"] >= 4

def test_legacy_model_id_resolution_endpoints():
    """Verify canonical and legacy model IDs resolve to canonical heuristic metadata without false TCN claims."""
    pairs = [
        ("isl-tcn-baseline-v0.1", "isl-geometric-heuristic-v1", "ISL"),
        ("asl-tcn-baseline-v0.1", "asl-geometric-heuristic-v1", "ASL"),
        ("isl-geometric-heuristic-v1", "isl-geometric-heuristic-v1", "ISL"),
        ("asl-geometric-heuristic-v1", "asl-geometric-heuristic-v1", "ASL"),
    ]
    for requested_id, expected_canonical_id, expected_lang in pairs:
        res = client.get(f"/api/v1/models/{requested_id}")
        assert res.status_code == 200
        item = res.json()["data"]
        assert item["model_id"] == expected_canonical_id
        assert item["supported_sign_language"] == expected_lang
        assert item["implementation_type"] == "RULE_BASED_HEURISTIC"
        assert item["training_status"] == "NOT_TRAINED"
        assert item["checkpoint_status"] == "NOT_AVAILABLE"
        assert item["parameters_count"] is None
        assert item["status"] == "rule_based_ready"

    missing_res = client.get("/api/v1/models/nonexistent-model-id")
    assert missing_res.status_code == 404

def test_recognition_predict_legacy_model_id_synthetic():
    """Verify POST /api/v1/recognition/predict resolves matching canonical/legacy IDs and rejects language mismatches."""
    dummy_points = [{"x": 0.5, "y": 0.3, "z": 0.0, "visibility": 0.95} for _ in range(21)]
    valid_frame = {
        "session_id": "mira-legacy-test",
        "timestamp_ms": 1700000000,
        "frame_sequence": 1,
        "image_width": 640,
        "image_height": 480,
        "hands": [{"handedness": "Right", "score": 0.95, "landmarks": dummy_points}],
    }

    # 1. Matching ISL/ASL legacy and canonical model IDs execute the right model
    for model_id, expected_canonical, lang in [
        ("isl-tcn-baseline-v0.1", "isl-geometric-heuristic-v1", "ISL"),
        ("asl-tcn-baseline-v0.1", "asl-geometric-heuristic-v1", "ASL"),
        ("isl-geometric-heuristic-v1", "isl-geometric-heuristic-v1", "ISL"),
        ("asl-geometric-heuristic-v1", "asl-geometric-heuristic-v1", "ASL"),
    ]:
        payload = {
            "session_id": "mira-legacy-test",
            "sign_language": lang,
            "model_id": model_id,
            "frames": [valid_frame],
            "min_confidence_threshold": 0.50,
        }
        res = client.post("/api/v1/recognition/predict", json=payload)
        assert res.status_code == 200
        data = res.json()["data"]
        assert data["model_name"] == expected_canonical
        assert data["sign_language"] == lang
        assert data["status"] in ["prediction_available", "low_confidence"]

    # 2. Cross-language mismatches (legacy & canonical) are rejected safely without running inference
    for wrong_model_id, expected_resolved_id, request_lang in [
        ("asl-tcn-baseline-v0.1", "asl-geometric-heuristic-v1", "ISL"),
        ("isl-tcn-baseline-v0.1", "isl-geometric-heuristic-v1", "ASL"),
        ("asl-geometric-heuristic-v1", "asl-geometric-heuristic-v1", "ISL"),
        ("isl-geometric-heuristic-v1", "isl-geometric-heuristic-v1", "ASL"),
    ]:
        mismatch_payload = {
            "session_id": "mira-legacy-test",
            "sign_language": request_lang,
            "model_id": wrong_model_id,
            "frames": [valid_frame],
            "min_confidence_threshold": 0.50,
        }
        res = client.post("/api/v1/recognition/predict", json=mismatch_payload)
        assert res.status_code == 200
        data = res.json()["data"]
        assert data["status"] == "unsupported_input"
        assert data["sign_language"] == request_lang
        assert data["top_prediction"] is None
        assert data["candidates"] == []
        assert data["model_name"] == expected_resolved_id

    # 3. Unknown IDs retain model_unavailable behavior
    unknown_payload = {
        "session_id": "mira-legacy-test",
        "sign_language": "ISL",
        "model_id": "unknown-legacy-id",
        "frames": [],
    }
    unknown_res = client.post("/api/v1/recognition/predict", json=unknown_payload)
    assert unknown_res.status_code == 200
    assert unknown_res.json()["data"]["status"] == "model_unavailable"

def test_recognition_predict_mismatch_does_not_execute_wrong_model():
    """Verify mismatched model_id vs sign_language does not invoke the wrong model's predict()."""
    from unittest.mock import patch
    from app.services.recognition_service import recognition_service
    from app.schemas.sessions import SignLanguageEnum

    asl_model = recognition_service.get_model(SignLanguageEnum.ASL)
    isl_model = recognition_service.get_model(SignLanguageEnum.ISL)
    dummy_points = [{"x": 0.5, "y": 0.3, "z": 0.0, "visibility": 0.95} for _ in range(21)]
    valid_frame = {
        "session_id": "mira-spy",
        "timestamp_ms": 1700000000,
        "frame_sequence": 1,
        "image_width": 640,
        "image_height": 480,
        "hands": [{"handedness": "Right", "score": 0.95, "landmarks": dummy_points}],
    }

    with patch.object(asl_model, "predict", wraps=asl_model.predict) as asl_spy, \
         patch.object(isl_model, "predict", wraps=isl_model.predict) as isl_spy:
        res1 = client.post("/api/v1/recognition/predict", json={
            "session_id": "mira-spy",
            "sign_language": "ISL",
            "model_id": "asl-tcn-baseline-v0.1",
            "frames": [valid_frame],
        })
        assert res1.status_code == 200
        assert res1.json()["data"]["status"] == "unsupported_input"
        asl_spy.assert_not_called()

        res2 = client.post("/api/v1/recognition/predict", json={
            "session_id": "mira-spy",
            "sign_language": "ASL",
            "model_id": "isl-tcn-baseline-v0.1",
            "frames": [valid_frame],
        })
        assert res2.status_code == 200
        assert res2.json()["data"]["status"] == "unsupported_input"
        isl_spy.assert_not_called()


# ---------------------------------------------------------------------------
# G0 R-02 Acceptance Tests: Separate ISL/ASL Reverse Sign Adapters & Hindi
# ---------------------------------------------------------------------------

def test_r02_unicode_normalization_and_devanagari_tokenization():
    """Verify NFC/NFD normalization, zero-width stripping, variants, and danda punctuation."""
    import unicodedata
    from app.services.reverse_sign.normalization import normalize_text, tokenize_text

    deva = "\u0928\u092e\u0938\u094d\u0924\u0947, \u092a\u093e\u0928\u0940 \u0914\u0930 \u092e\u0926\u0926 \u091a\u093e\u0939\u093f\u090f\u0964"
    _, canon = tokenize_text(deva)
    assert canon == ("\u0928\u092e\u0938\u094d\u0924\u0947", "\u092a\u093e\u0928\u0940", "\u0914\u0930", "\u092e\u0926\u0926", "\u091a\u093e\u0939\u093f\u090f")

    nfd = unicodedata.normalize("NFD", "\u0939\u093e\u0901 \u0928\u0939\u0940\u0902 \u0927\u0928\u094d\u092f\u0935\u093e\u0926 \u0915\u0943\u092a\u092f\u093e \u0938\u094d\u0935\u093e\u0917\u0924")
    assert tokenize_text(nfd)[1] == ("\u0939\u093e\u0901", "\u0928\u0939\u0940\u0902", "\u0927\u0928\u094d\u092f\u0935\u093e\u0926", "\u0915\u0943\u092a\u092f\u093e", "\u0938\u094d\u0935\u093e\u0917\u0924")

    # Orthographic variants normalize consistently
    assert tokenize_text("\u0939\u093e\u0902 \u0928\u0939\u0940")[1] == ("\u0939\u093e\u0901", "\u0928\u0939\u0940\u0902")

    # Zero-width joiners/non-joiners/BOM and Devanagari punctuation boundaries
    zw = "\u0928\u200d\u092e\u0938\u200c\u094d\u0924\u0947\u200b\ufeff\u0965 \u0938\u094d\u0935\u093e\u0917\u0924\u0970"
    assert normalize_text(zw) == "\u0928\u092e\u0938\u094d\u0924\u0947 \u0938\u094d\u0935\u093e\u0917\u0924"
    assert tokenize_text(zw)[1] == ("\u0928\u092e\u0938\u094d\u0924\u0947", "\u0938\u094d\u0935\u093e\u0917\u0924")


def test_r02_adapter_isolation_and_divergent_isl_asl_mappings():
    """Verify ISL and ASL adapters are isolated, have distinct glosses/kinematics, and never leak."""
    from app.services.sign_generation_service import sign_generation_service
    from app.schemas.sessions import SignLanguageEnum

    isl_adapter = sign_generation_service.get_adapter(SignLanguageEnum.ISL)
    asl_adapter = sign_generation_service.get_adapter(SignLanguageEnum.ASL)

    assert isl_adapter.adapter_id == "isl-reverse-rule-adapter-v1"
    assert asl_adapter.adapter_id == "asl-reverse-rule-adapter-v1"
    assert "NAMASTE" in isl_adapter.supported_glosses()
    assert "NAMASTE" not in asl_adapter.supported_glosses()
    assert "I_LOVE_YOU" in asl_adapter.supported_glosses()
    assert "I_LOVE_YOU" not in isl_adapter.supported_glosses()

    # Identical Devanagari + English prompt routes to distinct ISL vs ASL poses and glosses
    res_isl = client.post("/api/v1/sign/generate", json={
        "text": "\u0928\u092e\u0938\u094d\u0924\u0947 water thank you",
        "source_language": "HI",
        "target_sign_language": "ISL",
    })
    res_asl = client.post("/api/v1/sign/generate", json={
        "text": "\u0928\u092e\u0938\u094d\u0924\u0947 water thank you",
        "source_language": "HI",
        "target_sign_language": "ASL",
    })
    assert res_isl.status_code == 200
    assert res_asl.status_code == 200

    d_isl = res_isl.json()["data"]
    d_asl = res_asl.json()["data"]

    assert d_isl["adapter_id"] == "isl-reverse-rule-adapter-v1"
    assert d_asl["adapter_id"] == "asl-reverse-rule-adapter-v1"
    assert d_isl["adapter_mode"] == "RULE_BASED_LEXICON"
    assert d_asl["adapter_mode"] == "RULE_BASED_LEXICON"

    assert [s["sign_id"] for s in d_isl["sequence"]] == ["NAMASTE", "WATER", "THANK_YOU"]
    assert [s["sign_id"] for s in d_asl["sequence"]] == ["HELLO", "WATER", "THANK_YOU"]
    assert d_isl["sequence"][1]["hand_configuration"] != d_asl["sequence"][1]["hand_configuration"]
    assert d_isl["sequence"][2]["hand_configuration"] != d_asl["sequence"][2]["hand_configuration"]

    # ASL-only I_LOVE_YOU does not leak into ISL
    isl_ily = client.post("/api/v1/sign/generate", json={
        "text": "I love you",
        "source_language": "EN",
        "target_sign_language": "ISL",
    })
    asl_ily = client.post("/api/v1/sign/generate", json={
        "text": "I love you",
        "source_language": "EN",
        "target_sign_language": "ASL",
    })
    assert isl_ily.json()["data"]["sequence"] == []
    assert isl_ily.json()["data"]["is_supported"] is False
    assert [s["sign_id"] for s in asl_ily.json()["data"]["sequence"]] == ["I_LOVE_YOU"]
    assert asl_ily.json()["data"]["vocabulary_coverage"] == 1.0


def test_r02_adapter_id_validation_and_mismatch_does_not_execute_adapters():
    """Verify optional adapter_id validation returns 422 without invoking either adapter."""
    from unittest.mock import patch
    from fastapi import HTTPException
    from app.services.sign_generation_service import sign_generation_service
    from app.schemas.sessions import SignLanguageEnum, SpokenLanguageEnum
    from app.schemas.sign_generation import SignGenerateRequest

    isl_adapter = sign_generation_service.get_adapter(SignLanguageEnum.ISL)
    asl_adapter = sign_generation_service.get_adapter(SignLanguageEnum.ASL)

    with patch.object(isl_adapter, "generate", wraps=isl_adapter.generate) as isl_spy, \
         patch.object(asl_adapter, "generate", wraps=asl_adapter.generate) as asl_spy:
        # 1. Valid explicit adapter_id
        ok_isl = client.post("/api/v1/sign/generate", json={
            "text": "hello",
            "source_language": "EN",
            "target_sign_language": "ISL",
            "adapter_id": "isl-reverse-rule-adapter-v1",
        })
        assert ok_isl.status_code == 200
        assert ok_isl.json()["data"]["adapter_id"] == "isl-reverse-rule-adapter-v1"
        assert isl_spy.call_count == 1
        assert asl_spy.call_count == 0

        ok_asl = client.post("/api/v1/sign/generate", json={
            "text": "hello",
            "source_language": "EN",
            "target_sign_language": "ASL",
            "adapter_id": "asl-reverse-rule-adapter-v1",
        })
        assert ok_asl.status_code == 200
        assert ok_asl.json()["data"]["adapter_id"] == "asl-reverse-rule-adapter-v1"
        assert asl_spy.call_count == 1

        isl_spy.reset_mock()
        asl_spy.reset_mock()

        # 2. Cross-language mismatches & unknown adapter rejected cleanly via HTTP 422
        for payload in [
            {"text": "hello", "source_language": "EN", "target_sign_language": "ISL", "adapter_id": "asl-reverse-rule-adapter-v1"},
            {"text": "hello", "source_language": "EN", "target_sign_language": "ASL", "adapter_id": "isl-reverse-rule-adapter-v1"},
            {"text": "hello", "source_language": "EN", "target_sign_language": "ISL", "adapter_id": "nonexistent-adapter-v9"},
        ]:
            bad_res = client.post("/api/v1/sign/generate", json=payload)
            assert bad_res.status_code == 422
            assert "detail" in bad_res.json()

        isl_spy.assert_not_called()
        asl_spy.assert_not_called()

        # 3. Service-level guard protects even if Pydantic validator were bypassed
        unvalidated = SignGenerateRequest.model_construct(
            text="hello",
            source_language=SpokenLanguageEnum.ENGLISH,
            target_sign_language=SignLanguageEnum.ISL,
            adapter_id="asl-reverse-rule-adapter-v1",
        )
        try:
            sign_generation_service.generate_sign_sequence(unvalidated)
            assert False, "Expected HTTPException for mismatched adapter_id"
        except HTTPException as exc:
            assert exc.status_code == 422
        isl_spy.assert_not_called()
        asl_spy.assert_not_called()


def test_r02_hindi_devanagari_romanized_english_phrases_and_warnings():
    """Verify Devanagari phrases, Romanized Hindi, English, longest-match, and script warnings."""
    # 1. Complex Devanagari sentence with purna viram and unsupported tokens
    res_hi = client.post("/api/v1/sign/generate", json={
        "text": "\u0928\u092e\u0938\u094d\u0924\u0947, \u092a\u093e\u0928\u0940 \u0914\u0930 \u092e\u0926\u0926 \u091a\u093e\u0939\u093f\u090f\u0964",
        "source_language": "HI",
        "target_sign_language": "ISL",
    })
    d_hi = res_hi.json()["data"]
    assert [s["sign_id"] for s in d_hi["sequence"]] == ["NAMASTE", "WATER", "HELP"]
    assert d_hi["unsupported_tokens"] == ["\u0914\u0930", "\u091a\u093e\u0939\u093f\u090f"]
    assert d_hi["vocabulary_coverage"] == 0.6
    assert d_hi["warnings"] == []

    # 2. Individual Devanagari words & variant spellings
    for word, expected_gloss in [
        ("\u0939\u093e\u0901", "YES"),
        ("\u0939\u093e\u0902", "YES"),
        ("\u0928\u0939\u0940\u0902", "NO"),
        ("\u0928\u0939\u0940", "NO"),
        ("\u0927\u0928\u094d\u092f\u0935\u093e\u0926", "THANK_YOU"),
        ("\u0915\u0943\u092a\u092f\u093e", "PLEASE"),
        ("\u0938\u094d\u0935\u093e\u0917\u0924", "WELCOME"),
    ]:
        r = client.post("/api/v1/sign/generate", json={"text": word, "source_language": "HI", "target_sign_language": "ISL"})
        assert [s["sign_id"] for s in r.json()["data"]["sequence"]] == [expected_gloss]
        assert r.json()["data"]["vocabulary_coverage"] == 1.0

    # 3. Romanized Hindi with HI source language
    res_rom = client.post("/api/v1/sign/generate", json={
        "text": "namaste pani haan nahin dhanyavaad",
        "source_language": "HI",
        "target_sign_language": "ISL",
    })
    d_rom = res_rom.json()["data"]
    assert [s["sign_id"] for s in d_rom["sequence"]] == ["NAMASTE", "WATER", "YES", "NO", "THANK_YOU"]
    assert d_rom["vocabulary_coverage"] == 1.0
    assert d_rom["warnings"] == []

    # 4. Multi-word phrase precedence ("thank you", 3-token Devanagari welcome)
    res_ty = client.post("/api/v1/sign/generate", json={"text": "thank you", "source_language": "EN", "target_sign_language": "ASL"})
    d_ty = res_ty.json()["data"]
    assert [s["sign_id"] for s in d_ty["sequence"]] == ["THANK_YOU"]
    assert d_ty["unsupported_tokens"] == []
    assert d_ty["vocabulary_coverage"] == 1.0

    res_w = client.post("/api/v1/sign/generate", json={
        "text": "\u0906\u092a\u0915\u093e \u0938\u094d\u0935\u093e\u0917\u0924 \u0939\u0948",
        "source_language": "HI",
        "target_sign_language": "ISL",
    })
    assert [s["sign_id"] for s in res_w.json()["data"]["sequence"]] == ["WELCOME"]
    assert res_w.json()["data"]["unsupported_tokens"] == []
    assert res_w.json()["data"]["vocabulary_coverage"] == 1.0

    # 5. Script mismatch warnings (HI+EN and EN+Devanagari) without breaking processing
    hi_en = client.post("/api/v1/sign/generate", json={"text": "Hello water", "source_language": "HI", "target_sign_language": "ISL"}).json()["data"]
    assert [s["sign_id"] for s in hi_en["sequence"]] == ["HELLO", "WATER"]
    assert len(hi_en["warnings"]) == 1

    en_deva = client.post("/api/v1/sign/generate", json={"text": "\u0928\u092e\u0938\u094d\u0924\u0947", "source_language": "EN", "target_sign_language": "ISL"}).json()["data"]
    assert [s["sign_id"] for s in en_deva["sequence"]] == ["NAMASTE"]
    assert len(en_deva["warnings"]) == 1


def test_r02_unsupported_vocab_and_complete_keyframe_provenance_validation():
    """Verify honest zero-coverage reporting and strict keyframe/joint/provenance contracts."""
    from app.services.sign_generation_service import sign_generation_service
    from app.services.reverse_sign.base_adapter import PERMITTED_AVATAR_JOINTS, validate_sign_definition, ReverseSignDefinition
    from app.schemas.sessions import SignLanguageEnum

    # 1. Completely unsupported vocabulary
    unsup = client.post("/api/v1/sign/generate", json={
        "text": "quantum mechanics",
        "source_language": "EN",
        "target_sign_language": "ISL",
    })
    assert unsup.status_code == 200
    d_u = unsup.json()["data"]
    assert d_u["sequence"] == []
    assert d_u["vocabulary_coverage"] == 0.0
    assert d_u["unsupported_tokens"] == ["quantum", "mechanics"]
    assert d_u["is_supported"] is False
    assert d_u["total_duration_ms"] == 0
    assert d_u["verification_status"] == "EXPERIMENTAL"

    # 2. Validate every ISL and ASL gloss definition has >=2 valid keyframes & permitted joints
    for lang in (SignLanguageEnum.ISL, SignLanguageEnum.ASL):
        adapter = sign_generation_service.get_adapter(lang)
        glosses = adapter.supported_glosses()
        assert len(glosses) == 9
        for g in glosses:
            defn = adapter.get_definition(g)
            assert defn.sign_language == lang
            assert len(defn.keyframes) >= 2
            assert defn.verification_status == "UNVERIFIED_EXPERIMENTAL"
            assert defn.classification == "EXPERIMENTAL"
            assert defn.provenance
            prev = -1
            for kf in defn.keyframes:
                assert 0 <= kf.time_offset_ms <= defn.duration_ms
                assert kf.time_offset_ms >= prev
                prev = kf.time_offset_ms
                for joint_target in kf.joints:
                    assert joint_target.joint in PERMITTED_AVATAR_JOINTS

    # 3. Keyframe validator rejects empty keyframe definitions cleanly
    try:
        validate_sign_definition(
            ReverseSignDefinition(
                sign_language=SignLanguageEnum.ISL,
                gloss_id="INVALID_EMPTY",
                duration_ms=500,
                hand_configuration="none",
                movement_type="none",
                body_position="upright",
                non_manual_marker="neutral",
                spatial_reference="front",
                keyframes=(),
                source_mappings=(),
                provenance="test",
            ),
            SignLanguageEnum.ISL,
        )
        assert False, "Expected ValueError for empty keyframes"
    except ValueError:
        pass
