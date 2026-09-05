from fastapi import APIRouter, UploadFile, File, HTTPException
from typing import Dict, Any
from backend.speech import transcribe_audio_bytes

router = APIRouter(prefix="/speech", tags=["Speech"])

@router.post("/transcribe")
async def transcribe_audio(file: UploadFile = File(...)) -> Dict[str, Any]:
    """Transcribe audio upload from frontend."""
    if not file:
        raise HTTPException(status_code=400, detail="No audio file uploaded")

    # Safety limits: 15MB maximum
    MAX_SIZE = 15 * 1024 * 1024
    content = await file.read()
    if len(content) > MAX_SIZE:
        raise HTTPException(status_code=413, detail="Audio file too large")

    transcript = transcribe_audio_bytes(content, filename=file.filename or "audio.wav")
    return {
        "status": "success",
        "transcript": transcript
    }
