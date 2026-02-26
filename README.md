## LinkTree OTI Sud (Coolify-ready)

### What it is
- **Frontend**: fichiers statiques dans `public/` (`index.html`, `admin.html`, `app.js`, `admin.js`, `styles.css`)
- **Backend**: `server.js` (Express) sert `public/` + API
- **Data (shared for everyone)**: `data/page-data.json` (modifiable via `admin.html`)

### Run locally

```bash
npm install
npm start
```

Puis ouvrez:
- `http://localhost:3000/` (page publique)
- `http://localhost:3000/admin.html` (éditeur)

### API
- `GET /api/page-data` → récupère les données
- `PUT /api/page-data` → sauvegarde les données (JSON)
- `DELETE /api/page-data` → reset vers `data/page-data.default.json`

### Security (important)
En production, définissez une variable d’environnement **`ADMIN_TOKEN`**.  
L’éditeur enverra `Authorization: Bearer <token>` pour sauvegarder/reset.

### Deploy with Coolify
- **Build**: utilise le `Dockerfile`
- **Port**: `3000`
- **Env**: `ADMIN_TOKEN` (recommandé)
- **Persistent storage**: montez un volume sur **`/app/data`** (sinon les changements seront perdus à chaque redeploy)


