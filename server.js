const express = require("express");
const exphbs = require("express-handlebars");
const mongoose = require("mongoose");
const axios = require("axios");
const cheerio = require("cheerio");
const db = require("./models");
const app = express();
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/mongoHeadlines";
const PORT = process.env.PORT || 3000;

mongoose.connect(MONGODB_URI);
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("public"));
//mongoose.connect("mongodb://localhost/unit18Populater", { useNewUrlParser: true });


// scrape GET route 
app.get("/scrape", (req, res) => {
  axios.get("http://www.echojs.com/").then(function (response) {
    const $ = cheerio.load(response.data);
    $("article h2").each(function(i, element) {
      let result = {};
      result.title = $(this)
        .children("a")
        .text();
      result.link = $(this)
        .children("a")
        .attr("href");
      db.Article.create(result)
        .then((dbArticle) => {
          console.log(dbArticle);
        })
        .catch((err) => {
          console.log(err);
        });
    });
    res.send("Scrape Complete");
  });
});

// GET db data
app.get("/articles", (req, res) => {
  db.Article.find({})
    .then((dbArticle) => {
      res.json(dbArticle);
    })
    .catch((err) => {
      res.json(err);
    });
});

// GET article by id
app.get("/articles/:id", function (req, res) {
  db.Article.findOne({ _id: req.params.id })
    .populate("note")
    .then(function (dbArticle) {
      res.json(dbArticle);
    })
    .catch(function (err) {
      res.json(err);
    });
});

//saving/updating note
app.post("/articles/:id", function (req, res) {
  db.Note.create(req.body)
    .then(function (dbNote) {
      return db.Article.findOneAndUpdate({ _id: req.params.id }, { note: dbNote._id }, { new: true });
    })
    .then(function (dbArticle) {
      res.json(dbArticle);
    })
    .catch(function (err) {
      res.json(err);
    });
});

app.listen(PORT, function () {
  console.log("App running on port " + PORT + "!");
});
