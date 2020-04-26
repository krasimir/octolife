import { parse } from 'url';
import get from 'lodash/get';
import { getLocalData } from './data';
import {
  setToken,
  QUERY_GET_REPOS,
  requestGraphQL,
  QUERY_GET_COMMITS,
  QUERY_USER,
} from './graphql';

import UI from './ui';

async function getRepos(login) {
  let cursor;
  let repos = [];
  const getRepo = async function() {
    const q = QUERY_GET_REPOS(login, cursor);
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
    const percent = Math.ceil((repoIndex / repos.length) * 100);
    log(`⌛ Getting commit history (${percent}%)`, true);
    repo.commits = await getRepoCommits(user, repo.name);
    repoIndex += 1;
    await annotate();
  }
  await annotate();
}

window.addEventListener('load', async function() {
  const {
    renderLoader,
    renderProfileRequiredForm,
    renderReport,
    renderTokenRequiredForm,
  } = UI();
  const token = localStorage.getItem('OCTOLIFE_GH_TOKEN');
  setToken(token);

  const profileNameFromTheURL = parse(window.location.href)
    .path.replace(/^\//, '')
    .split('/')
    .shift();

  async function profileNameProvided(profileName) {
    const log = renderLoader();
    log('⌛ Getting profile information ...');
    const user = await getUser(profileName);
    if (user === null) {
      renderProfileRequiredForm(
        profileNameProvided,
        `⚠️ There is no user with profile name "${profileName}". Try again.`
      );
    } else {
      log(`✅ Profile information.`, true);
      log(`⌛ Getting ${user.name}'s repositories ...`);
      const repos = await getRepos(user.login);
      log(`✅ ${user.name}'s repositories.`, true);
      log(`⌛ Getting commit history ...`);
      await annotateReposWithCommitDates(user.login, repos, log);
      log(`✅ Commits.`, true);
      renderReport(user, repos);
    }
  }

  if (!token) {
    renderTokenRequiredForm(profileNameFromTheURL);
  } else if (profileNameFromTheURL !== '') {
    // console.log(await getRepos('azumafuji'));
    const localData = getLocalData();
    if (localData && localData.user.login === profileNameFromTheURL) {
      renderReport(localData.user, localData.repos);
    } else {
      profileNameProvided(profileNameFromTheURL);
    }
  } else {
    renderProfileRequiredForm(profileNameProvided);
  }
});
