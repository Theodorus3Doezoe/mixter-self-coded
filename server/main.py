from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import api_router
import uvicorn

app = FastAPI(title="Mixter API")

# CORS configuratie toevoegen
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)


@app.get("/")
async def root():
    return {"message": "Welcome to Mixter API"}


if __name__ == "__main__":
    import os

    port = int(os.environ.get("PORT", 10000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
