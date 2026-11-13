import express, { type Express, type Request, type Response } from "express";
import rateLimit from "express-rate-limit";
import type { Config } from "./config";
import { decidir, moduloEncendido, rolDelToken } from "./policy";
import { modulosApagados } from "./modulos";

// Cabeceras que se reenvían a Supabase. Se descartan a propósito las de perfil
// de esquema (Accept-Profile / Content-Profile) y cualquier apikey del cliente.
const ENVIAR = ["content-type", "accept", "prefer", "range", "x-upsert", "cache-control", "if-none-match"];
const DEVOLVER = ["content-type", "content-range", "content-length", "etag", "cache-control", "location", "www-authenticate"];

function error(res: Response, status: number, mensaje: string, code?: string): void {
  res.status(status).json({ message: mensaje, ...(code ? { code } : {}) });
}

export function crearApp(cfg: Config): Express {
  const app = express();
  app.disable("x-powered-by");
  app.set("trust proxy", 1);

  app.use((req, res, next) => {
    const origen = req.headers.origin;
    if (origen && cfg.origenes.includes(origen)) {
      res.setHeader("Access-Control-Allow-Origin", origen);
      res.setHeader("Vary", "Origin");
      // Se devuelven las cabeceras que el navegador pide (supabase-js agrega
      // varias, p. ej. x-supabase-api-version); el origen ya está validado.
      const pedidas = req.headers["access-control-request-headers"];
      res.setHeader("Access-Control-Allow-Headers", typeof pedidas === "string" && pedidas ? pedidas : "authorization, content-type, apikey, x-client-info, x-supabase-api-version, prefer, range, x-upsert");
      res.setHeader("Access-Control-Allow-Methods", "GET, HEAD, POST, PUT, PATCH, DELETE, OPTIONS");
      res.setHeader("Access-Control-Expose-Headers", "content-range, etag");
      res.setHeader("Access-Control-Max-Age", "600");
    }
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Cache-Control", "no-store");
    if (req.method === "OPTIONS") {
      res.status(origen && cfg.origenes.includes(origen) ? 204 : 403).end();
      return;
    }
    next();
  });

  app.get("/health", (_req, res) => { res.json({ status: "ok" }); });

  app.use(rateLimit({
    windowMs: 60_000,
    limit: cfg.limitePorMinuto,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Demasiadas solicitudes", code: "RATE_LIMIT" },
  }));

  app.use(express.raw({ type: () => true, limit: "4mb" }));

  app.all(/^\/(rest|storage|functions|auth)\/.*/, async (req: Request, res: Response) => {
    const ruta = req.path;
    const d = decidir(req.method, ruta);
    if (!d.ok) {
      console.warn(JSON.stringify({ bloqueado: true, metodo: req.method, ruta: ruta.slice(0, 120), status: d.status, motivo: d.motivo }));
      return error(res, d.status, d.motivo ?? "No permitido", "BLOQUEADO");
    }

    const autorizacion = req.headers.authorization;
    const rol = rolDelToken(autorizacion);
    if (d.requiereSesion && rol !== "authenticated") {
      return error(res, 401, "Se requiere iniciar sesión", "SIN_SESION");
    }

    if (d.modulo && autorizacion) {
      const apagados = await modulosApagados(cfg, autorizacion);
      if (apagados && !moduloEncendido(d.modulo, apagados)) {
        return error(res, 403, `El módulo «${d.modulo}» está apagado`, "MODULO_APAGADO");
      }
    }

    const headers: Record<string, string> = { apikey: cfg.anonKey };
    for (const h of ENVIAR) {
      const v = req.headers[h];
      if (typeof v === "string") headers[h] = v;
    }
    // Sin sesión de usuario (login, recuperar contraseña, URL firmada) se
    // presenta la llave anon; con sesión, el JWT del usuario, para que RLS siga
    // decidiendo qué puede ver cada quien.
    headers.authorization = rol === "authenticated" && autorizacion ? autorizacion : `Bearer ${cfg.anonKey}`;

    const consulta = req.url.includes("?") ? req.url.slice(req.url.indexOf("?")) : "";
    const cuerpo = Buffer.isBuffer(req.body) && req.body.length > 0 ? req.body : undefined;

    try {
      const r = await fetch(`${cfg.supabaseUrl}${ruta}${consulta}`, {
        method: req.method,
        headers,
        body: req.method === "GET" || req.method === "HEAD" || !cuerpo ? undefined : new Uint8Array(cuerpo),
        redirect: "manual",
        signal: AbortSignal.timeout(25_000),
      });
      res.status(r.status);
      for (const h of DEVOLVER) {
        const v = r.headers.get(h);
        if (v && h !== "content-length") res.setHeader(h, v);
      }
      res.send(Buffer.from(await r.arrayBuffer()));
    } catch (e) {
      const timeout = e instanceof Error && (e.name === "TimeoutError" || e.name === "AbortError");
      error(res, timeout ? 504 : 502, timeout ? "Supabase tardó demasiado" : "No se pudo contactar a Supabase", "UPSTREAM");
    }
  });

  app.use((_req, res) => error(res, 404, "Ruta no encontrada", "NO_ENCONTRADO"));
  return app;
}
