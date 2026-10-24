
const BASE_URL = "http://127.0.0.1:5000/api";

async function request(path, options = {}) {
  const response = await fetch(BASE_URL + path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers
    }
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Request failed");
  }

  return data;
}

export const getFoods = () => request("/foods");

export const getOrders = () => request("/orders");

export const getDashboard = () => request("/dashboard");

export const placeOrder = (data) =>
  request("/orders", {
    method: "POST",
    body: JSON.stringify(data)
  });

export const updateOrder = (id, status) =>
  request(`/orders/${encodeURIComponent(id)}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status })
  });
