var Promise = require('bluebird');
var knex = require('../db/knex');

function Authors() {
  return knex('authors');
}

function Books(){
  return knex('books');
}

function Authors_Books() {
  return knex('authors_books');
}

function prepIds(ids) {
  return ids.filter(function (id) {
    return id !== '';
  })
}

function insertIntoAuthorsBooks(bookIds, authorId) {
  bookIds = prepIds(bookIds);
  return Promise.all(bookIds.map(function (book_id) {
    book_id = Number(book_id)
    return Authors_Books().insert({
      book_id: book_id,
      author_id: authorId
    })
  }))
}

function getAuthorBooks(id) {
  return Authors().where('id', id).first().then(author => {
    return Authors_Books().where('author_id', author.id).pluck('book_id').then(bookIds => {
      return Books().whereIn('id', bookIds).then(books => {
        return {books, author}
      })
    })
  })
}

function getAllAuthors() {
  let arr = []
  return Authors().pluck('id').then(author_ids => {
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
    let authors = Promise.all(arr).then(authors => authors)
    return authors
  })
}

function getBookAuthors(id) {
  return Books().where('id', id).first().then(book => {
    return Authors_Books().where('book_id', book.id).pluck('author_id').then(authorIds => {
      return Authors().whereIn('id', authorIds).then(authors => {
        return {book, authors}
      })
    })
  })
}

function getAllBooks() {
  return Books().pluck('id').then(bookIds => {
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
    let books = Promise.all(arr).then(books => books)
    return books
  })
}


module.exports = {
  getAuthorBooks: getAuthorBooks,
  getAllAuthors: getAllAuthors,
  getBookAuthors: getBookAuthors,
  getAllBooks: getAllBooks
}
