# The Complete Next.js 16 Guide for Lightning-Fast, Optimized, & Secure Full-Stack Applications

**Version:** 3.0 - Complete Reference Edition  
**Target:** Next.js 16.0.0+ (Stable)  
**Purpose:** Guide for AI-assisted development of new Next.js 16 projects

---

## 📋 Table of Contents

### 🎯 Getting Started
1. [What's New in Next.js 16](#whats-new)
2. [Project Setup](#project-setup)
3. [Prerequisites & Version Requirements](#prerequisites)

### 🧠 Core Concepts
4. [The Paradigm Shift: Cache Components](#paradigm-shift)
5. [Server vs Client Boundaries](#server-client)
6. [The Three Rendering Types](#three-types)
7. [Mental Model for AI Agents](#mental-model)

### 🔧 Essential APIs
8. [Async Request APIs](#async-apis)
9. [Cache Directives](#cache-directives)
10. [Cache Configuration](#cache-config)
11. [Cache Invalidation](#cache-invalidation)
12. [Dynamic vs Static Rendering](#dynamic-static)

### 📦 Advanced Patterns
13. [Public Caches](#public-caches)
14. [Private Caches](#private-caches)
15. [Runtime Prefetching](#runtime-prefetch)
16. [Segment Caching (Client-Side)](#segment-cache)
17. [generateStaticParams](#generate-static-params)

### 🎨 Best Practices
18. [Clean Code Practices](#clean-code)
19. [UI Patterns with Shadcn](#ui-patterns)
20. ["use client" Guide](#use-client)
21. [Composition Patterns](#composition)
22. [Performance Optimization](#optimization)
23. [Security Best Practices](#security)

### 🚨 Error Prevention
24. [Common Mistakes](#common-mistakes)
25. [Error Patterns & Fixes](#error-patterns)
26. [Troubleshooting Guide](#troubleshooting)

### 📚 Complete Reference
27. [API Quick Reference](#api-reference)
28. [Decision Trees](#decision-trees)
29. [Configuration Guide](#config-guide)
30. [Real-World Patterns](#real-world-patterns)

---

## <a id="whats-new"></a>1. What's New in Next.js 16

### Major Features

**🚀 Cache Components (Experimental)**
- New caching paradigm replacing static/dynamic exports
- Granular control over server-side caching
- Built-in runtime prefetching
- Improved Partial Prerendering (PPR)

**⚡ Turbopack by Default**
- 10x faster compilation in development
- Incremental builds out of the box
- No configuration needed

**🔄 Async Request APIs**
- `params`, `searchParams` are now Promises
- `cookies()`, `headers()`, `draftMode()` return Promises
- Better support for streaming and Suspense

**🎯 Improved Cache Invalidation**
- `updateTag()` for read-your-own-writes in Server Actions
- `revalidateTag(tag, profile)` with profile parameter
- Granular invalidation strategies

**🌐 Proxy Instead of Middleware**
- `middleware.ts` → `proxy.ts` (old name deprecated)
- Better semantics for request interception

---

## <a id="project-setup"></a>2. Project Setup

### Creating a New Project

```bash
# Using create-next-app (recommended)
bun create-next-app@latest my-app

# Options to select:
# ✅ TypeScript: Yes
# ✅ ESLint: Yes
# ✅ Tailwind CSS: Yes
# ✅ src/ directory: Yes (recommended)
# ✅ App Router: Yes
# ✅ Turbopack: Yes (default in v16)
# ✅ Customize import alias: @/* (default)
```

### Key API Changes in Next.js 16

**1. Async params & searchParams**
```typescript
// ✅ CORRECT (Next.js 16)
export default async function Page(props) {
  const params = await props.params
  const searchParams = await props.searchParams
  return <div>ID: {params.id}</div>
}
```

**2. Async Dynamic Functions**
```typescript
// ✅ CORRECT (Next.js 16)
const cookieStore = await cookies()
const headersList = await headers()
const draft = await draftMode()
```

**3. Cache Invalidation**
```typescript
// ✅ Server Actions
import { updateTag } from 'next/cache'
updateTag('posts')

// ✅ Route Handlers
import { revalidateTag } from 'next/cache'
revalidateTag('posts', 'max')
```


---

## <a id="paradigm-shift"></a>5. The Paradigm Shift: Cache Components

### 🔑 Key Concept

**Old Model (Next.js 15 and earlier):**
- Everything is **static by default**
- Opt-out with `export const dynamic = 'force-dynamic'`
- Use `unstable_noStore()` to prevent caching

**New Model (Next.js 16 with Cache Components):**
- Everything is **dynamic by default**
- Opt-in with `"use cache"` directive
- Fine-grained control over what gets cached

### Why This Matters

```typescript
// OLD WAY (Next.js 15)
export const revalidate = 3600  // Revalidate every hour

export default async function Page() {
  const data = await fetch('https://api.example.com/data')
  return <div>{data}</div>
}

// NEW WAY (Next.js 16)
import { cacheLife } from 'next/cache'

export default async function Page() {
  "use cache"
  cacheLife('hours')  // Revalidate every hour
  
  const data = await fetch('https://api.example.com/data')
  return <div>{data}</div>
}
```

**Benefits:**
- ✅ More explicit about what's cached
- ✅ Granular control (can cache individual functions, not just routes)
- ✅ Better Partial Prerendering (PPR) support
- ✅ Prevents accidental over-caching
- ✅ Easier to reason about caching behavior

---

## <a id="server-client"></a>6. Server vs Client Boundaries

### Understanding the Bundler Layer

**Critical Insight:** Being in the "server bundle" doesn't mean everything uses the same caching model.

```typescript
// All server-side code, but DIFFERENT caching models:

// ✅ SERVER COMPONENT: Uses 'use cache'
export default async function Page() {
  'use cache'
  return <div>Cached content</div>
}

// ❌ ROUTE HANDLER: Uses revalidateTag(), NOT 'use cache'
export async function GET() {
  // 'use cache' is INVALID here
  return Response.json({ data: 'value' })
}

// ❌ INSTRUMENTATION: Uses global state, NOT 'use cache'
export async function register() {
  // 'use cache' is INVALID here - not request-scoped
}

// ❌ PROXY (MIDDLEWARE): Uses Response headers, NOT 'use cache'
export function proxy(request) {
  // 'use cache' is INVALID here
  return NextResponse.next()
}
```

### Why the Difference?

| Context | Execution Layer | Prerenderable? | Cache API |
|---------|----------------|----------------|-----------|
| Server Component | React tree | ✅ Yes | `'use cache'` |
| Route Handler | HTTP request handler | ❌ No | `revalidateTag()` |
| Server Action | RPC call | ❌ No | `updateTag()` |
| Instrumentation | Startup hook | ❌ No | Global state |
| Proxy/Middleware | Request transform | ❌ No | Response headers |

**Key Principle:** `'use cache'` is React-specific. It requires component tree context, build-time analysis, and Suspense integration.

---

## <a id="three-types"></a>7. The Three Rendering Types

### Type 1: Public Cache (`'use cache'`)

**Use for:** Shared content across all users

```typescript
async function BlogPost() {
  'use cache'
  cacheLife('hours')
  
  const post = await fetch('https://cms.example.com/posts/1')
  return <article>{post.content}</article>
}
```

**Characteristics:**
- ✅ Included in static prerender
- ✅ Included in runtime prefetch
- ❌ Cannot access cookies/headers/searchParams
- ❌ No Suspense required
- 🌐 Cache scope: Shared across ALL users

### Type 2: Private Cache (`'use cache: private'`)

**Use for:** Per-user content that can be prefetched

```typescript
export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <UserProfile />
    </Suspense>
  )
}

async function UserProfile() {
  'use cache: private'
  cacheLife({ stale: 60 })  // Must be >= 30s for runtime prefetch
  
  const cookieStore = await cookies()
  const userId = cookieStore.get('userId')?.value
  const user = await fetchUser(userId)
  
  return <div>Welcome, {user.name}!</div>
}
```

**Characteristics:**
- ❌ Excluded from static prerender
- ✅ Included in runtime prefetch (if stale >= 30s)
- ✅ Can access cookies/headers/searchParams/params
- ✅ **MUST wrap in Suspense** (build error if not)
- 👤 Cache scope: Per-user

### Type 3: Fully Dynamic (no cache directive)

**Use for:** Always-fresh, per-request content

```typescript
export default async function Dashboard() {
  const user = await getCurrentUser()
  const notifications = await getLatestNotifications(user.id)
  
  return <div>New notifications: {notifications.length}</div>
}
```

**Characteristics:**
- ❌ Excluded from static prerender
- ❌ Excluded from runtime prefetch
- ✅ Can access all APIs
- 🔄 Renders: Every request
- ⚡ Cache scope: No caching

### Quick Decision Matrix

```
Is content same for all users?
├─ YES → Use 'use cache' (Public)
│        + cacheLife() for time-based revalidation
│        + cacheTag() for on-demand revalidation
│
└─ NO → Is it per-user but prefetchable?
         ├─ YES → Use 'use cache: private'
         │        + Must wrap in Suspense
         │        + Set stale >= 30s for prefetch
         │
         └─ NO → Leave dynamic (no cache directive)
                  + Add Suspense for better UX
```

---

## <a id="mental-model"></a>8. Mental Model for AI Agents

### 🎯 Critical Rules (Always Apply)

#### Rule 1: Segment Configs Are FORBIDDEN (with cacheComponents)

```typescript
// ❌ BUILD ERROR when experimental.cacheComponents: true
export const dynamic = 'force-static'
export const revalidate = 60
export const fetchCache = 'force-cache'
export const dynamicParams = false

// ✅ Use Cache Components directives instead
export default async function Page() {
  'use cache'
  cacheLife('hours')  // Replaces revalidate: 3600
  cacheTag('posts')   // For on-demand invalidation
}
```

**Note:** These segment configs work fine in Next.js 16 WITHOUT `cacheComponents` enabled. They're only incompatible when Cache Components mode is active.

#### Rule 2: Always Await Async APIs

```typescript
// ❌ WRONG - Type errors
const id = params.id
const query = searchParams.q
const token = cookies().get('token')

// ✅ CORRECT
const { id } = await params
const { q } = await searchParams
const token = (await cookies()).get('token')
```

#### Rule 3: Cache Keys Only Include Serializable Props

```typescript
async function cached(
  x: number,              // ✅ Serializable → in cache key
  children: ReactNode     // ❌ Non-serializable → NOT in cache key
) {
  'use cache'
  return { x, children }
}

// Cache hits on same x, even if children is different
await cached(1, <div>A</div>)  // Cache miss
await cached(1, <div>B</div>)  // Cache HIT (same x)
await cached(2, <div>A</div>)  // Cache miss (different x)
```

**Serializable types:**
- Primitives: `string`, `number`, `boolean`, `null`, `undefined`
- Plain objects: `{ key: 'value' }`
- Arrays: `[1, 2, 3]`

**Non-serializable types (NOT in cache key):**
- JSX elements
- Functions
- Class instances
- Promises
- Symbols

#### Rule 4: Magic Numbers You Must Know

```typescript
// Static Prerender Threshold
const DYNAMIC_EXPIRE = 300  // 5 minutes
// Cache included in prerender if expire >= 300s

// Runtime Prefetch Threshold
const RUNTIME_PREFETCH_DYNAMIC_STALE = 30  // 30 seconds
// Cache included in runtime prefetch if stale >= 30s

// Segment Cache Freshness
const STALE_TIME_DYNAMIC = 30   // 30 seconds (default)
const STALE_TIME_STATIC = 300   // 5 minutes (default)
```

#### Rule 5: Three Cache Invalidation Patterns

```typescript
// Pattern 1: Server Action with read-your-own-writes
'use server'
import { updateTag } from 'next/cache'

export async function createPost(data) {
  await db.posts.create(data)
  updateTag('posts')  // Immediate, no profile parameter
}

// Pattern 2: Route Handler with background revalidation
import { revalidateTag } from 'next/cache'

export async function POST(request) {
  await db.posts.create(await request.json())
  revalidateTag('posts', 'max')  // Background, requires profile
  return Response.json({ success: true })
}

// Pattern 3: Client cache refresh
'use server'
import { refresh } from 'next/cache'

export async function refreshPage() {
  refresh()  // Refreshes client router cache
}
```

---

## <a id="async-apis"></a>9. Async Request APIs

### params

**All functions receiving params must be async and await the Promise:**

```typescript
// ✅ Page Component
export default async function Page(props) {
  const params = await props.params
  return <div>ID: {params.id}</div>
}

// ✅ Layout Component
export default async function Layout(props) {
  const params = await props.params
  return <div>{props.children}</div>
}

// ✅ Route Handler
export async function GET(request, props) {
  const params = await props.params
  return Response.json({ id: params.id })
}

// ✅ generateMetadata
export async function generateMetadata(props) {
  const params = await props.params
  return { title: params.slug }
}

// ✅ generateStaticParams
export async function generateStaticParams() {
  return [{ id: '1' }, { id: '2' }]
}
```

**Type Definition:**
```typescript
type Props = {
  params: Promise<{ id: string; slug: string }>
  searchParams: Promise<{ q?: string }>
}
```

### searchParams

**Same pattern as params:**

```typescript
export default async function Page(props) {
  const searchParams = await props.searchParams
  const query = searchParams.q
  const page = searchParams.page || '1'
  
  return <div>Search: {query}</div>
}
```

### cookies()

```typescript
import { cookies } from 'next/headers'

// ✅ Always await
const cookieStore = await cookies()
const token = cookieStore.get('token')?.value

// Set cookie
cookieStore.set('name', 'value', {
  httpOnly: true,
  secure: true,
  sameSite: 'lax',
  maxAge: 60 * 60 * 24 * 7  // 7 days
})

// Delete cookie
cookieStore.delete('name')
```

### headers()

```typescript
import { headers } from 'next/headers'

// ✅ Always await
const headersList = await headers()
const userAgent = headersList.get('user-agent')
const authorization = headersList.get('authorization')

// Iterate all headers
for (const [name, value] of headersList) {
  console.log(`${name}: ${value}`)
}
```

### connection()

**Use when you need dynamic rendering without reading request data:**

```typescript
import { connection } from 'next/server'

export default async function Page() {
  await connection()  // Mark as dynamic
  
  // Now safe to use time-based values
  const timestamp = Date.now()
  const random = Math.random()
  const year = new Date().getFullYear()
  
  return <div>Generated at: {timestamp}</div>
}
```

**When to use `connection()`:**
- Using `Math.random()`, `Date.now()`, `crypto.randomUUID()`
- Force dynamic rendering without reading cookies/headers
- Synchronous platform IO

**When NOT to use:**
- Inside `'use cache'` scope (error)
- Inside `'use cache: private'` scope (error)
- Already using cookies()/headers() (redundant)

---

## <a id="cache-directives"></a>10. Cache Directives

### "use cache" (Public Cache)

**Syntax:**
```typescript
"use cache"

// Or at file level (before imports)
'use cache'
import { ... } from '...'
```

**Function-Level Example:**
```typescript
async function getCachedData() {
  'use cache'
  return await fetch('https://api.example.com/data')
}
```

**Component-Level Example:**
```typescript
export default async function Page() {
  'use cache'
  
  const data = await getCachedData()
  return <div>{data}</div>
}
```

### "use cache: private" (Private Cache)

**Syntax:**
```typescript
"use cache: private"
```

**Always requires Suspense wrapper:**
```typescript
export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <UserContent />
    </Suspense>
  )
}

async function UserContent() {
  'use cache: private'
  
  const cookieStore = await cookies()
  const userId = cookieStore.get('userId')?.value
  const user = await fetchUser(userId)
  
  return <div>Hello, {user.name}!</div>
}
```

---

## <a id="cache-config"></a>11. Cache Configuration

### cacheLife()

**Built-in profiles:**

```typescript
import { cacheLife } from 'next/cache'

// 'seconds' - Very short-lived (special: stale=30s for prefetch)
cacheLife('seconds')  // stale: 30, revalidate: 1, expire: 1

// 'minutes' - Frequently updated content
cacheLife('minutes')  // stale: 300, revalidate: 60, expire: 3600

// 'hours' - Regularly updated content
cacheLife('hours')    // stale: 300, revalidate: 3600, expire: 86400

// 'days' - Infrequently updated content
cacheLife('days')     // stale: 300, revalidate: 86400, expire: 604800

// 'weeks' - Rarely updated content
cacheLife('weeks')    // stale: 300, revalidate: 604800, expire: 2592000

// 'max' - Immutable or very stable content
cacheLife('max')      // stale: 300, revalidate: 2592000, expire: 31536000
```

**Custom profile:**
```typescript
cacheLife({
  stale: 60,        // Client caches for 60 seconds
  revalidate: 300,  // Revalidates every 5 minutes
  expire: 3600      // Expires after 1 hour
})
```

**Define custom profiles in next.config.js:**
```javascript
module.exports = {
  cacheLife: {
    blog: {
      stale: 1800,      // 30 minutes
      revalidate: 3600,  // 1 hour
      expire: 86400      // 24 hours
    },
    products: {
      stale: 300,        // 5 minutes
      revalidate: 900,   // 15 minutes
      expire: 7200       // 2 hours
    }
  }
}
```

**Use custom profile:**
```typescript
async function BlogPost() {
  'use cache'
  cacheLife('blog')  // Uses custom 'blog' profile
  
  const post = await fetchPost()
  return <article>{post.content}</article>
}
```

### cacheTag()

**Multiple tags for granular invalidation:**

```typescript
import { cacheTag } from 'next/cache'

async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  'use cache'
  
  const { id } = await params
  
  // Multiple tags for different invalidation scenarios
  cacheTag('products', `product-${id}`)
  
  const product = await fetchProduct(id)
  return <div>{product.name}</div>
}

// Invalidate all products:
// updateTag('products')

// Invalidate specific product:
// updateTag(`product-${id}`)
```

**Tag propagation:**
```typescript
async function outer() {
  'use cache'
  cacheTag('outer')
  
  const data = await inner()  // inner's tags propagate
  return data
}

async function inner() {
  'use cache'
  cacheTag('inner')
  return 'data'
}

// Both 'outer' and 'inner' tags are associated with the cache entry
```

---

## <a id="cache-invalidation"></a>12. Cache Invalidation

### updateTag() (Server Actions Only)

**Use for read-your-own-writes semantics:**

```typescript
'use server'
import { updateTag } from 'next/cache'

export async function createPost(data: FormData) {
  const post = await db.posts.create({
    title: data.get('title'),
    content: data.get('content')
  })
  
  updateTag('posts')  // User sees their own write immediately
  updateTag(`post-${post.id}`)
}
```

**Characteristics:**
- ✅ Immediate cache expiry
- ✅ User sees their changes right away
- ✅ No profile parameter needed
- ❌ Only for Server Actions (not Route Handlers)

### revalidateTag(tag, profile) (Anywhere)

**Use for background revalidation:**

```typescript
// In Server Action
'use server'
import { revalidateTag } from 'next/cache'

export async function backgroundUpdate() {
  await someDataUpdate()
  revalidateTag('products', 'max')  // Stale-while-revalidate
}

// In Route Handler
export async function POST(request: Request) {
  await db.update(await request.json())
  revalidateTag('data', 'hours')
  return Response.json({ success: true })
}
```

**Profiles:**
- `'max'` - Maximum staleness (30 days)
- `'days'` - Daily revalidation
- `'hours'` - Hourly revalidation (default)
- `'minutes'` - Frequent revalidation
- Custom profile name from config

### refresh() (Server Actions Only)

**Refresh client router cache:**

```typescript
'use server'
import { refresh } from 'next/cache'

export async function refreshAction() {
  // Perform some update
  await db.update()
  
  // Refresh the current page in the client
  refresh()
}
```

**Use cases:**
- Form submission staying on same page
- In-place content updates
- Real-time updates without navigation

---

## <a id="dynamic-static"></a>13. Dynamic vs Static Rendering

### Understanding connection()

**Purpose:** Explicitly mark a component as dynamic when you're not using cookies/headers/searchParams.

**Official Use Cases:**
- Using `Math.random()` or `Date.now()`
- Need dynamic rendering for non-request data
- Want different render output per request

```typescript
import { connection } from 'next/server'

export default async function Page() {
  await connection()  // Mark as dynamic
  
  const currentYear = new Date().getFullYear()
  const random = Math.random()
  
  return (
    <div>
      <p>Year: {currentYear}</p>
      <p>Random: {random}</p>
    </div>
  )
}
```

### ❌ Anti-Pattern: Empty headers()/cookies() Calls

**WRONG:**
```typescript
import { headers } from 'next/headers'

export default async function Footer() {
  await headers()  // ❌ BAD - Using as side effect
  
  const year = new Date().getFullYear()
  return <footer>{year}</footer>
}
```

**Why it's bad:**
- Not semantically correct
- Misleading to readers
- Makes code harder to understand

**RIGHT:**
```typescript
import { connection } from 'next/server'

export default async function Footer() {
  await connection()  // ✅ GOOD - Clear intent
  
  const year = new Date().getFullYear()
  return <footer>{year}</footer>
}
```

### Decision Tree

```
Component needs to render per-request?
├─ Uses cookies/headers/searchParams?
│  └─ YES → Don't need connection() (already dynamic)
│
└─ Uses Math.random()/Date.now()?
   └─ YES → Use await connection()
```

---

## <a id="public-caches"></a>14. Public Caches

### Basic Pattern

```typescript
async function getCachedRandom() {
  'use cache'
  cacheLife('frequent')
  return Math.random()
}

export default async function Page() {
  const x = await getCachedRandom()
  return <p id="x">{x}</p>
}
```

**Behavior:**
- Initial load: x = 0.123
- Refresh: x = 0.123 (SAME! cached)
- Different arg: New cache entry

### Multi-Tag Pattern

```typescript
async function getCachedWithTag({ tag }: { tag: string }) {
  'use cache'
  cacheTag(tag, 'shared')
  
  const data = await fetch('https://api.example.com/data')
  return data
}

export default async function Page() {
  const a = await getCachedWithTag({ tag: 'a' })
  const b = await getCachedWithTag({ tag: 'b' })
  
  return (
    <div>
      <p id="a">{a}</p>
      <p id="b">{b}</p>
    </div>
  )
}

// updateTag('a') → Only 'a' updates
// updateTag('shared') → BOTH update
```

### fetch() Inside 'use cache'

```typescript
async function getData() {
  'use cache'
  
  return fetch('https://api.example.com/random').then(res => res.text())
}

export default async function Page() {
  return <p id="random">{await getData()}</p>
}
```

**Behavior:**
- `'use cache'` overrides fetch cache options
- Result: fetch result is cached by the function cache
- Even with `cache: 'no-store'`, the function result is cached

### Referential Equality

```typescript
async function getObject(arg: unknown) {
  'use cache'
  return { arg }
}

export default async function Page() {
  const obj1 = await getObject(1)
  const obj2 = await getObject(1)
  
  // obj1 === obj2 (SAME OBJECT REFERENCE!)
  return <p>{String(obj1 === obj2)}</p>  // true
}
```

**Critical insight:** `'use cache'` returns the EXACT same object reference for the same args, not just equal values.

---

## <a id="private-caches"></a>15. Private Caches

### Basic Pattern

```typescript
export default function Page() {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <Private />
    </Suspense>
  )
}

async function Private() {
  'use cache: private'
  cacheLife({ stale: 420 })
  
  const cookieStore = await cookies()
  const cookie = cookieStore.get('test-cookie')
  
  return <pre>test-cookie: {cookie?.value || '<empty>'}</pre>
}
```

**Behavior:**
- Set cookie to 'foo' → displays 'foo'
- Change cookie to 'bar' → displays 'bar' (per-user cache)
- Different users see different cached values

### Rules for Private Cache

1. **MUST** wrap in Suspense (build error if not)
2. **CAN** access cookies(), headers(), searchParams, params
3. **CANNOT** use connection() (throws error)
4. **Excluded** from static prerender (always dynamic)
5. **Included** in runtime prefetch (if stale >= 30s)

### When to Use Private Cache

```
Content is per-user AND can be prefetched?
├─ YES, AND updates occasionally → 'use cache: private'
│  (e.g., user settings, preferences, personalized dashboard)
│
└─ NO, updates constantly → Leave dynamic
   (e.g., real-time notifications, live chat)
```

---

## <a id="runtime-prefetch"></a>16. Runtime Prefetching

### What is Runtime Prefetch?

Runtime prefetching generates prefetch responses with actual cookie/header/param values during navigation, allowing personalized content to be prefetched.

### Configuration

```typescript
export const unstable_prefetch = {
  mode: 'runtime',
  samples: [
    {
      cookies: [
        { name: 'userId', value: '123' },
        { name: 'theme', value: 'dark' }
      ],
      headers: [
        ['x-custom-header', 'value']
      ],
      params: { id: '1' },
      searchParams: { q: 'query' }
    }
  ]
}
```

### Example with Cookies

```typescript
// app/dashboard/page.tsx

export const unstable_prefetch = {
  mode: 'runtime',
  samples: [{ cookies: [{ name: 'userId', value: '123' }] }]
}

export default async function Dashboard() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DashboardContent />
    </Suspense>
  )
}

async function DashboardContent() {
  const cookieStore = await cookies()
  const userId = cookieStore.get('userId')?.value
  
  const data = await fetchUserData(userId)
  return <div>Welcome, {data.name}!</div>
}
```

**Behavior:**
1. Link becomes visible → Prefetch with sample userId='123'
2. Prefetch includes: "Welcome, User123!"
3. Navigate → Instant show (from prefetch)

### Multiple Samples

```typescript
export const unstable_prefetch = {
  mode: 'runtime',
  samples: [
    // Free plan user
    { cookies: [{ name: 'plan', value: 'free' }] },
    
    // Pro plan user
    { cookies: [{ name: 'plan', value: 'pro' }] },
    
    // Enterprise plan user
    { cookies: [{ name: 'plan', value: 'enterprise' }] }
  ]
}
```

**Use cases:**
- Different user tiers
- Auth vs unauth states
- Different regions/locales

### Inclusion Rules

**Included in runtime prefetch:**
- ✅ All public caches (`'use cache'`)
- ✅ Private caches with stale >= 30s
- ✅ params/searchParams/cookies/headers (from samples)
- ❌ Uncached IO (connection(), direct DB)

**Thresholds:**
- Static prefetch: expire >= 300s (5 minutes)
- Runtime prefetch: stale >= 30s (30 seconds)

---

## <a id="segment-cache"></a>17. Segment Caching (Client-Side)

### What is Segment Cache?

The **segment cache** is Next.js 16's client-side router cache that stores prefetched route segments.

### Basic Behavior

```typescript
// Step 1: Link becomes visible
<Link href="/blog/post-1">Read Post</Link>
// → Triggers prefetch
// → Stores result in client segment cache

// Step 2: User clicks link
// → Reads from segment cache (instant navigation!)
// → No network request

// Step 3: Navigate back, then forward
// → Still uses segment cache (if not stale)
```

### Stale Time

```typescript
async function Page() {
  'use cache'
  cacheLife({ stale: 300 })  // 5 minutes
  
  const data = await fetch('...')
  return <div>{data}</div>
}

// T=0: Prefetch page → stored in segment cache
// T=4min: Link visible again → NO new prefetch (still fresh)
// T=5min+1s: Link visible again → NEW prefetch (stale time elapsed)
```

**Configuration:**
```javascript
// next.config.js
module.exports = {
  experimental: {
    staleTimes: {
      dynamic: 30,   // Dynamic content stays fresh for 30s
      static: 300    // Static content stays fresh for 5min
    }
  }
}
```

### Invalidation

**Segment cache is cleared when:**
- `revalidateTag()` / `updateTag()` / `revalidatePath()` called
- Stale time threshold exceeded
- Navigation to different base route

```typescript
// Server Action that clears segment cache
'use server'
import { updateTag } from 'next/cache'

export async function updateProduct(id: string) {
  await db.products.update({ where: { id } })
  updateTag(`product-${id}`)  // Clears server + client cache
}
```

---

## <a id="generate-static-params"></a>18. generateStaticParams

### What is generateStaticParams?

Pre-generates dynamic routes at build time for specified parameter values.

### Basic Usage

```typescript
// app/blog/[slug]/page.tsx

export async function generateStaticParams() {
  const posts = await fetchAllPosts()
  
  return posts.map(post => ({
    slug: post.slug
  }))
}

export default async function Page(props) {
  const params = await props.params
  const post = await fetchPost(params.slug)
  
  return <article>{post.content}</article>
}
```

**Behavior:**
- Build time: Prerenders routes for all returned params
- Missing params: Generated on-demand (ISR)

### Cardinality Strategy

```typescript
// LOW CARDINALITY: Generate all at build
export async function generateStaticParams() {
  return [
    { category: 'electronics' },
    { category: 'books' },
    { category: 'clothing' }
  ]
}

// HIGH CARDINALITY: Generate popular ones only
export async function generateStaticParams() {
  const popular = await db.products
    .orderBy('views', 'desc')
    .limit(100)
    .select('id')
  
  return popular.map(p => ({ id: p.id }))
}
```

### Mixed Cardinality (Advanced)

```typescript
// app/[locale]/[category]/[id]/layout.tsx

// Low cardinality: 2 locales
export async function generateStaticParams() {
  return [{ locale: 'en' }, { locale: 'es' }]
}

// Medium cardinality: 5 categories
export async function generateStaticParams() {
  return [
    { category: 'tech' },
    { category: 'lifestyle' },
    { category: 'business' },
    { category: 'health' },
    { category: 'travel' }
  ]
}

// High cardinality: top 50 products only
export async function generateStaticParams() {
  const popular = await getPopularProducts(50)
  return popular.map(p => ({ id: p.id }))
}

// Total prerendered: 2 × 5 × 50 = 500 routes
// Other routes: Generated on-demand (ISR)
```

### Partial Prerendering with generateStaticParams

```typescript
// app/[lowcard]/[highcard]/page.tsx

// Parent layout: Generate all low-cardinality params
export async function generateStaticParams() {
  return [{ lowcard: 'one' }, { lowcard: 'two' }]
}

// Child page: Generate only ONE high-cardinality param
export async function generateStaticParams() {
  return [{ highcard: 'popular' }]
}

// Routes behavior:
// /one/popular → FULLY prerendered (both in GSP)
// /one/other → PARTIAL prerender (lowcard in GSP, highcard not)
//   - Layout: Static shell
//   - Page: Dynamic hole
//   - Suspense fallback: Shows during load

// /three/other → FULLY dynamic (neither in GSP)
```

---

## <a id="clean-code"></a>18. Clean Code Practices

### Project Structure

```
src/
├── app/                    # App Router pages
│   ├── (auth)/            # Route groups
│   ├── api/               # API routes
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
│
├── components/            # React components
│   ├── ui/               # shadcn components
│   ├── forms/            # Form components
│   ├── layout/           # Layout components
│   └── shared/           # Shared components
│
├── lib/                   # Utility functions
│   ├── db.ts             # Database client
│   ├── auth.ts           # Auth helpers
│   └── utils.ts          # General utilities
│
├── types/                 # TypeScript types
│   ├── database.ts       # Database types
│   ├── api.ts            # API types
│   └── index.ts          # Exported types
│
├── actions/              # Server Actions
│   ├── auth.ts           # Auth actions
│   ├── posts.ts          # Post actions
│   └── users.ts          # User actions
│
├── hooks/                # Custom React hooks
│   └── use-auth.ts      # Auth hook
│
└── config/               # Configuration
    ├── site.ts           # Site config
    └── constants.ts      # Constants
```

### Type Organization

```typescript
// types/database.ts
export type User = {
  id: string
  email: string
  name: string
  created_at: string
}

export type Post = {
  id: string
  title: string
  content: string
  author_id: string
  author?: User
  created_at: string
}

// types/api.ts
export type ApiResponse<T> = {
  data: T | null
  error: string | null
}

export type PaginatedResponse<T> = {
  data: T[]
  page: number
  total: number
  hasMore: boolean
}

// types/index.ts
export * from './database'
export * from './api'
```

### Component Patterns

```typescript
// ✅ GOOD: Clear component structure
// components/posts/post-card.tsx
import { type Post } from '@/types'

interface PostCardProps {
  post: Post
  onDelete?: (id: string) => void
}

export function PostCard({ post, onDelete }: PostCardProps) {
  return (
    <article className="rounded-lg border bg-card p-4">
      <h3 className="text-xl font-semibold">{post.title}</h3>
      <p className="text-muted-foreground">{post.content}</p>
    </article>
  )
}
```

### Server Action Patterns

```typescript
// actions/posts.ts
'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { type Post } from '@/types'

// Define schema
const createPostSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1),
})

// Server Action with validation
export async function createPost(formData: FormData) {
  // Validate
  const validated = createPostSchema.parse({
    title: formData.get('title'),
    content: formData.get('content'),
  })

  // Authenticate (example)
  const user = await getCurrentUser()
  if (!user) throw new Error('Unauthorized')

  // Execute
  const post = await db.posts.create({
    data: {
      ...validated,
      author_id: user.id,
    },
  })

  // Revalidate
  revalidatePath('/posts')
  
  return post
}
```

### Naming Conventions

**Files:**
- Components: `kebab-case.tsx` (e.g., `user-profile.tsx`)
- Server Actions: `kebab-case.ts` (e.g., `create-post.ts`)
- Types: `kebab-case.ts` (e.g., `database.ts`)

**Functions:**
- Components: `PascalCase` (e.g., `UserProfile`)
- Functions: `camelCase` (e.g., `fetchUserPosts`)
- Server Actions: `camelCase` (e.g., `createPost`)
- Types: `PascalCase` (e.g., `User`, `Post`)

**Constants:**
- `UPPER_SNAKE_CASE` (e.g., `API_BASE_URL`)

---

## <a id="ui-patterns"></a>19. UI Patterns with Shadcn

### Semantic Color Usage

```typescript
// ❌ BAD: Hard-coded colors
<div className="bg-gray-100 text-gray-900 border-gray-300">
  <button className="bg-blue-500 text-white hover:bg-blue-600">
    Click me
  </button>
</div>

// ✅ GOOD: Semantic Tailwind classes
<div className="bg-background text-foreground border-border">
  <button className="bg-primary text-primary-foreground hover:bg-primary/90">
    Click me
  </button>
</div>
```

### Available Shadcn Color Tokens

```typescript
// Background colors
bg-background          // Main background
bg-foreground         // Text color (inverse of background)
bg-card               // Card background
bg-popover            // Popover background
bg-primary            // Primary brand color
bg-secondary          // Secondary color
bg-muted              // Muted background
bg-accent             // Accent color
bg-destructive        // Destructive actions (red)

// Text colors
text-foreground       // Primary text
text-muted-foreground // Muted text
text-primary          // Primary color text
text-primary-foreground // Text on primary bg
text-secondary-foreground // Text on secondary bg
text-destructive      // Destructive text

// Border colors
border                // Default border
border-input          // Input borders
```

### Card Pattern

```typescript
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'

export function PostCard({ post }: { post: Post }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{post.title}</CardTitle>
        <CardDescription>
          By {post.author?.name} • {formatDate(post.created_at)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">{post.content}</p>
      </CardContent>
    </Card>
  )
}
```

### Button Pattern

```typescript
import { Button } from '@/components/ui/button'

// Variants
<Button variant="default">Primary</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="destructive">Delete</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="link">Link</Button>

// Sizes
<Button size="default">Default</Button>
<Button size="sm">Small</Button>
<Button size="lg">Large</Button>
<Button size="icon"><Icon /></Button>
```

### Form Pattern

```typescript
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'

export function PostForm({ action }: { action: (formData: FormData) => Promise<void> }) {
  return (
    <form action={action} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input 
          id="title" 
          name="title" 
          placeholder="Enter title..."
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="content">Content</Label>
        <Textarea 
          id="content" 
          name="content" 
          placeholder="Write content..."
          rows={5}
          required
        />
      </div>

      <Button type="submit">Create Post</Button>
    </form>
  )
}
```

### Loading States

```typescript
import { Skeleton } from '@/components/ui/skeleton'

export function PostCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-20 w-full" />
      </CardContent>
    </Card>
  )
}

// Usage with Suspense
<Suspense fallback={<PostCardSkeleton />}>
  <PostCard post={post} />
</Suspense>
```

### Layout Pattern

```typescript
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center">
          <nav className="flex items-center gap-6">
            {/* Navigation */}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-6">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t bg-muted/50">
        <div className="container py-6 text-center text-sm text-muted-foreground">
          © 2025 Your App
        </div>
      </footer>
    </div>
  )
}
```

---

## <a id="use-client"></a>20. "use client" Guide

### When to Use "use client"

**Use `'use client'` when you need:**

1. **React Hooks** - useState, useEffect, useContext, etc.
2. **Event Handlers** - onClick, onChange, onSubmit
3. **Browser APIs** - localStorage, window, document
4. **Third-Party Client Libraries** - React Query, Zustand, etc.

**Don't use `'use client'` when:**
- Component only renders static UI
- Only need data fetching (fetch on server)
- Using Server Components features

### Syntax

```typescript
'use client'

import { useState } from 'react'

export default function Counter() {
  const [count, setCount] = useState(0)
  
  return (
    <button onClick={() => setCount(count + 1)}>
      Count: {count}
    </button>
  )
}
```

### Props Serialization

**Props from Server → Client must be serializable:**

**✅ Serializable:**
```typescript
// Server Component
export default function Page() {
  return (
    <ClientComponent
      text="Hello"
      number={42}
      array={[1, 2, 3]}
      object={{ key: 'value' }}
      date={new Date().toISOString()}  // Convert to string
      jsx={<div>JSX element</div>}
      serverAction={myServerAction}  // Server Action
    />
  )
}
```

**❌ Non-Serializable:**
```typescript
// Server Component
export default function Page() {
  const handleClick = () => console.log('clicked')  // ❌ Function
  const user = new User('John')  // ❌ Class instance
  
  return (
    <ClientComponent
      onClick={handleClick}  // ❌ ERROR
      user={user}  // ❌ ERROR
    />
  )
}
```

**Fix: Use Server Actions:**
```typescript
// Server Component
'use server'
async function handleClick() {
  console.log('clicked on server')
}

export default function Page() {
  return <ClientComponent action={handleClick} />  // ✅ Works
}

// Client Component
'use client'
export function ClientComponent({ action }) {
  return <button onClick={() => action()}>Click</button>
}
```

### Composition Patterns

#### Pattern 1: Move Client Component Down

```typescript
// ❌ BAD - Entire page becomes client
'use client'
export default function Page() {
  const [theme, setTheme] = useState('light')
  return (
    <div>
      <ExpensiveServerComponent />  {/* Forces client */}
    </div>
  )
}

// ✅ GOOD - Only button is client
export default function Page() {
  return (
    <div>
      <ExpensiveServerComponent />  {/* Stays server */}
      <ThemeToggle />  {/* Only this is client */}
    </div>
  )
}

// components/theme-toggle.tsx
'use client'
export function ThemeToggle() {
  const [theme, setTheme] = useState('light')
  return <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
    Toggle
  </button>
}
```

#### Pattern 2: Pass Server Components as Children

```typescript
// Client Component
'use client'
export function Tabs({ children }) {
  const [active, setActive] = useState(0)
  return <div>{children}</div>
}

// Server Component (parent)
export default function Page() {
  return (
    <Tabs>
      {/* These stay as Server Components! */}
      <ExpensiveDataFetch />
      <AnotherServerComponent />
    </Tabs>
  )
}
```

#### Pattern 3: Context Provider Wrapper

```typescript
// app/providers.tsx
'use client'
import { createContext, useState } from 'react'

export const ThemeContext = createContext()

export function Providers({ children }) {
  const [theme, setTheme] = useState('light')
  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

// app/layout.tsx (Server Component)
import { Providers } from './providers'

export default function Layout({ children }) {
  return (
    <html>
      <body>
        <Providers>
          {children}  {/* Can still be Server Components */}
        </Providers>
      </body>
    </html>
  )
}
```

---

## <a id="composition"></a>20. Composition Patterns

### Server + Client Composition

**Goal:** Maximize server rendering, minimize client JavaScript

```typescript
// ✅ Best Practice: Hybrid Composition
export default async function Page() {
  // Server: Fetch data
  const posts = await fetchPosts()
  
  return (
    <div>
      {/* Server: Static header */}
      <Header />
      
      {/* Server: List rendering */}
      <PostList posts={posts} />
      
      {/* Client: Interactive search */}
      <SearchBar />
      
      {/* Server: Footer */}
      <Footer />
    </div>
  )
}
```

### Nested Cache Boundaries

```typescript
export default async function Page() {
  'use cache'
  cacheLife('hours')
  cacheTag('page')
  
  return (
    <div>
      <CachedHeader />  {/* Separate cache */}
      
      <Suspense fallback={<Loading />}>
        <DynamicContent />  {/* Not cached */}
      </Suspense>
      
      <CachedFooter />  {/* Separate cache */}
    </div>
  )
}

async function CachedHeader() {
  'use cache'
  cacheLife('days')
  cacheTag('header')
  
  const settings = await fetchSiteSettings()
  return <header>{settings.title}</header>
}

async function CachedFooter() {
  'use cache'
  cacheLife('days')
  cacheTag('footer')
  
  const links = await fetchFooterLinks()
  return <footer>{links.map(...)}</footer>
}
```

### Parallel Data Fetching

```typescript
export default async function Page() {
  // Parallel: Start all fetches at once
  const [user, posts, comments] = await Promise.all([
    fetchUser(),
    fetchPosts(),
    fetchComments()
  ])
  
  return (
    <div>
      <UserProfile user={user} />
      <Posts posts={posts} />
      <Comments comments={comments} />
    </div>
  )
}
```

### Waterfall Prevention

```typescript
// ❌ BAD - Waterfall (serial)
export default async function Page() {
  const user = await fetchUser()  // Wait
  const posts = await fetchPosts(user.id)  // Then wait
  const comments = await fetchComments(posts[0].id)  // Then wait
  
  return <div>...</div>
}

// ✅ GOOD - Parallel where possible
export default async function Page() {
  const user = await fetchUser()
  
  // These can run in parallel
  const [posts, userSettings] = await Promise.all([
    fetchPosts(user.id),
    fetchUserSettings(user.id)
  ])
  
  return <div>...</div>
}
```

---

## <a id="optimization"></a>21. Performance Optimization

### 1. Cache Strategically

**Principle:** Cache shared content, leave personalized content dynamic

```typescript
// ✅ Cache shared content
async function ProductList() {
  'use cache'
  cacheLife('hours')
  cacheTag('products')
  
  const products = await fetchProducts()
  return <div>{products.map(...)}</div>
}

// ✅ Leave user content dynamic
async function UserCart() {
  const user = await getCurrentUser()
  const cart = await fetchCart(user.id)
  return <div>Cart: {cart.items.length}</div>
}
```

### 2. Use Suspense Boundaries

**Benefit:** Show partial content immediately, stream rest

```typescript
export default function Page() {
  return (
    <div>
      {/* Show immediately */}
      <Header />
      
      {/* Stream when ready */}
      <Suspense fallback={<Skeleton />}>
        <SlowComponent />
      </Suspense>
      
      {/* Show immediately */}
      <Footer />
    </div>
  )
}
```

### 3. Minimize Client JavaScript

```typescript
// ❌ Forces entire component tree to client
'use client'
export default function Page() {
  const [count, setCount] = useState(0)
  return (
    <div>
      <LargeServerComponent />  {/* Now client-side */}
      <button onClick={() => setCount(count + 1)}>+</button>
    </div>
  )
}

// ✅ Only interactive part is client
export default function Page() {
  return (
    <div>
      <LargeServerComponent />  {/* Server Component */}
      <Counter />  {/* Small Client Component */}
    </div>
  )
}
```

### 4. Prefetch Critical Routes

```typescript
import Link from 'next/link'

// High-traffic routes: Prefetch automatically
<Link href="/products" prefetch={true}>
  Products
</Link>

// Low-traffic routes: Don't prefetch
<Link href="/terms" prefetch={false}>
  Terms of Service
</Link>

// Dynamic routes with samples: Use runtime prefetch
export const unstable_prefetch = {
  mode: 'runtime',
  samples: [{ cookies: [{ name: 'userId', value: '123' }] }]
}
```

### 5. Optimize Images

```typescript
import Image from 'next/image'

// ✅ Use next/image for automatic optimization
<Image
  src="/hero.jpg"
  alt="Hero"
  width={1200}
  height={600}
  priority  // For above-the-fold images
/>

// ✅ Lazy load below-the-fold images
<Image
  src="/feature.jpg"
  alt="Feature"
  width={800}
  height={400}
  loading="lazy"
/>
```

### 6. Database Query Optimization

```typescript
// ❌ BAD: N+1 query problem
async function PostsList() {
  const { data: posts } = await db.from('posts').select('*')
  
  // This creates N additional queries!
  const postsWithAuthors = await Promise.all(
    posts.map(async (post) => {
      const { data: author } = await db
        .from('users')
        .select('*')
        .eq('id', post.author_id)
        .single()
      return { ...post, author }
    })
  )
  
  return <div>{/* render posts */}</div>
}

// ✅ GOOD: Use joins/relations
async function PostsList() {
  // Single query with join
  const { data: posts } = await db
    .from('posts')
    .select('*, author:users(*)')
  
  return (
    <div className="space-y-4">
      {posts?.map((post) => (
        <PostCard key={post.id} post={post} author={post.author} />
      ))}
    </div>
  )
}
```

---

## <a id="security"></a>22. Security Best Practices

### 1. Environment Variables

```bash
# .env.local

# ❌ DON'T prefix sensitive keys with NEXT_PUBLIC_
NEXT_PUBLIC_DATABASE_URL=postgres://...  # Exposed to client!

# ✅ Server-only variables (no prefix)
DATABASE_URL=postgres://...
API_SECRET_KEY=secret123

# ✅ Client-safe variables (NEXT_PUBLIC_ prefix)
NEXT_PUBLIC_API_URL=https://api.example.com
NEXT_PUBLIC_GA_ID=UA-123456789-1
```

### 2. Server Actions Security

```typescript
// ✅ Always validate inputs
'use server'
import { z } from 'zod'

const schema = z.object({
  email: z.string().email(),
  message: z.string().min(10).max(1000)
})

export async function submitContact(formData: FormData) {
  // Validate
  const data = schema.parse({
    email: formData.get('email'),
    message: formData.get('message')
  })
  
  // Authenticate
  const user = await auth()
  if (!user) throw new Error('Unauthorized')
  
  // Authorize
  if (!user.canSubmitContact) throw new Error('Forbidden')
  
  // Execute
  await db.contacts.create({ data })
}
```

### 3. SQL Injection Prevention

```typescript
// ❌ NEVER concatenate user input
async function getUser(email: string) {
  const query = `SELECT * FROM users WHERE email = '${email}'`
  return await db.$queryRaw(query)  // SQL injection risk!
}

// ✅ Use parameterized queries
async function getUser(email: string) {
  return await db.user.findUnique({
    where: { email }  // Automatically parameterized
  })
}

// ✅ Or use tagged templates
async function getUser(email: string) {
  return await db.$queryRaw`SELECT * FROM users WHERE email = ${email}`
}
```

### 4. XSS Prevention

```typescript
// ✅ React automatically escapes by default
export default function Page({ userInput }) {
  return <div>{userInput}</div>  // Safe
}

// ❌ dangerouslySetInnerHTML bypasses escaping
export default function Page({ userInput }) {
  return <div dangerouslySetInnerHTML={{ __html: userInput }} />  // XSS risk!
}

// ✅ If you must use HTML, sanitize it
import DOMPurify from 'isomorphic-dompurify'

export default function Page({ userInput }) {
  const clean = DOMPurify.sanitize(userInput)
  return <div dangerouslySetInnerHTML={{ __html: clean }} />
}
```

### 5. CSRF Protection (built-in)

Next.js Server Actions have built-in CSRF protection via origin checking.

```typescript
// ✅ Server Actions are CSRF-protected automatically
'use server'
export async function updateProfile(data: FormData) {
  // Next.js verifies request origin matches app domain
  await db.users.update(...)
}
```

### 6. Input Sanitization

```typescript
// ✅ Always sanitize and validate user inputs
import { z } from 'zod'

const emailSchema = z.string().email().toLowerCase().trim()
const contentSchema = z.string().min(1).max(5000).trim()

export async function submitForm(formData: FormData) {
  'use server'
  
  const validated = {
    email: emailSchema.parse(formData.get('email')),
    content: contentSchema.parse(formData.get('content')),
  }
  
  // Process validated data...
}
```

---

## <a id="common-mistakes"></a>23. Common Mistakes

### ❌ Mistake 1: Segment Configs with Cache Components

```typescript
// ❌ BUILD ERROR when cacheComponents enabled
export const dynamic = 'force-static'
export const revalidate = 60

// ✅ Use Cache Components directives
export default async function Page() {
  'use cache'
  cacheLife('hours')
}
```

### ❌ Mistake 2: Not Awaiting Async APIs

```typescript
// ❌ Type errors
const id = params.id
const token = cookies().get('token')

// ✅ Always await
const { id } = await params
const token = (await cookies()).get('token')
```

### ❌ Mistake 3: Using Functions in 'use cache'

```typescript
// ❌ Functions aren't part of cache key
async function cached(id: number, callback: () => void) {
  'use cache'
  const data = await fetchData(id)
  callback()  // Different callbacks, same cache!
  return data
}

// ✅ Use Server Actions if you need callbacks
async function cached(id: number) {
  'use cache'
  return await fetchData(id)
}

// Call Server Action from outside cache
```

### ❌ Mistake 4: Private Cache Without Suspense

```typescript
// ❌ BUILD ERROR
export default function Page() {
  return <Private />
}

async function Private() {
  'use cache: private'
  return <div>Content</div>
}

// ✅ Must wrap in Suspense
export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <Private />
    </Suspense>
  )
}
```

### ❌ Mistake 5: Using connection() in Cache Scope

```typescript
// ❌ ERROR
async function Component() {
  'use cache'
  await connection()  // Cannot use in cache scope!
  return <div>Content</div>
}

// ✅ Use connection() outside cache
async function Component() {
  await connection()
  const data = await getCached()
  return <div>{data}</div>
}

async function getCached() {
  'use cache'
  return await fetchData()
}
```

### ❌ Mistake 6: Empty headers()/cookies() to Mark Dynamic

```typescript
// ❌ Anti-pattern
import { headers } from 'next/headers'

async function Footer() {
  await headers()  // Using as side effect
  return <footer>{new Date().getFullYear()}</footer>
}

// ✅ Use connection() for clear intent
import { connection } from 'next/server'

async function Footer() {
  await connection()
  return <footer>{new Date().getFullYear()}</footer>
}
```

### ❌ Mistake 7: 'use client' Too High

```typescript
// ❌ Forces entire page to client
'use client'
export default function Page() {
  const [search, setSearch] = useState('')
  
  return (
    <div>
      <ExpensiveDataComponent />  {/* Now client-side! */}
      <input value={search} onChange={e => setSearch(e.target.value)} />
    </div>
  )
}

// ✅ Move 'use client' down
export default async function Page() {
  return (
    <div>
      <ExpensiveDataComponent />  {/* Stays server */}
      <SearchInput />  {/* Only this is client */}
    </div>
  )
}

'use client'
function SearchInput() {
  const [search, setSearch] = useState('')
  return <input value={search} onChange={e => setSearch(e.target.value)} />
}
```

---

## <a id="error-patterns"></a>24. Error Patterns & Fixes

### Error 1: Segment Config Not Compatible

**Error:**
```
Route segment config "revalidate" is not compatible with
`nextConfig.experimental.cacheComponents`. Please remove it.
```

**Fix:**
```typescript
// Remove these exports
export const dynamic = 'force-static'
export const revalidate = 60
export const fetchCache = 'force-cache'
export const dynamicParams = false

// Use Cache Components instead
export default async function Page() {
  'use cache'
  cacheLife('hours')
}
```

### Error 2: Missing Suspense for Private Cache

**Error:**
```
Route: A component accessed data, headers, params, searchParams,
or a short-lived cache without a Suspense boundary.
```

**Fix:**
```typescript
// Wrap in Suspense
<Suspense fallback={<Loading />}>
  <PrivateCacheComponent />
</Suspense>
```

### Error 3: Params/SearchParams Not Awaited

**Error:**
```
Type 'Promise<{ id: string }>' is not assignable to type '{ id: string }'
```

**Fix:**
```typescript
// Change signature to async and await
export default async function Page(props) {
  const params = await props.params  // Add await
  return <div>{params.id}</div>
}
```

### Error 4: updateTag/refresh in Route Handler

**Error:**
```
updateTag() can only be used in Server Actions
```

**Fix:**
```typescript
// Use revalidateTag with profile in Route Handlers
export async function POST() {
  await db.update()
  revalidateTag('data', 'max')  // Not updateTag()
  return Response.json({ success: true })
}

// Use updateTag in Server Actions
'use server'
export async function myAction() {
  await db.update()
  updateTag('data')  // OK in Server Action
}
```


## <a id="troubleshooting"></a>25. Troubleshooting Guide

### Issue: Cache Not Working

**Symptoms:** Content always fresh, not cached

**Diagnosis:**
1. Check if `'use cache'` directive present
2. Verify cacheLife not too short
3. Check if accidentally accessing cookies/headers in public cache

**Solutions:**
```typescript
// ✅ Ensure directive is at function start
async function getData() {
  'use cache'  // Must be first
  cacheLife('hours')
  return await fetch('...')
}

// ✅ Check stale time for prefetch
'use cache: private'
cacheLife({ stale: 60 })  // Must be >= 30 for prefetch
```

### Issue: Build Fails with Cache Components

**Symptoms:** Build error mentioning segment configs

**Diagnosis:** Likely have incompatible segment configs

**Solution:**
```bash
# Search for segment configs
grep -r "export const dynamic\|export const revalidate\|export const fetchCache" app/

# Remove all found instances
# Replace with Cache Components directives
```

### Issue: Prefetch Not Working

**Symptoms:** Navigation not instant, no prefetch visible

**Diagnosis:**
1. Check if `unstable_prefetch` configured
2. Verify stale time >= 30s for runtime prefetch
3. Check browser DevTools Network tab

**Solutions:**
```typescript
// Add runtime prefetch config
export const unstable_prefetch = {
  mode: 'runtime',
  samples: [{ cookies: [...] }]
}

// Ensure stale time sufficient
cacheLife({ stale: 60 })  // >= 30s
```

### Issue: Hydration Errors

**Symptoms:** React hydration mismatch warnings

**Common Causes:**
1. Using Date.now() or Math.random() without cache
2. Accessing localStorage during render
3. Different server vs client rendering

**Solutions:**
```typescript
// ✅ Use connection() for time-based values
await connection()
const timestamp = Date.now()

// ✅ Or cache the value
'use cache'
const timestamp = Date.now()  // Frozen at cache time

// ✅ Use useEffect for client-only code
'use client'
import { useEffect, useState } from 'react'

function Component() {
  const [value, setValue] = useState(null)
  
  useEffect(() => {
    setValue(localStorage.getItem('key'))
  }, [])
  
  return <div>{value}</div>
}
```

---

## <a id="api-reference"></a>26. API Quick Reference

### Cache Directives

```typescript
'use cache'              // Public cache
'use cache: private'     // Private cache (per-user)
```

### Cache Configuration

```typescript
import { cacheLife, cacheTag } from 'next/cache'

cacheLife('seconds' | 'minutes' | 'hours' | 'days' | 'weeks' | 'max')
cacheLife({ stale: number, revalidate: number, expire: number })
cacheTag('tag1', 'tag2', ...)
```

### Cache Invalidation

```typescript
import { updateTag, revalidateTag, refresh } from 'next/cache'

updateTag('tag')                    // Server Actions only, immediate
revalidateTag('tag', profile)       // Anywhere, background with profile
refresh()                           // Server Actions only, client cache
```

### Request APIs

```typescript
import { cookies, headers, draftMode } from 'next/headers'
import { connection } from 'next/server'

const cookieStore = await cookies()
const headersList = await headers()
const draft = await draftMode()
await connection()
```

### Built-in cacheLife Profiles

| Profile | stale (s) | revalidate (s) | expire (s) | Use Case |
|---------|-----------|----------------|------------|----------|
| seconds | 30 | 1 | 1 | Real-time data |
| minutes | 300 | 60 | 3600 | Frequently updated |
| hours | 300 | 3600 | 86400 | Regular updates (default) |
| days | 300 | 86400 | 604800 | Daily updates |
| weeks | 300 | 604800 | 2592000 | Weekly updates |
| max | 300 | 2592000 | 31536000 | Immutable content |

---

## <a id="decision-trees"></a>27. Decision Trees

### Tree 1: Should I Use 'use cache' or 'use cache: private'?

```
Component to cache?
│
├─ Content same for all users?
│  │
│  ├─ YES → 'use cache' (Public)
│  │        + cacheLife() for time-based
│  │        + cacheTag() for on-demand
│  │
│  └─ NO → Accesses cookies/headers/searchParams?
│           │
│           ├─ YES → Per-user AND prefetchable?
│           │        │
│           │        ├─ YES → 'use cache: private'
│           │        │         + MUST wrap in Suspense
│           │        │         + stale >= 30s for prefetch
│           │        │
│           │        └─ NO → No cache directive
│           │                 + Use Suspense for UX
│           │
│           └─ NO → Uses Math.random/Date.now?
│                    │
│                    ├─ YES → Two options:
│                    │        1. await connection()
│                    │        2. 'use cache' (freezes value)
│                    │
│                    └─ NO → Should it be cached?
│                             │
│                             ├─ YES → 'use cache'
│                             │
│                             └─ NO → No cache directive
```

### Tree 2: Runtime Prefetch Configuration

```
Page uses dynamic data?
│
├─ NO → No config needed (static prefetch works)
│
└─ YES → Accesses cookies/headers/searchParams/params?
          │
          ├─ NO → No config needed OR prefetch={false}
          │
          └─ YES → Page visited frequently?
                   │
                   ├─ NO → prefetch={false} on Links
                   │
                   └─ YES → Add unstable_prefetch config
                            {
                              mode: 'runtime',
                              samples: [
                                {
                                  cookies: [...],
                                  headers: [...],
                                  params: {...},
                                  searchParams: {...}
                                }
                              ]
                            }
                            
Sample count decision:
├─ 1 sample → Homogeneous users
├─ 2-3 samples → Different user types (auth/unauth, plans)
└─ 3+ samples → Complex personalization
```

### Tree 3: Cache Invalidation Strategy

```
Server Action mutates data?
│
├─ YES → User needs immediate feedback?
│        │
│        ├─ YES → Staying on same page?
│        │        │
│        │        ├─ YES → refresh() + updateTag()
│        │        │
│        │        └─ NO → updateTag() + redirect()
│        │
│        └─ NO → Background update acceptable?
│                 │
│                 ├─ YES → revalidateTag(tag, 'max')
│                 │
│                 └─ NO → updateTag(tag)
│
└─ NO → Is this a Route Handler?
         │
         └─ YES → revalidateTag(tag, profile)
```

### Tree 4: "use client" Decision

```
Component needs:
│
├─ React Hooks (useState, useEffect, etc.)?
│  └─ YES → 'use client'
│
├─ Event handlers (onClick, onChange)?
│  └─ YES → 'use client'
│
├─ Browser APIs (localStorage, window)?
│  └─ YES → 'use client'
│
├─ Third-party client library?
│  └─ YES → 'use client'
│
├─ Only displays static data?
│  └─ NO 'use client' needed
│
├─ Only fetches data?
│  └─ NO 'use client' needed (fetch on server)
│
└─ Form submission?
   └─ Consider Server Actions (stay server)
```

---

## <a id="config-guide"></a>28. Configuration Guide

### Complete next.config.js

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // ========================================
  // CACHE COMPONENTS (Experimental)
  // ========================================
  experimental: {
    cacheComponents: true,  // Enable Cache Components mode
    
    // Proxy config (replaces middleware config)
    proxyPrefetch: 'strict',
    proxyClientMaxBodySize: 1024 * 1024,  // 1MB
    externalProxyRewritesResolve: false,
    
    // Turbopack config
    turbopackFileSystemCacheForDev: true,
    
    // Server Components external packages
    // MOVED TO TOP-LEVEL IN STABLE (from experimental)
  },
  
  // ========================================
  // CACHE LIFE PROFILES (Top-level)
  // ========================================
  cacheLife: {
    blog: {
      stale: 1800,      // 30 minutes
      revalidate: 3600, // 1 hour
      expire: 86400     // 24 hours
    },
    products: {
      stale: 300,       // 5 minutes
      revalidate: 900,  // 15 minutes
      expire: 7200      // 2 hours
    },
    marketing: {
      stale: 7200,       // 2 hours
      revalidate: 86400, // 1 day
      expire: 604800     // 7 days
    }
  },
  
  // ========================================
  // SERVER COMPONENTS EXTERNAL PACKAGES
  // ========================================
  serverComponentsExternalPackages: [
    '@prisma/client',
    'bcrypt',
    'sharp'
  ],
  
  // ========================================
  // IMAGES
  // ========================================
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.example.com',
        pathname: '/uploads/**'
      }
    ],
    localPatterns: [
      {
        pathname: '/img/**'  // Allow local images with query strings
      }
    ],
    minimumCacheTTL: 14400,  // 4 hours (new default in v16)
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [32, 48, 64, 96, 128, 256, 384],  // 16 removed in v16
    dangerouslyAllowLocalIP: false,  // Security (default in v16)
    maximumRedirects: 3  // New default in v16
  },
  
  // ========================================
  // REDIRECTS & REWRITES
  // ========================================
  async redirects() {
    return [
      {
        source: '/old-path',
        destination: '/new-path',
        permanent: true
      }
    ]
  },
  
  async rewrites() {
    return [
      {
        source: '/api/v2/:path*',
        destination: 'https://api.example.com/:path*'
      }
    ]
  },
  
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          }
        ]
      }
    ]
  },
  
  // ========================================
  // TYPESCRIPT
  // ========================================
  typescript: {
    ignoreBuildErrors: false
  },
  
  // ========================================
  // PROXY (URL NORMALIZATION)
  // ========================================
  skipProxyUrlNormalize: false,
  
  // ========================================
  // TURBOPACK (Default in v16)
  // ========================================
  // No config needed - Turbopack is default
  // Use --webpack flag if you need webpack
  
  // ========================================
  // WEBPACK (If needed)
  // ========================================
  webpack: (config, { isServer }) => {
    // Custom webpack config
    return config
  },
  
  // ========================================
  // OUTPUT
  // ========================================
  output: 'standalone',  // For Docker deployments
  
  // ========================================
  // COMPRESSION
  // ========================================
  compress: true,
  
  // ========================================
  // POWEREDBYHEADER
  // ========================================
  poweredByHeader: false  // Security: hide Next.js header
}

module.exports = nextConfig
```

### Environment Variables Template

```bash
# .env.local (DO NOT COMMIT)

# ========================================
# DATABASE
# ========================================
DATABASE_URL="your-database-connection-string"
# Example: postgresql://user:password@localhost:5432/dbname
# Example: https://xxx.supabase.co

# ========================================
# AUTHENTICATION
# ========================================
AUTH_SECRET="your-auth-secret-key"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# ========================================
# API KEYS (Server-only - NO NEXT_PUBLIC prefix)
# ========================================
API_SECRET_KEY="your-secret-api-key"
WEBHOOK_SECRET="your-webhook-secret"

# ========================================
# PUBLIC VARIABLES (Exposed to client)
# ========================================
NEXT_PUBLIC_API_URL="https://api.example.com"
NEXT_PUBLIC_SITE_URL="http://localhost:3000"

# ========================================
# THIRD-PARTY SERVICES (Example)
# ========================================
# Add your service-specific variables here
# Keep sensitive keys private (no NEXT_PUBLIC prefix)
# Only expose public/client-safe values

# ========================================
# DEVELOPMENT
# ========================================
NODE_ENV="development"
```

### Environment Variables Best Practices

```typescript
// ✅ GOOD: Server-side only
const apiKey = process.env.API_SECRET_KEY  // Not exposed to client

// ✅ GOOD: Client-side safe
const publicUrl = process.env.NEXT_PUBLIC_API_URL  // Exposed to client

// ❌ BAD: Sensitive data with NEXT_PUBLIC
const dbUrl = process.env.NEXT_PUBLIC_DATABASE_URL  // NEVER DO THIS!

// ✅ GOOD: Type-safe env vars
// lib/env.ts
import { z } from 'zod'

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  API_SECRET_KEY: z.string().min(1),
  NEXT_PUBLIC_APP_URL: z.string().url(),
})

export const env = envSchema.parse(process.env)
```

---

## <a id="real-world-patterns"></a>30. Real-World Patterns

### Pattern 1: E-Commerce Product Page

```typescript
// app/products/[id]/page.tsx

import { Suspense } from 'react'
import { cacheLife, cacheTag } from 'next/cache'
import { db } from '@/lib/db'
import { type Product, type Review } from '@/types'

export default async function ProductPage(props) {
  const params = await props.params
  
  return (
    <div className="container py-6">
      {/* Cached: Product details (shared) */}
      <ProductDetails productId={params.id} />
      
      {/* Cached: Reviews (shared) */}
      <Suspense fallback={<ReviewsSkeleton />}>
        <ProductReviews productId={params.id} />
      </Suspense>
      
      {/* Dynamic: User-specific cart status */}
      <Suspense fallback={<div>Loading...</div>}>
        <AddToCart productId={params.id} />
      </Suspense>
    </div>
  )
}

async function ProductDetails({ productId }: { productId: string }) {
  'use cache'
  cacheLife('hours')
  cacheTag('products', `product-${productId}`)
  
  // Generic database query (works with any DB)
  const { data: product } = await db
    .from('products')
    .select('*')
    .eq('id', productId)
    .single()
  
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">{product.name}</h1>
      <p className="text-2xl font-semibold text-primary">
        ${product.price}
      </p>
      <p className="text-muted-foreground">{product.description}</p>
    </div>
  )
}

async function ProductReviews({ productId }: { productId: string }) {
  'use cache'
  cacheLife('minutes')
  cacheTag('reviews', `product-${productId}-reviews`)
  
  const { data: reviews } = await db
    .from('reviews')
    .select('*')
    .eq('product_id', productId)
    .order('created_at', { ascending: false })
    .limit(10)
  
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Customer Reviews</h2>
      {reviews?.map((review) => (
        <ReviewCard key={review.id} review={review} />
      ))}
    </div>
  )
}

async function AddToCart({ productId }: { productId: string }) {
  const cookieStore = await cookies()
  const userId = cookieStore.get('userId')?.value
  
  if (!userId) {
    return <LoginPrompt />
  }
  
  // Check if in cart (user-specific)
  const { data: cartItem } = await db
    .from('cart_items')
    .select('id')
    .eq('user_id', userId)
    .eq('product_id', productId)
    .single()
  
  return <AddToCartButton inCart={!!cartItem} productId={productId} />
}
```

### Pattern 2: Blog with Comments

```typescript
// app/blog/[slug]/page.tsx

import { Suspense } from 'react'
import { cacheLife, cacheTag } from 'next/cache'
import { db } from '@/lib/db'

export default async function BlogPost(props) {
  const params = await props.params
  
  return (
    <article className="container max-w-4xl py-8">
      {/* Cached: Post content */}
      <PostContent slug={params.slug} />
      
      {/* Cached: Comments with moderate revalidation */}
      <Suspense fallback={<CommentsSkeleton />}>
        <Comments slug={params.slug} />
      </Suspense>
      
      {/* Dynamic: Comment form (needs auth) */}
      <Suspense fallback={<div>Loading form...</div>}>
        <CommentForm slug={params.slug} />
      </Suspense>
    </article>
  )
}

async function PostContent({ slug }: { slug: string }) {
  'use cache'
  cacheLife('hours')
  cacheTag('blog-posts', `post-${slug}`)
  
  const { data: post } = await db
    .from('posts')
    .select('*, author:users(*)')
    .eq('slug', slug)
    .single()
  
  return (
    <div className="space-y-4">
      <h1 className="text-4xl font-bold">{post.title}</h1>
      <p className="text-muted-foreground">
        By {post.author.name} • {formatDate(post.created_at)}
      </p>
      <div className="prose prose-neutral dark:prose-invert">
        {post.content}
      </div>
    </div>
  )
}

async function Comments({ slug }: { slug: string }) {
  'use cache'
  cacheLife('minutes')
  cacheTag('comments', `post-${slug}-comments`)
  
  const { data: comments } = await db
    .from('comments')
    .select('*, author:users(*)')
    .eq('post_slug', slug)
    .eq('approved', true)
    .order('created_at', { ascending: false })
  
  return (
    <div className="mt-8 space-y-4">
      <h2 className="text-2xl font-semibold">Comments</h2>
      {comments?.map((comment) => (
        <CommentCard key={comment.id} comment={comment} />
      ))}
    </div>
  )
}

async function CommentForm({ slug }: { slug: string }) {
  const cookieStore = await cookies()
  const userId = cookieStore.get('userId')?.value
  
  if (!userId) {
    return <LoginPrompt />
  }
  
  return <CommentFormClient slug={slug} action={submitComment} />
}
```

### Pattern 3: Dashboard with Real-Time Data

```typescript

import { Suspense } from 'react'
import { cacheLife, cacheTag } from 'next/cache'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'

export default async function Dashboard() {
  return (
    <div className="container grid gap-6 py-6 lg:grid-cols-4">
      {/* Static: Sidebar navigation */}
      <aside className="lg:col-span-1">
        <Navigation />
      </aside>
      
      <main className="space-y-6 lg:col-span-3">
        {/* Cached: Daily stats */}
        <Suspense fallback={<StatsSkeleton />}>
          <DailyStats />
        </Suspense>
        
        {/* Dynamic: User-specific notifications */}
        <Suspense fallback={<NotificationsSkeleton />}>
          <Notifications />
        </Suspense>
        
        {/* Cached: Recent activity */}
        <Suspense fallback={<ActivitySkeleton />}>
          <RecentActivity />
        </Suspense>
      </main>
    </div>
  )
}

async function DailyStats() {
  'use cache'
  cacheLife('minutes')
  cacheTag('dashboard-stats')
  
  const today = new Date().toISOString().split('T')[0]
  
  const { data: stats } = await db
    .from('orders')
    .select('total_amount')
    .gte('created_at', today)
  
  const revenue = stats?.reduce((sum, order) => sum + order.total_amount, 0) || 0
  const orderCount = stats?.length || 0
  
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Revenue</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">${revenue}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{orderCount}</p>
        </CardContent>
      </Card>
    </div>
  )
}

async function Notifications() {
  'use cache: private'
  cacheLife({ stale: 30 })
  
  const cookieStore = await cookies()
  const userId = cookieStore.get('userId')?.value
  
  const { data: notifications } = await db
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .eq('read', false)
    .order('created_at', { ascending: false })
    .limit(5)
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Notifications</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {notifications?.map((notif) => (
            <NotificationItem key={notif.id} notification={notif} />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

async function RecentActivity() {
  'use cache'
  cacheLife('minutes')
  cacheTag('activity')
  
  const { data: activities } = await db
    .from('activities')
    .select('*, user:users(*)')
    .order('created_at', { ascending: false })
    .limit(10)
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {activities?.map((activity) => (
            <ActivityItem key={activity.id} activity={activity} />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
```

---

## 🎉 Conclusion

This guide covers everything you need to build lightning-fast, optimized, and secure full-stack applications with Next.js 16.

### Key Takeaways

1. **Embrace Cache Components** - Granular control over what gets cached
2. **Always Await Async APIs** - params, searchParams, cookies(), headers()
3. **Cache Strategically** - Public for shared, private for per-user, dynamic for real-time
4. **Use Suspense** - Better UX with streaming and Partial Prerendering
5. **Minimize Client JavaScript** - Keep 'use client' at the edges
6. **Follow Clean Code Practices** - Organized folders, clear types, consistent naming
7. **Use Semantic UI Tokens** - bg-primary, text-foreground, not hard-coded colors
8. **Security First** - Validate inputs, sanitize data, prevent XSS/SQL injection
9. **Optimize Performance** - Prefetch, cache, lazy load, optimize images
10. **Generic Database Patterns** - Write code that works with any database
11. Use bun as package manager
