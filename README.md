# Baize Util

A Flask-based web application for audio synthesis and editing.

## Project Structure

```
baize-util/
├── templates/              # Flask HTML templates
│   ├── tts.html           # Text-to-Speech synthesis page
│   └── edit.html          # Audio editing page
├── static/                # Static assets
│   ├── css/              # Stylesheets
│   │   ├── tts.css       # Styles for TTS page
│   │   └── edit.css      # Styles for edit page
│   └── js/               # JavaScript files
│       ├── tts.js        # TTS page logic with atomic utility functions
│       └── edit.js       # Edit page logic with atomic utility functions
└── README.md             # This file
```

## Features

### Text-to-Speech (TTS)
- Text input and Excel file upload support
- Multiple voice options
- Adjustable speed and volume
- Automatic sentence splitting
- Audio preview and download
- Batch processing

### Audio Editor
- Upload and edit audio files (WAV, MP3, M4A)
- Automatic conversion to 8kHz sample rate
- Visual waveform display with zoom controls
- Cut, copy, paste, and delete operations
- Audio clip management
- Merge multiple clips
- Export edited audio

## Architecture

The project follows Flask best practices with separated concerns:

### Templates (`templates/`)
Contains Jinja2 HTML templates that use Flask's `url_for()` function to reference static assets.

### Static Files (`static/`)
- **CSS**: Modular stylesheets for each page
- **JavaScript**: Separated JavaScript with atomic utility functions

### JavaScript Organization

Both JavaScript files (`tts.js` and `edit.js`) follow a consistent structure:

1. **Atomic Utility Functions** - Small, single-purpose functions for:
   - DOM element selection and manipulation
   - Class management
   - Content management
   - URL handling
   - Array and string utilities
   - Async operations

2. **State Management** - Application state variables

3. **Feature-specific Functions** - Core business logic organized by feature

## Benefits of Atomic Functions

Each JavaScript file includes atomic utility functions that:
- Perform a single, well-defined task
- Are reusable across the codebase
- Improve code readability and maintainability
- Make testing easier
- Reduce code duplication

## Usage

To run the application with Flask:

```bash
flask run
```

Access the application:
- TTS: `http://localhost:5000/tts` (or as configured)
- Editor: `http://localhost:5000/edit` (or as configured)

## Development

The refactored structure improves:
- **Maintainability**: Separated HTML, CSS, and JavaScript
- **Reusability**: Atomic functions can be easily reused
- **Readability**: Clear organization and structure
- **Scalability**: Easy to add new features without affecting existing code
