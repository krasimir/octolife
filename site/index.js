const fs = require('fs')

const html = fs.readFileSync(__dirname + '/page.html');

module.exports = function (req, res) {
  res.setHeader('Content-Type', 'text/html');
  res.end(html);
}