// SVG path extractor for neheh-circuit-inkscape.svg
// Outputs JSON with all labeled paths and their d attributes

const fs = require('fs');
const path = require('path');

const svgRaw = fs.readFileSync(
  path.join(__dirname, '../public/images/neheh-circuit-inkscape.svg'),
  'utf8'
);

// The g17 (streak-indicators) group has paths in Inkscape px units
// All other paths are in SVG mm user units (viewBox "0 0 210 297")
// Conversion: 1mm = 3.7795275591 px, so scale = 1/3.7795275591 = 0.26458333

// Extract paths by scanning for inkscape:label + d attribute
// Pattern: within a <path ...> element, find inkscape:label and d

// Split by <path to get individual path elements
const pathElements = svgRaw.split('<path');

const extracted = {};

for (let i = 1; i < pathElements.length; i++) {
  const chunk = pathElements[i];
  // Get the part up to the first />
  const endIdx = chunk.indexOf('/>');
  if (endIdx === -1) continue;
  const el = chunk.substring(0, endIdx);

  // Extract inkscape:label
  const labelMatch = el.match(/inkscape:label="([^"]+)"/);
  if (!labelMatch) continue;
  const label = labelMatch[1];

  // Extract id
  const idMatch = el.match(/\bid="([^"]+)"/);
  const id = idMatch ? idMatch[1] : 'unknown';

  // Extract d
  const dMatch = el.match(/\bd="([^"]+)"/);
  if (!dMatch) continue;
  const d = dMatch[1];

  extracted[label] = { id, d };
}

// Also extract rect paths (decan ticks use <path> but let's check)
// Check for shen-ring-of-commitment
// console.log('Found labels:', Object.keys(extracted).sort());

// Output all found labels
const labels = Object.keys(extracted).sort();
console.log(`Found ${labels.length} labeled paths:\n`);
labels.forEach(l => {
  const d = extracted[l].d;
  console.log(`${l} (${extracted[l].id}): ${d.substring(0, 60)}...`);
});

// Check which ones are in g17 (streak-indicators)
// Find g17 in raw SVG
const g17Start = svgRaw.indexOf('id="g17"');
const g17End = svgRaw.indexOf('</g>', g17Start);
const g17Content = svgRaw.substring(g17Start, g17End);
const g17Ids = [];
let idMatch;
const idRe = /\bid="([^"]+)"/g;
while ((idMatch = idRe.exec(g17Content)) !== null) {
  g17Ids.push(idMatch[1]);
}
console.log('\ng17 (streak-indicators) contains ids:', g17Ids.join(', '));

// Output the JSON data structure for the React component
const output = {
  coordinateInfo: {
    viewBox: "0 0 210 297",
    structuralPaths: "mm coordinate space (matches SVG viewBox directly)",
    indicatorPaths: "Inkscape px space, apply scale(0.26458333) = scale(1/3.7795275591)",
    center: "approximately (106.43, 147.70) in mm space",
  },
  structural: {},
  indicators: {}
};

const indicatorLabels = [
  'decan-indicator-1','decan-indicator-2','decan-indicator-3','decan-indicator-4',
  'decan-indicator-5','decan-indicator-6','decan-indicator-7','decan-indicator-8',
  'decan-indicator-9','decan-indicator-10',
  'iris-indicator-1','iris-indicator-2','iris-indicator-3','iris-indicator-4',
  'iris-indicator-5','iris-indicator-6','iris-indicator-7',
  'outer-ring-indicator','outermost-ring-indicator'
];

for (const [label, data] of Object.entries(extracted)) {
  if (indicatorLabels.includes(label)) {
    output.indicators[label] = data.d;
  } else {
    output.structural[label] = data.d;
  }
}

fs.writeFileSync(
  path.join(__dirname, '../src/data/NehehCircuitSVGData.json'),
  JSON.stringify(output, null, 2)
);

console.log('\n✓ Written to src/data/NehehCircuitSVGData.json');
console.log(`  Structural paths: ${Object.keys(output.structural).length}`);
console.log(`  Indicator paths: ${Object.keys(output.indicators).length}`);
