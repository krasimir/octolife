/* eslint-disable no-shadow, @typescript-eslint/no-use-before-define, no-param-reassign */
import timeline from './timeline';
import piechart from './piechart';
import {
  normalizeData,
  getLocalData,
  getTotalNumOfStars,
  getLanguages,
} from './data';
import { diffInDays, formatPlural } from './utils';

const $ = sel => document.querySelector(sel);
const logs = [];

function renderHeader() {
  return `
    <h1 class="mt2">Oct<img src="/public/github.png" alt="github" />life</h1>
    <h2 class="mt05">A page that shows your (public) life at GitHub</h2>
  `;
}

function renderTokenForm(tokenProvided) {
  $('#root').innerHTML = `
    <div class="form">
      ${renderHeader()}
      <hr />
      <p class="mt2">
        <a href="/octolife-api/token?redirect=/octolife-api/authorized" class="authorize">Authorize Octolife GitHub application</a> 
      </p>
      <hr />
      <p>Octolife is using GitHub's API to access profiles. In order to do that it needs an <a href="https://developer.github.com/v4/guides/forming-calls/#authenticating-with-graphql" target="_blank">access token</a>. There're just too many requests to be made and the no-token access has a request limit.<br /><br />Once you authorize Octolife App and fetch the token it gets saved in your browser's <a href="https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage" target="_blank">localStorage</a> so you can trigger multiple searches. The token persist only on your machine.<br /><br /><small>The code of this app is open source and available <a href="https://github.com/krasimir/octolife" target="_blank">here</a> in case you want to verify that.</small></p>
      <hr />
      ${renderLocalStorageData()}
    </div>
  `;
}

function renderForm(profileNameProvided, message) {
  $('#root').innerHTML = `
    <div class="form">
      ${renderHeader()}
      <hr />
      ${message ? `<p class="mt2">${message}</p>` : ''}
      <p class="mt2">
        <input type="text" placeholder="github profile" id="github-profile"/>
        <span class="mt05 block">Enter a GitHub profile name and hit <em>Enter</em>.</span>
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
    $('#show-localstorage-data').addEventListener('click', () => {
      renderReport(data.user, data.repos);
    });
    $('#show-demo-data').addEventListener('click', () => {
      console.log('Not implemented');
    });
  }, 20);
  return `
    <hr />
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

function renderFooter() {
  return `
    <footer class="tac">
      Octolife
    </footer>
  `;
}

function renderReport(user, repos) {
  localStorage.setItem('OCTOLIFE_GH_DATA', JSON.stringify({ user, repos }));
  history.pushState({}, `Octolife / ${user.name}`, `/${user.login}`);

  const languages = getLanguages(repos).sort((a, b) => b.value - a.value);
  const languagesTotal = languages.reduce((res, lang) => res + lang.value, 0);
  const numberOfCommits = repos.reduce(
    (res, repo) => res + repo.commits.length,
    0
  );

  $('#root').innerHTML = `
    <div class="report">
      <header>
        <h1>
          <a href="/">Oct<img src="/public/github.png" alt="github" />life</a>
        </h1>
        <a href="/">New Report</a>
      </header>
      <section class="user mb2">
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
            <li><strong>Age:</strong> ${formatPlural(
              Math.ceil(diffInDays(new Date(), new Date(user.createdAt)) / 365),
              'year'
            )}</li>
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
            <li><strong>Commits:</strong> ${numberOfCommits}</li>
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
      <section class="languages">
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
      <h3>Timeline (commit history)</h3>
      <div id="timeline"></div>
      <hr />
      <h3>Repositories</h3>
      <section class="mt2">
        ${repos
          .sort((a, b) => b.stargazers.totalCount - a.stargazers.totalCount)
          .map(repo => {
            console.log(repo);
            return `
            <div class="grid2">
              <div><a href="https://github.com/${user.login}/${repo.name}" target="_blank">${repo.name}</a></div>
              <div>★${repo.stargazers.totalCount}</div>
            </div>
          `;
          })}
      </section>
      <hr />
      ${renderFooter()}
    </div>
  `;
  if (repos.length > 1) {
    timeline(normalizeData(repos), repos, $('#timeline'));
  }
  piechart(languages, $('#piechart'));
}

export default function UI() {
  return {
    renderTokenForm,
    renderForm,
    renderLoader,
    renderReport,
  };
}
