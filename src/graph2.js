/* eslint-disable no-shadow, @typescript-eslint/no-use-before-define, no-param-reassign */
function diffInDays(date1, date2) {
  const diffTime = Math.abs(date2 - date1);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}
function normalizeDate(str) {
  const d = new Date(str);
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

/*
2008-1-3
2008-1-4
2008-1-7
2008-1-8
2008-1-10
*/

export default function graph(user, repos) {
  // const normalizedRepos = repos.slice(0, 1).map(repo => {
  const normalizedRepos = repos.map(repo => {
    const ranges = [];
    const commitDates = Object.keys(
      repo.commits.reduce((r, d) => {
        const normalizedDate = normalizeDate(d);
        r[normalizedDate] = true;
        return r;
      }, {})
    )
      .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
      .map(d => new Date(d));
    let cursor = commitDates.shift();
    let rangeStart = cursor;

    commitDates.forEach(d => {
      if (diffInDays(d, cursor) > 1) {
        ranges.push({
          range: [normalizeDate(rangeStart), normalizeDate(cursor)],
          diff: diffInDays(cursor, rangeStart),
        });
        rangeStart = d;
      }
      cursor = d;
    });

    return {
      label: repo.name,
      data: ranges.map(r => ({ timeRange: r.range, val: `${r.diff} days` })),
    };
  });

  const graphData = [
    {
      group: 'Repos',
      data: normalizedRepos,
    },
  ];
  TimelinesChart()(document.body)
    .zScaleLabel('My Scale Units')
    .zQualitative(true)
    .maxHeight(repos.length * 20)
    .maxLineHeight(20)
    .data(graphData);

  setTimeout(() => {
    document.querySelector('.legend').setAttribute('style', 'display: none');
  }, 10);
}
