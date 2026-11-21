# Tiempos de Pista

[v1.1.0](docs/V1.1.0.md): Home general y centros de F1/TC/TN, noticias breves y resúmenes oficiales, sesiones terminadas de OpenF1 con análisis de telemetría, once logos de escuderías 2026, calendario con fecha destacada, temas claro/oscuro persistentes y control voluntario de pantalla encendida.

`npm run media:update` consulta los feeds públicos de FORMULA 1, ACTC Argentina y TN APAT, verifica canal/identificador/año y conserva hasta 60 resúmenes por competencia. Los errores no borran la biblioteca previa. La tarea alojada lo ejecuta durante las ventanas de actividad junto con la actualización de resultados; las visitas no consultan YouTube para construir las páginas. El reproductor `youtube-nocookie.com` se carga solo al pulsar **Cargar video**. Las restricciones del titular o de la región pueden impedir reproducir un video; el acceso al original queda disponible.

Las noticias iniciales son breves propios revisados, con fuente primaria; no constituyen un feed automático de noticias. La integración de resultados/telemetría está documentada en [OPENF1.md](docs/OPENF1.md): el vivo es pago y la consulta histórica gratuita queda disponible fuera de la ventana de sesión.

`npm run f1:update` importa las sesiones finalizadas desde hace al menos 30 minutos de las fechas cercanas al día actual, siempre fuera de todas las ventanas de restricción global de OpenF1. `npm run f1:update -- --year=2026 --round=21` permite consultar una fecha específica desde 2023. Conserva sesiones inmutables y publica su índice solo al validar la tanda completa. Una clasificación parcial, un resultado 404 sin confirmación oficial o una pérdida de vueltas impiden reemplazar datos válidos. El workflow alojado ejecuta esta importación durante la actividad del campeonato y despliega solo ante cambios reales.

`npm run telemetry:update` prepara copias duraderas por piloto/vuelta en intervalos de hasta 180 segundos. Descarga una sesión por piloto, valida identidad y rangos, divide sus vueltas y publica JSON con nombre SHA-256 en `public/telemetria`; el índice se publica por piloto validado. Las visitas solo solicitan estas copias al CDN propio, sin conectarse a OpenF1. Si falta una copia, la UI informa que está pendiente y evita una consulta que fallaría durante el bloqueo. Una tanda posterior completa las vueltas que ofrezca la fuente.

OpenF1 responde HTTP 401 también para el histórico mientras otra sesión está en la ventana en vivo. El actualizador pausa en esas ventanas, detiene consultas ante 401/429 y conserva las copias válidas. La primera sincronización amplia de Las Vegas se completó el 20/11 por la noche: FP1, FP2 y FP3, con 1.059 intervalos de telemetría preparados. Los enlaces OpenF1 usan identificadores estables de sesión, de modo que incorporar FP3 o clasificación no cambia una consulta guardada de FP2. El gráfico compara segundos transcurridos, no distancia. Las tablas importadas pueden guardarse sin conexión; la telemetría requiere red. El archivo histórico de F1DB continúa disponible.

Agenda, resultados y archivo histórico de Turismo Carretera, Fórmula 1 y TN APAT. Incluye favoritos locales, exportación a calendario y una PWA con descarga explícita de fechas completas para consultar sin conexión.

## Desarrollo local

Requiere Node.js 24 y npm.

```sh
npm ci
npm run dev -- --hostname 127.0.0.1 --port 3001
```

Abrí [localhost:3001](http://localhost:3001). El puerto 3000 queda disponible para otros proyectos. La agenda calcula la semana en Argentina y usa los mismos archivos que las fichas del archivo. Los horarios se guardan en UTC y se muestran en `America/Argentina/Buenos_Aires`.

### Probar la PWA

El service worker se habilita en producción. Para mantener el desarrollo abierto y probar la PWA en paralelo:

```sh
npm run build:pwa
npm run start:pwa
```

Abrí [localhost:3002](http://localhost:3002). Esta compilación usa `.next-check/pwa`, separada de la de desarrollo. Si cambiás el código, detené ese servidor, repetí la compilación y volvé a iniciarlo. `PORT` permite elegir otro puerto.

1. Abrí una fecha y elegí **Guardar sin conexión**.
2. Esperá la confirmación y abrí **Mi app** para comprobar la descarga.
3. Cerrá la pestaña, activá el modo sin conexión de DevTools y volvé a abrir la misma URL. También podés abrir `/offline.html` para elegir una copia.
4. Recuperá la conexión y guardá la fecha otra vez para actualizarla. Mi app permite eliminar las copias.

Las copias guardan todas las tablas y sesiones de la fecha, su revisión y la fecha de descarga en IndexedDB. El límite es de 20 fechas por dispositivo. El navegador puede eliminar almacenamiento; las descargas y favoritos no se sincronizan entre dispositivos. La vista local muestra cuándo se guardaron los datos.

El manifest incluye iconos de 192/512 píxeles, maskable, Apple y accesos directos. Android ofrece instalación cuando el navegador la habilita; iPhone requiere Compartir → Agregar a inicio. La publicación para teléfonos requiere HTTPS: `localhost` sirve para probar en la computadora, y una dirección HTTP de la red local no equivale a una instalación móvil válida.

La interfaz ofrece actualizar cuando un nuevo worker está esperando. El precaché incluye el lector local, fuentes, iconos y archivos estáticos versionados. Las navegaciones usan red con un límite de espera y recuperan el lector local si falla. El HTML de Next y las respuestas RSC no se reutilizan como páginas de otra versión. No hay cronometraje en vivo ni alertas push en esta entrega.

## Archivo de datos

Las tablas se sirven desde los JSON versionados en `data/archive`. El sitio no consulta a los proveedores cuando un lector abre una ficha.

- **F1:** datos de [F1DB v2026.20.0](https://github.com/f1db/f1db/releases/tag/v2026.20.0) bajo [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/), adaptados a las columnas del sitio. Incluye temporadas desde 1950 y las sesiones y estadísticas publicadas en la edición descargada.
- **TC:** tablas de sesión de 2026, campeonatos desde 2010, lista de pilotos campeones y ganadores históricos desde 1937 según los [resultados](https://tiempos.actc.org.ar/resultados) y el [registro de ganadores de ACTC](https://actc.org.ar/institucional/ganadores). Las fechas con una clasificación incompleta conservan el ganador si está registrado. Las tablas detalladas anteriores a 2026 aún están pendientes.
- **TN:** tablas HTML de APAT para las clases 2 y 3, en las fechas del [archivo de APAT](https://apat.org.ar/resultados/historico) desde 2003. Incluye las posiciones de 2026 y un registro parcial de campeones.

Para reproducir F1: `node scripts/import-f1.mjs <directorio package/data de F1DB>`.

Para actualizar la temporada nacional actual:

```sh
npm run import:tc -- --refresh
npm run import:tn -- --refresh
```

También podés indicar `--year 2026 --through 2026-11-19`. Sin `--current`, el script intenta reconstruir el historial disponible en el proveedor. Los proveedores pueden cambiar la cobertura de sus páginas; una temporada solicitada que no corresponde al documento se rechaza.

El caché de fuentes nacionales caduca a las 24 horas. `--refresh` vuelve a descargarlas. Las tablas nuevas registran URL, momento de descarga y SHA-256. La publicación valida fechas, dimensiones de tablas e identidades de eventos; admite empates históricos. Una fuente fallida, una página de verificación o la pérdida de tablas publicadas cancelan la importación.

Cada publicación escribe temporadas inmutables en `data/archive/<categoría>/revisions`, conserva el índice anterior y reemplaza `index.json` mediante un renombrado atómico. Un bloqueo excluye publicaciones simultáneas de la misma categoría. Si un proceso termina abruptamente y deja `.publish-lock`, comprobá que ya no haya un importador activo antes de retirarlo. La conservación de revisiones requiere revisar el espacio disponible.

La página [Fuentes y cobertura](http://localhost:3001/cobertura) muestra cuántas fechas tienen tablas y explica los faltantes. Tener una tabla no acredita que todas las sesiones de una fecha estén completas. El 19 de noviembre se actualizó TC e incorporó Río Cuarto; la actualización de TN encontró una pantalla de verificación y preservó los datos anteriores.

Los logotipos identifican las categorías. Provienen de [ACTC](https://actc.org.ar/tc), [Formula 1](https://www.formula1.com/en) y [APAT](https://apat.org.ar/).

## Plan

El [plan de evolución](PLAN.md) define las entregas de calidad de datos, UX móvil, PWA con lectura sin conexión, backend editorial, estadísticas, alertas y nuevas categorías. Incluye dependencias, criterios de aceptación y la demo prevista para el portafolio.

## Código

- `src/app` contiene las rutas públicas de Next.js.
- `src/components` contiene las tablas y la navegación compartidas.
- `src/lib/racing.ts` define el modelo de lectura y el formato de fechas, horarios y puntos.
- `src/lib/archive.ts` lee la revisión publicada; `dashboard.ts` arma la agenda desde la misma fuente.
- `src/lib/saved-events.ts` y `public/offline-reader.js` comparten el esquema de descargas locales.
- `src/app/sw.ts` define el service worker y `manifest.ts` la identidad instalable.

## Pilotos y escuderías de F1

La pestaña **Pilotos y escuderías** de cada temporada presenta las escuderías, motores, chasis y pilotos registrados en F1DB. Las fichas internas muestran el campeonato de ese año y los resultados del piloto. Las tablas conservan los identificadores de piloto y constructor junto al texto; filtrar u ordenar no pierde la asociación con su ficha.

Los retratos se identifican mediante OpenF1 y se descargan de la CDN de Formula 1. Se optimizan a WebP de 240 píxeles y se cargan por demanda. Cuando no hay una identificación inequívoca se muestran iniciales. Se consideran el nombre, la abreviatura y la temporada; un apellido compartido no alcanza para asociar una cara. Las imágenes tienen su procedencia registrada en `data/f1-media.json`; la licencia CC BY 4.0 de F1DB corresponde a sus datos.

Para regenerar los retratos y el catálogo desde una distribución F1DB ya descargada:

```sh
node scripts/import-f1-media.mjs .work-import/f1db/package/data
node scripts/import-f1.mjs .work-import/f1db/package/data
```

## Actualización automática

```sh
npm run data:update -- --check
npm run data:watch
```

El worker local revisa el calendario cada 15 minutos y permanece activo mientras el proceso y la computadora sigan encendidos. No consulta proveedores fuera de las ventanas elegidas. Con horarios conocidos, consulta desde una hora antes hasta seis horas después del inicio de cada sesión. Cuando el proveedor no ofrece horarios, usa los tres días de la fecha de 07:00 a 23:00 en Argentina. Si falta una final, reintenta durante los dos días posteriores; TN requiere finales de ambas clases. Al faltar el calendario del año nuevo, intenta obtenerlo los viernes a las 09:00. No depende de que alguien visite la web.

`npm run data:update -- --force --category=f1` permite una revisión manual. Sin `--category`, incluye las tres categorías. No ejecutes simultáneamente dos workers; `.work-import/data-worker.lock` registra el PID y evita duplicados. Si un cierre abrupto deja ese bloqueo, comprobá que el proceso ya terminó antes de retirarlo.

F1 comprueba la última publicación de GitHub de F1DB y descarga una distribución nueva solo si cambia la versión. Comprueba tamaño, URL y SHA-256 del archivo. TC y TN actualizan las fechas recientes y preservan las anteriores; se vuelven a consultar sus campeonatos. Las reducciones inesperadas de filas en una clasificación nacional requieren revisión en vez de publicarse automáticamente.

Los controles registran consulta, éxito o error y publicación por separado en `data/sync/status.json`. Una consulta con resultados idénticos conserva la revisión y la fecha de publicación anteriores. La interfaz ofrece los detalles de la fuente, avisa si está demorada y detecta nuevas revisiones mientras la página está abierta. Ofrece cargar los nuevos resultados para conservar la sesión que el usuario está consultando.

F1DB publica nuevas versiones después de las carreras. La actualización automática no convierte esa fuente en cronometraje en vivo; el momento en que cada resultado aparece depende del proveedor. [F1DB](https://github.com/f1db/f1db) · [Acceso de OpenF1](https://openf1.org/docs/)

### Ejecución alojada

El sitio está publicado en [tiempos-de-pista.netlify.app](https://tiempos-de-pista.netlify.app), conectado a la rama `main` de [JallinskyLuca/tiempos-de-pista](https://github.com/JallinskyLuca/tiempos-de-pista). Netlify usa Node.js 24 y el adaptador oficial `@netlify/plugin-nextjs` declarado en `netlify.toml`, necesario para servir las páginas dinámicas y las APIs. La conexión usa una clave de despliegue de solo lectura y un webhook de cambios del repositorio.

`.github/workflows/update-data.yml` está activo y tiene una programación cada 30 minutos. Primero comprueba el calendario sin instalar dependencias ni consultar proveedores. Solo publica un commit cuando cambian los datos o el estado de disponibilidad de una fuente. Los cambios de `main` disparan un despliegue en Netlify. El control de calendario corre en GitHub, por lo que no depende de que la computadora local esté encendida.

El equipo de Netlify quedó en Free, con recargas automáticas desactivadas. Los despliegues y el uso de la web consumen su cuota compartida; al agotarla el servicio puede pausarse. La publicación frecuente de resultados debe monitorearse dentro de esa cuota. Para cambios de documentación que no requieran desplegar, Netlify admite `[skip netlify]` en el mensaje del commit.

Para comprobar el despliegue con las mismas pruebas de navegador:

```powershell
$env:PLAYWRIGHT_BASE_URL='https://tiempos-de-pista.netlify.app'
$env:PLAYWRIGHT_CHANNEL='chrome'
npm run test:e2e
```

Al definir `PLAYWRIGHT_BASE_URL`, Playwright no inicia el servidor local. Quitá la variable para volver a probar la compilación local.

GitHub puede demorar los cron y deshabilita tareas programadas en repositorios públicos sin actividad durante 60 días. El mecanismo requiere monitoreo y revisar las cuotas del plan; no ofrece una garantía de actualización al minuto. [Condiciones de schedule](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule).

## Verificación

```sh
npm run lint
npm run typecheck
npm run test
npm run build:pwa
npx playwright install chromium
npm run test:e2e
```

Playwright inicia la compilación PWA en 3002 si no está activa. En Windows con Chrome instalado se puede usar `$env:PLAYWRIGHT_CHANNEL='chrome'` antes del último comando. CI ejecuta los controles y usa Chromium.

Las pruebas unitarias cubren límites de fecha argentina, importación, publicación fallida, rectificación e ICS. Las pruebas de navegador cubren filtros, favoritos persistentes, descargas completas, cierre y reapertura sin red, fechas no guardadas y borrado de copias, con vistas de escritorio y móvil. La emulación móvil no reemplaza la comprobación de instalación en Android y iPhone reales. La actualización entre dos versiones desplegadas y las mediciones de rendimiento siguen pendientes.

La [verificación de esta iteración](docs/VERIFICACION.md) registra también los controles de accesibilidad automatizada, fichas de F1, asociación de retratos y ejecución del actualizador.
