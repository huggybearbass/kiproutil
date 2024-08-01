// Set the timezone to America/New_York (Eastern Time Zone)
process.env.TZ = "America/New_York";

// Calculate the date of the coming Thursday
function getComingThursday() {
    const today = new Date();
    const todayDayOfWeek = today.getDay();
    const daysUntilThursday = (4 - todayDayOfWeek + 7) % 7; // Ensures Thursday is not 'today'
    
    // If today is Thursday, daysUntilThursday should be 0
    const comingThursday = new Date(today.getTime() + daysUntilThursday * 86400000);

    const year = String(comingThursday.getFullYear()).slice(-2);
    const month = String(comingThursday.getMonth() + 1).padStart(2, '0');
    const day = String(comingThursday.getDate()).padStart(2, '0');

    return `${year}${month}${day}`;
}

const comingThursday = getComingThursday();


module.exports = {
    mainDirectory: `/mnt/dropbox/Crossroads Church Dropbox/Ethan Henley/24-07-19_Worship-Night/${comingThursday}/2 SERVICE ELEMENTS`,
    ips: {
      "REC-201": "172.16.11.124",
      "REC-202": "172.16.11.125",
      "REC-203": "172.16.11.126",
      "REC-204": "172.16.11.127",
      "REC-205": "172.16.11.128",
      "REC-206": "172.16.11.129",
      "REC-207": "172.16.11.130",
      "REC-208": "172.16.11.131"
    }
}
