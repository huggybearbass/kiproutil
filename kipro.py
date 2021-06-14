# This script polls the unit downloads any new clips it hasn't already downloaded to the current directory 

# Arguments:  hostname or IP address of Ki Pro unit

import urllib, sys, string, os, posix, time

def is_download_allowed(address):
    f = urllib.urlopen("http://"+address+"/config?action=get&paramid=eParamID_MediaState")
    response = f.read()
    if (response.find('"value":"1"') > -1):
        return True
    f = urllib.urlopen("http://"+address+"/config?action=set&paramid=eParamID_MediaState&value=1")

def download_clip(clip):
    url = "http://" + address + "/media/" + clip
    print (url)
    posix.system("curl --output " + clip + " " + url);

def download_clips(response):
    values = response.split(":")
    i = 0
    for word in values:
        i += 1
        if(word.find('clipname') > -1):
            clip = values[i].split(',')[0].translate(string.maketrans("",""), '[]{} \,\"\" ')
            if not os.path.exists(clip):
                print ("Downloading clip: " + clip)
                download_clip(clip)
        else:
            f = urllib.urlopen("http://"+address+"/config?action=set&paramid=eParamID_MediaState&value=0")
            print ("No new clips found")

address = sys.argv[1]

if (is_download_allowed(address)):
    print ("Looking for new clips")
    f = urllib.urlopen("http://"+address+"/clips")
    response = f.read()
    download_clips(response)