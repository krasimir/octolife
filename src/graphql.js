let token = '';
const endpointGraphQL = 'https://api.github.com/graphql';
const getHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `token ${token}`,
});

export const setToken = t => (token = t);

export const requestGraphQL = async function(query, customHeaders = {}) {
  try {
    const res = await fetch(endpointGraphQL, {
      headers: Object.assign({}, getHeaders(), customHeaders),
      method: 'POST',
      body: JSON.stringify({ query }),
    });

    if (!res.ok) {
      throw new Error(`${res.status} ${res.statusText}`);
    }
    // console.log(`Rate limit remaining: ${res.headers.get('x-ratelimit-remaining')}`);
    const resultData = await res.json();

    if (resultData.errors) {
      console.warn(`There are errors while requesting ${endpointGraphQL}`);
      console.warn(resultData.errors.map(({ message }) => message));
    }
    return resultData;
  } catch (err) {
    if (err.toString().match(/401 Unauthorized/)) {
      localStorage.removeItem('OCTOLIFE_GH_TOKEN');
      window.location.href = '/';
    } else {
      document.querySelector('#root').innerHTML = `
        <div class="form">
          <h1 class="mt2">Error</h1>
          <p class="mt2 tac">Please try again in a few minutes.</p>
        </div>
      `;
    }
  }
};

export const QUERY_GET_REPOS = (query, cursor) => `
  query {
    search(query: "${query}", type: REPOSITORY, first: 100${
  cursor ? `, after: "${cursor}"` : ''
}) {
      repositoryCount,
      edges {
        cursor,
        node {
          ... on Repository {
            name,
            createdAt,
            descriptionHTML,
            diskUsage,
            forkCount,
            homepageUrl,
            stargazers {
              totalCount
            },
            issues(states: OPEN) {
              totalCount
            },
            languages(first:15) {
              nodes {
                name,
                color
              }
            }
          }
        }
      }
    }
  }
`;

export const QUERY_GET_COMMITS = (user, repo, cursor) => `
  {
    repository(owner: "${user}", name: "${repo}") {
      object(expression: "master") {
        ... on Commit {
          history(first: 100${cursor ? `, after: "${cursor}"` : ''}) {
            nodes {
              committedDate
            }
            pageInfo {
              endCursor
            }
          }
        }
      }
    }
  }
`;

export const QUERY_USER = user => `
  query {
    search(query: "user:${user}", type: USER, first: 1) {
      userCount,
      edges {
        node {
          ... on User {
            name,
            login,
            avatarUrl,
            bio,
            company,
            createdAt,
            location,
            url,
            websiteUrl,
            followers {
              totalCount
            },
            pinnedRepositories(first:10) {
              nodes {
                name,
                url,
                stargazers {
                  totalCount
                }
              }
            }
          }
        }
      }
    }
  }
`;
