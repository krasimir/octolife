/* eslint-disable no-shadow, @typescript-eslint/no-use-before-define, no-param-reassign */
function diffInDays(date1, date2) {
  const diffTime = Math.abs(date2 - date1);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}
function normalizeDate(str) {
  const d = new Date(str);
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

export default function graph(user, repos) {
  const normalizedRepos = repos
    .map(repo => {
      const ranges = [];
      const normalizedDates = repo.commits.reduce((r, d) => {
        const normalizedDate = normalizeDate(d);
        if (!r[normalizedDate]) r[normalizedDate] = 0;
        r[normalizedDate] += 1;
        return r;
      }, {});
      const commitDates = Object.keys(normalizedDates)
        .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
        .map(d => new Date(d));
      let cursor = commitDates.shift();
      let rangeStart = cursor;

      const totalNumOfCommits = Object.keys(normalizedDates).reduce(
        (sum, dateStr) => sum + normalizedDates[dateStr],
        0
      );

      commitDates.forEach(d => {
        if (diffInDays(d, cursor) > 1) {
          ranges.push({
            timeRange: [normalizeDate(rangeStart), normalizeDate(cursor)],
            val: repo.name,
          });
          rangeStart = d;
        }
        cursor = d;
      });

      return {
        totalNumOfCommits,
        group: repo.name,
        data: [{ label: 'commits', data: ranges }],
      };
    })
    .sort((a, b) => b.totalNumOfCommits - a.totalNumOfCommits);

  TimelinesChart()(document.body)
    .zScaleLabel('units')
    .width(window.innerWidth - 100)
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
