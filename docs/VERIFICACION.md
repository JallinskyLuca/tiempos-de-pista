# Verificación de UX, F1 y actualización de datos

## Reanudación y sincronización de FP3 · noche del 20 de noviembre de 2026

OpenF1 volvió a admitir consultas gratuitas fuera de la ventana global. La ejecución alojada `44854978194`, iniciada desde GitHub, terminó correctamente y publicó `925d098`: FP3 tiene 22 clasificados y 633 registros de vueltas, además de FP2 (22/413) y FP1 (estado oficial sin tiempos, 20 registros). Se prepararon 1.059 intervalos de telemetría para 60 combinaciones sesión/piloto: 18 FP1, 410 FP2, 631 FP3.

El despliegue de datos `6b00ffb7f16c14c1218c9a72` se observó listo. El dominio público devolvió FP3 con 22 filas y las tres primeras posiciones coincidentes con OpenF1. Una copia de FP3, auto 63/vuelta 2, respondió HTTP 200 con 380 muestras. La selección válida mantiene `no-store`; piloto inexistente devuelve 404 y query no permitida 400. Esto cierra la comprobación pendiente de caché entre pilotos.

Se agregó selección por identificador estable `openf1:<session_key>`, manteniendo los índices numéricos anteriores como compatibilidad. Un test controla que agregar FP3 no reasigne un enlace de FP2. Las pruebas de navegador ahora eligen FP2 de forma explícita, verifican FP3, y comprueban que FP1 conserve su identidad al recargar. Compilación PWA, TypeScript, 37 pruebas unitarias y 24 pruebas de navegador locales aprobadas con los datos nuevos. La comprobación pública del selector se registra tras su despliegue.

## Integraciones de v1.1.0 · 20 de noviembre de 2026

### Ajustes detectados en la publicación

La primera comprobación de Netlify detectó dos problemas que no se veían localmente. El comentario de hosting que Netlify inserta en el head causaba hidratación React #418 y eliminaba la preferencia del tema. Se aisló quitando únicamente ese comentario en una prueba controlada: desapareció el error. El inicializador del tema se movió al comienzo del body, antes del contenido; la prueba ahora reproduce ese comentario también en CI y verifica persistencia sin errores.

La telemetría devolvió 401 global desde OpenF1 al comenzar la ventana de FP3 a las 21:00 AR, incluyendo las sesiones históricas. Se corrigió la investigación inicial y se cambió a ingestión anticipada con copias estáticas propias. Se conservaron legítimamente 381 muestras de Russell FP2/vuelta 20 y 221 del auto 51 FP1/vuelta 1, capturadas antes del bloqueo. El endpoint sirve esas copias desde el propio CDN incluso con OpenF1 restringido. Las demás vueltas se muestran pendientes hasta una sincronización gratuita; no se activó el plan pago ni se intentó evadir el 401.

La versión corregida pasó compilación de producción, TypeScript, lint, 36 pruebas unitarias y las 22 pruebas de navegador existentes localmente. Una prueba adicional de CDN verifica ambas copias, sus identificadores, rangos y cabeceras inmutables. La pausa de ambos importadores se comprobó sin consultar el proveedor durante la ventana cerrada. La primera ingestión amplia queda pendiente de la reapertura de la fuente; el algoritmo de división por vueltas y la conservación de identidad se verifican con fixtures.

La revisión pública adicional detectó que el CDN compartía una redirección cacheada entre valores distintos de query. La selección por sesión/piloto/vuelta ahora usa `no-store` tanto para navegador como para Netlify CDN; solo se cachea el JSON identificado por hash. La redirección es relativa para conservar el dominio visible y el cliente verifica también sesión, piloto y vuelta del cuerpo antes de dibujar. La prueba de identidad rechaza una respuesta que pertenece a otro piloto.

Se completaron resultados y análisis de sesiones F1 terminadas, logos de once escuderías 2026, calendario destacado/descendente, tema claro persistente y Wake Lock voluntario. La versión de package y lockfile es 1.1.0.

- Compilación PWA de producción, TypeScript y lint aprobados. 33 pruebas unitarias y 22 pruebas Playwright aprobadas en escritorio y móvil. El ajuste visual posterior de los ejes se recompiló y repitió sus dos pruebas de comparación, lint y verificación visual con datos reales.
- Las Vegas FP2: clasificación con 22 pilotos y 413 registros de vueltas. FP1: 20 registros de vueltas y estado oficial sin tiempos cronometrados, sin inventar clasificación.
- Endpoint propio con datos reales: Russell, FP2, vuelta 20, HTTP 200 y 381 muestras; primera consulta medida en 904 ms y segunda en 9 ms mediante caché local validada. Son mediciones puntuales, no garantías de latencia del hosting. FP1, auto 51, HTTP 200 con 221 muestras y actividad superior a 100 km/h.
- Los cinco gráficos se renderizaron con datos reales sin errores de JavaScript. La vista de 360 px no desbordó horizontalmente; los ejes usan texto HTML que conserva tamaño legible al reducir el SVG. Capturas en `.work-import/previews` no versionadas.
- Los once logos locales cargaron. Axe no encontró infracciones en las vistas revisadas de ambos temas. La preferencia clara sobrevivió una recarga; el lector sin conexión también hereda esa elección.
- Wake Lock se probó con API controlada: adquisición, liberación al ocultar, recuperación al volver, liberación al navegar y rechazo por el dispositivo. Falta comprobar el comportamiento en teléfonos físicos y sus modos de ahorro de batería.
- Una segunda importación OpenF1 no cambió el índice ni las revisiones. El workflow integra su consulta/publicación; clasificaciones parciales, datos de otra sesión y valores inválidos se rechazan por pruebas. No se activó ni contrató acceso en vivo.

La telemetría es de sesiones importadas, por selección y con conexión. No se afirma haber importado todo el histórico OpenF1 desde 2023 ni ofrecer cronometraje en vivo. El archivo histórico F1DB se conserva.

## Entrega inicial de v1.1.0 · 20 de noviembre de 2026

Home editorial general y centros separados de F1, TC y TN, noticias breves internas y cinco resúmenes oficiales importados (tres F1, uno TC y uno TN). La asociación de las prácticas 2026 de Las Vegas no incluye el resumen histórico de 2025 publicado esta semana.

Comprobado localmente: lint y TypeScript sin errores, compilación de producción PWA, 26 pruebas unitarias y 14 pruebas Playwright en escritorio y móvil. La auditoría Axe pasó para Home y los tres centros; las capturas de 360 px no muestran desbordamiento horizontal. La prueba del reproductor intercepta la respuesta del iframe para comprobar su carga y cierre sin reproducir contenido remoto. YouTube oEmbed respondió HTTP 200 y canal correcto para los resúmenes de F1 FP2, TC Río Cuarto y TN Concordia. Esto no garantiza permisos de reproducción en todas las regiones.

Se comprobó que la Home no solicita YouTube, ytimg ni googlevideo antes de una acción. Las pruebas existentes de descarga completa y reapertura sin red siguen pasando. Las noticias iniciales son una selección editorial revisada, no un feed automático. Los demás bloques de v1.1.0, incluida la integración por sesión de OpenF1, siguen pendientes.

La investigación de OpenF1 verificó resultados FP2 y muestras reales de telemetría de FP1/FP2 sin autenticación. [OPENF1.md](OPENF1.md) registra claves, fuentes y validaciones necesarias; no se presenta esa investigación como una integración ya implementada.

La aplicación del commit `5f7615b` quedó publicada en Netlify el 20/11/2026 a las 23:15 UTC, despliegue `6b00d47196755c9d745b3ce2`, estado `ready`. Las 14 pruebas Playwright pasaron contra el dominio HTTPS público después de ajustar los selectores de iframe al reproductor de la aplicación: la página alojada incluye un iframe adicional ajeno al reproductor. Se mantiene la comprobación de cero solicitudes a YouTube antes de pulsar. GitHub CI también terminó correctamente para ese commit. Una segunda importación de videos conservó exactamente la misma huella SHA-256 de la biblioteca, evitando publicaciones vacías.

19 de noviembre de 2026. Entorno local Windows, Node.js 24, Next.js 16.4.6. Producción compilada con Webpack y Serwist; desarrollo con Turbopack.

## Resultado comprobado

- Lint sin advertencias, TypeScript y compilación de producción correctos.
- 22 pruebas unitarias: fechas argentinas, importación, consistencia de identidad, publicación, rectificación, recuperación de fuentes y selección de ventanas de actividad.
- 10 pruebas Playwright en Chrome, con pantallas de escritorio y móvil: favoritos, descargas, reapertura sin red, archivo no descargado, borrado de copias, filtros, fichas internas, retratos y cambio de sesión.
- Las pantallas de grilla y fecha de F1, inicio, archivo, fecha de TC, posiciones de TN, descargas y apoyo pasan los controles automatizados Axe de WCAG 2 A/AA y 2.1 AA ejecutados por los tests. También se comprobó el reflujo a 360 píxeles. Esto verifica los controles automatizados de esas pantallas, no certifica la accesibilidad integral del sitio.
- El acceso principal a resultados se verifica con contraste de texto mínimo 4.5:1. Los controles de descarga se verifican con altura mínima de 44 píxeles.
- Validación estructural de las 187 temporadas publicadas: 77 de F1, 86 de TC y 24 de TN. La validación estructural no confirma por sí sola la exactitud deportiva de cada registro histórico.
- El empaquetado de datos del despliegue pasó de 354 archivos JSON / 75.2 MiB a 190 / 34.1 MiB al excluir revisiones retiradas. Es tamaño de datos del servidor, no descarga inicial al teléfono. Las revisiones retiradas se conservan en el repositorio para recuperación.

## Comportamiento de las fuentes

La consulta inicial a F1DB encontró la misma versión publicada y no reemplazó el contenido por una edición vacía. TC verificó las fuentes y conservó la revisión al no encontrar cambios. APAT devolvió una pantalla de verificación y el importador de TN terminó con error, conservando sus archivos publicados. El estado de la fuente se muestra en cobertura y en el detalle de actualización.

El worker local quedó activo y su revisión de calendario sin actividad no consultó a los proveedores. La selección de ventanas de actividad, la recuperación de una final pendiente y el corte de reintentos se prueban con relojes controlados.

## Alcance pendiente

Las capturas y tests se encuentran en `.work-import/previews` y no se versionan como contenido del sitio. La prueba móvil es emulación de pantalla en Chrome. Queda verificar instalación en Android y iPhone físicos, actualización de PWA entre despliegues y rendimiento móvil medido. El worker local depende de que la computadora siga encendida; el workflow alojado indicado a continuación funciona desde GitHub.

## Despliegue verificado el 20 de noviembre de 2026

Sitio público: [tiempos-de-pista.netlify.app](https://tiempos-de-pista.netlify.app). Versión de aplicación publicada: commit `935bf1c`, con Node.js 24 y el adaptador oficial de Next.js para Netlify. El equipo usa Free y tiene las recargas automáticas desactivadas.

Se configuró una clave de despliegue de solo lectura para el repositorio y un webhook de cambios. El push de la corrección inició automáticamente la compilación de Netlify. La visibilidad del sitio permite visitas sin iniciar sesión en Netlify.

Comprobaciones sobre el dominio público, sin credenciales de visitante:

- Portada, archivos de F1/TC/TN, fichas de piloto y escudería, API de resultados, API de revisiones e ICS respondieron con HTTP 200.
- Manifest, service worker y lector sin conexión respondieron con tipo de contenido correcto. El worker se sirve con `no-cache, no-store, must-revalidate`.
- Las 10 pruebas Playwright pasaron contra el dominio HTTPS publicado, en escritorio y pantalla móvil. Incluyen guardar una fecha completa, cerrar la página, abrirla nuevamente sin red, cambiar la sesión guardada y eliminar la copia.
- Las pruebas de contraste y accesibilidad de las pantallas revisadas pasaron sobre la versión alojada. La validación del estado HTTP evita confundir la página 404 del proveedor con una pantalla válida del producto.
- Se observaron ejecuciones programadas exitosas del workflow de actualización en GitHub. Sus ventanas de actividad y la conservación de datos ante errores se validan también con las pruebas unitarias del proyecto.

La instalación y apertura en teléfonos físicos sigue pendiente; la emulación móvil y el modo sin red del navegador no la sustituyen. Las cuotas del hosting y la demora de publicación de cada proveedor siguen condicionando la operación.
