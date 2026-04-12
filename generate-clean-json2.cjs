const fs = require('fs');
const path = require('path');

const buildInfoDir = path.join(__dirname, 'artifacts', 'build-info');
const files = fs.readdirSync(buildInfoDir).filter(f => f.endsWith('.json'));

for (const file of files) {
  const filePath = path.join(buildInfoDir, file);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  console.log(`Output contracts keys in ${file}:`, Object.keys(data.output.contracts || {}));
}
