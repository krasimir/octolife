/* eslint-disable no-shadow, @typescript-eslint/no-use-before-define, no-param-reassign */
import { diffInDays } from './utils';

function normalizeDate(str) {
  const d = new Date(str);
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

export function getLocalData() {
  const data = localStorage.getItem('OCTOLIFE_GH_DATA');
  if (data) {
    try {
      return JSON.parse(data);
    } catch (err) {
      return null;
    }
  }
  return null;
}

export function getTotalNumOfStars(repos) {
  return repos.reduce((res, repo) => res + repo.stargazers.totalCount, 0);
}

export function getLanguages(repos) {
  return repos.reduce((res, repo) => {
    repo.languages.nodes.forEach(lang => {
      const entry = res.find(e => e.name === lang.name);
      if (entry) {
        entry.value += 1;
      } else {
        res.push({
          name: lang.name,
          color: lang.color,
          value: 1,
        });
      }
    });
    return res;
  }, []);
}

export function normalizeData(repos, mode = 'all') {
  let filterByYear = null;
  let filterByLanguage = null;

  if (mode.match(/^year/)) {
    filterByYear = Number(mode.replace('year', ''));
  } else if (mode.match(/^language_/)) {
    filterByLanguage = mode.replace('language_', '');
  }

  const normalizedRepos = repos
    .map(repo => {
      if (repo.commits.length === 0) return false;
      if (
        filterByLanguage &&
        !repo.languages.nodes.find(l => l.name === filterByLanguage)
      ) {
        return false;
      }
      const ranges = [];
      const normalizedDates = repo.commits.reduce((r, d) => {
        const normalizedDate = normalizeDate(d);
        if (!r[normalizedDate]) r[normalizedDate] = 0;
        r[normalizedDate] += 1;
        return r;
      }, {});
      let commitDates = Object.keys(normalizedDates)
        .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
        .map(d => new Date(d));

      if (filterByYear) {
        commitDates = commitDates.filter(d => d.getFullYear() === filterByYear);
      }
      if (commitDates.length === 0) return false;

      let cursor = commitDates.shift();
      let rangeStart = cursor;
      const totalNumOfCommits = Object.keys(normalizedDates).reduce(
        (sum, dateStr) => sum + normalizedDates[dateStr],
        0
      );

      commitDates.forEach(d => {
        if (diffInDays(d, cursor) > 0) {
          ranges.push({
            timeRange: [normalizeDate(rangeStart), normalizeDate(cursor)],
            val: repo.name,
          });
          rangeStart = d;
        }
        cursor = d;
      });

      ranges.push({
        timeRange: [normalizeDate(rangeStart), normalizeDate(cursor)],
        val: repo.name,
      });

      return {
        totalNumOfCommits,
        group: repo.name,
        data: [{ label: '', data: ranges }],
      };
    })
    .filter(v => v)
    .sort((a, b) => b.totalNumOfCommits - a.totalNumOfCommits);
  return normalizedRepos;
}
