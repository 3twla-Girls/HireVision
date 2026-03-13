"""
config.py – shared configuration
"""

import os
import cv2

# ─────────────────────────────
# PATHS
# ─────────────────────────────
SCRIPT_DIR     = os.path.dirname(os.path.abspath(__file__))
EMBEDDING_PATH = os.path.join(SCRIPT_DIR, "embeddings", "reference_embeddings.npy")

# Haar Cascade — bundled with opencv-python, found automatically
HAAR_CASCADE_PATH = os.path.join(
    cv2.data.haarcascades, "haarcascade_frontalface_default.xml"
)

# ─────────────────────────────
# SYSTEM TIMING
# ─────────────────────────────
REFERENCE_COUNTDOWN = 5    # seconds of countdown before reference capture
CHECK_INTERVAL      = 10   # seconds between each periodic verification

# ─────────────────────────────
# MISS LIMITS  (cumulative, non-consecutive)
# ─────────────────────────────
MAX_MISS_DIFFERENT  = 3    # total "different person" checks before shutdown
MAX_MISS_NO_FACE    = 3    # total "no face" checks before shutdown
MAX_MISS_MULTI_FACE = 3    # total "multiple faces" checks before shutdown

REFERENCE_IMAGE_COUNT = 5  # Number of reference images to capture

# ─────────────────────────────
# EMBEDDING SIMILARITY
# ─────────────────────────────
# CLIP cosine distance: same person ≈ 0.05–0.25 | stranger ≈ 0.5–1.0
COSINE_THRESHOLD = 0.6

# ─────────────────────────────
# UI – fonts
# ─────────────────────────────
FONT      = cv2.FONT_HERSHEY_SIMPLEX
FONT_BOLD = cv2.FONT_HERSHEY_DUPLEX

# ─────────────────────────────
# UI – colors (BGR)
# ─────────────────────────────
C_BG      = ( 18,  18,  24)
C_PANEL   = ( 35,  35,  45)
C_ACCENT  = ( 94, 210, 107)   # green
C_WARNING = ( 30, 180, 255)   # amber/yellow
C_DANGER  = ( 60,  60, 220)   # red
C_WHITE   = (255, 255, 255)
C_GREY    = (140, 140, 150)

# ─────────────────────────────
# MONITOR
# ─────────────────────────────
BORDER_THICKNESS = 12
