# 🌍 Mapa de Impactos Ambientales - Doñana

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Leaflet](https://img.shields.io/badge/Leaflet-1.9.4-green)](https://leafletjs.com/)
[![QGIS](https://img.shields.io/badge/QGIS-4.x-blue)](https://qgis.org/)

Visualización interactiva de los impactos ambientales en el entorno de Doñana y el Estuario del Guadalquivir, basada en el informe de WWF.

🔗 **Demo en vivo:** [https://vmbolea.github.io/demo_wwf](https://vmbolea.github.io/demo_wwf)

![Vista previa del mapa](screenshot.png)

## 📋 Tabla de contenidos

- [Descripción](#descripción)
- [Fuente de datos](#fuente-de-datos)
- [Metodología](#metodología)
  - [1. Georreferenciación de la imagen](#1-georreferenciación-de-la-imagen)
  - [2. Extracción automática de puntos](#2-extracción-automática-de-puntos)
  - [3. Revisión manual con QGIS](#3-revisión-manual-con-qgis)
  - [4. Creación del webmapping](#4-creación-del-webmapping)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Tecnologías utilizadas](#tecnologías-utilizadas)
- [Instalación y uso local](#instalación-y-uso-local)
- [Autores](#autores)
- [Licencia](#licencia)

## 📖 Descripción

Este proyecto visualiza los impactos ambientales identificados en el informe de WWF sobre Doñana y el Estuario del Guadalquivir. Los datos se han extraído georreferenciando la imagen original del informe y se presentan en un mapa interactivo que permite:

- Visualizar la distribución espacial de los impactos
- Filtrar por categorías (fuego, fauna, agua, flora, industria, suelo, recreativo)
- Consultar información detallada de cada punto
- Ver los límites de los espacios protegidos (Parque Nacional, Parque Natural y Corredor Verde)

## 📊 Fuente de datos

**Informe original:** [Análisis de los problemas ambientales de Doñana y el Estuario del Guadalquivir](https://www.wwf.es/?55100/Analisis-de-los-problemas-ambientales-de-Donana-y-el-Estuario-del-Gudalquivir)

El informe de WWF incluye un mapa síntesis con la localización de los principales impactos ambientales, representados mediante diferentes colores y formas geométricas según su categoría.

## 🛠️ Metodología

### 1. Georreferenciación de la imagen

El mapa original del informe se georreferenció utilizando **QGIS** con la herramienta de georreferenciador:

- **Puntos de control:** Se utilizaron cruces de carreteras y esquinas de elementos reconocibles del mapa base de OpenStreetMap
- **Proyección:** EPSG:25830 (ETRS89 / UTM zone 30N) - adecuada para la zona de Doñana
- **Transformación:** Polinómica de 2º orden para corregir distorsiones del mapa original
- **Error RMS:** < 3 metros

### 2. Extracción automática de puntos

Se desarrolló un script en Python (`extract_impactos_georef.py`) que procesa la imagen georreferenciada para extraer automáticamente los puntos según su simbología:

**Lógica de extracción:**
- Reconoce colores (rojo, marrón, azul, verde, negro, amarillo/naranja, morado)
- Identifica formas geométricas (círculo, cuadrado, rombo, triángulo, hexágono, estrella, etc.)
- Exporta coordenadas X, Y a un archivo GeoJSON

```python
# Ejemplo simplificado del algoritmo
for each pixel in image:
    color = detect_color(pixel)
    shape = detect_shape(contour)
    if color and shape:
        coordinates = pixel_to_geographic(x, y)
        add_to_geojson(coordinates, color, shape)
```
### 3. Revisión manual con QGIS
El GeoJSON generado automáticamente fue revisado manualmente en QGIS para:

- ✅ Añadir puntos que el script no detectó correctamente

- ✅ Corregir formas erróneas (especialmente rombos y hexágonos)

- ✅ Verificar la precisión posicional de cada punto

- ✅ Enriquecer la metadata (categorías y fuentes)

### 4. Creación del webmapping
El mapa interactivo se desarrolló con:

**Límites de espacios protegidos:**

- Descargados desde los datos abiertos de la REDIAM (Junta de Andalucía)

- Almacenados localmente en data/limites.geojson

- Colores personalizados según el tipo de espacio

**Visualización de impactos:**

- Marcadores SVG dinámicos que mantienen la simbología original

- Agrupamiento de marcadores (MarkerCluster) para mejorar el rendimiento

- Sistema de filtrado por categoría

**Interfaz responsive:**

- Sidebar deslizante desde abajo en dispositivos móviles

- Leyenda interactiva de impactos y espacios protegidos

- Adaptación a diferentes tamaños de pantalla

📁 Estructura del proyecto

```text
demo_wwf/
├── index.html              # Página principal
├── css/
│   └── style.css          # Estilos responsive
├── js/
│   └── app.js             # Lógica del mapa (Leaflet)
├── data/
│   ├── impactos.geojson   # Puntos de impactos extraídos
│   └── limites.geojson    # Límites de espacios protegidos
├── icons/
│   └── wwf.svg            # Logo WWF
├── scripts/
│   └── extract_impactos_georef.py  # Script de extracción
├── images/
│   └── screenshot.png    # Vista previa
       
```

---

## 💻 Tecnologías utilizadas

| Tecnología | Uso |
|------------|-----|
| **Leaflet** | Biblioteca de mapas interactivos |
| **Leaflet.markercluster** | Agrupación de marcadores |
| **OpenStreetMap** | Base cartográfica |
| **QGIS** | Georreferenciación y edición de datos |
| **Python (OpenCV)** | Extracción automática de puntos |
| **HTML5/CSS3** | Interfaz y diseño responsive |
| **GitHub Pages** | Hosting |

---

## 🚀 Instalación y uso local

```bash
# Clonar el repositorio
git clone https://github.com/vmbolea/demo_wwf.git
cd demo_wwf

# Iniciar un servidor local (Python 3)
python -m http.server 8080

# O con Node.js
npx serve .

# Abrir en el navegador
http://localhost:8080
```

### Requisitos para ejecutar el script de extracción:

```bash
pip install opencv-python numpy rasterio
python scripts/extract_impactos_georef.py --input mapa_original.png --output impactos.geojson
```

## 👥 Autores
Víctor Martínez Bolea

GitHub: @vmbolea

Proyecto: demo_wwf

## 📄 Licencia

Este proyecto está bajo la licencia MIT - ver el archivo LICENSE para más detalles.

## 🙏 Agradecimientos

- WWF España por el informe base que hizo posible este trabajo

- REDIAM (Junta de Andalucía) por los datos de espacios protegidos

- OpenStreetMap y su comunidad por la cartografía base

- QGIS community por la herramienta de georreferenciación

⭐ Si este proyecto te ha sido útil, ¡no dudes en darle una estrella en GitHub!
