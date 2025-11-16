import http from 'k6/http';
import { sleep, check } from 'k6';

export const options = {
  vus: 1,
  duration: '10s',
};

export default function () {
  // Ajuste os endpoints conforme sua API
  const res = http.get('http://users-service:3000/');
  check(res, { 'status is 200': (r) => r.status === 200 });
  sleep(1);
}

