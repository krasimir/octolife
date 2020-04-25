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

const QUERY_USER = user => `
  query {
    search(query: "user:${user}", type: USER, first: 1) {
      userCount,
      edges {
        node {
          ... on User {
            name,
            login,
            avatarUrl
          }
        }
      }
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
async function getUser(profileName) {
  const { data } = await requestGraphQL(QUERY_USER(profileName));
  return get(data, 'search.edges.0.node', null);
}
async function annotateReposWithCommitDates(user, repos, log) {
  let repoIndex = 0;
  async function annotate() {
    if (repoIndex >= repos.length) {
      return;
    }
    const repo = repos[repoIndex];
    log(
      `⌛ Getting commits ... ${repoIndex + 1} of ${repos.length} repositories`,
      true
    );
    repo.commits = await getRepoCommits(user, repo.name);
    repoIndex += 1;
    await annotate();
  }
  await annotate();
}

window.addEventListener('load', async function() {
  const { renderLoader, renderForm, renderReport, renderTokenForm } = UI();
  token = localStorage.getItem('OCTOLIFE_GH_TOKEN');

  const profileNameFromTheURL = parse(window.location.href)
    .path.replace(/^\//, '')
    .split('/')
    .shift();

  async function profileNameProvided(profileName) {
    const log = renderLoader();
    log('⌛ Getting profile information ...');
    const user = await getUser(profileName);
    if (user === null) {
      renderForm(
        profileNameProvided,
        `⚠️ There is no user with profile name "${profileName}". Try again.`
      );
    } else {
      log(`✅ Profile information.`, true);
      log(`⌛ Getting ${user.name}'s repositories ...`);
      const repos = await getRepos(user.login);
      log(`✅ ${user.name}'s repositories.`, true);
      log(`⌛ Getting commits ...`);
      await annotateReposWithCommitDates(user.login, repos, log);
      log(`✅ Commits.`, true);
      renderReport(user, repos);
    }
  }

  if (!token) {
    renderTokenForm(t => {
      localStorage.setItem('OCTOLIFE_GH_TOKEN', t);
      token = t;
      renderForm(profileNameProvided);
    });
  } else if (profileNameFromTheURL !== '') {
    profileNameProvided(profileNameFromTheURL);
  } else {
    renderForm(profileNameProvided);
  }
});
