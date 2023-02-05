const express = require('express');
const createError = require('http-errors');
const morgan = require('morgan');
const shortId = require("shortid");
const mongoose = require('mongoose');
const path = require('path');
const urlModel = require('./models/url.model');

require('dotenv').config({ path: `.env.${process.env.NODE_ENV}` });

const { NODE_ENV, MONGO_HOST, MONGO_PORT, PORT } = process.env;

const app = express();
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(morgan('dev'));

mongoose.set('debug', true);
mongoose.set('strictQuery', true);
mongoose.connect(`mongodb://${MONGO_HOST}/${MONGO_PORT}`, { serverSelectionTimeoutMS: 3000 });
mongoose.connection.on('connected', () => console.log('connected to mongodb'));
mongoose.connection.on('error', (err) => console.log('error:::', err));

app.set('view engine', 'ejs');

app.get('/', async (req, res, next) => {
  res.render('index');
});

app.post('/', async (req, res, next) => {
  try {
    if (!req.body.url) return next(createError.BadRequest('Provide a valid url'));

    const urlExists = await urlModel.findOne({ url: req.body.url });
    if (urlExists) return res.render('index', { short_url: `http://${getHostByEnv(req)}/${urlExists.shortId}` });

    const url = await urlModel.create({ url: req.body.url, shortId: shortId.generate() });
    res.render('index', {
      short_url: `http://${getHostByEnv(req)}/${url.shortId}`
    });
  } catch (error) {
    next(error);
  }
});

const getHostByEnv = (req) => NODE_ENV === 'production' ? `${req.hostname}:${PORT}` : req.headers.host;

app.get('/:shortId', async (req, res, next) => {
  try {
    const urlExists = await urlModel.findOne({ shortId: req.params.shortId });
    if (!urlExists) return res.redirect('/');
    res.redirect(urlExists.url);
  } catch (error) {
    next(error);
  }
});

app.use('/api', require('./routes/api.route'));

app.use((req, res, next) => {
  next(createError.NotFound());
});

app.use((err, req, res, next) => {
  res.status(err.status || 500);
  res.send({
    status: err.status || 500,
    message: err.message,
  });
});

app.listen(PORT, () => console.log(`🚀 @http:;//localhost:${PORT}`));
