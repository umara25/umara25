
import fs from 'fs';
import { formatDistance } from 'date-fns';

// 1. Prepare Data
const today = new Date();
const todayDay = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(today);
// Start date Fall 2022
const mcMasterTime = formatDistance(new Date(2022, 8, 1), today, { addSuffix: false });

const dayBubbleWidths = {
  Monday: 235,
  Tuesday: 235,
  Wednesday: 260,
  Thursday: 245,
  Friday: 220,
  Saturday: 245,
  Sunday: 230,
};

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

  // --- CONTENT REPLACEMENTS ---

  // Name
  modified = modified.replace(/Hi, I’m (Jason|Umar)/g, "Hi, I'm Umar");
  modified = modified.replace("Hi, I'm Jason", "Hi, I'm Umar");

  // Location
  modified = modified.replace(/I live in (Columbus|Toronto).*$/gm, "I live in Toronto, Ontario Canada");
  modified = modified.replace(/{degF}° F \({degC}° C\) and <tspan class="emoji">{weatherEmoji}<\/tspan> today\./g, "");

  // Box Height Fix (Corrected Regex: Added closing parenthesis for group 2)
  modified = modified.replace(/(class="msg-2"[\s\S]*?<rect width="\d+" height=")66(")/g, '$142$2');


  // Bio
  modified = modified.replace(/(Computer Science @ McMaster University,|I’m a product designer\. I used to work at GitHub,)/g, "I am currently interning @ EcoClaim");
  modified = modified.replace(/(Ex Production Engineer Intern at Meta|but I’ve been at PlanetScale for {psTime} now\.)/g, "and previously @ Meta");


  // Project PolyYield Link
  modified = modified.replace(/(Check out (my latest project: )?PolyYield(:)?)/g, "Check out PolyYield: https://polyyield.vercel.app/");

  if (!modified.includes("No-lose prediction markets")) {
    modified = modified.replace("A defi yield aggregator", "No-lose prediction markets where");
    modified = modified.replace("on the polygon chain", "your principal is always protected.");
  }


  // --- IMAGE & FOOTER ---

  // Image Replacement (msg-5)
  const imageBlock = homeImageBase64 ?
    `<g transform="translate(10, 320)" class="msg-5">
       <image x="0" y="0" width="450" href="${homeImageBase64}" />
     </g>`
    : '';

  if (modified.includes('class="msg-5"')) {
    modified = modified.replace(/<g transform="translate\(\d+, \d+\)" class="msg-5">[\s\S]*?<\/g>/, imageBlock);
  } else if (modified.includes('<!-- Bluesky -->')) {
    const blueskyRegex = /<!-- Bluesky -->[\s\S]*?<\/g>/;
    modified = modified.replace(blueskyRegex, `<!-- Home Image -->\n${imageBlock}`);
  }

  // Footer (msg-6)
  // Text: Remove Emoji
  modified = modified.replace(/Have a great ({todayDay}|Thursday)! <tspan class="emoji">.*?<\/tspan>/g, "Have a great {todayDay}!");

  // Position: Move closer to image (from 632 to 600)
  modified = modified.replace(/transform="translate\(10, 632\)" class="msg-6"/g, 'transform="translate(10, 600)" class="msg-6"');

  // --- VARIABLES ---
  modified = modified.replace(/{mcMasterTime}/g, mcMasterTime);
  modified = modified.replace(/{todayDay}/g, todayDay);
  const bubbleWidth = dayBubbleWidths[todayDay] || 245;
  modified = modified.replace(/{dayBubbleWidth}/g, bubbleWidth);

  // Write result
  fs.writeFile('chat.svg', modified, (err) => {
    if (err) console.error(err);
    else console.log('✅ chat.svg generated: Bio, Link, Location(42px), Footer(600px+NoEmoji+BubbleFixed)!');
  });
});
