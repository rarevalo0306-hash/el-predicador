# Diseño aprobado — The Preacher
Fuente: docs/diseno-aprobado/hoy-logo-verde.png; aprobación expresa del usuario antes de pausar, retomada con «sigamos».
- Verde profundo #103F38, lima #D8F57B, blanco cálido #F6F6F1. Sans serif Figtree existente; mantener preferencias del lector.
- Hoy: fecha real, «Un momento para ti.», fotografía costera grande, referencia diaria real y Abrir lectura. Sin texto bíblico incrustado en imágenes.
- Continuar solo cuando exista lectura guardada; temas Paz y Fortaleza con fotografías, acceso a todos los temas.
- Logo original recoloreado, sin monograma. Barra Hoy/Biblia/Temas/Gente/Más.
- Mantener modo oscuro, foco, controles táctiles y safe areas. Implementación inicial: Hoy y navegación; resto hereda tokens, requiere revisión por pantalla.

## Extensión a las demás pantallas
Biblia usa lista de libros con capítulos, pestañas de testamento y continuación verde. Temas presenta Paz, Fortaleza, Esperanza y Familia como tarjetas fotográficas, con todos los otros temas accesibles bajo el control expandible; búsqueda y detalle conservan funciones. Gente conserva contactos, iglesia y programaciones, con estado vacío claro. Guardados y paneles comparten tipografía sans, radios y superficies. Los textos nuevos viven en design-copy.ts con claves verificadas por TypeScript para ambos idiomas. Mensajes de error bíblico se traducen en la interfaz; contenido y copyright no se traducen ni alteran.

## Paleta vigente: azul y dorado con cristal
La aprobación posterior del usuario sustituye verde/lima: azul profundo #172D4D, dorado #D9BE82, blanco cálido #FAF9F5. Oscuro: fondo #0C1524, superficies #152237, texto #F3F4F7. Logo original recoloreado en public/images/logo-navy.png. Barra inferior flotante y continuación de lectura con transparencia/desenfoque; lectura y formularios sólidos. Fallback opaco si no se admite backdrop-filter o si se solicita menos transparencia/mayor contraste. Es un acabado web inspirado en cristal, no el componente nativo Liquid Glass de Apple.
