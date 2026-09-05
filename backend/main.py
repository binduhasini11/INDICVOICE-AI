from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.api.travel import router as travel_router
from backend.api.products import router as products_router
from backend.api.speech import router as speech_router


app = FastAPI(
    title="IndicVoice AI",
    description="Multilingual voice-first search assistant",
    version="1.0.0"
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(travel_router)

app.include_router(products_router)
app.include_router(speech_router)


@app.get("/")
def root():
    return {
        "message": "IndicVoice AI backend is running"
    }


@app.get("/health")
def health():
    return {
        "status": "healthy"
    }
