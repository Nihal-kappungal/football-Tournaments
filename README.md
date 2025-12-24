# 🏆 Football Tournament Manager

A premium, feature-rich mobile application for managing football tournaments. Built with **React Native** and **Expo**, this app allows you to organize Leagues, Knockout Cups, and Hybrid tournaments with ease.

![App Screenshot](https://via.placeholder.com/800x400.png?text=Football+Tournament+Manager+Preview) 
*(Replace with actual screenshot)*

## ✨ Features

### 🏟️ Tournament Formats
- **League (Round Robin)**: Automatic fixture generation where everyone plays everyone. Includes a live **Standings Table** (P, W, D, L, GF, GA, GD, Pts).
- **Knockout (Elimination)**: Create brackets from Round of 64 to Finals.
  - **Home & Away (2 Legs)** support: Track aggregate scores and away goals.
  - **Visual Tie Indicators**: Quickly view Win/Loss/Draw status for multi-leg ties.
- **Hybrid (World Cup Style)**: Group Stages followed by Knockout rounds.

### ⚡ Key Functionalities
- **Smart Fixture Generator**: automatically creates matchups for valid tournament sizes.
- **Live Match Updates**: input scores, finish matches, and watch standings/winners update instantly.
- **Statistics**: auto-calculated **Top Scorers** leaderboard.
- **Dynamic Progression**: Winners of knockout matches automatically advance to the next round with correct naming (e.g., "Semi-Final", "Quarter-Final").
- **Offline Storage**: All data is persisted locally on your device.

### 🎨 Design
- **Premium Dark Theme**: Sleek, gold-accented UI for a professional feel.
- **Custom Animations & Alerts**: Polished user experience with custom dialogs and transitions.

## 📱 Tech Stack

- **Framework**: [React Native](https://reactnative.dev/) (via [Expo](https://expo.dev/))
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Navigation**: [Expo Router](https://docs.expo.dev/router/introduction/)
- **Storage**: AsyncStorage
- **Icons**: Ionicons

## 🚀 Getting Started

### Prerequisites
- Node.js installed
- [Expo Go](https://expo.dev/client) app on your phone (or an emulator)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Nihal-kappungal/football-Tournaments.git
   cd football-Tournaments
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run the app**
   ```bash
   npx expo start
   ```

4. **Scan the QR code** with your phone using the Expo Go app.

## 📂 Project Structure

- `app/`: Expo Router screens and pages.
- `components/`: Reusable UI components (`TournamentCard`, `FixtureItem`, `CustomAlert`, etc.).
- `utils/`: Core logic (Fixture generation, Tournament progression, Storage).
- `types/`: TypeScript definitions.
- `constants/`: Theme colors and layout settings.

## 🤝 Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.

1. Fork the Project
2. Create your Feature Branch
3. Commit your Changes
4. Push to the Branch
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

---
*Built with ❤️ for football fans.*
