var express = require('express');
var router = express.Router();
var knex = require('../db/knex');
var helpers = require('../lib/helpers')

function Books() {
  return knex('books');
}

function Authors_Books() {
  return knex('authors_books');
}

function Authors() {
  return knex('authors');
}

router.get('/', function(req, res, next) {
  Books().pluck('id').then(bookIds => {
    let arr = []
    for (let id of bookIds) {
      arr.push(Books().where('id', id).first().then(book => {
        return Authors_Books().where('book_id', book.id).pluck('author_id').then(authorIds=> {
          return Authors().whereIn('id', authorIds).then(authors=>{
            book.authors = authors
            return book
          })
        })
      }))
    }
    Promise.all(arr).then(books => {
      res.render('books/index', {books})
    })
  })
});

router.get('/new', function(req, res, next) {
  res.render('books/new');
});

router.post('/', function (req, res, next) {
  var errors = [];
  if(!req.body.title.trim()){errors.push("Title cannot be blank")}
  if(!req.body.genre.trim()){errors.push("Genre cannot be blank")}
  if(!req.body.cover_url.trim()){errors.push("Cover image cannot be blank")}
  if(!req.body.description.trim()){errors.push("Description cannot be blank")}
  if(errors.length){
    res.render('books/new', { book: req.body, errors: errors })
  } else {
    Books().insert(req.body).then(function (results) {
        res.redirect('/');
    })
  }
})

router.get('/:id/delete', function(req, res, next) {
  Books().where('id', req.params.id).first().then(book => {
    return Authors_Books().where('book_id', book.id).pluck('author_id').then(authorIds => {
      return Authors().whereIn('id', authorIds).then(authors => {
        res.render('books/delete', {book, authors})
      })
    })
  })
});

router.post('/:id/delete', function(req, res, next) {
  Books().where('id', req.params.id).del().then(function (book) {
    res.redirect('/books');
  })
});

router.get('/:id/edit', function(req, res, next) {
  Books().where('id', req.params.id).first().then(function (book) {
    res.render('books/edit', {book: book});
  })
});

router.get('/:id', function(req, res, next) {
  Books().where('id', req.params.id).first().then(book => {
    return Authors_Books().where('book_id', book.id).pluck('author_id').then(authorIds => {
      return Authors().whereIn('id', authorIds).then(authors => {
        res.render('books/show', {book, authors})
      })
    })
  })
});

router.post('/:id', function(req, res, next) {
  var errors = [];
  if(!req.body.title.trim()){errors.push("Title cannot be blank")}
  if(!req.body.genre.trim()){errors.push("Genre cannot be blank")}
  if(!req.body.cover_url.trim()){errors.push("Cover image cannot be blank")}
  if(!req.body.description.trim()){errors.push("Description cannot be blank")}
  if(errors.length){
    res.render('books/edit', { book: req.body, errors: errors })
  } else {
    Books().where('id', req.params.id).update(req.body).then(function (results) {
      res.redirect('/');
    })
  }
});

module.exports = router;
