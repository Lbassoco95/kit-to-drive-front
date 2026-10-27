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

test("unificación: el libro, las cuentas y los abonos solo se leen; el dinero entra por el flujo", () => {
  for (const t of ["movimientos_financieros", "cuentas_financieras", "cxc_abonos", "empresas_grupo"]) {
    assert.equal(decidir("GET", `/rest/v1/${t}`).ok, true, t);
    for (const m of ["POST", "PATCH", "DELETE"]) assert.equal(decidir(m, `/rest/v1/${t}`).status, 403, `${m} ${t}`);
  }
  for (const f of ["registrar_pago_cobranza", "validar_pago_cobranza", "aplicar_pago_cobranza"]) {
    assert.equal(decidir("POST", `/rest/v1/rpc/${f}`).status, 403, f);
  }
  for (const f of ["flujo_empresas", "flujo_buscar_remisiones", "flujo_cxc_cliente", "flujo_cambiar_cliente", "flujo_revertir",
    "movimiento_cancelar", "movimiento_ajustar", "movimiento_comprobar", "empresa_guardar", "cuenta_guardar", "revertir_pago_cobranza"]) {
    assert.equal(decidir("POST", `/rest/v1/rpc/${f}`).ok, true, f);
  }
  for (const v of ["v_saldos_por_empresa", "v_flujo_en_transito", "v_flujo_dinero_eventos", "catalogo_bancos_bitacora"]) {
    assert.equal(decidir("GET", `/rest/v1/${v}`).ok, true, v);
  }
});

test("gastos, categorías y conciliación: solo las funciones nuevas; las funciones de regularización no se abren al front", () => {
  for (const f of ["flujo_capturar_gasto", "flujo_confirmar_gasto", "flujo_entregar_gasto", "flujo_rechazar_gasto", "flujo_corregir_gasto",
    "flujo_cuentas_gasto", "flujo_categorias_gasto", "flujo_saldo_cuenta", "categoria_guardar", "movimiento_conciliar"]) {
    assert.equal(decidir("POST", `/rest/v1/rpc/${f}`).ok, true, f);
  }
  // Regularizar, reclasificar y resolver históricos se corren con el procedimiento del back, no desde el front.
  for (const f of ["movimiento_regularizar", "movimiento_reclasificar_cuenta", "movimiento_historico_resolver", "cobranza_pago_regularizar"]) {
    assert.equal(decidir("POST", `/rest/v1/rpc/${f}`).status, 403, f);
  }
  assert.equal(decidir("GET", "/rest/v1/categorias_financieras").ok, true);
  for (const m of ["POST", "PATCH", "DELETE"]) assert.equal(decidir(m, "/rest/v1/categorias_financieras").status, 403, m);
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
  for (const f of ["crear_compra_refacciones", "cliente_tiene_cxc_vencidas"]) {
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
