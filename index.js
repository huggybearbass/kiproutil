"use strict";

const axios = require("axios");
const fs = require("fs");
const path = require("path");
const os = require("os");
const ProgressBar = require("progress");
const host = "0.0.0.0";

let downloadInstances = 0;
const maxDownloadInstances = 8;
const downloadQueue = [];

function KiPro(newHost) {
    host = newHost;
}

KiPro.prototype.getParameter = async function (parameter, cb) {
    try {
        const response = await axios.get(`http://${host}/config?action=get&paramid=${parameter}`);
        cb(response.data);
    } catch (error) {
        console.error(`Error getting parameter ${parameter}: ${error.message}`);
    }
}

KiPro.prototype.setParameter = async function (parameter, value, cb) {
    try {
        const response = await axios.get(`http://${host}/config?action=set&paramid=${parameter}&value=${value}`);
        cb(response.data);
    } catch (error) {
        console.error(`Error setting parameter ${parameter}: ${error.message}`);
    }
}

KiPro.prototype.getClips = async function (cb) {
    try {
        const response = await axios.get(`http://${host}/clips?action=get_clips`);
        cb(response.data);
    } catch (error) {
        console.error(`Error getting clips: ${error.message}`);
    }
}

KiPro.prototype.getPlaylists = async function (cb) {
    try {
        const response = await axios.get(`http://${host}/clips?action=get_playlists`);
        cb(response.data);
    } catch (error) {
        console.error(`Error getting playlists: ${error.message}`);
    }
}

KiPro.prototype.getMedia = async function (file, location, callb) {
    // Setup the transfer logic
    const download = async () => {
        // Replace tilde with home directory path
        const homeDir = os.homedir();
        location = location.replace('~', homeDir);

        // Ensure directory exists before writing
        const directory = path.dirname(location);
        if (!fs.existsSync(directory)) {
            fs.mkdirSync(directory, { recursive: true });
        }

        downloadQueue.push({ host: `http://${host}/media/${file}`, file: file, location: location, cb: callb });
        downloader();
    }

    // Check if KiPro is in DATA-LAN mode
    this.getParameter("eParamID_MediaState", async (cb) => {
        if (cb.value == 0) {
            this.setParameter("eParamID_MediaState", 1, download);
        } else {
            await download();
        }
    });
}

async function downloader() {
    if (downloadQueue.length > 0) {
        if (downloadInstances < maxDownloadInstances) {
            await pop(downloadQueue.pop());
        }
    }

    async function pop(dl) {
        downloadInstances++;
        console.log(`Transfer of ${dl.host} initiated.`);

        const fileSize = fs.existsSync(dl.location) ? fs.statSync(dl.location).size : 0;

        let attempts = 0;
        const maxAttempts = 5;
        const backoffInterval = 2000; // 2 seconds

        while (attempts < maxAttempts) {
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
                    console.log(`Transfer of ${dl.host} completed.`);
                    downloadInstances--;
                    dl.cb(true, dl.location, dl.file);
                    downloader();
                });

                response.data.on('error', (err) => {
                    throw err;
                });

                break;
            } catch (error) {
                attempts++;
                console.log(`Error downloading ${dl.file}: ${error.message}. Retrying in ${backoffInterval / 1000} seconds...`);
                if (attempts < maxAttempts) {
                    await new Promise(resolve => setTimeout(resolve, backoffInterval));
                } else {
                    console.log(`Failed to download ${dl.file} after ${maxAttempts} attempts.`);
                    downloadInstances--;
                    dl.cb(false);
                    downloader();
                }
            }
        }
    }
}

// Handle process signals to clean up downloads
process.on('SIGTERM', () => {
    console.log('Caught SIGTERM, cleaning up downloads...');
    downloadQueue.length = 0; // Clear the queue
    process.exit();
});

process.on('SIGINT', () => {
    console.log('Caught SIGINT, cleaning up downloads...');
    downloadQueue.length = 0; // Clear the queue
    process.exit();
});

exports.KiPro = KiPro;
