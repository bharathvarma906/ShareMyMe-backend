const { MongoClient } = require('mongodb');

const sourceUri = 'mongodb://127.0.0.1:27017/sharemymeal';
const destUri = 'mongodb+srv://24eg105e18_db_user:ZlRW7sVUisH7hMNw@cluster0.c4xouhk.mongodb.net/sharemymeal?appName=Cluster0';

async function migrate() {
    let sourceClient;
    let destClient;

    try {
        console.log('Connecting to local database...');
        sourceClient = await MongoClient.connect(sourceUri);
        const sourceDb = sourceClient.db();
        console.log('Connected to local database successfully.');

        console.log('Connecting to Atlas database...');
        destClient = await MongoClient.connect(destUri);
        const destDb = destClient.db();
        console.log('Connected to Atlas database successfully.');

        const collections = await sourceDb.listCollections().toArray();
        console.log(`Found ${collections.length} collections to migrate.`);

        for (const col of collections) {
            const collectionName = col.name;
            console.log(`\nMigrating collection: ${collectionName}`);
            
            const sourceCollection = sourceDb.collection(collectionName);
            const destCollection = destDb.collection(collectionName);

            // Fetch all documents from source
            const docs = await sourceCollection.find({}).toArray();
            console.log(`  - Found ${docs.length} documents.`);

            if (docs.length > 0) {
                // Clear destination collection before inserting to prevent duplicate key errors
                console.log(`  - Clearing existing data in Atlas for ${collectionName}...`);
                await destCollection.deleteMany({});
                
                console.log(`  - Inserting documents into Atlas...`);
                await destCollection.insertMany(docs);
                console.log(`  - Migration of ${collectionName} completed.`);
            } else {
                console.log(`  - Skipping ${collectionName} as it is empty.`);
            }
        }

        console.log('\n✅ All data migrated successfully!');
    } catch (error) {
        console.error('❌ Migration failed:', error);
    } finally {
        if (sourceClient) await sourceClient.close();
        if (destClient) await destClient.close();
    }
}

migrate();
