#!/usr/bin/env python3

import sys
import json
import base64
import easyocr
import os

# Initialize EasyOCR (English, CPU-only by default)
reader = easyocr.Reader(['en'], gpu=False)  # Set gpu=True if CUDA available

# Get terminal dimensions
TERM_WIDTH = os.get_terminal_size().columns
TERM_HEIGHT = os.get_terminal_size().lines - 1  # Leave 1 line for status

def process_screenshot(base64_data):
    img_bytes = base64.b64decode(base64_data)
    results = reader.readtext(img_bytes)
    text = " ".join([res[1] for res in results])
    bboxes = [res[0] for res in results]  # [(x1,y1),(x2,y2),(x3,y3),(x4,y4)]
    return text, bboxes

def render_terminal(text, bboxes, img_width=1920, img_height=1080):
    # Clear terminal
    sys.stdout.write('\033[2J\033[H')
    
    # Split text into words (assuming spaces separate detected regions)
    words = text.split()
    if len(words) != len(bboxes):
        words = [text[i:i+10] for i in range(0, len(text), 10)]  # Fallback: chunk text
    
    # Map bounding boxes to terminal coordinates
    for bbox, word in zip(bboxes, words):
        # Use top-left corner (x1, y1) of bbox
        x1, y1 = bbox[0]
        # Scale to terminal size (assuming original image size is 1920x1080 or similar)
        term_x = int(x1 * TERM_WIDTH / img_width)
        term_y = int(y1 * TERM_HEIGHT / img_height)
        
        # Ensure bounds
        term_x = min(max(term_x, 0), TERM_WIDTH - len(word))
        term_y = min(max(term_y, 0), TERM_HEIGHT - 1)
        
        # Move cursor and write text (white foreground, no background for simplicity)
        sys.stdout.write(f'\033[{term_y + 1};{term_x + 1}H\033[38;5;15m{word}\033[0m')

    sys.stdout.flush()

def main():
    print("Reading JSON messages from stdin...", file=sys.stderr)
    for line in sys.stdin:
        try:
            message = json.loads(line.strip())
            if message.get("type") == "screenshot" and "data" in message:
                text, bboxes = process_screenshot(message["data"])
                render_terminal(text, bboxes)
                # JSON debug output to stderr
                output = {
                    "type": "ocr_result",
                    "frameId": message.get("frameId"),
                    "castSessionId": message.get("castSessionId"),
                    "targetId": message.get("targetId"),
                    "text": text,
                    "bounding_boxes": bboxes,
                    "timestamp": message.get("timestamp")
                }
                print(json.dumps(output, indent=2), file=sys.stderr)
            else:
                print(json.dumps(message, indent=2), file=sys.stderr)
        except json.JSONDecodeError:
            print(json.dumps({"error": f"Invalid JSON: {line.strip()}"}, indent=2), file=sys.stderr)
        except Exception as e:
            print(json.dumps({"error": f"Processing error: {str(e)}", "raw": line.strip()}, indent=2), file=sys.stderr)

if __name__ == "__main__":
    main()
