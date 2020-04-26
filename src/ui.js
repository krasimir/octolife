/* eslint-disable no-shadow, @typescript-eslint/no-use-before-define, no-param-reassign */
import graph from './graph';
import graph2 from './graph2';
import { normalizeData, getLocalData, diffInDays } from './data';

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

function renderReport(user, repos) {
  localStorage.setItem('OCTOLIFE_GH_DATA', JSON.stringify({ user, repos }));
  history.pushState({}, `Octolife / ${user.name}`, `/${user.login}`);
  $('#root').innerHTML = `
    <div class="report">
      <header>
        <h1 class="mt2">
          <a href="/">Oct<img src="/public/github.png" alt="github" />life</a>
        </h1>
        <a href="/">New Report</a>
      </header>
      <section class="user">
        <h2><img src="${user.avatarUrl}" alt="${user.name}"/>${user.name}</h2>
      </section>
      <section class="grid3">
        <div>
          <ul>
            <li><strong>Age: ${Math.ceil(
              diffInDays(new Date(), new Date(user.createdAt)) / 365
            )}</strong></li>
          </ul>
        </div>
      </section>
      <div id="graph"></div>
    </div>
  `;
  if (repos.length > 1) {
    graph2(normalizeData(repos), repos, $('#graph'));
  }
}

export default function UI() {
  return {
    renderTokenForm,
    renderForm,
    renderLoader,
    renderReport,
  };
}
