# Busmate - Smart Bus Transportation App

![Busmate Logo](./assets/images/busmate-icon-inverted.png)

## Overview

Busmate is a modern mobile application designed to enhance the public transportation experience in Sri Lanka. This passenger app provides an intuitive platform for booking bus tickets, tracking buses in real-time, managing digital wallets, and more. Built with React Native and Expo, Busmate offers a seamless experience across multiple devices.

## Features

- **User Authentication** - Secure login and user profile management
- **Bus Ticket Booking** - Easy search and booking interface for bus tickets
- **Seat Selection** - Interactive seat selection for a comfortable journey
- **Real-time Bus Tracking** - Track buses in real-time on a map interface
- **Digital Wallet** - Manage payments, top up balance, and view transaction history
- **E-Tickets** - Access digital tickets with QR codes for seamless boarding
- **Notifications** - Stay updated with journey information and offers
- **User Profiles** - Personalized profiles with booking history and preferences
- **Multi-language Support** - Language options for wider accessibility

## Technologies

- **React Native** - Core framework for cross-platform mobile development
- **Expo** - Development platform for easier React Native development
- **NativeWind** - Tailwind CSS for React Native
- **React Navigation** - Navigation library for React Native applications
- **Expo Router** - File-based routing for Expo apps
- **Maps Integration** - Real-time location tracking with React Native Maps
- **AsyncStorage** - Local data persistence

## Project Structure

```javascript
app/                  # Main application screens and navigation
  (tabs)/             # Tab-based navigation screens
  auth/               # Authentication screens
  notifications/      # Notification screens
  onboarding/         # First-time user experience screens
  profile/            # User profile management screens
  search/             # Bus search and booking flow
  tickets/            # Ticket management screens
  tracking/           # Real-time bus tracking
  wallet/             # Digital wallet functionality
assets/               # Images, icons, and other static assets
components/           # Reusable UI components
  modals/             # Modal dialog components
  ui/                 # UI components
context/              # React context providers
data/                 # Mock data for development
hooks/                # Custom React hooks
types/                # TypeScript type definitions
```

## Getting Started

### Prerequisites

- Node.js (v18 or newer)
- npm or yarn
- Expo CLI

### Installation

1. Clone the repository

```bash
git clone https://github.com/yourusername/busmate-passenger-app.git
cd busmate-passenger-app
```

1. Install dependencies

```bash
npm install
# or
yarn
```

1. Start the development server

```bash
npm run dev
# or
yarn dev
```

1. Open the app in your device or emulator
   - For iOS/Android: Scan the QR code with Expo Go app
   - For web: Open the provided URL in your browser

### Building for Production

#### Web

```bash
npm run build:web
# or
yarn build:web
```

#### Android/iOS

Follow the Expo EAS Build documentation for generating production builds.

## Development

### Linting

```bash
npm run lint
# or
yarn lint
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

---

Developed with ❤️ by the Busmate team
