const readFile = require('./file.service').readFile
const writeFile = require('./file.service').writeFile

let xmls = [];

const xmlToJson = (rawXml, resolve) => {
    var xml2js = require('xml2js');
    const parser = new xml2js.Parser({ attrkey: 'attrs' })

    return new Promise(function (resolve, reject) {
        parser.parseString(rawXml, function (err, result) {
            if (err) {
                reject(err);
            }
            else {
                resolve(result);
            }
        });
    });
}

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
        console.log("Connected successfully to server");

        const db = client.db(dbName);

        /*
        db.collection('articles').deleteMany({}, function (err, obj) {
            if (err) throw err;
            console.log(obj.result.n + " document(s) deleted");


        });
*/
                    // Get the documents collection
                    const collection = db.collection('authors');

                    // Insert some documents
                    collection.insertMany(articles);
                    client.close();
    });
}

const writeJson = (json) => {
    const complete = json;
    writeFile('./result.json', JSON.stringify(complete));
}

const loadXmls = () => {
        return readFile(`./data/response`).then((rawXml, err) => {
            return xmlToJson(rawXml);
    }).catch(() => {console.log("error")});
}

const formatjson = (json) => {
    const struct = json.links.link;
    const _authors = [];
    console.log(struct.length);
    for (let i = 0; i < struct.length; i++) {
        const authors = struct[i].author;
        for (let x = 0; x < authors.length; x++)
        {
            const name = authors[x].name[0].replace(',', '');
            _authors.push({"name" : name, "url" : authors[x].autorenlexikon_url[0]});
            
            // console.log(authors[x].name[0]);
            // console.log(authors[x].autorenlexikon_url[0]);
        }
        
    }
    //const author = struct;
    //console.log(author);

    return _authors;
}

const getAuthors = () => {
    loadXmls().then((json) => {
        json = formatjson(json);
        //writeJson(json);
        writeToDb(json);
    });
    
    // writeCsv(newspapers);
    // writeToDb(articles);
}

/* Main */
getAuthors();