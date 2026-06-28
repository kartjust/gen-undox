const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');
const path = require('path');

// ── CONFIG ──
const TOTAL_SUPPLY = 2424;
const PER_ARCHETYPE = TOTAL_SUPPLY / 4; // 606 each
const OUTPUT_DIR = 'output';
const IMAGES_DIR = path.join(OUTPUT_DIR, 'images');
const METADATA_DIR = path.join(OUTPUT_DIR, 'metadata');
const CANVAS_SIZE = 1080;

const ARCHETYPES = ['FALSE', 'NOT FALSE', 'NOT TRUE', 'TRUE'];
const ARCHETYPE_DIRS = {
  'FALSE': 'false',
  'NOT FALSE': 'not-false',
  'NOT TRUE': 'not-true',
  'TRUE': 'true'
};

// ── SETUP ──
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR);
if (!fs.existsSync(IMAGES_DIR)) fs.mkdirSync(IMAGES_DIR);
if (!fs.existsSync(METADATA_DIR)) fs.mkdirSync(METADATA_DIR);

// ── LOAD MANIFEST ──
const manifest = JSON.parse(fs.readFileSync('manifest.json', 'utf8'));

// ── WEIGHTED RANDOM ──
function weightedRandom(assets) {
  if (!assets || assets.length === 0) return null;
  const totalWeight = assets.reduce((sum, a) => sum + (a.weight || 60), 0);
  let rand = Math.random() * totalWeight;
  for (const asset of assets) {
    rand -= (asset.weight || 60);
    if (rand <= 0) return asset;
  }
  return assets[assets.length - 1];
}

// ── GENERATE COMBINATION ──
function generateCombination(archetype) {
  const charData = manifest.characters[archetype];
  const layers = charData.layers;
  const chosen = {};

  for (let i = 0; i <= 8; i++) {
    const assets = layers[i] || layers[String(i)];
    chosen[i] = weightedRandom(assets);
  }

  return chosen;
}

// ── COMBINATION KEY (for uniqueness check) ──
function comboKey(combo) {
  return Object.values(combo).map(a => a ? (a.name || '') : 'null').join('|');
}

// ── GENERATE ALL COMBOS ──
async function generateAll() {
  console.log(`\nGenerating ${TOTAL_SUPPLY} tokens...\n`);

  const allCombos = [];
  const seenKeys = new Set();

  for (const archetype of ARCHETYPES) {
    console.log(`Generating ${PER_ARCHETYPE} combos for ${archetype}...`);
    let count = 0;
    let attempts = 0;

    while (count < PER_ARCHETYPE) {
      attempts++;
      if (attempts > PER_ARCHETYPE * 100) {
        console.warn(`  Warning: Could not generate ${PER_ARCHETYPE} unique combos for ${archetype}, got ${count}`);
        break;
      }

      const combo = generateCombination(archetype);
      const key = archetype + '|' + comboKey(combo);

      if (!seenKeys.has(key)) {
        seenKeys.add(key);
        allCombos.push({ archetype, combo });
        count++;
      }
    }

    console.log(`  ✓ ${count} unique combos generated`);
  }

  // Shuffle so archetypes are mixed
  for (let i = allCombos.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [allCombos[i], allCombos[j]] = [allCombos[j], allCombos[i]];
  }

  return allCombos;
}

// ── RENDER CANVAS ──
async function renderToken(combo, archetype) {
  const canvas = createCanvas(CANVAS_SIZE, CANVAS_SIZE);
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

  const charData = manifest.characters[archetype];
  const layers = charData.layers;
  const layerOrder = Object.keys(layers).sort((a, b) => parseInt(a) - parseInt(b));

  for (const layerId of layerOrder) {
    const asset = combo[layerId];
    if (!asset) continue;

    // Use PNG version
    let src = asset.src || asset;
    src = src.replace('.webp', '.png');

    if (!fs.existsSync(src)) continue;

    try {
      const img = await loadImage(src);
      ctx.drawImage(img, 0, 0, CANVAS_SIZE, CANVAS_SIZE);
    } catch (e) {
      console.warn(`  Failed to load: ${src}`);
    }
  }

  return canvas;
}

// ── BUILD ATTRIBUTES ──
function buildAttributes(archetype, combo) {
  const layerNames = ['Background', 'Frame', 'Accessories', 'Body', 'Head', 'Nose', 'Line', 'Mouth', 'Eyes'];
  const attrs = [
    { trait_type: 'Archetype', value: archetype }
  ];

  for (let i = 0; i <= 8; i++) {
    const asset = combo[i];
    if (asset && asset.name) {
      attrs.push({
        trait_type: layerNames[i],
        value: asset.name,
        rarity: asset.rarity || 'common'
      });
    }
  }

  return attrs;
}

// ── MAIN ──
async function main() {
  const allCombos = await generateAll();

  console.log(`\nRendering ${allCombos.length} images...\n`);

  let done = 0;
  const startTime = Date.now();

  for (let i = 0; i < allCombos.length; i++) {
    const tokenId = i + 1;
    const { archetype, combo } = allCombos[i];

    // Render image
    try {
      const canvas = await renderToken(combo, archetype);
      const imgPath = path.join(IMAGES_DIR, `${tokenId}.png`);
      const out = fs.createWriteStream(imgPath);
      const stream = canvas.createPNGStream();
      await new Promise((resolve, reject) => {
        stream.pipe(out);
        out.on('finish', resolve);
        out.on('error', reject);
      });
    } catch (e) {
      console.error(`Token ${tokenId} image failed:`, e.message);
    }

    // Write metadata
    const attributes = buildAttributes(archetype, combo);
    const metadata = {
      name: `GEN-UNDOX #${tokenId}`,
      description: 'un-doxxed.',
      image: `IPFS_PLACEHOLDER/${tokenId}.png`,
      attributes
    };

    fs.writeFileSync(
      path.join(METADATA_DIR, `${tokenId}`),
      JSON.stringify(metadata, null, 2)
    );

    done++;
    if (done % 50 === 0 || done === allCombos.length) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
      const rate = (done / elapsed).toFixed(1);
      const eta = ((allCombos.length - done) / rate).toFixed(0);
      console.log(`${done}/${allCombos.length} — ${elapsed}s elapsed, ~${eta}s remaining (${rate}/s)`);
    }
  }

  console.log(`\n✓ Done! ${allCombos.length} images → output/images/`);
  console.log(`✓ Done! ${allCombos.length} metadata → output/metadata/`);
  console.log(`\nNext: Upload output/images/ to Pinata, get IPFS hash, update metadata files.`);
}

main().catch(console.error);
