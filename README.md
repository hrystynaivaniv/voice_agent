# Voice Agent — веб-інтерфейс для TTS

Веб-сторінка (`docs/`) для озвучки тексту через OpenAI TTS, з бекендом-проксі (`worker/`),
який ховає API-ключ і хоститься на Cloudflare Workers.

## 1. Деплой бекенду (Cloudflare Worker)

```bash
cd worker
npm install
npx wrangler login          # одноразова авторизація в Cloudflare
npx wrangler secret put OPENAI_API_KEY   # вставити свій ключ OpenAI
npx wrangler secret put ACCESS_CODE      # свій довгий код доступу (20+ символів)
```

У `wrangler.toml` вкажіть `ALLOWED_ORIGIN` — домен, де буде GitHub Pages
(напр. `https://khrystyna-ivaniv.github.io`).

(Опційно, для rate limit по IP):

```bash
npx wrangler kv namespace create RATE_LIMIT_KV
# скопіювати id, який видасть команда, у [[kv_namespaces]] у wrangler.toml
```

Деплой:

```bash
npx wrangler deploy
```

Команда виведе URL типу `https://voice-agent.<ваш-субдомен>.workers.dev`.

Скопіюйте цей URL і той самий код доступу, який задали через
`wrangler secret put ACCESS_CODE`, у `docs/app.js`:

```js
const WORKER_URL = "https://voice-agent.<ваш-субдомен>.workers.dev";
const ACCESS_CODE = "<ваш код доступу>";
```

Закомітьте й запуште зміну — сторінка на GitHub Pages підхопить нові значення.

> Код доступу тут — не секрет: сторінка й репозиторій публічні, тож будь-хто
> може подивитись `app.js` у DevTools і побачити код. Реальний захист від
> зловживань — rate limit у воркері та billing limit в OpenAI (нижче), а сам
> код доступу лишається лише формальним бар'єром. Підходить, якщо ви повністю
> довіряєте аудиторії сторінки.

## 2. Деплой фронтенду (GitHub Pages)

1. Запушити цей репозиторій на GitHub.
2. Settings → Pages → Source: `Deploy from a branch`, папка `/docs`.
3. Сторінка з'явиться на `https://<username>.github.io/<repo>/`.

## 3. Використання

Відкрити сторінку → обрати модель/голос → вставити текст → «Прослухати» /
«Зберегти mp3». Жодних додаткових полів вводити не потрібно — `WORKER_URL`
і `ACCESS_CODE` вже вшиті у сторінку.

## 4. Захист бюджету

Обов'язково встановіть ліміт видатків в OpenAI (Billing → Usage limits) —
це головний запобіжник від несподіваного рахунку, незалежно від коду.

## Локальна CLI-версія

`VoiceAgent.py` лишається окремим інструментом для пакетної озвучки `content.docx`
речення-за-реченням — веб-сторінка це не замінює, а доповнює для точкової озвучки
одного фрагмента тексту з обраним голосом/промптом.
