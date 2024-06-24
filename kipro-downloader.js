const KiPro = require("./index.js").KiPro;
const config = require('./config.js');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const mainDirectory = config.mainDirectory;

function getFileDuration(filePath) {
    return new Promise((resolve, reject) => {
        exec(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${filePath}"`, (error, stdout, stderr) => {
            if (error) {
                return reject(error);
            }
            resolve(Math.round(parseFloat(stdout)));
        });
    });
}

async function processKiPro(ip, key) {
    const kipro = new KiPro(ip);

    return new Promise((resolve, reject) => {
        kipro.getClips((response) => {
            if (!response || !response.clips) {
                console.error(`Error: No clips found for ${key} (${ip})`);
                return resolve([]);
            }

            const lastClips = response.clips;
            console.log(`Found ${lastClips.length} clips for ${key} (${ip})`);

            let pendingDownloads = lastClips.length;
            const downloadedFiles = [];

            if (pendingDownloads === 0) {
                return resolve([]);
            }

            lastClips.forEach((element) => {
                const dateInfo = new Date(`${element.timestamp.substr(0, 8)}`);
                const nameOfClip = dateInfo.toISOString().substr(2, 8) + '_' + element.clipname;
                const filePath = path.join(mainDirectory, nameOfClip);

                kipro.getMedia(element.clipname, filePath, (success, location, file) => {
                    if (success) {
                        console.log(`Expected file duration is ${element.duration}`);
                        downloadedFiles.push(location);
                    } else {
                        console.error(`Error: Transfer failed for ${file} from ${key} (${ip})`);
                    }

                    pendingDownloads--;
                    if (pendingDownloads === 0) {
                        resolve(downloadedFiles);
                    }
                });
            });
        });
    });
}

async function run() {
    for (const [key, ip] of Object.entries(config.ips)) {
        console.log(`Processing ${key} (${ip})`);
        try {
            const downloadedFiles = await processKiPro(ip, key);
            for (const file of downloadedFiles) {
                try {
                    const duration = await getFileDuration(file);
                    console.log(`Actual duration: ${duration} seconds`);
                } catch (error) {
                    console.error(`Error getting duration for file ${file}: ${error.message}`);
                }
            }
        } catch (error) {
            console.error(`Error processing ${key} (${ip}): ${error.message}`);
        }
    }
}

run();
