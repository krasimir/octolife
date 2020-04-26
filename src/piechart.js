/* eslint-disable @typescript-eslint/no-use-before-define */

export default function piechart(data, domEl) {
  const width = 300;
  const height = 300;
  const radius = Math.min(width, height) / 2;

  const color = d3.scaleOrdinal(d3.schemeCategory10);

  const pie = d3
    .pie()
    .value(function(d) {
      return d.value;
    })
    .sort(function(a, b) {
      return b.value - a.value;
    });

  const arc = d3
    .arc()
    .innerRadius(radius - 100)
    .outerRadius(radius - 20);

  const svg = d3
    .select(domEl)
    .append('svg')
    .attr('width', width)
    .attr('height', height)
    .append('g')
    .attr('transform', `translate(${width / 2},${height / 2})`);

  let path = svg
    .datum(data)
    .selectAll('path')
    .data(pie)
    .enter()
    .append('path')
    .attr('fill', function(d, i) {
      return d.data.color;
    })
    .attr('d', arc)
    .each(function(d) {
      this._current = d.value;
    }); // store the initial angles

  d3.selectAll('input').on('change', change);

  const timeout = setTimeout(function() {
    d3.select('input[value="oranges"]')
      .property('checked', true)
      .each(change);
  }, 2000);

  function change() {
    const { value } = this;
    clearTimeout(timeout);
    pie.value(function(d) {
      return d[value];
    }); // change the value function
    path = path.data(pie); // compute the new angles
    path
      .transition()
      .duration(750)
      .attrTween('d', arcTween); // redraw the arcs
  }

  function type(d) {
    d.apples = +d.apples;
    d.oranges = +d.oranges;
    return d;
  }

  // Store the displayed angles in _current.
  // Then, interpolate from _current to the new angles.
  // During the transition, _current is updated in-place by d3.interpolate.
  function arcTween(a) {
    const i = d3.interpolate(this._current, a);
    this._current = i(0);
    return function(t) {
      return arc(i(t));
    };
  }
}
