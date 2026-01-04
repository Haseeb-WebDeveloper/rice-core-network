# Supabase Edge Functions

This directory contains Supabase Edge Functions for automated tasks.

## Functions

### 1. `distribute-daily-profits`

**Purpose**: Distributes daily profit to all users with ACTIVE investments.

**Schedule**: Every 1 hour (cron: `0 * * * *`)

**How it works**:
- Fetches all investments with status `ACTIVE` and no `deletedAt`
- For each investment, calculates daily profit: `amount × (dailyProfitPercentage / 100)`
- Checks if a `DailyProfit` record already exists for today
- If not, creates:
  - `DailyProfit` record (isPaid = false)
  - Updates `Investment.totalProfit`
  - Creates `Transaction` record (type = DAILY_PROFIT, status = COMPLETED)

**Response**:
```json
{
  "success": true,
  "date": "2024-01-15",
  "totalInvestments": 50,
  "processed": 45,
  "skipped": 5,
  "failed": 0
}
```

---

### 2. `check-and-award-rank-rewards`

**Purpose**: Checks all users and awards rank rewards if they qualify for new ranks.

**Schedule**: Daily at midnight UTC (cron: `0 0 * * *`)

**How it works**:
- Fetches all active users (role = USER, no deletedAt)
- Fetches all active ranks (ordered by rankNumber ASC)
- For each user:
  - Calculates total self investment
  - Calculates total team business (sum of investments from team members)
  - Checks eligibility for each unachieved rank
  - If eligible:
    - Creates `UserRank` record (if not exists)
    - Creates `Transaction` record (type = RANK_REWARD, status = COMPLETED)
    - Updates `UserRank.rewardPaidAt`
  - Updates `user.currentRankId` to highest rank achieved

**Response**:
```json
{
  "success": true,
  "totalUsers": 1000,
  "totalRanks": 3,
  "rewardsAwarded": 15,
  "ranksUpdated": 12,
  "failed": 0
}
```

---

## Setup & Deployment

### Prerequisites

1. Install Supabase CLI:
```bash
npm install -g supabase
```

2. Login to Supabase:
```bash
supabase login
```

3. Link your project:
```bash
supabase link --project-ref your-project-ref
```

### Environment Variables

The functions require these environment variables (set in Supabase Dashboard):

- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key for admin access

### Deploy Functions

```bash
# Deploy all functions
supabase functions deploy

# Deploy specific function
supabase functions deploy distribute-daily-profits
supabase functions deploy check-and-award-rank-rewards
```

### Set Up Cron Jobs

In Supabase Dashboard, go to Database > Cron Jobs and create:

1. **Daily Profit Distribution**
   - Function: `distribute-daily-profits`
   - Schedule: `0 * * * *` (every hour)
   - Timezone: UTC

2. **Rank Reward Check**
   - Function: `check-and-award-rank-rewards`
   - Schedule: `0 0 * * *` (daily at midnight)
   - Timezone: UTC

Alternatively, use SQL:

```sql
-- Create cron job for daily profits (every hour)
SELECT cron.schedule(
  'distribute-daily-profits',
  '0 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/distribute-daily-profits',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY'
    )
  ) AS request_id;
  $$
);

-- Create cron job for rank rewards (daily at midnight)
SELECT cron.schedule(
  'check-and-award-rank-rewards',
  '0 0 * * *',
  $$
  SELECT net.http_post(
    url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/check-and-award-rank-rewards',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY'
    )
  ) AS request_id;
  $$
);
```

### Test Functions Locally

```bash
# Start Supabase locally
supabase start

# Serve functions locally
supabase functions serve

# Test a function
curl -i --location --request POST 'http://localhost:54321/functions/v1/distribute-daily-profits' \
  --header 'Authorization: Bearer YOUR_ANON_KEY'
```

## Error Handling

- All errors are logged to Supabase logs
- Functions return JSON responses with `success` status
- Failed operations are counted and reported in response
- Functions continue processing even if individual records fail

## Monitoring

Monitor function execution in:
- Supabase Dashboard > Edge Functions > Logs
- Check function metrics for execution time and errors
- Review response data for processed/failed counts

## Troubleshooting

1. **Function not executing**: Check cron job is active in Supabase Dashboard
2. **Database errors**: Verify column names match Prisma schema (camelCase)
3. **Permission errors**: Ensure service role key has proper permissions
4. **Timeout errors**: Consider batching operations for large datasets

