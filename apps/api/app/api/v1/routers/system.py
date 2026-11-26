import psutil
from fastapi import APIRouter, Request
from app.schemas.common import ResponseEnvelope
from app.services.models_service import models_service

router = APIRouter()

@router.get("/system/status", response_model=ResponseEnvelope[dict])
async def get_system_status(request: Request):
    cpu_percent = psutil.cpu_percent(interval=None)
    vm = psutil.virtual_memory()
    registry = models_service.list_models()
    
    return ResponseEnvelope[dict](
        success=True,
        correlation_id=getattr(request.state, "correlation_id", "direct-check"),
        data={
            "cpu": {
                "usage_percent": cpu_percent,
                "logical_cores": psutil.cpu_count(logical=True)
            },
            "memory": {
                "total_gb": round(vm.total / (1024**3), 2),
                "available_gb": round(vm.available / (1024**3), 2),
                "used_percent": vm.percent
            },
            "models": {
                "total_registered": registry.total_models_registered,
                "models_loaded": sum(1 for m in registry.models if m.status == "loaded"),
                "rule_based_active": sum(1 for m in registry.models if m.status == "rule_based_ready"),
                "device": registry.system_default_device
            },
            "environment": "development-local"
        }
    )
