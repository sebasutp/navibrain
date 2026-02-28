from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import api

app = FastAPI(title="Navibrain API")

# Configure CORS for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api.router)

@app.get("/health")
def health_check():
    return {"status": "ok"}
