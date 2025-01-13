const spreadsheet = document.getElementById('spreadsheet');

for (let i = 0; i < 100; i++) {
  const cell = document.createElement('div');
  cell.className = 'cell';
  cell.contentEditable = true;
  cell.id = `cell-${i}`;
  cell.addEventListener('blur', () => {
    fetch('/api/cell', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cell: cell.id, value: cell.innerText })
    })
    .then(res => {
      if (!res.ok) {
        return res.json().then(data => { alert(data.error); });
      }
    });
  });
  spreadsheet.appendChild(cell);
}

function applyFunction(func) {
  const range = Array.from(document.querySelectorAll('.cell')).map(cell => cell.id);
  fetch('/api/function', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ func, range })
  })
    .then(res => res.json())
    .then(data => {
      alert(`${func} Result: ${data.result}`);
    });
}

function applyDataQuality(func) {
  const range = Array.from(document.querySelectorAll('.cell')).map(cell => cell.id);
  fetch('/api/data-quality', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ func, range })
  })
    .then(res => res.json())
    .then(data => {
      data.result.forEach(({ cell, value }) => {
        document.getElementById(cell).innerText = value;
      });
    });
}

function findAndReplace() {
  const findText = prompt('Enter the text to find:');
  const replaceText = prompt('Enter the replacement text:');
  const range = Array.from(document.querySelectorAll('.cell')).map(cell => cell.id);
  fetch('/api/data-quality', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ func: 'FIND_AND_REPLACE', range, findText, replaceText })
  })
    .then(res => res.json())
    .then(data => {
      data.result.forEach(({ cell, value }) => {
        document.getElementById(cell).innerText = value;
      });
    });
}

function setValidation(type) {
  const cell = prompt('Enter the cell ID to apply validation (e.g., cell-1):');
  fetch('/api/validation', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cell, type })
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        alert(`Validation set for ${cell} as ${type}.`);
      } else {
        alert(data.error);
      }
    });
}
