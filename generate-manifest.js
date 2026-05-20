const fs = require('fs');
const path = require('path');

const chars = ['false', 'not-false', 'not-true', 'true'];
const charKeys = {
  'false': 'FALSE',
  'not-false': 'NOT FALSE',
  'not-true': 'NOT TRUE',
  'true': 'TRUE'
};
const layers = [
  '0-background',
  '1-frame',
  '2-accessories',
  '3-body',
  '4-head',
  '5-nose',
  '6-line',
  '7-mouth',
  '8-eyes'
];
const layerNames = [
  'Background', 'Frame', 'Accessories', 'Body',
  'Head', 'Nose', 'Line', 'Mouth', 'Eyes'
];

const manifest = {
  collection: 'GEN-UNDOX',
  version: '1.0',
  layers: layers.map((l, i) => ({ id: i, name: layerNames[i] })),
  characters: {}
};

chars.forEach(char => {
  const charKey = charKeys[char];
  manifest.characters[charKey] = { layers: {} };

  layers.forEach((layer, idx) => {
    const dir = path.join('assets', char, layer);
    let files = [];
    try {
      files = fs.readdirSync(dir)
        .filter(f => /\.(png|jpg|jpeg)$/i.test(f) && !f.startsWith('.'))
        .sort()
        .map(f => 'assets/' + char + '/' + layer + '/' + f);
    } catch (e) {
      // folder empty or missing
    }
    manifest.characters[charKey].layers[idx] = files;
  });
});

fs.writeFileSync('manifest.json', JSON.stringify(manifest, null, 2));
console.log('\nmanifest.json created!\n');

Object.keys(manifest.characters).forEach(c => {
  console.log(c + ':');
  Object.entries(manifest.characters[c].layers).forEach(([l, files]) => {
    if (files.length > 0) {
      console.log('  Layer ' + l + ' (' + layerNames[l] + '): ' + files.length + ' files');
    }
  });
  console.log('');
});
