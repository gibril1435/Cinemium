const fs = require('fs');
const path = require('path');

function getDbFilePath(table) {
  return path.join(__dirname, '../../database', `${table}.json`);
}

function readTable(table) {
  const filePath = getDbFilePath(table);
  if (!fs.existsSync(filePath)) return [];
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

function writeTable(table, data) {
  const filePath = getDbFilePath(table);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

module.exports = { readTable, writeTable }; 