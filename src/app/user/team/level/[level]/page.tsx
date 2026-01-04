import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/get-user";
import { getTeamByLevel } from "@/lib/user/get-team-by-level";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

type PageProps = {
  params: Promise<{ level: string }>;
};

export default async function TeamLevelPage({ params }: PageProps) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const { level } = await params;
  const levelNumber = parseInt(level, 10);

  // Validate level
  if (isNaN(levelNumber) || levelNumber < 1 || levelNumber > 4) {
    redirect("/user/team");
  }

  const teamMembers = await getTeamByLevel(user.id, levelNumber);

  // Get avatar initials helper
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/user/team">
          <ArrowLeft className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Level {levelNumber} Team</h1>
          <p className="text-muted-foreground">
            {teamMembers.length === 0
              ? "No team members at this level"
              : `${teamMembers.length} team member${teamMembers.length === 1 ? "" : "s"}`}
          </p>
        </div>
      </div>

      {teamMembers.length === 0 ? (
        <Card>
          <div className="p-12 text-center">
            <p className="text-muted-foreground">
              No team members found at Level {levelNumber}
            </p>
          </div>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Total Invested</TableHead>
                <TableHead>Investments</TableHead>
                <TableHead>Joined Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teamMembers.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="relative w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                        {member.avatar ? (
                          <Image
                            src={member.avatar}
                            alt={member.fullName}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary font-semibold text-sm">
                            {getInitials(member.fullName)}
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{member.fullName}</p>
                        <p className="text-xs text-muted-foreground">
                          {member.email}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-semibold">
                      ${member.totalInvested.toFixed(2)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-muted-foreground">
                      {member.investmentCount}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {new Date(member.joinedDate).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}

