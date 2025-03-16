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
    # Return results as-is: list of [bbox, text, confidence]
    return results

def render_terminal(results, img_width=1920, img_height=1080):
    # Clear terminal
    sys.stdout.write('\033[2J\033[H')
    
    # Scale factors
    x_scale = TERM_WIDTH / img_width
    y_scale = TERM_HEIGHT / img_height

    # Render each text fragment at its bounding box position
    for bbox, text, conf in results:
        # Use top-left corner (x1, y1) of bbox
        x1, y1 = bbox[0]
        term_x = int(x1 * x_scale)
        term_y = int(y1 * y_scale)
        
        # Ensure bounds
        term_x = min(max(term_x, 0), TERM_WIDTH - len(text))
        term_y = min(max(term_y, 0), TERM_HEIGHT - 1)
        
        # Color based on confidence (green for high, red for low)
        color = 2 if conf > 0.7 else 1  # ANSI 2=green, 1=red
        sys.stdout.write(f'\033[{term_y + 1};{term_x + 1}H\033[38;5;{color}m{text}\033[0m')

    sys.stdout.flush()

def main():
    print("Reading JSON messages from stdin...", file=sys.stderr)
    for line in sys.stdin:
        try:
            message = json.loads(line.strip())
            if message.get("type") == "screenshot" and "data" in message:
                results = process_screenshot(message["data"])
                render_terminal(results)
            # No JSON output unless error
        except json.JSONDecodeError:
            print(json.dumps({"error": f"Invalid JSON: {line.strip()}"}, indent=2), file=sys.stderr)
        except Exception as e:
            print(json.dumps({"error": f"Processing error: {str(e)}", "raw": line.strip()}, indent=2), file=sys.stderr)

if __name__ == "__main__":
    main()
