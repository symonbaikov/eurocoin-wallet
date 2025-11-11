# Исправление ошибки libatomic.so.1 при билде в продакшене

## Проблема

При билде в продакшене возникает ошибка:
```
node: error while loading shared libraries: libatomic.so.1: cannot open shared object file: No such file or directory
Error: Command "npm run build" exited with 127
```

## Причина

Отсутствует системная библиотека `libatomic.so.1`, которая требуется для некоторых нативных модулей Node.js (например, для пакетов с нативными расширениями).

## Решения

### Решение 1: Если используете Docker (рекомендуется)

Библиотека уже добавлена в `docker/Dockerfile`. Просто пересоберите образ:

```bash
docker-compose -f docker/docker-compose.prod.yml build --no-cache
docker-compose -f docker/docker-compose.prod.yml up -d
```

### Решение 2: Если деплой на Linux сервер напрямую

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

### Решение 3: Если используете Vercel/Netlify

Эти платформы обычно имеют все необходимые библиотеки. Если проблема возникает:

1. **Vercel:**
   - Убедитесь, что используете Node.js 20.x
   - Проверьте Build Settings → Node.js Version
   - Если проблема сохраняется, создайте `vercel.json`:

```json
{
  "buildCommand": "npm run build",
  "installCommand": "npm install",
  "framework": "nextjs"
}
```

2. **Netlify:**
   - Добавьте в `netlify.toml`:

```toml
[build]
  command = "npm run build"
  
[build.environment]
  NODE_VERSION = "20"
```

### Решение 4: Если используете собственный сервер

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

1. Проверьте версию Node.js в настройках проекта
2. Убедитесь, что используется `node:20` в `package.json`:

```json
{
  "engines": {
    "node": ">=20.0.0"
  }
}
```

3. Пересоберите проект через Vercel Dashboard

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

