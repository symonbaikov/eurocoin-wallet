# План создания чат-бота — Антифрод помощник

## 📋 Обзор

Создание автоматизированного чат-бота, который появляется через 10 секунд после авторизации пользователя через MetaMask. Чат-бот предлагает помощь жертвам мошенничества и предоставляет возможность расследования подозрительных транзакций через прямую интеграцию с блокчейном и MetaMask.

---

## 🎯 Цели и функциональность

### Основные цели:

1. **Автоматическое появление чата** после 10 секунд авторизации через MetaMask
2. **Предложение помощи** жертвам мошенничества
3. **Интеграция с блокчейном** для анализа транзакций Ethereum
4. **Двуязычная поддержка** (русский/английский) с переводом сообщений
5. **Двустороннее общение с админом** через Telegram интеграцию
6. **Расширяемый интерфейс** для обновления правил и ответов

---

## 📊 Архитектура чат-бота

### Компоненты

```
components/
├── chatbot/
│   ├── chat-widget.tsx          # Основной виджет чата (float button)
│   ├── chat-window.tsx          # Окно чата с историей сообщений
│   ├── chat-message.tsx         # Компонент отдельного сообщения
│   ├── chat-input.tsx           # Поле ввода и кнопка отправки
│   ├── translate-button.tsx     # Кнопка перевода сообщений
│   └── index.ts                 # Экспорт компонентов
├── ui/
│   └── chatbot-modal.tsx        # Модальное окно для чата (опционально)
```

### Hooks

```
hooks/
├── use-chatbot.ts               # Основная логика чат-бота
├── use-transaction-analysis.ts  # Анализ транзакций в блокчейне
├── use-chat-history.ts          # Управление историей сообщений
└── use-chat-translation.ts      # Логика перевода сообщений
```

### API Routes

```
app/api/
└── chatbot/
    ├── analyze-transaction/
    │   └── route.ts             # API для анализа транзакции
    ├── send-message/
    │   └── route.ts              # API для отправки сообщений пользователя
    ├── listen/
    │   └── route.ts              # SSE endpoint для получения ответов админа
    └── admin-response/
        └── route.ts              # API для отправки ответов админа
```

---

## 🚀 Этапы реализации

### Этап 1: Базовый UI компонент (2-3 часа)

#### Задачи:

1. Создать основной виджет чата с float кнопкой в углу экрана
2. Реализовать анимацию появления через 10 секунд
3. Добавить иконку и стили в соответствии с дизайном
4. Интеграция в корневой layout

#### Компонент: `ChatWidget`

```typescript
"use client";

interface ChatWidgetProps {
  delay?: number; // Delay in milliseconds (default: 10000)
  position?: "bottom-right" | "bottom-left";
}
```

#### Функциональность:

- ✅ Появление через 10 секунд после монтирования
- ✅ Показывается только авторизованным пользователям
- ✅ Анимация появления (fade-in + scale)
- ✅ Float позиционирование в правом нижнем углу
- ✅ Кнопка открытия/закрытия чата

---

### Этап 2: Окно чата и система сообщений (3-4 часа)

#### Задачи:

1. Создать компонент окна чата
2. Реализовать историю сообщений
3. Добавить аватары для бота и пользователя
4. Стилизация сообщений (bubble design)

#### Компонент: `ChatWindow`

```typescript
interface ChatMessage {
  id: string;
  type: "bot" | "user";
  text: string;
  timestamp: Date;
  translated?: string; // Translated version
  isTranslated: boolean;
}
```

#### Функциональность:

- ✅ Отображение истории сообщений
- ✅ Приветственное сообщение бота
- ✅ Input field для сообщений пользователя
- ✅ Кнопка отправки
- ✅ Локальное хранение истории (localStorage)
- ✅ Адаптивный дизайн

---

### Этап 3: Интеграция переводчика (2-3 часа)

#### Задачи:

1. Создать компонент кнопки "Перевести"
2. Интеграция с useLanguage hook
3. Логика перевода через API или локальный словарь
4. Переключение между оригиналом и переводом

#### Компонент: `TranslateButton`

```typescript
interface TranslateButtonProps {
  message: ChatMessage;
  onTranslate: (messageId: string) => void;
}
```

#### Функциональность:

- ✅ Кнопка "Перевести" в каждом сообщении
- ✅ Перевод с английского на русский и наоборот
- ✅ Переключение между оригиналом и переводом
- ✅ Отображение статуса перевода (переведено/оригинал)
- ✅ Интеграция с `useLanguage` hook

#### API для перевода:

**Вариант 1:** Использовать Google Translate API (потребуется API key)

```typescript
async function translateText(text: string, targetLang: "ru" | "en"): Promise<string> {
  // Call to Google Translate or similar service
}
```

**Вариант 2:** Использовать предзаготовленный словарь (проще, без API)

```typescript
const translationDict: Record<string, Record<string, string>> = {
  // Pre-defined translations for common phrases
};
```

---

### Этап 4: Логика бота и автоответы (3-4 часа)

#### Задачи:

1. Создать систему обработки сообщений
2. Реализовать базовые автоответы
3. Добавить логику для работы с мошенничеством
4. Интеграция с анализом транзакций

#### Hook: `useChatbot`

```typescript
interface UseChatbotOptions {
  walletAddress?: `0x${string}`;
  locale: "ru" | "en";
}

interface UseChatbotResult {
  messages: ChatMessage[];
  sendMessage: (text: string) => Promise<void>;
  loading: boolean;
  resetChat: () => void;
}
```

#### Базовые автоответы:

```typescript
const BOT_RESPONSES = {
  ru: {
    greeting: "Здравствуйте! Подозреваете, что стали жертвой мошенников? Мы поможем разобраться!",
    fraud_help: "Мы можем проанализировать ваши транзакции через MetaMask и блокчейн Ethereum.",
    analyze_request: "Для анализа транзакции, пожалуйста, введите адрес транзакции (tx hash).",
    // ... more responses
  },
  en: {
    greeting:
      "Hello! Suspect you've become a victim of fraudsters? We will help you figure it out!",
    fraud_help: "We can analyze your transactions through MetaMask and the Ethereum blockchain.",
    analyze_request: "To analyze a transaction, please enter the transaction address (tx hash).",
    // ... more responses
  },
};
```

#### Приветственное сообщение:

```typescript
const WELCOME_MESSAGE = {
  ru: {
    text: "Здравствуйте! Подозреваете, что стали жертвой мошенников? Мы поможем разобраться! Опишите ситуацию – и получите рекомендации по возврату денег.",
    timestamp: new Date(),
  },
  en: {
    text: "Hello! Suspect you've become a victim of fraudsters? We will help you figure it out! Describe the situation – and get recommendations for getting your money back.",
    timestamp: new Date(),
  },
};
```

---

### Этап 5: Анализ транзакций через блокчейн (4-5 часов)

#### Задачи:

1. Создать hook для анализа транзакций
2. Интеграция с wagmi/viem для чтения данных
3. Парсинг и проверка подозрительных транзакций
4. Предоставление деталей пользователю

#### Hook: `useTransactionAnalysis`

```typescript
interface TransactionAnalysisResult {
  isSuspicious: boolean;
  suspiciousReasons: string[];
  transactionDetails: {
    from: string;
    to: string;
    value: string;
    gasUsed: string;
    status: "success" | "failed";
  };
  recommendations: string[];
}

interface UseTransactionAnalysisResult {
  analyzeTransaction: (txHash: string) => Promise<TransactionAnalysisResult>;
  loading: boolean;
  error: Error | null;
}
```

#### Логика определения подозрительности:

```typescript
function checkSuspiciousPatterns(transaction: TransactionData): string[] {
  const reasons: string[] = [];

  // Check 1: High gas price (может указывать на спешку)
  if (transaction.gasPrice > SUSPICIOUS_GAS_PRICE_THRESHOLD) {
    reasons.push("Unusually high gas price detected");
  }

  // Check 2: Address not in contact list
  if (!isKnownAddress(transaction.to)) {
    reasons.push("Recipient address not in your contact list");
  }

  // Check 3: Same day multiple transactions to same address
  if (hasMultipleDailyTransactions(transaction.to)) {
    reasons.push("Multiple transactions to the same address in one day");
  }

  // Check 4: Failed transaction with retries
  if (hasFailedWithRetries(transaction)) {
    reasons.push("Transaction failed and was retried");
  }

  return reasons;
}
```

#### Интеграция с Etherscan API (опционально):

```typescript
async function fetchTransactionDetails(txHash: string): Promise<TransactionData> {
  const response = await fetch(
    `https://api.etherscan.io/api?module=proxy&action=eth_getTransactionByHash&txhash=${txHash}&apikey=${process.env.ETHERSCAN_API_KEY}`,
  );
  return response.json();
}
```

---

### Этап 6: Автоматическое появление после авторизации (1-2 часа)

#### Задачи:

1. Добавить проверку авторизации через wagmi
2. Таймер на 10 секунд после авторизации
3. Управление состоянием показа чата
4. Сохранение статуса (не показывать повторно в одной сессии)

#### Логика:

```typescript
export function useChatbotTrigger() {
  const { isConnected, address } = useAccount();
  const [hasShown, setHasShown] = useState(false);
  const [showChat, setShowChat] = useState(false);

  useEffect(() => {
    if (!isConnected || hasShown) return;

    const timer = setTimeout(() => {
      setShowChat(true);
      setHasShown(true);
      // Store in localStorage to not show again in this session
      sessionStorage.setItem("chatbot-shown", "true");
    }, 10000);

    return () => clearTimeout(timer);
  }, [isConnected, hasShown]);

  return showChat;
}
```

---

### Этап 7: Улучшения UX (2-3 часа)

#### Задачи:

1. Добавить звуковые уведомления (опционально)
2. Typing indicator при обработке запроса бота
3. Анимации сообщений
4. Эмодзи для бота
5. Прогресс-индикатор при анализе транзакций

#### Дополнительные фичи:

- ✅ Skeleton loader при загрузке анализа
- ✅ Toast уведомления о важных событиях
- ✅ Вибрация на мобильных устройствах
- ✅ Темная тема для чата (если сайт в темной теме)

---

### Этап 8: База данных для истории чатов (2-3 часа, опционально)

#### Задачи:

1. Создать схему БД для чатов
2. API для сохранения истории
3. Восстановление истории при повторном открытии

#### Схема БД:

```sql
CREATE TABLE chatbot_sessions (
  id UUID PRIMARY KEY,
  wallet_address VARCHAR(42) NOT NULL,
  locale VARCHAR(2) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE chatbot_messages (
  id UUID PRIMARY KEY,
  session_id UUID REFERENCES chatbot_sessions(id),
  type VARCHAR(10) NOT NULL, -- 'bot' or 'user'
  text TEXT NOT NULL,
  translated_text TEXT,
  is_translated BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### API:

```typescript
// app/api/chatbot/sessions/route.ts
export async function POST(request: Request) {
  const { walletAddress, locale } = await request.json();
  // Create session in DB
}

// app/api/chatbot/messages/route.ts
export async function GET(request: Request) {
  // Get messages for session
}

export async function POST(request: Request) {
  // Save new message
}
```

---

### Этап 9: Двустороннее общение с админом через Telegram (4-5 часов)

#### Задачи:

1. Расширить базу данных для хранения связей админ-пользователь
2. Создать API для уведомления админа в Telegram
3. Интегрировать с существующим Telegram ботом
4. Реализовать SSE для получения ответов админа в реальном времени
5. Добавить возможность админа отвечать через Telegram

#### Схема БД (расширенная):

```sql
-- Обновленная схема для поддержки админ-чата
CREATE TABLE chatbot_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_wallet_address VARCHAR(42) NOT NULL,
  telegram_chat_id BIGINT, -- Для связи с админом в Telegram
  locale VARCHAR(2) DEFAULT 'ru',
  is_admin_mode BOOLEAN DEFAULT FALSE, -- true когда админ отвечает
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE chatbot_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES chatbot_sessions(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL, -- 'user', 'bot', 'admin'
  text TEXT NOT NULL,
  translated_text TEXT,
  is_translated BOOLEAN DEFAULT FALSE,
  is_admin_response BOOLEAN DEFAULT FALSE, -- маркер ответа от админа
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE chatbot_transaction_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES chatbot_sessions(id) ON DELETE CASCADE,
  tx_hash VARCHAR(66) NOT NULL,
  analysis_result JSONB, -- Результаты анализа
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### API: `app/api/chatbot/send-message/route.ts`

```typescript
export async function POST(request: NextRequest) {
  try {
    const { message, sessionId, walletAddress } = await request.json();

    // 1. Сохранить сообщение пользователя
    const messageId = await saveMessage(sessionId, {
      type: "user",
      text: message,
    });

    // 2. Попытаться ответить через бота автоматически
    const botResponse = await generateBotResponse(message);

    if (botResponse.requiresHuman) {
      // 3. Уведомить админа в Telegram
      await notifyAdminInTelegram(sessionId, message, walletAddress);

      return NextResponse.json({
        messageId,
        botResponse: {
          text: "Ваше сообщение передано оператору. Ожидайте ответа.",
          requiresHuman: true,
        },
      });
    } else {
      // 4. Отправить автоответ
      await saveMessage(sessionId, {
        type: "bot",
        text: botResponse.text,
      });

      return NextResponse.json({ messageId, botResponse });
    }
  } catch (error) {
    console.error("Error sending message:", error);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}

// Функция уведомления админа
async function notifyAdminInTelegram(
  sessionId: string,
  userMessage: string,
  walletAddress: string,
) {
  const adminChatId = process.env.TELEGRAM_ADMIN_CHAT_ID;

  await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_API_KEY}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: adminChatId,
      text:
        `🔔 *Новое сообщение от пользователя*\n\n` +
        `💼 Адрес: \`${walletAddress}\`\n` +
        `📝 Сообщение: ${userMessage}\n\n` +
        `💬 Ответить: \`[reply-${sessionId}] Ваш ответ\``,
      parse_mode: "Markdown",
    }),
  });
}
```

#### API: `app/api/chatbot/admin-response/route.ts`

```typescript
export async function POST(request: NextRequest) {
  try {
    const { sessionId, text, adminId } = await request.json();

    // Проверка прав админа (middleware)
    const isAdmin = await verifyAdmin(adminId);
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Сохранить ответ админа
    await saveMessage(sessionId, {
      type: "admin",
      text,
      is_admin_response: true,
    });

    // Отправить пользователю через WebSocket/SSE
    await broadcastToUser(sessionId, text);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error processing admin response:", error);
    return NextResponse.json({ error: "Failed to process response" }, { status: 500 });
  }
}
```

#### Интеграция с существующим Telegram ботом

Обновить `app/api/telegram-webhook/route.ts`:

```typescript
// Добавить обработчик личных сообщений от админа
bot.on("text", async (ctx) => {
  // Проверка, что это сообщение в личке (не команда)
  if (ctx.chat.type === "private" && !ctx.message.text.startsWith("/")) {
    // Формат: [reply-SESSION_ID] текст ответа
    const match = ctx.message.text.match(/^\[reply-([^\]]+)\]\s*(.+)/);

    if (match) {
      const sessionId = match[1];
      const adminResponse = match[2];

      // Отправить ответ пользователю
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/chatbot/admin-response`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          text: adminResponse,
          adminId: ctx.from.id,
        }),
      });

      ctx.reply("✅ Ответ отправлен пользователю");
    } else {
      ctx.reply("❌ Формат: [reply-SESSION_ID] Ваш ответ\n\nДля просмотра активных сессий: /chats");
    }
  }
});

// Новая команда: /chats - показать активные чат-сессии
bot.command("chats", async (ctx) => {
  try {
    const activeSessions = await getActiveChatbotSessions();

    if (activeSessions.length === 0) {
      ctx.reply("📭 Нет активных чат-сессий");
      return;
    }

    let message = "💬 *Активные чат-сессии:*\n\n";
    activeSessions.forEach((session) => {
      const timeAgo = formatTimeAgo(session.updated_at);
      message += `👤 \`${session.user_wallet_address.slice(0, 10)}...\`\n`;
      message += `⏰ ${timeAgo}\n`;
      message += `💬 Ответить: \`[reply-${session.id}] Ваш ответ\`\n\n`;
    });

    ctx.reply(message, { parse_mode: "Markdown" });
  } catch (error) {
    console.error("Error in /chats command:", error);
    ctx.reply("❌ Ошибка при получении чат-сессий");
  }
});
```

#### Функциональность:

- ✅ Уведомление админа в Telegram при сообщении от пользователя
- ✅ Отправка ответов админа через Telegram бота
- ✅ Real-time доставка ответов пользователю через SSE
- ✅ Сохранение всей истории диалога в БД
- ✅ Команда `/chats` для просмотра активных сессий
- ✅ Автоматическое сопоставление session_id с user_id

#### Поток работы:

1. **Пользователь отправляет сообщение:**
   - Сообщение сохраняется в БД
   - Проверка: требует ли ответ человека?
   - Если да → отправка уведомления админу в Telegram

2. **Админ получает уведомление:**

   ```
   🔔 Новое сообщение от пользователя

   💼 Адрес: 0x1234...5678
   📝 Сообщение: Я подозреваю, что стал жертвой мошенников

   💬 Ответить: [reply-session-uuid] Ваш ответ
   ```

3. **Админ отвечает в Telegram:**

   ```
   [reply-abc-123-def] Здравствуйте! Можем помочь. Введите хеш транзакции для анализа.
   ```

4. **Пользователь получает ответ:**
   - SSE-соединение получает новое сообщение
   - Чат обновляется в реальном времени

#### Преимущества решения:

- ✅ Использует существующую Telegram инфраструктуру
- ✅ Не требует отдельной админ-панели
- ✅ Уведомления на мобильном телефоне
- ✅ История сохраняется в БД
- ✅ Гибкость: автоответы + ручные ответы
- ✅ Доступ с любого устройства через Telegram

---

## 🔧 Технические детали

### Стек технологий:

- **Frontend:** React + TypeScript + Next.js 14
- **Styling:** TailwindCSS
- **Web3:** wagmi + viem для блокчейн-запросов
- **State Management:** React hooks (useState, useEffect)
- **Storage:** localStorage для временного хранения, PostgreSQL для постоянного
- **Translation:** Google Translate API или локальный словарь
- **Real-time:** Server-Sent Events (SSE) для получения ответов админа
- **Admin Integration:** Телеграм-бот для двустороннего общения
- **Database:** PostgreSQL с расширенной схемой для чат-сессий

### Зависимости:

```json
{
  "qrcode.react": "^3.1.0", // For QR code generation (if needed)
  "date-fns": "^2.30.0", // For date formatting
  "@google-cloud/translate": "^8.0.0", // If using Google Translate
  "telegraf": "^4.12.0" // For Telegram bot integration
}
```

### Переменные окружения:

```env
# Telegram Bot
TELEGRAM_API_KEY=your_telegram_bot_token
TELEGRAM_ADMIN_CHAT_ID=your_admin_chat_id

# Application
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

---

## 📱 UI/UX Требования

### Дизайн чата:

1. **Float кнопка:**
   - Иконка чата (message-circle или similar)
   - Badge с количеством непрочитанных (если реализовано)
   - Анимация пульсации при первом появлении
   - Размер: 60x60px

2. **Окно чата:**
   - Максимальная ширина: 400px
   - Высота: 600px (на десктопе)
   - Расположение: bottom-right, расстояние от края: 20px
   - Закругленные углы: 20px
   - Тень: elevation-4
   - Backdrop blur при открытии

3. **Сообщения:**
   - Bot messages: слева, фон light-blue
   - User messages: справа, фон primary color
   - Timestamp под каждым сообщением
   - Кнопка "Перевести" под сообщением (если текстовое)

4. **Input:**
   - Placeholder: "Введите сообщение..."
   - Иконка отправки справа
   - Фокус: border-color primary
   - Disabled при loading

---

## 🔒 Безопасность

### Меры безопасности:

1. **Валидация входных данных:**
   - Проверка tx hash формата
   - Ограничение длины сообщений (max 1000 символов)
   - Sanitization перед отображением

2. **Rate limiting:**
   - Ограничение количества запросов (5 анализов в минуту на пользователя)
   - Защита от спама сообщений

3. **Приватность:**
   - Не хранить приватные ключи или seed-фразы
   - Логирование только публичных адресов (masked)
   - GDPR compliance для истории чатов

4. **API Security:**
   - Защита API routes токеном авторизации
   - HTTPS only
   - CORS настройки

---

## 📊 Готовые переводы

### Приветственное сообщение:

**Русский:**

```
Здравствуйте! Подозреваете, что стали жертвой мошенников? Мы поможем разобраться! Опишите ситуацию – и получите рекомендации по возврату денег.

С помощью прямого доступа к сети Ethereum и кошельку MetaMask, мы можем провести прямое расследование подозрительных транзакций.
```

**English:**

```
Hello! Suspect you've become a victim of fraudsters? We will help you figure it out! Describe the situation – and get recommendations for getting your money back.

With direct access to the Ethereum network and your MetaMask wallet, we can conduct direct investigations of suspicious transactions.
```

### Стандартные ответы бота:

**Русский:**

- "Для начала анализа, пожалуйста, введите хеш транзакции или адрес кошелька"
- "Анализирую транзакцию... Это может занять несколько секунд."
- "Обнаружены подозрительные паттерны в транзакции..."
- "Рекомендация: проверьте этот адрес в Etherscan для дополнительной информации"

**English:**

- "To start analysis, please enter the transaction hash or wallet address"
- "Analyzing transaction... This may take a few seconds."
- "Suspicious patterns detected in transaction..."
- "Recommendation: check this address on Etherscan for additional information"

---

## ✅ Чеклист готовности

### Фаза 1: UI готовность

- [ ] Float кнопка появляется через 10 секунд
- [ ] Чат окно открывается/закрывается
- [ ] Сообщения отображаются корректно
- [ ] Адаптивный дизайн работает
- [ ] Темная тема поддерживается

### Фаза 2: Функциональность

- [ ] Отправка сообщений работает
- [ ] История сохраняется локально
- [ ] Кнопка перевода функционирует
- [ ] Автоответы бота работают

### Фаза 3: Блокчейн интеграция

- [ ] Анализ транзакций работает
- [ ] Определение подозрительных паттернов
- [ ] Вывод рекомендаций пользователю
- [ ] Обработка ошибок при анализе

### Фаза 4: Telegram интеграция

- [ ] Уведомления админа работают корректно
- [ ] Ответы админа доставляются пользователю в реальном времени
- [ ] Команда /chats работает
- [ ] Формат [reply-SESSION_ID] работает
- [ ] История сохраняется в БД
- [ ] SSE соединение стабильно

### Фаза 5: Финальная полировка

- [ ] Все анимации работают плавно
- [ ] Нет багов в консоли
- [ ] Производительность оптимизирована
- [ ] Документация обновлена

---

## 🚀 План внедрения

1. **Week 1:** Этапы 1-3 (UI + Переводчик)
2. **Week 2:** Этапы 4-5 (Бот логика + Блокчейн)
3. **Week 3:** Этапы 6-7 (UX + Оптимизация)
4. **Week 4:** Этапы 8-9 (База данных + Telegram интеграция) + Тестирование

---

## 📝 Примечания

> **Важно:**
>
> - Чат-бот должен появляться только один раз в сессии (через 10 секунд)
> - История чата должна сохраняться между обновлениями страницы
> - Перевод работает только для текстовых сообщений
> - Анализ транзакций требует валидный tx hash
> - **Этап 9:** Админ может отвечать через Telegram в реальном времени
> - Для работы админ-чата требуется настройка `TELEGRAM_ADMIN_CHAT_ID`

### 🆕 Что добавлено в плане:

- **Этап 9:** Полная интеграция двустороннего общения с админом через Telegram
  - Уведомления админа о новых сообщениях пользователей
  - Возможность отвечать через Telegram бота
  - Real-time доставка ответов пользователю через SSE
  - Команда `/chats` для просмотра активных сессий
  - Сохранение всей истории диалога в БД
  - Команда в формате `[reply-SESSION_ID] Ваш ответ` для ответа пользователю

---

**Версия документа:** 1.1  
**Дата создания:** 23 октября 2025  
**Последнее обновление:** 23 октября 2025  
**Статус:** Draft - Ready for implementation
