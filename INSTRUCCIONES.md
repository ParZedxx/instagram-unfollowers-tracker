# Instagram Unfollowers Tracker

Herramienta para **Brave, Chrome y Opera** para ver quiénes no te siguen de vuelta en Instagram.

---

## Cómo usar el script

1. Abre tu navegador (**Brave, Chrome u Opera**).
2. Entra en [instagram.com](https://www.instagram.com) con tu cuenta.
3. Abre la consola de desarrollador:
   - En Windows: `F12` o `Ctrl + Shift + J`
   - En Mac: `Cmd + Option + J`
   - Ve a la pestaña **Consola** (o *Console*).
4. Si el navegador te muestra una advertencia de seguridad, escribe:
   ```text
   allow pasting
   ```
   *(o `permitir pegar` si tu navegador está en español)* y presiona **Enter**.
5. Abre [`instagram_unfollowers.js`](instagram_unfollowers.js), copia el código, pégalo en la consola de Instagram y presiona **Enter**.
6. Se abrirá la ventana con:
   - **No te siguen de vuelta**
   - **Mutuos**
   - **Fans**
   - Buscador por nombre y usuario
   - Opciones para copiar y exportar en CSV

---

## Guardarlo como Snippet (para no copiarlo cada vez)

1. En la consola (`F12`), ve a la pestaña **Fuentes** (o *Sources*).
2. En la barra lateral izquierda, busca **Fragmentos de código** (o *Snippets*).
3. Haz clic en **+ Nuevo fragmento** y llámalo `IG_Unfollowers`.
4. Pega el código de [`instagram_unfollowers.js`](instagram_unfollowers.js) y guarda con `Ctrl + S`.
5. Cada vez que estés en Instagram, vas a Snippets y le das a **Play (▶)** o `Ctrl + Enter`.
