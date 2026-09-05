import os
import tempfile
from typing import Optional

def transcribe_audio_bytes(audio_bytes: bytes, filename: str = "audio.wav") -> str:
    """
    Transcribes audio using Sarvam API if SARVAM_API_KEY is configured,
    or provides a clean fallback.
    """
    sarvam_key = os.getenv("SARVAM_API_KEY")
    if sarvam_key:
        try:
            import requests # type: ignore
            # Write to secure temp file and clean up immediately
            with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
                tmp.write(audio_bytes)
                tmp_path = tmp.name

            try:
                with open(tmp_path, "rb") as f:
                    files = {"file": (filename, f, "audio/wav")}
                    headers = {"api-subscription-key": sarvam_key}
                    response = requests.post(
                        "https://api.sarvam.ai/speech-to-text",
                        files=files,
                        headers=headers,
                        timeout=15
                    )
                if response.status_code == 200:
                    data = response.json()
                    return data.get("transcript", "")
            finally:
                if os.path.exists(tmp_path):
                    os.remove(tmp_path)
        except Exception as e:
            print(f"Warning: Sarvam speech transcription error: {e}")

    return ""
