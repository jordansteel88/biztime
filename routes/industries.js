const express = require("express");
const ExpressError = require("../expressError");
const router = express.Router();
const db = require("../db");


router.get('/', async (req, res, next) => {
    try {
        const results = await db.query(`SELECT industry, code FROM industries`);
        return res.json({ industries: results.rows });
    } catch (err) {
        return next(err);
    }
});

router.post('/', async (req, res, next) => {
    try {
        const { code, industry } = req.body;
        const results = await db.query(
            'INSERT INTO industries (code, industry) VALUES ($1, $2) RETURNING code, industry', [code, industry]);
        return res.status(201).json({ industry: results.rows[0] });
    } catch (err) {
        return next(err);
    }
});

router.put('/:code', async (req, res, next) => {
    try {
        const { code } = req.params;
        const { industry } = req.body;
        const results = await db.query('UPDATE companies SET industry=$1 WHERE code=$2 RETURNING name, industry', [industry, code]);
        if (results.rows.length === 0) {
            throw new ExpressError(`Can't update company with code ${code}`, 404);
        }
        return res.status(201).json({ company: results.rows[0] });
    } catch (err) {
        return next(err);
    }
});






module.exports = router;