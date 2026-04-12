const fs = require('fs');

const inputPath = 'DirectMessagePod-standard-input.json';
const data = JSON.parse(fs.readFileSync(inputPath, 'utf8'));

// The explorer might be complaining about node_modules prefixes. Let's fix the keys in the sources array.
const newSources = {};
for (const [key, value] of Object.entries(data.sources)) {
  let newKey = key;
  // If it's a node module, block explorers typically want it mapped explicitly verbatim
  // without node_modules/ prepended to the import.
  if (key.startsWith('node_modules/')) {
     newKey = key.replace('node_modules/', '');
  }
  newSources[newKey] = value;
}

data.sources = newSources;

fs.writeFileSync('DirectMessagePod-standard-input-fixed.json', JSON.stringify(data, null, 2));
console.log('Saved fixed versions to DirectMessagePod-standard-input-fixed.json');
