const fetch = require('node-fetch');
const token = require('fs').readFileSync(__dirname + '/token').toString('utf8');

const endpointGraphQL = 'https://api.github.com/graphql';
const getHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: 'token ' + token
});

const requestGraphQL = async function(query, customHeaders = {}) {
  const res = await fetch(endpointGraphQL, {
    headers: Object.assign({}, getHeaders(), customHeaders),
    method: 'POST',
    body: JSON.stringify({ query })
  });

  if (!res.ok) {
    throw new Error(res.status + ' ' + res.statusText);
  }
  const resultData = await res.json();

  if (resultData.errors) {
    console.warn('There are errors while requesting ' + endpointGraphQL);
    console.warn(resultData.errors.map(({ message }) => message));
  }
  return resultData;
};

module.exports = {
  requestGraphQL
}