import json
import urllib.request
import time

COMFYUI_URL = "http://127.0.0.1:8188"

def test_connection():
    try:
        with urllib.request.urlopen(f"{COMFYUI_URL}/system_stats", timeout=5) as r:
            print(f"Status: {r.status}")
            print(f"Stats: {r.read().decode()}")
    except Exception as e:
        print(f"Connection failed: {e}")

def list_history():
    try:
        with urllib.request.urlopen(f"{COMFYUI_URL}/history", timeout=5) as r:
            history = json.loads(r.read())
            print(f"History count: {len(history)}")
            # Print last 3 task IDs
            last_ids = list(history.keys())[-3:]
            for tid in last_ids:
                print(f"ID: {tid}, Success: {'outputs' in history[tid]}")
    except Exception as e:
        print(f"History fetch failed: {e}")

if __name__ == "__main__":
    test_connection()
    list_history()
