# Supabase Edge Functions & Cron Jobs Plan

Based on the system analysis, here are the required Edge Functions and their scheduled cron jobs:

## 📋 System Overview

The system has 4 main automated processes:
1. **Daily Profit Distribution** - Distribute daily profits to users with active investments
2. **Referral Commission Distribution** - Create referral commissions when investments are approved
3. **Rank Reward Distribution** - Check and award rank rewards to eligible users
4. **Investment Status Management** - Mark completed investments (optional, if you have duration logic)

---

## 🔧 Required Edge Functions (3 Functions)

### 1. **`distribute-daily-profits`**
**Purpose**: Distribute daily profit to all users with ACTIVE investments

**Cron Schedule**: `0 0 * * *` (Daily at midnight UTC)

**Logic**:
1. Get all ACTIVE investments (where `status = 'ACTIVE'` and `deletedAt IS NULL`)
2. For each investment:
   - Calculate daily profit: `investment.amount × (plan.dailyProfitPercentage / 100)`
   - Check if `DailyProfit` record exists for today (unique constraint on `investmentId, date`)
   - If not exists:
     - Create `DailyProfit` record (date = today, isPaid = false)
     - Update `Investment.totalProfit` (+= daily profit amount)
     - Create `Transaction` record (type = DAILY_PROFIT, status = COMPLETED, amount = profit)
3. Handle errors gracefully (log failed investments for manual review)

**Database Operations**:
- SELECT: Active investments with plan details
- INSERT: DailyProfit records
- UPDATE: Investment.totalProfit
- INSERT: Transaction records

**Edge Function Path**: `/distribute-daily-profits`

---

### 2. **`distribute-referral-commissions`**
**Purpose**: Create referral commission records when an investment is approved

**Trigger**: Called from `approve-investment` action (or via webhook/trigger)

**Logic**:
1. Receive `investmentId` as parameter
2. Get investment with user and plan details
3. Get referral chain (up to 4 levels) from `ReferralRelationship`:
   - Level 1: Direct referrer (user.referrerId)
   - Level 2-4: Get from ReferralRelationship where referredId = investment.userId
4. For each level (1-4):
   - Get commission percentage from constants: `COMMISSION_PERCENTAGES[level]`
   - Calculate commission: `investment.amount × (percentage / 100)`
   - Create `ReferralIncome` record:
     - investmentId
     - recipientId (referrer's userId)
     - level
     - percentage
     - amount
     - isPaid = false
   - Create `Transaction` record (type = REFERRAL_INCOME, status = COMPLETED)
5. Handle cases where referrer doesn't exist or is inactive

**Commission Percentages** (from constants):
- Level 1: 10%
- Level 2: 5%
- Level 3: 3%
- Level 4: 2%

**Database Operations**:
- SELECT: Investment, User, ReferralRelationship
- INSERT: ReferralIncome records (up to 4 per investment)
- INSERT: Transaction records

**Edge Function Path**: `/distribute-referral-commissions`
**Note**: This can also be a server action in your Next.js app instead of edge function, since it's event-driven.

---

### 3. **`check-and-award-rank-rewards`**
**Purpose**: Check all users and award rank rewards if they qualify for new ranks

**Cron Schedule**: `0 2 * * *` (Daily at 2 AM UTC) - Run after daily profits to ensure latest data

**Logic**:
1. Get all active users (where `deletedAt IS NULL` and `role = 'USER'`)
2. Get all active ranks (ordered by `rankNumber` ASC)
3. For each user:
   - Calculate total self investment (sum of all investments where userId = user.id)
   - Calculate total team business (sum of all investments from team members via ReferralRelationship)
   - Get user's current rank (user.currentRankId)
   - Check all ranks that user hasn't achieved yet:
     - For each unachieved rank:
       - Check if `selfInvestment >= rank.requiredSelfInvestment`
       - Check if `teamBusiness >= rank.requiredTeamBusiness`
       - If both conditions met:
         - Create `UserRank` record (if not exists - unique constraint on userId, rankId)
         - If this is a new achievement and reward hasn't been paid:
           - Create `Transaction` record (type = RANK_REWARD, status = COMPLETED)
           - Update `UserRank.rewardPaidAt = now()`
         - Update `user.currentRankId` if this is the highest rank achieved
4. Only check ranks higher than current rank to avoid duplicate processing

**Database Operations**:
- SELECT: Users, Ranks, Investments, ReferralRelationships
- INSERT: UserRank records
- UPDATE: User.currentRankId, UserRank.rewardPaidAt
- INSERT: Transaction records

**Edge Function Path**: `/check-and-award-rank-rewards`

---

## 📅 Cron Job Summary

| Function | Schedule | Frequency | Purpose |
|----------|----------|-----------|---------|
| `distribute-daily-profits` | `0 0 * * *` | Daily (Midnight UTC) | Give daily profit to investors |
| `check-and-award-rank-rewards` | `0 2 * * *` | Daily (2 AM UTC) | Check and award rank rewards |

**Note**: `distribute-referral-commissions` is **event-driven** (called when investment is approved), not scheduled.

---

## 🔄 Alternative Approach: Combined Function

You could also create a single edge function `process-daily-tasks` that runs daily and handles:
1. Daily profit distribution
2. Rank reward checking

This reduces the number of functions but makes it less modular.

---

## 📝 Implementation Notes

### Security
- All edge functions should verify Supabase service role key
- Add rate limiting if needed
- Log all operations for audit trail

### Error Handling
- Wrap database operations in transactions where possible
- Log errors to Supabase logs or external service
- Implement retry logic for failed operations
- Send alerts for critical failures

### Performance
- Process investments in batches if there are many
- Use database indexes efficiently (already set up)
- Consider pagination for large user lists

### Testing
- Test with small datasets first
- Verify calculations match expected formulas
- Ensure no duplicate records are created
- Test edge cases (no referrers, inactive users, etc.)

---

## 🚀 Next Steps

1. Create Supabase Edge Functions directory structure
2. Implement each function with proper error handling
3. Set up Supabase Cron Jobs to schedule the functions
4. Update `approve-investment` action to call referral commission function
5. Test thoroughly in development environment
6. Monitor and log all operations in production

---

## 📊 Additional Considerations

### Investment Duration (If Needed)
If you want to auto-complete investments after a certain period:
- Add `durationDays` field to `InvestmentPlan` model
- Create another edge function to check and mark investments as COMPLETED
- Run daily: Check if `startDate + durationDays <= today` and status is ACTIVE

### Commission Distribution Timing
Current plan: Commission is distributed once when investment is approved.
Alternative: If you want recurring commission (daily/monthly), you'd need another scheduled function.

