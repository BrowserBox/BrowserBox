#!/usr/bin/env python3

import sys
import json
import base64
import requests
import websocket
import ssl
import traceback
import numpy as np
import easyocr
import cv2
from blessed import Terminal

# Parse command-line arguments
if len(sys.argv) != 2:
    print(json.dumps({"error": "Usage: ./easy_bbxc_ocr.py <login-link>"}))
    sys.exit(1)
login_link = sys.argv[1]

# Extract URL components
from urllib.parse import urlparse, parse_qs
url_obj = urlparse(login_link)
if not url_obj.path.startswith('/login') or 'token' not in parse_qs(url_obj.query):
    print(json.dumps({"error": "Invalid login link format. Expected: /login?token=<token>"}))
    sys.exit(1)

token = parse_qs(url_obj.query)['token'][0]
base_url = f"{url_obj.scheme}://{url_obj.netloc}"
api_url = f"{base_url}/api/v10/tabs?sessionToken={token}"
ws_url = f"{base_url.replace('http', 'ws')}?session_token={token}"

message_id = 1
term = Terminal()

# Initialize EasyOCR
reader = easyocr.Reader(['en'], gpu=False)

def parse_binary_screenshot(buffer):
    if len(buffer) < 28:
        return None
    u32 = np.frombuffer(buffer[:28], dtype=np.uint32)
    is_little_endian = True
    cast_session_id = u32[0] if is_little_endian else int.from_bytes(u32[0].tobytes(), 'big')
    frame_id = u32[1] if is_little_endian else int.from_bytes(u32[1].tobytes(), 'big')
    target_id = ''.join(f"{x:08x}" for x in u32[2:6]).upper()
    if frame_id <= 0 or cast_session_id <= 0 or not all(c in '0123456789ABCDEF' for c in target_id) or len(target_id) != 32:
        return None
    img = buffer[28:]
    return {"frameId": int(frame_id), "castSessionId": int(cast_session_id), "targetId": target_id, "img": base64.b64encode(img).decode('utf-8')}

def send_ack(ws, frame_id, cast_session_id):
    global message_id
    try:
        ack_message = {
            "messageId": message_id,
            "screenshotAck": {"frameId": int(frame_id), "castSessionId": int(cast_session_id)},
            "zombie": {"events": [{"type": "buffered-results-collection", "command": {"isBufferedResultsCollectionOnly": True, "params": {}}}]}
        }
        message_id += 1
        ws.send(json.dumps(ack_message))
    except Exception as e:
        error_msg = f"Send ACK error: {str(e)}\n{traceback.format_exc()}"
        print(term.move_to(1, 1) + term.red(error_msg))

def process_screenshot(base64_data):
    try:
        img_bytes = base64.b64decode(base64_data)
        img_array = np.frombuffer(img_bytes, np.uint8)
        img = cv2.imdecode(img_array, cv2.IMREAD_COLOR)
        if img is None:
            raise ValueError("Failed to decode image with OpenCV - invalid image data")
        
        results = reader.readtext(img, paragraph=True)
        # Return in the format you like: [[[bbox], text], ...]
        processed_results = [
            [
                [
                    [bbox[0][0], bbox[0][1]],
                    [bbox[1][0], bbox[1][1]],
                    [bbox[2][0], bbox[2][1]],
                    [bbox[3][0], bbox[3][1]]
                ],
                text
            ]
            for bbox, text in results  
        ]
        return processed_results
    except Exception as e:
        error_msg = f"OCR error: {str(e)}\n{traceback.format_exc()}"
        print(term.move_to(1, 1) + term.red(error_msg))
        return []

def render_terminal(results, img_width=1920, img_height=1080):
    with term.fullscreen():
        # print(term.clear())
        if not results or not isinstance(results, list):
            print(term.move_to(1, 1) + term.red("No text detected"))
            return

        x_scale = term.width / img_width
        y_scale = (term.height - 1) / img_height
        max_width = term.width - 2

        for result in results:
            # Expecting [bbox, text] format
            if not isinstance(result, list) or len(result) != 2:
                print(term.move_to(1, 1) + term.red("Invalid result format: expected [bbox, text]"))
                continue

            bbox, text = result
            if not isinstance(bbox, list) or len(bbox) < 4 or not isinstance(text, str):
                print(term.move_to(1, 1) + term.red("Invalid bbox or text format"))
                continue

            x0, y0 = bbox[0]  # Top-left
            x1, y1 = bbox[2]  # Bottom-right
            term_x = int(x0 * x_scale) + 1
            term_y = int(y0 * y_scale) + 1
            text_width = int((x1 - x0) * x_scale)
            text_height = int((y1 - y0) * y_scale)

            print(term.move_to(term_x, term_y) + term.white(text))

def main():
    try:
        response = requests.get(api_url, headers={"Accept": "application/json"}, verify=False)
        if not response.ok:
            raise Exception(f"Failed to fetch initial tabs: {response.status_code}")

        ws = websocket.WebSocket()
        ws.connect(ws_url, header={"x-browserbox-local-auth": token})

        with term.fullscreen():
            print(term.move_to(1, 1) + term.green("Connected to WebSocket"))
            ws.send(json.dumps({
                "messageId": message_id,
                "tabs": True,
                "screenshotAck": 1,
                "zombie": {"events": []}
            }))

            while True:
                data = ws.recv()
                try:
                    if isinstance(data, bytes):
                        screenshot = parse_binary_screenshot(data)
                        if screenshot:
                            results = process_screenshot(screenshot["img"])
                            render_terminal(results)
                            send_ack(ws, screenshot["frameId"], screenshot["castSessionId"])
                        else:
                            try:
                                message = json.loads(data.decode('utf-8'))
                                if "frameBuffer" in message and isinstance(message["frameBuffer"], list):
                                    for idx, frame in enumerate(message["frameBuffer"]):
                                        frame_id = frame.get("frameId", message["messageId"] * 1000 + idx)
                                        cast_session_id = frame.get("castSessionId", 0x7FFFFFFF)
                                        img_data = frame.get("img", frame)
                                        if isinstance(img_data, str):
                                            results = process_screenshot(img_data)
                                            render_terminal(results)
                                            send_ack(ws, frame_id, cast_session_id)
                            except json.JSONDecodeError:
                                pass
                    else:
                        message = json.loads(data)
                        if "frameBuffer" in message and isinstance(message["frameBuffer"], list):
                            for idx, frame in enumerate(message["frameBuffer"]):
                                frame_id = frame.get("frameId", message["messageId"] * 1000 + idx)
                                cast_session_id = frame.get("castSessionId", 0x7FFFFFFF)
                                img_data = frame.get("img", frame)
                                if isinstance(img_data, str):
                                    results = process_screenshot(img_data)
                                    render_terminal(results)
                                    send_ack(ws, frame_id, cast_session_id)
                except Exception as e:
                    error_msg = f"Processing error: {str(e)}\n{traceback.format_exc()}"
                    print(term.move_to(1, 1) + term.red(error_msg))
    except Exception as e:
        error_msg = f"Main error: {str(e)}\n{traceback.format_exc()}"
        print(term.move_to(1, 1) + term.red(error_msg))
        sys.exit(1)
    finally:
        ws.close()

if __name__ == "__main__":
    try:
        with term.cbreak():
            main()
    except KeyboardInterrupt:
        print(term.move_to(1, 1) + term.yellow("Shutting down..."))
        sys.exit(0)
