// Lo único que el front puede tocar. Se generó leyendo el código del front
// (scripts/extraer-allowlist.sh); cualquier cosa fuera de aquí recibe 403.
// Para abrir una tabla nueva hay que agregarla aquí en un cambio revisado.

export const TABLAS = new Set([
  "abc_leyenda_combinaciones", "ajustes_inventario", "almacen_refacciones_productos",
  "almacen_refacciones_unidad_alias", "almacen_refacciones_unidades", "app_modulos", "avisos",
  "bitacora_compras_inventario", "bitacora_eliminaciones", "bitacora_eventos", "bitacora_orden_armado",
  "categorias_financieras", "clientes", "clientes_bitacora", "clientes_comentarios",
  "cobranza_aplicaciones", "cobranza_solicitudes_saldo", "comentarios_motocarros", "compras_parametros",
  "compras_refacciones", "config_general", "contenedores", "crm_actividades", "crm_oportunidades",
  "crm_ruta_paradas", "crm_rutas", "cuentas_financieras", "cuentas_por_cobrar", "cxc_abonos",
  "incidencias_chasis", "incidencias_chasis_eventos", "inventario_almacenes", "inventario_chasis",
  "inventario_colores", "inventario_motivos_ajuste", "inventario_motor", "inventario_partes",
  "modelos_producto", "motocarros", "movimiento_adjuntos", "movimiento_bitacora",
  "movimientos_financieros", "notificaciones", "profiles", "proveedores", "recepciones_refacciones",
  "remision_items", "remision_refaccion_correcciones", "remisiones", "remisiones_bitacora",
  "remisiones_refacciones", "reportes_turno", "soporte_mensajes", "soporte_tickets", "tareas",
  "user_roles", "v_almacen_refacciones", "v_carga_ya_armados", "v_clientes_credito",
  "v_cobranza_pagos", "v_cobranza_remisiones", "v_cobranza_saldos_favor",
  "v_compra_refacciones_contenedor", "v_movimientos_financieros", "v_remision_refaccion_ordenes",
  "v_saldos_cuentas", "v_stock_modelo_color",
]);

export const RPCS = new Set([
  "actualizar_envio_remision_refaccion", "ajustar_capacidad_color", "ajustar_unidades_remision",
  "asignar_motocarro_a_remision", "asignar_remision_items", "cambiar_color_chasis",
  "cambiar_orden_armado", "cancelar_linea_refaccion", "cancelar_remision_refacciones",
  "capturar_seriales_unidad", "catalogo_clientes_basico", "compras_parametro", "configurar_pedido_remision", "configurar_unidad",
  "confirmar_fecha_entrega", "confirmar_sin_existencia_refaccion", "crear_motocarro_ya_armado",
  "crear_remision_refacciones", "cxc_vencidas_resumen", "desasignar_motocarro_de_remision",
  "desconfigurar_unidad", "entregar_remision_refaccion", "es_usuario_prueba",
  "estado_cobro_remision_refaccion", "importar_almacen_refacciones", "importar_motores_inventario",
  "importar_packing_list", "importar_vins_inventario", "intercambiar_color_chasis",
  "kardex_refaccion", "liberar_refaccion_remision", "marcar_pago_remision_con_evidencia",
  "marcar_remision_entregada", "marcar_unidad_entregada", "proponer_fecha_entrega",
  "programar_entrega_remision_refaccion", "puede_aplicar_saldo_favor", "puede_asignar_remisiones", "puede_cargar_remisiones_anteriores",
  "puede_compras_inventario", "puede_editar_todas_remisiones", "puede_ver_almacen_refacciones",
  "reabrir_incidencia_chasis", "recibir_contenedor", "recibo_pago_cobranza", "registrar_conexion",
  "registrar_guia_remision_refaccion", "reportar_faltante_refaccion", "reportar_incidencia_chasis",
  "resolver_incidencia_chasis", "responder_solicitud", "resumen_rotacion_refacciones",
  "revisar_incidencia_chasis", "saldo_favor_disponible_cliente", "saldo_refaccion_a_fecha",
  "saldos_atipicos_refacciones", "salidas_por_cliente_mes", "sincronizar_compat_refacciones",
  "usuarios_asignables", "ventas_mensuales_refacciones",
]);

export const BUCKETS = new Set([
  "actividades-evidencia", "comentarios-fotos", "evidencias-compras", "remisiones-docs",
]);

export const FUNCIONES = new Set([
  "admin-create-user", "admin-reset-user-password", "admin-update-user", "complete-password-change",
]);

// Rutas de autenticación permitidas (no hay registro público ni rutas admin).
export const AUTH_PERMITIDAS: Record<string, string[]> = {
  token: ["POST"],
  logout: ["POST"],
  user: ["GET", "PUT"],
  recover: ["POST"],
};

// Tablas cuya ESCRITURA pertenece a un solo módulo. Si el módulo está apagado
// en app_modulos, el API rechaza insertar, actualizar y borrar. La lectura
// sigue abierta porque el Dashboard y otras pantallas leen estas tablas; se
// cierra módulo por módulo al migrarlo.
export const MODULO_DE_ESCRITURA: Record<string, string> = {
  crm_actividades: "crm", crm_oportunidades: "crm", crm_ruta_paradas: "crm", crm_rutas: "crm",
  cuentas_financieras: "finanzas", categorias_financieras: "finanzas",
  cobranza_aplicaciones: "cobranza", cobranza_solicitudes_saldo: "cobranza",
  remisiones_refacciones: "remisionesRefacciones",
  remision_refaccion_correcciones: "remisionesRefacciones",
  reportes_turno: "reportesTurno", tareas: "tareas",
  ajustes_inventario: "inventarioFisico",
};

export const SIEMPRE_ENCENDIDOS = new Set(["dashboard", "usuarios", "configuracion"]);
