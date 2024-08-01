"use strict";

var events = require("events");
var _ = require("underscore");
var axios = require("axios");
var fs = require("fs");
var path = require("path");
var os = require("os");
var ProgressBar = require('progress');
var host = "0.0.0.0";

var downloadInstances = 0;
var maxDownloadInstances = 8;
var downloadQueue = [];

function KiPro (newHost) {
    host = newHost;
}

KiPro.prototype.getParameter = function (parameter, cb) {
    query('config?action=get&paramid=' + parameter, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            var response = JSON.parse(body);
            cb(response);
        }
    });
}

KiPro.prototype.setParameter = function (parameter, value, cb) {
    query('config?action=set&paramid=' + parameter + '&value=' + value, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            var response = JSON.parse(body);
            cb(response);
        }
    });
}

KiPro.prototype.getClips = function (cb) {
    query('clips?action=get_clips', function (error, response, body) {
        if (!error && response.statusCode == 200) {
            var response = JSON.parse(body);
            cb(response);
        }
    });
}

KiPro.prototype.getPlaylists = function (cb) {
    query('clips?action=get_playlists', function (error, response, body) {
        if (!error && response.statusCode == 200) {
            var response = JSON.parse(body);
            cb(response);
        }
    });
}

KiPro.prototype.getMedia = function (file, location, callb) {
    // Setup the transfer logic
    function download() {
        // Replace tilde with home directory path
        const homeDir = os.homedir();
        location = location.replace('~', homeDir);

        // Ensure directory exists before writing
        const directory = path.dirname(location);
        if (!fs.existsSync(directory)) {
            fs.mkdirSync(directory, { recursive: true });
        }

        downloadQueue.push({ host: 'http://' + host + '/media/' + file, file: file, location: location, cb: callb });
        downloader();
    }

    // Check if KiPro is in DATA-LAN mode
    KiPro.prototype.getParameter("eParamID_MediaState", function(cb) {
        if (cb.value == 0) {
            KiPro.prototype.setParameter("eParamID_MediaState", 1, download);
        } else {
            download();
        }
    });
}

function downloader() {
    if (downloadQueue.length > 0) {
        if (downloadInstances < maxDownloadInstances) {
            pop(downloadQueue.pop());
        }
    }

    async function pop(dl) {
        downloadInstances++;
        console.log("Transfer of " + dl.host + " initiated.");

        const fileSize = fs.existsSync(dl.location) ? fs.statSync(dl.location).size : 0;

        while (true) {
            try {
                const response = await axios({
                    method: 'get',
                    url: dl.host,
                    responseType: 'stream',
                    headers: {
                        'Range': `bytes=${fileSize}-`
                    }
                });

                const totalLength = parseInt(response.headers['content-length'], 10) + fileSize;
                const bar = new ProgressBar(`Downloading ${dl.file} [:bar] :percent :etas`, { total: totalLength, width: 40 });

                response.data.on('data', (chunk) => {
                    fs.appendFileSync(dl.location, chunk);
                    bar.tick(chunk.length);
                });

                response.data.on('end', () => {
                    console.log("Transfer of " + dl.host + " completed.");
                    downloadInstances--;
                    dl.cb(true, dl.location, dl.file);
                    downloader();
                });

                response.data.on('error', (err) => {
                    throw err;
                });

                break;
            } catch (error) {
                console.log(`Error downloading ${dl.file}: ${error.message}. Retrying...`);
            }
        }
    }
}

function query(action, cb) {
    request('http://' + host + '/' + action, cb);
}

exports.KiPro = KiPro;

