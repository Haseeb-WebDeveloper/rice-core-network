'use client'

import { useState, useTransition } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { processWithdrawal } from '@/actions/admin/process-withdrawal'
import { Loader2, Check, Eye, User, Calendar, DollarSign, Wallet, Upload, X } from 'lucide-react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'

type PendingWithdrawal = {
  id: string
  amount: number
  walletId: string | null
  description: string | null
  createdAt: Date
  updatedAt: Date
  proofUrl: string | null
  user: {
    id: string
    email: string
    fullName: string
    avatar: string | null
  }
}

type WithdrawalCardProps = {
  withdrawal: PendingWithdrawal
}

export function WithdrawalCard({ withdrawal }: WithdrawalCardProps) {
  const router = useRouter()
  const [isProcessing, startProcessing] = useTransition()
  const [showImageModal, setShowImageModal] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const displayName = withdrawal.user.fullName

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file')
        return
      }

      // Validate file size (5MB)
      const maxSize = 5 * 1024 * 1024
      if (file.size > maxSize) {
        setError('Image must be less than 5MB')
        return
      }

      setSelectedFile(file)
      setError(null)

      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  function removeFile() {
    setSelectedFile(null)
    setPreviewUrl(null)
  }

  function handleProcess(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    if (!selectedFile) {
      setError('Please upload a payment proof screenshot')
      return
    }

    const formData = new FormData()
    formData.append('transactionId', withdrawal.id)
    formData.append('proofFile', selectedFile)

    startProcessing(() => {
      processWithdrawal(formData).then((result) => {
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
              <CardTitle className="text-lg">Withdrawal Request</CardTitle>
              <CardDescription>USDT BEP20 withdrawal</CardDescription>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-foreground">${withdrawal.amount.toFixed(2)}</p>
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
                <p className="text-xs text-muted-foreground">{withdrawal.user.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Requested</p>
                <p className="font-medium text-foreground">
                  {new Date(withdrawal.createdAt).toLocaleDateString()}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(withdrawal.createdAt).toLocaleTimeString()}
                </p>
              </div>
            </div>
          </div>

          {withdrawal.walletId && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Wallet className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">Wallet Address</p>
                  <p className="font-mono text-sm font-medium text-foreground break-all">
                    {withdrawal.walletId}
                  </p>
                </div>
              </div>
            </div>
          )}

          {withdrawal.proofUrl ? (
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">Payment Proof</p>
              <div className="relative aspect-video w-full overflow-hidden rounded-md border bg-muted">
                <Image
                  src={withdrawal.proofUrl}
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
              <p className="text-xs text-green-600 dark:text-green-500 font-medium">
                Withdrawal processed successfully
              </p>
            </div>
          ) : (
            <form onSubmit={handleProcess} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor={`proof-${withdrawal.id}`}>Payment Proof Screenshot</Label>
                {!selectedFile ? (
                  <div className="flex items-center justify-center w-full">
                    <label
                      htmlFor={`proof-${withdrawal.id}`}
                      className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                        <p className="mb-2 text-sm text-muted-foreground">
                          <span className="font-semibold">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-muted-foreground">PNG, JPG, WEBP (MAX. 5MB)</p>
                      </div>
                      <input
                        id={`proof-${withdrawal.id}`}
                        name="proofFile"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileChange}
                        disabled={isProcessing}
                      />
                    </label>
                  </div>
                ) : (
                  <div className="relative">
                    <div className="relative w-full h-48 border border-border rounded-lg overflow-hidden bg-muted">
                      {previewUrl && (
                        <Image
                          src={previewUrl}
                          alt="Proof preview"
                          fill
                          className="object-contain"
                        />
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={removeFile}
                      className="absolute top-2 right-2 p-1 bg-background border border-border rounded-full hover:bg-accent transition-colors"
                      disabled={isProcessing}
                    >
                      <X className="h-4 w-4" />
                    </button>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                    </p>
                  </div>
                )}
              </div>

              {error && (
                <div className="rounded-md bg-destructive/10 p-2 text-sm text-destructive">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={isProcessing || !selectedFile}
                className="w-full"
                variant="default"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Process Withdrawal
                  </>
                )}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      {showImageModal && withdrawal.proofUrl && (
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
              src={withdrawal.proofUrl}
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

