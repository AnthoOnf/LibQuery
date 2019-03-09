
const MongoClient = require('mongodb').MongoClient;

const url = 'mongodb://admin:bdl123@newspapers-shard-00-00-mjung.gcp.mongodb.net:27017,newspapers-shard-00-01-mjung.gcp.mongodb.net:27017,newspapers-shard-00-02-mjung.gcp.mongodb.net:27017/newspaper?ssl=true&replicaSet=Newspapers-shard-0&authSource=admin&retryWrites=true';

const dbName = 'newspaper';
const client = new MongoClient(url);

// Use connect method to connect to the Server
client.connect(function (err) {
    console.log("Connected successfully to server");

    const db = client.db(dbName);
});