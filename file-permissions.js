const fs =require('fs')

function fileSort() {
  const mainDirectory = '/Volumes/1TB HD/Definition Church Dropbox/Creative/RESOURCES/WS_FOOTAGE/'

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