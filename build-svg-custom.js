import fs from 'fs'
import { formatDistance } from 'date-fns'

// Time at McMaster University (started Fall 2022)
const today = new Date()
const todayDay = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(today)

// Calculate time at McMaster
const mcMasterTime = formatDistance(new Date(2022, 8, 1), today, {
  addSuffix: false,
})

// Bubble widths
const dayBubbleWidths = {
  Monday: 235,
  Tuesday: 235,
  Wednesday: 260,
  Thursday: 245,
  Friday: 220,
  Saturday: 245,
  Sunday: 230,
}

fs.readFile('template-custom.svg', 'utf-8', (error, data) => {
  if (error) {
    console.error('Error reading template:', error)
    return
  }

  let modified = data;

  // --- FORCE CORRECTIONS (In case template is wrong) ---

  // 1. Name
  modified = modified.replace("Hi, I'm Jason", "Hi, I'm Umar");

  // 2. Location
  modified = modified.replace("I live in Columbus, Ohio where it’s supposed to be", "I live in Toronto, Canada 🇨🇦");
  modified = modified.replace("{degF}° F ({degC}° C) and <tspan class=\"emoji\">{weatherEmoji}</tspan> today.", "");

  // 3. Bio
  // Check if it's the old one
  if (modified.includes("I’m a product designer")) {
    modified = modified.replace("I’m a product designer. I used to work at GitHub,", "Computer Science Student @ McMaster");
    modified = modified.replace("but I’ve been at PlanetScale for {psTime} now.", "Ex Production Engineer Intern at Meta");
  }
  // User asked for "Computer Science @ McMaster University, Ex Production Engineer..."
  // If my previous setup script half-worked, it might be messy. Let's force consistent state if possible.
  // But regex is safer for partial matches.

  // 4. Project
  modified = modified.replace("My favorite project is isometric-contributions. It’s a ", "Check out my latest project: PolyYield");
  modified = modified.replace("browser extension that shows your GitHub ", "A defi yield aggregator");
  modified = modified.replace("contributions like this", "on the polygon chain");

  // 5. Block the Image (Hide it)
  // We replace the start of the image tag with a comment start or hidden group
  // The huge base64 string follows, so we just break the tag.
  // Original: <image x="10" y="98" width="444" height="264" href="data:image/png;base64,.....
  if (modified.includes('<image x="10" y="98" width="444" height="264" href="data:image/png;base64,')) {
    modified = modified.replace('<image x="10" y="98" width="444" height="264" href="data:image/png;base64,', '<g display="none"><text>');
    // This is hacky. Better to just use regex to replace the known unique start line.
  }

  // 6. Social Link Text Fix
  // The href was fixed to PolyYield but the text "https://bsky..." remains.
  modified = modified.replace("https://bsky.app/profile/jasonlong.me", "https://github.com/umara25/PolyYield");
  modified = modified.replace("You can find me on Bluesky at", "Check out PolyYield at");


  // --- DYNAMIC VARIABLES ---
  modified = modified.replace('{mcMasterTime}', mcMasterTime);
  modified = modified.replace('{psTime}', mcMasterTime); // Fallback if psTime is still there
  modified = modified.replace('{todayDay}', todayDay);
  modified = modified.replace('Thursday', todayDay); // Fix hardcoded day if present
  modified = modified.replace('{dayBubbleWidth}', dayBubbleWidths[todayDay] || 245);

  fs.writeFile('chat.svg', modified, (err) => {
    if (err) {
      console.error('Error writing chat.svg:', err)
      return
    }
    console.log('✅ chat.svg generated successfully with FORCED corrections!')
  })
})
