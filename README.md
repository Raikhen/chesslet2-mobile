# Chesslet

A mobile chess puzzle game built with React Native and Expo. Every move must be a capture — reduce the board to a single piece to win.

Web version: [chesslet.xyz](https://www.chesslet.xyz/)

## Game Modes

- **Campaign** — 100 hand-crafted levels with increasing difficulty. Progress is saved locally.
- **Random** — Endless randomly generated puzzles with a built-in solution viewer.
- **Timed** — 60-second challenge with progressive difficulty and high score tracking.
- **Designer** — Create your own puzzles with real-time solvability analysis. Share via deep link.

## Tech Stack

- React Native 0.81 / Expo SDK 54
- Expo Router for navigation
- react-native-reanimated for animations
- react-native-svg for chess piece rendering
- AsyncStorage for local persistence
- Haptic feedback via expo-haptics

## Project Structure

```
app/           Expo Router screens (index, campaign, random, timed, designer, puzzle/[fen])
components/    Board, ChessPieces, DesignerBoard, GameHeader, Modals, Overlays, Toast
lib/           Game engine, FEN parsing, solver, puzzle generator, levels, storage
assets/        App icons and splash screen
```

## Getting Started

```bash
npm install
npx expo start
```

Press `i` for iOS simulator or `a` for Android emulator, or scan the QR code with Expo Go.

## Building

```bash
npx expo run:ios
npx expo run:android
```
