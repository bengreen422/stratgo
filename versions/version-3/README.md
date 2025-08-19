# Word Strategy Game - Version 3

## Version Information
- **Version**: 3.0
- **Date**: $(date)
- **Status**: Archived stable version

## Features in This Version
- 19x19 game board with letter frequency-based generation
- Two-player turn-based gameplay
- Word formation with contiguous tile selection
- Dictionary validation using words_alpha.txt
- Encirclement and capture mechanics
- Figma-inspired UI design
- Score tracking (word points + capture points)
- Game state management (pass, end game, restart)

## Key Game Mechanics
- **Word Formation**: Players select contiguous tiles to form valid words
- **Scoring**: Points based on word length (2-11+ letters)
- **Encirclement**: Capturing opponent tiles by surrounding them
- **Capture Logic**: Automatic detection of encircled groups with no valid escape routes

## Technical Details
- React TypeScript frontend
- Node.js backend server
- Local two-player gameplay
- Real-time board state management

## How to Run
1. Install dependencies: `npm install`
2. Start the backend: `node server.js`
3. Start the frontend: `cd frontend && npm start`

## Reverting to This Version
To revert to this version from a newer version:
1. Using Git: `git checkout v3.0` or `git checkout version-3`
2. Using directory: Copy files from `versions/version-3/` to your working directory

## Archive Notes
This version was archived before implementing fundamental game changes. It represents a stable, tested version of the word strategy game with encirclement mechanics.
