/* eslint-disable no-shadow, @typescript-eslint/no-use-before-define, no-param-reassign */
const $ = sel => document.querySelector(sel);
const margin = { top: 20, right: 20, bottom: 30, left: 30 };
const width = window.innerWidth - 100;
const height = (window.innerHeight / 3) * 2;

function chart(data) {
  const svg = d3
    .create('svg')
    .attr('viewBox', [0, 0, width, height])
    .style('overflow', 'hidden');

  const x = d3
    .scaleUtc()
    .domain(d3.extent(data.dates))
    .range([margin.left, width - margin.right]);

  const y = d3
    .scaleLinear()
    .domain([0, d3.max(data.series, d => d3.max(d.values))])
    .nice()
    .range([height - margin.bottom, margin.top]);

  const xAxis = g =>
    g.attr('transform', `translate(0,${height - margin.bottom})`).call(
      d3
        .axisBottom(x)
        .ticks(width / 80)
        .tickSizeOuter(0)
    );

  const yAxis = g =>
    g
      .attr('transform', `translate(${margin.left},0)`)
      .call(d3.axisLeft(y))
      .call(g => g.select('.domain').remove())
      .call(g =>
        g
          .select('.tick:last-of-type text')
          .clone()
          .attr('x', 3)
          .attr('text-anchor', 'start')
          .attr('font-weight', 'bold')
          .text(data.y)
      );
  const line = d3
    .line()
    .defined(d => !isNaN(d))
    .x((d, i) => x(data.dates[i]))
    .y(d => y(d));

  svg.append('g').call(xAxis);

  svg.append('g').call(yAxis);

  const path = svg
    .append('g')
    .attr('fill', 'none')
    .attr('stroke', 'steelblue')
    .attr('stroke-width', 1.5)
    .attr('stroke-linejoin', 'round')
    .attr('stroke-linecap', 'round')
    .selectAll('path')
    .data(data.series)
    .join('path')
    .style('mix-blend-mode', 'multiply')
    .attr('d', d => line(d.values));

  svg.call(hover, path);

  function hover(svg, path) {
    svg
      .on('mousemove', moved)
      .on('mouseenter', entered)
      .on('mouseleave', left);

    const dot = svg.append('g').attr('display', 'none');

    dot.append('circle').attr('r', 2.5);

    dot
      .append('text')
      .attr('font-family', 'sans-serif')
      .attr('font-size', 10)
      .attr('text-anchor', 'middle')
      .attr('y', -8);

    function moved() {
      d3.event.preventDefault();
      const ym = y.invert(d3.event.layerY);
      const xm = x.invert(d3.event.layerX);
      const i1 = d3.bisectLeft(data.dates, xm, 1);
      const i0 = i1 - 1;
      const i = xm - data.dates[i0] > data.dates[i1] - xm ? i1 : i0;
      const s = d3.least(data.series, d => Math.abs(d.values[i] - ym));
      path
        .attr('stroke', d => (d === s ? null : '#ddd'))
        .filter(d => d === s)
        .raise();
      dot.attr('transform', `translate(${x(data.dates[i])},${y(s.values[i])})`);
      dot.select('text').text(s.name);
    }

    function entered() {
      path.style('mix-blend-mode', null).attr('stroke', '#ddd');
      dot.attr('display', null);
    }

    function left() {
      path.style('mix-blend-mode', 'multiply').attr('stroke', null);
      dot.attr('display', 'none');
    }
  }

  return svg.node();
}

function normalizeDate(str) {
  const d = new Date(str);
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

export default function graph(user, repos) {
  const root = $('#root');
  const allDates = {};

  // normalizing the dates of the repos
  repos = repos.map(repo => {
    const values = repo.commits.reduce((res, commitDateStr) => {
      const commitNormalizedDateStr = normalizeDate(commitDateStr);
      allDates[commitNormalizedDateStr] = true;
      if (!res[commitNormalizedDateStr]) res[commitNormalizedDateStr] = 0;
      res[commitNormalizedDateStr] += 1;
      return res;
    }, {});
    return {
      name: repo.name,
      values,
    };
  });

  // generating all dates values (sorted)
  const dates = Object.keys(allDates).sort(
    (a, b) => new Date(a).getTime() - new Date(b).getTime()
  );

  const series = repos.map(repo => {
    const { name } = repo;
    const values = dates.map(dateStr =>
      repo.values[dateStr] ? repo.values[dateStr] : 0
    );
    return { name, values };
  });

  const graphData = {
    y: 'Number of commits',
    series,
    dates: dates.map(dStr => new Date(dStr)),
  };

  if (root) {
    root.innerHTML = '';
    root.appendChild(chart(graphData));
  }
}
