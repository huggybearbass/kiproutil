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