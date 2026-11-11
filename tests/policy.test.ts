import { test } from "node:test";
import assert from "node:assert/strict";
import { decidir, moduloEncendido, rolDelToken } from "../src/policy";

const jwt = (role: string) => `Bearer h.${Buffer.from(JSON.stringify({ role })).toString("base64url")}.s`;

test("tabla y RPC permitidas pasan; las demás, 403", () => {
  assert.equal(decidir("GET", "/rest/v1/remisiones").ok, true);
  assert.equal(decidir("POST", "/rest/v1/rpc/recibir_contenedor").ok, true);
  assert.equal(decidir("POST", "/rest/v1/rpc/asignar_vendedor_remision").ok, true);
  assert.equal(decidir("GET", "/rest/v1/pg_catalog").status, 403);
  assert.equal(decidir("GET", "/rest/v1/").status, 403);
  assert.equal(decidir("POST", "/rest/v1/rpc/patio_kit_set_user_role").status, 403);
  assert.equal(decidir("POST", "/rest/v1/rpc/bridge_bitacora").status, 403);
  assert.equal(decidir("GET", "/rest/v1/bridge_bitacora").status, 403);
});

test("flujo de dinero: sólo la vista y las funciones flujo_*; las tablas no se tocan directo", () => {
  assert.equal(decidir("GET", "/rest/v1/v_flujo_dinero").ok, true);
  for (const f of ["flujo_recibir", "flujo_confirmar_caja", "flujo_aplicar", "flujo_rechazar", "flujo_mis_capacidades",
    "flujo_listar_capacidades", "flujo_asignar_capacidad", "flujo_cuentas", "flujo_clientes", "flujo_remisiones_para_aplicar"]) {
    assert.equal(decidir("POST", `/rest/v1/rpc/${f}`).ok, true, f);
  }
  assert.equal(decidir("GET", "/rest/v1/flujo_dinero").status, 403);
  assert.equal(decidir("PATCH", "/rest/v1/flujo_dinero").status, 403);
  assert.equal(decidir("GET", "/rest/v1/flujo_capacidades").status, 403);
  assert.equal(decidir("POST", "/rest/v1/rpc/flujo_dinero_sin_borrar").status, 403);
});

test("no se puede escapar con rutas disfrazadas", () => {
  assert.equal(decidir("GET", "/rest/v1/../auth/v1/admin/users").ok, false);
  assert.equal(decidir("GET", "/rest/v1/%2e%2e/auth/v1/admin/users").ok, false);
  assert.equal(decidir("GET", "/rest/v2/remisiones").ok, false);
  assert.equal(decidir("GET", "/graphql/v1").ok, false);
  assert.equal(decidir("GET", "/realtime/v1/websocket").ok, false);
});

test("auth: login y recuperar sí; registro y admin no", () => {
  assert.equal(decidir("POST", "/auth/v1/token").ok, true);
  assert.equal(decidir("POST", "/auth/v1/recover").ok, true);
  assert.equal(decidir("POST", "/auth/v1/signup").status, 403);
  assert.equal(decidir("GET", "/auth/v1/admin/users").status, 403);
  assert.equal(decidir("POST", "/auth/v1/invite").status, 403);
  assert.equal(decidir("GET", "/auth/v1/token").status, 405);
});

test("storage: solo buckets conocidos y nada de administrar buckets", () => {
  assert.equal(decidir("POST", "/storage/v1/object/remisiones-docs/a/b.pdf").ok, true);
  assert.equal(decidir("POST", "/storage/v1/object/sign/remisiones-docs/a/b.pdf").ok, true);
  const firmada = decidir("GET", "/storage/v1/object/sign/remisiones-docs/a/b.pdf");
  assert.equal(firmada.requiereSesion, false);
  assert.equal(decidir("GET", "/storage/v1/object/otro-bucket/x").status, 403);
  assert.equal(decidir("GET", "/storage/v1/bucket").status, 403);
  assert.equal(decidir("DELETE", "/storage/v1/bucket/remisiones-docs").status, 403);
});

test("funciones de borde: solo las 4 conocidas", () => {
  assert.equal(decidir("POST", "/functions/v1/admin-create-user").ok, true);
  assert.equal(decidir("POST", "/functions/v1/mati-admin-bridge").status, 403);
});

test("módulo: solo las ESCRITURAS de tablas exclusivas piden módulo encendido", () => {
  assert.equal(decidir("POST", "/rest/v1/crm_actividades").modulo, "crm");
  assert.equal(decidir("GET", "/rest/v1/crm_actividades").modulo, undefined);
  assert.equal(decidir("POST", "/rest/v1/clientes").modulo, undefined);
  assert.equal(moduloEncendido("crm", new Set(["crm"])), false);
  assert.equal(moduloEncendido("dashboard", new Set(["dashboard"])), true);
});

test("rolDelToken lee el rol y rechaza lo que no es JWT", () => {
  assert.equal(rolDelToken(jwt("authenticated")), "authenticated");
  assert.equal(rolDelToken(jwt("anon")), "anon");
  assert.equal(rolDelToken("Bearer dummy"), null);
  assert.equal(rolDelToken(undefined), null);
});

test("lo que el front usa vía ayudantes también pasa (regresión «Tabla no permitida»)", () => {
  for (const t of ["remision_refaccion_items", "remision_refaccion_eventos", "almacen_refacciones_producto_compat", "historial_conexiones"]) {
    assert.equal(decidir("GET", `/rest/v1/${t}`).ok, true, t);
  }
  for (const f of ["registrar_pago_cobranza", "crear_compra_refacciones", "cliente_tiene_cxc_vencidas"]) {
    assert.equal(decidir("POST", `/rest/v1/rpc/${f}`).ok, true, f);
  }
});

test("firmas electrónicas: tablas, bucket y la función firmas con sesión", () => {
  assert.equal(decidir("GET", "/rest/v1/firmas_solicitudes").ok, true);
  assert.equal(decidir("GET", "/rest/v1/firmas_firmantes").ok, true);
  assert.equal(decidir("POST", "/storage/v1/object/sign/firmas/abc/original.pdf").ok, true);
  const f = decidir("POST", "/functions/v1/firmas");
  assert.equal(f.ok, true);
  assert.equal(f.requiereSesion, true);
  assert.equal(decidir("GET", "/rest/v1/firmas_usuario").status, 403);
});

test("Recursos Humanos: tablas, RPC y buckets abiertos; la escritura depende del módulo rh", () => {
  assert.equal(decidir("GET", "/rest/v1/v_rh_directorio").ok, true);
  assert.equal(decidir("POST", "/rest/v1/rpc/rh_marcar_entrada").ok, true);
  assert.equal(decidir("GET", "/storage/v1/object/sign/rh-expedientes/x/y.pdf").ok, true);
  assert.equal(decidir("PATCH", "/rest/v1/rh_empleados").modulo, "rh");
  assert.equal(decidir("POST", "/rest/v1/rh_documentos").modulo, "rh");
  assert.equal(decidir("GET", "/rest/v1/rh_empleados").modulo, undefined);
  assert.equal(moduloEncendido("rh", new Set(["rh"])), false);
  // Lo que RH no expone sigue cerrado.
  assert.equal(decidir("POST", "/rest/v1/rpc/rh_resultado_ubicacion").status, 403);
});

test("RH: aviso, contratos y envío de accesos quedan abiertos; las tablas de contratos no se escriben directo", () => {
  assert.equal(decidir("POST", "/rest/v1/rpc/rh_contrato_firmado").ok, true);
  assert.equal(decidir("POST", "/rest/v1/rpc/rh_vincular_usuario").ok, true);
  assert.equal(decidir("POST", "/rest/v1/rpc/rh_publicar_aviso").ok, true);
  assert.equal(decidir("POST", "/functions/v1/rh-enviar-accesos").ok, true);
  assert.equal(decidir("GET", "/rest/v1/rh_contratos").ok, true);
  assert.equal(decidir("GET", "/rest/v1/rh_avisos_privacidad").ok, true);
});
