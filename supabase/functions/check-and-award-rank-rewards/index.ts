// @ts-nocheck

// Supabase Edge Function: check-and-award-rank-rewards
// Runs daily at midnight UTC via cron job
// Checks all users and awards rank rewards if they qualify for new ranks

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log(`[${new Date().toISOString()}] Starting rank reward check`)

    // Get all active ranks (ordered by rankNumber ASC)
    const { data: ranks, error: ranksError } = await supabase
      .from('ranks')
      .select('id, rankNumber, name, requiredSelfInvestment, requiredTeamBusiness, rewardAmount')
      .eq('isActive', true)
      .order('rankNumber', { ascending: true })

    if (ranksError) {
      throw new Error(`Failed to fetch ranks: ${ranksError.message}`)
    }

    if (!ranks || ranks.length === 0) {
      console.log('No active ranks found')
      return new Response(
        JSON.stringify({ success: true, message: 'No active ranks found', processed: 0 }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    // Get all active users
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, currentRankId')
      .eq('role', 'USER')
      .is('deletedAt', null)

    if (usersError) {
      throw new Error(`Failed to fetch users: ${usersError.message}`)
    }

    if (!users || users.length === 0) {
      console.log('No active users found')
      return new Response(
        JSON.stringify({ success: true, message: 'No active users found', processed: 0 }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    console.log(`Checking ${users.length} users against ${ranks.length} ranks`)

    let totalRewarded = 0
    let totalUpdated = 0
    let failedCount = 0

    // Process each user
    for (const user of users) {
      try {
        // Get user's current highest rank number
        let currentRankNumber = 0

        if (user.currentRankId) {
          const { data: currentRank } = await supabase
            .from('ranks')
            .select('rankNumber')
            .eq('id', user.currentRankId)
            .single()

          if (currentRank) {
            currentRankNumber = currentRank.rankNumber
          }
        }

        // Get all achieved ranks for this user
        const { data: achievedRanks } = await supabase
          .from('user_ranks')
          .select('rankId')
          .eq('userId', user.id)

        const achievedRankIds = new Set(
          achievedRanks?.map((ur: { rankId: string }) => ur.rankId) || []
        )

        // Calculate total self investment
        const { data: selfInvestments } = await supabase
          .from('investments')
          .select('amount')
          .eq('userId', user.id)
          .is('deletedAt', null)

        const totalSelfInvestment =
          selfInvestments?.reduce((sum: number, inv: { amount: string }) => {
            return sum + parseFloat(inv.amount)
          }, 0) || 0

        // Get all team members (via ReferralRelationship)
        const { data: teamRelationships } = await supabase
          .from('referral_relationships')
          .select('referredId')
          .eq('referrerId', user.id)

        const teamMemberIds =
          teamRelationships?.map((rel: { referredId: string }) => rel.referredId) || []

        // Calculate total team business (sum of all investments from team members)
        let totalTeamBusiness = 0

        if (teamMemberIds.length > 0) {
          const { data: teamInvestments } = await supabase
            .from('investments')
            .select('amount')
            .in('userId', teamMemberIds)
            .is('deletedAt', null)

          totalTeamBusiness =
            teamInvestments?.reduce((sum: number, inv: { amount: string }) => {
              return sum + parseFloat(inv.amount)
            }, 0) || 0
        }

        // Check each rank the user hasn't achieved yet
        let highestRankAchieved = currentRankNumber
        let rewardAwarded = false

        for (const rank of ranks) {
          // Skip if user already achieved this rank
          if (achievedRankIds.has(rank.id)) {
            continue
          }

          // Skip if rank number is not higher than current
          if (rank.rankNumber <= currentRankNumber) {
            continue
          }

          // Check eligibility
          const requiredSelfInvestment = parseFloat(rank.requiredSelfInvestment)
          const requiredTeamBusiness = parseFloat(rank.requiredTeamBusiness)

          if (
            totalSelfInvestment >= requiredSelfInvestment &&
            totalTeamBusiness >= requiredTeamBusiness
          ) {
            // User qualifies for this rank
            console.log(
              `User ${user.email} qualifies for rank ${rank.name} (Rank #${rank.rankNumber})`
            )

            // Check if UserRank record exists (safety check)
            const { data: existingUserRank } = await supabase
              .from('user_ranks')
              .select('id, rewardPaidAt')
              .eq('userId', user.id)
              .eq('rankId', rank.id)
              .single()

            let userRankId: string

            if (existingUserRank) {
              userRankId = existingUserRank.id
            } else {
              // Create UserRank record
              userRankId = crypto.randomUUID()
              const now = new Date().toISOString()
              const { data: newUserRank, error: userRankError } = await supabase
                .from('user_ranks')
                .insert({
                  id: userRankId,
                  userId: user.id,
                  rankId: rank.id,
                  rewardAmount: rank.rewardAmount,
                  achievedAt: now,
                  createdAt: now,
                  updatedAt: now,
                })
                .select('id')
                .single()

              if (userRankError) {
                console.error(
                  `Failed to create UserRank for user ${user.id}, rank ${rank.id}:`,
                  userRankError.message
                )
                failedCount++
                continue
              }

              // Use the ID from the response to ensure consistency
              userRankId = newUserRank.id
            }

            // Award reward if not paid yet
            if (!existingUserRank || !existingUserRank.rewardPaidAt) {
              const rewardAmount = parseFloat(rank.rewardAmount)

              // Create Transaction record
              const transactionId = crypto.randomUUID()
              const now = new Date().toISOString()
              const { error: transactionError } = await supabase.from('transactions').insert({
                id: transactionId,
                userId: user.id,
                type: 'RANK_REWARD',
                status: 'COMPLETED',
                amount: rewardAmount.toFixed(2),
                description: `Rank reward for achieving ${rank.name} rank`,
                relatedId: userRankId,
                relatedType: 'UserRank',
                createdAt: now,
                updatedAt: now,
              })

              if (transactionError) {
                console.error(
                  `Failed to create transaction for rank reward:`,
                  transactionError.message
                )
                failedCount++
                continue
              }

              // Update UserRank.rewardPaidAt
              const { error: updateError } = await supabase
                .from('user_ranks')
                .update({
                  rewardPaidAt: new Date().toISOString(),
                })
                .eq('id', userRankId)

              if (updateError) {
                console.error(`Failed to update rewardPaidAt:`, updateError.message)
                // Don't fail if update fails, transaction was created
              }

              rewardAwarded = true
              totalRewarded++
              console.log(
                `Awarded rank reward: ${rewardAmount.toFixed(2)} to user ${user.email} for rank ${rank.name}`
              )
            }

            // Track highest rank achieved
            if (rank.rankNumber > highestRankAchieved) {
              highestRankAchieved = rank.rankNumber
            }
          }
        }

        // Update user's currentRankId if highest rank changed
        if (highestRankAchieved > currentRankNumber) {
          // Find the rank ID for the highest rank number
          const highestRank = ranks.find((r) => r.rankNumber === highestRankAchieved)

          if (highestRank) {
            const { error: updateUserError } = await supabase
              .from('users')
              .update({
                currentRankId: highestRank.id,
              })
              .eq('id', user.id)

            if (updateUserError) {
              console.error(`Failed to update current_rank_id for user ${user.id}:`, updateUserError.message)
            } else {
              totalUpdated++
            }
          }
        }
      } catch (error) {
        console.error(`Error processing user ${user.id}:`, error)
        failedCount++
      }
    }

    const result = {
      success: true,
      totalUsers: users.length,
      totalRanks: ranks.length,
      rewardsAwarded: totalRewarded,
      ranksUpdated: totalUpdated,
      failed: failedCount,
    }

    console.log(`Rank reward check completed:`, result)

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('Error in check-and-award-rank-rewards function:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})

