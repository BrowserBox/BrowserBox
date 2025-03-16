#!/usr/bin/env python3

import sys
import json
import base64
import easyocr

# Initialize EasyOCR (English, CPU-only for MacBook Air)
reader = easyocr.Reader(['en'], gpu=False)  # Set gpu=True if you add CUDA later

def process_screenshot(base64_data):
    # Decode base64 to raw PNG bytes
    img_bytes = base64.b64decode(base64_data)

    # Run EasyOCR directly on bytes
    results = reader.readtext(img_bytes)
    
    # Extract text and bounding boxes
    text = " ".join([res[1] for res in results])
    bboxes = [res[0] for res in results]  # List of [(x1,y1),(x2,y2),(x3,y3),(x4,y4)]
    return text, bboxes

def main():
    print("Reading JSON messages from stdin...", file=sys.stderr)
    for line in sys.stdin:
        try:
            message = json.loads(line.strip())
            if message.get("type") == "screenshot" and "data" in message:
                text, bboxes = process_screenshot(message["data"])
                output = {
                    "type": "ocr_result",
                    "frameId": message.get("frameId"),
                    "castSessionId": message.get("castSessionId"),
                    "targetId": message.get("targetId"),
                    "timestamp": message.get("timestamp")
                }
                print(json.dumps(output, indent=2))
                print(text)
                print(bboxes)
            else:
                print(json.dumps(message, indent=2))
        except json.JSONDecodeError:
            print(json.dumps({"error": f"Invalid JSON: {line.strip()}"}, indent=2), file=sys.stderr)
        except Exception as e:
            print(json.dumps({"error": f"Processing error: {str(e)}", "raw": line.strip()}, indent=2), file=sys.stderr)

if __name__ == "__main__":
    main()
