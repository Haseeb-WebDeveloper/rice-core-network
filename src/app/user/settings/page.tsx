import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/get-user";
import { ProfileSection } from "@/components/user/settings/profile-section";
import { PasswordSection } from "@/components/user/settings/password-section";
import { WithdrawPinSection } from "@/components/user/settings/withdraw-pin-section";

export default async function SettingsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences
        </p>
      </div>

      <div className="space-y-6">
        <ProfileSection
          initialName={user.fullName}
          initialAvatar={user.avatar}
        />

        <PasswordSection />

        <WithdrawPinSection hasPin={!!user.withdrawPin} />
      </div>
    </div>
  );
}

