/**
 * ==============================================================================
 * 📸 Instagram Unfollowers Tracker (Script para Navegador)
 * Compatible con: Brave, Google Chrome, Opera, Edge
 * ==============================================================================
 * 
 * ¿QUÉ HACE ESTE SCRIPT?
 * 1. Analiza de forma 100% LOCAL en tu navegador a quiénes sigues y quiénes te siguen.
 * 2. Compara ambas listas y te muestra exactamente:
 *    - Quiénes NO te siguen de vuelta (Unfollowers).
 *    - Tus seguidores mutuos.
 *    - Tus "Fans" (personas que te siguen pero tú no sigues).
 * 3. Inyecta una interfaz visual elegante y moderna dentro de Instagram.
 * 4. Permite filtrar por nombre/usuario y exportar la lista a CSV o copiarla al portapapeles.
 * 5. NO realiza acciones automáticas dañinas (como unfollow masivo), por lo que es seguro.
 * 
 * INSTRUCCIONES DE USO:
 * 1. Abre https://www.instagram.com e inicia sesión en tu cuenta.
 * 2. Abre la consola de desarrollador:
 *    - En Windows: Presiona F12 o Ctrl + Shift + J
 *    - En Mac: Presiona Cmd + Option + J
 * 3. Si tu navegador te muestra una advertencia de seguridad ("Don't paste code" / "Detente"),
 *    escribe: allow pasting  (o 'permitir pegar') y presiona Enter.
 * 4. Pega TODO este código en la consola y presiona Enter.
 * ==============================================================================
 */

(function () {
  'use strict';

  // Eliminar instancia previa si ya estaba abierta
  const EXISTING_HOST = document.getElementById('ig-unfollowers-root');
  if (EXISTING_HOST) {
    EXISTING_HOST.remove();
  }

  // Helper para leer cookies
  function getCookie(name) {
    const match = document.cookie.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'));
    return match ? decodeURIComponent(match[3]) : null;
  }

  const userId = getCookie('ds_user_id');
  const csrfToken = getCookie('csrftoken') || '';
  const igAppId = '936619743392459'; // Identificador oficial web de Instagram

  // Crear contenedor con Shadow DOM para aislar estilos
  const host = document.createElement('div');
  host.id = 'ig-unfollowers-root';
  document.body.appendChild(host);
  const shadow = host.attachShadow({ mode: 'open' });

  // Estado de la aplicación
  const state = {
    userId: userId,
    username: '',
    fullName: '',
    profilePic: '',
    following: [],
    followers: [],
    notFollowingBack: [],
    fans: [],
    mutual: [],
    activeTab: 'notFollowingBack', // notFollowingBack | mutual | fans | following
    searchQuery: '',
    status: 'idle', // idle | scanning | completed | error
    progressMessage: '',
    progressPercent: 0,
    isCancelled: false,
    delayMs: 1800, // Tiempo de espera prudente entre páginas para evitar bloqueos
  };

  // Estilos CSS de la interfaz moderna
  const styles = `
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }

    .modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(8px);
      z-index: 9999999;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: fadeIn 0.25s ease-out;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: scale(0.97); }
      to { opacity: 1; transform: scale(1); }
    }

    .modal-card {
      width: 90%;
      max-width: 680px;
      max-height: 88vh;
      background: #141416;
      border: 1px solid #2a2a30;
      border-radius: 20px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 30px rgba(225, 48, 108, 0.15);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      color: #f3f4f6;
    }

    /* HEADER */
    .header {
      padding: 18px 24px;
      background: linear-gradient(135deg, #1f1f24 0%, #17171a 100%);
      border-bottom: 1px solid #2a2a30;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .logo-badge {
      width: 42px;
      height: 42px;
      border-radius: 12px;
      background: linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 12px rgba(220, 39, 67, 0.35);
    }

    .logo-badge svg {
      width: 24px;
      height: 24px;
      fill: #ffffff;
    }

    .header-titles h2 {
      font-size: 1.15rem;
      font-weight: 700;
      letter-spacing: -0.3px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .header-titles p {
      font-size: 0.8rem;
      color: #9ca3af;
      margin-top: 2px;
    }

    .close-btn {
      background: #23232a;
      border: 1px solid #32323d;
      color: #9ca3af;
      width: 34px;
      height: 34px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-size: 18px;
      transition: all 0.2s;
    }

    .close-btn:hover {
      background: #dc2626;
      color: #fff;
      border-color: #ef4444;
    }

    /* BODY */
    .body {
      padding: 24px;
      overflow-y: auto;
      flex: 1;
    }

    /* IDLE VIEW */
    .welcome-box {
      text-align: center;
      padding: 20px 10px;
    }

    .welcome-avatar {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      border: 3px solid #e1306c;
      margin: 0 auto 16px;
      display: block;
      object-fit: cover;
      box-shadow: 0 8px 20px rgba(225, 48, 108, 0.3);
    }

    .security-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: rgba(16, 185, 129, 0.12);
      border: 1px solid rgba(16, 185, 129, 0.3);
      color: #34d399;
      padding: 6px 14px;
      border-radius: 999px;
      font-size: 0.8rem;
      font-weight: 600;
      margin-bottom: 20px;
    }

    .info-list {
      background: #1a1a20;
      border: 1px solid #2b2b36;
      border-radius: 14px;
      padding: 16px;
      margin: 20px 0;
      text-align: left;
      font-size: 0.85rem;
      line-height: 1.6;
      color: #d1d5db;
    }

    .info-list li {
      margin-left: 20px;
      margin-bottom: 8px;
    }

    .speed-selector {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 12px;
      margin: 20px 0;
      font-size: 0.85rem;
    }

    .speed-selector select {
      background: #1f1f26;
      border: 1px solid #3b3b47;
      color: #f3f4f6;
      padding: 8px 12px;
      border-radius: 8px;
      outline: none;
      cursor: pointer;
    }

    .btn-primary {
      background: linear-gradient(135deg, #833ab4 0%, #fd1d1d 50%, #fcb045 100%);
      color: #fff;
      font-weight: 700;
      font-size: 1rem;
      padding: 14px 28px;
      border: none;
      border-radius: 12px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 10px;
      box-shadow: 0 10px 25px -5px rgba(225, 48, 108, 0.5);
      transition: all 0.2s;
    }

    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 14px 30px -5px rgba(225, 48, 108, 0.7);
    }

    /* SCANNING VIEW */
    .scanning-container {
      text-align: center;
      padding: 30px 10px;
    }

    .spinner {
      width: 50px;
      height: 50px;
      border: 4px solid rgba(225, 48, 108, 0.2);
      border-top-color: #e1306c;
      border-radius: 50%;
      animation: spin 0.9s linear infinite;
      margin: 0 auto 20px;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .progress-bar-bg {
      width: 100%;
      height: 10px;
      background: #23232b;
      border-radius: 999px;
      overflow: hidden;
      margin: 20px 0 10px;
    }

    .progress-bar-fill {
      height: 100%;
      width: 0%;
      background: linear-gradient(90deg, #833ab4, #fd1d1d);
      border-radius: 999px;
      transition: width 0.3s ease;
    }

    .btn-danger {
      background: #2a1b1e;
      border: 1px solid #7f1d1d;
      color: #f87171;
      font-size: 0.85rem;
      padding: 8px 16px;
      border-radius: 8px;
      cursor: pointer;
      margin-top: 20px;
      transition: all 0.2s;
    }

    .btn-danger:hover {
      background: #ef4444;
      color: white;
    }

    /* COMPLETED VIEW */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
      margin-bottom: 20px;
    }

    .stat-card {
      background: #1b1b22;
      border: 1px solid #2b2b36;
      border-radius: 12px;
      padding: 12px 10px;
      text-align: center;
      cursor: pointer;
      transition: all 0.2s;
    }

    .stat-card:hover {
      border-color: #4b4b5c;
      transform: translateY(-2px);
    }

    .stat-card.active {
      border-color: #e1306c;
      background: rgba(225, 48, 108, 0.08);
      box-shadow: 0 0 15px rgba(225, 48, 108, 0.2);
    }

    .stat-val {
      font-size: 1.4rem;
      font-weight: 800;
      color: #fff;
    }

    .stat-card.active .stat-val {
      color: #e1306c;
    }

    .stat-lbl {
      font-size: 0.72rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #9ca3af;
      margin-top: 4px;
    }

    /* CONTROLS */
    .controls-bar {
      display: flex;
      gap: 10px;
      margin-bottom: 16px;
      flex-wrap: wrap;
    }

    .search-input {
      flex: 1;
      min-width: 180px;
      background: #1b1b22;
      border: 1px solid #2e2e3b;
      padding: 10px 14px;
      border-radius: 10px;
      color: #fff;
      font-size: 0.88rem;
      outline: none;
    }

    .search-input:focus {
      border-color: #e1306c;
    }

    .btn-action {
      background: #23232b;
      border: 1px solid #353542;
      color: #d1d5db;
      font-size: 0.82rem;
      font-weight: 600;
      padding: 0 14px;
      border-radius: 10px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: all 0.2s;
    }

    .btn-action:hover {
      background: #2d2d38;
      color: #fff;
      border-color: #4f4f61;
    }

    /* USER LIST */
    .user-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
      max-height: 420px;
      overflow-y: auto;
      padding-right: 4px;
    }

    .user-list::-webkit-scrollbar {
      width: 6px;
    }

    .user-list::-webkit-scrollbar-thumb {
      background: #333340;
      border-radius: 4px;
    }

    .user-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: #18181f;
      border: 1px solid #262630;
      border-radius: 12px;
      padding: 10px 14px;
      transition: all 0.15s;
    }

    .user-item:hover {
      border-color: #3d3d4e;
      background: #1f1f28;
    }

    .user-info {
      display: flex;
      align-items: center;
      gap: 12px;
      text-decoration: none;
      color: inherit;
      flex: 1;
      min-width: 0;
    }

    .user-avatar {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      object-fit: cover;
      background: #2a2a35;
      flex-shrink: 0;
    }

    .user-texts {
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
    }

    .user-username {
      font-weight: 700;
      font-size: 0.9rem;
      color: #ffffff;
      display: flex;
      align-items: center;
      gap: 5px;
    }

    .user-fullname {
      font-size: 0.78rem;
      color: #9ca3af;
      margin-top: 2px;
    }

    .badge-verified {
      color: #38bdf8;
      font-size: 0.8rem;
    }

    .badge-private {
      color: #fbbf24;
      font-size: 0.8rem;
    }

    .btn-profile {
      background: #272733;
      border: 1px solid #39394a;
      color: #e5e7eb;
      font-size: 0.78rem;
      font-weight: 600;
      padding: 6px 12px;
      border-radius: 8px;
      text-decoration: none;
      transition: all 0.2s;
      flex-shrink: 0;
    }

    .btn-profile:hover {
      background: #e1306c;
      color: #fff;
      border-color: #e1306c;
    }

    .empty-state {
      text-align: center;
      padding: 40px 10px;
      color: #9ca3af;
      font-size: 0.9rem;
    }

    /* FOOTER */
    .footer {
      padding: 12px 24px;
      background: #121215;
      border-top: 1px solid #24242d;
      font-size: 0.75rem;
      color: #6b7280;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .footer a {
      color: #9ca3af;
      text-decoration: none;
    }

    .footer a:hover {
      color: #e1306c;
    }
  `;

  // Funciones de utilidad
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const randomDelay = (base) => base + Math.floor(Math.random() * 600);

  // Intentar obtener info del usuario actual
  async function fetchCurrentUserInfo() {
    if (!state.userId) {
      // Intentar extraer de cookies o de la URL
      const cookiesUserId = getCookie('ds_user_id');
      if (cookiesUserId) state.userId = cookiesUserId;
    }

    if (state.userId) {
      try {
        const res = await fetch(`https://www.instagram.com/api/v1/users/${state.userId}/info/`, {
          headers: {
            'x-ig-app-id': igAppId,
            'x-requested-with': 'XMLHttpRequest',
          },
          credentials: 'include',
        });
        if (res.ok) {
          const data = await res.json();
          if (data && data.user) {
            state.username = data.user.username || '';
            state.fullName = data.user.full_name || '';
            state.profilePic = data.user.profile_pic_url || '';
          }
        }
      } catch (e) {
        console.warn('[IG Unfollowers] No se pudo obtener detalle del perfil:', e);
      }
    }
  }

  // Función para descargar una lista completa (following o followers) con paginación
  async function fetchFullFriendships(type, onProgress) {
    let list = [];
    let maxId = null;
    let hasMore = true;

    while (hasMore) {
      if (state.isCancelled) {
        throw new Error('Operación cancelada.');
      }

      let url = `https://www.instagram.com/api/v1/friendships/${state.userId}/${type}/?count=50`;
      if (maxId) {
        url += `&max_id=${encodeURIComponent(maxId)}`;
      }

      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'x-ig-app-id': igAppId,
          'x-requested-with': 'XMLHttpRequest',
          'x-csrftoken': csrfToken,
        },
        credentials: 'include',
      });

      if (res.status === 429) {
        throw new Error('⚠️ Instagram ha activado un límite temporal (Error 429). Por favor espera unos minutos antes de volver a intentarlo.');
      }

      if (!res.ok) {
        throw new Error(`Error ${res.status} al obtener ${type}. Verifica tu conexión o sesión.`);
      }

      const data = await res.json();
      if (!data.users || !Array.isArray(data.users)) {
        break;
      }

      list.push(...data.users);
      onProgress(list.length);

      if (data.next_max_id) {
        maxId = data.next_max_id;
        // Espera de seguridad entre solicitudes
        await sleep(randomDelay(state.delayMs));
      } else {
        hasMore = false;
      }
    }

    return list;
  }

  // Proceso principal de escaneo
  async function startScan() {
    state.status = 'scanning';
    state.isCancelled = false;
    state.progressPercent = 5;
    state.progressMessage = 'Iniciando escaneo seguro...';
    render();

    try {
      if (!state.userId) {
        throw new Error('No se detectó sesión iniciada en Instagram. Inicia sesión en instagram.com y vuelve a ejecutar el script.');
      }

      // 1. Obtener a quiénes sigues (Following)
      state.progressMessage = 'Obteniendo personas que sigues (Following)...';
      state.progressPercent = 15;
      render();

      const following = await fetchFullFriendships('following', (count) => {
        state.progressMessage = `Obteniendo seguidos: ${count} personas cargadas...`;
        state.progressPercent = Math.min(45, 15 + Math.floor(count / 15));
        render();
      });

      state.following = following;
      state.progressPercent = 50;
      state.progressMessage = `¡Seguidos completados (${following.length})! Esperando 2 segundos para no saturar...`;
      render();

      await sleep(2000);

      // 2. Obtener quiénes te siguen (Followers)
      state.progressMessage = 'Obteniendo personas que te siguen (Followers)...';
      state.progressPercent = 55;
      render();

      const followers = await fetchFullFriendships('followers', (count) => {
        state.progressMessage = `Obteniendo seguidores: ${count} personas cargadas...`;
        state.progressPercent = Math.min(90, 55 + Math.floor(count / 15));
        render();
      });

      state.followers = followers;

      // 3. Comparar las listas usando Map/Set O(N)
      state.progressMessage = 'Comparando listas...';
      state.progressPercent = 95;
      render();

      const followerIds = new Set(followers.map((u) => String(u.pk || u.id)));
      const followingIds = new Set(following.map((u) => String(u.pk || u.id)));

      // No te siguen de vuelta: están en following, pero NO en followers
      state.notFollowingBack = following.filter((u) => !followerIds.has(String(u.pk || u.id)));

      // Fans: están en followers, pero NO en following
      state.fans = followers.filter((u) => !followingIds.has(String(u.pk || u.id)));

      // Mutuos: están en ambos
      state.mutual = following.filter((u) => followerIds.has(String(u.pk || u.id)));

      state.status = 'completed';
      state.progressPercent = 100;
      render();
    } catch (err) {
      console.error(err);
      state.status = 'error';
      state.progressMessage = err.message || 'Ocurrió un error inesperado al escanear.';
      render();
    }
  }

  // Exportar resultados a CSV
  function exportCSV() {
    const listMap = {
      notFollowingBack: { list: state.notFollowingBack, title: 'no_me_siguen' },
      mutual: { list: state.mutual, title: 'seguidores_mutuos' },
      fans: { list: state.fans, title: 'fans' },
      following: { list: state.following, title: 'todos_los_seguidos' },
    };

    const target = listMap[state.activeTab] || listMap.notFollowingBack;
    const rows = [
      ['Username', 'Nombre Completo', 'URL Perfil', 'Es Privado', 'Verificado'],
      ...target.list.map((u) => [
        u.username,
        `"${(u.full_name || '').replace(/"/g, '""')}"`,
        `https://www.instagram.com/${u.username}/`,
        u.is_private ? 'Si' : 'No',
        u.is_verified ? 'Si' : 'No',
      ]),
    ];

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `instagram_${target.title}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  // Copiar lista de usuarios al portapapeles
  function copyUsernames() {
    const listMap = {
      notFollowingBack: state.notFollowingBack,
      mutual: state.mutual,
      fans: state.fans,
      following: state.following,
    };
    const target = listMap[state.activeTab] || state.notFollowingBack;
    const usernames = target.map((u) => '@' + u.username).join('\n');

    navigator.clipboard.writeText(usernames).then(() => {
      alert(`¡Copiados ${target.length} usuarios al portapapeles!`);
    }).catch(() => {
      prompt('Copia los usuarios manualmente:', usernames);
    });
  }

  // Renderizar la vista
  function render() {
    let contentHtml = '';

    if (state.status === 'idle') {
      contentHtml = `
        <div class="welcome-box">
          ${state.profilePic ? `<img src="${state.profilePic}" class="welcome-avatar" />` : ''}
          <div class="security-badge">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            100% Seguro y Local (Sin Contraseñas)
          </div>

          <h3 style="font-size: 1.3rem; margin-bottom: 8px;">
            ${state.username ? `¡Hola, @${state.username}!` : 'Rastreador de No-Seguidores'}
          </h3>
          <p style="color: #9ca3af; font-size: 0.9rem; max-width: 480px; margin: 0 auto 20px;">
            Este script analiza las listas directamente desde tu navegador actual. No comparte tus cookies ni envía tus datos a servidores externos.
          </p>

          <ul class="info-list">
            <li>🔍 <strong>Compara de forma exacta:</strong> detecta quién no te sigue de vuelta, mutuos y fans.</li>
            <li>🛡️ <strong>Respeta los límites de Instagram:</strong> usa pausas automáticas para evitar advertencias de rate-limit.</li>
            <li>💾 <strong>Exportación:</strong> descarga en CSV o copia la lista al portapapeles.</li>
          </ul>

          <div class="speed-selector">
            <label for="speedSelect">Velocidad de escaneo:</label>
            <select id="speedSelect">
              <option value="1800">Normal (Recomendado ~1.8s)</option>
              <option value="2600">Lento (Ultra seguro ~2.6s)</option>
              <option value="1200">Rápido (~1.2s)</option>
            </select>
          </div>

          <button id="btnStart" class="btn-primary">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
            Iniciar Análisis
          </button>
        </div>
      `;
    } else if (state.status === 'scanning') {
      contentHtml = `
        <div class="scanning-container">
          <div class="spinner"></div>
          <h3 style="font-size: 1.15rem; margin-bottom: 8px;">Analizando tu cuenta...</h3>
          <p style="color: #9ca3af; font-size: 0.88rem;">${state.progressMessage}</p>

          <div class="progress-bar-bg">
            <div class="progress-bar-fill" style="width: ${state.progressPercent}%;"></div>
          </div>
          <span style="font-size: 0.75rem; color: #6b7280;">Por favor, mantén esta pestaña abierta mientras finaliza.</span>

          <br />
          <button id="btnCancel" class="btn-danger">Cancelar Escaneo</button>
        </div>
      `;
    } else if (state.status === 'error') {
      contentHtml = `
        <div class="welcome-box">
          <div style="font-size: 40px; margin-bottom: 12px;">⚠️</div>
          <h3 style="color: #ef4444; margin-bottom: 8px;">Ocurrió un problema</h3>
          <p style="color: #d1d5db; font-size: 0.9rem; max-width: 480px; margin: 0 auto 20px;">
            ${state.progressMessage}
          </p>
          <button id="btnRetry" class="btn-primary">Reintentar</button>
        </div>
      `;
    } else if (state.status === 'completed') {
      // Filtrar la lista activa según la búsqueda
      const activeListMap = {
        notFollowingBack: state.notFollowingBack,
        mutual: state.mutual,
        fans: state.fans,
        following: state.following,
      };

      const rawList = activeListMap[state.activeTab] || state.notFollowingBack;
      const q = state.searchQuery.toLowerCase().trim();
      const filteredList = q
        ? rawList.filter((u) => u.username.toLowerCase().includes(q) || (u.full_name && u.full_name.toLowerCase().includes(q)))
        : rawList;

      contentHtml = `
        <div class="stats-grid">
          <div class="stat-card ${state.activeTab === 'notFollowingBack' ? 'active' : ''}" data-tab="notFollowingBack">
            <div class="stat-val" style="color: #f43f5e;">${state.notFollowingBack.length}</div>
            <div class="stat-lbl">No te siguen</div>
          </div>
          <div class="stat-card ${state.activeTab === 'mutual' ? 'active' : ''}" data-tab="mutual">
            <div class="stat-val" style="color: #10b981;">${state.mutual.length}</div>
            <div class="stat-lbl">Mutuos</div>
          </div>
          <div class="stat-card ${state.activeTab === 'fans' ? 'active' : ''}" data-tab="fans">
            <div class="stat-val" style="color: #3b82f6;">${state.fans.length}</div>
            <div class="stat-lbl">Fans</div>
          </div>
          <div class="stat-card ${state.activeTab === 'following' ? 'active' : ''}" data-tab="following">
            <div class="stat-val">${state.following.length}</div>
            <div class="stat-lbl">Seguidos</div>
          </div>
        </div>

        <div class="controls-bar">
          <input 
            type="text" 
            id="searchInput" 
            class="search-input" 
            placeholder="🔍 Buscar por usuario o nombre..." 
            value="${state.searchQuery}" 
          />
          <button id="btnCopy" class="btn-action" title="Copiar nombres de usuario">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
            Copiar
          </button>
          <button id="btnExport" class="btn-action" title="Descargar como archivo CSV para Excel">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            CSV
          </button>
          <button id="btnRescan" class="btn-action" title="Volver a escanear">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"></polyline><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg>
            Reescanear
          </button>
        </div>

        <div class="user-list">
          ${
            filteredList.length === 0
              ? `<div class="empty-state">No se encontraron usuarios en esta categoría.</div>`
              : filteredList
                  .map(
                    (u) => `
              <div class="user-item">
                <a href="https://www.instagram.com/${u.username}/" target="_blank" class="user-info">
                  <img 
                    src="${u.profile_pic_url || 'https://instagram.com/static/images/web/mobile_nav_type_logo.png/735145cfe0a4.png'}" 
                    class="user-avatar" 
                    loading="lazy" 
                    onerror="this.src='https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png'" 
                  />
                  <div class="user-texts">
                    <div class="user-username">
                      @${u.username}
                      ${u.is_verified ? '<span class="badge-verified" title="Verificado">✓</span>' : ''}
                      ${u.is_private ? '<span class="badge-private" title="Cuenta Privada">🔒</span>' : ''}
                    </div>
                    <div class="user-fullname">${u.full_name || 'Sin nombre público'}</div>
                  </div>
                </a>
                <a href="https://www.instagram.com/${u.username}/" target="_blank" class="btn-profile">
                  Ver Perfil ↗
                </a>
              </div>
            `
                  )
                  .join('')
          }
        </div>
      `;
    }

    shadow.innerHTML = `
      <style>${styles}</style>
      <div class="modal-backdrop">
        <div class="modal-card">
          <div class="header">
            <div class="header-left">
              <div class="logo-badge">
                <svg viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
              </div>
              <div class="header-titles">
                <h2>Rastreador de No-Seguidores</h2>
                <p>Análisis en tiempo real de seguidos vs seguidores</p>
              </div>
            </div>
            <button id="btnClose" class="close-btn" title="Cerrar ventana">✕</button>
          </div>

          <div class="body">
            ${contentHtml}
          </div>

          <div class="footer">
            <span>🛡️ Modo seguro: Solo lectura (GET). Sin unfollow automático.</span>
            <span>Local & Privado</span>
          </div>
        </div>
      </div>
    `;

    // Eventos
    const btnClose = shadow.getElementById('btnClose');
    if (btnClose) {
      btnClose.onclick = () => host.remove();
    }

    const backdrop = shadow.querySelector('.modal-backdrop');
    if (backdrop) {
      backdrop.onclick = (e) => {
        if (e.target === backdrop) host.remove();
      };
    }

    const btnStart = shadow.getElementById('btnStart');
    if (btnStart) {
      const speedSelect = shadow.getElementById('speedSelect');
      if (speedSelect) {
        speedSelect.onchange = (e) => {
          state.delayMs = parseInt(e.target.value, 10);
        };
      }
      btnStart.onclick = () => startScan();
    }

    const btnCancel = shadow.getElementById('btnCancel');
    if (btnCancel) {
      btnCancel.onclick = () => {
        state.isCancelled = true;
        state.status = 'idle';
        render();
      };
    }

    const btnRetry = shadow.getElementById('btnRetry');
    if (btnRetry) {
      btnRetry.onclick = () => {
        state.status = 'idle';
        render();
      };
    }

    const statCards = shadow.querySelectorAll('.stat-card');
    statCards.forEach((card) => {
      card.onclick = () => {
        state.activeTab = card.getAttribute('data-tab');
        state.searchQuery = '';
        render();
      };
    });

    const searchInput = shadow.getElementById('searchInput');
    if (searchInput) {
      searchInput.oninput = (e) => {
        state.searchQuery = e.target.value;
        const rawList = {
          notFollowingBack: state.notFollowingBack,
          mutual: state.mutual,
          fans: state.fans,
          following: state.following,
        }[state.activeTab] || state.notFollowingBack;

        const q = state.searchQuery.toLowerCase().trim();
        const filteredList = q
          ? rawList.filter((u) => u.username.toLowerCase().includes(q) || (u.full_name && u.full_name.toLowerCase().includes(q)))
          : rawList;

        const listContainer = shadow.querySelector('.user-list');
        if (listContainer) {
          listContainer.innerHTML =
            filteredList.length === 0
              ? `<div class="empty-state">No se encontraron usuarios que coincidan con "${q}".</div>`
              : filteredList
                  .map(
                    (u) => `
                <div class="user-item">
                  <a href="https://www.instagram.com/${u.username}/" target="_blank" class="user-info">
                    <img 
                      src="${u.profile_pic_url || 'https://instagram.com/static/images/web/mobile_nav_type_logo.png/735145cfe0a4.png'}" 
                      class="user-avatar" 
                      loading="lazy" 
                      onerror="this.src='https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png'" 
                    />
                    <div class="user-texts">
                      <div class="user-username">
                        @${u.username}
                        ${u.is_verified ? '<span class="badge-verified" title="Verificado">✓</span>' : ''}
                        ${u.is_private ? '<span class="badge-private" title="Cuenta Privada">🔒</span>' : ''}
                      </div>
                      <div class="user-fullname">${u.full_name || 'Sin nombre público'}</div>
                    </div>
                  </a>
                  <a href="https://www.instagram.com/${u.username}/" target="_blank" class="btn-profile">
                    Ver Perfil ↗
                  </a>
                </div>
              `
                  )
                  .join('');
        }
      };
    }

    const btnExport = shadow.getElementById('btnExport');
    if (btnExport) btnExport.onclick = () => exportCSV();

    const btnCopy = shadow.getElementById('btnCopy');
    if (btnCopy) btnCopy.onclick = () => copyUsernames();

    const btnRescan = shadow.getElementById('btnRescan');
    if (btnRescan) {
      btnRescan.onclick = () => {
        state.status = 'idle';
        render();
      };
    }
  }

  // Inicialización: cargar datos del usuario y abrir ventana inicial
  fetchCurrentUserInfo().finally(() => {
    render();
  });
})();
