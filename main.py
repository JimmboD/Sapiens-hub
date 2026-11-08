"""Sapiens Hub: backend mínimo.

Sirve el front estático (carpeta ./static) y expone el estado del servidor
en /api/status para que el dashboard lo consulte.

Ejecutar:  uvicorn main:app --host 0.0.0.0 --port 8000
"""

import os
import platform
import shutil
import time
from pathlib import Path

import psutil
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

BASE_DIR = Path(__file__).parent
STATIC_DIR = BASE_DIR / "static"

# Ruta del USB (cámbiala con la variable de entorno SAPIENS_USB_PATH).
USB_PATH = os.environ.get("SAPIENS_USB_PATH", "/home/jimmbo/usb")

app = FastAPI(title="Sapiens Hub")

# Estado previo de la red para calcular velocidad (bytes/s) entre consultas.
_last_net = {"t": time.time(), "sent": 0, "recv": 0}
_c = psutil.net_io_counters()
_last_net.update(sent=_c.bytes_sent, recv=_c.bytes_recv)


def _disk(path: str):
    try:
        total, used, free = shutil.disk_usage(path)
    except (FileNotFoundError, PermissionError, OSError):
        return None
    return {
        "path": path,
        "total_gb": round(total / 1024**3, 1),
        "used_gb": round(used / 1024**3, 1),
        "free_gb": round(free / 1024**3, 1),
        "percent": round(used / total * 100, 1) if total else 0,
    }


def _temperature():
    """Mayor temperatura disponible en °C, o None si el equipo no la reporta."""
    try:
        sensors = psutil.sensors_temperatures()
    except (AttributeError, OSError):
        return None
    values = [t.current for group in sensors.values() for t in group if t.current]
    return round(max(values), 1) if values else None


def _battery():
    try:
        b = psutil.sensors_battery()
    except (AttributeError, OSError):
        return None
    if not b:
        return None
    return {"percent": round(b.percent), "plugged": bool(b.power_plugged)}


def _network():
    now = time.time()
    c = psutil.net_io_counters()
    dt = max(now - _last_net["t"], 1e-6)
    up = (c.bytes_sent - _last_net["sent"]) / dt
    down = (c.bytes_recv - _last_net["recv"]) / dt
    _last_net.update(t=now, sent=c.bytes_sent, recv=c.bytes_recv)
    return {"up_bps": max(up, 0), "down_bps": max(down, 0)}


@app.get("/api/status")
def status():
    ram = psutil.virtual_memory()
    return {
        "host": platform.node(),
        "os": f"{platform.system()} {platform.release()}",
        "uptime_s": int(time.time() - psutil.boot_time()),
        "cpu": {
            "percent": psutil.cpu_percent(interval=0.1),
            "cores": psutil.cpu_count(),
            "load": [round(x, 2) for x in os.getloadavg()],
        },
        "ram": {
            "total_gb": round(ram.total / 1024**3, 1),
            "used_gb": round((ram.total - ram.available) / 1024**3, 1),
            "percent": ram.percent,
        },
        "disk": _disk("/"),
        "usb": _disk(USB_PATH),
        "battery": _battery(),
        "temp_c": _temperature(),
        "net": _network(),
        "ts": int(time.time()),
    }


# El front va al final: las rutas /api/* tienen prioridad.
app.mount("/", StaticFiles(directory=STATIC_DIR, html=True), name="static")
