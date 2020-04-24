const { parse } = require('url');
const get = require('lodash/get');
const fetch = require('node-fetch');
const token = require('fs').readFileSync(__dirname + '/token').toString('utf8');

const endpointGraphQL = 'https://api.github.com/graphql';
const getHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: 'token ' + token
});

const requestGraphQL = async function(query, customHeaders = {}) {
  const res = await fetch(endpointGraphQL, {
    headers: Object.assign({}, getHeaders(), customHeaders),
    method: 'POST',
    body: JSON.stringify({ query })
  });

  if (!res.ok) {
    throw new Error(res.status + ' ' + res.statusText);
  }
  console.log(`Rate limit remaining: ${res.headers.get('x-ratelimit-remaining')}`);
  const resultData = await res.json();

  if (resultData.errors) {
    console.warn('There are errors while requesting ' + endpointGraphQL);
    console.warn(resultData.errors.map(({ message }) => message));
  }
  return resultData;
};

function JSONResponse(res, data, status = 200) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.statusCode = status;
  res.end(JSON.stringify(data));
}

const QUERY_GET_REPOS = (query, cursor) => `
  query {
    search(query: "${query}", type: REPOSITORY, first: 100${cursor ? `, after: "${cursor}"` : ''}) {
      repositoryCount,
      edges {
        cursor,
        node {
          ... on Repository {
            name,
            nameWithOwner
          }
        }
      }
    }
  }
`;

const QUERY_GET_COMMITS = (user, repo, cursor) => `
  {
    repository(owner: "${user}", name: "${repo}") {
      object(expression: "master") {
        ... on Commit {
          history(first: 100${cursor ? `, after: "${cursor}"` : ''}) {
            nodes {
              committedDate
            }
            pageInfo {
              endCursor
            }
          }
        }
      }
    }
  }
`;

async function getRepos(user) {
  let cursor;
  let repos = [];
  const get = async () => {
    console.log(`Getting repos for ${user} cursor=${cursor}`);
    const q = QUERY_GET_REPOS(`user:${user}`, cursor);
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

function getRepoCommits(user, repoName) {
  let perPage = 100;
  let cursor;
  let commits = [];
  const getCommits = async () => {
    console.log(`Getting commits for ${user}/${repoName} cursor=${cursor}`);
    const q = QUERY_GET_COMMITS(user, repoName, cursor);
    const { data } = await requestGraphQL(q);

    commits = commits.concat(get(data, 'repository.object.history.nodes'));

    const endCursor = get(data, 'repository.object.history.pageInfo.endCursor');
    if (endCursor) {
      cursor = endCursor;
      return await getCommits();
    }
    return commits.map(({ committedDate }) => committedDate);
  };

  return getCommits();
}

async function annotateReposWithCommitDates(user, repos) {
  let repoIndex = 0;
  async function annotate() {
    if (repoIndex >= repos.length) {
      return;
    }
    const repo = repos[repoIndex];
    repo.commits = await getRepoCommits(user, repo.name);
    repoIndex += 1;
    await annotate();
  }
  await annotate();
}

module.exports = async function (req, res) {
  const { query } = parse(req.url, true);

  if (!query.user) {
    return JSONResponse(res, { error: 'Missing `user` GET param.' }, 400);
  }

  try {
    let repos = await getRepos(query.user);
    repos = repos.map(r => r.node);
    repos = [repos[0]];
    await annotateReposWithCommitDates(query.user, repos);
    JSONResponse(res, repos);
  } catch(err) {
    console.error(err);
    return JSONResponse(res, { err: err.toString() }, 500)
  }
}