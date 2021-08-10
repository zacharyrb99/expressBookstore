process.env.NODE_ENV = 'test';
const request = require('supertest');
const app = require('../app');
const db = require('../db');

let book_isbn;

beforeEach(async () => {
    let result = await db.query(
        `INSERT INTO books (isbn, amazon_url, author, language, pages, publisher, title, year)
        VALUES ('12345', 'https://amazon.com/book', 'testAuthor', 'English', 350, 'Penguin Publications', 'Test Title', 2021)
        RETURNING isbn`);
    
    book_isbn = result.rows[0].isbn;
});

afterEach(async function () {
  await db.query("DELETE FROM BOOKS");
});


afterAll(async function () {
  await db.end()
});

describe('GET /books', () => {
    test('Gets a list of all books', async () => {
        const response = await request(app).get('/books');
        const books = response.body.books;
        expect(response.statusCode).toBe(200);
        expect(books.length).toEqual(1);
        expect(books[0]).toHaveProperty("isbn");
    });
});

describe('GET /books/:isbn', () => {
    test('Gets a single book', async () => {
        const response = await request(app).get(`/books/${book_isbn}`);
        expect(response.statusCode).toBe(200);
        expect(response.body.book).toHaveProperty("isbn");
    });
});

describe('POST /books', () => {
    test('Creates a new book', async () => {
        const response = await request(app).post('/books').send({
            isbn: "123456",
            amazon_url: "https://amazon.com/cats",
            author: "Zach",
            language: "English",
            pages: 500,
            publisher: "Cats Publications",
            title: "Cat Book",
            year: 2020
        });

        expect(response.statusCode).toBe(201);
        expect(response.body.book).toHaveProperty("isbn");
    });

    test('Error creating a book when missing isbn', async () => {
        const response = await request(app).post('/books').send({
            amazon_url: "https://amazon.com/cats",
            author: "Zach",
            language: "English",
            pages: 500,
            publisher: "Cats Publications",
            title: "Cat Book",
            year: 2020
        });

        expect(response.statusCode).toBe(400);
        expect(response.body.error.message[0]).toEqual("instance requires property \"isbn\"");
    });
});

describe('PUT /books/:isbn', () => {
    test('Update book', async () => {
        const response = await request(app).put(`/books/${book_isbn}`).send({
            amazon_url: "https://amazon.com/cats",
            author: "Zach",
            language: "English",
            pages: 500,
            publisher: "Cats Publications",
            title: "Cat Book",
            year: 2020
        });

        expect(response.statusCode).toBe(200);
        expect(response.body.book.amazon_url).toEqual("https://amazon.com/cats");
    });

    test('Error when trying to change isbn', async () => {
        const response = await request(app).put(`/books/${book_isbn}`).send({
            isbn: "1234567",
            amazon_url: "https://amazon.com/cats",
            author: "Zach",
            language: "English",
            pages: 500,
            publisher: "Cats Publications",
            title: "Cat Book",
            year: 2020
        });

        expect(response.statusCode).toBe(400);
    });
});

describe('DELETE /books/:isbn', () => {
    test('Delete a book', async () => {
        const response = await request(app).delete(`/books/${book_isbn}`);
        expect(response.body).toEqual({message: "Book deleted"});
    });
});