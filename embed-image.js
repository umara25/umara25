
import fs from 'fs';

// 1. Prepare Data
const today = new Date();
const todayDay = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(today);

// 2. Read Image
let homeImageBase64 = '';
try {
    const imageBuffer = fs.readFileSync('home.png');
    homeImageBase64 = `data:image/png;base64,${imageBuffer.toString('base64')}`;
} catch (e) {
    console.warn("Could not load home.png, skipping image embedding.", e.message);
}

// 3. Read FORCE Template
fs.readFile('template-force.svg', 'utf-8', (error, data) => {
    if (error) {
        console.error('Error reading template-force.svg:', error);
        return;
    }

    let modified = data;

    // --- IMAGE INJECTION ---
    const imageBlock = homeImageBase64 ?
        `<image x="0" y="0" width="450" href="${homeImageBase64}" />`
        : '';

    modified = modified.replace('<!-- IMAGE_PLACEHOLDER -->', imageBlock);

    // --- DAY VARIABLE ---
    modified = modified.replace(/{todayDay}/g, todayDay);

    // Write result
    fs.writeFile('chat.svg', modified, (err) => {
        if (err) console.error(err);
        else console.log('✅ chat.svg generated from template-force.svg with Image!');
    });
});
