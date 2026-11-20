# Verificación de UX, F1 y actualización de datos

## Entrega inicial de v1.1.0 · 20 de noviembre de 2026

Home editorial general y centros separados de F1, TC y TN, noticias breves internas y cinco resúmenes oficiales importados (tres F1, uno TC y uno TN). La asociación de las prácticas 2026 de Las Vegas no incluye el resumen histórico de 2025 publicado esta semana.

Comprobado localmente: lint y TypeScript sin errores, compilación de producción PWA, 26 pruebas unitarias y 14 pruebas Playwright en escritorio y móvil. La auditoría Axe pasó para Home y los tres centros; las capturas de 360 px no muestran desbordamiento horizontal. La prueba del reproductor intercepta la respuesta del iframe para comprobar su carga y cierre sin reproducir contenido remoto. YouTube oEmbed respondió HTTP 200 y canal correcto para los resúmenes de F1 FP2, TC Río Cuarto y TN Concordia. Esto no garantiza permisos de reproducción en todas las regiones.

Se comprobó que la Home no solicita YouTube, ytimg ni googlevideo antes de una acción. Las pruebas existentes de descarga completa y reapertura sin red siguen pasando. Las noticias iniciales son una selección editorial revisada, no un feed automático. Los demás bloques de v1.1.0, incluida la integración por sesión de OpenF1, siguen pendientes.

La investigación de OpenF1 verificó resultados FP2 y muestras reales de telemetría de FP1/FP2 sin autenticación. [OPENF1.md](OPENF1.md) registra claves, fuentes y validaciones necesarias; no se presenta esa investigación como una integración ya implementada.

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
