from fastapi import APIRouter, HTTPException, Request, status
from app.schemas.common import ResponseEnvelope
from app.schemas.models import ModelMetadataItem, ModelRegistryResponse
from app.services.models_service import models_service

router = APIRouter()

@router.get("/models", response_model=ResponseEnvelope[ModelRegistryResponse])
async def list_models(request: Request):
    registry = models_service.list_models()
    return ResponseEnvelope[ModelRegistryResponse](
        success=True,
        correlation_id=getattr(request.state, "correlation_id", "models-list"),
        data=registry
    )

@router.get("/models/{model_id}", response_model=ResponseEnvelope[ModelMetadataItem])
async def get_model(model_id: str, request: Request):
    model = models_service.resolve_model_metadata(model_id)
    if not model:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Model '{model_id}' not found."
        )
    return ResponseEnvelope[ModelMetadataItem](
        success=True,
        correlation_id=getattr(request.state, "correlation_id", "models-get"),
        data=model
    )
