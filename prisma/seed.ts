/**
 * Prisma Seed — Production Setup
 *
 * هذا الملف لا يضيف أي بيانات تجريبية.
 * قاعدة البيانات جاهزة لاستقبال البيانات الحقيقية مباشرةً من الواجهة.
 *
 * لتشغيله:  npx prisma db seed
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('✅ Database is clean and ready for real data.')
  console.log('   أضف الفروع والمدربين من واجهة النظام.')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
