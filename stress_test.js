import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 100,
  duration: '10s', 
};

export default function () {
  const url = 'http://localhost:8000/api/reservations';

  const payload = JSON.stringify({
    partnerId: `partner-${__VU}-${__ITER}`, 
    seats: 10, 
  });

  const params = {
    headers: { 'Content-Type': 'application/json' },
  };

  const res = http.post(url, payload, params);

  check(res, {
    'Success (201)': (r) => r.status === 201,
    'Conflict / No Seats (409)': (r) => r.status === 409,
  });

  sleep(1);
}