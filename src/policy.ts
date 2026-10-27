import {
  AUTH_PERMITIDAS, BUCKETS, FUNCIONES, MODULO_DE_ESCRITURA, RPCS, SIEMPRE_ENCENDIDOS, SOLO_LECTURA, TABLAS,
} from "./allowlist";

export type Destino =
  | { tipo: "rest"; tabla: string }
  | { tipo: "rpc"; nombre: string }
  | { tipo: "storage"; bucket: string; firmada: boolean }
  | { tipo: "funcion"; nombre: string }
  | { tipo: "auth"; ruta: string };

export interface Decision {
  ok: boolean;
  status: number;
  motivo?: string;
  destino?: Destino;
  /** Pide un JWT de usuario (rol authenticated). */
  requiereSesion?: boolean;
  /** Módulo que debe estar encendido para esta escritura, si aplica. */
  modulo?: string;
}

const ESCRITURA = new Set(["POST", "PUT", "PATCH", "DELETE"]);

const no = (status: number, motivo: string): Decision => ({ ok: false, status, motivo });

function segmentosSeguros(ruta: string): string[] | null {
  let dec: string;
  try { dec = decodeURIComponent(ruta); } catch { return null; }
  if (dec.includes("\\") || dec.includes("\0")) return null;
  const partes = dec.split("/").filter((p) => p !== "");
  if (partes.some((p) => p === ".." || p === ".")) return null;
  return partes;
}

/** Decide si una llamada del front puede pasar. `ruta` es el path SIN query. */
export function decidir(metodo: string, ruta: string): Decision {
  const m = metodo.toUpperCase();
  const partes = segmentosSeguros(ruta);
  if (!partes || partes.length < 2) return no(404, "Ruta no permitida");
  const [familia, version, ...resto] = partes;
  if (version !== "v1") return no(404, "Ruta no permitida");

  if (familia === "rest") {
    const [primero, segundo] = resto;
    if (!primero) return no(403, "Esquema no expuesto");
    if (primero === "rpc") {
      if (!segundo || !RPCS.has(segundo)) return no(403, "Función no permitida");
      if (m !== "POST" && m !== "GET") return no(405, "Método no permitido");
      return { ok: true, status: 200, requiereSesion: true, destino: { tipo: "rpc", nombre: segundo } };
    }
    if (!TABLAS.has(primero)) return no(403, "Tabla no permitida");
    if (!["GET", "HEAD", "POST", "PATCH", "DELETE"].includes(m)) return no(405, "Método no permitido");
    if (ESCRITURA.has(m) && SOLO_LECTURA.has(primero)) return no(403, "Solo lectura: el dinero entra por el flujo");
    const modulo = ESCRITURA.has(m) ? MODULO_DE_ESCRITURA[primero] : undefined;
    return { ok: true, status: 200, requiereSesion: true, modulo, destino: { tipo: "rest", tabla: primero } };
  }

  if (familia === "storage") {
    if (resto[0] !== "object") return no(403, "Operación de storage no permitida");
    let i = 1;
    let firmada = false;
    if (["sign", "authenticated", "info", "list"].includes(resto[i])) {
      firmada = resto[i] === "sign" && m === "GET";
      i++;
    }
    const bucket = resto[i];
    if (!bucket || !BUCKETS.has(bucket)) return no(403, "Bucket no permitido");
    return { ok: true, status: 200, requiereSesion: !firmada, destino: { tipo: "storage", bucket, firmada } };
  }

  if (familia === "functions") {
    const nombre = resto[0];
    if (!nombre || !FUNCIONES.has(nombre)) return no(403, "Función de borde no permitida");
    return { ok: true, status: 200, requiereSesion: true, destino: { tipo: "funcion", nombre } };
  }

  if (familia === "auth") {
    const r = resto[0];
    const metodos = r ? AUTH_PERMITIDAS[r] : undefined;
    if (!r || !metodos || resto.length > 1) return no(403, "Ruta de autenticación no permitida");
    if (!metodos.includes(m)) return no(405, "Método no permitido");
    // token y recover se usan SIN sesión; user y logout la traen.
    return { ok: true, status: 200, requiereSesion: false, destino: { tipo: "auth", ruta: r } };
  }

  return no(404, "Ruta no permitida");
}

/** Lee el rol del JWT sin verificarlo: la firma la verifica Supabase. */
export function rolDelToken(authorization: string | undefined): string | null {
  if (!authorization) return null;
  const m = /^Bearer\s+([\w-]+)\.([\w-]+)\.([\w-]+)$/.exec(authorization.trim());
  if (!m) return null;
  try {
    const payload = JSON.parse(Buffer.from(m[2], "base64url").toString("utf8"));
    return typeof payload.role === "string" ? payload.role : null;
  } catch {
    return null;
  }
}

export function moduloEncendido(modulo: string, apagados: ReadonlySet<string>): boolean {
  return SIEMPRE_ENCENDIDOS.has(modulo) || !apagados.has(modulo);
}
