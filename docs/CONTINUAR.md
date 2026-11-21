# Historial del punto de continuación · v1.1.0

El usuario retomó el trabajo el 20/11/2026 por la noche. La pausa anterior quedó revocada. El contenido siguiente registra el punto anterior; consultar `VERIFICACION.md` para la evidencia más reciente.

Actualización al retomar: el workflow alojado `44854978194` completó la ingestión y publicó `925d098`, con FP3 (22 resultados, 633 registros de vueltas) y 1.059 intervalos de telemetría entre las tres prácticas. Se incorporaron esos datos localmente sin perder cambios de código. El selector OpenF1 se está verificando con identificadores estables para que FP2 no cambie al publicarse otra sesión.

## Estado guardado

- Repositorio: https://github.com/JallinskyLuca/tiempos-de-pista, rama `main`.
- Último commit subido: `8cbdcf5` (`Validar cada selección de telemetría sin cachear redirecciones`). Todos los cambios de aplicación están guardados y subidos.
- `package.json` y lockfile: versión `1.1.0`. No se creó el tag de Git `v1.1.0`.
- Sitio: https://tiempos-de-pista.netlify.app/. El último despliegue observado listo fue `cd8bcc7`, ID `6b00e3e4065e19db48385f1d`. El despliegue del commit `8cbdcf5` se inició con el push, pero todavía no se verificó su estado final.
- Implementados: Home y centros F1/TC/TN, resúmenes oficiales, resultados/vueltas OpenF1, análisis de telemetría, logos 2026, calendario destacado/descendente, temas claro/oscuro y Wake Lock.

## Hallazgos importantes

1. OpenF1 restringe GLOBALMENTE el acceso gratuito durante las ventanas en vivo, incluso para sesiones históricas. No basta esperar 30 minutos después de la sesión elegida. Se observó HTTP 401 explícito desde local y Netlify a partir de las 21:00 AR antes de FP3. No contratar ni intentar eludir la restricción.
2. La telemetría ahora se sincroniza mediante `scripts/import-telemetry.mjs` fuera de todas las ventanas y se publica en `public/telemetria/<sha256>.json`. Las visitas no consultan OpenF1. Las vueltas pendientes aparecen como pendientes; no inventar datos.
3. Se conservaron respuestas legítimas de la caché local capturadas antes del bloqueo: Russell FP2/vuelta 20 (381 muestras), auto 51 FP1/vuelta 1 (221). Están publicadas en archivos propios; el índice es `data/openf1/telemetry.json`. La primera ingestión amplia sigue pendiente de acceso gratuito. El workflow incluye `telemetry:update` y la pausa global.
4. El comentario que Netlify inserta en el head provocaba React #418 al existir un inicializador explícito en head. Se aisló el problema eliminando solo ese comentario en una prueba controlada. El script de tema está ahora al comienzo del body; tema persistente y PWA pasaron pruebas públicas tras ese cambio. El test reproduce el comentario en CI.
5. El CDN de Netlify cacheaba una redirección por ruta compartiendo valores de query entre pilotos. El último commit aplica `no-store` a la selección API, deja caché solo en JSON con hash, usa `Location` relativa y valida sesión/piloto/vuelta también en el cliente. ESTE ÚLTIMO AJUSTE ES EL QUE FALTA COMPROBAR EN PRODUCCIÓN.

## Verificado antes de detener

- Compilación final de producción PWA, TypeScript y lint aprobados.
- 36 pruebas unitarias aprobadas.
- La versión anterior al último ajuste pasó 22 pruebas locales completas y las dos pruebas nuevas de CDN por separado.
- Tras el ajuste final pasaron las seis pruebas locales de copias, clasificación y comparación, incluida respuesta de piloto incorrecto. El script visual mostró cinco gráficos reales, cero errores JS y ningún desbordamiento a 360 px.
- Netlify con `cd8bcc7`: ambas copias públicas devolvieron HTTP 200, 381/221 muestras y cabecera inmutable. La suite pública pasó 22 de 24 pruebas; las dos fallas correspondían a la redirección cacheada (esperaba 404 para piloto 999, recibió copia válida de otro piloto). Se corrigió en `8cbdcf5`; NO afirmar que ya pasaron las 24 públicas finales.
- GitHub CI de `cd8bcc7` había terminado correctamente. CI de `8cbdcf5` no comprobado aún.

## Próximos pasos al retomar

1. Revisar `git status`, estado del despliegue `8cbdcf5` y CI. No rehacer implementación.
2. Verificar en Netlify selección válida `307` sin caché, piloto inexistente `404`, query inválida `400`, copia propia con hash `200` y cabecera inmutable. Comprobar que `Location` conserve el dominio visible.
3. Ejecutar las 24 pruebas Playwright contra producción:

```powershell
$env:PLAYWRIGHT_BASE_URL='https://tiempos-de-pista.netlify.app'
$env:PLAYWRIGHT_CHANNEL='chrome'
npm run test:e2e
```

4. Ejecutar `.work-import/qa-telemetry.mjs https://tiempos-de-pista.netlify.app` para probar gráficos reales en navegador (evita que un test HTTP o un mock oculte un problema CORS).
5. Si el proveedor está fuera de sus ventanas restringidas, comprobar el primer backfill y el workflow. Ventana prevista de FP3: 21:00–23:00 AR del 20/11; clasificación: 00:30–02:30 AR del 21/11. Las demoras reales y cron pueden cambiar disponibilidad. No consultar repetidamente un proveedor que sigue respondiendo 401.
6. Actualizar `docs/VERIFICACION.md` con el resultado público final; documentación sola debe usar `[skip netlify]` para ahorrar créditos. Valorar tag `v1.1.0` tras validación.
7. Informar la entrega distinguiendo resultados completos de FP2, estado sin tiempos de FP1 y cobertura de telemetría efectivamente sincronizada. Instalación/Wake Lock en teléfonos físicos sigue pendiente.

## Ayudas locales

- `.work-import/netlify-release-status.mjs`: usa CLI autenticado y solo imprime metadatos seguros del despliegue. Nunca imprimir configuración completa de Netlify ni tokens.
- CLI oficial: `C:/Users/Luca/AppData/Local/npm-cache/_npx/10ad3251f36d761e/node_modules/netlify-cli/bin/run.js`.
- Site ID: `20610cec-5180-4f0b-b20b-1ca55cf7410f`. Plan Free, recargas automáticas desactivadas; conservarlo.
- `.work-import/qa-hydration.mjs`: prueba controlada de hidratación con/sin comentario del CDN.
- Vista previa de producción: `npm run start:pwa` usa 3002. No ocupar 3000 (portfolio) ni 3001 (VS Code).
- AGENTS.md exige leer guías relevantes de `node_modules/next/dist/docs/` antes de nuevos cambios de código. Next 16.4.6.
