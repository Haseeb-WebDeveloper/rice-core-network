'use client'

import { useState, useTransition } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { approveInvestment } from '@/actions/admin/approve-investment'
import { rejectInvestment } from '@/actions/admin/reject-investment'
import { Loader2, Check, X, Eye, User, Calendar, DollarSign } from 'lucide-react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'

type PendingInvestment = {
  id: string
  amount: number
  paymentProofUrl: string | null
  createdAt: Date
  user: {
    id: string
    email: string
    fullName: string
    avatar: string | null
  }
  plan: {
    id: string
    name: string
    minInvestment: number
    dailyProfitPercentage: number
  }
}

type PendingInvestmentCardProps = {
  investment: PendingInvestment
}

export function PendingInvestmentCard({ investment }: PendingInvestmentCardProps) {
  const router = useRouter()
  const [isApproving, startApproving] = useTransition()
  const [isRejecting, startRejecting] = useTransition()
  const [showImageModal, setShowImageModal] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const displayName = investment.user.fullName

  const handleApprove = () => {
    setError(null)
    startApproving(() => {
      approveInvestment(investment.id).then((result) => {
        if (result.error) {
          setError(result.error)
        } else {
          router.refresh()
        }
      })
    })
  }

  const handleReject = () => {
    setError(null)
    startRejecting(() => {
      rejectInvestment(investment.id).then((result) => {
        if (result.error) {
          setError(result.error)
        } else {
          router.refresh()
        }
      })
    })
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="text-lg">Investment Request</CardTitle>
              <CardDescription>
                Plan: <span className="font-medium text-foreground">{investment.plan.name}</span>
              </CardDescription>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-foreground">${investment.amount.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">Amount</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">User</p>
                <p className="font-medium text-foreground">{displayName}</p>
                <p className="text-xs text-muted-foreground">{investment.user.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Submitted</p>
                <p className="font-medium text-foreground">
                  {new Date(investment.createdAt).toLocaleDateString()}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(investment.createdAt).toLocaleTimeString()}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">Plan Details</p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Total Return</p>
                <p className="font-medium text-foreground text-green-600">200%</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Daily Profit</p>
                <p className="font-medium text-foreground">
                  {investment.plan.dailyProfitPercentage.toFixed(2)}%
                </p>
              </div>
            </div>
          </div>

          {investment.paymentProofUrl && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">Payment Proof</p>
              <div className="relative aspect-video w-full overflow-hidden rounded-md border bg-muted">
                <Image
                  src={investment.paymentProofUrl}
                  alt="Payment proof"
                  fill
                  className="object-contain"
                />
                <button
                  onClick={() => setShowImageModal(true)}
                  className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition-opacity"
                >
                  <Eye className="h-6 w-6 text-white" />
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-md bg-destructive/10 p-2 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button
              onClick={handleApprove}
              disabled={isApproving || isRejecting}
              className="flex-1"
              variant="default"
            >
              {isApproving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Approving...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  Approve
                </>
              )}
            </Button>
            <Button
              onClick={handleReject}
              disabled={isApproving || isRejecting}
              className="flex-1"
              variant="destructive"
            >
              {isRejecting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Rejecting...
                </>
              ) : (
                <>
                  <X className="h-4 w-4" />
                  Reject
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {showImageModal && investment.paymentProofUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setShowImageModal(false)}
        >
          <div className="relative max-h-[90vh] max-w-[90vw]">
            <button
              onClick={() => setShowImageModal(false)}
              className="absolute -top-10 right-0 text-white hover:text-gray-300"
            >
              <X className="h-6 w-6" />
            </button>
            <Image
              src={investment.paymentProofUrl}
              alt="Payment proof"
              width={800}
              height={600}
              className="max-h-[90vh] max-w-[90vw] object-contain"
            />
          </div>
        </div>
      )}
    </>
  )
}

