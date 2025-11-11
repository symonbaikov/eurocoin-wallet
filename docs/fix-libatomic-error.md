# Исправление ошибки libatomic.so.1 при билде в продакшене

## Проблема

При билде в продакшене возникает ошибка:
```
node: error while loading shared libraries: libatomic.so.1: cannot open shared object file: No such file or directory
Error: Command "npm run build" exited with 127
```

## Причина

Отсутствует системная библиотека `libatomic.so.1`, которая требуется для некоторых нативных модулей Node.js (например, для пакетов с нативными расширениями, таких как `ethers`, `pg`, `canvas`).

## Решения

### Решение 1: Если используете Docker (рекомендуется)

Библиотека уже добавлена в `docker/Dockerfile`. Просто пересоберите образ:

```bash
docker-compose -f docker/docker-compose.prod.yml build --no-cache
docker-compose -f docker/docker-compose.prod.yml up -d
```

### Решение 2: Если деплой на Vercel

Vercel обычно имеет все необходимые библиотеки, но если проблема возникает:

1. **Убедитесь, что используется правильная версия Node.js:**
   - В `package.json` добавлено `"engines": { "node": ">=20.0.0" }`
   - В `.nvmrc` указана версия `20.17.0`
   - В `vercel.json` указано `"nodeVersion": "20.x"`

2. **Проверьте настройки проекта в Vercel Dashboard:**
   - Settings → General → Node.js Version → выберите `20.x`

3. **Если проблема сохраняется**, возможно используется Alpine-based образ. В этом случае:
   - Убедитесь, что не используется `node:alpine` в настройках
   - Vercel должен использовать стандартный Debian-based образ Node.js

### Решение 3: Если деплой на Linux сервер напрямую

#### Для Ubuntu/Debian:
```bash
sudo apt-get update
sudo apt-get install -y libatomic1
```

#### Для CentOS/RHEL/Fedora:
```bash
# CentOS/RHEL 7
sudo yum install -y libatomic

# CentOS/RHEL 8+ / Fedora
sudo dnf install -y libatomic
```

#### Для Alpine Linux:
```bash
apk add --no-cache libatomic
```

### Решение 4: Если используете Netlify

Добавьте в `netlify.toml`:

```toml
[build]
  command = "npm run build"
  
[build.environment]
  NODE_VERSION = "20"
```

Или установите через build command:

```toml
[build]
  command = "apt-get update && apt-get install -y libatomic1 && npm run build"
```

### Решение 5: Если используете собственный сервер

Установите библиотеку и перезапустите Node.js:

```bash
# Ubuntu/Debian
sudo apt-get update && sudo apt-get install -y libatomic1

# Перезапустите приложение
pm2 restart all
# или
systemctl restart your-app-service
```

## Проверка

После установки библиотеки проверьте:

```bash
# Проверьте наличие библиотеки
ldconfig -p | grep libatomic

# Должно вывести что-то вроде:
# libatomic.so.1 (libc6,x86-64) => /usr/lib/x86_64-linux-gnu/libatomic.so.1
```

## Дополнительные зависимости

Если проблема сохраняется, возможно нужны дополнительные библиотеки. Добавьте их:

### Ubuntu/Debian:
```bash
sudo apt-get install -y \
  libatomic1 \
  libstdc++6 \
  libgcc-s1
```

### Alpine Linux (в Dockerfile):
```dockerfile
RUN apk add --no-cache \
  python3 \
  make \
  g++ \
  libatomic \
  libstdc++ \
  libgcc
```

## Проверка версии Node.js

Убедитесь, что используется правильная версия Node.js:

```bash
node --version  # Должно быть v20.x.x или выше
```

Если версия старая, обновите Node.js или используйте nvm:

```bash
nvm install 20
nvm use 20
```

## Если проблема на Vercel

Vercel автоматически устанавливает необходимые библиотеки. Если проблема возникает:

1. **Проверьте версию Node.js в настройках проекта:**
   - Vercel Dashboard → Settings → General → Node.js Version
   - Должна быть `20.x`

2. **Убедитесь, что в `package.json` указана правильная версия:**
   ```json
   {
     "engines": {
       "node": ">=20.0.0",
       "npm": ">=10.0.0"
     }
   }
   ```

3. **Проверьте `.nvmrc` файл:**
   ```
   20.17.0
   ```

4. **Проверьте `vercel.json`:**
   ```json
   {
     "nodeVersion": "20.x"
   }
   ```

5. **Пересоберите проект через Vercel Dashboard:**
   - Deployments → Click "..." → Redeploy

## Если проблема на собственном сервере с PM2

После установки библиотеки:

```bash
# Перезапустите PM2
pm2 restart all

# Или перезапустите конкретное приложение
pm2 restart web-wallet
```

## Логи для диагностики

Если проблема сохраняется, проверьте логи:

```bash
# Docker
docker-compose -f docker/docker-compose.prod.yml logs web-prod

# PM2
pm2 logs web-wallet

# Systemd
journalctl -u your-app-service -f
```

## Альтернативное решение: Использовать другой базовый образ

Если проблема с Alpine Linux, можно использовать Debian-based образ:

```dockerfile
FROM node:20-slim AS base
ENV npm_config_legacy_peer_deps=true

RUN apt-get update && apt-get install -y \
  python3 \
  make \
  g++ \
  libatomic1 \
  && rm -rf /var/lib/apt/lists/*
```

Но текущий Dockerfile с `libatomic` в Alpine должен работать.

## Важно для Vercel

Если вы используете Vercel и проблема сохраняется:

1. **Убедитесь, что не используется Alpine-based образ Node.js**
2. **Проверьте, что в настройках проекта указана версия Node.js 20.x**
3. **Удалите `node: "^25.1.0"` из dependencies в `package.json`** (это неправильный формат)
4. **Используйте `engines.node` вместо этого**

Текущая конфигурация проекта уже исправлена:
- ✅ `package.json` содержит `"engines": { "node": ">=20.0.0" }`
- ✅ `.nvmrc` содержит `20.17.0`
- ✅ `vercel.json` содержит `"nodeVersion": "20.x"`
- ✅ Удален неправильный `"node": "^25.1.0"` из dependencies

Если проблема все еще возникает на Vercel, возможно нужно:
1. Очистить кеш билда в Vercel Dashboard
2. Пересобрать проект заново
3. Проверить, что используется правильный образ Node.js (не Alpine)

