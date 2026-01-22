import fs from 'fs'
import { formatDistance } from 'date-fns'

// Time at McMaster University (started Fall 2022, adjust if needed)
const today = new Date()
const todayDay = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(today)

// Calculate time at McMaster - adjust the start date as needed
const mcMasterTime = formatDistance(new Date(2022, 8, 1), today, {
  addSuffix: false,
})

// Cheap, janky way to have variable bubble width
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

  // Replace template variables
  data = data.replace('{mcMasterTime}', mcMasterTime)
  data = data.replace('{todayDay}', todayDay)
  data = data.replace('{dayBubbleWidth}', dayBubbleWidths[todayDay])

  fs.writeFile('chat.svg', data, (err) => {
    if (err) {
      console.error('Error writing chat.svg:', err)
      return
    }
    console.log('✅ chat.svg generated successfully!')
    console.log(`📅 Today is ${todayDay}`)
    console.log(`🎓 Time at McMaster: ${mcMasterTime}`)
  })
})
