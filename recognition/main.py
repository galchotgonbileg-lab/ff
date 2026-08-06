import io

from fastapi import FastAPI, File, Form, UploadFile
from fastapi.responses import JSONResponse
from PIL import Image
from ultralytics import YOLO

from food_classes import FOOD_CLASS_MAP

app = FastAPI()
model = YOLO("yolo11n.pt")

DEFAULT_CONFIDENCE = 0.25
MIN_CONFIDENCE = 0.05
MAX_CONFIDENCE = 0.95


@app.get("/health")
def health():
    return {"ok": True}


@app.post("/detect")
async def detect(image: UploadFile = File(...), confidence: float = Form(DEFAULT_CONFIDENCE)):
    conf = max(MIN_CONFIDENCE, min(MAX_CONFIDENCE, confidence))
    data = await image.read()
    if not data:
        return JSONResponse(status_code=400, content={"error": "image field is required"})

    try:
        img = Image.open(io.BytesIO(data)).convert("RGB")
        results = model.predict(source=img, conf=conf, verbose=False)
    except Exception:
        return JSONResponse(status_code=500, content={"error": "detection failed"})

    best_by_label: dict[str, dict] = {}
    for result in results:
        for box in result.boxes:
            class_name = result.names[int(box.cls[0])]
            label_mn = FOOD_CLASS_MAP.get(class_name)
            if label_mn is None:
                continue
            box_confidence = float(box.conf[0])
            existing = best_by_label.get(label_mn)
            if existing is None or box_confidence > existing["confidence"]:
                best_by_label[label_mn] = {
                    "labelEn": class_name,
                    "labelMn": label_mn,
                    "confidence": box_confidence,
                }

    detections = sorted(best_by_label.values(), key=lambda d: d["confidence"], reverse=True)
    return {"detections": detections}
