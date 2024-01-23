const GLOBAL_CONFIG = require('../config');
const fs = require('fs');

let screenDirName;

const startDebugSession = async function () {
    const d_t = new Date();

    let year = d_t.getFullYear();
    let month = ("0" + (d_t.getMonth() + 1)).slice(-2);
    let day = ("0" + d_t.getDate()).slice(-2);
    let hour = d_t.getHours();
    let minute = d_t.getMinutes();
    let seconds = d_t.getSeconds();
    screenDirName = year + "_" + month + "_" + day + "_" + hour + "_" + minute + "_" + seconds;
    if (!fs.existsSync(GLOBAL_CONFIG.screenshotsDir + '/' + screenDirName)) {
        await fs.mkdirSync(GLOBAL_CONFIG.screenshotsDir + '/' + screenDirName, {recursive: true});
    }
};

const log = function(message) {
    GLOBAL_CONFIG.needLog && console.log('DEBUG: ' + message);
};

const makeScreen = async function(page, name) {
    GLOBAL_CONFIG.needScreenshots && await page.screenshot({path: GLOBAL_CONFIG.screenshotsDir + screenDirName + '/' + name + '.png'});
};


module.exports.startDebugSession = startDebugSession;
module.exports.log = log;
module.exports.makeScreen = makeScreen;