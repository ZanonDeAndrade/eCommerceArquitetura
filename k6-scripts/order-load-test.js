import http from "k6/http";
import { check, sleep } from "k6";

const ORDER_SERVICE_URL = __ENV.ORDER_SERVICE_URL || "http://order-service:3000";
const ORDER_ID = __ENV.ORDER_ID || "6753a5c9f0a5b5b7c1f00001"; // seed default

export const options = {
  stages: [
    { duration: "30s", target: 10 },
    { duration: "1m", target: 50 },
    { duration: "1m", target: 100 },
    { duration: "1m", target: 200 },
    { duration: "1m", target: 500 },
    { duration: "1m", target: 800 },
    { duration: "1m", target: 1000 },
    { duration: "30s", target: 0 },
  ],
  thresholds: {
    http_req_failed: ["rate<0.01"],
    http_req_duration: ["p(95)<500"],
  },
};

export default function () {
  const url = `${ORDER_SERVICE_URL}/orders/${ORDER_ID}`;
  
  const params = {
    headers: { "Content-Type": "application/json" },
  };

  const res = http.get(url, null, params);

  check(res, {
    "status 200": (r) => r.status === 200,
  });

  sleep(1);
}
