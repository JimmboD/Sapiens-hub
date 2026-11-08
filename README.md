# Sapiens Hub

Portafolio de ingeniería biomédica y panel de estado de un servidor casero (Debian 13).

## Estructura

```
main.py                 Backend FastAPI: sirve el front y expone /api/status
requirements.txt        Dependencias de Python
static/
  index.html            Portada con pulso del servidor y lista de proyectos
  projects.json         Registro de proyectos (una entrada por proyecto)
  css/style.css         Estilos (tema oscuro, paleta de Manim)
  js/app.js             Lista de proyectos de la portada
  js/statusbar.js       Barra de estado fija (consulta /api/status)
  js/ecg.js             Trazo de ECG ligado a la carga de CPU
  js/project.js         Datos de cada página de proyecto
  projects/<slug>/      Una carpeta por proyecto con su index.html
```

## Ejecutar

```bash
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000
```

Abre `http://IP-DEL-SERVIDOR:8000`.

La ruta del USB se cambia con la variable de entorno `SAPIENS_USB_PATH`
(por defecto `/home/jimmbo/usb`).

## Agregar un proyecto

1. Añade una entrada en `static/projects.json` (`slug`, `titulo`, `area`, `resumen`, `estado`, `etiquetas`, `puerto`).
2. Copia una carpeta de `static/projects/` con el nombre del nuevo `slug` y cambia `data-slug` y el título en su `index.html`.
3. Si el proyecto es una app con su propio puerto, escribe el número en `puerto` y la página mostrará el enlace.

Valores de `estado`: `en-linea`, `en-desarrollo`, `pendiente`.
