const fs = require('fs');

const data = JSON.parse(fs.readFileSync('artifacts/build-info/solc-0_8_26-ffa07219e2b59e327f1ddd675cf30c66f85c8bfe.json', 'utf8'));

const input = data.input;

const newSources = {};
for (const [key, value] of Object.entries(input.sources)) {
    let newKey = key;
    
    // Hardhat puts things under project/ or npm/ etc
    if (newKey.startsWith('npm/')) {
        // Find the actual package name by stripping version
        // npm/@coti-io/coti-contracts@1.1.0/contracts/...
        newKey = newKey.substring(4);
        let parts = newKey.split('/');
        
        if (parts[0].startsWith('@')) {
            parts[1] = parts[1].split('@')[0];
        } else {
            parts[0] = parts[0].split('@')[0];
        }
        newKey = parts.join('/');
    } else if (newKey.startsWith('project/')) {
        // Strip project/ prefix so the filename matches what normally would be deployed
        newKey = newKey.substring(8);
    }
    
    newSources[newKey] = value;
}

input.sources = newSources;

// Delete remappings completely, as we mapped the sources to exactly match the import statements
delete input.settings.remappings;

// Hardhat does an AST output array, let's remove that to save space or leave it?
// Leave outputSelection but simplify it to just bytecode
input.settings.outputSelection = {
  "*": {
     "*": [
        "abi",
        "evm.bytecode",
        "evm.deployedBytecode",
        "evm.methodIdentifiers",
        "metadata"
      ]
  }
};

fs.writeFileSync('DirectMessagePod-standard-input-fixed2.json', JSON.stringify(input, null, 2));
console.log("Written cleaned standard input without remappings, resolving 'project/' -> '' and 'npm/' -> ''");
