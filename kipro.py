import urllib.request
import sys
import os
import subprocess

def is_download_allowed(address):
    with urllib.request.urlopen(f"http://{address}/config?action=get&paramid=eParamID_MediaState") as f:
        response = f.read().decode()
        if '"value":"1"' in response:
            return True
    with urllib.request.urlopen(f"http://{address}/config?action=set&paramid=eParamID_MediaState&value=1") as f:
        f.read()
    return True

def download_clip(address, clip, download_directory):
    url = f"http://{address}/media/{clip}"
    output_path = os.path.join(download_directory, clip)
    print(f"Downloading {url} to {output_path}")
    subprocess.run(["curl", "--output", output_path, url])

def download_clips(address, response, download_directory):
    values = response.split(":")
    i = 0
    for word in values:
        i += 1
        if 'clipname' in word:
            clip = values[i].split(',')[0].translate(str.maketrans('', '', '[]{} \\,\"'))
            print(f"Checking if clip exists: {clip}")
            if not clip_exists_in_directory(clip, download_directory):
                print(f"Downloading clip: {clip}")
                download_clip(address, clip, download_directory)
            else:
                print(f"Clip already exists: {clip}")
    else:
        with urllib.request.urlopen(f"http://{address}/config?action=set&paramid=eParamID_MediaState&value=0") as f:
            f.read()
        print("No new clips found")

def clip_exists_in_directory(clip_name, root_directory):
    for root, dirs, files in os.walk(root_directory):
        for file in files:
            if file == clip_name:
                return True
    return False

if __name__ == "__main__":
    address = "172.16.11.126"
    download_directory = "/Users/ethan.henley/Downloads/EXP-CONTENT/"

    if is_download_allowed(address):
        print("Looking for new clips")
        with urllib.request.urlopen(f"http://{address}/clips") as f:
            response = f.read().decode()
            download_clips(address, response, download_directory)
