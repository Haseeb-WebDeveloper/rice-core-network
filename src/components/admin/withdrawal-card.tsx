'use client'

import { useState, useTransition } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { processWithdrawal } from '@/actions/admin/process-withdrawal'
import { Loader2, Check, Upload, X } from 'lucide-react'
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
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">${withdrawal.amount.toFixed(2)}</CardTitle>
              <CardDescription className="mt-1">{displayName}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {withdrawal.walletId && (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Wallet Address</p>
              <p className="font-mono text-xs break-all text-foreground">
                {withdrawal.walletId}
              </p>
            </div>
          )}

          {withdrawal.proofUrl ? (
            <div className="space-y-2">
              <div
                className="relative w-full h-40 rounded-md overflow-hidden border bg-muted cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => setShowImageModal(true)}
              >
                <Image
                  src={withdrawal.proofUrl}
                  alt="Payment proof"
                  fill
                  className="object-contain"
                />
              </div>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 text-center">
                Processed
              </p>
            </div>
          ) : (
            <form onSubmit={handleProcess} className="space-y-3">
              {!selectedFile ? (
                <label
                  htmlFor={`proof-${withdrawal.id}`}
                  className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-accent/50 transition-colors"
                >
                  <Upload className="w-6 h-6 mb-1 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">Upload proof</p>
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
              ) : (
                <div className="relative">
                  <div className="relative w-full h-32 border border-border rounded-lg overflow-hidden bg-muted">
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
                    className="absolute top-1 right-1 p-1 bg-background border border-border rounded-full hover:bg-accent transition-colors"
                    disabled={isProcessing}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}

              {error && (
                <div className="rounded-md bg-destructive/10 p-2 text-xs text-destructive">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={isProcessing || !selectedFile}
                className="w-full"
                size="sm"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Process
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

