const fs =require('fs')
const moveFile = require('move-file')

function fileSort() {
  const mainDirectory = '/Volumes/1TB HD/Definition Church Dropbox/Creative/RESOURCES/WS_FOOTAGE/'

  fs.readdir(mainDirectory, (err, files) => {
    if (err)
      console.log(err)
    else {
      const result = files.filter(fileName => fileName.substr(-4, 4) == '.mp4')
      result.forEach(file => {
        (async () => {
          const oldPath = mainDirectory + file
          const newPath = mainDirectory + file.substr(0, 8) + '/' + file
          await moveFile(oldPath, newPath);
          console.log(`${oldPath} has been moved to ${newPath}`);
        })()
      })
    }
  })
}

fileSort()