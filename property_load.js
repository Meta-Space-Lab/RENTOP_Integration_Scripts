require('dotenv').config();
const fs = require('fs');
const csv = require('csv-parser');
const axios = require('axios');

const API_URL = process.env.RENTOP_API_URL; 
const API_KEY = process.env.RENTOP_API_KEY; 
const USER_ID = process.env.USER_ID;

async function uploadListingsFromCSV(csvFilePath) {
  const listings = [];

  return new Promise((resolve, reject) => {
    fs.createReadStream(csvFilePath)
      .pipe(csv())
      .on('data', (row) => {
        listings.push(row);
      })
      .on('end', async () => {
        console.log(`Parsed ${listings.length} listings from CSV`);

        for (const listing of listings) {
          await uploadListing(listing);
        }

        console.log('All listings uploaded successfully');
        resolve();
      })
      .on('error', reject);
  });
}

async function uploadListing(listing) {
  try {
    const payload = {
      userId: USER_ID,
      addressStreet: listing.addressStreet,
      addressCity: listing.addressCity,
      addressPostal: listing.addressPostal,
      addressState: listing.addressState,
      monthlyPayment: Number(listing.monthlyPayment),
      propertyValue: Number(listing.propertyValue),
      minCredit: Number(listing.minCredit),
      prefCredit: listing.prefCredit ? Number(listing.prefCredit) : 0,
      minIncome: Number(listing.minIncome),
      prefIncome: listing.prefIncome ? Number(listing.prefIncome) : 0,
      latitude: listing.latitude,
      longitude: listing.longitude
    };

    const response = await axios.post(API_URL, payload, {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY
      }
    });

    console.log(`Added listing: ${listing.addressStreet}, ${listing.addressCity}, ${listing.addressState}`);
    return response.data;
  } catch (error) {
    console.error(`Error uploading listing at ${listing.addressStreet}:`, error.response?.data || error.message);
  }
}

(async () => {
  const csvFile = process.argv[2];
  if (!csvFile) {
    console.error('Please provide a CSV file path. Example: node property_load.js listings.csv');
    process.exit(1);
  }

  await uploadListingsFromCSV(csvFile);
})();
