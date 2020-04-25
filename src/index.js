import UI from './ui';

const { parse } = require('url');
const get = require('lodash/get');

let token = '';

const endpointGraphQL = 'https://api.github.com/graphql';
const getHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `token ${token}`,
});

const requestGraphQL = async function(query, customHeaders = {}) {
  const res = await fetch(endpointGraphQL, {
    headers: Object.assign({}, getHeaders(), customHeaders),
    method: 'POST',
    body: JSON.stringify({ query }),
  });

  if (!res.ok) {
    throw new Error(`${res.status} ${res.statusText}`);
  }
  // console.log(`Rate limit remaining: ${res.headers.get('x-ratelimit-remaining')}`);
  const resultData = await res.json();

  if (resultData.errors) {
    console.warn(`There are errors while requesting ${endpointGraphQL}`);
    console.warn(resultData.errors.map(({ message }) => message));
  }
  return resultData;
};

const QUERY_GET_REPOS = (query, cursor) => `
  query {
    search(query: "${query}", type: REPOSITORY, first: 100${
  cursor ? `, after: "${cursor}"` : ''
}) {
      repositoryCount,
      edges {
        cursor,
        node {
          ... on Repository {
            name
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

const QUERY_USER = `
  query {
    viewer {
      name,
      login,
      avatarUrl
    }
  }
`;

async function getRepos(login) {
  let cursor;
  let repos = [];
  const getRepo = async function() {
    const q = QUERY_GET_REPOS(`user:${login}`, cursor);
    const { data } = await requestGraphQL(q);

    repos = repos.concat(data.search.edges);

    if (data.search.repositoryCount > repos.length) {
      cursor = repos[repos.length - 1].cursor.replace('==', '');
      return getRepo();
    }
    return repos.map(r => r.node);
  };

  return getRepo();
}
async function getRepoCommits(user, repoName) {
  const perPage = 100;
  let cursor;
  let commits = [];
  const getCommits = async function() {
    const q = QUERY_GET_COMMITS(user, repoName, cursor);
    const { data } = await requestGraphQL(q);

    commits = commits.concat(get(data, 'repository.object.history.nodes'));

    const endCursor = get(data, 'repository.object.history.pageInfo.endCursor');
    if (endCursor) {
      cursor = endCursor;
      return getCommits();
    }
    return commits
      .map(d => (d ? d.committedDate || false : false))
      .filter(v => v);
  };

  return getCommits();
}
async function getUser() {
  const { data } = await requestGraphQL(QUERY_USER);
  return data.viewer;
}

async function annotateReposWithCommitDates(user, repos, log) {
  let repoIndex = 0;
  async function annotate() {
    if (repoIndex >= repos.length) {
      return;
    }
    const repo = repos[repoIndex];
    log(
      `Getting commits for ${repo.name} ${repoIndex + 1}/${repos.length}`,
      true
    );
    repo.commits = await getRepoCommits(user, repo.name);
    repoIndex += 1;
    await annotate();
  }
  await annotate();
}

window.addEventListener('load', async function() {
  const { log, renderForm, drawGraph, renderTokenForm } = UI();
  token = localStorage.getItem('OCTOLIFE_GH_TOKEN');

  function profileNameProvided(user) {
    console.log(user);
  }

  if (!token) {
    renderTokenForm(t => {
      localStorage.setItem('OCTOLIFE_GH_TOKEN', t);
      token = t;
      renderForm(profileNameProvided);
    });
  } else {
    renderForm(profileNameProvided);
  }

  // renderForm(async function(t) {
  //   token = t;
  //   log('Getting your profile information');
  //   const user = await getUser();
  //   log('Getting your repositories.');
  //   const repos = await getRepos(user.login);
  //   await annotateReposWithCommitDates(user.login, repos, log);
  //   drawGraph(user, repos);
  // });
});
