const fs = require('fs');
const path = require('path');

const buildInfoDir = path.join(__dirname, 'artifacts', 'build-info');
const files = fs.readdirSync(buildInfoDir).filter(f => f.endsWith('.json'));

let found = false;
for (const file of files) {
  const filePath = path.join(buildInfoDir, file);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  
  // Look for our contract in the output
  if (data.output && data.output.contracts && data.output.contracts['contracts/examples/DirectMessagePod.sol']) {
    console.log(`Found in ${file}`);
    
    const standardInput = data.input;
    
    // We need to write this to a file. 
    // BUT we must check if the keys in standardInput.sources start with 'contracts/' or 'project/contracts/'
    fs.writeFileSync('Clean-Standard-Input.json', JSON.stringify(standardInput, null, 2));
    console.log('Saved to Clean-Standard-Input.json');
    found = true;
    break;
  }
}

if (!found) {
  console.log("Could not find build-info containing DirectMessagePod.sol");
}
