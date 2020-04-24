const { parse } = require('url');

function JSONResponse(res, data, status = 200) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.statusCode = status;
  res.end(JSON.stringify(data));
}

module.exports = function (req, res) {
  const { query } = parse(req.url, true);

  if (!query.user) {
    return JSONResponse(res, { error: 'Missing `user` GET param.' }, 400);
  }
  
  JSONResponse(res, { hello: 'ok' })
}