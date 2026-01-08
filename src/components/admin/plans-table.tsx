'use client'

import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  ColumnDef,
  SortingState,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import {
  ChevronDown,
  ChevronUp,
  Edit,
  Plus,
  Loader2,
  Trash2,
} from 'lucide-react'
import { useId, useState, useTransition } from 'react'
import { createPlan } from '@/actions/admin/create-plan'
import { updatePlan } from '@/actions/admin/update-plan'
import { deletePlan } from '@/actions/admin/delete-plan'
import { useRouter } from 'next/navigation'
import { Textarea } from '@/components/ui/textarea'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

type PlanData = {
  id: string
  name: string
  description: string | null
  minInvestment: number
  maxInvestment: number
  dailyProfitPercentage: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  investmentCount: number
}

function PlanFormDialog({
  open,
  onOpenChange,
  plan,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  plan?: PlanData
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: plan?.name || '',
    description: plan?.description || '',
    minInvestment: plan?.minInvestment.toString() || '',
    maxInvestment: plan?.maxInvestment.toString() || '',
    dailyProfitPercentage: plan?.dailyProfitPercentage.toString() || '',
    isActive: plan?.isActive ?? true,
  })

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)

    const submitFormData = new FormData(e.currentTarget)

    startTransition(async () => {
      const result = plan
        ? await updatePlan(plan.id, submitFormData)
        : await createPlan(submitFormData)

      if (result.error) {
        setError(result.error)
      } else {
        onOpenChange(false)
        router.refresh()
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-2xl">
        <DialogHeader>
          <DialogTitle>{plan ? 'Edit Plan' : 'Create New Plan'}</DialogTitle>
          <DialogDescription>
            {plan ? 'Update investment plan details' : 'Create a new investment plan for users'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Plan Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Plan Name *</Label>
            <Input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              disabled={isPending}
              maxLength={100}
              placeholder="e.g., Starter Plan"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              disabled={isPending}
              rows={3}
              placeholder="Describe the investment plan..."
            />
          </div>

          {/* Min Investment */}
          <div className="space-y-2">
            <Label htmlFor="minInvestment">Minimum Investment ($) *</Label>
            <Input
              id="minInvestment"
              name="minInvestment"
              type="number"
              step="0.01"
              min="0.01"
              value={formData.minInvestment}
              onChange={(e) => setFormData({ ...formData, minInvestment: e.target.value })}
              required
              disabled={isPending}
              className="font-mono"
              placeholder="0.00"
            />
          </div>

          {/* Max Investment */}
          <div className="space-y-2">
            <Label htmlFor="maxInvestment">Maximum Investment ($) *</Label>
            <Input
              id="maxInvestment"
              name="maxInvestment"
              type="number"
              step="0.01"
              min="0.01"
              value={formData.maxInvestment}
              onChange={(e) => setFormData({ ...formData, maxInvestment: e.target.value })}
              required
              disabled={isPending}
              className="font-mono"
              placeholder="0.00"
            />
            <p className="text-xs text-muted-foreground">
              Maximum investment amount allowed for this plan
            </p>
          </div>

          {/* Daily Profit Percentage */}
          <div className="space-y-2">
            <Label htmlFor="dailyProfitPercentage">Daily Profit Percentage (%) *</Label>
            <Input
              id="dailyProfitPercentage"
              name="dailyProfitPercentage"
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={formData.dailyProfitPercentage}
              onChange={(e) => setFormData({ ...formData, dailyProfitPercentage: e.target.value })}
              required
              disabled={isPending}
              className="font-mono"
              placeholder="0.00"
            />
            <p className="text-xs text-muted-foreground">
              Percentage of investment amount earned as profit per day
            </p>
          </div>

          {/* Is Active */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="isActive"
              name="isActive"
              checked={formData.isActive}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, isActive: checked === true })
              }
              disabled={isPending}
            />
            <Label
              htmlFor="isActive"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Active (Plan is available for users to invest)
            </Label>
          </div>

          {/* Hidden input for isActive (for form submission) */}
          <input
            type="hidden"
            name="isActive"
            value={formData.isActive ? 'true' : 'false'}
          />

          {/* Error Message */}
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {plan ? 'Update Plan' : 'Create Plan'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

const columns: ColumnDef<PlanData>[] = [
  {
    header: 'Plan Name',
    accessorKey: 'name',
    cell: ({ row }) => <div className="font-medium">{row.original.name}</div>,
    size: 200,
  },
  {
    header: 'Min Investment',
    accessorKey: 'minInvestment',
    cell: ({ row }) => {
      const amount = row.getValue('minInvestment') as number
      return (
        <div className="font-medium font-mono">
          {new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
          }).format(amount)}
        </div>
      )
    },
    size: 150,
  },
  {
    header: 'Max Investment',
    accessorKey: 'maxInvestment',
    cell: ({ row }) => {
      const amount = row.getValue('maxInvestment') as number
      return (
        <div className="font-medium font-mono">
          {new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
          }).format(amount)}
        </div>
      )
    },
    size: 150,
  },
  {
    header: 'Daily Profit %',
    accessorKey: 'dailyProfitPercentage',
    cell: ({ row }) => {
      const percentage = row.getValue('dailyProfitPercentage') as number
      return <div className="font-medium font-mono">{percentage.toFixed(2)}%</div>
    },
    size: 130,
  },
  {
    header: 'Status',
    accessorKey: 'isActive',
    cell: ({ row }) => {
      const isActive = row.getValue('isActive') as boolean
      return (
        <Badge
          className={cn(
            'border',
            isActive
              ? 'bg-green-500/10 text-green-600 dark:text-green-500 border-green-500/20'
              : 'bg-gray-500/10 text-gray-600 dark:text-gray-500 border-gray-500/20'
          )}
        >
          {isActive ? 'Active' : 'Inactive'}
        </Badge>
      )
    },
    size: 100,
  },
  {
    header: 'Investments',
    accessorKey: 'investmentCount',
    cell: ({ row }) => {
      const count = row.getValue('investmentCount') as number
      return <div className="text-center font-medium">{count}</div>
    },
    size: 100,
  },
  {
    id: 'actions',
    header: () => <span className="sr-only">Actions</span>,
    cell: ({ row }) => <PlanActions plan={row.original} />,
    size: 80,
    enableSorting: false,
  },
]

function PlanActions({ plan }: { plan: PlanData }) {
  const router = useRouter()
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deletePlan(plan.id)
      if (result.error) {
        alert(result.error)
      } else {
        setDeleteOpen(false)
        router.refresh()
      }
    })
  }

  return (
    <>
      <div className="flex items-center gap-1">
        <Button
          size="icon"
          variant="ghost"
          className="shadow-none"
          aria-label="Edit plan"
          onClick={() => setEditOpen(true)}
        >
          <Edit size={16} strokeWidth={2} aria-hidden="true" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="shadow-none text-destructive hover:text-destructive hover:bg-destructive/10"
          aria-label="Delete plan"
          onClick={() => setDeleteOpen(true)}
        >
          <Trash2 size={16} strokeWidth={2} aria-hidden="true" />
        </Button>
      </div>
      <PlanFormDialog open={editOpen} onOpenChange={setEditOpen} plan={plan} />
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Investment Plan</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{plan.name}"? This action cannot be undone.
              {plan.investmentCount > 0 && (
                <span className="block mt-2 text-warning">
                  This plan has {plan.investmentCount} associated investment(s). The plan will be marked as deleted but existing investments will remain.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

type PlansTableProps = {
  data: PlanData[]
}

export function PlansTable({ data }: PlansTableProps) {
  const id = useId()
  const [sorting, setSorting] = useState<SortingState>([
    {
      id: 'minInvestment',
      desc: false,
    },
  ])
  const [createDialogOpen, setCreateDialogOpen] = useState(false)

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    enableSortingRemoval: false,
    state: {
      sorting,
    },
  })

  return (
    <div className="space-y-4">
      {/* Header with Create Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Investment Plans</h2>
          <p className="text-sm text-muted-foreground">
            Manage investment plans available to users
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Plan
        </Button>
      </div>

      {/* Table */}
      <div className="w-full overflow-x-auto rounded-lg border border-border bg-background @container/main container">
        <Table className="w-full">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent">
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead
                      key={header.id}
                      style={{ width: `${header.getSize()}px` }}
                      className="h-11"
                    >
                      {header.isPlaceholder ? null : header.column.getCanSort() ? (
                        <div
                          className={cn(
                            header.column.getCanSort() &&
                              'flex h-full cursor-pointer select-none items-center justify-between gap-2'
                          )}
                          onClick={header.column.getToggleSortingHandler()}
                          onKeyDown={(e) => {
                            if (header.column.getCanSort() && (e.key === 'Enter' || e.key === ' ')) {
                              e.preventDefault()
                              header.column.getToggleSortingHandler()?.(e)
                            }
                          }}
                          tabIndex={header.column.getCanSort() ? 0 : undefined}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {{
                            asc: (
                              <ChevronUp className="shrink-0 opacity-60" size={16} strokeWidth={2} aria-hidden="true" />
                            ),
                            desc: (
                              <ChevronDown className="shrink-0 opacity-60" size={16} strokeWidth={2} aria-hidden="true" />
                            ),
                          }[header.column.getIsSorted() as string] ?? null}
                        </div>
                      ) : (
                        flexRender(header.column.columnDef.header, header.getContext())
                      )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="last:py-0">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No plans found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create Dialog */}
      <PlanFormDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />
    </div>
  )
}

