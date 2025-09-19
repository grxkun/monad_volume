import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import './App.css';

function App() {
  const [walletAddress, setWalletAddress] = useState(null);
  const [balance, setBalance] = useState(null);
  const [contracts, setContracts] = useState([
    { address: '', volume: '', interval: '', runningTime: '' },
  ]);
  const [amount, setAmount] = useState('');
  const [interval, setInterval] = useState('');

  const MONAD_NETWORK_PARAMS = {
    chainId: '0x27AF', // Updated Chain ID for Monad testnet
    chainName: 'Monad Testnet',
    nativeCurrency: {
      name: 'Monad',
      symbol: 'MON',
      decimals: 18,
    },
    rpcUrls: ['https://testnet-rpc.monad.xyz'], // Updated RPC URL
    blockExplorerUrls: ['https://testnet-explorer.monad.xyz'], // Updated Block Explorer URL
  };

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        console.log('Attempting to switch to Monad Testnet...');
        // Switch to Monad testnet using Chainlist details
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [MONAD_NETWORK_PARAMS],
        });

        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        console.log('Connected accounts:', accounts);
        setWalletAddress(accounts[0]);

        const provider = new ethers.BrowserProvider(window.ethereum);
        const balance = await provider.getBalance(accounts[0]);
        console.log('Wallet balance:', ethers.formatEther(balance));
        setBalance(ethers.formatEther(balance));
      } catch (error) {
        console.error('Error connecting wallet:', error);
        alert('Failed to connect wallet. Check the console for details.');
      }
    } else {
      alert('Please install MetaMask!');
    }
  };

  const executeTrades = async () => {
    try {
      const response = await fetch('https://backend-3bw0r834q-grxkuns-projects.vercel.app/api/trades', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      if (data.success) {
        alert('Trades executed successfully!');
        console.log('Trade results:', data.results);
      } else {
        alert(`Trade execution failed: ${data.error}`);
      }
    } catch (error) {
      console.error('Error executing trades:', error);
      alert('An error occurred while executing trades.');
    }
  };

  const signAndSendTransaction = async (contract) => {
    if (!window.ethereum) {
      alert('MetaMask is not installed!');
      return;
    }

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      // Transaction data
      const tx = {
        to: contract.address,
        value: ethers.parseEther(contract.volume),
        gasLimit: 21000, // Adjust based on the contract
      };

      // Sign the transaction
      const signedTransaction = await signer.signTransaction(tx);

      // Send the signed transaction to the backend
      const response = await fetch('https://backend-3bw0r834q-grxkuns-projects.vercel.app/api/broadcast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ signedTransaction }),
      });

      const data = await response.json();
      if (data.success) {
        alert(`Transaction successful! Hash: ${data.transactionHash}`);
      } else {
        alert(`Transaction failed: ${data.error}`);
      }
    } catch (error) {
      console.error('Error signing or sending transaction:', error);
      alert('An error occurred while processing the transaction.');
    }
  };

  const handleContractChange = (index, field, value) => {
    const updatedContracts = [...contracts];
    updatedContracts[index][field] = value;
    setContracts(updatedContracts);
  };

  const addContract = () => {
    setContracts([...contracts, { address: '', volume: '', interval: '', runningTime: '' }]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch('https://backend-3bw0r834q-grxkuns-projects.vercel.app/api/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ contracts }),
      });

      const data = await response.json();
      if (data.success) {
        alert('Bot started successfully!');
      } else {
        alert(`Failed to start bot: ${data.error}`);
      }
    } catch (error) {
      console.error('Error starting bot:', error);
      alert('An error occurred while starting the bot.');
    }
  };

  const fetchMetrics = async () => {
    try {
      const response = await fetch('https://backend-3bw0r834q-grxkuns-projects.vercel.app/api/metrics');
      const data = await response.json();
      if (data.success) {
        console.log('Metrics:', data.metrics);
        alert(JSON.stringify(data.metrics, null, 2)); // Replace with proper UI rendering
      } else {
        alert(`Failed to fetch metrics: ${data.error}`);
      }
    } catch (error) {
      console.error('Error fetching metrics:', error);
      alert('An error occurred while fetching metrics.');
    }
  };

  const stopBot = async () => {
    try {
      const response = await fetch('https://backend-3bw0r834q-grxkuns-projects.vercel.app/api/stop', {
        method: 'POST',
      });

      const data = await response.json();
      if (data.success) {
        alert('Bot stopped successfully!');
      } else {
        alert(`Failed to stop bot: ${data.error}`);
      }
    } catch (error) {
      console.error('Error stopping bot:', error);
      alert('An error occurred while stopping the bot.');
    }
  };

  useEffect(() => {
    connectWallet(); // Automatically connect wallet on load
  }, []);

  return (
    <div className="app-container">
      <h1>Monad Volume Bot Dashboard</h1>
      {walletAddress ? (
        <div className="wallet-info">
          <p>Wallet Address: {walletAddress}</p>
          <p>Balance: {balance} MON</p>
        </div>
      ) : (
        <button className="connect-button" onClick={connectWallet}>Connect Wallet</button>
      )}

      <form onSubmit={handleSubmit} className="trade-form">
        {contracts.map((contract, index) => (
          <div key={index}>
            <label>
              Contract Address:
              <input
                type="text"
                value={contract.address}
                onChange={(e) => handleContractChange(index, 'address', e.target.value)}
                required
              />
            </label>
            <br />
            <label>
              Volume (in MON):
              <input
                type="number"
                value={contract.volume}
                onChange={(e) => handleContractChange(index, 'volume', e.target.value)}
                required
              />
            </label>
            <br />
            <label>
              Interval (in seconds):
              <input
                type="number"
                value={contract.interval}
                onChange={(e) => handleContractChange(index, 'interval', e.target.value)}
                required
              />
            </label>
            <br />
            <label>
              Running Time (in minutes):
              <input
                type="number"
                value={contract.runningTime}
                onChange={(e) => handleContractChange(index, 'runningTime', e.target.value)}
                required
              />
            </label>
            <br />
            <button type="button" onClick={() => signAndSendTransaction(contract)}>Sign and Send Transaction</button>
          </div>
        ))}
        <button type="button" onClick={addContract}>Add Contract</button>
        <br />
        <button type="submit" className="start-button">Start</button>
      </form>

      <div className="action-buttons">
        <button className="stop-button" onClick={stopBot}>STOP</button>
        <button className="execute-trades-button" onClick={executeTrades}>Execute Trades</button>
        <button className="fetch-metrics-button" onClick={fetchMetrics}>Fetch Metrics</button>
      </div>
    </div>
  );
}

export default App;