from fastapi import APIRouter, UploadFile, File, HTTPException
from backend.speech import transcribe_audio
import tempfile
import os

router = APIRouter(
    prefix="/speech",
    tags=["Speech"]
)


@router.post("/transcribe")
async def transcribe(file: UploadFile = File(...)):

    temp_path = None

    try:
        suffix = os.path.splitext(file.filename or "")[1] or ".wav"

        with tempfile.NamedTemporaryFile(
            delete=False,
            suffix=suffix
        ) as temp_file:

            content = await file.read()
            temp_file.write(content)
            temp_path = temp_file.name

        transcript = transcribe_audio(temp_path)

        return {
            "success": True,
            "transcript": transcript
        }

    except Exception as error:

        raise HTTPException(
            status_code=500,
            detail=str(error)
        )

    finally:

        if temp_path and os.path.exists(temp_path):
            os.remove(temp_path)
