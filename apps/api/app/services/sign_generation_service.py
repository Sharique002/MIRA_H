"""Target-language routing and adapter selection for reverse sign generation."""

from typing import Dict
from fastapi import HTTPException, status

from app.schemas.sessions import SignLanguageEnum
from app.schemas.sign_generation import (
    CANONICAL_REVERSE_ADAPTERS,
    SignGenerateRequest,
    SignGenerateResponse,
)
from app.services.reverse_sign import (
    ASLReverseSignAdapter,
    BaseReverseSignAdapter,
    ISLReverseSignAdapter,
)


class SignGenerationService:
    """
    Routes spoken-to-sign generation strictly to isolated ISL or ASL
    rule-based lexical adapters without shared cross-language fallback.
    """

    def __init__(self) -> None:
        self._adapters: Dict[SignLanguageEnum, BaseReverseSignAdapter] = {
            SignLanguageEnum.ISL: ISLReverseSignAdapter(),
            SignLanguageEnum.ASL: ASLReverseSignAdapter(),
        }

    def get_adapter(self, sign_language: SignLanguageEnum) -> BaseReverseSignAdapter:
        """Return the isolated reverse-sign adapter instance for the given sign language."""
        return self._adapters[sign_language]

    def generate_sign_sequence(self, request: SignGenerateRequest) -> SignGenerateResponse:
        """Validate target sign language and optional adapter_id, then delegate exclusively."""
        if request.target_sign_language not in self._adapters:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported target_sign_language '{request.target_sign_language}'.",
            )

        if request.adapter_id is not None:
            if request.adapter_id not in CANONICAL_REVERSE_ADAPTERS:
                raise HTTPException(
                    status_code=422,
                    detail=f"Unknown or unsupported reverse-sign adapter_id '{request.adapter_id}'.",
                )
            expected_lang = CANONICAL_REVERSE_ADAPTERS[request.adapter_id]
            if expected_lang != request.target_sign_language:
                raise HTTPException(
                    status_code=422,
                    detail=(
                        f"Adapter '{request.adapter_id}' is designated for '{expected_lang.value}' "
                        f"and cannot serve target_sign_language '{request.target_sign_language.value}'."
                    ),
                )

        adapter = self._adapters[request.target_sign_language]
        return adapter.generate(request)


sign_generation_service = SignGenerationService()
