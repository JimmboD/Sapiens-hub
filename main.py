import shutil
import psutil
from fastapi import FastAPI
from fastapi.responses import HTMLResponse

app = FastAPI()

@app.get("/", response_class=HTMLResponse)
def index():
    # 1. Almacenamiento de tu USB
    total_b, used_b, free_b = shutil.disk_usage("/home/jimmbo/usb")
    free_gb = free_b / (1024**3)
    
    # 2. Batería 
    battery = psutil.sensors_battery()
    bat_str = f"{battery.percent}% {'🔌' if battery.power_plugged else '🔋'}" if battery else "No detectada"
    
    # 3. RAM disponible
    ram = psutil.virtual_memory()
    ram_gb = ram.available / (1024**3)
    
    # 4. Carga del Procesador
    cpu = psutil.cpu_percent(interval=0.1)

    html_content = f"""
    <html>
        <head>
            <title>Sapiens Hub</title>
            <style>
                body {{ font-family: monospace; text-align: center; margin-top: 50px; background-color: #1e1e1e; color: #00ff00; }}
                h1 {{ color: #ffffff; }}
                .panel {{ margin: 20px auto; padding: 20px; background: #222; border-radius: 8px; border: 1px solid #444; max-width: 300px; text-align: left; }}
                .proyecto {{ margin: 10px; padding: 15px; background: #2d2d2d; border-radius: 8px; display: inline-block; border: 1px solid #444; }}
            </style>
        </head>
        <body>
            <h1>Terminal Central Sapiens 🖥️</h1>
            <p>Servidor Headless Activo | SO: Debian 13</p>
            
            <div class="panel">
                <h3 style="text-align: center; color: #ffeb3b; margin-top: 0;">📊 Hardware</h3>
                <p>💾 USB Libre: <b>{free_gb:.1f} GB</b></p>
                <p>⚡ Batería: <b>{bat_str}</b></p>
                <p>🧠 RAM Libre: <b>{ram_gb:.1f} GB</b></p>
                <p>⚙️ CPU Uso: <b>{cpu}%</b></p>
            </div>
            
            <div class="proyecto">
                <h2>🫀 Monitor ECG</h2>
                <p>Puerto: 8001</p>
            </div>

            <div class="proyecto">
                <h2>🧠 Modelos IA</h2>
                <p>Puerto: 8002</p>
            </div>
        </body>
    </html>
    """
    return html_content