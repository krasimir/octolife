/* eslint-disable no-shadow, @typescript-eslint/no-use-before-define, no-param-reassign */
import timeline from './timeline';
import piechart from './piechart';
import {
  normalizeData,
  getLocalData,
  getTotalNumOfStars,
  getLanguages,
} from './data';
import { getAge, formatPlural, formatHour } from './utils';

const $ = sel => document.querySelector(sel);
const weekDaysMap = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

function renderHeader() {
  return `
    <h1 class="mt1">Oct<img src="/public/github.png" />life</h1>
    <h2 class="mt05">Your (public) life on GitHub</h2>
  `;
}

function renderTokenRequiredForm(profileNameFromTheURL) {
  $('#root').innerHTML = `
    <div class="form">
      ${renderHeader()}
      <hr />
      <p class="mt2">
        <a href="/octolife-api/token?redirect=/octolife-api/authorized/${profileNameFromTheURL}" class="authorize">Authorize Octolife GitHub app<br />to see the report</a> 
      </p>
      ${renderLocalStorageData()}
    </div>
  `;
}

function renderProfileRequiredForm(profileNameProvided, message) {
  $('#root').innerHTML = `
    <div class="form">
      ${renderHeader()}
      <hr />
      ${message ? `<p class="mt2">${message}</p>` : ''}
      <p class="mt2">
        <input type="text" placeholder="github profile" id="github-profile"/>
        <span class="mt05 block"><small>Enter a GitHub profile name and hit <em>Enter</em>.</small></span>
      </p>
      ${renderLocalStorageData()}
    </div>
  `;
  const input = $('#github-profile');
  input.addEventListener('keyup', function(e) {
    if (e.keyCode === 13) {
      const token = input.value;
      if (token === '') {
        input.style['outline-color'] = 'red';
      } else {
        profileNameProvided(token);
      }
    }
  });
  setTimeout(() => {
    input.focus();
  }, 20);
}

function renderLoader() {
  $('#root').innerHTML = `
    <div class="form">
      ${renderHeader()}
      <hr />
      <p class="mt2" id="loader-content"></p>
    </div>
  `;
  const content = $('#loader-content');
  const logs = [];
  return (str, replaceLastLog = false) => {
    if (!replaceLastLog) {
      logs.push(str);
    } else {
      logs[logs.length - 1] = str;
    }
    content.innerHTML = logs.map(s => `<div>${s}</div>`).join('');
  };
}

function renderLocalStorageData() {
  const data = getLocalData();
  setTimeout(() => {
    if ($('#show-localstorage-data')) {
      $('#show-localstorage-data').addEventListener('click', () => {
        renderReport(data.user, data.repos);
      });
    }
    const showDemoData = $('#show-demo-data');
    showDemoData.addEventListener('click', async () => {
      const newNode = document.createElement('small');
      newNode.innerHTML = '⏳';
      showDemoData.parentNode.replaceChild(newNode, showDemoData);
      try {
        const demoData = await (await fetch('/public/demo.json')).json();
        renderReport(demoData.user, demoData.repos);
      } catch (err) {
        newNode.innerHTML = 'Ops! Error loading the demo data.';
      }
    });
  }, 20);
  return `
    <p class="mt2">
      ${
        data
          ? `🌟 It looks like you've already did a search here for <strong>${data.user.name}</strong>? Click <a href="javascript:void(0)" id="show-localstorage-data">here</a> to see the report again.<br /><br />`
          : ''
      }
      🤔 Wondering how the Octolife report looks like? Click <a href="javascript:void(0)" id="show-demo-data">here</a> to see one.
    </p>
  `;
}

function renderReport(user, repos) {
  localStorage.setItem('OCTOLIFE_GH_DATA', JSON.stringify({ user, repos }));
  history.pushState({}, `Octolife / ${user.name}`, `/${user.login}`);

  const languages = getLanguages(repos).sort((a, b) => b.value - a.value);
  const languagesTotal = languages.reduce((res, lang) => res + lang.value, 0);
  const years = repos
    .reduce((res, repo) => {
      repo.commits.forEach(commitDate => {
        const year = new Date(commitDate).getFullYear();
        if (!res.includes(year)) res.push(year);
      });
      return res;
    }, [])
    .sort((a, b) => a - b);
  const weekDays = repos.reduce((res, repo) => {
    repo.commits.forEach(commit => {
      const day = weekDaysMap[new Date(commit).getDay()];
      if (typeof res[day] === 'undefined') res[day] = 0;
      res[day] += 1;
    });
    return res;
  }, {});
  const weekDaysTotal = weekDaysMap.reduce(
    (res, day) => res + (weekDays[day] || 0),
    0
  );
  const hours = repos.reduce((res, repo) => {
    repo.commits.forEach(commit => {
      const hour = new Date(commit).getHours();
      if (typeof res[hour] === 'undefined') res[hour] = 0;
      res[hour] += 1;
    });
    return res;
  }, {});
  const hoursTotal = Object.keys(hours).reduce(
    (res, hour) => res + (hours[hour] || 0),
    0
  );

  $('#root').innerHTML = `
    <div class="report">
      <header>
        <h1>
          <a href="/">Oct<img src="/public/github.png" alt="github" />life</a>
        </h1>
        <a href="/" class="block right">New Report</a>
      </header>
      <section class="user mb2 clear">
        <h2><img src="${user.avatarUrl}" alt="${user.name}"/>${user.name}</h2>
        <p class="tac mt1"><span class="emoji">🌟</span> ${formatPlural(
          getTotalNumOfStars(repos),
          'star'
        )}</p>
      </section>
      <section class="grid2 mt1">
        <div>
          <ul>
            <li><strong>@GitHub:</strong> <a href="${
              user.url
            }" target="_blank">${user.url}</a></li>
            ${
              user.websiteUrl
                ? `<li><strong>@Web:</strong> <a href="${user.websiteUrl}" target="_blank">${user.websiteUrl}</a></li>`
                : ''
            }
            <li><strong>Age:</strong> ${getAge(user.createdAt)}</li>
            ${
              user.location
                ? `<li><strong>Location</strong>: ${user.location}</li>`
                : ''
            }
            ${
              user.company
                ? `<li><strong>Location</strong>: ${user.company}</li>`
                : ''
            }
            <li><strong>Repositories:</strong> ${repos.length}</li>
            <li><strong>Followers:</strong> ${user.followers.totalCount}</li>
          </ul>
        </div>
        <div>
          ${user.bio ? `<p>“<em>${user.bio}</em>”</p>` : ''}
          ${
            user.pinnedRepositories && user.pinnedRepositories.nodes.length > 0
              ? `<p>Pins: ${user.pinnedRepositories.nodes
                  .map(
                    r =>
                      `<a href="${r.url}" target="_blank">${r.name}(★${r.stargazers.totalCount})</a>`
                  )
                  .join(', ')}</p>`
              : ''
          }
        </div>
      </section>
      <hr />
      <section class="lines">
        <div class="grid2">
          <div>
            <div id="piechart"></div>
          </div>
          <div>${languages
            .map(lang => {
              const percent = ((lang.value / languagesTotal) * 100).toFixed(1);
              return `<div class="lang-item">
                    <span style="background:${lang.color};width:${percent *
                5}px">&nbsp;</span>
                    <small>${percent}% ${lang.name}</small>
                  </div>`;
            })
            .join('')}</div>
        </div>
      </section>
      <hr />
      <h3 class="mb1">Time</h3>
      <section class="lines">
        <div class="grid2">
          <div>${weekDaysMap
            .map(day => {
              const perc = ((weekDays[day] / weekDaysTotal) * 100).toFixed(1);
              return `<div class="lang-item">
                    <span style="background:#636363;width:${perc *
                      5}px">&nbsp;</span>
                    <small class="o05">${perc}%</small>&nbsp;&nbsp;&nbsp;${day}
                  </div>`;
            })
            .join('')}</div>
          <div>
          ${Object.keys(hours)
            .map(hour => {
              const perc = ((hours[hour] / hoursTotal) * 100).toFixed(1);
              return `<div class="lang-item">
                    <span style="background:#636363;width:${perc *
                      5}px">&nbsp;</span>
                    <small class="o05">${perc}%</small>&nbsp;&nbsp;&nbsp;${formatHour(
                hour
              )}
                  </div>`;
            })
            .join('')}
          </div>
        </div>
      </section>
      <hr />
      <h3>Timeline (commit history)</h3>
      <div class="my1">
        <select id="timeline-mode">
          <option value="all">All data</option>
          ${years
            .map(year => `<option value="year${year}">${year}</option>`)
            .join('')}
          ${languages
            .map(l => `<option value="language_${l.name}">${l.name}</option>`)
            .join('')}
        </select>
      </div>
      <div id="timeline"></div>
      <hr />
      <h3>Repositories</h3>
      <section class="mt2">
        ${repos
          .sort((a, b) => b.stargazers.totalCount - a.stargazers.totalCount)
          .map(repo => {
            const props = [
              `${formatPlural(repo.stargazers.totalCount, 'star')}`,
              `${getAge(repo.createdAt)}`,
              `${formatPlural(repo.commits.length, 'commit')}`,
              `${(repo.diskUsage / 1000).toFixed(2)}MB`,
            ];
            const url = `https://github.com/${user.login}/${repo.name}`;
            return `
            <div class="grid2 bordered mb1">
              <div>
                <h4>
                <a href="${url}" target="_blank">${repo.name}</a>
                </h4>
                <small>${props.join(', ')}</small><br />
                <small>Languages: ${repo.languages.nodes
                  .map(l => l.name)
                  .join(',')}</small>
              </div>
              <div>
                <ul>
                  ${
                    repo.descriptionHTML
                      ? `<li><small>${repo.descriptionHTML}</small></li>`
                      : ''
                  }
                  ${
                    repo.homepageUrl
                      ? `<li><small><a href="${repo.homepageUrl}" target="_blank">${repo.homepageUrl}</a></small></li>`
                      : ''
                  }
                </ul>
              </div>
            </div>
          `;
          })
          .join('')}
      </section>
    </div>
  `;
  if (repos.length > 1) {
    timeline(normalizeData(repos), repos, $('#timeline'));
    $('#timeline-mode').addEventListener('change', () => {
      const mode = $('#timeline-mode').value;
      timeline(normalizeData(repos, mode), repos, $('#timeline'));
    });
  } else {
    $('#timeline-mode').style.display = 'none';
  }
  piechart(languages, $('#piechart'));
}

export default function UI() {
  return {
    renderTokenRequiredForm,
    renderProfileRequiredForm,
    renderLoader,
    renderReport,
  };
}
