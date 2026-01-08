import { config } from 'dotenv'
import { resolve } from 'path'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import { createClient } from '@supabase/supabase-js'

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') })
config({ path: resolve(process.cwd(), '.env') })

// Validate environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:')
  console.error('   - NEXT_PUBLIC_SUPABASE_URL')
  console.error('   - SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

// Validate DATABASE_URL
if (!process.env.DATABASE_URL) {
  console.error('❌ Missing DATABASE_URL environment variable!')
  console.error('   Please set DATABASE_URL in your .env.local file')
  process.exit(1)
}

// Create Prisma client with adapter
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

// Create Supabase admin client
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function deleteAuthForTestUsers() {
  console.log('🗑️  Deleting Supabase Auth accounts for test users...\n')

  try {
    // Fetch all users from Supabase Auth
    console.log('📋 Fetching all users from Supabase Auth...')
    let allUsers: any[] = []
    let page = 1
    const perPage = 1000

    while (true) {
      const { data, error } = await supabaseAdmin.auth.admin.listUsers({
        page,
        perPage,
      })

      if (error) {
        throw error
      }

      if (!data?.users || data.users.length === 0) {
        break
      }

      allUsers = allUsers.concat(data.users)

      // If we got less than perPage, we're done
      if (data.users.length < perPage) {
        break
      }

      page++
    }

    // Filter for test users (@test.com emails)
    const testUsers = allUsers.filter((user) => user.email?.includes('@test.com'))

    if (testUsers.length === 0) {
      console.log('⚠️  No test users found in Supabase Auth.')
      return
    }

    console.log(`📋 Found ${testUsers.length} test users to delete\n`)

    let successCount = 0
    let errorCount = 0

    // Process users in batches to avoid rate limiting
    const batchSize = 10
    const totalBatches = Math.ceil(testUsers.length / batchSize)

    for (let i = 0; i < testUsers.length; i += batchSize) {
      const batch = testUsers.slice(i, i + batchSize)
      const batchNumber = Math.floor(i / batchSize) + 1

      console.log(`📦 Processing batch ${batchNumber}/${totalBatches} (${batch.length} users)...`)

      // Process batch in parallel with Promise.allSettled
      const results = await Promise.allSettled(
        batch.map(async (user) => {
          try {
            const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id)

            if (deleteError) {
              throw deleteError
            }

            return { user, status: 'deleted' as const }
          } catch (error) {
            return {
              user,
              status: 'error' as const,
              error: error instanceof Error ? error.message : String(error),
            }
          }
        })
      )

      // Process results
      for (const result of results) {
        if (result.status === 'fulfilled') {
          const { status, user, error } = result.value
          if (status === 'deleted') {
            successCount++
            console.log(`   ✅ ${user.email}`)
          } else {
            errorCount++
            console.log(`   ❌ ${user.email}: ${error}`)
          }
        } else {
          errorCount++
          console.log(`   ❌ Error: ${result.reason}`)
        }
      }

      console.log('') // Empty line between batches

      // Small delay between batches to avoid rate limiting
      if (i + batchSize < testUsers.length) {
        await new Promise((resolve) => setTimeout(resolve, 500))
      }
    }

    // Summary
    console.log('\n' + '='.repeat(50))
    console.log('📊 Summary:')
    console.log(`   ✅ Deleted: ${successCount}`)
    console.log(`   ❌ Errors: ${errorCount}`)
    console.log(`   📝 Total: ${testUsers.length}`)
    console.log('='.repeat(50))
    console.log('\n✅ Process completed!')
  } catch (error) {
    console.error('❌ Error deleting auth accounts:', error)
    throw error
  }
}

async function createAuthForTestUsers() {
  console.log('👥 Creating Supabase Auth accounts for test users...\n')

  try {
    // Fetch all test users (users with @test.com emails)
    const testUsers = await prisma.user.findMany({
      where: {
        email: { contains: '@test.com' },
        role: 'USER',
      },
      select: {
        id: true,
        email: true,
        fullName: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    })

    if (testUsers.length === 0) {
      console.log('⚠️  No test users found in database.')
      console.log('   Run `pnpm db:seed` first to create test users.')
      return
    }

    console.log(`📋 Found ${testUsers.length} test users to process\n`)

    // Default password for all test users (can be changed by user)
    const defaultPassword = process.env.TEST_USER_PASSWORD || 'Test1234!'
    
    console.log(`🔑 Using default password: ${defaultPassword}`)
    console.log('   (Set TEST_USER_PASSWORD env var to use a different password)\n')

    let successCount = 0
    let skipCount = 0
    let errorCount = 0

    // Process users in batches to avoid rate limiting
    const batchSize = 10
    const totalBatches = Math.ceil(testUsers.length / batchSize)

    for (let i = 0; i < testUsers.length; i += batchSize) {
      const batch = testUsers.slice(i, i + batchSize)
      const batchNumber = Math.floor(i / batchSize) + 1

      console.log(`📦 Processing batch ${batchNumber}/${totalBatches} (${batch.length} users)...`)

      // Process batch in parallel with Promise.allSettled
      const results = await Promise.allSettled(
        batch.map(async (user) => {
          try {
            // Check if user already exists in Supabase Auth
            const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
            const existingUser = existingUsers?.users.find((u) => u.email === user.email)

            if (existingUser) {
              return { user, status: 'exists' as const }
            }

            // Create user in Supabase Auth
            const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
              email: user.email,
              password: defaultPassword,
              email_confirm: true, // Auto-confirm email
              user_metadata: {
                full_name: user.fullName,
              },
            })

            if (authError) {
              // Check if it's a duplicate error
              if (authError.message.includes('already registered') || authError.message.includes('already exists')) {
                return { user, status: 'exists' as const }
              }
              throw authError
            }

            if (!authData.user) {
              throw new Error('Failed to create user')
            }

            return { user, status: 'created' as const }
          } catch (error) {
            return {
              user,
              status: 'error' as const,
              error: error instanceof Error ? error.message : String(error),
            }
          }
        })
      )

      // Process results
      for (const result of results) {
        if (result.status === 'fulfilled') {
          const { status, user, error } = result.value
          if (status === 'created') {
            successCount++
            console.log(`   ✅ ${user.email}`)
          } else if (status === 'exists') {
            skipCount++
            console.log(`   ⏭️  ${user.email} (already exists)`)
          } else {
            errorCount++
            console.log(`   ❌ ${user.email}: ${error}`)
          }
        } else {
          errorCount++
          console.log(`   ❌ Error: ${result.reason}`)
        }
      }

      console.log('') // Empty line between batches

      // Small delay between batches to avoid rate limiting
      if (i + batchSize < testUsers.length) {
        await new Promise((resolve) => setTimeout(resolve, 500))
      }
    }

    // Summary
    console.log('\n' + '='.repeat(50))
    console.log('📊 Summary:')
    console.log(`   ✅ Created: ${successCount}`)
    console.log(`   ⏭️  Skipped (already exists): ${skipCount}`)
    console.log(`   ❌ Errors: ${errorCount}`)
    console.log(`   📝 Total: ${testUsers.length}`)
    console.log('='.repeat(50))
    console.log(`\n🔑 Default password for all test users: ${defaultPassword}`)
    console.log('   Users can log in with: <email> / <password>')
    console.log('   Example: user1@test.com / Test1234!')
    console.log('\n✅ Process completed!')
  } catch (error) {
    console.error('❌ Error creating auth accounts:', error)
    throw error
  }
}

// Check command line argument to determine action
const action = process.argv[2] || 'create'

if (action === 'delete') {
  deleteAuthForTestUsers()
    .catch((e) => {
      console.error('❌ Fatal error:', e)
      process.exit(1)
    })
    .finally(async () => {
      await prisma.$disconnect()
      await pool.end()
    })
} else {
  createAuthForTestUsers()
    .catch((e) => {
      console.error('❌ Fatal error:', e)
      process.exit(1)
    })
    .finally(async () => {
      await prisma.$disconnect()
      await pool.end()
    })
}

