# Football Tournament Manager

A premium React Native (Expo) app to manage football tournaments (Leagues and Knockout Cups).

## Features
- **Create Tournaments**: Choose between League (Round Robin) or Knockout.
- **Participant Management**: Add unlimited players/teams.
- **Auto-Fixtures**: Automatically generates fixtures. 
    - Leagues: Full round-robin schedule.
    - Knockout: Power-of-2 bracket with auto-generated "Byes".
- **Match Management**: Enter scores and track goal scorers for every match.
- **Automated Standings**: League tables update automatically (Win=3, Draw=1, Loss=0).
- **Knockout Progression**: Winners automatically advance to the next round.
- **Stats**: Track Top Scorers across the tournament.
- **Persistence**: Data is saved locally on the device.

## Tech Stack
- React Native + Expo
- Expo Router
- TypeScript
- Async Storage

## How to Run

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the app:
   ```bash
   npx expo start
   ```

3. Scan the QR code with Expo Go (Android/iOS) or run on Emulator.
