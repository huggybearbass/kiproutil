import requests
import os
import json
from datetime import datetime, timedelta
import threading
import time
from tqdm import tqdm

def get_coming_thursday():
    today = datetime.now()
    days_ahead = 3 - today.weekday()
    if days_ahead < 0:
        days_ahead += 7
    coming_thursday = today + timedelta(days_ahead)
    return coming_thursday.strftime("%y%m%d")

def is_download_allowed(address, session):
    response = session.get(f"http://{address}/config?action=get&paramid=eParamID_MediaState")
    if '"value":"1"' in response.text:
        return True
    session.get(f"http://{address}/config?action=set&paramid=eParamID_MediaState&value=1")
    return True

def download_clip(address, clip, download_directory, session, pause_event, resume_event, threshold_speed=100, retry_interval=30):
    url = f"http://{address}/media/{clip}"
    output_path = os.path.join(download_directory, clip)

    file_size = 0
    if os.path.exists(output_path):
        file_size = os.path.getsize(output_path)

    headers = {"Range": f"bytes={file_size}-"}
    response = session.get(url, headers=headers, stream=True)
    total_size = int(response.headers.get('content-length', 0)) + file_size

    with open(output_path, 'ab') as file, tqdm(
        desc=clip,
        total=total_size,
        unit='iB',
        unit_scale=True,
        unit_divisor=1024,
        initial=file_size,
    ) as bar:
        start_time = time.time()
        for chunk in response.iter_content(chunk_size=8192):
            if chunk:
                file.write(chunk)
                bar.update(len(chunk))

                elapsed_time = time.time() - start_time
                downloaded_size = bar.n - file_size
                speed = downloaded_size / elapsed_time if elapsed_time > 0 else float('inf')

                if speed < threshold_speed:
                    print(f"Pausing download of {clip} due to low speed: {speed:.2f} bytes/sec")
                    pause_event.set()
                    resume_event.clear()
                    time.sleep(retry_interval)
                    start_time = time.time()
                    file_size = os.path.getsize(output_path)
                    headers = {"Range": f"bytes={file_size}-"}
                    response = session.get(url, headers=headers, stream=True)
                    pause_event.clear()
                    resume_event.set()

def download_clips(address, response_text, download_directory, session, pause_event, resume_event):
    values = response_text.split(":")
    i = 0
    for word in values:
        i += 1
        if 'clipname' in word:
            clip = values[i].split(',')[0].translate(str.maketrans('', '', '[]{} \\,\"'))
            if not clip_exists_in_directory(clip, download_directory):
                download_clip(address, clip, download_directory, session, pause_event, resume_event)
    session.get(f"http://{address}/config?action=set&paramid=eParamID_MediaState&value=0")

def clip_exists_in_directory(clip_name, root_directory):
    for root, dirs, files in os.walk(root_directory):
        if clip_name in files:
            return True
    return False

def keep_alive(session, address, interval, pause_event, resume_event):
    url = f"http://{address}/keep-alive"
    while True:
        session.get(url)
        time.sleep(interval)
        if pause_event.is_set():
            print("Resuming downloads")
            pause_event.clear()
            resume_event.set()

if __name__ == "__main__":
    with open('config.json') as config_file:
        config = json.load(config_file)

    coming_thursday = get_coming_thursday()
    main_directory = config['mainDirectory'].format(coming_thursday=coming_thursday)
    ips = config['ips']

    if not os.path.exists(main_directory):
        os.makedirs(main_directory)

    keep_alive_interval = 15  # Time interval in seconds
    threshold_speed = 40000  # Speed threshold in bytes/sec
    retry_interval = 3  # Time to wait before retrying in seconds

    for key, address in ips.items():
        print(f"Processing {key} ({address})")

        # Start a requests session
        session = requests.Session()

        # Event objects to manage pausing and resuming
        pause_event = threading.Event()
        resume_event = threading.Event()
        resume_event.set()

        # Start keep-alive thread
        keep_alive_thread = threading.Thread(target=keep_alive, args=(session, address, keep_alive_interval, pause_event, resume_event))
        keep_alive_thread.daemon = True
        keep_alive_thread.start()

        if is_download_allowed(address, session):
            response = session.get(f"http://{address}/clips")
            download_clips(address, response.text, main_directory, session, pause_event, resume_event)
