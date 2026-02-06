/**
 * Test script for Kaggle API Preview
 * Run this to verify the API integration works before restarting server
 */

require('dotenv').config();
const { getDatasetPreview } = require('./services/kaggleApiService');
const logger = require('./utils/logger');

async function testKaggleAPI() {
    console.log('\n🧪 Testing Kaggle API Preview Integration\n');
    console.log('='.repeat(50));

    // Test dataset reference
    const testDataset = 'furkangozukara/ecommerce-products-dataset';

    console.log(`\n📊 Testing dataset: ${testDataset}\n`);

    try {
        console.log('⏳ Fetching preview...\n');

        const preview = await getDatasetPreview(testDataset);

        if (preview) {
            console.log('✅ SUCCESS! Preview fetched:\n');
            console.log(`📁 File: ${preview.fileName}`);
            console.log(`📝 Rows: ${preview.totalRows}`);
            console.log(`📊 Columns: ${preview.columns.length}`);
            console.log('\n🔍 Column Details:');
            preview.columns.forEach(col => {
                console.log(`  - ${col.name} (${col.datatype})`);
                console.log(`    Samples: ${col.sampleValues.join(', ')}`);
            });

            console.log('\n📋 Sample Rows:');
            preview.sampleRows.slice(0, 3).forEach((row, idx) => {
                console.log(`  Row ${idx + 1}:`, JSON.stringify(row, null, 2));
            });

            console.log('\n✅ Kaggle API Preview is working correctly!');
            console.log('\n🎉 You can now restart the server to use this integration.\n');

        } else {
            console.log('❌ No preview available for this dataset');
            console.log('Try another dataset or check credentials\n');
        }

    } catch (error) {
        console.log(`\n❌ Error: ${error.message}\n`);
        console.log('Stack:', error.stack);

        if (error.message.includes('credentials')) {
            console.log('\n💡 Fix: Check your .env file has:');
            console.log('   KAGGLE_USERNAME=smile6001');
            console.log('   KAGGLE_KEY=12799437\n');
        }
    }
}

// Run test
testKaggleAPI()
    .then(() => {
        console.log('Test complete!');
        process.exit(0);
    })
    .catch(err => {
        console.error('Test failed:', err);
        process.exit(1);
    });
