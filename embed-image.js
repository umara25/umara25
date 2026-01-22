
import fs from 'fs';

// 1. Prepare Data
const today = new Date();
const todayDay = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(today);

// 2. Read Image & Parse Dimensions (for rounded corners)
let homeImageBase64 = '';
let imgWidth = 450;
let imgHeight = 300; // default fallback

try {
    const imageBuffer = fs.readFileSync('home.png');
    homeImageBase64 = `data:image/png;base64,${imageBuffer.toString('base64')}`;

    // Parse PNG IHDR (Start at byte 16, 4 bytes width, 4 bytes height, Big Endian)
    // Signature: 8 bytes. Chunk Len: 4 bytes. Chunk Type (IHDR): 4 bytes. -> Data starts at 16.
    // We assume valid PNG for simplicity.
    if (imageBuffer.length > 24) {
        const w = imageBuffer.readUInt32BE(16);
        const h = imageBuffer.readUInt32BE(20);
        if (w > 0 && h > 0) {
            imgWidth = w;
            imgHeight = h;
            console.log(`✅ Parsed Image Dimensions: ${w}x${h}`);
        }
    }
} catch (e) {
    console.warn("Could not load home.png or parse dimensions, skipping image embedding.", e.message);
}

// 3. Extract Styles (Fonts) from Template-Custom
let fontStyles = '';
try {
    const customTemplate = fs.readFileSync('template-custom.svg', 'utf-8');
    // Match inside <defs><style> ... </style></defs>
    const match = customTemplate.match(/<defs>\s*<style>([\s\S]*?)<\/style>\s*<\/defs>/);
    if (match && match[1]) {
        fontStyles = match[1];
    } else {
        // Fallback search
        const match2 = customTemplate.match(/<style>([\s\S]*?)<\/style>/);
        if (match2 && match2[1] && match2[1].includes('@font-face')) {
            fontStyles = match2[1];
        }
    }
} catch (e) {
    console.warn("Could not read template-custom.svg for fonts:", e.message);
}

// 4. Read FORCE Template
fs.readFile('template-force.svg', 'utf-8', (error, data) => {
    if (error) {
        console.error('Error reading template-force.svg:', error);
        return;
    }

    let modified = data;

    // --- SCALE IMAGE TO FIT BUBBLE WIDTH ---
    // If image is wider than 450 (bubble max width approx), scale height accordingly.
    const MAX_WIDTH = 450;
    let displayWidth = imgWidth;
    let displayHeight = imgHeight;

    if (imgWidth > MAX_WIDTH) {
        const ratio = MAX_WIDTH / imgWidth;
        displayWidth = MAX_WIDTH;
        displayHeight = Math.round(imgHeight * ratio);
    }

    // --- CLIP PATH FOR ROUNDED CORNERS ---
    const clipPathId = 'img-clip-' + Date.now();
    const clipPathDef = `
    <clipPath id="${clipPathId}">
      <rect x="0" y="0" width="${displayWidth}" height="${displayHeight}" rx="18" />
    </clipPath>
  `;

    // --- STYLE INJECTION (Inc. ClipPath) ---
    // We inject fonts + the clip path into the placeholders
    let combinedDefs = '';
    if (fontStyles || clipPathDef) {
        combinedDefs = `<defs><style>${fontStyles || ''}</style>${clipPathDef}</defs>`;
    }

    modified = modified.replace('<!-- STYLES_PLACEHOLDER -->', combinedDefs);

    // --- IMAGE INJECTION ---
    const imageBlock = homeImageBase64 ?
        `<image x="0" y="0" width="${displayWidth}" height="${displayHeight}" href="${homeImageBase64}" clip-path="url(#${clipPathId})" />`
        : '';

    modified = modified.replace('<!-- IMAGE_PLACEHOLDER -->', imageBlock);

    // --- DAY VARIABLE ---
    modified = modified.replace(/{todayDay}/g, todayDay);

    // Write result
    fs.writeFile('chat.svg', modified, (err) => {
        if (err) console.error(err);
        else console.log('✅ chat.svg generated with ROUNDED IMAGE and FONTS!');
    });
});
