import dns from 'node:dns';
dns.setServers(['8.8.8.8', '8.8.4.4']);

import dotenv from 'dotenv';
dotenv.config();

import app from './src/app.js';
import connectDB from './src/config/db.js';
import { initializeStore } from './src/config/initializeStore.js';

const PORT = process.env.PORT || 5000;

connectDB().then(async () => {
  await initializeStore();
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});