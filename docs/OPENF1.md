# OpenF1: resultados y telemetría por sesión

Investigación delegada y verificada el 20 de noviembre de 2026, sin autenticación ni modificaciones a la aplicación.

## Integración implementada en v1.1.0

`scripts/import-openf1.mjs` consulta sesiones de la temporada, las vincula a la agenda publicada y espera `date_end + 30 minutos`. Descarga clasificación, pilotos y vueltas, valida la tanda y publica un índice atómico de revisiones inmutables. Una segunda consulta de FP1/FP2 de Las Vegas conservó la revisión existente. El workflow de GitHub incorpora las sesiones junto con los demás datos y el aviso de nuevas revisiones también las detecta.

El archivo unificado y su API de descarga incluyen las tablas OpenF1. El selector de sesión abre FP1 como estado confirmado y FP2 como clasificación completa; el análisis sigue la sesión elegida. Se ofrece telemetría por piloto/vuelta, comparación por tiempo transcurrido, cinco gráficos SVG y tabla completa de muestras. El endpoint propio permite exclusivamente combinaciones importadas y redirige a copias propias con identificador SHA-256. La mejor vuelta de Russell en FP2 devolvió 381 muestras reales.

La comprobación pública a las 21:00 AR detectó que OpenF1 bloquea globalmente todo acceso gratuito durante las ventanas en vivo, incluido el histórico. Por eso `scripts/import-telemetry.mjs` sincroniza antes de las ventanas: descarga una sesión por piloto, separa intervalos de hasta 180 segundos y publica copias estáticas propias. El servidor de visitas no consulta OpenF1 ni escribe en su disco. La descarga pública es bajo demanda y tiene caché inmutable del CDN; no se precarga toda la telemetría al instalar la PWA. La cola de ingestión separa solicitudes 2.2 segundos y se detiene ante 401/429.

Se recuperaron dos respuestas válidas de la caché local, capturadas a las 20:52 y 20:53 AR antes del bloqueo: Russell FP2/vuelta 20 (381 muestras), auto 51 FP1/vuelta 1 (221 muestras). Las copias registran captura y procedencia. Las demás vueltas permanecen pendientes hasta una sincronización gratuita; no se inventaron ni se consultó un endpoint alternativo para eludir la restricción.

Los filtros de tiempo de la URL usan claves `date>` y `date<`: el signo `=` es el separador de la query, no parte de la clave. Se verificó ese contrato contra la API real. El acceso en vivo sigue sin activarse ni contratarse. No se ha importado todo el histórico de telemetría desde 2023; el archivo consolidado anterior de F1DB sigue conservándose.

## Acceso y costo

[OpenF1](https://openf1.org/) publica histórico gratuito desde 2023. El intervalo en vivo comprende desde 30 minutos antes hasta 30 minutos después de cada sesión; el acceso en vivo requiere suscripción, publicada a €9,90/mes en esta consulta. El plan gratuito permite 3 solicitudes por segundo y 30 por minuto. La respuesta primaria del propio servicio aclara que la restricción es global y alcanza sesiones pasadas: `Live F1 session in progress. Global API access (including past sessions) is restricted to authenticated users until the session ends.` La conclusión inicial de que bastaba esperar el final de la sesión elegida era incompleta. Condiciones y precios pueden cambiar; verificar antes de activar una integración de pago o comercial.

La aplicación de costo cero consulta sesiones después de `date_end + 30 minutos` y fuera de la unión de todas las ventanas en vivo. Para FP3 de Las Vegas, el calendario conocido indica pausa del 20/11 a las 21:00 hasta las 23:00 AR; clasificación pausa del 21/11 00:30 a 02:30 AR. El cron y la disponibilidad del proveedor agregan demoras variables: esto no es cronometraje en vivo. Se conserva F1DB para temporadas, entidades y archivo consolidado.

## Las Vegas 2026 comprobado

| Sesión | session_key | Hora argentina de inicio | Consulta gratuita |
| --- | --- | --- | --- |
| FP1 | 11413 | 19/11 21:30 | Telemetría disponible; `session_result` responde 404 |
| FP2 | 11414 | 20/11 01:00 | 22 resultados, vueltas, telemetría, posición y clima disponibles |
| FP3 | 11415 | 20/11 21:30 | Identificada en calendario |
| Clasificación | 11416 | 21/11 01:00 | Identificada en calendario |
| Carrera | 11420 | 22/11 01:00 | Identificada en calendario |

FP1 terminó sin vueltas cronometradas oficiales debido a la lluvia, según [F1](https://www.formula1.com/en/latest/article/fp1-wet-conditions-limit-running-in-first-practice-at-las-vegas-grand-prix.7H085JgIW1k8jM3ysejVqJ). Su 404 no significa ausencia de toda actividad. Mostrar ese estado solo con confirmación de fuente, no deducirlo de cualquier respuesta 404.

[FP2](https://api.openf1.org/v1/session_result?session_key=11414) respondió con Russell primero en 107.272 segundos y Gasly a 0.071. Se verificaron 21 muestras de `car_data` en cinco segundos de FP2 para Russell y en cinco segundos de FP1 para el auto 51.

## Reglas para implementar el bloque 3

- Proveedor separado, claves estables de meeting/sesión y vínculo a la edición del archivo. No usar la posición del array como identidad de sesión.
- Clasificación desde `session_result`; no inventarla ordenando vueltas. FP1 incluye una vuelta de salida de 1867.424 segundos, con sectores incompletos.
- Validar unidades y valores nulos. Se observaron valores centinela `104` en acelerador/freno: no presentarlos como porcentaje válido.
- Importar primero resultados y vueltas; telemetría por piloto y vuelta elegidos, con filtros temporales acotados, máximo de respuesta y caché compartido.
- Mantener los datos válidos ante respuestas vacías, 429 o fallas, sin reemplazar una clasificación completa con una respuesta parcial.
- No enviar consultas a OpenF1 desde cada teléfono ni sostener un recolector permanente dentro de una función de Netlify.
- Diferenciar hora de consulta y de publicación. Indicar proveedor, cobertura y análisis de sesión finalizada.

Endpoints y esquemas: [documentación oficial](https://openf1.org/docs/), especialmente `sessions`, `session_result`, `drivers`, `laps`, `car_data`, `location`, `weather`, `stints`, `pit` y `race_control`.
