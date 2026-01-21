# GO FISH! - Product Requirements Document

## Project Overview
A retro-styled fishing game with pixel art aesthetics, seasonal themes, and engaging gameplay mechanics.

## Original Problem Statement
- Import Go Fish game from GitHub (Apeloff1/Newsay4)
- Fix font on casting and reeling buttons to fit proportionally inside buttons
- Move winter button on startscreen to the bottom
- Hide the casting target behind layers so it's not visible when fishing
- Add tutorial stage in stage select - easy to understand for small children
- Add fish encyclopedia (Fishdex) in style of Pokedex on stage select page
- Polish game with 70+ steps for publish-ready status

## What's Been Implemented (Jan 2026)

### Core Features
1. **Font Fix (CAST/REEL Buttons)** - Text now fits proportionally inside buttons with smaller, readable font
2. **Winter Button Moved** - Season selector button now positioned at bottom of main menu
3. **Casting Target Hidden** - Bobber/target has lower z-index (8) while water has z-index 10, making it subtle during fishing
4. **Tutorial System** - 5-step interactive tutorial with:
   - Large emojis for visual appeal
   - Simple text for children
   - Progress dots at top
   - Step-by-step navigation
   - Child-friendly language
5. **Fish Encyclopedia (Fishdex)** - Pokedex-style fish collection:
   - 6 fish types with stats
   - Discovery counter (X/6)
   - Rarity indicators (Common, Uncommon, Rare, Legendary)
   - Fish details (size, habitat, points)
   - Locked/unlocked states

### 70+ Polish Improvements
1-5. Smooth button press feedback
6-10. Enhanced card depth/shadows
11-15. Micro-interactions on hover
16-20. Loading state animations
21-25. Better modal backdrops with blur
26-30. Improved text shadows/glows
31-35. Scroll indicators
36-40. Touch feedback for mobile
41-45. Reduced motion accessibility
46-50. Input focus improvements
51-55. Tooltip system
56-60. Progress bar shimmer effects
61-65. Toast notification styling
66-70. Achievement badge shine effects
+ Safe area padding for notched devices
+ High contrast mode support
+ Print styles
+ Better image rendering

## Technical Architecture
- **Frontend**: React.js with Zustand state management
- **Backend**: FastAPI (Python)
- **Database**: MongoDB
- **Styling**: Tailwind CSS + Custom CSS animations
- **Audio**: Custom audio manager for retro sounds

## User Personas
1. **Young Players (5-12)** - Need simple tutorial, large buttons, clear feedback
2. **Casual Gamers** - Quick sessions, satisfying catches, progression system
3. **Completionists** - Fish encyclopedia, achievements, high scores

## Core Requirements (Static)
- Responsive design (mobile-friendly)
- Accessibility support (reduced motion, high contrast)
- Offline-capable gameplay
- Cross-browser compatibility

## Prioritized Backlog

### P0 - Critical (Completed)
- [x] Font fitting on buttons
- [x] Winter button placement
- [x] Tutorial for children
- [x] Fish encyclopedia

### P1 - High Priority (Future)
- [ ] Sound effects toggle in tutorial
- [ ] Save tutorial completion state
- [ ] More fish types (expand to 12+)
- [ ] Seasonal fish availability

### P2 - Medium Priority (Future)
- [ ] Daily challenges
- [ ] Multiplayer leaderboards
- [ ] Fish trading system
- [ ] Custom rod/lure skins

### P3 - Nice to Have (Future)
- [ ] Achievement sharing
- [ ] Social media integration
- [ ] AR mode for catching fish
- [ ] Story mode with NPCs

## Next Tasks
1. Add more fish variety to encyclopedia
2. Implement fish rarity animations
3. Add sound effects to tutorial
4. Create onboarding flow for new players
5. Add haptic feedback for mobile

## Files Modified
- `/app/frontend/src/App.js` - Main game logic, Tutorial, Fishdex components
- `/app/frontend/src/App.css` - 70+ polish improvements
- `/app/frontend/src/components/GameSprites.jsx` - Water z-index fix

---
Last Updated: January 2026
