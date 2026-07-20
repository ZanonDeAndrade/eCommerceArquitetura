import http from "k6/http";
import { check, sleep } from "k6";

const PAYMENT_SERVICE_URL = __ENV.PAYMENT_SERVICE_URL || "http://payment-service:3000";
const ORDER_ID = __ENV.ORDER_ID || "6753a5c9f0a5b5b7c1f00001"; // seed default
const PAYMENT_METHOD = __ENV.PAYMENT_METHOD || "PIX";
const PAYMENT_AMOUNT = Number(__ENV.PAYMENT_AMOUNT || 4800); // total do pedido seed

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
  const url = `${PAYMENT_SERVICE_URL}/payments/confirm`;
  
  const payload = JSON.stringify({
    orderId: ORDER_ID,
    payments: [{ method: PAYMENT_METHOD, amount: PAYMENT_AMOUNT }],
  });

  const params = {
    headers: { "Content-Type": "application/json" },
  };

  const res = http.post(url, payload, params);

  check(res, {
    "status 200": (r) => r.status === 200,
  });

  sleep(1);
}
