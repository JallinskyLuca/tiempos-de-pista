# OpenF1: resultados y telemetría por sesión

Investigación delegada y verificada el 20 de noviembre de 2026, sin autenticación ni modificaciones a la aplicación.

## Acceso y costo

[OpenF1](https://openf1.org/) publica histórico gratuito desde 2023. El intervalo en vivo comprende desde 30 minutos antes hasta 30 minutos después de cada sesión; el acceso en vivo requiere suscripción, publicada a €9,90/mes en esta consulta. El plan gratuito permite 3 solicitudes por segundo y 30 por minuto. Condiciones y precios pueden cambiar; verificar antes de activar una integración de pago o comercial.

La aplicación de costo cero consultará sesiones después de `date_end + 30 minutos`. El cron de GitHub de 30 minutos y la disponibilidad del proveedor agregan demoras variables: esto no es cronometraje en vivo. Conservar F1DB para temporadas, entidades y archivo consolidado.

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
