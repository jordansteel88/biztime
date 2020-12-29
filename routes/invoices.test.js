process.env.NODE_ENV = 'test';

const request = require('supertest');
const app = require('../app');
const db = require('../db');

let testInvoice;
let testCompany;

beforeAll(async () => {
    await Promise.all([db.query(`DELETE FROM companies`),
                       db.query(`DELETE FROM invoices`),
                       db.query(`DELETE FROM industries`),
                       db.query(`DELETE FROM companies_industries`)]
    );
});

beforeEach(async () => {
    const compResult = await db.query(
        `INSERT INTO companies (code, name, description)
         VALUES ('testco', 'TestCo', 'test company') 
         RETURNING code, name, description`);
    testCompany = compResult.rows[0];

    const invoiceResult = await db.query(
        `INSERT INTO invoices (id, comp_code, amt)
         VALUES (12345, 'testco', 500) 
         RETURNING id, comp_code, amt`);
    testInvoice = invoiceResult.rows[0];
});

afterEach(async () => {
    await db.query(`DELETE FROM companies`);
    await db.query(`DELETE FROM invoices`);
});

afterAll(async () => {
    await db.end();
});

describe("GET /invoices", () => {
    test("Get a list of invoices", async () => {
        const res = await request(app).get('/invoices');

        expect(res.statusCode).toBe(200);
        expect(res.body.invoices[0].id).toEqual(12345);
    });
});

describe("GET /invoices/:id", () => {
    test("Gets a single invoice", async () => {
        const res = await request(app).get(`/invoices/${testInvoice.id}`);

        expect(res.statusCode).toBe(200); 
        expect(res.body.invoice.id).toEqual(12345);
        expect(res.body.invoice.amt).toEqual(500);
        expect(res.body.invoice.name).toEqual('TestCo');
    });

    test("Responds with 404 for invalid id", async () => {
        const res = await request(app).get(`/invoices/0`);
        expect(res.statusCode).toBe(404);
    });
});

describe("POST /invoices", () => {
    test("Creates a single invoice", async () => {
        const res = await request(app).post('/invoices').send({ id: 11111, comp_code: 'testco', amt: 123 });

        expect(res.statusCode).toBe(201);
        expect(res.body.invoice.comp_code).toEqual('testco');
        expect(res.body.invoice.amt).toEqual(123);
    });
});

describe("PUT /invoices/:id", () => {
    test("Updates a single invoice", async () => {
        console.log(testInvoice.id);
        const res = await request(app).put(`/invoices/${testInvoice.id}`).send({ amt: 999, paid: false });

        expect(res.statusCode).toBe(200);
        expect(res.body.invoice.amt).toEqual(999);
    });

    test("Responds with 404 for invalid id", async () => {
        const res = await request(app).put(`/invoices/0`).send({ amt: '999' });
        expect(res.statusCode).toBe(404);
    });
});

describe("DELETE /invoices/:id", () => {
    test("Deletes a single invoice", async () => {
        const res = await request(app).delete(`/invoices/${testInvoice.id}`);

        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({ status: 'deleted' });
    });
});