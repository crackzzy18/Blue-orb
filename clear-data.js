#!/usr/bin/env node

/**
 * Clear All Community Data Script
 * 
 * This script will clear all questions and replies from the Nostr relay
 * by publishing deletion events (kind 5) for all existing events.
 * 
 * Usage: node clear-data.js [private-key]
 * 
 * If no private key is provided, it will prompt you to enter one.
 */

require('dotenv').config();
const readline = require('readline');
const { generatePrivateKey, getPublicKey } = require('nostr-tools');

const API_URL = process.env.API_URL || 'http://localhost:4000/api';

async function clearAllData(privateKey) {
  try {
    console.log('🚀 Starting data clearing process...');
    
    // Validate the private key
    if (!privateKey) {
      throw new Error('Private key is required');
    }
    
    // Test if the private key is valid by getting the public key
    try {
      const pubkey = getPublicKey(privateKey);
      console.log(`📝 Using public key: ${pubkey}`);
    } catch (err) {
      throw new Error('Invalid private key format');
    }
    
    // Make the API call to clear all data
    const response = await fetch(`${API_URL}/community/clear-all`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ nsec: privateKey })
    });
    
    const result = await response.json();
    
    if (result.ok) {
      console.log('✅ Success!');
      console.log(`📊 ${result.data.message}`);
      console.log(`🗑️  Deleted: ${result.data.deletedCount} events`);
      if (result.data.failedCount > 0) {
        console.log(`❌ Failed: ${result.data.failedCount} events`);
      }
      console.log(`📈 Total found: ${result.data.totalFound} events`);
    } else {
      console.error('❌ Error:', result.error || 'Unknown error');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Failed to clear data:', error.message);
    process.exit(1);
  }
}

async function promptForPrivateKey() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  return new Promise((resolve) => {
    rl.question('Enter your private key (nsec...): ', (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function main() {
  console.log('🧹 Blue Orb Data Clearing Tool');
  console.log('================================');
  console.log('');
  console.log('⚠️  WARNING: This will permanently delete ALL questions and replies!');
  console.log('');
  
  let privateKey = process.argv[2];
  
  if (!privateKey) {
    privateKey = await promptForPrivateKey();
  }
  
  if (!privateKey) {
    console.error('❌ No private key provided. Exiting.');
    process.exit(1);
  }
  
  // Confirm before proceeding
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  const confirm = await new Promise((resolve) => {
    rl.question('Are you sure you want to delete ALL data? (yes/no): ', (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase());
    });
  });
  
  if (confirm !== 'yes') {
    console.log('❌ Operation cancelled.');
    process.exit(0);
  }
  
  await clearAllData(privateKey);
}

// Run the script
main().catch(console.error);
