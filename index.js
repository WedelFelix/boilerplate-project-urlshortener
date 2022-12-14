require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

// Project Solution ==============================

//Import mongoose for database
const mongoose = require("mongoose")
const Schema = mongoose.Schema;

// body-parser used to get url from request body
const bodyParser = require('body-parser');

// shortid used to generate shortened url
const shortID = require('shortid')

// valid-url used to validate urls
const validUrl = require('valid-url');

app.use(bodyParser.urlencoded({ extended: true }));

// conect to database
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

// Schema for our urls. each url has a corresponding short url
const urlSchema = new Schema({
  original_url: String,
  short_url: String
});

// Use our urlSchema to create a model called Url
const Url = mongoose.model('Url', urlSchema);

// Handle post requests for shortened urls
app.post("/api/shorturl", (req, res) => {
  //First we make sure the url is a valid and using http(s) protocol
  if (validUrl.isHttpUri(req.body.url) || validUrl.isHttpsUri(req.body.url)) {
    // Try finding the url or adding it to our database
    try {
      Url.findOne({ original_url: req.body.url }, (err, url) => {
        if (err) return console.error(err);
        //if the url is found in our db, return a json object eith the full and shortened url
        else if (url) {
          url = {
            original_url: url.original_url,
            short_url: url.short_url
          };
        }
        // If the url is not found in our db, create a shortened url and store them in the db
        else {
          // create an instance of Url using the provided url and generate a  shortened url for it 
          url = new Url({
            original_url: req.body.url,
            short_url: shortID.generate()
          });
          //save the instance of Url in our db
          url.save(function (err, data) {
            if (err) return console.error(err);
          });
        }
        //return a json object with the original and shortened url
        res.json({ original_url: url.original_url, short_url: url.short_url });
      });
    }

    catch (err) {
      console.log(err);
      res.status(500).json("The server encountered an error");
    }
  }
  //If the given url is invalid, return a json object with an error message
  else {
    res.json({ error: 'invalid url' });
  }
});

// handle get request with a shortened url paramater 
app.get("/api/shorturl/:url", (req, res) => {
  //try to find the shortened url in our db and redirect to the corresponding full url
  try {
    Url.findOne({ short_url: req.params.url }, (err, url) => {
      if (err) return console.error(err);
      // If the short url is found in the db, redirect to the full url
      else if (url) {
        res.redirect(302, url.original_url);
      }
      // If the short url is not found in the db, return a json object with an error message
      else {
        res.json({ error: "url not found" })
      }
    });
  }
  catch {
    return { error: "The server encountered an error" }
  }
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
