const KiPro = require("./index.js").KiPro;
const fs = require('fs');
const moveFile = require('move-file');
const path = require('path');

// Read mainDirectory from kipro-target.json
const scriptDir = path.dirname(__filename);
const configFile = path.join(scriptDir, 'kipro-target.json');

let mainDirectory;
try {
  const config = JSON.parse(fs.readFileSync(configFile, 'utf8'));
  mainDirectory = config.mainDirectory;
} catch (err) {
  console.error('Error reading kipro-target.json:', err);
  process.exit(1);
}

const kipro = new KiPro("192.168.15.9");

async function run() {
  kipro.getClips(function(response) {
    const dates = response;
    const lastCLips = dates.clips;

    lastCLips.forEach(element => {
      const dateInfo = new Date(`${element.timestamp.substr(0, 8)}`);
      let nameOfClip = dateInfo.toISOString().substr(2, 8) + '_' + element.clipname;

      kipro.getMedia(element.clipname, mainDirectory + nameOfClip, function(file, location) {
        console.log(file, location);
      });
    });
  });
}

run();