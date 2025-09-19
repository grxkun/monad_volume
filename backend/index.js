require('dotenv').config();
const { ethers } = require('ethers');

const provider = new ethers.JsonRpcProvider(process.env.MONAD_RPC_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

const contracts = [
    // Add contract addresses here
];

async function executeTrades() {
    for (const contractAddress of contracts) {
        const contract = new ethers.Contract(contractAddress, [], wallet);
        try {
            // Example: Buy transaction
            await contract.buy({ value: ethers.utils.parseEther("0.1") });
            console.log(`Executed buy on ${contractAddress}`);
        } catch (error) {
            console.error(`Failed to execute trade on ${contractAddress}:`, error);
        }
    }
}

setInterval(executeTrades, 60000); // Run every 60 seconds