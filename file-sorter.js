const fs =require('fs')
const moveFile = require('move-file')
const path = require('path');

// Read mainDirectory from kipro-target.json
const scriptDir = path.dirname(__filename);
const configFile = path.join(scriptDir, 'kipro-target.json');

function fileSort() {
  try {
    const config = JSON.parse(fs.readFileSync(configFile, 'utf8'));
    mainDirectory = config.mainDirectory;
  } catch (err) {
    console.error('Error reading kipro-target.json:', err);
    process.exit(1);
  }

  fs.readdir(mainDirectory, (err, files) => {
    if (err)
      console.log(err)
    else {
      const result = files.filter(fileName => fileName.substr(-4, 4) == '.mp4')
      result.forEach(file => {
        (async () => {
          const oldPath = mainDirectory + file
          const newDirectory = mainDirectory + file.substr(0, 8)
          if (!fs.existsSync(newDirectory)){
            fs.mkdirSync(newDirectory);
            }
          const newPath = mainDirectory + file.substr(0, 8) + '/' + file
          await fs.rename(oldPath, newPath, function (err) {
            if (err) throw err
          })
          console.log(`${oldPath} has been moved to ${newPath}`);
        })()
      })
    }
  })
}

fileSort()