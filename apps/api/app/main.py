from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.core.config import settings
from app.core.middleware import CorrelationIdAndTimingMiddleware
from app.database.session import engine, Base
from app.api.v1.routers import (
    health,
    system,
    sessions,
    vision,
    recognition,
    translation,
    speech,
    sign_generation,
    models
)

# Initialize database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="MIRA-H: Multimodal Assistive Communication Platform API for ISL, ASL, English, and Hindi.",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

# Middleware
app.add_middleware(CorrelationIdAndTimingMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global Exception Handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    correlation_id = getattr(request.state, "correlation_id", "error")
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "data": None,
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": str(exc),
                "details": type(exc).__name__
            },
            "correlation_id": correlation_id
        }
    )

# Include API v1 Routers
prefix = settings.API_V1_STR
app.include_router(health.router, prefix=prefix, tags=["Health"])
app.include_router(system.router, prefix=prefix, tags=["System"])
app.include_router(sessions.router, prefix=prefix, tags=["Sessions"])
app.include_router(vision.router, prefix=prefix, tags=["Vision"])
app.include_router(recognition.router, prefix=prefix, tags=["Recognition"])
app.include_router(translation.router, prefix=prefix, tags=["Translation"])
app.include_router(speech.router, prefix=prefix, tags=["Speech"])
app.include_router(sign_generation.router, prefix=prefix, tags=["Sign Generation"])
app.include_router(models.router, prefix=prefix, tags=["Models"])

@app.get("/")
def root():
    return {
        "service": "MIRA-H Core API",
        "version": settings.VERSION,
        "docs": "/docs",
        "health": f"{settings.API_V1_STR}/health"
    }
