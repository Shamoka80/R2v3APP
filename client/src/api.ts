// Tiny fetch helper with JSON + error handling
export async function apiGet<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`${response.status}: ${text}`);
  }

  return response.json();
}

export async function apiPost<T>(url: string, data: any): Promise<T> {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`${response.status}: ${text}`);
  }

  return response.json();
}