# Cómo quitar el fondo del logo

Para quitar el fondo del logo `logo.png`, tienes varias opciones:

## Opción 1: Herramientas Online (Más fácil y rápida)

### Remove.bg (Recomendado)
1. Ve a: https://www.remove.bg/
2. Sube tu archivo `logo.png`
3. La herramienta quitará automáticamente el fondo
4. Descarga la imagen con fondo transparente (PNG)
5. Reemplaza el archivo en `public/logo.png`

### Photopea (Editor online similar a Photoshop)
1. Ve a: https://www.photopea.com/
2. Abre tu `logo.png`
3. Usa la herramienta "Magic Wand" o "Quick Selection"
4. Selecciona el fondo y presiona Delete
5. Guarda como PNG (asegúrate de mantener la transparencia)

## Opción 2: Herramientas de escritorio

### GIMP (Gratuito)
1. Abre GIMP
2. Abre `logo.png`
3. Ve a: Capa → Transparencia → Añadir canal alfa
4. Usa la herramienta "Varita mágica" para seleccionar el fondo
5. Presiona Delete
6. Exporta como PNG

### Photoshop
1. Abre `logo.png` en Photoshop
2. Selecciona el fondo con "Magic Wand" o "Quick Selection Tool"
3. Presiona Delete
4. Guarda como PNG con transparencia

## Opción 3: CSS (Solo para fondos de color sólido claro)

Si el fondo es blanco o un color sólido claro, puedes intentar con CSS, pero **NO es tan efectivo como editar la imagen**. 

El CSS actual ya está configurado para mostrar la imagen. Para mejor resultado, edita la imagen directamente con las herramientas mencionadas arriba.

## Verificación

Después de editar la imagen:
- Guarda como PNG (formato que soporta transparencia)
- Reemplaza el archivo en `public/logo.png`
- Recarga la página para ver el cambio

