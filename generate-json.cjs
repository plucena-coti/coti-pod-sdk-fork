const fs = require('fs');
const path = require('path');

const buildInfoDir = path.join(__dirname, 'artifacts', 'build-info');
const files = fs.readdirSync(buildInfoDir);
const buildInfoPath = path.join(buildInfoDir, files[0]);
const buildInfo = JSON.parse(fs.readFileSync(buildInfoPath, 'utf8'));

const standardJson = {
  language: buildInfo.input.language,
  sources: buildInfo.input.sources,
  settings: {
    optimizer: buildInfo.input.settings.optimizer
  }
};

fs.writeFileSync('DirectMessagePod-standard-input.json', JSON.stringify(standardJson, null, 2));
console.log('Saved to DirectMessagePod-standard-input.json');
