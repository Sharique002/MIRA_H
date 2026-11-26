from typing import Generic, Optional, TypeVar, Any
from pydantic import BaseModel, Field
from datetime import datetime

DataT = TypeVar("DataT")

class ErrorDetail(BaseModel):
    code: str = Field(..., description="Machine-readable error code")
    message: str = Field(..., description="Human-readable explanation of error")
    details: Optional[Any] = Field(None, description="Supplemental debugging details")

class ResponseEnvelope(BaseModel, Generic[DataT]):
    success: bool = Field(True, description="Indicates whether the request completed successfully")
    data: Optional[DataT] = Field(None, description="Payload data returned on success")
    error: Optional[ErrorDetail] = Field(None, description="Error detail if success is False")
    correlation_id: str = Field(..., description="Unique tracing identifier for the request")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="UTC timestamp of response")
