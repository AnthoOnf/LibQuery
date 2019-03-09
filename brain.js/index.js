const natural = require('natural');
var request = require('request');
const writeFile = require('./file.service').writeFile
const debug = require('debug')('extractor');

categoryClassifier = new natural.BayesClassifier();
sentimentClassifier = new natural.BayesClassifier();

let endpoint = 'http://localhost:3001/';
let articlesTrained = [];
let train = [];

main();

async function main() {
    request(endpoint + 'articles/trained', function (err, response, body) {
    if (err) {
        return console.error('get trained articles failed', err);
    }
    // articlesTrained = JSON.parse(body);

    // articlesTrained.forEach(article => {
    //     train.push({ text: getTitleAndBody(article.title, article.body), labelCategory: article.category, labelSentiment: article.sentiment });
    // });

    // const stemmer = natural.PorterStemmerFr;
    
    // for (let i = 0; i < train.length; i++) {
    //     categoryClassifier.addDocument(stemmer.tokenizeAndStem(train[i].text), train[i].labelCategory);
    //     sentimentClassifier.addDocument(stemmer.tokenizeAndStem(train[i].text), train[i].labelSentiment);
    // }
    // categoryClassifier.train();
    // sentimentClassifier.train();


    request(endpoint + 'articles/remaining', function (err, response, body) {
        if (err) {
            return console.error('get articles remaining failed', err);
        }
        let numberOfArticleRemaining = JSON.parse(body).notDone;
        console.log(numberOfArticleRemaining);
        let articleEnrichByTraining = [];


        for(let i=0; i < numberOfArticleRemaining; i++) {

            request(endpoint + 'articles?skip=' + i, function (err, response, body) {
                if (err) {
                    return console.error('get next article failed', err);
                }
                let article = JSON.parse(body);

                natural.BayesClassifier.load('categoryClassifier.json', null, function(err, categoryClassifier) {
                    const resultCategory = categoryClassifier.classify(getTitleAndBody(article.title, article.body));

                    natural.BayesClassifier.load('sentimentClassifier.json', null, function(err, sentimentClassifier) {
                        const resultSentiment = sentimentClassifier.classify(getTitleAndBody(article.title, article.body));

                        article.category = resultCategory;
                        article.sentiment = resultSentiment;
                        articleEnrichByTraining.push(article);
                        request({ url: endpoint + 'articles/' + article._id, method: 'PUT', json: article}, function (err, response, body) {
                            if(err) {
                                return console.error('update article in db', err);
                            }
                            
                        })

                    });
                });
  
            });


        }

    }); 


    // // Save model to json
    // categoryClassifier.save('categoryClassifier.json', function(err, categoryClassifier) {
    //     if(err) {
    //         return console.error('classifierCategory.json is not create', err);
    //     }
    // });
    // // Save model to json
    // sentimentClassifier.save('sentimentClassifier.json', function(err, sentimentClassifier) {
    //     if(err) {
    //         return console.error('sentimentClassifier.json is not create', err);
    //     }
    // });

    });
}

function getTitleAndBody(title, body) {
    return title + " " + body;
}

function wait(milleseconds) {
    console.log("wait...")
    return new Promise(resolve => setTimeout(resolve, milleseconds))
}