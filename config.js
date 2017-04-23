const path = require('path');
const config = {};

config.sourceDir = '/Users/ilopez/ril/docs/diary';
config.targetDir = config.sourceDir;

config.dbPath = path.join(config.targetDir, "allnotes.nedb");

module.exports = config;