
import fs from 'fs';
import { formatDistance } from 'date-fns';

// 1. Prepare Data
const today = new Date();
const todayDay = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(today);
// Start date Fall 2022
const mcMasterTime = formatDistance(new Date(2022, 8, 1), today, { addSuffix: false });

// 2. Read Image
let homeImageBase64 = '';
try {
  const imageBuffer = fs.readFileSync('home.png');
  homeImageBase64 = `data:image/png;base64,${imageBuffer.toString('base64')}`;
} catch (e) {
  console.warn("Could not load home.png, skipping image embedding.", e.message);
}

// 3. Read Template
fs.readFile('template-custom.svg', 'utf-8', (error, data) => {
  if (error) {
    console.error('Error reading template:', error);
    return;
  }

  let modified = data;

  // --- STRICT REPLACEMENTS ---

  // Name
  // Regex to match "Hi, I'm Jason" or "Hi, I'm Umar" (if already changed)
  modified = modified.replace(/Hi, I’m (Jason|Umar)/g, "Hi, I'm Umar");
  modified = modified.replace("Hi, I'm Jason", "Hi, I'm Umar"); // Covering non-curly quote

  // Location
  // "I live in Columbus, Ohio where it’s supposed to be" -> "I live in Toronto, Ontario Canada"
  // Using regex to capture the whole line if possible, or just the known prefix
  modified = modified.replace(/I live in Columbus, Ohio where it’s supposed to be/g, "I live in Toronto, Ontario Canada");
  // Also clean up the weather line that follows it in the original template
  modified = modified.replace(/{degF}° F \({degC}° C\) and <tspan class="emoji">{weatherEmoji}<\/tspan> today\./g, "");
  // If previously replaced with "I live in Toronto, Canada...", fix it to "Toronto, Ontario Canada"
  modified = modified.replace("I live in Toronto, Canada 🇨🇦", "I live in Toronto, Ontario Canada");

  // Bio
  // Target the specific lines.
  // Old: "I’m a product designer. I used to work at GitHub,"
  // New: "current swe intern @ EcoClaim"
  modified = modified.replace(/I’m a product designer\. I used to work at GitHub,/g, "current swe intern @ EcoClaim");
  // Old part 2: "but I’ve been at PlanetScale for {psTime} now."
  // New: "ex PE intern @ Meta"
  modified = modified.replace(/but I’ve been at PlanetScale for {psTime} now\./g, "ex PE intern @ Meta");
  // Handle previous attempt's strings if they exist
  modified = modified.replace("Computer Science @ McMaster University,", "current swe intern @ EcoClaim");
  modified = modified.replace("Ex Production Engineer Intern at Meta", "ex PE intern @ Meta");


  // Project PolyYield
  // "My favorite project is isometric-contributions. It’s a "
  modified = modified.replace(/My favorite project is isometric-contributions\. It’s a /g, "Check out PolyYield:");
  // "browser extension that shows your GitHub " -> "No-lose prediction markets where"
  modified = modified.replace(/browser extension that shows your GitHub /g, "No-lose prediction markets where");
  // "contributions like this" -> "your principal is always protected."
  modified = modified.replace(/contributions like this/g, "your principal is always protected.");

  // Previous attempt fixes might need overwriting too
  modified = modified.replace("Check out my latest project: PolyYield", "Check out PolyYield:");
  modified = modified.replace("A defi yield aggregator", "No-lose prediction markets where");
  modified = modified.replace("on the polygon chain", "your principal is always protected.");


  // --- REMOVE BLUESKY / ADD IMAGE ---
  // The Bluesky section is commonly in a group with class "msg-5" or distinct text.
  // We'll replace the entire Bluesky block with our Image block.

  const imageBlock = homeImageBase64 ?
    `<g transform="translate(10, 320)" class="msg-5">
       <image x="0" y="0" width="450" href="${homeImageBase64}" />
     </g>`
    : ''; // If no image, just remove.

  // Regex to find the Bluesky group. It contains "bsky.app"
  // We look for <g ... class="msg-5"> ... </g> roughly.
  // Safer to match the unique text content and replace parents if possible, or just the text?
  // Let's replace the link text and the preceding "Check out..." with empty, or the image.

  // Actually, simplest is to repurpose msg-5 for the image if we can fit it.
  // But `msg-5` might have a `<rect>` bubble we don't want for a raw image.
  // Let's try to string replace the whole block if we can identify it.
  // The block starts with `<!-- Bluesky -->` in my previous `view_file`.

  const blueskyRegex = /<!-- Bluesky -->[\s\S]*?class="msg-5"[\s\S]*?<\/g>/;
  if (blueskyRegex.test(modified)) {
    modified = modified.replace(blueskyRegex, `<!-- Home Image -->\n${imageBlock}`);
  } else {
    // Fallback: If comment is missing, find by unique content
    const linkRegex = /<g transform="translate\(10, 560\)" class="msg-5">[\s\S]*?bsky\.app[\s\S]*?<\/g>/;
    modified = modified.replace(linkRegex, `<!-- Home Image -->\n${imageBlock}`);
  }

  // If the image tag was removed previously (as found in search), we just inserted it above ^
  // If the previous image tag text "data:image/png;base64" was replaced by "width=0", we should ensure we don't have ghost tags.
  // But since we are replacing the "Bluesky" section (msg-5) with the new Image, 
  // and the *original* image was somewhere else (msg 4.5?), we should be okay.
  // Wait, I should double check where the *Original* big image was. 
  // It was usually *inside* the project description or adjacent. 
  // If my previous script removed it effectively, it's gone.
  // The user wants `home.png` *instead* of whatever was there.
  // Putting it in the `msg-5` slot (formatted as the imageBlock) seems appropriate as it's the "next" item sequence.
  // We might need to adjust the Y-coordinate of msg-5 (formerly 560) to be closer to the text if there's a gap.
  // Text ends around 300. 560 is far down. Let's move it up to 320 (as defined in imageBlock).

  // We also need to move `msg-6` (Footer) up if we move `msg-5` up, OR just let it act as a spacer?
  // 560 to 320 is -240px. The footer is at 632. -240 => 392.
  // If I move msg-5 to 320, I should move msg-6 to roughly 320 + height_of_image + padding.
  // Height of image is set to ~250? (width 450, aspect ratio?). 
  // Let's assume height 300 for safety. 320 + 300 = 620. 
  // Use regex to adjust `msg-6` y-coordinate if needed.
  // `transform="translate(10, 632)"` -> `transform="translate(10, 650)"` (just to be safe).
  // Actually, let's just leave the footer where it is (632), it fits a ~300px image at y=320.

  // --- VARIABLES ---
  modified = modified.replace('{mcMasterTime}', mcMasterTime);
  modified = modified.replace('{todayDay}', todayDay);

  // Write result
  fs.writeFile('chat.svg', modified, (err) => {
    if (err) console.error(err);
    else console.log('✅ chat.svg generated with home.png and specific text fixes!');
  });
});
