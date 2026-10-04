# 📸 Instagram Unfollowers Tracker

Herramienta diseñada para **Brave, Google Chrome y Opera** para detectar qué personas sigues en Instagram pero **no te siguen de vuelta**.

---

## 🚀 Método 1: Script en la Consola (Rápido y Directo)

Este método inyecta un panel moderno y elegante directamente dentro de tu pestaña de Instagram.

### 📋 Pasos para ejecutarlo:

1. **Abre tu navegador** (Brave, Chrome u Opera).
2. Entra en [Instagram.com](https://www.instagram.com) e inicia sesión con tu cuenta.
3. Abre la consola de desarrollador:
   - **En Windows:** Presiona `F12` o `Ctrl + Shift + J`.
   - **En Mac:** Presiona `Cmd + Option + J`.
   - *(O clic derecho en cualquier parte de la página > "Inspeccionar" > pestaña **Consola** / **Console**)*.
4. **Si el navegador te muestra una advertencia de seguridad en rojo:**  
   *(Ej: "¡Detente!", "Don't paste code here")*  
   Escribe en la consola:
   ```text
   allow pasting
   ```
   *(o en navegadores en español: `permitir pegar`)* y presiona **Enter**.
5. Abre el archivo [`instagram_unfollowers.js`](file:///c:/Users/Parsa/Documents/script%20ig/instagram_unfollowers.js), **copia todo su contenido**, pégalo en la consola de Instagram y presiona **Enter**.
6. ¡Listo! Se abrirá una ventana flotante con:
   - ❌ **No te siguen de vuelta** (tu objetivo principal).
   - 🤝 **Mutuos** (se siguen el uno al otro).
   - 🌟 **Fans** (te siguen pero tú no los sigues).
   - Buscador en tiempo real por nombre de usuario.
   - Botón para **Copiar lista** al portapapeles.
   - Botón para **Descargar CSV** (para abrir en Excel).

---

## ⚡ Truco Pro: Guárdalo como "Snippet" para ejecutarlo en 1 clic siempre

Si no quieres copiar y pegar el código cada vez:

1. En la misma ventana de desarrollador (`F12`), ve a la pestaña superior **Fuentes** (o **Sources**).
2. En el panel izquierdo, busca la pestaña **Fragmentos de código** (o **Snippets**).
3. Haz clic en **+ Nuevo fragmento** (o **+ New Snippet**) y nómbralo `IG_Unfollowers`.
4. Pega el código de [`instagram_unfollowers.js`](file:///c:/Users/Parsa/Documents/script%20ig/instagram_unfollowers.js) en el área de texto central y presiona `Ctrl + S` para guardarlo.
5. A partir de ahora, cada vez que estés en Instagram, solo abres `F12`, vas a Snippets y presionas el botón de **Play (▶)** o `Ctrl + Enter`.

---

## 🛡️ Método 2: Analizador Offline (100% Oficial y Seguro)

Si tienes miles de seguidores y quieres **0% de riesgo de límites de Instagram (Error 429)**, puedes usar los datos oficiales que Meta te entrega.

1. En Instagram ve a: **Configuración** > **Centro de cuentas** > **Tu información y permisos** > **Descargar tu información**.
2. Solicita la descarga seleccionando únicamente **"Seguidores y seguidos"**.
3. Elige formato **JSON** e intervalo de fechas **"Desde el principio"**.
4. Cuando Meta te envíe el archivo ZIP (suele tardar unos minutos), descomprímelo.
5. Abre en tu navegador el archivo: [`analizador_offline.html`](file:///c:/Users/Parsa/Documents/script%20ig/analizador_offline.html)
6. Arrastra `following.json` y `followers_1.json` a la pantalla.
7. Al instante verás la lista completa con estadísticas, buscador y exportación.

---

## 🔒 Privacidad y Seguridad

- **Sin contraseñas:** Ninguna de las dos herramientas te pide contraseñas ni tokens personales.
- **100% Local:** Todo el procesamiento ocurre dentro de tu propia computadora / navegador.
- **Sin unfollow automático:** No realiza acciones agresivas que puedan poner en riesgo tu cuenta de Instagram.
