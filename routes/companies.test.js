process.env.NODE_ENV = 'test';

const request = require('supertest');
const app = require('../app');
const db = require('../db');

let testCompany;

beforeAll(async () => {
    await Promise.all([db.query(`DELETE FROM companies`),
                       db.query(`DELETE FROM invoices`),
                       db.query(`DELETE FROM industries`),
                       db.query(`DELETE FROM companies_industries`)]
    );
});

beforeEach(async () => {
    const result = await db.query(
        `INSERT INTO companies (code, name, description, industry)
         VALUES ('testco', 'TestCo', 'test company', null) 
         RETURNING code, name, description, industry`);
    testCompany = result.rows[0];
});

afterEach(async () => {
    await db.query(`DELETE FROM companies`);
});

afterAll(async () => {
    await db.end();
});

describe("GET /companies", () => {
    test("Get a list of companies", async () => {
        const res = await request(app).get('/companies');

        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({ companies: [testCompany] });
    });
});

describe("GET /companies/:code", () => {
    test("Gets a single company", async () => {
        const res = await request(app).get(`/companies/${testCompany.code}`);

        expect(res.statusCode).toBe(200); 
        expect(res.body).toEqual({ company: testCompany });
    });

    test("Responds with 404 for invalid code", async () => {
        const res = await request(app).get(`/company/0`);
        expect(res.statusCode).toBe(404);
    });
});

describe("POST /companies", () => {
    test("Creates a single company", async () => {
        const res = await request(app).post('/companies').send({ code: "tc2",  name: 'TestCo2', description: 'test company 2', industry: null });

        expect(res.statusCode).toBe(201);
        expect(res.body.company.name).toEqual("TestCo2");
        expect(res.body.company.description).toEqual("test company 2");
    });
});

describe("PUT /companies/:code", () => {
    test("Updates a single company", async () => {
        const res = await request(app).put(`/companies/${testCompany.code}`).send({ name: 'TestCo', description: 'updated description' });

        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({
            company: { code: testCompany.code, name: 'TestCo', description: 'updated description' }
        });
    });

    test("Responds with 404 for invalid id", async () => {
        const res = await request(app).put(`/companies/0`).send({ name: 'TestCo', description: '404 me' });
        expect(res.statusCode).toBe(404);
    });
});

describe("DELETE /companies/:id", () => {
    test("Deletes a single company", async () => {
        const res = await request(app).delete(`/companies/${testCompany.code}`);

        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({ status: 'deleted' });
    });
});