import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '1m', target: 4000 }, // ramp to xx VUs
    { duration: '2m', target: 5000 }, // ramp to xx VUs
    { duration: '2m', target: 5500 }, // ramp to xx VUs
    { duration: '1m', target: 0 }, // scale back down
  ],
};

const url: string = __ENV.URL;

const query = `
  query GetAllAuthors {
    getAllAuthors {
      items {
        firstname
        id
        lastname
      }
      pageInfo {
        totalItems
        totalPages
        currentPage
      }
    }
  }
`;

export default function () {
  const headers = { 'Content-Type': 'application/json' };

  const res = http.post(url, JSON.stringify({ query }), { headers });

  check(res, {
    'status is 200': (r) => r.status === 200,
    'has data': (r) => {
      const data = r.json() as { data?: { getAllAuthors?: any } };
      return Boolean(data?.data?.getAllAuthors);
    },
  });

  sleep(1); // small pause between requests
}
