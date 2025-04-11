const { Client } = require('pg');
//require('dotenv').config();

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const client = new Client({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

console.log("DB config:", {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

client.connect();

module.exports = client;
