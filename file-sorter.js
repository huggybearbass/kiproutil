const fs = require('fs');
const path = require('path');
const config = require('./config.js');

const mainDirectory = config.mainDirectory;

function fileSort() {
  fs.readdir(mainDirectory, (err, files) => {
    if (err) {
      console.error(err);
    } else {
      const result = files.filter(fileName => fileName.endsWith('.mov' || '.mp4'));
      result.forEach(file => {
        (async () => {
          const oldPath = path.join(mainDirectory, file);
          const newDirectory = path.join(mainDirectory, file.substr(0, 8));
          if (!fs.existsSync(newDirectory)) {
            fs.mkdirSync(newDirectory);
          }
          const newPath = path.join(newDirectory, file);
          fs.rename(oldPath, newPath, function (err) {
            if (err) throw err;
            console.log(`${oldPath} has been moved to ${newPath}`);
          });
        })();
      });
    }
  });
}

fileSort();
