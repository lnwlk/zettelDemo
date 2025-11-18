# Zettel OCR Scanner

A lean, mobile-first React web application that validates scanned documents using OCR (Optical Character Recognition) technology.

## Overview

This app allows users to scan documents with their mobile device camera, extract text using Tesseract.js, and validate the content against a reference document. If the document matches (≥70% word match), it displays a pre-written plain language version.

## Features

- 📱 Mobile-first responsive design
- 📸 Camera capture using native device camera
- 🔍 Client-side OCR processing with Tesseract.js
- ✅ Automatic document validation
- 🌍 German language support (can be extended)
- ⚡ No backend required - runs entirely in the browser
- 🔒 Privacy-focused - all processing happens locally

## Tech Stack

- **React** - UI framework
- **Vite** - Build tool and dev server
- **Tesseract.js** - OCR engine
- **Pure CSS** - No UI framework dependencies

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Usage

1. Open the app on a mobile device
2. Click "Scan Document" to activate the camera
3. Capture an image of the document
4. Wait for OCR processing (progress bar shows status)
5. View results:
   - ✅ **Success**: Document recognized - see plain language version
   - ❌ **Error**: Document not recognized - try again

## How It Works

### Validation Logic

1. **Text Extraction**: Tesseract.js extracts text from the captured image
2. **Normalization**: Both extracted and reference texts are normalized:
   - Convert to lowercase
   - Remove punctuation
   - Split into individual words
3. **Matching**: Count how many reference words appear in extracted text
4. **Validation**: Calculate percentage = (matching words / total reference words) × 100
5. **Threshold**: If ≥70% match, document is validated

### Reference Document

The app validates against a hardcoded German text about digital transformation and government communication simplification. This can be modified in `src/config.js`.

## Project Structure

```
zettelDemo/
├── src/
│   ├── utils/
│   │   └── textMatcher.js    # Text matching and validation logic
│   ├── App.jsx               # Main application component
│   ├── App.css               # Application styles
│   ├── config.js             # Reference text and configuration
│   ├── main.jsx              # React entry point
│   └── index.css             # Global styles
├── index.html                # HTML template
├── vite.config.js            # Vite configuration
└── package.json              # Dependencies and scripts
```

## Configuration

Edit `src/config.js` to customize:

```javascript
export const config = {
  referenceText: "Your reference text here...",
  plainLanguageVersion: "Simplified explanation here...",
  matchThreshold: 0.7  // 70% match required
};
```

## Testing Tips

For best OCR results:
- Use good lighting
- Place document on a flat surface
- Ensure text is clearly visible
- Avoid shadows and glare
- Hold camera steady

## Browser Compatibility

- Modern mobile browsers (Chrome, Safari, Firefox)
- Requires camera access permission
- Works on iOS and Android devices

## Known Limitations

- OCR accuracy depends on image quality and lighting
- German language optimized (can add more languages)
- Processes one document at a time
- No data persistence (refreshing resets state)

## Future Enhancements

Potential improvements (not included in this lean version):
- Image preprocessing filters
- Multi-document support
- Settings/configuration UI
- Data persistence
- Multiple language support
- PDF export

## License

MIT

## Contributing

This is a demo project. Feel free to fork and customize for your needs.
