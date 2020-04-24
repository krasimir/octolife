import graph from './graph';

const $ = (sel:string) => document.querySelector(sel);
const logs: string[] = [];

function getData() {
  const data = localStorage.getItem('OCTOLIFE_GH_DATA');
  if (data) {
    try {
      return JSON.parse(data);
    } catch(err) {
      return null;
    }
  }
  return null;
}

function renderForm(renderGraph: Function) {
  const root = $('#root');
  const token = localStorage.getItem('OCTOLIFE_GH_TOKEN');
  const data = getData();

  if (root) {
    root.innerHTML = `
      <div>
        <input type="text" value="${token && token !== 'undefined' && token !== 'null' ? token : ''}">
        <button id="go">Go</button>
        ${data ? `<button id="use">use already fetched data for ${data.user.name}</button>` : ''}
      </div>
    `;
  }

  const goButton = $('#go');
  const useButton = $('#use');
  if (goButton) {
    goButton.addEventListener('click', () => {
      const password = $('[type="text"]');
      if (password) {
        localStorage.setItem('OCTOLIFE_GH_TOKEN', String(password.value));
        renderGraph(password.value);
      }
    });
  }
  if (useButton) {
    useButton.addEventListener('click', () => {
      drawGraph(data.user, data.repos);
    });
  }
}

function log(str:any, replaceLastLog = false) {
  let logger = $('#logger');
  if (!logger) {
    const root = $('#root');
    if (root) {
      root.innerHTML = `
        <div id="logger"></div>
      `;
      logger = $('#logger');
    }
  }
  if (!replaceLastLog) {
    logs.push(str);
  } else {
    logs[logs.length-1] = str;
  }
  if (logger) {
    logger.innerHTML = logs.map(s => `<div>${s}</div>`).join('');
  }
}

function drawGraph(user: Object, repos: any[]) {
  localStorage.setItem('OCTOLIFE_GH_DATA', JSON.stringify({ user, repos }));
  graph(user, repos);
}

export default function UI() {
  return {
    renderForm,
    log,
    drawGraph
  }
}