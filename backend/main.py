import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

from backend.api.agent import router as agent_router
from backend.api.travel import router as travel_router
from backend.api.products import router as products_router
from backend.api.speech import router as speech_router

app = FastAPI(
    title="IndicVoice AI Backend",
    description="Multilingual oral-first central agent orchestrator for Indian languages and travel/product search.",
    version="1.0.0"
)

# CORS Configuration
cors_origins_env = os.getenv("BACKEND_CORS_ORIGINS", "*")
origins = [o.strip() for o in cors_origins_env.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if origins else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API Routers
app.include_router(agent_router)
app.include_router(travel_router)
app.include_router(products_router)
app.include_router(speech_router)

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "IndicVoice AI Central Orchestrator",
        "version": "1.0.0"
    }

if __name__ == "__main__":
    import uvicorn
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", "8000"))
    uvicorn.run("backend.main:app", host=host, port=port, reload=True)
