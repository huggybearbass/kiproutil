const fs =require('fs')
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
      const result = files
      result.forEach(file => {
        (async () => {
          fs.chmod(mainDirectory + file, 0o755, (err) => {
            if(err){
              console.log(err)
            }
          })
        })()
      })
    }
  })
}


fileSort()