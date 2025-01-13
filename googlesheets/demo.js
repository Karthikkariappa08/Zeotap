
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3000;


app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());


let sheetData = {};
let validationRules = {}; 


app.get('/api/sheet', (req, res) => {
  res.json(sheetData);
});


app.post('/api/cell', (req, res) => {
  const { cell, value } = req.body;
  const rule = validationRules[cell];

  if (rule) {
    switch (rule.type) {
      case 'number':
        if (isNaN(value)) {
          return res.status(400).json({ error: `Cell ${cell} requires a numeric value.` });
        }
        break;
      case 'date':
        if (isNaN(Date.parse(value))) {
          return res.status(400).json({ error: `Cell ${cell} requires a valid date.` });
        }
        break;
      case 'text':
        if (typeof value !== 'string') {
          return res.status(400).json({ error: `Cell ${cell} requires a text value.` });
        }
        break;
      default:
        return res.status(400).json({ error: `Invalid validation rule for cell ${cell}.` });
    }
  }

  sheetData[cell] = value;
  res.json({ success: true, cell, value });
});

app.post('/api/validation', (req, res) => {
  const { cell, type } = req.body;

  if (!['number', 'date', 'text'].includes(type)) {
    return res.status(400).json({ error: 'Invalid validation type. Valid types are number, date, text.' });
  }

  validationRules[cell] = { type };
  res.json({ success: true, cell, type });
});

app.post('/api/function', (req, res) => {
  const { func, range } = req.body;
  const values = range.map(cell => parseFloat(sheetData[cell]) || 0);

  let result;
  switch (func) {
    case 'SUM':
      result = values.reduce((acc, curr) => acc + curr, 0);
      break;
    case 'AVERAGE':
      result = values.reduce((acc, curr) => acc + curr, 0) / values.length;
      break;
    case 'MAX':
      result = Math.max(...values);
      break;
    case 'MIN':
      result = Math.min(...values);
      break;
    case 'COUNT':
      result = values.filter(val => !isNaN(val)).length;
      break;
    default:
      return res.status(400).json({ error: 'Invalid function' });
  }

  res.json({ success: true, result });
});

app.post('/api/data-quality', (req, res) => {
  const { func, range, findText, replaceText } = req.body;
  let result = [];

  switch (func) {
    case 'TRIM':
      result = range.map(cell => {
        sheetData[cell] = (sheetData[cell] || '').trim();
        return { cell, value: sheetData[cell] };
      });
      break;
    case 'UPPER':
      result = range.map(cell => {
        sheetData[cell] = (sheetData[cell] || '').toUpperCase();
        return { cell, value: sheetData[cell] };
      });
      break;
    case 'LOWER':
      result = range.map(cell => {
        sheetData[cell] = (sheetData[cell] || '').toLowerCase();
        return { cell, value: sheetData[cell] };
      });
      break;
    case 'REMOVE_DUPLICATES':
      const uniqueValues = new Set(range.map(cell => sheetData[cell]));
      range.forEach((cell, index) => {
        sheetData[cell] = Array.from(uniqueValues)[index] || '';
      });
      result = range.map(cell => ({ cell, value: sheetData[cell] }));
      break;
    case 'FIND_AND_REPLACE':
      result = range.map(cell => {
        sheetData[cell] = (sheetData[cell] || '').replace(new RegExp(findText, 'g'), replaceText);
        return { cell, value: sheetData[cell] };
      });
      break;
    default:
      return res.status(400).json({ error: 'Invalid data quality function' });
  }

  res.json({ success: true, result });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

