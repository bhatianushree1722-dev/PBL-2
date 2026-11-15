
from pathlib import Path
from typing import Literal

import joblib
import numpy as np
import pandas as pd

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from sklearn.ensemble import IsolationForest


BASE_DIR = Path(__file__).resolve().parent
MODEL_DIR = BASE_DIR / "models"
MODEL_DIR.mkdir(parents=True, exist_ok=True)

MIN_TRAINING_READINGS = 100
CONTAMINATION = 0.03

app = FastAPI(
    title="AquaSense ML Service",
    description="Anomaly detection for AquaSense water-flow readings.",
    version="1.0.0",
)


class Reading(BaseModel):
    flowRateLpm: float = Field(ge=0)


class AnalysisRequest(BaseModel):
    source: Literal["physical", "simulated"]
    readings: list[Reading]


def model_path(source: str) -> Path:
    return MODEL_DIR / f"{source}_isolation_forest.joblib"


def build_features(readings: list[Reading]) -> pd.DataFrame:
    flow = pd.Series(
        [reading.flowRateLpm for reading in readings],
        dtype="float64",
    )

    features = pd.DataFrame({
        "flow_rate": flow,
        "rolling_mean": flow.rolling(window=10, min_periods=1).mean(),
        "rolling_std": flow.rolling(window=10, min_periods=1).std().fillna(0),
        "flow_change": flow.diff().fillna(0).abs(),
    })

    return features.replace([np.inf, -np.inf], 0).fillna(0)


@app.get("/health")
def health():
    return {
        "success": True,
        "service": "AquaSense ML Service",
        "status": "healthy",
    }


@app.post("/analyze")
def analyze(request: AnalysisRequest):
    readings = request.readings

    if len(readings) < MIN_TRAINING_READINGS:
        return {
            "success": True,
            "source": request.source,
            "status": "insufficient_data",
            "readingsAvailable": len(readings),
            "minimumRequired": MIN_TRAINING_READINGS,
            "message": (
                "Not enough historical readings to train "
                "the anomaly detection model."
            ),
            "results": [],
        }

    features = build_features(readings)

    model = IsolationForest(
        n_estimators=200,
        contamination=CONTAMINATION,
        random_state=42,
        n_jobs=-1,
    )

    try:
        model.fit(features)

        predictions = model.predict(features)
        decision_scores = model.decision_function(features)

        results = []

        for index, reading in enumerate(readings):
            results.append({
                "index": index,
                "flowRateLpm": reading.flowRateLpm,
                "isAnomaly": bool(predictions[index] == -1),
                "anomalyScore": round(
                    float(-decision_scores[index]), 6
                ),
            })

        joblib.dump(model, model_path(request.source))

        anomaly_count = sum(
            result["isAnomaly"] for result in results
        )

        return {
            "success": True,
            "source": request.source,
            "status": "trained",
            "algorithm": "Isolation Forest",
            "readingsAnalyzed": len(readings),
            "anomaliesDetected": anomaly_count,
            "anomalyPercentage": round(
                anomaly_count / len(readings) * 100, 2
            ),
            "modelSaved": True,
            "results": results,
        }

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Anomaly analysis failed: {str(error)}",
        ) from error
