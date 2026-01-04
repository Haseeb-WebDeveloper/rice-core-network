'use client'

import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Pagination, PaginationContent, PaginationItem } from '@/components/ui/pagination'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
  ColumnFiltersState,
  FilterFn,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import {
  ChevronDown,
  ChevronFirst,
  ChevronLast,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  CircleX,
  Columns3,
  Filter,
  ListFilter,
  User,
  Eye,
  Trash2,
} from 'lucide-react'
import { useId, useMemo, useRef, useState, useTransition } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
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
import { UserDetailsDialog } from './user-details-dialog'
import { deleteUsers } from '@/actions/admin/delete-users'

type UserData = {
  id: string
  email: string
  fullName: string
  avatar: string | null
  role: 'ADMIN' | 'USER'
  isActive: boolean
  isVerified: boolean
  isSuspended: boolean
  referralCode: string
  createdAt: Date
  investmentCount: number
  referralCount: number
}

// Custom filter function for multi-column searching
const multiColumnFilterFn: FilterFn<UserData> = (row, columnId, filterValue) => {
  const user = row.original
  const searchableContent = `${user.email} ${user.fullName} ${user.referralCode}`.toLowerCase()
  const searchTerm = (filterValue ?? '').toLowerCase()
  return searchableContent.includes(searchTerm)
}

const roleFilterFn: FilterFn<UserData> = (row, columnId, filterValue: string[]) => {
  if (!filterValue?.length) return true
  const role = row.getValue(columnId) as string
  return filterValue.includes(role)
}

const statusFilterFn: FilterFn<UserData> = (row, columnId, filterValue: string[]) => {
  if (!filterValue?.length) return true
  const user = row.original
  const statuses: string[] = []
  if (user.isActive && !user.isSuspended) statuses.push('ACTIVE')
  if (user.isSuspended) statuses.push('SUSPENDED')
  if (!user.isActive) statuses.push('INACTIVE')
  if (user.isVerified) statuses.push('VERIFIED')
  return filterValue.some((status) => statuses.includes(status))
}

const columns: ColumnDef<UserData>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate')}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    size: 28,
    enableSorting: false,
    enableHiding: false,
  },
  {
    header: 'User',
    accessorKey: 'fullName',
    cell: ({ row }) => {
      const user = row.original
      return (
        <div className="flex items-center gap-3">
          {user.avatar ? (
            <Image
              src={user.avatar}
              alt={user.fullName}
              width={32}
              height={32}
              className="rounded-full object-cover aspect-square"
            />
          ) : (
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold">
              {user.fullName.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <div className="font-medium">{user.fullName}</div>
            <div className="text-xs text-muted-foreground">{user.email}</div>
          </div>
        </div>
      )
    },
    size: 250,
    filterFn: multiColumnFilterFn,
    enableHiding: false,
  },
  {
    header: 'Role',
    accessorKey: 'role',
    cell: ({ row }) => {
      const role = row.getValue('role') as string
      return (
        <Badge
          className={cn(
            'border',
            role === 'ADMIN'
              ? 'bg-purple-500/10 text-purple-600 dark:text-purple-500 border-purple-500/20'
              : 'bg-blue-500/10 text-blue-600 dark:text-blue-500 border-blue-500/20'
          )}
        >
          {role}
        </Badge>
      )
    },
    size: 100,
    filterFn: roleFilterFn,
  },
  {
    header: 'Status',
    accessorKey: 'status',
    cell: ({ row }) => {
      const user = row.original
      const badges: React.ReactNode[] = []
      
      if (user.isSuspended) {
        badges.push(
          <Badge key="suspended" className="border bg-red-500/10 text-red-600 dark:text-red-500 border-red-500/20">
            Suspended
          </Badge>
        )
      } else if (user.isActive) {
        badges.push(
          <Badge key="active" className="border bg-green-500/10 text-green-600 dark:text-green-500 border-green-500/20">
            Active
          </Badge>
        )
      } else {
        badges.push(
          <Badge key="inactive" className="border bg-gray-500/10 text-gray-600 dark:text-gray-500 border-gray-500/20">
            Inactive
          </Badge>
        )
      }
      
      if (user.isVerified) {
        badges.push(
          <Badge key="verified" className="border bg-blue-500/10 text-blue-600 dark:text-blue-500 border-blue-500/20">
            Verified
          </Badge>
        )
      }

      return <div className="flex flex-wrap gap-1">{badges}</div>
    },
    size: 150,
    filterFn: statusFilterFn,
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
    header: 'Referrals',
    accessorKey: 'referralCount',
    cell: ({ row }) => {
      const count = row.getValue('referralCount') as number
      return <div className="text-center font-medium">{count}</div>
    },
    size: 100,
  },
  {
    header: 'Joined',
    accessorKey: 'createdAt',
    cell: ({ row }) => {
      const date = new Date(row.getValue('createdAt'))
      return <div className="text-sm">{date.toLocaleDateString()}</div>
    },
    size: 120,
  },
  {
    id: 'actions',
    header: 'Actions',
    cell: ({ row, table }) => {
      const user = row.original
      const meta = table.options.meta as { onViewUser?: (userId: string) => void }
      return (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => meta?.onViewUser?.(user.id)}
          className="h-8 w-8"
        >
          <Eye className="h-4 w-4" />
          <span className="sr-only">View user details</span>
        </Button>
      )
    },
    size: 80,
    enableSorting: false,
    enableHiding: false,
  },
]

type UsersTableProps = {
  data: UserData[]
}

export function UsersTable({ data }: UsersTableProps) {
  const id = useId()
  const router = useRouter()
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  })
  const inputRef = useRef<HTMLInputElement>(null)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const [sorting, setSorting] = useState<SortingState>([
    {
      id: 'createdAt',
      desc: true,
    },
  ])

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    enableSortingRemoval: false,
    getPaginationRowModel: getPaginationRowModel(),
    onPaginationChange: setPagination,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getFilteredRowModel: getFilteredRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    state: {
      sorting,
      pagination,
      columnFilters,
      columnVisibility,
    },
    meta: {
      onViewUser: (userId: string) => {
        setSelectedUserId(userId)
      },
    },
  })

  const selectedRows = table.getFilteredSelectedRowModel().rows
  const selectedUserIds = selectedRows.map((row) => row.original.id)

  const handleDeleteUsers = () => {
    startTransition(async () => {
      const result = await deleteUsers(selectedUserIds)
      if (result.error) {
        alert(result.error)
      } else {
        setDeleteDialogOpen(false)
        table.resetRowSelection()
        router.refresh()
      }
    })
  }

  // Get unique role values
  const uniqueRoleValues = useMemo(() => {
    const roleColumn = table.getColumn('role')
    if (!roleColumn) return []
    return Array.from(roleColumn.getFacetedUniqueValues().keys()).sort()
  }, [table.getColumn('role')?.getFacetedUniqueValues()])

  // Get unique status values
  const uniqueStatusValues = ['ACTIVE', 'SUSPENDED', 'INACTIVE', 'VERIFIED']

  const selectedRoles = useMemo(() => {
    const filterValue = table.getColumn('role')?.getFilterValue() as string[]
    return filterValue ?? []
  }, [table.getColumn('role')?.getFilterValue()])

  const selectedStatuses = useMemo(() => {
    const filterValue = table.getColumn('status')?.getFilterValue() as string[]
    return filterValue ?? []
  }, [table.getColumn('status')?.getFilterValue()])

  const handleRoleChange = (checked: boolean, value: string) => {
    const filterValue = table.getColumn('role')?.getFilterValue() as string[]
    const newFilterValue = filterValue ? [...filterValue] : []

    if (checked) {
      newFilterValue.push(value)
    } else {
      const index = newFilterValue.indexOf(value)
      if (index > -1) {
        newFilterValue.splice(index, 1)
      }
    }

    table.getColumn('role')?.setFilterValue(newFilterValue.length ? newFilterValue : undefined)
  }

  const handleStatusChange = (checked: boolean, value: string) => {
    const filterValue = table.getColumn('status')?.getFilterValue() as string[]
    const newFilterValue = filterValue ? [...filterValue] : []

    if (checked) {
      newFilterValue.push(value)
    } else {
      const index = newFilterValue.indexOf(value)
      if (index > -1) {
        newFilterValue.splice(index, 1)
      }
    }

    table.getColumn('status')?.setFilterValue(newFilterValue.length ? newFilterValue : undefined)
  }

  return (
    <>
      <div className="space-y-4">
        {/* Filters and Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
          {/* Filter by search */}
          <div className="relative">
            <Input
              id={`${id}-input`}
              ref={inputRef}
              className={cn(
                'peer min-w-60 ps-9',
                Boolean(table.getColumn('fullName')?.getFilterValue()) && 'pe-9'
              )}
              value={(table.getColumn('fullName')?.getFilterValue() ?? '') as string}
              onChange={(e) => table.getColumn('fullName')?.setFilterValue(e.target.value)}
              placeholder="Search by name, email, or referral code..."
              type="text"
              aria-label="Search users"
            />
            <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 text-muted-foreground/80 peer-disabled:opacity-50">
              <ListFilter size={16} strokeWidth={2} aria-hidden="true" />
            </div>
            {Boolean(table.getColumn('fullName')?.getFilterValue()) && (
              <button
                className="absolute inset-y-0 end-0 flex h-full w-9 items-center justify-center rounded-e-lg text-muted-foreground/80 outline-offset-2 transition-colors hover:text-foreground focus:z-10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring/70 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Clear filter"
                onClick={() => {
                  table.getColumn('fullName')?.setFilterValue('')
                  if (inputRef.current) {
                    inputRef.current.focus()
                  }
                }}
              >
                <CircleX size={16} strokeWidth={2} aria-hidden="true" />
              </button>
            )}
          </div>
          {/* Filter by role */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline">
                <Filter className="-ms-1 me-2 opacity-60" size={16} strokeWidth={2} aria-hidden="true" />
                Role
                {selectedRoles.length > 0 && (
                  <span className="-me-1 ms-3 inline-flex h-5 max-h-full items-center rounded border border-border bg-background px-1 font-[inherit] text-[0.625rem] font-medium text-muted-foreground/70">
                    {selectedRoles.length}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="min-w-36 p-3" align="start">
              <div className="space-y-3">
                <div className="text-xs font-medium text-muted-foreground">Filters</div>
                <div className="space-y-3">
                  {uniqueRoleValues.map((value, i) => (
                    <div key={value} className="flex items-center gap-2">
                      <Checkbox
                        id={`${id}-role-${i}`}
                        checked={selectedRoles.includes(value)}
                        onCheckedChange={(checked: boolean) => handleRoleChange(checked, value)}
                      />
                      <label htmlFor={`${id}-role-${i}`} className="flex grow justify-between gap-2 font-normal text-sm cursor-pointer">
                        {value}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>
          {/* Filter by status */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline">
                <Filter className="-ms-1 me-2 opacity-60" size={16} strokeWidth={2} aria-hidden="true" />
                Status
                {selectedStatuses.length > 0 && (
                  <span className="-me-1 ms-3 inline-flex h-5 max-h-full items-center rounded border border-border bg-background px-1 font-[inherit] text-[0.625rem] font-medium text-muted-foreground/70">
                    {selectedStatuses.length}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="min-w-36 p-3" align="start">
              <div className="space-y-3">
                <div className="text-xs font-medium text-muted-foreground">Filters</div>
                <div className="space-y-3">
                  {uniqueStatusValues.map((value, i) => (
                    <div key={value} className="flex items-center gap-2">
                      <Checkbox
                        id={`${id}-status-${i}`}
                        checked={selectedStatuses.includes(value)}
                        onCheckedChange={(checked: boolean) => handleStatusChange(checked, value)}
                      />
                      <label htmlFor={`${id}-status-${i}`} className="flex grow justify-between gap-2 font-normal text-sm cursor-pointer">
                        {value}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>
          {/* Toggle columns visibility */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Columns3 className="-ms-1 me-2 opacity-60" size={16} strokeWidth={2} aria-hidden="true" />
                View
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <div className="p-2 font-medium text-sm">Toggle columns</div>
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) => column.toggleVisibility(!!value)}
                      onSelect={(event) => event.preventDefault()}
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  )
                })}
            </DropdownMenuContent>
          </DropdownMenu>
          </div>
          {/* Bulk Actions */}
          {selectedUserIds.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {selectedUserIds.length} selected
              </span>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setDeleteDialogOpen(true)}
                disabled={isPending}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          )}
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
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between gap-8">
        {/* Results per page */}
        <div className="flex items-center gap-3">
          <label htmlFor={id} className="max-sm:sr-only">
            Rows per page
          </label>
          <Select
            value={table.getState().pagination.pageSize.toString()}
            onValueChange={(value) => {
              table.setPageSize(Number(value))
            }}
          >
            <SelectTrigger id={id} className="w-fit whitespace-nowrap">
              <SelectValue placeholder="Select number of results" />
            </SelectTrigger>
            <SelectContent className="[&_*[role=option]>span]:end-2 [&_*[role=option]>span]:start-auto [&_*[role=option]]:pe-8 [&_*[role=option]]:ps-2">
              {[5, 10, 25, 50, 100].map((pageSize) => (
                <SelectItem key={pageSize} value={pageSize.toString()}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {/* Page number information */}
        <div className="flex grow justify-end whitespace-nowrap text-sm text-muted-foreground">
          <p className="whitespace-nowrap text-sm text-muted-foreground" aria-live="polite">
            <span className="text-foreground">
              {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}-
              {Math.min(
                Math.max(
                  table.getState().pagination.pageIndex * table.getState().pagination.pageSize +
                    table.getState().pagination.pageSize,
                  0
                ),
                table.getRowCount()
              )}
            </span>{' '}
            of <span className="text-foreground">{table.getRowCount().toString()}</span>
          </p>
        </div>

        {/* Pagination buttons */}
        <div>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <Button
                  size="icon"
                  variant="outline"
                  className="disabled:pointer-events-none disabled:opacity-50"
                  onClick={() => table.firstPage()}
                  disabled={!table.getCanPreviousPage()}
                  aria-label="Go to first page"
                >
                  <ChevronFirst size={16} strokeWidth={2} aria-hidden="true" />
                </Button>
              </PaginationItem>
              <PaginationItem>
                <Button
                  size="icon"
                  variant="outline"
                  className="disabled:pointer-events-none disabled:opacity-50"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                  aria-label="Go to previous page"
                >
                  <ChevronLeft size={16} strokeWidth={2} aria-hidden="true" />
                </Button>
              </PaginationItem>
              <PaginationItem>
                <Button
                  size="icon"
                  variant="outline"
                  className="disabled:pointer-events-none disabled:opacity-50"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                  aria-label="Go to next page"
                >
                  <ChevronRight size={16} strokeWidth={2} aria-hidden="true" />
                </Button>
              </PaginationItem>
              <PaginationItem>
                <Button
                  size="icon"
                  variant="outline"
                  className="disabled:pointer-events-none disabled:opacity-50"
                  onClick={() => table.lastPage()}
                  disabled={!table.getCanNextPage()}
                  aria-label="Go to last page"
                >
                  <ChevronLast size={16} strokeWidth={2} aria-hidden="true" />
                </Button>
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </div>

      {/* User Details Dialog */}
      <UserDetailsDialog
        userId={selectedUserId}
        open={!!selectedUserId}
        onOpenChange={(open) => {
          if (!open) setSelectedUserId(null)
        }}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Users</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedUserIds.length} user(s)? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUsers}
              disabled={isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
    </>
  )
}

