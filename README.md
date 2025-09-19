# Monad Volume Bot

This project is designed to create a volume bot for the Monad testnet. The bot interacts with smart contracts on `kuru.io` to execute buy and sell transactions at specific intervals and within a defined time limit. The project includes both a backend for bot logic and a frontend for monitoring and manual execution.

## Project Structure

- **backend/**: Contains the backend logic for interacting with the Monad testnet.
- **frontend/**: Contains the frontend dashboard for monitoring and controlling the bot.

## Setup Instructions

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment variables:
   - Create a `.env` file in the `backend/` directory with the following:
     ```env
     MONAD_RPC_URL=<Your Monad RPC URL>
     PRIVATE_KEY=<Your Wallet Private Key>
     ```

3. Run the backend:
   ```bash
   node backend/index.js
   ```

4. Deploy the frontend to Vercel:
   ```bash
   vercel deploy
   ```

## Features

- Automated buy/sell transactions on multiple smart contracts.
- Interval-based execution with time limits.
- Monitoring dashboard for transaction history and bot control.