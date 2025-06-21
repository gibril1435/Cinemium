export async function authFetch(input: RequestInfo, init: RequestInit = {}) {
  const token = localStorage.getItem('token');
  const headers = new Headers(init.headers || {});
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // Add 2-second delay for GET requests
  if (!init.method || init.method.toUpperCase() === 'GET') {
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  return fetch(input, { ...init, headers });
}

export function formatRupiah(amount: number) {
  return 'Rp' + amount.toLocaleString('id-ID');
} 