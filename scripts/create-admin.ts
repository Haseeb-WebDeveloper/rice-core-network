import { config } from 'dotenv'
import { resolve } from 'path'
import { createClient } from '@supabase/supabase-js'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') })
config({ path: resolve(process.cwd(), '.env') })

// Validate DATABASE_URL
if (!process.env.DATABASE_URL) {
  console.error('❌ Missing DATABASE_URL environment variable!')
  console.error('   Please set DATABASE_URL in your .env.local file')
  process.exit(1)
}

// Create Prisma client with adapter (same setup as src/lib/prisma.ts)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 15,
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000,
  allowExitOnIdle: true,
})

const adapter = new PrismaPg(pool)

const prisma = new PrismaClient({
  adapter,
  log: ['warn', 'error'],
})

/**
 * Generates a unique referral code
 */
async function generateReferralCode(): Promise<string> {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code: string
  let isUnique = false

  while (!isUnique) {
    code = ''
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }

    const existing = await prisma.user.findUnique({
      where: { referralCode: code },
    })

    if (!existing) {
      isUnique = true
    }
  }

  return code!
}

async function createAdmin() {
  // Load environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY !
  const adminEmail = process.env.ADMIN_EMAIL!
  const adminPassword = process.env.ADMIN_PASSWORD!
  const adminFullName = process.env.ADMIN_FULL_NAME!

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing required environment variables:')
    console.error('   - NEXT_PUBLIC_SUPABASE_URL')
    console.error('   - SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
  }

  if (!adminEmail || !adminPassword) {
    console.error('❌ Missing required admin credentials:')
    console.error('   - ADMIN_EMAIL')
    console.error('   - ADMIN_PASSWORD')
    console.error('\n   Please set these environment variables before running the script.')
    process.exit(1)
  }

  // Create Supabase admin client (uses service role key)
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  console.log('👤 Creating admin account...')
  console.log(`   Email: ${adminEmail}`)

  try {
    // Check if admin user already exists in Prisma
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: adminEmail },
          { role: 'ADMIN' },
        ],
      },
    })

    if (existingUser) {
      console.log('⚠️  Admin user already exists:')
      console.log(`   Email: ${existingUser.email}`)
      console.log(`   Name: ${existingUser.fullName}`)
      console.log(`   Role: ${existingUser.role}`)
      console.log('\n✅ Using existing admin user')
      await prisma.$disconnect()
      await pool.end()
      process.exit(0)
    }

    // Create user in Supabase Auth
    console.log('📝 Creating user in Supabase Auth...')
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true, // Auto-confirm email
    })

    if (authError) {
      // If user already exists in Supabase, try to get them
      if (authError.message.includes('already registered')) {
        console.log('⚠️  User already exists in Supabase Auth, fetching...')
        const { data: existingAuthUser } = await supabaseAdmin.auth.admin.listUsers()
        const user = existingAuthUser?.users.find((u) => u.email === adminEmail)

        if (user) {
          // Generate referral code
          const referralCode = await generateReferralCode()

          // Create Prisma User record
          const prismaUser = await prisma.user.create({
            data: {
              email: adminEmail,
              referralCode,
              role: 'ADMIN',
              isVerified: true,
              isActive: true,
              fullName: adminFullName,
            },
          })

          console.log('✅ Admin account created successfully!')
          console.log(`   User ID: ${prismaUser.id}`)
          console.log(`   Email: ${prismaUser.email}`)
          console.log(`   Name: ${prismaUser.fullName}`)
          console.log(`   Referral Code: ${prismaUser.referralCode}`)
          await prisma.$disconnect()
          await pool.end()
          process.exit(0)
        }
      }

      console.error('❌ Error creating user in Supabase Auth:', authError.message)
      await prisma.$disconnect()
      await pool.end()
      process.exit(1)
    }

    if (!authData.user) {
      console.error('❌ Failed to create user in Supabase Auth')
      await prisma.$disconnect()
      await pool.end()
      process.exit(1)
    }

    console.log('✅ User created in Supabase Auth')

    // Generate referral code
    const referralCode = await generateReferralCode()

    // Create Prisma User record
    console.log('📝 Creating user in database...')
    const prismaUser = await prisma.user.create({
      data: {
        email: adminEmail,
        referralCode,
        role: 'ADMIN',
        isVerified: true,
        isActive: true,
        fullName: adminFullName,
      },
    })

    console.log('\n✅ Admin account created successfully!')
    console.log(`   User ID: ${prismaUser.id}`)
    console.log(`   Email: ${prismaUser.email}`)
    console.log(`   Name: ${prismaUser.fullName}`)
    console.log(`   Referral Code: ${prismaUser.referralCode}`)
    console.log(`   Password: ${adminPassword}`)
    console.log('\n⚠️  Please save these credentials securely!')
  } catch (error) {
    console.error('❌ Error creating admin account:', error)
    await prisma.$disconnect()
    await pool.end()
    process.exit(1)
  } finally {
    await prisma.$disconnect()
    await pool.end()
  }
}

createAdmin()

