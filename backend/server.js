const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { ethers } = require('ethers');
const path = require('path');

const app = express();
const PORT = 4000; // Updated port number

app.use(cors());
app.use(express.json());

// Serve static files from the React app
app.use(express.static(path.join(__dirname, '../frontend/build')));

// Catch-all handler for any requests that don't match API routes
app.get('/*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
});

// Mock provider for testing
const mockProvider = {
    sendTransaction: async (tx) => {
        console.log('Mock transaction sent:', tx);
        return {
            hash: '0xmocktransactionhash',
            wait: async () => ({ transactionHash: '0xmocktransactionhash' }),
        };
    },
};

// Replace provider with mockProvider for testing
const provider = mockProvider;

let botConfig = null;
let botInterval = null;
let botIntervals = [];
let activeIntervals = [];

// Metrics storage
const metrics = {};

async function executeTrades() {
    if (!botConfig) return;

    const { contracts, amount } = botConfig;
    for (const contractAddress of contracts) {
        const contract = new ethers.Contract(contractAddress, [], wallet);
        try {
            await contract.buy({ value: ethers.utils.parseEther(amount) });
            console.log(`Executed buy on ${contractAddress}`);
        } catch (error) {
            console.error(`Failed to execute trade on ${contractAddress}:`, error);
        }
    }
}

// Example endpoint
app.get('/api/status', (req, res) => {
  res.json({ status: 'Backend is running!' });
});

// New API endpoint to trigger trades
app.post('/api/trades', async (req, res) => {
    try {
        const results = await executeTrades();
        res.json({ success: true, results });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// New API endpoint to broadcast signed transactions
app.post('/api/broadcast', async (req, res) => {
    const { signedTransaction } = req.body;

    if (!signedTransaction) {
        return res.status(400).json({ success: false, error: 'Signed transaction is required' });
    }

    try {
        const txResponse = await provider.sendTransaction(signedTransaction);
        const receipt = await txResponse.wait();
        res.json({ success: true, transactionHash: receipt.transactionHash });
    } catch (error) {
        console.error('Error broadcasting transaction:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// New API endpoint to start the trading bot
app.post('/api/start', (req, res) => {
    const { contracts, amount, interval, runningTime } = req.body;

    if (!contracts || !amount || !interval || !runningTime) {
        return res.status(400).json({ success: false, error: 'Missing required parameters' });
    }

    botConfig = { contracts, amount, interval, runningTime };
    metrics[contracts] = { transactions: 0, volume: 0 };

    botInterval = setInterval(async () => {
        for (const contractAddress of contracts) {
            try {
                const contract = new ethers.Contract(contractAddress, [], wallet);
                await contract.buy({ value: ethers.utils.parseEther(amount) });
                metrics[contractAddress].transactions += 1;
                metrics[contractAddress].volume += parseFloat(amount);
                console.log(`Executed buy on ${contractAddress}`);
            } catch (error) {
                console.error(`Failed to execute trade on ${contractAddress}:`, error);
            }
        }
    }, interval * 1000);

    setTimeout(() => {
        clearInterval(botInterval);
        botInterval = null;
        console.log('Bot stopped after running time elapsed.');
    }, runningTime * 60 * 1000);

    res.json({ success: true, message: 'Bot started successfully' });
});

// New API endpoint to stop the trading bot
app.post('/api/stop', (req, res) => {
    if (botInterval) {
        clearInterval(botInterval);
        botInterval = null;
        res.json({ success: true, message: 'Bot stopped successfully' });
    } else {
        res.status(400).json({ success: false, error: 'Bot is not running' });
    }
});

// New API endpoint to get metrics
app.get('/api/metrics', (req, res) => {
    res.json({ success: true, metrics });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});