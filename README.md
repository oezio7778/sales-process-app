# Sales Process Application

A lightweight, zero-dependency sales process management application built with vanilla HTML, CSS, and JavaScript.

## Features

### 📊 Dashboard
- Overview of active meetings, pending SoWs, open quotes, and workflows
- Recent activity feed
- Real-time statistics

### 🔍 Meeting Preparation
- Research companies and leaders before meetings
- AI-powered insights (simulated)
- Generate talking points and background information

### 📝 Meeting Notes
- Record and store meeting notes
- Associate notes with specific companies and dates
- View history of all past meetings

### 📄 SoW Generator
- AI-powered Statement of Work generation from meeting notes
- Editable SoW templates
- One-click quote creation from SoW

### 💰 Quote Builder
- Create detailed quotes with multiple line items
- Track internal costs vs. client pricing
- Real-time profit margin calculations (hidden from client view)
- Generate professional quotes

### 🔄 Workflow Tracker
- Automated post-signature workflow tracking
- Visual progress indicators
- Track AR routing, engineer assignment, billing milestones
- Step-by-step completion tracking

## Installation

**No installation required!** This is a pure HTML/CSS/JavaScript application with zero dependencies.

### To Run:

1. Simply open `index.html` in any modern web browser
2. Or use a local server:
   ```bash
   # Python 3
   python3 -m http.server 8000
   
   # Python 2
   python -m SimpleHTTPServer 8000
   
   # Node.js (if you have it)
   npx serve
   ```
3. Navigate to `http://localhost:8000`

## Storage

All data is stored locally in your browser using `localStorage`. Your data persists between sessions and never leaves your computer.

## File Structure

```
├── index.html      # Main application structure
├── styles.css      # Premium dark mode styling
├── app.js          # Application logic and functionality
└── README.md       # This file
```

## Total Size

**Less than 100KB** - Perfect for systems with limited disk space!

- index.html: ~15KB
- styles.css: ~8KB
- app.js: ~12KB
- README.md: ~2KB

## Browser Compatibility

Works in all modern browsers:
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

## Usage Guide

### 1. Meeting Preparation
- Navigate to "Meeting Prep"
- Enter company name and optional leader name
- Click "Research" to get AI-generated insights

### 2. Recording Meeting Notes
- Go to "Meeting Notes"
- Fill in company, date, and notes
- Click "Save Meeting Notes"

### 3. Generating SoW
- Navigate to "SoW Generator"
- Select a meeting from the dropdown
- Click "Generate SoW with AI"
- Edit if needed
- Click "Create Quote from SoW"

### 4. Creating Quotes
- Go to "Quotes"
- Enter client name
- Add line items with descriptions, costs, and prices
- View real-time profit margins
- Click "Generate Quote PDF"

### 5. Tracking Workflows
- Navigate to "Workflow"
- View all active workflows
- Click "Complete Next Step" to advance workflow stages

## Customization

### AI Integration
To connect real AI services, modify the following functions in `app.js`:
- Research: Line ~60 (replace mock data with API call)
- SoW Generation: Line ~180 (replace mock generation with API call)

### Styling
Edit `styles.css` to customize:
- Color scheme (CSS variables at top of file)
- Layout and spacing
- Animations and transitions

## Data Management

### Export Data
Open browser console and run:
```javascript
console.log(localStorage);
```

### Clear All Data
```javascript
localStorage.clear();
```

### Backup Data
```javascript
const backup = {};
for (let key in localStorage) {
    backup[key] = localStorage[key];
}
console.log(JSON.stringify(backup));
```

## License

Free to use and modify as needed.

## Support

This is a standalone application with no external dependencies or support requirements.
