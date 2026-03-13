"""
main.py – entry point

Run:  python main.py
"""

import cv2
from ui import run_monitor


def run():
    cap = cv2.VideoCapture(0)
    cap.set(cv2.CAP_PROP_FRAME_WIDTH,  1280)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT,  720)

    if not cap.isOpened():
        print("Cannot open webcam.")
        return

    try:
        run_monitor(cap)
    finally:
        cap.release()
        cv2.destroyAllWindows()


if __name__ == "__main__":
    run()
