/* eslint-disable no-shadow, @typescript-eslint/no-use-before-define, no-param-reassign */
function normalizeDate(str) {
  const d = new Date(str);
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

export default function graph(user, repos) {
  repos = repos.map(repo => {
    const data = [];
    const commitDates = repo.commits.reduce((res, dateStr) => {
      const normalizedDate = normalizeDate(dateStr);
      if (!res) res[normalizedDate] = 0;
      res[normalizedDate] += 1;
      return res;
    }, {});
    console.log(commitDates);

    return {
      label: repo.name,
    };
  });

  // console.log(repos);

  // const graphData = [
  //   {
  //     group: 'Repos',
  //     data: [
  //       {
  //         label: 'react-in-patterns',
  //         data: [
  //           {
  //             timeRange: [new Date('2008-1-1'), new Date('2008-1-3')],
  //           },
  //         ],
  //       },
  //       {
  //         label: 'EventBus',
  //         data: [
  //           {
  //             timeRange: [new Date('2008-1-1'), new Date('2008-1-10')],
  //           },
  //           {
  //             timeRange: [new Date('2008-2-9'), new Date('2008-2-18')],
  //           },
  //         ],
  //       },
  //     ],
  //   },
  // ];
  // TimelinesChart()(document.body)
  //   .zScaleLabel('My Scale Units')
  //   .zQualitative(true)
  //   .data(graphData);

  // setTimeout(() => {
  //   document.querySelector('.legend').setAttribute('style', 'display: none');
  // }, 10);
}
