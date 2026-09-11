# NetTask — ระบบบริหารจัดการงานและฐานความรู้สำหรับวิศวกรเครือข่าย (Network Engineer)

เว็บแอปพลิเคชันระดับ Production ที่ออกแบบมาโดยเฉพาะสำหรับ **Solo Network Engineer** เพื่อจัดการงานประจำวัน ติดตามคลังอุปกรณ์ฮาร์ดแวร์ข้ามไซต์/ดาต้าเซ็นเตอร์ วางแผนช่วงเวลาซ่อมบำรุง (Maintenance Window) และสืบค้นคู่มือแก้ไขปัญหา (Troubleshooting KB) ได้อย่างรวดเร็วภายในไม่กี่วินาที

---

## 🌟 ฟีเจอร์หลักและความสามารถเด่น

1. **เพิ่มงานได้สะดวกรวดเร็วเป็นพิเศษ (< 5 วินาที)**
   - **Natural Language Quick Add**: พิมพ์ข้อความภาษาธรรมชาติ เช่น `"Replace SFP SW-HQ-3F-01 tomorrow P2"` ระบบจะตัดคำและแยกชื่ออุปกรณ์, วันกำหนดส่ง, ระดับความสำคัญ (Priority) และประเภทงานให้อัตโนมัติ
   - **การควบคุมงาน Change อย่างเคร่งครัด**: บังคับกรอกแผนย้อนกลับ (Rollback Plan) ทุกครั้งเมื่อประเภทงานเป็น `CHANGE`
   - **Checklists & Notes Timeline แบบอินเทอร์แอคทีฟ**: ติ๊กถูก, สลับลำดับขั้นตอน และบันทึก Time-stamped Notes ระหว่างปฏิบัติงาน
   - **รองรับทั้งมุมมอง Table และ Kanban**: สลับการทำงานระหว่างตาราง TanStack Table (เรียงลำดับ, กรอง, เลือกทำรายการพร้อมกัน) และบอร์ด Kanban แบบลากวาง (Drag-and-Drop) พร้อม Optimistic UI

2. **ฐานความรู้แก้ปัญหาไอที & เครือข่าย ภาษาไทย/อังกฤษ (`/cases`)**
   - **Weighted Full-Text Search**: ค้นหาข้อความแบบถ่วงน้ำหนักด้วย PostgreSQL `tsvector` (`setweight(title, 'A') || setweight(symptom, 'B') || setweight(solution, 'C') || setweight(cause, 'C')`) พร้อมคอนฟิกแบบ `'simple'` รองรับทั้งภาษาไทยและอังกฤษ
   - **ระบบค้นหาทนต่อการพิมพ์ผิด (Typo Tolerance)**: ใช้ Trigram GIN index (`pg_trgm`) ช่วยให้ค้นหาเจอแม้จะสะกดคำตกหล่น
   - **แสดง Root Cause บนการ์ดทันที**: แสดงสาเหตุหลักบนการ์ดผลการค้นหาโดยตรง ทำให้วิศวกรสามารถนำวิธีไปแก้ปัญหาหน้างานได้ทันทีโดยไม่ต้องคลิกเปิดหน้าใหม่
   - **โครงสร้างเนื้อหา 4 ส่วนชัดเจน**: อาการ (Symptom), สาเหตุรากเหง้า (Root Cause), วิธีแก้ไข (Solution พร้อมปุ่มคัดลอกคำสั่ง CLI), และแนวทางป้องกัน (Prevention) พร้อมปุ่มบันทึก "เกิดซ้ำอีกครั้ง (+1)" และ "คัดลอกเป็น Markdown"

3. **ปฏิทินงานซ่อมบำรุงและตารางปฏิบัติงาน (`/calendar`)**
   - พัฒนาด้วย FullCalendar รองรับมุมมองรายเดือน (Month), รายสัปดาห์ (Week) และรายวัน (Day)
   - แยกสีตามประเภทงานชัดเจน (แดง: Incident, ส้ม: Change, น้ำเงิน: Maintenance, ม่วง: Audit, เขียว: Task)
   - รองรับการลากวาง (Drag & Drop) เพื่อเลื่อนวันกำหนดส่งแบบ Real-time
   - แสดงบล็อกช่วงเวลาซ่อมบำรุง (Maintenance Window) ช่วยเตือนเมื่อมีหน้าต่างงานชนกัน

4. **ระบบจัดการอุปกรณ์และไซต์เครือข่าย (`/devices` & `/sites`)**
   - บันทึก Management IP พร้อมปุ่มคลิกคัดลอก (Copy to Clipboard) เพียงคลิกเดียว
   - ระบบเตือนวันหมดอายุการรับประกัน (Warranty) และสัญญา MA (สีแดง: หมดอายุแล้ว, สีส้ม: ใกล้หมดอายุใน 30 วัน, สีเขียว: ปกติ)
   - จัดเก็บข้อมูลผู้ติดต่อฉุกเฉินประจำดาต้าเซ็นเตอร์, ตำแหน่งตู้ Rack และรายการอุปกรณ์ที่สังกัดแต่ละไซต์

5. **รายงานและสถิติภาพรวมเครือข่าย (`/reports`)**
   - กราฟสรุปผลวิเคราะห์ด้วย Recharts (งานที่สร้าง vs งานที่ปิดสำเร็จ, เวลาเฉลี่ยในการกู้คืนระบบ MTTR, ปริมาณงานรายไซต์, สัดส่วนความสำคัญของงาน)
   - ส่งออกข้อมูลเป็น **CSV** ได้ในคลิกเดียวเพื่อใช้ทำรายงานสรุปเสนอผู้บริหาร
   - รองรับการสั่งพิมพ์หน้ารายงาน (`@media print`) ที่ปรับแต่ง Layout ให้บันทึกเป็น PDF สวยงาม

6. **ระบบแจ้งเตือนอัตโนมัติและสำรองข้อมูล (`/settings`)**
   - **แจ้งเตือนสรุปรายวันผ่าน Telegram Bot**: รันตอน 08:00 น. (เวลาประเทศไทย Asia/Bangkok) ส่งสรุปงานค้างกำหนด, งานที่ต้องทำวันนี้ และอุปกรณ์ที่ประกันใกล้หมดอายุ
   - **Vercel Cron**: รันระบบตั้งเวลาอัตโนมัติผ่าน `vercel.json`
   - **One-Click JSON Backup**: ดาวน์โหลดไฟล์สำรองข้อมูลไซต์, อุปกรณ์, งาน, รายการเช็กลิสต์, บันทึก และเคสความรู้ทั้งหมดออกมาเป็นไฟล์ JSON ได้ทันที

7. **รองรับโหมดมืดและสว่างอย่างสมบูรณ์ (Dark / Light Mode)**
   - สลับโหมดการทำงานได้จากเมนูด้านบน รองรับการทำงานทั้งในห้องเซิร์ฟเวอร์มืดๆ และสภาพแวดล้อมสำนักงานสว่าง
   - แถบสถานะ Badge นับจำนวนแบบ Real-time ซ่อนอัตโนมัติเมื่อไม่มีรายการค้าง

---

## 🛠 เทคโนโลยีที่ใช้ (Tech Stack)

- **Framework**: Next.js 15 (App Router, React 19, TypeScript, Server Actions)
- **Database**: PostgreSQL บน Supabase ใช้งานผ่าน Prisma ORM 6.19.3
- **Styling**: Tailwind CSS, Lucide Icons, Next Themes (รองรับ Dark / Light Mode)
- **Data Tables**: TanStack Table v8
- **Calendar**: FullCalendar v6 (DayGrid, TimeGrid, Interaction)
- **Charts**: Recharts
- **Validation**: Zod (พร้อม Regex ตรวจสอบ IPv4 ที่เข้มงวด)
- **Dates**: `date-fns` (ภาษาไทย, ไทม์โซน Asia/Bangkok UTC+7)
- **Deployment**: รองรับ Vercel พร้อมระบบตั้งเวลารัน Cron (`vercel.json`)

---

## 🚀 เริ่มต้นใช้งาน (Getting Started)

### 1. ความต้องการของระบบ (Prerequisites)
- Node.js เวอร์ชัน 18+ หรือ 20+
- ฐานข้อมูล PostgreSQL บน Supabase

### 2. ตั้งค่าตัวแปรสภาพแวดล้อม (Environment Setup)
คัดลอกไฟล์ `.env.example` เป็น `.env` และกรอกข้อมูลการเชื่อมต่อของคุณ:
```bash
cp .env.example .env
```

ตรวจสอบให้แน่ใจว่าได้ระบุ `DATABASE_URL` และ `DIRECT_URL` ของ Supabase ถูกต้อง:
```env
DATABASE_URL="postgresql://postgres.yourprojectref:yourpassword@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.yourprojectref:yourpassword@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres"

NEXT_PUBLIC_SUPABASE_URL="https://yourprojectref.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"

TELEGRAM_BOT_TOKEN="your-bot-token"
TELEGRAM_CHAT_ID="your-chat-id"
CRON_SECRET="your-cron-secret"
```

### 3. เตรียมฐานข้อมูลและดัชนีการค้นหา (Database Migration & Search Indexing)
อัปเดต Schema ไปยังฐานข้อมูล และเปิดใช้งานฟังก์ชันค้นหาภาษาไทย/อังกฤษ:
```bash
# พุช Schema ไปยังฐานข้อมูล Supabase
npx prisma db push

# เปิดใช้งาน GIN indexes และ Triggers สำหรับ Full-Text Search (tsvector + pg_trgm)
npx tsx prisma/apply-search-migration.ts

# เพิ่มข้อมูลตัวอย่าง (Topology เครือข่าย, อุปกรณ์, งาน, และเคสแก้ปัญหา)
npx tsx prisma/seed.ts
```

### 4. สั่งรันโปรเจกต์ (Run Project)

**โหมดสำหรับนักพัฒนา (Development Mode):**
```bash
npm run dev
```

**โหมด Production (แนะนำสำหรับใช้งานจริง - เร็วที่สุด):**
```bash
npm run build
npm run start
```
เปิดเบราว์เซอร์ไปที่ [http://localhost:3000](http://localhost:3000)

---

## ⌨️ คีย์ลัดบนคีย์บอร์ด (Keyboard Shortcuts)

| คีย์ลัด | การทำงาน |
|---|---|
| <kbd>Ctrl</kbd> + <kbd>K</kbd> / <kbd>⌘</kbd> + <kbd>K</kbd> | เปิด Command Palette (ค้นหาเคสความรู้และงานได้ทันที) |
| <kbd>Esc</kbd> | ปิดหน้าต่าง Popup / ยกเลิกการค้นหา |
| <kbd>1</kbd> - <kbd>7</kbd> | นำทางด่วนไปยังหน้าระบบต่างๆ (หน้าแรก, งาน, อุปกรณ์, ไซต์, ฐานความรู้, ปฏิทิน, รายงาน) |

---

## 🛡 สิทธิ์การใช้งาน (License)
ระบบบริหารจัดการการปฏิบัติการวิศวกรรมเครือข่ายภายใน (Internal Network Engineering Operations System) พัฒนาขึ้นเพื่อเน้นความเสถียร ความปลอดภัย และความเร็วในการตอบสนองสูงสุด

