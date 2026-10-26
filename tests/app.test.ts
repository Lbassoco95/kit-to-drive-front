import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import type { AddressInfo } from "node:net";
import { crearApp } from "../src/app";
import { limpiarCacheModulos } from "../src/modulos";

const jwt = (role: string) => `Bearer h.${Buffer.from(JSON.stringify({ role })).toString("base64url")}.s`;
const VISTAS: Array<{ url: string; method: string; headers: http.IncomingHttpHeaders }> = [];
let apagados: string[] = [];
let upstream: http.Server, gateway: http.Server, base = "";

before(async () => {
  upstream = http.createServer((req, res) => {
    VISTAS.push({ url: req.url ?? "", method: req.method ?? "", headers: req.headers });
    res.setHeader("content-type", "application/json");
    if ((req.url ?? "").startsWith("/rest/v1/app_modulos")) return res.end(JSON.stringify(apagados.map((clave) => ({ clave }))));
    res.end(JSON.stringify({ ok: true }));
  });
  await new Promise<void>((r) => upstream.listen(0, r));
  const up = `http://127.0.0.1:${(upstream.address() as AddressInfo).port}`;
  // El config real exige https; aquí se prueba contra un falso en http.
  const app = crearApp({ supabaseUrl: up, anonKey: "ANON-REAL", origenes: ["https://front.test"], limitePorMinuto: 1000 });
  gateway = http.createServer(app);
  await new Promise<void>((r) => gateway.listen(0, r));
  base = `http://127.0.0.1:${(gateway.address() as AddressInfo).port}`;
});
after(() => { upstream.close(); gateway.close(); });

test("reenvía con la llave real y el JWT del usuario; ignora la apikey del cliente", async () => {
  VISTAS.length = 0;
  const r = await fetch(`${base}/rest/v1/clientes?select=*&limit=1`, { headers: { authorization: jwt("authenticated"), apikey: "DUMMY", "accept-profile": "auth" } });
  assert.equal(r.status, 200);
  const v = VISTAS.at(-1)!;
  assert.equal(v.url, "/rest/v1/clientes?select=*&limit=1");
  assert.equal(v.headers.apikey, "ANON-REAL");
  assert.equal(v.headers.authorization, jwt("authenticated"));
  assert.equal(v.headers["accept-profile"], undefined);
});

test("sin sesión o con la llave anon: 401 y no llega a Supabase", async () => {
  VISTAS.length = 0;
  assert.equal((await fetch(`${base}/rest/v1/clientes`)).status, 401);
  assert.equal((await fetch(`${base}/rest/v1/clientes`, { headers: { authorization: jwt("anon") } })).status, 401);
  assert.equal(VISTAS.length, 0);
});

test("tabla fuera de la lista: 403 y no llega a Supabase", async () => {
  VISTAS.length = 0;
  const r = await fetch(`${base}/rest/v1/patio_bridge_secret`, { headers: { authorization: jwt("authenticated") } });
  assert.equal(r.status, 403);
  assert.equal(VISTAS.length, 0);
});

test("login pasa con la llave anon", async () => {
  VISTAS.length = 0;
  const r = await fetch(`${base}/auth/v1/token?grant_type=password`, { method: "POST", headers: { "content-type": "application/json", authorization: "Bearer dummy" }, body: JSON.stringify({ email: "a@b.c", password: "x" }) });
  assert.equal(r.status, 200);
  assert.equal(VISTAS.at(-1)!.headers.authorization, "Bearer ANON-REAL");
});

test("módulo apagado bloquea la escritura pero no la lectura", async () => {
  apagados = ["crm"]; limpiarCacheModulos();
  const h = { authorization: jwt("authenticated"), "content-type": "application/json" };
  const w = await fetch(`${base}/rest/v1/crm_actividades`, { method: "POST", headers: h, body: "{}" });
  assert.equal(w.status, 403);
  assert.equal(((await w.json()) as { code: string }).code, "MODULO_APAGADO");
  assert.equal((await fetch(`${base}/rest/v1/crm_actividades`, { headers: h })).status, 200);
  apagados = []; limpiarCacheModulos();
});

test("CORS: solo el origen del front", async () => {
  const bien = await fetch(`${base}/health`, { headers: { origin: "https://front.test" } });
  assert.equal(bien.headers.get("access-control-allow-origin"), "https://front.test");
  const mal = await fetch(`${base}/health`, { headers: { origin: "https://malo.test" } });
  assert.equal(mal.headers.get("access-control-allow-origin"), null);
  const pre = await fetch(`${base}/rest/v1/clientes`, { method: "OPTIONS", headers: { origin: "https://malo.test" } });
  assert.equal(pre.status, 403);
});

test("CORS: el preflight acepta las cabeceras que pide supabase-js", async () => {
  const pre = await fetch(`${base}/auth/v1/token?grant_type=password`, {
    method: "OPTIONS",
    headers: { origin: "https://front.test", "access-control-request-method": "POST", "access-control-request-headers": "apikey,content-type,x-client-info,x-supabase-api-version" },
  });
  assert.equal(pre.status, 204);
  assert.match(pre.headers.get("access-control-allow-headers") ?? "", /x-supabase-api-version/);
});
