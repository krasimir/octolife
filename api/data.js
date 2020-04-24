const { parse } = require('url');
const { requestGraphQL } = require('./utils');

function JSONResponse(res, data, status = 200) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.statusCode = status;
  res.end(JSON.stringify(data));
}

const GITHUB_QUERY = `
{
  viewer {
    repositories(first: 2) {
      totalCount,
        edges {
          cursor,
          node {
            name,
            id,
            nameWithOwner,
            homepageUrl,
            ref(qualifiedName: "master") {
              target {
              ... on Commit {
                history(first: 10) {
                  totalCount,
                  edges {
                    node {
                      message,
                      committedDate,
                        author {
                          name
                        }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}
`;

module.exports = async function (req, res) {
  const { query } = parse(req.url, true);

  if (!query.user) {
    return JSONResponse(res, { error: 'Missing `user` GET param.' }, 400);
  }

  try {
    const data = await requestGraphQL(GITHUB_QUERY);
    
  } catch(err) {
    console.error(err);
    return JSONResponse(res, { err: err.toString() }, 500)
  }
  
  JSONResponse(res, { hello: 'ok' });
}