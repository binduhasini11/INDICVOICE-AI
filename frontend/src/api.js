const API_BASE_URL = "http://127.0.0.1:8000";

export async function searchTravel({
  origin,
  destination,
  travel_date = null,
  time_preference = null,
  max_price = null,
  preference = null,
}) {
  const response = await fetch(`${API_BASE_URL}/travel/search`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      origin,
      destination,
      travel_date,
      time_preference,
      max_price,
      preference,
    }),
  });

  if (!response.ok) {
    throw new Error(`Backend error: ${response.status}`);
  }

  return await response.json();
}


export async function searchProducts({
  query,
  max_price = null,
  preference = null,
}) {
  const response = await fetch(`${API_BASE_URL}/products/search`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query,
      max_price,
      preference,
    }),
  });

  if (!response.ok) {
    throw new Error(`Backend error: ${response.status}`);
  }

  return await response.json();
}