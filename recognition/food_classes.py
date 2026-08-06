import json
import os
import threading

# yolo11n.pt нь COCO дата-сет дээр сургагдсан бөгөөд түүний 80 ангийн зөвхөн цөөн
# нь хоол/жимс/ногоотой холбоотой. food_classes.json нь whitelist ба орчуулгын
# хүснэгт хоёул: тэнд байхгүй анги (person, car, chair гэх мэт) илэрсэн ч алгасна.
#
# Жагсаалтыг сервисийг дахин ажиллуулахгүйгээр засварлаж болно — файлыг
# шууд засаад хадгалахад дараагийн /detect хүсэлт шинэ агуулгыг ашиглана.
_MAP_PATH = os.path.join(os.path.dirname(__file__), "food_classes.json")

_lock = threading.Lock()
_cache: dict[str, str] | None = None
_cache_mtime: float | None = None


def get_food_class_map() -> dict[str, str]:
    global _cache, _cache_mtime
    mtime = os.path.getmtime(_MAP_PATH)
    with _lock:
        if _cache is None or mtime != _cache_mtime:
            with open(_MAP_PATH, "r", encoding="utf-8") as f:
                _cache = json.load(f)
            _cache_mtime = mtime
        current = _cache

    if current is None:
        raise RuntimeError("food class map failed to load")
    return current
