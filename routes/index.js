require('dotenv').config();
const express = require('express');
const router = express.Router();
const request = require('request');

const db = require('monk')(process.env.MONGO_DB);
const searches = db.get('searches');

const CSE_ID = process.env.CSE_ID;
const API_KEY = process.env.CSE_API_KEY;

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});


  router.get('/latest', (req, res, next) => {
    searches.find({}, '-_id', (e, docs) => {
      res.json(docs);
    })

  });

  router.get('/:query', (req, res, next) => {

    var q = req.params.query;
    var offset = (isNaN(req.query.offset))? 10 : req.query.offset;
    const searchType = 'image';
    var itemList = {};

    searches.insert({
      term: q,
      when: new Date()
    });

    const url = `https://www.googleapis.com/customsearch/v1?cx=${CSE_ID}&num=${offset}&searchType=image&key=${API_KEY}&q=${q}`;

    var requestObject = {
      url: url,
      method: 'GET',
      timeout: 10000
    };

    request(requestObject, (err, response, body) => {
      if (err) throw (err);
      else {
        var result = [];
        itemList = JSON.parse(body).items;

        if (itemList == null) { res.send(JSON.parse(body)); }
        else {
          itemList.forEach((item) => {
            result.push({
              url: item.link,
              snippet: item.snippet,
              thumbnail: item.image.thumbnailLink,
              context: item.image.contextLink
            });
          });
          res.send(result);
        }
      }
    });
});

module.exports = router;
