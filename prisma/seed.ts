import { config } from 'dotenv'
import { resolve } from 'path'
import { PrismaClient, UserRole } from '@prisma/client'
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

async function main() {
  console.log('🌱 Starting seed...')

  // 1. Get admin user (must be created first using create-admin script)
  console.log('👤 Fetching admin user...')
  const adminUser = await prisma.user.findFirst({
    where: { role: 'ADMIN' },
  })

  if (!adminUser) {
    console.error('❌ No admin user found!')
    console.error('   Please run: npm run create-admin')
    console.error('   This will create an admin account in Supabase Auth and Prisma.')
    process.exit(1)
  }

  console.log('✅ Admin user found:', adminUser.email)

  // 2. Seed Ranks
  console.log('🏆 Seeding ranks...')
  const ranks = [
    {
      rankNumber: 1,
      name: 'Bronze',
      requiredSelfInvestment: 100,
      requiredTeamBusiness: 2500, // Team Business includes direct business
      rewardAmount: 50,
    },
    {
      rankNumber: 2,
      name: 'Silver',
      requiredSelfInvestment: 200,
      requiredTeamBusiness: 6000,
      rewardAmount: 120,
    },
    {
      rankNumber: 3,
      name: 'Gold',
      requiredSelfInvestment: 500,
      requiredTeamBusiness: 10000,
      rewardAmount: 250,
    },
  ]

  for (const rankData of ranks) {
    const rank = await prisma.rank.upsert({
      where: { rankNumber: rankData.rankNumber },
      update: {
        name: rankData.name,
        requiredSelfInvestment: rankData.requiredSelfInvestment,
        requiredTeamBusiness: rankData.requiredTeamBusiness,
        rewardAmount: rankData.rewardAmount,
        isActive: true,
      },
      create: {
        ...rankData,
        isActive: true,
      },
    })
    console.log(`✅ Rank ${rank.rankNumber} (${rank.name}) seeded`)
  }

  // 3. Seed Investment Plans
  console.log('💰 Seeding investment plans...')
  const investmentPlans = [
    {
      name: 'Starter Plan',
      description: 'Perfect for beginners. Start with just $5 and earn 4% daily profit.',
      minInvestment: 5,
      dailyProfitPercentage: 4.0,
    },
    {
      name: 'Basic Plan',
      description: 'A great starting point with $20 investment. Earn $0.8 daily profit.',
      minInvestment: 20,
      dailyProfitPercentage: 4.0,
    },
    {
      name: 'Standard Plan',
      description: 'Standard investment plan with $50. Earn $2 daily profit.',
      minInvestment: 50,
      dailyProfitPercentage: 4.0,
    },
    {
      name: 'Premium Plan',
      description: 'Premium investment with $100. Earn $4 daily profit.',
      minInvestment: 100,
      dailyProfitPercentage: 4.0,
    },
    {
      name: 'Advanced Plan',
      description: 'Advanced investment with $300. Earn $12 daily profit.',
      minInvestment: 300,
      dailyProfitPercentage: 4.0,
    },
    {
      name: 'Professional Plan',
      description: 'Professional investment with $500. Earn $20 daily profit.',
      minInvestment: 500,
      dailyProfitPercentage: 4.0,
    },
    {
      name: 'Elite Plan',
      description: 'Elite investment with $1000. Earn $40 daily profit.',
      minInvestment: 1000,
      dailyProfitPercentage: 4.0,
    },
    {
      name: 'Master Plan',
      description: 'Master investment with $1500. Earn $60 daily profit.',
      minInvestment: 1500,
      dailyProfitPercentage: 4.0,
    },
    {
      name: 'Ultimate Plan',
      description: 'Ultimate investment with $2000. Earn $80 daily profit.',
      minInvestment: 2000,
      dailyProfitPercentage: 4.0,
    },
  ]

  for (const planData of investmentPlans) {
    // Check if plan already exists
    const existing = await prisma.investmentPlan.findFirst({
      where: {
        name: planData.name,
        createdBy: adminUser.id,
      },
    })

    let plan
    if (existing) {
      plan = await prisma.investmentPlan.update({
        where: { id: existing.id },
        data: {
          description: planData.description,
          minInvestment: planData.minInvestment,
          dailyProfitPercentage: planData.dailyProfitPercentage,
          isActive: true,
        },
      })
    } else {
      plan = await prisma.investmentPlan.create({
        data: {
          ...planData,
          createdBy: adminUser.id,
          isActive: true,
        },
      })
    }

    console.log(`✅ Investment plan "${plan.name}" seeded (Min: $${plan.minInvestment})`)
  }

  // 4. Seed Dummy Users
  console.log('👥 Seeding 300 dummy users...')
  
  // Check for existing dummy users
  const existingTestUsers = await prisma.user.findMany({
    where: {
      email: { contains: '@test.com' },
      role: 'USER',
    },
    select: { id: true, email: true, referrerId: true, referralCode: true },
  })

  const existingUserCount = existingTestUsers.length

  const createdUsers: Array<{ id: string; referralCode: string; referrerId: string | null }> = 
    existingTestUsers.map(u => ({ id: u.id, referralCode: u.referralCode, referrerId: u.referrerId }))

  if (existingUserCount > 0) {
    console.log(`⚠️  Found ${existingUserCount} existing test users. Will skip duplicates and continue...`)
  }
  
  // Generate referral code helper
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

  // Helper to create referral relationships
  async function createReferralRelationships(
    newUserId: string,
    referrerId: string | null
  ): Promise<void> {
    if (!referrerId) {
      return
    }

    try {
      const referrers: Array<{ id: string; level: number }> = []
      let currentReferrerId: string | null = referrerId
      let level = 1

      while (currentReferrerId && level <= 4) {
        const referrer: { id: string; referrerId: string | null } | null = await prisma.user.findUnique({
          where: { id: currentReferrerId },
          select: { id: true, referrerId: true },
        })

        if (!referrer) {
          break
        }

        referrers.push({ id: referrer.id, level })

        currentReferrerId = referrer.referrerId
        level++
      }

      if (referrers.length > 0) {
        const relationships = referrers.map((referrer) => ({
          referrerId: referrer.id,
          referredId: newUserId,
          level: referrer.level,
        }))

        await prisma.referralRelationship.createMany({
          data: relationships,
          skipDuplicates: true,
        })
      }
    } catch (error) {
      console.error('Error creating referral relationships:', error)
    }
  }

  // Generate random names
  const firstNames = [
    'James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda',
    'William', 'Elizabeth', 'David', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica',
    'Thomas', 'Sarah', 'Charles', 'Karen', 'Christopher', 'Nancy', 'Daniel', 'Lisa',
    'Matthew', 'Betty', 'Anthony', 'Margaret', 'Mark', 'Sandra', 'Donald', 'Ashley',
    'Steven', 'Kimberly', 'Paul', 'Emily', 'Andrew', 'Donna', 'Joshua', 'Michelle',
    'Kenneth', 'Carol', 'Kevin', 'Amanda', 'Brian', 'Melissa', 'George', 'Deborah',
    'Edward', 'Stephanie', 'Ronald', 'Rebecca', 'Timothy', 'Sharon', 'Jason', 'Laura',
    'Jeffrey', 'Cynthia', 'Ryan', 'Kathleen', 'Jacob', 'Amy', 'Gary', 'Angela',
    'Nicholas', 'Shirley', 'Eric', 'Anna', 'Jonathan', 'Brenda', 'Stephen', 'Pamela',
    'Larry', 'Emma', 'Justin', 'Nicole', 'Scott', 'Helen', 'Brandon', 'Samantha',
    'Benjamin', 'Katherine', 'Samuel', 'Christine', 'Frank', 'Debra', 'Gregory', 'Rachel',
    'Raymond', 'Carolyn', 'Alexander', 'Janet', 'Patrick', 'Virginia', 'Jack', 'Maria',
    'Dennis', 'Heather', 'Jerry', 'Diane', 'Tyler', 'Julie', 'Aaron', 'Joyce',
    'Jose', 'Victoria', 'Adam', 'Kelly', 'Henry', 'Christina', 'Nathan', 'Joan',
    'Zachary', 'Evelyn', 'Douglas', 'Lauren', 'Peter', 'Judith', 'Kyle', 'Megan',
    'Noah', 'Cheryl', 'Ethan', 'Andrea', 'Jeremy', 'Hannah', 'Walter', 'Jacqueline',
    'Christian', 'Martha', 'Keith', 'Gloria', 'Roger', 'Teresa', 'Terry', 'Sara',
    'Austin', 'Janice', 'Sean', 'Marie', 'Gerald', 'Julia', 'Carl', 'Grace',
    'Harold', 'Judy', 'Dylan', 'Theresa', 'Jesse', 'Madison', 'Jordan', 'Beverly',
    'Bryan', 'Denise', 'Billy', 'Marilyn', 'Joe', 'Amber', 'Bruce', 'Danielle',
    'Gabriel', 'Rose', 'Logan', 'Brittany', 'Albert', 'Diana', 'Willie', 'Abigail',
    'Alan', 'Jane', 'Juan', 'Lori', 'Wayne', 'Olivia', 'Elijah', 'Jean',
    'Randy', 'Catherine', 'Roy', 'Marie', 'Vincent', 'Jesse', 'Ralph', 'Samantha',
    'Eugene', 'Debra', 'Russell', 'Rachel', 'Bobby', 'Carolyn', 'Mason', 'Janet',
    'Philip', 'Virginia', 'Louis', 'Maria', 'Johnny', 'Heather', 'Lawrence', 'Diane',
    'Ivan', 'Julie', 'Mason', 'Joyce', 'Eugene', 'Victoria', 'Lawrence', 'Kelly'
  ]

  const lastNames = [
    'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
    'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Wilson', 'Anderson', 'Thomas', 'Taylor',
    'Moore', 'Jackson', 'Martin', 'Lee', 'Thompson', 'White', 'Harris', 'Sanchez',
    'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker', 'Young', 'Allen', 'King',
    'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores', 'Green', 'Adams',
    'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell', 'Carter', 'Roberts',
    'Gomez', 'Phillips', 'Evans', 'Turner', 'Diaz', 'Parker', 'Cruz', 'Edwards',
    'Collins', 'Reyes', 'Stewart', 'Morris', 'Morales', 'Murphy', 'Cook', 'Rogers',
    'Gutierrez', 'Ortiz', 'Morgan', 'Cooper', 'Peterson', 'Bailey', 'Reed', 'Kelly',
    'Howard', 'Ramos', 'Kim', 'Cox', 'Ward', 'Richardson', 'Watson', 'Brooks',
    'Chavez', 'Wood', 'James', 'Bennett', 'Gray', 'Mendoza', 'Ruiz', 'Hughes',
    'Price', 'Alvarez', 'Castillo', 'Sanders', 'Patel', 'Myers', 'Long', 'Ross',
    'Foster', 'Jimenez', 'Powell', 'Jenkins', 'Perry', 'Russell', 'Sullivan', 'Bell',
    'Coleman', 'Butler', 'Henderson', 'Barnes', 'Gonzales', 'Fisher', 'Vasquez', 'Simmons',
    'Romero', 'Jordan', 'Patterson', 'Alexander', 'Hamilton', 'Graham', 'Reynolds', 'Griffin',
    'Wallace', 'Moreno', 'West', 'Cole', 'Hayes', 'Bryant', 'Herrera', 'Gibson',
    'Ellis', 'Tran', 'Medina', 'Aguilar', 'Stevens', 'Murray', 'Ford', 'Castro',
    'Marshall', 'Owens', 'Harrison', 'Fernandez', 'Mcdonald', 'Woods', 'Washington', 'Kennedy',
    'Wells', 'Vargas', 'Henry', 'Chen', 'Freeman', 'Webb', 'Tucker', 'Guzman',
    'Burns', 'Crawford', 'Olson', 'Simpson', 'Porter', 'Hunter', 'Gordon', 'Mendez',
    'Silva', 'Shaw', 'Snyder', 'Mason', 'Dixon', 'Munoz', 'Hunt', 'Hicks',
    'Holmes', 'Palmer', 'Wagner', 'Black', 'Robertson', 'Boyd', 'Rose', 'Stone'
  ]

  // Create 300 users (skip if already exist)
  const totalUsers = 300
  const batchSize = 50

  for (let i = 0; i < totalUsers; i += batchSize) {
    const batch = []
    const endIndex = Math.min(i + batchSize, totalUsers)

    for (let j = i; j < endIndex; j++) {
      const firstName = firstNames[Math.floor(Math.random() * firstNames.length)]
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)]
      const fullName = `${firstName} ${lastName}`
      const email = `user${j + 1}@test.com`
      const referralCode = await generateReferralCode()

      // Determine referrer
      let referrerId: string | null = null
      if (j < 10) {
        // First 10 users have no referrer (top level)
        referrerId = null
      } else if (j < 100) {
        // Users 11-100: Referred by users 1-10 (Level 1)
        const referrerIndex = Math.floor(Math.random() * 10)
        referrerId = createdUsers[referrerIndex]?.id || null
      } else if (j < 200) {
        // Users 101-200: Referred by users 11-100 (Level 2)
        const referrerIndex = 10 + Math.floor(Math.random() * 90)
        referrerId = createdUsers[referrerIndex]?.id || null
      } else if (j < 250) {
        // Users 201-250: Referred by users 101-200 (Level 3)
        const referrerIndex = 100 + Math.floor(Math.random() * 100)
        referrerId = createdUsers[referrerIndex]?.id || null
      } else {
        // Users 251-300: Referred by users 201-250 (Level 4)
        const referrerIndex = 200 + Math.floor(Math.random() * 50)
        referrerId = createdUsers[referrerIndex]?.id || null
      }

      batch.push({
        email,
        fullName,
        referralCode,
        referrerId,
        isActive: true,
        isVerified: true,
        role: UserRole.USER,
      })
    }

    // Create batch of users
    const users = await prisma.user.createMany({
      data: batch,
      skipDuplicates: true,
    })

    // Fetch created/existing users to get their IDs
    const batchEmails = batch.map((u) => u.email)
    const fetchedUsers = await prisma.user.findMany({
      where: { email: { in: batchEmails } },
      select: { id: true, referralCode: true, referrerId: true },
    })

    // Create referral relationships for this batch (only for newly created users)
    for (const user of fetchedUsers) {
      // Check if user is already in createdUsers array
      const exists = createdUsers.find(u => u.id === user.id)
      if (!exists) {
        // New user - create referral relationships if needed
        if (user.referrerId) {
          await createReferralRelationships(user.id, user.referrerId)
        }
        createdUsers.push(user)
      }
    }

    const newUsersInBatch = fetchedUsers.filter(u => 
      !existingTestUsers.find(existing => existing.id === u.id)
    ).length
    console.log(`✅ Processed users ${i + 1}-${endIndex}/${totalUsers} (${newUsersInBatch} new, ${fetchedUsers.length - newUsersInBatch} existing)`)
  }

  const newUsersCreated = createdUsers.length - existingUserCount
  console.log(`✅ Total: ${createdUsers.length} dummy users (${newUsersCreated} newly created, ${existingUserCount} existing)`)

  // 5. Seed some investments for testing
  console.log('💼 Seeding test investments...')
  
  // Get investment plans
  const plans = await prisma.investmentPlan.findMany({
    where: { isActive: true },
  })

  if (plans.length > 0 && createdUsers.length > 0) {
    // Create investments for ~50% of users
    const usersToInvest = createdUsers.slice(0, Math.floor(createdUsers.length * 0.5))
    let investmentCount = 0

    for (const user of usersToInvest) {
      // Randomly decide if user invests (70% chance)
      if (Math.random() > 0.3) {
        // Pick a random plan
        const plan = plans[Math.floor(Math.random() * plans.length)]
        
        // Investment amount between plan minimum and 2x minimum
        const amount = Number(plan.minInvestment) + 
          Math.random() * Number(plan.minInvestment)

        // Random status (mostly ACTIVE, some PENDING, COMPLETED)
        const statuses: Array<'PENDING' | 'ACTIVE' | 'COMPLETED'> = 
          ['PENDING', 'ACTIVE', 'ACTIVE', 'ACTIVE', 'COMPLETED']
        const status = statuses[Math.floor(Math.random() * statuses.length)]

        // Random start date (within last 30 days)
        const startDate = new Date()
        startDate.setDate(startDate.getDate() - Math.floor(Math.random() * 30))

        await prisma.investment.create({
          data: {
            userId: user.id,
            planId: plan.id,
            amount,
            status,
            startDate,
          },
        })

        investmentCount++
      }
    }

    console.log(`✅ Created ${investmentCount} test investments`)
  }

  console.log('🎉 Seed completed successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })

