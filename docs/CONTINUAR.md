# Estado de continuación · v1.1.0

Trabajo reanudado y entrega verificada la noche del 20 de noviembre de 2026. No hay una pausa activa.

- Sitio: https://tiempos-de-pista.netlify.app/.
- Última aplicación pública verificada: `b24576f`, despliegue `6b01014321873aa5a9c458b9`, estado `ready`.
- Datos sincronizados por GitHub: `925d098`, ejecución `44854978194` terminada correctamente. FP3 está pública con 22 resultados y 633 registros de vueltas. Hay 1.059 intervalos de telemetría preparados: 18 FP1, 410 FP2, 631 FP3.
- Los enlaces OpenF1 ahora usan claves estables, por ejemplo `?sesion=openf1%3A11415` para FP3. FP2 es 11414 y FP1 11413. Los índices numéricos previos siguen aceptándose.
- Compilación PWA, TypeScript, lint, 37 pruebas unitarias, 24 pruebas locales y 24 pruebas públicas aprobadas. CI de GitHub aprobado. Comparación real FP3 Russell/Antonelli: cinco gráficos, cero errores JS y sin desbordamiento móvil.
- La selección API de telemetría usa `no-store`; solo los JSON propios con hash tienen caché inmutable. Se valida sesión/piloto/vuelta también en el cliente. El script del tema está al comienzo del body para tolerar el comentario que inserta Netlify en el head.
- OpenF1 bloquea globalmente incluso el histórico durante las ventanas en vivo. El workflow prepara copias fuera de esas ventanas y las visitas solo leen el CDN propio. No contratar vivo ni intentar eludir HTTP 401. El proveedor puede demorar datos; conservar lo publicado.
- El workflow de datos sigue programado cada 30 minutos, consulta solo en ventanas de actividad del campeonato y funciona sin la PC encendida. GitHub puede demorar la ejecución.
- Netlify sigue Free, sin recargas automáticas. Usar `[skip netlify]` para commits exclusivamente documentales.

## Pendiente fuera de esta entrega

- Verificar instalación y Wake Lock en Android/iPhone físicos; las pruebas actuales usan Chrome y API controlada.
- El archivo F1DB histórico se conserva; no se importó todo el histórico de telemetría desde 2023. Las noticias iniciales son una selección editorial, no una redacción automática.

## Ayudas locales

- `.work-import/netlify-release-status.mjs`: estado seguro de los despliegues; no imprimir configuración completa ni tokens.
- `.work-import/racing-workflow.mjs`: estado y ejecución del actualizador de GitHub usando la sesión existente, sin exponer credenciales.
- `.work-import/qa-telemetry.mjs <baseURL> 11415`: gráficos reales de FP3, comparando Russell y Antonelli.
- Vista previa: `npm run start:pwa` en 3002. No ocupar 3000 (portfolio) ni 3001 (VS Code).
- AGENTS.md exige leer la documentación relevante en `node_modules/next/dist/docs/` antes de nuevos cambios. Next 16.4.6.

La evidencia y los detalles de integración están en `VERIFICACION.md`, `OPENF1.md` y `V1.1.0.md`. No rehacer los bloques ya cerrados.
