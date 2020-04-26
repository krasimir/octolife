// Lib: https://github.com/vasturiano/timelines-chart

export default function graph(normalizedRepos, repos, domEl) {
  domEl.innerHTML = '';
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
