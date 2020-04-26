// Lib: https://github.com/vasturiano/timelines-chart
import { formatPlural } from './utils';

export default function graph(normalizedRepos, repos, domEl) {
  domEl.innerHTML = `
  <p class="tac m0 o05"><small>${formatPlural(
    normalizedRepos.length,
    'repo'
  )}, ${formatPlural(
    normalizedRepos.reduce((res, repo) => res + repo.totalNumOfCommits, 0),
    'commit'
  )}</small></p>`;
  TimelinesChart()(domEl)
    .zScaleLabel('units')
    .width(window.innerWidth - 100)
    .leftMargin(200)
    .rightMargin(10)
    .zQualitative(true)
    .maxLineHeight(20)
    .timeFormat('%Y-%m-%d')
    .maxHeight(repos.length * 24)
    .zColorScale(
      d3.scaleOrdinal(
        repos.map(r => r.name),
        repos.map(r => `#000`)
      )
    )
    .data(normalizedRepos);

  setTimeout(() => {
    document.querySelector('.legend').setAttribute('style', 'display: none');
  }, 10);
}
