# FF — хоолны жор Social Network (MVP)

Хоолны жор нийтэлж, хайж, feed дээр үзэж, like/comment хийдэг React Native + Node.js апп.

- `backend/` — Express + TypeScript + PostgreSQL (Prisma)
- `mobile/` — React Native (Expo) + TypeScript. Ижил кодоороо iOS, Android **болон PWA (веб)** гурван хэлбэрээр гарна.
- `recognition/` — Python + FastAPI + YOLO11 (ultralytics), зурган дээрх орцыг тодорхойлох микросервис

## Backend-ийг ажиллуулах

1. PostgreSQL суулгасан байх шаардлагатай. `psql` эсвэл pgAdmin-аар шинэ DB үүсгэ:
   ```sql
   CREATE DATABASE ff_dev;
   ```
2. `.env` файл үүсгэ:
   ```
   cd backend
   cp .env.example .env
   ```
   `.env` доторх `DATABASE_URL`-ийг өөрийн PostgreSQL хэрэглэгч/нууц үг/DB нэртэй тохируул. `JWT_SECRET`-ийг санамсаргүй урт мөрөөр солино уу.
3. Dependency суулгах, migration ажиллуулах, серверийг асаах:
   ```
   npm install
   npx prisma migrate dev --name init
   npm run dev
   ```
   Сервер `http://localhost:4000` дээр асна. `GET /api/health` → `{ "ok": true }` эсэхийг шалгаж болно.

## Орц таних сервис (YOLO11) ажиллуулах

1. Python 3.10+ суулгасан байх шаардлагатай.
2. Dependency суулгах:
   ```
   cd recognition
   pip install -r requirements.txt
   ```
3. Серверийг асаах:
   ```
   uvicorn main:app --host 127.0.0.1 --port 8000
   ```
   Анх ажиллуулахад `yolo11n.pt` жингийн файлыг `ultralytics` автоматаар татаж авна (интернэт холболт шаардлагатай). `GET http://127.0.0.1:8000/health` → `{ "ok": true }` эсэхийг шалгаж болно.
4. `backend/.env` доторх `RECOGNITION_SERVICE_URL="http://127.0.0.1:8000"` утга нь энэ серверийн хаягтай тохирч байгаа эсэхийг шалгана уу.

**Анхаар:** Энэ сервис нь заавал биш нэмэлт боломж — асаагаагүй үед ч жор нийтлэх хэвийн ажиллана, зөвхөн зурган дээрх орцыг автоматаар санал болгох функц идэвхгүй болно. Модель нь COCO дата-сет дээр сургагдсан тул зөвхөн цөөн хэдэн хоол/жимс/ногоо (гадил, алим, жүрж, лууван, брокколи, пицца, хот дог, донат, бялуу, сэндвич) таньдаг — `recognition/food_classes.py` дотор жагсаалтыг харах/өргөтгөх боломжтой.

## Mobile app-ийг ажиллуулах

1. `mobile/src/api/config.ts` доторх `API_BASE_URL`-ийг өөрийн орчинд тохируул:
   - iOS simulator: `http://localhost:4000` (өөрчлөх шаардлагагүй)
   - Android emulator: `http://10.0.2.2:4000`
   - Физик утас дээр Expo Go ашиглаж байгаа бол компьютерийнхээ LAN IP хаяг (жишээ нь `http://192.168.1.20:4000`)
2. Асаах:
   ```
   cd mobile
   npm install
   npx expo start
   ```
   Гарч ирэх QR кодыг Expo Go app-аар уншуулах, эсвэл `i`/`a` дарж simulator/emulator дээр асаана.

## PWA (веб) хувилбар

Апп нь `react-native-web`-ээр дамжуулан веб дээр ажилладаг бөгөөд `mobile/public/` дотор PWA-д шаардлагатай `manifest.json`, `sw.js` (offline service worker), `index.html` бэлэн байгаа.

1. Локал турших:
   ```
   cd mobile
   npx expo start --web
   ```
   Хөтчөөр `http://localhost:8081` (эсвэл Expo-ийн зааж өгсөн порт) нээгээд шалгана. Chrome-ийн адрес мөрөнд "Install" (⊕) товч гарч ирвэл PWA зөв тохирсон гэсэн үг.
2. Production build гаргах:
   ```
   npx expo export -p web
   ```
   `mobile/dist/` фолдер үүснэ — үүнийг статик hosting (Vercel, Netlify, Nginx гэх мэт) дээр deploy хийнэ. **Чухал:** `sw.js` файлыг веб серверийн root-оос (`/sw.js`) яг тэр замаараа serve хийх ёстой (scope нь бүх сайтад хамаарна), тэгэхгүй бол offline caching ажиллахгүй.
3. `mobile/public/manifest.json` доторх icon-ууд одоогоор `assets/icon.png` (1024×1024)-г шууд ашиглаж байгаа тул production-д зориулж 192×192, 512×512 хэмжээст тусдаа PNG үүсгэж солихыг зөвлөж байна.
4. `mobile/app.json`-ийн `web` хэсэгт (`themeColor`, `backgroundColor`, `display` гэх мэт) тохиргоог өөрчилбөл `manifest.json`-ийг мөн тааруулж шинэчлэх хэрэгтэйг анхаараарай — Metro нь зарим талбарыг (жишээ нь theme-color meta, favicon) автоматаар `index.html`-д оруулдаг ч `manifest.json`-ийг гараар удирддаг.

## Тест хийх урсгал

1. Апп нээгээд бүртгүүлэх (Register)
2. "Нийтлэх" tab дээр орж шинэ жор нийтлэх (гарчиг, тайлбар, орц, алхам, зураг). Зураг сонгомогц "Орц тодорхойлж байна..." заалт гараад, орц таних сервис ажиллаж байвал таньсан орцыг жагсаалтад автоматаар нэмнэ.
3. "Жагсаалт" tab дээр буцаж очиход шинэ жор feed дээр харагдана
4. Жор дээр дарж дэлгэрэнгүй нээгээд Like дарах, сэтгэгдэл бичих
5. Feed дээрх хайлтын мөрөнд орц эсвэл гарчгаар хайж шалгах
