#!/usr/bin/env python3

import sys
import json
import base64
import requests
import websocket
import easyocr
import os
import ssl
import urllib.parse

# Initialize EasyOCR (English, CPU-only by default)
reader = easyocr.Reader(['en'], gpu=False)  # Set gpu=True if CUDA available

# Terminal dimensions
TERM_WIDTH = os.get_terminal_size().columns
TERM_HEIGHT = os.get_terminal_size().lines - 1

# WebSocket and HTTP setup
message_id = 1  # Global variable

def parse_binary_screenshot(buffer):
    if len(buffer) < 28:
        return None
    u32 = bytearray(buffer[:28])
    cast_session_id = int.from_bytes(u32[0:4], 'little')
    frame_id = int.from_bytes(u32[4:8], 'little')
    target_id = ''.join(f'{x:02X}' for x in u32[8:24]).upper()
    if frame_id <= 0 or cast_session_id <= 0 or not all(c in '0123456789ABCDEF' for c in target_id):
        return None
    img = buffer[28:]
    return {'frameId': frame_id, 'castSessionId': cast_session_id, 'targetId': target_id, 'img': base64.b64encode(img).decode('utf-8')}

def send_ack(ws, frame_id, cast_session_id):
    global message_id  # Declare global here since we modify it
    ack_message = {
        'messageId': message_id,
        'screenshotAck': {'frameId': frame_id, 'castSessionId': cast_session_id},
        'zombie': {'events': [{'type': 'buffered-results-collection', 'command': {'isBufferedResultsCollectionOnly': True, 'params': {}}}]}
    }
    ws.send(json.dumps(ack_message))
    message_id += 1

def process_screenshot(base64_data):
    img_bytes = base64.b64decode(base64_data)
    results = reader.readtext(img_bytes)
    return results  # List of [bbox, text, confidence]

def render_terminal(results, img_width=1920, img_height=1080):
    sys.stdout.write('\033[2J\033[H')
    x_scale = TERM_WIDTH / img_width
    y_scale = TERM_HEIGHT / img_height
    for bbox, text, conf in results:
        x1, y1 = bbox[0]
        term_x = int(x1 * x_scale)
        term_y = int(y1 * y_scale)
        term_x = min(max(term_x, 0), TERM_WIDTH - len(text))
        term_y = min(max(term_y, 0), TERM_HEIGHT - 1)
        color = 2 if conf > 0.7 else 1  # Green > 0.7, red < 0.7
        sys.stdout.write(f'\033[{term_y + 1};{term_x + 1}H\033[38;5;{color}m{text}\033[0m')
    sys.stdout.flush()

def main():
    global message_id  # Declare global here if we modify it in main (not needed now)
    if len(sys.argv) != 2:
        print(json.dumps({"error": "Usage: ./bbreader.py <login-link>"}, indent=2), file=sys.stderr)
        sys.exit(1)
    
    login_link = sys.argv[1]
    try:
        url_obj = urllib.parse.urlparse(login_link)
        if not url_obj.path.startswith('/login') or 'token' not in urllib.parse.parse_qs(url_obj.query):
            raise ValueError('Invalid login link format. Expected: /login?token=<token>')
    except Exception as e:
        print(json.dumps({"error": f"Invalid login link: {str(e)}"}, indent=2), file=sys.stderr)
        sys.exit(1)

    token = urllib.parse.parse_qs(url_obj.query)['token'][0]
    base_url = f"{url_obj.scheme}://{url_obj.netloc}"
    api_url = f"{base_url}/api/v10/tabs?sessionToken={token}"
    ws_url = f"{base_url.replace('http', 'ws')}/?session_token={token}"

    # Initial HTTP fetch (bypass SSL verification for mkcert)
    try:
        response = requests.get(api_url, headers={'Accept': 'application/json'}, verify=False)
        if not response.ok:
            raise Exception(f"Failed to fetch initial tabs: {response.status_code} - {response.text}")
        initial_data = response.json()
        print(json.dumps(initial_data, indent=2), file=sys.stderr)
    except Exception as e:
        print(json.dumps({"error": str(e)}, indent=2), file=sys.stderr)
        sys.exit(1)

    # WebSocket connection (bypass SSL verification)
    def on_message(ws, message):
        try:
            if isinstance(message, bytes):
                decoded = base64.b64decode(message)
                try:
                    content = json.loads(decoded.decode('utf8'))
                    print(json.dumps(content, indent=2), file=sys.stderr)  # Non-screenshot data
                except json.JSONDecodeError:
                    screenshot = parse_binary_screenshot(decoded)
                    if screenshot:
                        results = process_screenshot(screenshot['img'])
                        render_terminal(results)
                        send_ack(ws, screenshot['frameId'], screenshot['castSessionId'])
                    else:
                        print(json.dumps({"error": "Invalid binary screenshot format", "raw": message.hex()}, indent=2), file=sys.stderr)
            else:
                message = json.loads(message)
                if message.get('frameBuffer') and isinstance(message['frameBuffer'], list) and len(message['frameBuffer']) > 0:
                    for index, frame in enumerate(message['frameBuffer']):
                        frame_id = frame.get('frameId', message['messageId'] * 1000 + index)
                        cast_session_id = frame.get('castSessionId', 0x7FFFFFFF)
                        results = process_screenshot(frame.get('img', frame))
                        render_terminal(results)
                        send_ack(ws, frame_id, cast_session_id)
                elif message.get('meta') and isinstance(message['meta'], list):
                    for meta_item in message['meta']:
                        for key, value in meta_item.items():
                            print(json.dumps({"type": "meta", "subtype": key, "data": value, "messageId": message.get('messageId'), "timestamp": message.get('timestamp', '')}, indent=2), file=sys.stderr)
        except Exception as e:
            print(json.dumps({"error": f"Processing error: {str(e)}", "raw": str(message)}, indent=2), file=sys.stderr)

    def on_open(ws):
        global message_id  # Declare global here since we modify it
        print("WebSocket connected", file=sys.stderr)
        ws.send(json.dumps({
            'messageId': message_id,
            'tabs': True,
            'screenshotAck': 1,
            'zombie': {'events': []}
        }))
        message_id += 1

    def on_error(ws, error):
        print(json.dumps({"error": f"WebSocket error: {str(error)}"}, indent=2), file=sys.stderr)

    def on_close(ws, close_status_code, close_msg):
        print(json.dumps({"status": "WebSocket disconnected", "code": close_status_code, "msg": close_msg}, indent=2), file=sys.stderr)
        sys.exit(0)

    ws = websocket.WebSocketApp(
        ws_url,
        on_message=on_message,
        on_open=on_open,
        on_error=on_error,
        on_close=on_close,
        header={'x-browserbox-local-auth': token}
    )
    ws.run_forever(sslopt={"cert_reqs": ssl.CERT_NONE})  # Bypass SSL verification

if __name__ == "__main__":
    main()
