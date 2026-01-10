// @ts-nocheck

// Supabase Edge Function: distribute-daily-profits
// Runs every 1 hour via cron job
// Distributes daily profit to all users with ACTIVE investments

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface DailyProfitData {
  investmentId: string
  userId: string
  amount: number
  date: string
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

    // Get today's date (UTC midnight)
    const today = new Date()
    today.setUTCHours(0, 0, 0, 0)
    const todayStr = today.toISOString().split('T')[0]

    console.log(`[${new Date().toISOString()}] Starting daily profit distribution for ${todayStr}`)

    // Get all ACTIVE investments with plan details
    const { data: investments, error: investmentsError } = await supabase
      .from('investments')
      .select(
        `
        id,
        userId,
        planId,
        amount,
        totalProfit,
        plan:investment_plans!inner (
          id,
          dailyProfitPercentage
        )
      `
      )
      .eq('status', 'ACTIVE')
      .is('deletedAt', null)

    if (investmentsError) {
      throw new Error(`Failed to fetch investments: ${investmentsError.message}`)
    }

    if (!investments || investments.length === 0) {
      console.log('No active investments found')
      return new Response(
        JSON.stringify({ success: true, message: 'No active investments found', processed: 0 }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    console.log(`Found ${investments.length} active investments`)

    const dailyProfitsToCreate: DailyProfitData[] = []
    const totalDailyProfitAmount = { value: 0 }
    const investmentsToUpdate: Array<{ id: string; newTotalProfit: number }> = []
    const transactionsToCreate: Array<{
      user_id: string
      type: string
      amount: number
      status: string
      description: string
      related_id?: string
      related_type?: string
    }> = []

    // Process each investment
    for (const investment of investments) {
      const investmentAmount = parseFloat(investment.amount)
      const dailyProfitPercentage = parseFloat(investment.plan.dailyProfitPercentage)
      const dailyProfitAmount = investmentAmount * (dailyProfitPercentage / 100)

      // Check if DailyProfit record already exists for today
      const { data: existingProfit } = await supabase
        .from('daily_profits')
        .select('id')
        .eq('investmentId', investment.id)
        .eq('date', todayStr)
        .single()

      if (existingProfit) {
        // Already processed for today, skip
        continue
      }

      // Prepare daily profit record
      dailyProfitsToCreate.push({
        investmentId: investment.id,
        userId: investment.userId,
        amount: dailyProfitAmount,
        date: todayStr,
      })
      totalDailyProfitAmount.value += dailyProfitAmount

      // Prepare investment total profit update
      const currentTotalProfit = parseFloat(investment.totalProfit) || 0
      investmentsToUpdate.push({
        id: investment.id,
        newTotalProfit: currentTotalProfit + dailyProfitAmount,
      })
    }

    console.log(
      `Processing ${dailyProfitsToCreate.length} new daily profits (${investments.length - dailyProfitsToCreate.length} already processed today), total amount: ${totalDailyProfitAmount.value.toFixed(2)}`
    )

    // Create daily profit records and transactions in batches
    let createdCount = 0
    let failedCount = 0

    for (let i = 0; i < dailyProfitsToCreate.length; i++) {
      const profitData = dailyProfitsToCreate[i]
      const investmentUpdate = investmentsToUpdate[i]

      try {
        // Create DailyProfit record
        const dailyProfitId = crypto.randomUUID()
        const now = new Date().toISOString()
        const { data: dailyProfit, error: profitError } = await supabase
          .from('daily_profits')
          .insert({
            id: dailyProfitId,
            investmentId: profitData.investmentId,
            userId: profitData.userId,
            date: profitData.date,
            amount: profitData.amount.toFixed(2),
            isPaid: false,
            createdAt: now,
            updatedAt: now,
          })
          .select('id')
          .single()

        if (profitError) {
          console.error(
            `Failed to create daily profit for investment ${profitData.investmentId}:`,
            profitError.message
          )
          failedCount++
          continue
        }

        if (!dailyProfit || !dailyProfit.id) {
          console.error(
            `Failed to get daily profit id after creation for investment ${profitData.investmentId}`
          )
          failedCount++
          continue
        }

        // Update Investment.totalProfit
        const { error: updateError } = await supabase
          .from('investments')
          .update({
            totalProfit: investmentUpdate.newTotalProfit.toFixed(2),
          })
          .eq('id', investmentUpdate.id)

        if (updateError) {
          console.error(
            `Failed to update investment total profit for ${investmentUpdate.id}:`,
            updateError.message
          )
          failedCount++
          continue
        }

        // Create Transaction record
        // Note: Using camelCase field names as per Prisma schema
        const transactionId = crypto.randomUUID()
        const transactionNow = new Date().toISOString()
        
        // Validate required fields
        if (!transactionId || typeof transactionId !== 'string') {
          console.error(`Invalid transaction ID generated for daily profit ${dailyProfit.id}`)
          failedCount++
          continue
        }
        
        if (!dailyProfit.id) {
          console.error(`Daily profit ID is missing for investment ${profitData.investmentId}`)
          failedCount++
          continue
        }
        
        // Ensure all values are properly defined
        const transactionDataToInsert = {
          id: transactionId,
          userId: profitData.userId,
          type: 'DAILY_PROFIT',
          status: 'COMPLETED',
          amount: profitData.amount.toFixed(2),
          description: `Daily profit from investment`,
          relatedId: dailyProfit.id,
          relatedType: 'DailyProfit',
          createdAt: transactionNow,
          updatedAt: transactionNow,
        }

        const { error: transactionError } = await supabase
          .from('transactions')
          .insert(transactionDataToInsert)

        if (transactionError) {
          console.error(
            `Failed to create transaction for daily profit ${dailyProfit.id}:`,
            transactionError.message
          )
          // Don't fail the whole process if transaction creation fails
        }

        createdCount++
        if (createdCount % 10 === 0) {
          console.log(`Progress: ${createdCount}/${dailyProfitsToCreate.length} daily profits processed`)
        }
      } catch (error) {
        console.error(
          `Error processing daily profit for investment ${profitData.investmentId}:`,
          error
        )
        failedCount++
      }
    }

    const result = {
      success: true,
      date: todayStr,
      totalInvestments: investments.length,
      processed: createdCount,
      skipped: investments.length - dailyProfitsToCreate.length,
      failed: failedCount,
    }

    console.log(`Daily profit distribution completed:`, result)

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('Error in distribute-daily-profits function:', error)
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

