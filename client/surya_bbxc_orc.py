#!/usr/bin/env python3

# Script: surya_bbxc_ocr.py
# Purpose: Run Surya OCR on screenshots from bbxc stdin

import sys
import json
import base64
from io import BytesIO
from PIL import Image
from surya.ocr import run_ocr
from surya.model.detection import load_model as load_det_model, load_processor as load_det_processor
from surya.model.recognition import load_model as load_rec_model, load_processor as load_rec_processor

# Load Surya models (downloads weights on first run)
det_model = load_det_model()
det_processor = load_det_processor()
rec_model = load_rec_model()
rec_processor = load_rec_processor()

def process_screenshot(base64_data):
    # Decode base64 to image
    img_data = base64.b64decode(base64_data)
    img = Image.open(BytesIO(img_data)).convert('RGB')

    # Run OCR (assuming English for simplicity; adjust langs as needed)
    langs = ["en"]
    results = run_ocr([img], [langs], det_model, det_processor, rec_model, rec_processor)

    # Extract text
    text = " ".join([box.text for page in results for box in page.text_lines])
    return text

def main():
    print("Reading JSON messages from stdin...")
    for line in sys.stdin:
        try:
            message = json.loads(line.strip())
            if message.get("type") == "screenshot" and "data" in message:
                # Process screenshot
                text = process_screenshot(message["data"])
                output = {
                    "type": "ocr_result",
                    "frameId": message.get("frameId"),
                    "castSessionId": message.get("castSessionId"),
                    "targetId": message.get("targetId"),
                    "text": text,
                    "timestamp": message.get("timestamp")
                }
                print(json.dumps(output, indent=2))
            else:
                # Pass through non-screenshot messages
                print(json.dumps(message, indent=2))
        except json.JSONDecodeError:
            print(json.dumps({"error": f"Invalid JSON: {line.strip()}"}, indent=2))
        except Exception as e:
            print(json.dumps({"error": f"Processing error: {str(e)}", "raw": line.strip()}, indent=2))

if __name__ == "__main__":
    main()
