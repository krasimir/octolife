/* eslint-disable @typescript-eslint/no-use-before-define */
import { parse } from 'url';
import get from 'lodash/get';
import {
  setToken,
  QUERY_GET_REPOS,
  requestGraphQL,
  QUERY_GET_COMMITS,
  QUERY_USER,
} from './graphql';

import UI from './ui';

const CACHE_CONTROL = `s-maxage=${60 * 60 * 24 * 90}, stale-while-revalidate`;

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

async function cacheData(user, repos) {
  try {
    const res = await fetch(`/octolife-api/cache?user=${user.login}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ user, repos }),
    });
    console.log(`Cache: ${JSON.stringify(await res.json())}`);
    // this call is to force Zeit to cache the api call
    getCacheData(user.login);
  } catch (err) {
    console.log(err);
  }
}

async function getCacheData(username) {
  try {
    const res = await fetch(`/octolife-api/cache?user=${username}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': CACHE_CONTROL,
      },
    });
    const d = await res.json();
    if (d.data) {
      return d.data;
    }
    return false;
  } catch (err) {
    return false;
  }
}

window.addEventListener('load', async function() {
  const {
    renderLoading,
    renderLoader,
    renderProfileRequiredForm,
    renderReport,
    renderTokenRequiredForm,
  } = UI();
  const profileNameFromTheURL = parse(window.location.href)
    .path.replace(/^\//, '')
    .split('/')
    .shift();
  const token = localStorage.getItem('OCTOLIFE_GH_TOKEN');
  setToken(token);

  async function useCacheData(profileName) {
    renderLoading(`⌛ Loading. Please wait.`);
    const cachedData = await getCacheData(profileName);
    if (cachedData && cachedData.user && cachedData.repos) {
      renderReport(cachedData.user, cachedData.repos);
      return true;
    }
    return false;
  }
  async function fetchProfile(profileName) {
    if (!token) {
      renderTokenRequiredForm(profileName);
      return;
    }
    const log = renderLoader();
    log('⌛ Getting profile information ...');
    const user = await getUser(profileName);
    if (user === null) {
      renderProfileRequiredForm(
        fetchProfile,
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
      cacheData(user, repos);
      renderReport(user, repos);
    }
  }

  if (profileNameFromTheURL !== '') {
    if (await useCacheData(profileNameFromTheURL)) {
      return;
    }
    fetchProfile(profileNameFromTheURL);
  } else {
    renderProfileRequiredForm(async profileName => {
      if (await useCacheData(profileName)) {
        return;
      }
      fetchProfile(profileName);
    });
  }
});
