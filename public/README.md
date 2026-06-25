# Activos públicos

Vite sirve los archivos de esta carpeta en la raíz del sitio (`/`).

## Logo de marca

Colocá tu logo de BioWellness acá como **`logo.png`** (o `logo.svg`). Lo usan el
header, el login y la landing vía el componente `BioWellnessLogo`
(`src/components/BioWellnessLogo.tsx`), que lo referencia como `/logo.png`, y el
favicon (`index.html`).

Mientras el archivo no exista, la app muestra un wordmark cobre de respaldo, así
que nunca se ve una imagen rota.

Recomendado: PNG con fondo transparente, ~512×512 px o mayor (la imagen se
escala por alto manteniendo proporción).
