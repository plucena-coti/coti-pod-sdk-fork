const fs = require('fs');

const inputPath = 'DirectMessagePod-standard-input.json';
const json = JSON.parse(fs.readFileSync(inputPath, 'utf8'));

const newSources = {};
for (const [key, value] of Object.entries(json.sources)) {
    let newKey = key;
    
    // Fix npm packages: "npm/@coti-io/coti-contracts@1.1.0/contracts/..." -> "@coti-io/coti-contracts/contracts/..."
    if (newKey.startsWith('npm/')) {
        // Strip 'npm/'
        newKey = newKey.substring(4);
        
        // Remove version string (e.g. "@1.1.0" or "@5.0.0") from the first occurrence before the next slash
        // For scoped packages like @coti-io/something@1.2.3/path -> match @coti-io/something@version/path
        
        let parts = newKey.split('/');
        console.log("Analyzing", parts);
        
        if (parts[0].startsWith('@')) {
            // Scoped package: parts[0] is @scope, parts[1] is package@version
            let pkgAndVersion = parts[1];
            let atIndex = pkgAndVersion.indexOf('@');
            if (atIndex !== -1) {
                parts[1] = pkgAndVersion.substring(0, atIndex);
            }
        } else {
            // Unscoped package: parts[0] is package@version
            let pkgAndVersion = parts[0];
            let atIndex = pkgAndVersion.indexOf('@');
            if (atIndex !== -1) {
                parts[0] = pkgAndVersion.substring(0, atIndex);
            }
        }
        newKey = parts.join('/');
    }
    
    // Fix project files: "project/contracts/..." -> "contracts/..."
    // Wait, the Solidity compiler error was:
    // --> project/contracts/examples/DirectMessageEvm.sol:8:1:
    // This implies the compiler DID find the local file (under "project/contracts/...") and evaluated it, but failed to find the absolute import.
    // So "project/" is completely fine to keep! We only need to fix the npm package paths.
    
    // Wait, let's keep "project/contracts/" since that's their name in the sources dictionary.
    // If I rename them to "contracts/", the file compiling might fail if we specify them as "project/" in "settings.compilationTarget" or whatever.
    // Actually, earlier the user error was from blockscout trying to compile "project/contracts/...". So "project" is fine!

    console.log(`Mapped: ${key} -> ${newKey}`);
    newSources[newKey] = value;
}

json.sources = newSources;

fs.writeFileSync('DirectMessagePod-standard-input.json', JSON.stringify(json, null, 2));
console.log('Successfully fixed paths');
