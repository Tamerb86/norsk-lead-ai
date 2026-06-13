import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Users, UserPlus, Mail, Shield, Trash2, Crown } from "lucide-react";
import { toastSuccess, toastError, toastDeleteWithUndo } from "@/lib/toast-utils";

export default function TeamSettings() {
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "manager" | "viewer">("manager");
  const [memberToRemove, setMemberToRemove] = useState<number | null>(null);

  const { data: team } = trpc.team.getMyTeam.useQuery();
  const { data: members = [] } = trpc.team.getMembers.useQuery();
  const { data: invitations = [] } = trpc.team.getInvitations.useQuery();

  const utils = trpc.useUtils();

  const inviteMemberMutation = trpc.team.inviteMember.useMutation({
    onSuccess: () => {
      toastSuccess("Invitation sent!", { description: "Team member invitation sent successfully" });
      setInviteDialogOpen(false);
      setInviteEmail("");
      setInviteRole("manager");
      utils.team.getInvitations.invalidate();
    },
    onError: (error) => {
      toastError("Failed to send invitation", { description: error.message });
    },
  });

  const removeMemberMutation = trpc.team.removeMember.useMutation({
    onSuccess: () => {
      toastSuccess("Member removed", { description: "Team member removed successfully" });
      setMemberToRemove(null);
      utils.team.getMembers.invalidate();
    },
    onError: (error) => {
      toastError("Failed to remove member", { description: error.message });
    },
  });

  const updateRoleMutation = trpc.team.updateMemberRole.useMutation({
    onSuccess: () => {
      toastSuccess("Role updated", { description: "Member role updated successfully" });
      utils.team.getMembers.invalidate();
    },
    onError: (error) => {
      toastError("Failed to update role", { description: error.message });
    },
  });

  const cancelInvitationMutation = trpc.team.cancelInvitation.useMutation({
    onSuccess: () => {
      toastSuccess("Invitation cancelled", { description: "Invitation cancelled successfully" });
      utils.team.getInvitations.invalidate();
    },
    onError: (error) => {
      toastError("Failed to cancel invitation", { description: error.message });
    },
  });

  const handleInviteMember = () => {
    if (!inviteEmail) return;
    inviteMemberMutation.mutate({ email: inviteEmail, role: inviteRole });
  };

  const handleRemoveMember = () => {
    if (!memberToRemove) return;
    removeMemberMutation.mutate({ memberId: memberToRemove });
  };

  const handleUpdateRole = (userId: number, role: "admin" | "manager" | "viewer") => {
    updateRoleMutation.mutate({ memberId: userId, role });
  };

  const getRoleBadge = (role: string) => {
    const colors = {
      admin: "bg-purple-100 text-purple-800 border-purple-200",
      manager: "bg-blue-100 text-blue-800 border-blue-200",
      viewer: "bg-gray-100 text-gray-800 border-gray-200",
    };
    const icons = {
      admin: <Crown className="w-3 h-3" />,
      manager: <Shield className="w-3 h-3" />,
      viewer: <Users className="w-3 h-3" />,
    };
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${colors[role as keyof typeof colors]}`}>
        {icons[role as keyof typeof icons]}
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </span>
    );
  };

  if (!team) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="py-8">
            <div className="text-center">
              <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Team</h3>
              <p className="text-gray-600 mb-4">
                You are not part of any team yet.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Team Settings</h1>
        <p className="text-gray-600">Manage your team members and invitations</p>
      </div>

      {/* Team Info */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Team Information</CardTitle>
          <CardDescription>Your team details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label>Team Name</Label>
              <Input value={team.team.name} disabled className="mt-1" />
            </div>
            <div>
              <Label>Total Members</Label>
              <div className="text-2xl font-bold text-blue-600 mt-1">
                {members.length}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Team Members */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Team Members</CardTitle>
              <CardDescription>Manage team members and their roles</CardDescription>
            </div>
            <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Invite Member
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Invite Team Member</DialogTitle>
                  <DialogDescription>
                    Send an invitation to join your team
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="colleague@example.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="role">Role</Label>
                    <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as any)}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin - Full access</SelectItem>
                        <SelectItem value="manager">Manager - Manage campaigns & leads</SelectItem>
                        <SelectItem value="viewer">Viewer - Read-only access</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setInviteDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleInviteMember} disabled={!inviteEmail}>
                    Send Invitation
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                    {member.name?.charAt(0).toUpperCase() || "?"}
                  </div>
                  <div>
                    <div className="font-medium">{member.name || "Unknown"}</div>
                    <div className="text-sm text-gray-600">{member.email}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Select
                    value={member.role}
                    onValueChange={(v) => handleUpdateRole(member.id, v as any)}
                  >
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="viewer">Viewer</SelectItem>
                    </SelectContent>
                  </Select>
                  {getRoleBadge(member.role)}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setMemberToRemove(member.id)}
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Pending Invitations */}
      {invitations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pending Invitations</CardTitle>
            <CardDescription>Invitations waiting for response</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {invitations.map((invitation) => (
                <div
                  key={invitation.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <div className="font-medium">{invitation.email}</div>
                      <div className="text-sm text-gray-600">
                        Invited as {invitation.role} • {new Date(invitation.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-yellow-600 font-medium">
                      {invitation.status}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => cancelInvitationMutation.mutate({ invitationId: invitation.id })}
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Remove Member Dialog */}
      <AlertDialog open={!!memberToRemove} onOpenChange={() => setMemberToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Team Member?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the member from your team. They will lose access to all team resources.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemoveMember} className="bg-red-600 hover:bg-red-700">
              Remove Member
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
