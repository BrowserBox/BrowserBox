#!/usr/bin/env python3

# Script: surya_bbxc_orc.py
# Purpose: Run Surya OCR on screenshots from bbxc stdin

import sys
import json
import base64
from io import BytesIO
from PIL import Image
from surya.detection import DetectionPredictor
from surya.recognition import RecognitionPredictor

# Load Surya predictors (downloads weights on first run)
det_predictor = DetectionPredictor()
rec_predictor = RecognitionPredictor()

def process_screenshot(base64_data):
    # Decode base64 to image
    img_data = base64.b64decode(base64_data)
    img = Image.open(BytesIO(img_data)).convert('RGB')

    # Run OCR (English for simplicity; adjust langs as needed)
    langs = ["en"]
    predictions = rec_predictor([img], [langs], det_predictor)

    # Extract text from predictions
    text = " ".join([line.text for page in predictions for line in page.text_lines])
    # return text
    return predictions

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
                    "timestamp": message.get("timestamp")
                }
                print(json.dumps(output, indent=2))
                print(text)
            else:
                # Pass through non-screenshot messages
                print(json.dumps(message, indent=2))
        except json.JSONDecodeError:
            print(json.dumps({"error": f"Invalid JSON: {line.strip()}"}, indent=2))
        except Exception as e:
            print(json.dumps({"error": f"Processing error: {str(e)}", "raw": line.strip()}, indent=2))

if __name__ == "__main__":
    main()
