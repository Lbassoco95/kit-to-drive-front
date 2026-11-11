import express from "express";
import { crearApp } from "./app";
import { cargarConfig } from "./config";

// Si la configuración está mal, el API no se cae: responde 503 y dice qué
// variable falla (nunca su valor), igual que mati-api.
function construir() {
  try {
    return crearApp(cargarConfig());
  } catch (e) {
    const motivo = e instanceof Error ? e.message : "configuración inválida";
    const app = express();
    app.use((_req, res) => { res.status(503).json({ message: "API sin configurar", code: "SIN_CONFIGURAR", motivo }); });
    return app;
  }
}

const app = construir();

if (!process.env.VERCEL) {
  const puerto = Number(process.env.PORT ?? 8787);
  app.listen(puerto, () => console.log(`kit-to-drive-api escuchando en :${puerto}`));
}

export default app;
