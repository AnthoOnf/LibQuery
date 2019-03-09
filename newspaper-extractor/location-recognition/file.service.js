var fs = require('fs');

module.exports.readFile = (fileName) => {
    return new Promise(function (resolve, reject) {
        fileName = fs.existsSync(fileName + '.xml') ? fileName : fileName + '-alto';
        fs.readFile(fileName + '.xml', 'utf8', function (err, result) {
            if (err) {
                reject(err);
            }
            else {
                resolve(result);
            }
        });
    });
}

module.exports.writeFile = (fileName, content) => {
    fs.writeFile(fileName, content, 'utf8', (err) => {
        if (err) {
            return console.log(err);
        }
        console.log(`File successfuly saved as ${fileName}`);
    });
}