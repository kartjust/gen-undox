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
  '0-background','1-frame','2-accessories','3-body',
  '4-head','5-nose','6-line','7-mouth','8-eyes'
];
const layerNames = [
  'Background','Frame','Accessories','Body',
  'Head','Nose','Line','Mouth','Eyes'
];

const WEIGHTS = {
  // FRAME
  'X': 5, 'IX': 10,
  'VII': 25, 'VIII': 25,
  'I': 60, 'II': 60, 'III': 60, 'IV': 60, 'V': 60, 'VI': 60,

  // ACCESSORIES
  'Tiara': 5, 'Fez': 5, 'DIE': 5, 'King': 5,
  'Crown of a King': 10, 'Crown-of-Thorns': 10, 'Sacred': 10,
  "Angels'": 25, 'Desire': 25, 'FEArrr': 25, 'HYPE': 25,
  'Hoomaaan!': 25, 'Seals': 25, 'Storm': 25,
  'Grave': 60, 'Hope': 60, 'Prank': 60, 'Receiver': 60, 'SMOKE': 60,

  // BODY & HEAD & LINE
  'True': 5, 'NOT TRUE': 10, 'NOT FALSE': 25, 'False': 60, 'Unknown': 60,

  // NOSE
  'Not Cubic': 5,
  'Fragile': 10, 'Trance': 10, 'Bull': 10,
  'Chief': 25, 'Razor': 25, 'Kitty': 25, 'Bone': 25, 'Cell': 25,
  'Basic': 60, 'Basic I': 60, 'Basic II': 60, 'Curved': 60,
  'Flash': 60, 'Piggy': 60, 'Pulpy': 60, 'Tool': 60, 'x x': 60,

  // MOUTH
  'Cursed': 5, 'In Vain': 5, 'Puppet': 5,
  'Forgotten': 10, "King's Lip": 10, 'Lost': 10, 'Victim': 10,
  'Addict': 25, 'Board': 25, 'Chalkie': 25,
  'Checkers': 25, 'Royal': 25, 'Shame': 25,
  'Palette': 60, 'Prisoner': 60, 'Puryyy': 60, 'Robo': 60, 'X': 60,

  // EYES
  'Hidden': 5, '6': 5,
  'Fatal': 10, 'Ghost': 10, 'Hypnotized': 10, "King's Eyes": 10,
  'Chubby': 25, 'Karma': 25, 'Oppressed': 25,
  'Wounded': 60,
};

function getWeightForLayer(name, layerIdx) {
  // X: legendary in frame (1), common in mouth (7) and eyes (8)
  if (name === 'X' && layerIdx === 1) return 5;
  if (name === 'X' && (layerIdx === 7 || layerIdx === 8)) return 60;
  // Demon: legendary in eyes (8), rare in accessories (2)
  if (name === 'Demon') return layerIdx === 8 ? 5 : 10;
  // King: legendary in both accessories (2) and nose (5)
  if (name === 'King') return 5;
  // King-O: rare in mouth (7), uncommon in eyes (8)
  if (name === 'King-O') return layerIdx === 7 ? 10 : 25;
  // Forgotten: rare in both mouth (7) and eyes (8)
  if (name === 'Forgotten') return 10;
  // Bone: uncommon in both mouth (7) and nose (5)
  if (name === 'Bone') return 25;
  // Angels': uncommon in both accessories (2) and mouth (7)
  if (name === "Angels'") return 25;
  // Prisoner: uncommon in both eyes (8) and mouth (7)
  if (name === 'Prisoner') return 25;
  return WEIGHTS[name] !== undefined ? WEIGHTS[name] : 60;
}

function getRarity(weight) {
  if (weight <= 5)  return 'legendary';
  if (weight <= 10) return 'rare';
  if (weight <= 25) return 'uncommon';
  return 'common';
}

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
        .filter(f => /\.webp$/i.test(f) && !f.startsWith('.'))
        .sort()
        .map(f => {
          const name = f.replace(/\.[^.]+$/, '');
          const weight = getWeightForLayer(name, idx);
          return {
            src: 'assets/' + char + '/' + layer + '/' + f,
            name: name,
            rarity: getRarity(weight),
            weight: weight
          };
        });
    } catch (e) {}
    manifest.characters[charKey].layers[idx] = files;
  });
});

fs.writeFileSync('manifest.json', JSON.stringify(manifest, null, 2));
console.log('\nmanifest.json created with rarity weights!\n');

Object.keys(manifest.characters).forEach(c => {
  console.log(c + ':');
  Object.entries(manifest.characters[c].layers).forEach(([l, files]) => {
    if (files.length > 0) {
      const byRarity = {};
      files.forEach(f => { byRarity[f.rarity] = (byRarity[f.rarity] || 0) + 1; });
      const summary = Object.entries(byRarity).map(([r,n]) => n+'x '+r).join(', ');
      console.log('  Layer ' + l + ' (' + layerNames[l] + '): ' + files.length + ' files — ' + summary);
    }
  });
  console.log('');
});
