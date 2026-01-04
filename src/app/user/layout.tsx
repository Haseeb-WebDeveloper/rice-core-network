import { redirect } from "next/navigation";
import { Sidebar } from "@/components/dashboard/sidebar";
import { getCurrentUser } from "@/lib/auth/get-user";

export default async function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <Sidebar/>
      <main className="flex-1 lg:ml-0">
        <div className="container mx-auto p-4 lg:p-8 pt-26 lg:pt-8 pb-12">
          {children}
        </div>
      </main>
    </div>
  );
}
