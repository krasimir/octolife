/* eslint-disable no-shadow, @typescript-eslint/no-use-before-define, no-param-reassign */
import graph from './graph';
import graph2 from './graph2';
import normalizeRepos from './data';

const $ = sel => document.querySelector(sel);
const logs = [];

function getData() {
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
        <input type="text" placeholder="enter your access token here and press enter" id="access-token"/>
        <span class="mt05 block">You don't have a token? Click <a href="javascript:void(0)" id="how-to-get-token-link">here</a> to learn how to generate it.</span>
        <small class="mt05 inline" id="how-to-get-token"></small>
      </p>
      <hr />
      <p>Octolife is using <a href="https://developer.github.com/v4/" target="_blank">GitHub's API</a> to access profiles. In order to do that it needs an <a href="https://help.github.com/en/github/authenticating-to-github/creating-a-personal-access-token-for-the-command-line" target="_blank">access token</a>. There're just too many requests to be made and the no-token access has a low request limit.<br /><br />Once you enter the token for convenience it gets saved in your browser's <a href="https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage" target="_blank">localStorage</a> so you can trigger multiple searches. It's important to understand that the token persist only on your machine. The code of this app is open source and available <a href="https://github.com/krasimir/octolife" target="_blank">here</a> in case you want to verify that.</p>
      <hr />
      ${renderLocalStorageData()}
    </div>
  `;
  $('#how-to-get-token-link').addEventListener('click', function(e) {
    $('#how-to-get-token').style.display = 'block';
    $('#how-to-get-token').innerHTML = `
      Go to <a href="https://github.com/settings/tokens" target="_blank">this page</a> 👉 Click on "Personal access tokens" 👉 Click on "Generate new token" 👉 The name of the token is not important. That's only for your discoverability. You don't need to set any permissions.
    `;
  });
  $('#access-token').addEventListener('keyup', function(e) {
    if (e.keyCode === 13) {
      const token = $('#access-token').value;
      if (token === '') {
        $('#access-token').style['outline-color'] = 'red';
      } else {
        tokenProvided(token);
      }
    }
  });
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
  const data = getData();
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
          ? `🌟 It looks like you've already did a search here for ${data.user.name}? Click <a href="javascript:void(0)" id="show-localstorage-data">here</a> to see the report again.<br /><br />`
          : ''
      }
      🤔 Wondering how the Octolife report looks like? Click <a href="javascript:void(0)" id="show-demo-data">here</a> to see one.
    </p>
  `;
}

function renderReport(user, repos) {
  localStorage.setItem('OCTOLIFE_GH_DATA', JSON.stringify({ user, repos }));
  $('#root').innerHTML = `
    <div class="report">
      <header>
        <h1 class="mt2">Oct<img src="/public/github.png" alt="github" />life</h1>
        <a href="/">New Report</a>
      </header>
      <section class="user">
        <h2>${user.name}</h2>
      </section>
      <div id="graph"></div>
    </div>
  `;
  if (repos.length > 1) {
    graph2(normalizeRepos(repos), repos, $('#graph'));
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
