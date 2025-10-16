const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const routes = require('./routes');

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api', routes);

app.use((err, req, res, next) => {
  console.error(err && err.stack || err);
  res.status(500).json({ ok:false, error: err.message || 'Internal error' });
});

module.exports = app;
