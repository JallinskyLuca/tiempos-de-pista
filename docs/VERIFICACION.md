# Verificación de UX, F1 y actualización de datos

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
