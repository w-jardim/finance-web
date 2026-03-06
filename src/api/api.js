// src/api/api.js
// Cliente HTTP mínimo (fetch) com erro padronizado: { status, payload }

const API_BASE_URL =
  import.meta.env.VITE_API_URL?.replace(/\/+$/, "") ||
  "https://api-finance-dev.gardenwjs.tech";

async function request(path, { method = "GET", token, body } = {}) {
  const url = `${API_BASE_URL}${path.startsWith("/") ? "" : "/"}${path}`;

  const headers = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  // Tenta ler JSON sempre (inclusive em erro)
  let payload = null;
  const text = await res.text();
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = { raw: text };
    }
  }

  if (!res.ok) {
    const err = new Error("API_ERROR");
    err.status = res.status;
    err.payload = payload;
    throw err;
  }

  return payload;
}

export const api = {
  // Auth
  login: (email, senha) =>
    request("/auth/login", {
      method: "POST",
      body: { email, senha },
    }),

  registrar: (email, senha) =>
    request("/auth/registrar", {
      method: "POST",
      body: { email, senha },
    }),

  getMe: (token) =>
    request("/me", {
      method: "GET",
      token,
    }),

  // Health (opcional)
  health: () => request("/health", { method: "GET" }),

  // Recursos (você vai usar no Dashboard depois)
  getLancamentos: (token, { inicio, fim, tipo, pago } = {}) => {
    const qs = new URLSearchParams();
    if (inicio) qs.set("inicio", inicio);
    if (fim) qs.set("fim", fim);
    if (tipo) qs.set("tipo", tipo);
    if (typeof pago !== 'undefined') qs.set('pago', String(pago));

    const suffix = qs.toString() ? `?${qs.toString()}` : "";
    return request(`/lancamentos${suffix}`, { method: "GET", token });
  },

  createLancamento: (token, data) =>
    request("/lancamentos", {
      method: "POST",
      token,
      body: data,
    }),

  updateLancamento: (token, id, data) =>
    request(`/lancamentos/${id}`, {
      method: "PUT",
      token,
      body: data,
    }),

  deleteLancamento: (token, id) =>
    request(`/lancamentos/${id}`, {
      method: "DELETE",
      token,
    }),

  getContas: (token) => request("/contas", { method: "GET", token }),
  createConta: (token, nome) =>
    request("/contas", { method: "POST", token, body: { nome } }),

  updateConta: (token, id, nome) =>
    request(`/contas/${id}`, { method: "PUT", token, body: { nome } }),

  deleteConta: (token, id) =>
    request(`/contas/${id}`, { method: "DELETE", token }),

  getCategorias: (token, { tipo } = {}) => {
    const qs = new URLSearchParams();
    if (tipo) qs.set("tipo", tipo);
    const suffix = qs.toString() ? `?${qs.toString()}` : "";
    return request(`/categorias${suffix}`, { method: "GET", token });
  },

  createCategoria: (token, { nome, tipo }) =>
    request("/categorias", { method: "POST", token, body: { nome, tipo } }),

  updateCategoria: (token, id, { nome, tipo }) =>
    request(`/categorias/${id}`, { method: "PUT", token, body: { nome, tipo } }),

  deleteCategoria: (token, id) =>
    request(`/categorias/${id}`, { method: "DELETE", token }),
  deleteCategoria: (token, id) =>
    request(`/categorias/${id}`, { method: "DELETE", token }),
  
  // marcar pago / estornar
  payLancamento: (token, id) => request(`/lancamentos/${id}/pagar`, { method: 'PATCH', token }),
  unpayLancamento: (token, id) => request(`/lancamentos/${id}/estornar`, { method: 'PATCH', token }),
};