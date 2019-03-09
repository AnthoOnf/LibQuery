const readFile = require('./file.service').readFile
const writeFile = require('./file.service').writeFile
const debug = require('debug')('extractor');

debug.enabled = true;
let xmls = [];

const getIssueDate = (newspaperPath) => newspaperPath.substring(newspaperPath.indexOf('-') - 4, newspaperPath.indexOf('-') - 4 + 10);

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

const loadXmls = (newspaperPath, pages) => {
    let promises = [];
    const date = getIssueDate(newspaperPath);

    for (let i = 0; i < pages; i++) {
        const page = i < 9 ? '0' + (i + 1) : i + 1;
        const promise = readFile(`./data/${newspaperPath}/text/${date}_01-000${page}`).then((rawXml, err) => {
            return xmlToJson(rawXml);
        });
        promises.push(promise)
    }

    return Promise.all(promises).then((results) => {
        xmls = results;
    });
}

const extractNewspaper = (newspaperPath) => {
    return readFile(`./data/${newspaperPath}/${newspaperPath}-mets`).then((rawXml, err) => {
        return xmlToJson(rawXml).then((jsonXml, err) => {
            const structMap = jsonXml.mets.structMap[1];
            const newspaper = structMap.div[0];
            /** Get newspaper metadata */
            const newspaperTitle = newspaper.attrs.LABEL;

            const issue = newspaperPath.substring(0, newspaperPath.indexOf('_'));
            const numPages = jsonXml.mets.structMap[0].div[0].div.filter((div) => div.attrs.TYPE === "PAGE").length;

            /** Get the newspaper's content with the articles */
            const content = newspaper.div[0].div[0].div[1].div;
            const articles = content.filter((item) => item.attrs.TYPE === 'SECTION' || item.attrs.TYPE === 'ARTICLE');

            return loadXmls(newspaperPath, numPages).then(() => {
                const promiseBody = [];
                debug('Newspaper %o', newspaperTitle);
                debug('Pages %o', numPages);
                debug('Date %o', getIssueDate(newspaperPath));
                debug('*************************')

                for (let i = 0; i < numPages; i++) {
                    articles.forEach(article => {
                        const articleId = article.attrs.DMDID;
                        const articleMetadata = jsonXml.mets.dmdSec.find((item) => item.attrs.ID === articleId);

                        const language = articleMetadata.mdWrap[0].xmlData[0]['mods:mods'][0]['mods:language'][0]['mods:languageTerm'][0]['_']

                        const dtl = article.attrs.ID;
                        const title = article.attrs.LABEL;
                        const bodyIndex = article.div.findIndex((div) => div.attrs.TYPE === 'BODY')

                        if (bodyIndex >= 0) {
                            const ids = [];

                            article.div[bodyIndex].div.forEach((dont) => {
                                const paragraphs = dont.div;

                                paragraphs.forEach(paragraph => {
                                    let areaList = [];

                                    if (paragraph.fptr) {
                                        areaList = paragraph.fptr[0].area
                                    } else {
                                        if (paragraph.div[0].fptr[0].seq) {
                                            areaList = paragraph.div[0].fptr[0].seq[0].area;
                                        } else {
                                            areaList.push(paragraph.div ? paragraph.div[0].fptr[0].area[0] : null);
                                        }
                                    }

                                    if (areaList) {
                                        const area = areaList.filter((area) => area.attrs.BEGIN.startsWith('P' + i)).map(area => area.attrs.BEGIN)
                                        if (area[0] !== undefined) {
                                            ids.push(area[0]);
                                        }
                                    }
                                });
                            })

                            if (ids.length > 0) {
                                promiseBody.push(extractArticle(ids, title, i, newspaperTitle, getIssueDate(newspaperPath), language, issue, dtl));
                            }
                        }
                    });
                }

                const allArticles = [];
                return Promise.all(promiseBody).then((articles) => {
                    return allArticles.concat(articles);
                });
            })
        });
    });
}

const extractArticle = (ids, title, currentPage, newspaperTitle, date, language, issue, dtl) => {
    const xml = xmls[currentPage - 1];

    let lines = "";
    ids.forEach((id) => {
        if (xml.alto.Layout[0].Page[0].PrintSpace[0].TextBlock) {
            const textBlocks = xml.alto.Layout[0].Page[0].PrintSpace[0].TextBlock.filter((textBlock) => textBlock.attrs.ID === id);
            textBlocks.forEach(textBlock => {
                textBlock.TextLine.forEach((textLine) => {
                    const strings = textLine.String;
                    let line = strings.map((string) => {
                        if (string.attrs.SUBS_TYPE === 'HypPart1') {
                            return string.attrs.SUBS_CONTENT;
                        } else {
                            if (string.attrs.SUBS_TYPE === 'HypPart2') {
                                return '';
                            }
                        }

                        return string.attrs.CONTENT;
                    }).join(' ');
                    if (!line.startsWith(' ')) {
                        line = ' ' + line;
                    }
                    lines = lines + line;
                })
            });
        }
    })

    return { newspaper: newspaperTitle, date, title, body: lines.trim(), ids, language, issue, dtl }
}

const getNewspapers = () => {
    const { lstatSync, readdirSync } = require('fs')
    const { join } = require('path')

    const isDirectory = source => lstatSync(source).isDirectory()
    const getDirectories = source =>
        readdirSync(source).map(name => join(source, name)).filter(isDirectory).map(name => name.substring(name.indexOf('/') + 1))

    const promises = [];
    getDirectories('./data/').forEach((newspaper) => {
        promises.push(extractNewspaper(newspaper))
    });

    Promise.all(promises).then((newspapers) => {
        const articles = [];
        newspapers.forEach((newspaper) => {
            let i = 0;
            let previous = null;

            newspaper.forEach((newspaperArticle) => {
                if (previous && previous.title === newspaperArticle.title) {
                    newspaper[i - 1].body = newspaper[i - 1].body + newspaperArticle.body;
                    newspaper[i - 1].ids = newspaper[i - 1].ids.concat(newspaperArticle.ids);

                } else {
                    articles.push(newspaperArticle);
                }
                previous = newspaperArticle;
                i++;
            })
        });
        // writeJson(articles.filter((article) => article.language === 'fr'));
        // writeCsv(newspapers);
        writeToDb(articles);
    })
}

const writeJson = (newspapers) => {
    const complete = newspapers;
    writeFile('./result.json', JSON.stringify(complete));
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
        debug("Connected successfully to server");

        const db = client.db(dbName);
        // Get the documents collection
        const collection = db.collection('articles');

        // Insert some documents
        collection.insertMany(articles);
        client.close();
    });
}

const writeCsv = (newspapers) => {
    var os = require('os');
    let csv = '\ufeff';
    const allArticles = [].concat.apply([], newspapers.map(newspaper => newspaper.articles));
    allArticles.forEach((article) => {
        if (article.body.length > 0) {
            csv = csv + '\"' + article.body.replace(/,/g, ' ').replace(/;/g, ' ').replace(/"/g, '\'') + '\"' + ',\"economie\"' + os.EOL;
        }
    });

    writeFile('./result.csv', csv);
}

/* Main */
getNewspapers();
