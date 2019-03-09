const fastify = require('fastify')({
    logger: true
});

const url = 'mongodb://admin:bdl123@newspapers-shard-00-00-mjung.gcp.mongodb.net:27017,newspapers-shard-00-01-mjung.gcp.mongodb.net:27017,newspapers-shard-00-02-mjung.gcp.mongodb.net:27017/newspaper?ssl=true&replicaSet=Newspapers-shard-0&authSource=admin&retryWrites=true';

fastify.register(require('fastify-mongodb'), {
    forceClose: true,
    url
})
fastify.register(require('fastify-cors'))

fastify.get('/articles/:id', function (req, reply) {
    const mongo = this.mongo;
    const db = mongo.db;
    db.collection('articles', onCollection)

    function onCollection(err, col) {
        if (err) return reply.send(err)

        col.findOne({ _id: new mongo.ObjectId(req.params.id) }, (err, article) => {
            reply.send(article)
        })
    }
})

fastify.get('/articles/delete/:id', function (req, reply) {
    const mongo = this.mongo;
    const db = mongo.db;
    db.collection('articles', onCollection)

    function onCollection(err, col) {
        if (err) return reply.send(err)

        col.remove({ _id: new mongo.ObjectId(req.params.id) }, () => {
            reply.send({})
        })
    }
})

fastify.get('/articles', function (req, reply) {
    const skip = req.query.skip;
    const mongo = this.mongo;
    const db = mongo.db;
    const collection = db.collection('articles')
    cursor = collection.find({ category: null, sentiment: null }).skip(parseInt(skip)).limit(1);

    cursor.each((err, item) => {
        if (item !== null) {
            reply.send(item)
        }
    });
})

fastify.get('/articles/remaining', function (req, reply) {
    const mongo = this.mongo;
    const db = mongo.db;
    const collection = db.collection('articles')
    cursor = collection.find({ category: null, sentiment: null });

    let notDone = 0;
    cursor.count((e, count) => {
        notDone = count;

        cursor = collection.find({});

        let all = 0;
        cursor.count((e, count) => {
            all = count;

            reply.send({ all, notDone });
        });
    });
})

fastify.put('/articles/:id', function (req, reply) {
    const mongo = this.mongo;
    const db = mongo.db;
    const collection = db.collection('articles')
    collection.updateOne({ _id: new mongo.ObjectId(req.params.id) }, { $set: { sentiment: req.body.sentiment, category: req.body.category } }, (err, res) => {
        if (err) {
            reply.send('Error updating article');
        }
        reply.send(req.body);
    });
})

fastify.get('/articles/trained', function (req, reply) {
    const mongo = this.mongo;
    const db = mongo.db;
    const collection = db.collection('articles')
    const promise = collection.find({ sentiment: { $exists: true }, category: { $exists: true } }).toArray();

    promise.then((articles) => {
        reply.send(articles);
    })
})

fastify.post('/articles', function (req, reply) {
    const mongo = this.mongo;
    const db = mongo.db;
    const page = req.query.page ? parseInt(req.query.page) : 0;
    const { city, minDate, maxDate, language } = req.body;
    const ITEMS_PER_PAGE = 10;

    const collection = db.collection('articles')
    const options = {
    };

    if (language) {
        options.language = language.toLowerCase();
    }
    if (city) {
        options.locations = { $elemMatch: { $eq: city.toLowerCase() } };
    }
    options.$and = [ { year: { $lte: parseInt(maxDate)} }, { year: { $gte: parseInt(minDate)} } ];

    let promise = null;
    options.category = "war";
    if (page > 1) {
        promise = collection.find(options).sort( { year: 1 } ).limit(ITEMS_PER_PAGE).skip(page * ITEMS_PER_PAGE).toArray();
    } else {
        promise = collection.find(options).sort( { year: 1 } ).limit(ITEMS_PER_PAGE).toArray();
    }

    promise.then((articles) => {
        reply.send(articles);
    }).catch((error) => { console.log(error); reply.send('error') });
})


fastify.get('/authors/:query', function (req, reply) {
    const mongo = this.mongo;
    const db = mongo.db;
    const collection = db.collection('authors')
    const promise = collection.distinct("name", { name: { $regex : ".*" + req.params.query + ".*"} });

    promise.then((authors) => {
        reply.send(authors);
    })
})

fastify.get('/author/:name', function (req, reply) {
    const mongo = this.mongo;
    const db = mongo.db;
    db.collection('authors', onCollection)


    function onCollection(err, col) {
        if (err) return reply.send(err)

        col.findOne({ name: req.params.name }, (err, author) => {
            reply.send(author)
        })
    }
})

fastify.listen(3001, '0.0.0.0', err => {
    if (err) throw err
})

