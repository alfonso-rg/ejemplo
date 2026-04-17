# Murcia Gol Adventure

Juego web móvil inspirado en plataformas clásicas, ambientado en Murcia.

## Despliegue recomendado

Sí: **Netlify** es una muy buena opción para este proyecto porque es un sitio estático (HTML + CSS + JS sin backend).

### Opción 1 (rápida): Netlify Drop
1. Comprime estos archivos en un `.zip`:
   - `index.html`
   - `styles.css`
   - `game.js`
2. Entra a https://app.netlify.com/drop
3. Arrastra el `.zip` y publica.

### Opción 2 (profesional): Netlify + Git
1. Sube este repo a GitHub/GitLab/Bitbucket.
2. En Netlify: **Add new site** → **Import an existing project**.
3. Configura:
   - Build command: *(vacío)*
   - Publish directory: `.`
4. Deploy.

Con esta opción, cada `git push` redepliega automáticamente.

## Alternativas
- **Cloudflare Pages**: igual de buena para estáticos y con CDN excelente.
- **Vercel**: también sirve, aunque suele brillar más en proyectos con frameworks.
- **GitHub Pages**: la más simple si quieres algo gratis y básico.

## Verificación tras desplegar
- Abrir desde móvil real y comprobar controles táctiles.
- Probar en horizontal y vertical.
- Revisar que el audio se activa tras el primer toque (restricción normal del navegador móvil).
