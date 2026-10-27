// Lo único que el front puede tocar. Se generó leyendo el código del front
// (scripts/extraer-allowlist.sh); cualquier cosa fuera de aquí recibe 403.
// Para abrir una tabla nueva hay que agregarla aquí en un cambio revisado.

export const TABLAS = new Set([
  "abc_leyenda_combinaciones", "ajustes_inventario", "almacen_refacciones_productos",
  "almacen_refacciones_unidad_alias", "almacen_refacciones_unidades", "app_modulos", "avisos",
  "bitacora_compras_inventario", "bitacora_eliminaciones", "bitacora_super_admin", "bitacora_eventos", "bitacora_orden_armado",
  "categorias_financieras", "clientes", "clientes_bitacora", "clientes_comentarios",
  "cobranza_aplicaciones", "cobranza_solicitudes_saldo", "comentarios_motocarros", "compras_parametros",
  "compras_refacciones", "config_general", "contenedores", "crm_actividades", "crm_oportunidades",
  "crm_ruta_paradas", "crm_rutas", "cuentas_financieras", "cuentas_por_cobrar", "cxc_abonos",
  "firmas_firmantes", "firmas_solicitudes",
  "incidencias_chasis", "incidencias_chasis_eventos", "inventario_almacenes", "inventario_chasis",
  "inventario_colores", "inventario_motivos_ajuste", "inventario_motor", "inventario_partes",
  "modelos_producto", "motocarros", "movimiento_adjuntos", "movimiento_bitacora",
  "movimientos_financieros", "notificaciones", "profiles", "proveedores", "recepciones_refacciones",
  "remision_items", "remision_refaccion_correcciones", "remisiones", "remisiones_bitacora",
  "remisiones_refacciones", "reportes_turno", "solicitudes_aprobacion", "soporte_mensajes", "soporte_tickets", "tareas",
  "user_roles", "v_almacen_refacciones", "v_carga_ya_armados", "v_clientes_credito",
  "v_cobranza_pagos", "v_cobranza_remisiones", "v_cobranza_saldos_favor",
  "v_compra_refacciones_contenedor", "v_flujo_dinero", "v_movimientos_financieros", "v_remision_refaccion_ordenes",
  "v_saldos_cuentas", "v_stock_modelo_color",
  "empresas_grupo", "catalogo_bancos_bitacora", "v_saldos_por_empresa", "v_flujo_en_transito", "v_flujo_dinero_eventos",
  "almacen_refacciones_producto_compat", "historial_conexiones", "remision_refaccion_eventos", "remision_refaccion_items",
]);

export const RPCS = new Set([
  "actualizar_envio_remision_refaccion", "ajustar_capacidad_color", "ajustar_unidades_remision",
  "asignar_motocarro_a_remision", "asignar_super_admin", "asignar_remision_items", "asignar_vendedor_remision", "cambiar_color_chasis",
  "cambiar_orden_armado", "cancelar_linea_refaccion", "cancelar_remision_refacciones", "definir_compatibilidades_articulo",
  "capturar_seriales_unidad", "compras_parametro", "configurar_pedido_remision", "configurar_unidad",
  "confirmar_fecha_entrega", "confirmar_sin_existencia_refaccion", "crear_motocarro_ya_armado",
  "crear_remision_refacciones", "cxc_vencidas_resumen", "desasignar_motocarro_de_remision",
  "desconfigurar_unidad", "eliminar_articulo_refaccion", "eliminar_compra_refacciones", "entregar_remision_refaccion", "es_super_admin", "es_usuario_prueba",
  "estado_cobro_remision_refaccion", "flujo_aplicar", "flujo_asignar_capacidad", "flujo_clientes",
  "flujo_confirmar_caja", "flujo_cuentas", "flujo_listar_capacidades", "flujo_mis_capacidades",
  "flujo_recibir", "flujo_rechazar", "flujo_remisiones_para_aplicar",
  "flujo_empresas", "flujo_buscar_remisiones", "flujo_cxc_cliente", "flujo_cambiar_cliente", "flujo_revertir",
  "movimiento_cancelar", "movimiento_ajustar", "movimiento_comprobar", "empresa_guardar", "cuenta_guardar",
  "flujo_capturar_gasto", "flujo_confirmar_gasto", "flujo_entregar_gasto", "flujo_rechazar_gasto", "flujo_corregir_gasto",
  "flujo_cuentas_gasto", "flujo_categorias_gasto", "flujo_saldo_cuenta", "categoria_guardar", "movimiento_conciliar", "importar_almacen_refacciones", "importar_motores_inventario",
  "importar_packing_list", "importar_vins_inventario", "intercambiar_color_chasis",
  "kardex_refaccion", "liberar_refaccion_remision", "marcar_pago_remision_con_evidencia",
  "marcar_remision_entregada", "marcar_unidad_entregada", "proponer_fecha_entrega",
  "programar_entrega_remision_refaccion", "puede_aplicar_saldo_favor", "puede_asignar_remisiones", "puede_cargar_remisiones_anteriores",
  "puede_compras_inventario", "puede_editar_todas_remisiones", "puede_ver_almacen_refacciones",
  "reabrir_incidencia_chasis", "recibir_contenedor", "recibo_pago_cobranza", "registrar_conexion", "resolver_solicitud_aprobacion", "eliminar_solicitud_aprobacion", "solicitar_aprobacion", "super_admins_ids",
  "registrar_guia_remision_refaccion", "reportar_faltante_refaccion", "reportar_incidencia_chasis",
  "resolver_incidencia_chasis", "responder_solicitud", "resumen_rotacion_refacciones",
  "revisar_incidencia_chasis", "saldo_favor_disponible_cliente", "saldo_refaccion_a_fecha",
  "saldos_atipicos_refacciones", "salidas_por_cliente_mes", "sincronizar_compat_refacciones",
  "usuarios_asignables", "ventas_mensuales_refacciones",
  "actualizar_articulo_refaccion", "alta_articulo_refaccion", "aplicar_ajuste_rapido", "aplicar_datos_maestros_refacciones", "aplicar_saldo_favor", "cancelar_compra_refacciones", "cliente_tiene_cxc_vencidas", "confirmar_compra_refacciones", "confirmar_compras_refacciones", "corregir_remision_refaccion", "crear_compra_refacciones", "dividir_compra_refacciones", "guardar_almacen_inventario", "guardar_equivalente_ecount", "guardar_motivo_ajuste", "proponer_conteo_fisico", "registrar_recepcion_refacciones", "reiniciar_datos_prueba_compras", "resolver_pendiente_compra_refacciones", "revertir_pago_cobranza", "revisar_propuesta_ajuste", "sembrar_datos_prueba_compras", "solicitar_saldo_favor", "unificar_unidades_refacciones", 
]);

export const BUCKETS = new Set([
  "actividades-evidencia", "comentarios-fotos", "evidencias-compras", "remisiones-docs", "firmas",
]);

export const FUNCIONES = new Set([
  "admin-create-user", "admin-reset-user-password", "admin-update-user", "complete-password-change",
  "firmas",
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

// Tablas que el front solo LEE: todo movimiento de dinero entra por el flujo (RPC flujo_*). La base también
// les quita la escritura; aquí se cierra la puerta antes de llegar a ella.
export const SOLO_LECTURA = new Set([
  "movimientos_financieros", "cuentas_financieras", "cxc_abonos", "empresas_grupo", "catalogo_bancos_bitacora",
  "cobranza_aplicaciones", "categorias_financieras",
]);

export const SIEMPRE_ENCENDIDOS = new Set(["dashboard", "usuarios", "configuracion"]);
