var cities = require('./lib/worldcitiespopEU.json');
var glob = require("glob");
var fs = require("fs");
var path = require("path");
const debug = require('debug')('extractor');
const writeFile = require('./file.service').writeFile



glob("data/*.json", function(err, files) { // read the folder or folders if you want: example json/**/*.json
    if(err) {
      console.log("cannot read the folder /data, something goes wrong with glob", err);
    }

    files.forEach(file => {

        fs.readFile(file, 'utf8', function (err, data) { // Read each file
            if(err) {
              console.log("cannot read the file, something goes wrong with the file", err);
            }

            let resultWithLocations = [];

            JSON.parse(data).forEach(element => {
                if(element.title) {
                    // let capitalizeArr = element.body.match(/([A-Z][a-zA-Z\-\']*\s*)/g);
                    let capitalizeArr = element.body.match(/((à|de|[a-z]\.|\,|^|d')(.|^|)[A-Z][a-zA-Z\-\é\è]*)/gm);
                    let capitalizeArrProper = [];
            
                    if(capitalizeArr && capitalizeArr.length > 0) {
                        capitalizeArr.forEach(capitalize => {
                            capitalizeArrProper.push(capitalize.replace(/(\s|à|de|[a-z]\.|\,|^|d')+/g, '').toLowerCase());
                        });
                    }
            
                    let unique = [...new Set(capitalizeArrProper)];
            
                    let locations = [];
                
                    // console.log("TITRE DU JOURNAL : " + element.newspaper);
                    // console.log("TITRE DE L'ARTICLE : " + element.title);
                    // console.log("LANGUE DE L'ARTICLE : " + element.language);
                    
                    // console.log("");
                    // console.log("VILLES TROUVEES : ")
                    unique.forEach(value => {
                        // let properValue = value.replace(/\s+/g, '').toLowerCase();
                        let properValue = value.replace(/(\s|à|de|[a-z]\.|\,|^|d')+/g, '').toLowerCase();
                        let properValueWithoutAccent = properValue.normalize('NFD').replace(/[\u0300-\u036f]/g, "");
                        let findCities = cities.find(c => c.fields.city == properValueWithoutAccent);
                        if(findCities) {
                            locations.push(findCities.fields.city);
                            // console.log("- " + findCities.fields.city);
                        }
                    });
            
                    // console.log("-----------------------------------------");
                    element.locations=locations;
            
                    resultWithLocations.push(element);
            
                }
            });

            writeToDb(resultWithLocations);
            writeFile(path.basename(file), JSON.stringify(resultWithLocations));
            
        });

    });
});


const writeToDb = (articles) => {
    const MongoClient = require('mongodb').MongoClient;

    // Connection URL
    const url = 'mongodb://admin:bdl123@newspapers-shard-00-00-mjung.gcp.mongodb.net:27017,newspapers-shard-00-01-mjung.gcp.mongodb.net:27017,newspapers-shard-00-02-mjung.gcp.mongodb.net:27017/newspaper?ssl=true&replicaSet=Newspapers-shard-0&authSource=admin&retryWrites=true';

    // Database Name
    const dbName = 'newspaper';

    // Create a new MongoClient
    const client = new MongoClient(url);

    // Use connect method to connect to the Server
    client.connect(function (err) {
        debug("Connected successfully to server");

        const db = client.db(dbName);
        // Get the documents collection
        const collection = db.collection('articles');

        // Insert some documents
        collection.insertMany(articles);
        client.close();
    });
}