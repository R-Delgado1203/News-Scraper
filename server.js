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

// Handlebars
app.engine(
  "handlebars",
  exphbs({
    defaultLayout: "main"
  })
);
app.set("view engine", "handlebars");

// scrape GET route 
app.get("/scrape", (req, res) => {
  axios.get("https://old.reddit.com/r/news")
    .then(function (response) {
      const $ = cheerio.load(response.data);
      $(".top-matter p.title").each(function (i, element) {
        let result = {};
        result.title = $(this)
          .children("a.title")
          .text();
        result.link = $(this)
          .children("a.title")
          .attr("href");
        db.Article.create(result)
          .then((dbArticle) => {
            console.log(dbArticle);
          })
          .catch((err) => {
            console.log(err);
          });
      });
      res.render("home", response);
    });
});

// GET db data
app.get("/", (req, res) => {
  db.Article.find({})
    .then((dbArticle) => {
      let dbData = { article: dbArticle };
      //res.json(dbArticle);
      res.render('home', dbData);
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

app.get("/clear", (req, res) => {
  db.Article.remove({})
    .then(() => {
      /*       let dbData = { article: dbArticle };
            //res.json(dbArticle); */
      res.render('home');
    })
    .catch((err) => {
      res.json(err);
    });
});

app.listen(PORT, function () {
  console.log("App running on port " + PORT + "!");
});
