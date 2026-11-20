# Plan de evolución de Tiempos de Pista

Documento de trabajo del 19 de noviembre de 2026.

La siguiente versión se organiza en [el plan de v1.1.0](docs/V1.1.0.md), con Home general, centros por categoría, resúmenes oficiales, datos por sesión F1, logos, calendario destacado, temas y Wake Lock. Se implementa y verifica por entregas.

### Iteración de UX y automatización

Se consolidó el CSS en un sistema de contraste, controles de 44 px, foco visible y acciones principales distinguibles. La elección de sesión usa un selector para reducir la cantidad de botones; la información de actualización se despliega bajo demanda. `DESIGN.md` registra la dirección visual.

F1 incorpora un catálogo por temporada de pilotos, escuderías, motores y chasis, fichas internas, referencias estables por fila y retratos identificados mediante OpenF1. El piloto del día muestra la distinción y el porcentaje de votos provistos por F1DB. No se atribuye una cara por una coincidencia ambigua de apellido.

El worker local consulta fuentes en ventanas de actividad y conserva datos válidos ante errores. Una consulta sin cambios no renueva la fecha de publicación. El workflow de GitHub está activo y el repositorio está conectado al despliegue público de Netlify desde el 20 de noviembre de 2026. Los perfiles de F1 incorporados cubren la temporada elegida; la trayectoria consolidada entre temporadas, las fichas nacionales y la calculadora siguen pendientes.

## Avance de implementación

Primera entrega implementada en el repositorio: agenda dinámica en hora argentina, lectura compartida con el archivo, importadores nacionales parametrizados con caché renovable y procedencia, validación y publicación atómica recuperable. Se actualizó TC con Río Cuarto; APAT devolvió una pantalla de verificación y TN conservó la edición anterior.

La UX incorpora navegación móvil, archivo por año, filtros y ordenamiento de tablas, fechas adyacentes, favoritos persistentes, exportación ICS y una página de fuentes y cobertura. La PWA tiene manifest, iconos, aviso de actualización, descargas explícitas en IndexedDB y un lector que recupera las fechas guardadas al navegar sin red.

Comprobado mediante pruebas: cierre y reapertura sin conexión, conservación de favoritos, sesiones y filas completas de una descarga, fecha sin descarga, eliminación, filtros, manifest e ICS en Chromium con vistas de escritorio y móvil. Lint, TypeScript, pruebas unitarias y compilación de producción forman parte del control del proyecto.

Las entregas 1–3 tienen avances y criterios pendientes. Falta normalizar pilotos y tiempos, ampliar los faltantes históricos, conservar todos los filtros en URL, búsqueda global, agenda guardada automáticamente, medir rendimiento y verificar instalación real y actualización entre versiones. Las entregas 4–8 continúan pendientes; este avance no las da por terminadas. La conexión de Neon y el despliegue requieren configurar las cuentas correspondientes.

## Objetivo

Construir una web de consulta de automovilismo argentino e internacional que permita seguir la actividad del fin de semana, explorar resultados e historias de pilotos y volver desde una aplicación instalada en el teléfono. Mantener la lectura rápida, las tablas accesibles y el objetivo de costo mensual cero dentro de las cuotas de los proveedores.

La primera entrega pública sólida abarca TC, F1 y TN, con una PWA instalable, fechas guardadas para lectura sin conexión y un circuito editorial de publicación y rectificación. Las siguientes entregas incorporan comparaciones, simulación de campeonatos, alertas y nuevas categorías.

## Punto de partida

El repositorio tiene Next.js App Router, TypeScript estricto, React y Tailwind. Sirve archivos JSON locales, con rutas internas por categoría, temporada, fecha y sesión. Tiene marcas oficiales y una página de apoyo con el alias indicado por el titular.

Problemas identificados al redactar el plan; consultar el avance anterior para ver cuáles ya se abordaron.

- La portada usa una edición fija y duplica una parte de los resultados y campeonatos.
- Los importadores tienen el año y la fecha de corte fijados en el código. El caché de descarga se reutiliza sin caducidad.
- La presencia de una tabla importada acredita disponibilidad en la fuente. La validación semántica por época, categoría y sesión requiere trabajo adicional.
- La cobertura histórica es desigual. En TC hay fechas con ganador y sin clasificación completa. En TN faltan posiciones históricas y parte de los campeones.
- El modelo actual está organizado alrededor de columnas de texto. Identificar pilotos y calcular estadísticas exige normalizar las entidades.
- La PWA, la base de datos, la autenticación, el panel editorial y las alertas están pendientes.

## Entregas y criterios de aceptación

| Orden | Entrega | Resultado que verifica su cierre |
| --- | --- | --- |
| 1 | Actualidad y calidad de datos | Home y archivo muestran el mismo resultado. Una actualización incorpora una fecha nueva sin editar componentes. Una importación fallida conserva la edición publicada. |
| 2 | UX de consulta y personalización | En móvil se puede encontrar una fecha, cambiar de sesión, buscar un piloto y volver al calendario conservando los filtros. Los favoritos sobreviven al cierre de la app. |
| 3 | PWA instalable y lectura sin conexión | Un usuario instala el sitio, guarda una fecha y vuelve a consultar sus resultados en modo avión. Una nueva versión se activa de forma controlada. |
| 4 | Backend y panel editorial | Un editor importa, revisa, publica y rectifica una clasificación con permisos comprobados e historial de cambios. |
| 5 | Pilotos, circuitos y herramientas | Desde una clasificación se abre la trayectoria de un piloto. Dos pilotos pueden compararse por temporada y una simulación de campeonato muestra sus supuestos. |
| 6 | Recordatorios y continuidad | El usuario elige categorías y anticipación, recibe una alerta y abre la sesión correcta. Puede revocar la suscripción desde el sitio. |
| 7 | Más categorías y comunidad | Cada categoría nueva tiene fuente, calendario, resultados, reglas y cobertura comprobados. El prode cierra y puntúa correctamente. |
| 8 | Publicación y caso de portafolio | La versión publicada pasa la matriz de pruebas y tiene una demo reproducible con evidencias de funcionamiento. |

## 1. Actualidad y calidad de datos

Unificar la portada y el archivo detrás del mismo acceso a datos. Calcular la semana en la zona de Argentina y clasificar sesiones por su fecha y estado confirmado. Mostrar la fecha de actualización, la condición provisional o rectificada y el alcance del historial cuando ayuden al lector.

Parametrizar temporada, fecha de corte y actualización del caché en los scripts. Separar descarga, extracción, normalización, validación y publicación. Guardar URL, fecha de descarga, versión del importador y huella del contenido para cada revisión.

Agregar identificadores estables para categorías, clases, pilotos, equipos, circuitos, eventos y sesiones. Conservar el texto original y modelar tiempos en milisegundos, diferencias de vueltas y estados de llegada por separado. Las sesiones históricas necesitan representar formatos de clasificación, autos compartidos, empates y sistemas de puntos de su época.

Probar errores que podrían publicar información incorrecta. Incluir una respuesta que devuelve otra temporada, posiciones repetidas válidas, nombres ambiguos, tiempos con coma, un documento incompleto y una rectificación que cambia al ganador. Publicar una revisión completa en una operación y conservar la anterior para recuperación.

Crear una matriz de cobertura por categoría, año y tipo de dato. Priorizar finales y posiciones faltantes de TC y TN. Cada ampliación histórica debe quedar comprobada contra su fuente.

## 2. UX de consulta y personalización

Usar una navegación móvil con accesos a Inicio, Calendario, Archivo y Favoritos. Mantener el selector de categoría y el acceso de apoyo. En escritorio, aprovechar el espacio para agenda y campeonato sin duplicar controles.

Mejorar las tablas con encabezados persistentes, piloto identificable al desplazar horizontalmente, filtros por nombre, ordenamiento con estado visible y resaltado de favoritos. Conservar filtros en la URL para compartir una sesión o una búsqueda.

Agregar búsqueda de pilotos y circuitos, navegación entre fechas anterior y siguiente, favoritos locales y una agenda con las categorías elegidas. Exportar sesiones a calendario mediante archivos ICS con identificadores estables y horas correctas.

Revisar contraste, foco, lector de pantalla, interacción táctil, tamaños de texto y estados vacíos. Consolidar las reglas CSS duplicadas en un sistema de componentes y variables de diseño. Medir rendimiento con una configuración móvil reproducible y registrar el tamaño de JavaScript de las rutas principales.

## 3. PWA instalable y lectura sin conexión

Implementar manifest con identidad estable, nombre, alcance, modo standalone, colores, accesos directos e iconos propios de la app en 192 y 512 píxeles, variantes maskable e icono para Apple.

Incorporar un service worker con Serwist, verificando primero la integración con la versión instalada de Next.js y su compilación Webpack. Hacer una prueba pequeña de instalación, actualización y navegación antes de extender las reglas de caché. La instalación necesita HTTPS en la versión publicada. La interfaz ofrecerá la instalación cuando el navegador exponga esa capacidad y explicará el flujo de agregar a inicio en iPhone. [Instalación PWA](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable) · [Serwist](https://serwist.pages.dev/docs/next/getting-started)

El comportamiento previsto es el siguiente.

| Contenido | Estrategia prevista |
| --- | --- |
| Interfaz, fuentes e iconos | Precaché versionado con un presupuesto medido. |
| Agenda y resultados recientes | Priorizar red con plazo de espera y recuperar la copia guardada si falla. Mostrar cuándo se guardó. |
| Fecha elegida por el usuario | Descargar sus datos públicos y disponer de una vista de lectura local. IndexedDB guarda los datos y su revisión. |
| Pantalla sin contenido guardado | Explicar qué se puede consultar y ofrecer los eventos disponibles localmente. |
| Sesión del editor, borradores y escrituras | Acceso de red y controles del servidor. |

La descarga debe indicar progreso, éxito y errores. Incluir límites de espacio, borrado de descargas y recuperación cuando el navegador elimina almacenamiento. Cargar el archivo histórico por demanda evita descargar décadas de datos al instalar. [Funcionamiento sin conexión](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Offline_and_background_operation)

Diseñar explícitamente el manejo de HTML, respuestas de React Server Components y assets de distintas versiones. Ofrecer un aviso de actualización y conservar las dependencias necesarias de las pestañas abiertas durante la transición.

Verificar instalación y apertura standalone en Android y iPhone reales. Probar modo avión después de cerrar y abrir, conexión lenta, descarga interrumpida, caché eliminado y actualización desde una versión anterior. Registrar qué pudo verificarse en cada dispositivo.

## 4. Backend y panel editorial

Mantener un monolito modular con módulos de calendario, resultados, archivo, usuarios e importaciones. Las páginas y las rutas usan servicios compartidos para acceso y reglas del dominio.

Incorporar PostgreSQL en Neon con migraciones e índices derivados de las consultas reales. Usar transacciones, restricciones únicas y publicaciones idempotentes. Conservar los JSON actuales como base de importación reproducible y generar lecturas públicas que puedan servirse desde caché.

Implementar Better Auth, rol editorial y segundo factor para publicar. Validar las entradas en servidor, comprobar permisos en cada operación y usar consultas parametrizadas. Las importaciones aceptan proveedores definidos y límites de tamaño y tiempo. Conservar secretos en servidor y registros de auditoría sin credenciales.

Agregar vista previa, diferencias entre revisiones, publicación, rectificación y recuperación. Probar el acceso denegado, el reintento de una importación y dos editores intentando publicar simultáneamente.

## 5. Pilotos, circuitos y herramientas

Las fichas de piloto mostrarán participaciones, equipos o marcas, resultados por año y estadísticas calculadas sobre la cobertura disponible. Resolver homónimos y cambios de formato del nombre antes de consolidar trayectorias.

Las fichas de circuito reunirán categorías, ediciones y ganadores. Los récords incluirán categoría, sesión, trazado y fecha para que la comparación sea interpretable.

Agregar comparador de dos pilotos con filtro de temporada y sesiones. Graficar la evolución de puntos con carga diferida y ofrecer la tabla equivalente.

Construir la calculadora de campeonato con reglas versionadas por categoría y temporada. Para TC contemplar etapa regular, Copa de Oro, requisitos de victoria, ingreso de último minuto, puntajes especiales y desempates confirmados en el reglamento correspondiente. Los escenarios deben poder reiniciarse y compartirse.

## 6. Recordatorios

Los archivos ICS de la entrega 2 cubren primero la agenda personal. Implementar Web Push después de disponer de suscripciones persistentes y un emisor programado.

Solicitar permiso al activar una alerta, registrar categoría y anticipación, eliminar suscripciones vencidas, evitar duplicados y dirigir cada aviso a su fecha o sesión. Verificar el tratamiento de horarios modificados y la cancelación. En iOS, Web Push está disponible para apps agregadas a la pantalla de inicio desde iOS 16.4. [WebKit](https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/)

La compatibilidad y la entrega deben probarse en cada plataforma. El envío programado corre en el backend y su frecuencia depende de las cuotas del proveedor elegido.

## 7. Nuevas categorías y comunidad

Ampliar primero con MotoGP y después evaluar TC2000, IndyCar, WEC, WRC y Fórmula E. Cada integración necesita modelar sus particularidades. WEC requiere tripulaciones y clases, y WRC tramos y penalizaciones. La selección de la siguiente categoría depende de la calidad y cobertura de sus fuentes.

Para prode, definir puntajes, cierre de pronósticos por tiempo del servidor, edición permitida y recalculado ante sanciones. Los comentarios necesitan identidad, controles de frecuencia, reportes y moderación.

Integrar cronometraje en vivo cuando haya un feed con cobertura y acceso comprobados. Conservar la distinción entre un inicio previsto y un estado confirmado.

## 8. Publicación y evidencia para el portafolio

Medir navegación por teclado, contraste, tablas extensas y pantallas de 360 píxeles. Usar Playwright para los flujos críticos y Vitest para importación, fechas, puntuación y permisos. Ejecutar las verificaciones en CI antes de publicar.

Revisar los límites gratuitos, las condiciones del hosting para el modelo de apoyo económico y el consumo del emisor de alertas antes de elegir el despliegue definitivo. Preparar caché público, copias recuperables del contenido editorial y métricas sin información personal innecesaria. Los servicios gratuitos tienen cuotas que condicionan el uso. [Neon Free](https://neon.com/pricing) · [Vercel Hobby](https://vercel.com/docs/plans/hobby)

La demo del portafolio debe mostrar una secuencia reproducible.

1. Instalar la PWA en un teléfono.
2. Seguir una categoría y guardar una fecha.
3. Cerrar la app, activar modo avión y consultar esa fecha.
4. Recuperar la conexión y recibir una actualización del resultado.
5. Publicar una rectificación desde el panel y comprobar el historial.
6. Abrir la trayectoria de un piloto y simular una definición de campeonato.

Publicar el diagrama de arquitectura, las decisiones de caché, una matriz de cobertura, resultados medidos de rendimiento y un video corto de la demo.

## Primer bloque de implementación

Empezar por la entrega 1 y el diseño del flujo móvil de la entrega 2.

1. Reemplazar la edición fija por una agenda basada en la fecha de Argentina y la fuente compartida del archivo.
2. Parametrizar importadores y renovar el caché con registro de procedencia.
3. Agregar validación de temporada, sesión, identidades y revisión antes de publicar.
4. Mostrar cobertura y última actualización, y resolver las finales recientes pendientes de TC.
5. Definir las pantallas de Inicio, Calendario, Archivo, Favoritos y lectura de fecha guardada.

Cerrar ese bloque cuando una nueva fecha pueda incorporarse y verse en toda la web sin cambiar JSX, y una importación defectuosa preserve los datos publicados. Luego implementar la PWA instalable y la descarga explícita de fechas.
