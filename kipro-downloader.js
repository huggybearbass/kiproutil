"use strict";

const KiPro = require("./index.js").KiPro

const kipro = new KiPro("192.168.15.9")

kipro.getClips(function (response) {
  const dates = response
  const lastCLips = dates.clips
  lastCLips.forEach(element => {
  const dateInfo = new Date(`${element.timestamp.substr(0, 8)}`) 
    let nameOfClip = dateInfo.toISOString().substr(2, 8) + '_' + element.clipname
    kipro.getMedia(element.clipname, '/Volumes/1TB HD/Definition Church Dropbox/Worship/RESOURCES/VIDEO/' + nameOfClip, function(file, location) {
      console.log(file, location)
    })
  })
})