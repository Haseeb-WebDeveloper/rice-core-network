import { getAllUsers } from "@/lib/admin/get-all-users";
import { UsersTable } from "@/components/admin/users-table";
import { Suspense } from "react";

export default async function AdminUsersPage() {
  const users = await getAllUsers();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">All Users</h1>
        <p className="text-muted-foreground mt-2">
          View and manage all registered users
        </p>
      </div>

      <Suspense fallback={<div>Loading...</div>}>
        <UsersTable data={users} />
      </Suspense>
    </div>
  );
}

