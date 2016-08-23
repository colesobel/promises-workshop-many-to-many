var express = require('express');
var router = express.Router();
var knex = require('../db/knex');
var Promise = require('bluebird');
var helpers = require('../lib/helpers');

function Authors() {
  return knex('authors');
}

function Books() {
  return knex('books');
}

function Authors_Books() {
  return knex('authors_books');
}


router.get('/', function(req, res, next) {
  let arr = []
  Authors().pluck('id').then(author_ids => {
    for (let id of author_ids) {
      arr.push(
        Authors().where('id', id).first().then(author => {
          return Authors_Books().where('author_id', author.id).pluck('book_id').then(book_ids => {
            return Books().whereIn('id', book_ids).then(books => {
              author.books = books
              return author
            })
          })
        })
      )
    }
    Promise.all(arr).then(authors => {
      res.render('authors/index', {authors})
    })
  })
});

router.get('/new', function(req, res, next) {
  Books().select().then(function (books) {
    res.render('authors/new', {books: books});
  })
});

router.post('/', function (req, res, next) {
  var bookIds = req.body.book_ids.split(",");
  delete req.body.book_ids;
  Authors().returning('id').insert(req.body).then(function (id) {
    helpers.insertIntoAuthorsBooks(bookIds, Authors_Books, id[0]).then(function () {
      res.redirect('/authors');
    })
  })
});

router.get('/:id/delete', function (req, res, next) {
  Authors().where('id', req.params.id).first().then(function (author) {
    helpers.getAuthorBooks(author).then(function (authorBooks) {
      Books().select().then(function (books) {
        res.render('authors/delete', {author: author, author_books: authorBooks, books: books });
      })
    })
  })
})

router.post('/:id/delete', function (req, res, next) {
  Promise.all([
    Authors().where('id', req.params.id).del(),
    Authors_Books().where('author_id', req.params.id).del()
  ]).then(function (results) {
    res.redirect('/authors')
  })
})

router.get('/:id/edit', function (req, res, next) {
  Authors().where('id', req.params.id).first().then(author => {
    Authors_Books().where('author_id', author.id).pluck('book_id').then(book_ids => {
      Books().whereIn('id', book_ids).then(books => {
        res.render('authors/edit', {author, books})
      })
    })
  })
})

router.post('/:id', function (req, res, next) {
  var bookIds = req.body.book_ids.split(",");
  delete req.body.book_ids;
  Authors().returning('id').where('id', req.params.id).update(req.body).then(function (id) {
    id = id[0];
    helpers.insertIntoAuthorsBooks(bookIds, id).then(function () {
    res.redirect('/authors');
    });
  })
})

router.get('/:id', function (req, res, next) {
  Authors().where('id', req.params.id).first().then(author => {
    return Authors_Books().where('author_id', author.id).pluck('book_id').then(bookIds => {
      return Books().whereIn('id', bookIds).then(books => {
        res.render('authors/show', {author, books})
      })
    })
  })
})

module.exports = router;
