import cv2
import json
import rasterio
import numpy as np
from collections import Counter

# =====================================================
# CONFIG
# =====================================================

IMAGE_PATH = "donana_georef.tif"

OUTPUT_GEOJSON = "impactos.geojson"

MIN_AREA = 20
MAX_AREA = 350

DEBUG = True

# =====================================================
# COLORES HSV
# =====================================================

COLOR_RANGES = {

    "rojo": [
        (
            np.array([170, 0, 0]),
            np.array([220, 40, 50])
        )
    ],

    "marron": [
        (
            np.array([130, 60, 10]),
            np.array([180, 120, 60])
        )
    ],

    "azul": [
        (
            np.array([0, 120, 170]),
            np.array([40, 180, 240])
        )
    ],

    "verde": [
        (
            np.array([75, 120, 25]),
            np.array([130, 180, 90])
        )
    ],

    "negro": [
        (
            np.array([0, 0, 0]),
            np.array([70, 70, 70])
        )
    ],

    "amarillo_naranja": [
        (
            np.array([190, 110, 0]),
            np.array([255, 190, 70])
        )
    ],

    "morado": [
        (
            np.array([80, 10, 90]),
            np.array([150, 70, 170])
        )
    ]
}

# =====================================================
# CARGAR IMAGEN
# =====================================================

img = cv2.imread(IMAGE_PATH)

if img is None:
    raise Exception(f"No se pudo abrir: {IMAGE_PATH}")

img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)


# =====================================================
# GEOREFERENCIA
# =====================================================

src = rasterio.open(IMAGE_PATH)

print("CRS:", src.crs)

# =====================================================
# CLASIFICADOR DE FORMAS
# =====================================================
def classify_shape(cnt):

    area = cv2.contourArea(cnt)

    if area < MIN_AREA or area > MAX_AREA:
        return None

    perimeter = cv2.arcLength(cnt, True)

    epsilon = 0.03 * perimeter

    approx = cv2.approxPolyDP(
        cnt,
        epsilon,
        True
    )

    vertices = len(approx)

    x, y, w, h = cv2.boundingRect(cnt)

    if h == 0:
        return None

    aspect_ratio = w / float(h)

    elongation = max(w, h) / min(w, h)

    rect_area = w * h

    if rect_area == 0:
        return None

    compactness = area / rect_area

    hull = cv2.convexHull(cnt)

    hull_area = cv2.contourArea(hull)

    solidity = area / hull_area if hull_area > 0 else 0

    circularity = (
        4 * np.pi * area /
        (perimeter * perimeter)
    )

    # =================================================
    # FILTROS GLOBALES
    # =================================================

    if elongation > 2.2:
        return None

    if compactness < 0.25:
        return None

    shape = "unknown"

    # =================================================
    # TRIÁNGULOS
    # =================================================

    if vertices == 3:

        if 14 <= w <= 28 and 10 <= h <= 22:

            pts = approx.reshape(-1, 2)

            ys = pts[:, 1]

            top_y = np.min(ys)
            bottom_y = np.max(ys)

            top_count = np.sum(
                ys < top_y + 3
            )

            bottom_count = np.sum(
                ys > bottom_y - 3
            )

            if top_count == 1:
                shape = "triangle_up"

            elif bottom_count == 1:
                shape = "triangle_down"

            else:
                shape = "triangle"

    # =================================================
    # CUADRADOS / ROMBOS
    # =================================================

    elif vertices == 4:

        if (
            18 <= w <= 34 and
            10 <= h <= 22 and
            compactness < 0.72
        ):
            shape = "diamond"

        elif (
            8 <= w <= 16 and
            8 <= h <= 16 and
            0.8 <= aspect_ratio <= 1.2
        ):
            shape = "square"

        else:
            shape = "rectangle"

    # =================================================
    # CÍRCULOS
    # =================================================

    elif (
        circularity > 0.78 and
        12 <= w <= 24 and
        12 <= h <= 24
    ):
        shape = "circle"

    # =================================================
    # CRUCES / EQUIS
    # =================================================

    elif solidity < 0.62:

        if vertices >= 8:

            if 14 <= w <= 26 and 14 <= h <= 26:

                if 0.8 <= aspect_ratio <= 1.2:
                    shape = "cross"

                else:
                    shape = "x"

    return {
        "shape": shape,
        "compactness": compactness,
        "solidity": solidity,
        "circularity": circularity
    }

    # =================================================
    # DESCONOCIDO
    # =================================================

    return "unknown"

# =====================================================
# FEATURES
# =====================================================

features = []

shape_counter = Counter()

# =====================================================
# DEBUG IMAGE
# =====================================================

debug_img = img.copy()

# =====================================================
# PROCESAR COLORES
# =====================================================

for color_name, ranges in COLOR_RANGES.items():

    print()
    print(f"Procesando color: {color_name}")

    final_mask = None

    # =================================================
    # COMBINAR RANGOS
    # =================================================

    for lower, upper in ranges:

        mask = cv2.inRange(
            img_rgb,
            lower,
            upper
        )

        if final_mask is None:
            final_mask = mask

        else:
            final_mask = cv2.bitwise_or(
                final_mask,
                mask
            )

    # =================================================
    # MORFOLOGÍA
    # =================================================

    kernel = np.ones((3, 3), np.uint8)

    final_mask = cv2.morphologyEx(
        final_mask,
        cv2.MORPH_OPEN,
        kernel
    )

    final_mask = cv2.morphologyEx(
        final_mask,
        cv2.MORPH_CLOSE,
        kernel
    )

    # =================================================
    # CONTORNOS
    # =================================================

    contours, _ = cv2.findContours(
        final_mask,
        cv2.RETR_EXTERNAL,
        cv2.CHAIN_APPROX_SIMPLE
    )

    print(f"  contornos: {len(contours)}")

    # =================================================
    # ANALIZAR CONTORNOS
    # =================================================

    for cnt in contours:

        area = cv2.contourArea(cnt)

        if area < MIN_AREA or area > MAX_AREA:
            continue

        result = classify_shape(cnt)

        if result  is None:
            continue
        shape = result["shape"]

        compactness = result["compactness"]
        solidity = result["solidity"]
        circularity = result["circularity"]

        shape_counter[shape] += 1

        M = cv2.moments(cnt)

        if M["m00"] == 0:
            continue

        cx = int(M["m10"] / M["m00"])
        cy = int(M["m01"] / M["m00"])

        lon, lat = src.xy(cy, cx)

        x, y, w, h = cv2.boundingRect(cnt)

        perimeter = cv2.arcLength(cnt, True)

        # =================================================
        # DEBUG VISUAL
        # =================================================

        if DEBUG:

            cv2.rectangle(
                debug_img,
                (x, y),
                (x + w, y + h),
                (0, 255, 0),
                1
            )

            cv2.putText(
                debug_img,
                shape,
                (x, y - 2),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.35,
                (0, 255, 0),
                1
            )

        # =================================================
        # FEATURE
        # =================================================

        feature = {

            "type": "Feature",

            "properties": {

                "category_id":
                    f"{color_name}_{shape}",

                "color":
                    color_name,

                "shape":
                    shape,

                "area_px":
                    float(area),

                "width_px":
                    int(w),

                "height_px":
                    int(h),

                "perimeter_px":
                    float(perimeter),

                "compactness":
                    float(compactness),

                "solidity":
                    float(solidity),

                "circularity":
                    float(circularity),

                "fuente":
                    "WWF"

            },

            "geometry": {

                "type": "Point",

                "coordinates": [
                    float(lon),
                    float(lat)
                ]
            }
        }

        features.append(feature)

# =====================================================
# EXPORTAR GEOJSON
# =====================================================

geojson = {
    "type": "FeatureCollection",
    "features": features
}

with open(
    OUTPUT_GEOJSON,
    "w",
    encoding="utf-8"
) as f:

    json.dump(
        geojson,
        f,
        ensure_ascii=False,
        indent=2
    )

# =====================================================
# EXPORTAR DEBUG
# =====================================================

if DEBUG:

    cv2.imwrite(
        "debug_shapes.png",
        debug_img
    )

# =====================================================
# RESUMEN
# =====================================================

print()
print("======================================")
print("RESUMEN")
print("======================================")

print(f"Features exportadas: {len(features)}")
print()

for shape, count in shape_counter.items():
    print(f"{shape}: {count}")

print()
print(f"GeoJSON generado: {OUTPUT_GEOJSON}")

if DEBUG:
    print("Debug image: debug_shapes.png")