from typing import List, Optional
from app.schemas.models import (
    ModelMetadataItem,
    ModelRegistryResponse,
    ModelStatusEnum,
    ModelEvaluationMetrics,
    ImplementationTypeEnum,
    TrainingStatusEnum,
    CheckpointStatusEnum,
)
from app.schemas.sessions import SignLanguageEnum
from app.services.recognition_service import recognition_service

class ModelsService:
    @classmethod
    def resolve_model_metadata(cls, model_id: str) -> Optional[ModelMetadataItem]:
        """Resolve a canonical or legacy model ID to its canonical ModelMetadataItem."""
        registry = cls.list_models()
        for item in registry.models:
            if item.model_id == model_id or model_id in item.legacy_model_ids:
                return item
        return None

    @staticmethod
    def list_models() -> ModelRegistryResponse:
        # Query active heuristic adapters
        isl_model = recognition_service.get_model(SignLanguageEnum.ISL)
        asl_model = recognition_service.get_model(SignLanguageEnum.ASL)

        models: List[ModelMetadataItem] = []
        if isl_model:
            models.append(isl_model.get_metadata())
        if asl_model:
            models.append(asl_model.get_metadata())

        # Include planned continuous models with honest NOT_TRAINED / INTERFACE_ONLY status
        models.append(ModelMetadataItem(
            model_id="isl-transformer-continuous-v0.0",
            legacy_model_ids=[],
            model_name="ISL Continuous Sentence Transformer",
            version="0.0.0-unreleased",
            model_type="INTERFACE_ONLY",
            implementation_type=ImplementationTypeEnum.INTERFACE_ONLY,
            training_status=TrainingStatusEnum.NOT_TRAINED,
            checkpoint_status=CheckpointStatusEnum.NOT_AVAILABLE,
            checkpoint_path=None,
            supported_sign_language=SignLanguageEnum.ISL,
            status=ModelStatusEnum.NOT_TRAINED,
            device="cpu",
            dataset_provenance="ISLTranslate Corpus (Manifest Prepared; not downloaded)",
            license="Research Access Required",
            parameters_count=None,
            parameter_count_status="NOT_APPLICABLE",
            evaluation=ModelEvaluationMetrics(
                top1_accuracy=None,
                top5_accuracy=None,
                macro_f1=None,
                evaluated_samples=0,
                evaluation_date=None,
                signer_disjoint_verified=False,
                per_class_metrics_available=False
            ),
            known_limitations=[
                "Model not trained. Interface metadata only for future continuous dataset release",
                "Requires multi-hour continuous signer video corpus"
            ]
        ))

        models.append(ModelMetadataItem(
            model_id="asl-spotter-continuous-v0.0",
            legacy_model_ids=[],
            model_name="ASL Continuous Gloss Spotter",
            version="0.0.0-unreleased",
            model_type="INTERFACE_ONLY",
            implementation_type=ImplementationTypeEnum.INTERFACE_ONLY,
            training_status=TrainingStatusEnum.NOT_TRAINED,
            checkpoint_status=CheckpointStatusEnum.NOT_AVAILABLE,
            checkpoint_path=None,
            supported_sign_language=SignLanguageEnum.ASL,
            status=ModelStatusEnum.NOT_AVAILABLE,
            device="cpu",
            dataset_provenance="ASL Citizen Disjoint Split Manifest (not downloaded)",
            license="Academic Open",
            parameters_count=None,
            parameter_count_status="NOT_APPLICABLE",
            evaluation=ModelEvaluationMetrics(
                top1_accuracy=None,
                top5_accuracy=None,
                macro_f1=None,
                evaluated_samples=0,
                evaluation_date=None,
                signer_disjoint_verified=False,
                per_class_metrics_available=False
            ),
            known_limitations=[
                "Model weights not installed on host device",
                "Interface metadata only; no neural architecture instantiated"
            ]
        ))

        return ModelRegistryResponse(
            models=models,
            system_default_device="cpu",
            torch_available=False,
            total_models_registered=len(models)
        )

models_service = ModelsService()
