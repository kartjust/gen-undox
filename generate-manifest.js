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

// Rarity weights per asset name (filename without extension)
// LEGENDARY=5, RARE=10, UNCOMMON=25, COMMON=60
const WEIGHTS = {
  // FRAME
  'X':         5,  // LEGENDARY
  'IX':        10, // RARE
  'VII':       25, 'VIII': 25, // UNCOMMON
  'I':         60, 'II': 60, 'III': 60, 'IV': 60, 'V': 60, 'VI': 60, // COMMON

  // ACCESSORIES
  'Sacred':    5, 'Tiara': 5, 'Fez': 5, 'DIE': 5,          // LEGENDARY
  'Crown of a King': 10, 'Demon': 10, 'Storm': 10, 'Crown-of-Thorns': 10, // RARE
  "Angels'":   25, 'Desire': 25, 'FEArrr': 25, 'HYPE': 25,
  'Hoomaaan!': 25, 'King': 25, 'Seals': 25,                 // UNCOMMON
  'Grave':     60, 'Hope': 60, 'Prank': 60, 'Receiver': 60, 'SMOKE': 60, // COMMON

  // BODY & HEAD & LINE
  'True':      5,  // LEGENDARY
  'NOT TRUE':  10, // RARE
  'NOT FALSE': 25, // UNCOMMON
  'False':     60, // COMMON
  'Unknown':   60, // NOT FALSE body/head

  // NOSE
  'King':         5, 'Not Cubic': 5,                                   // LEGENDARY
  'Fragile':      10, 'Trance': 10, 'Bull': 10,                        // RARE
  'Chief':        25, 'Razor': 25, 'Kitty': 25, 'Bone': 25, 'Cell': 25, // UNCOMMON
  'Basic':        60, 'Basic II': 60, 'Curved': 60, 'Flash': 60,
  'Piggy':        60, 'Pulpy': 60, 'Tool': 60, 'x x': 60,             // COMMON

  // MOUTH
  'Cursed':       5, 'In Vain': 5, 'Puppet': 5,                       // LEGENDARY
  'Forgotten':    10, "King's Lip": 10, 'King-O': 10, 'Lost': 10, 'Victim': 10, // RARE
  'Addict':       25, "Angels'": 25, 'Board': 25, 'Chalkie': 25,
  'Checkers':     25, 'Royal': 25, 'Shame': 25,                        // UNCOMMON
  'Basic I':      60, 'Palette': 60, 'Prisoner': 60,
  'Puryyy':       60, 'Robo': 60,                                       // COMMON

  // EYES
  'Hidden':       5, '6': 5,                                            // LEGENDARY
  'Fatal':        10, 'Ghost': 10, 'Hypnotized': 10, "King's Eyes": 10, // RARE
  'Chubby':       25, 'Karma': 25, 'King-O': 25, 'Oppressed': 25, 'Prisoner': 25, // UNCOMMON
  'Wounded':      60, 'x x': 60,                                        // COMMON
};

// Rarity label mapping
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
        .filter(f => /\.(png|jpg|jpeg)$/i.test(f) && !f.startsWith('.'))
        .sort()
        .map(f => {
          const name = f.replace(/\.[^.]+$/, '');
          const weight = WEIGHTS[name] !== undefined ? WEIGHTS[name] : 60;
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
