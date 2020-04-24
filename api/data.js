const { parse } = require('url');
const { requestGraphQL } = require('./utils');
const normalize = require('./normalize');

function JSONResponse(res, data, status = 200) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.statusCode = status;
  res.end(JSON.stringify(data));
}

const GITHUB_QUERY = (perPage, cursor) => `
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

const QUERY_GET_REPOS_OF_ORG = (query, perPage, cursor) => `
  query {
    search(query: "${query}", type: REPOSITORY, first: ${perPage}${cursor ? `, after: "${cursor}"` : ''}) {
      repositoryCount,
      edges {
        cursor,
        node {
          ... on Repository {
            name,
            id,
            nameWithOwner,
            isPrivate,
            owner {
              login
            }
          }
        }
      }
    }
  }
`;

async function getRepos(user) {
  let perPage = 100;
  let cursor;
  let repos = [];
  const get = async () => {
    console.log(`Getting repos for ${user} cursor=${cursor}`);
    const q = QUERY_GET_REPOS_OF_ORG(`user:${user}`, perPage, cursor);
    const { data } = await requestGraphQL(q);

    repos = repos.concat(data.search.edges);

    if (data.search.repositoryCount > repos.length) {
      cursor = repos[repos.length - 1].cursor.replace('==', '');
      return await get();
    }
    return repos;
  };

  return get();
};

module.exports = async function (req, res) {
  const { query } = parse(req.url, true);

  if (!query.user) {
    return JSONResponse(res, { error: 'Missing `user` GET param.' }, 400);
  }

  try {
    JSONResponse(res, normalize(await getRepos(query.user)));
  } catch(err) {
    console.error(err);
    return JSONResponse(res, { err: err.toString() }, 500)
  }
}