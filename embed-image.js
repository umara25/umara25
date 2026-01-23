
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
    const match = customTemplate.match(/<defs>\s*<style>([\s\S]*?)<\/style>\s*<\/defs>/);
    if (match && match[1]) {
        fontStyles = match[1];
    } else {
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
    const MAX_WIDTH = 450;
    let displayWidth = imgWidth;
    let displayHeight = imgHeight;

    if (imgWidth > MAX_WIDTH) {
        const ratio = MAX_WIDTH / imgWidth;
        displayWidth = MAX_WIDTH;
        displayHeight = Math.round(imgHeight * ratio);
    }

    // --- CALCULATE DYNAMIC POSITIONS & SVG HEIGHT ---
    const imageY = 282;
    const gap = 20;
    const footerY = imageY + displayHeight + gap;
    const footerAnimStart = footerY + 5;

    // Footer Bubble Height is 42px. We add ~40px padding at bottom.
    const totalHeight = footerY + 42 + 40;

    console.log(`ℹ️  ImgH: ${displayHeight}, FooterY: ${footerY}, TotalSVGHeight: ${totalHeight}`);

    // 1. Update SVG Dimensions
    // Regex to replace height="800" and viewBox="0 0 600 800"
    modified = modified.replace(/height="800"/, `height="${totalHeight}"`);
    modified = modified.replace(/viewBox="0 0 600 800"/, `viewBox="0 0 600 ${totalHeight}"`);

    // 2. Move Footer Group
    modified = modified.replace(/transform="translate\(10, 742\)"/g, `transform="translate(10, ${footerY})"`);

    // 3. Update Footer Animations
    modified = modified.replace('translate(10px, 747px)', `translate(10px, ${footerAnimStart}px)`);
    modified = modified.replace('translate(10px, 742px)', `translate(10px, ${footerY}px)`);

    // --- CLIP PATH FOR ROUNDED CORNERS ---
    const clipPathId = 'img-clip-' + Date.now();
    const clipPathDef = `
    <clipPath id="${clipPathId}">
      <rect x="0" y="0" width="${displayWidth}" height="${displayHeight}" rx="18" />
    </clipPath>
  `;

    // --- STYLE INJECTION ---
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
        else console.log('✅ chat.svg generated (CROPPED & SPACED)');
    });
});
