"use client";

import { useState } from "react";
import { useQuery } from "react-query";
import { userAPI } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Search, Eye, Trash2, Download, Plus } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ManageUserModal } from "@/components/admin/users/manage-user-modal";
import { AddUserModal } from "@/components/admin/users/add-user-modal";

export default function UserManagementPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTier, setSelectedTier] = useState("all");
  const [selectedRole, setSelectedRole] = useState("all");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const {
    data: usersData,
    isLoading,
    refetch,
  } = useQuery(
    ["users", currentPage, selectedTier, selectedRole],
    () =>
      userAPI.listUsers(currentPage, 10, {
        tier: selectedTier === "all" ? undefined : selectedTier,
        role: selectedRole === "all" ? undefined : selectedRole,
      }),
    {
      onError: (error: any) => {
        toast.error("Failed to load users");
        console.error("[v0] Users error:", error);
      },
    },
  );

  const handleDeleteUser = async () => {
    if (!selectedUserId) return;

    try {
      await userAPI.deleteUser(selectedUserId);
      toast.success("User deleted successfully");
      setIsDeleteDialogOpen(false);
      setSelectedUserId(null);
      refetch();
    } catch (error: any) {
      console.error("[v0] Delete user error:", error);
      toast.error("Failed to delete user");
    }
  };

  const usersPayload = usersData?.data?.data;
  const users = usersPayload?.users || [];
  const filteredUsers = users.filter((user: any) => {
    const name =
      user.name ||
      [user.firstName, user.lastName].filter(Boolean).join(" ") ||
      "";
    return (
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              User Management
            </h1>
            <p className="text-gray-500 mt-1 text-sm">
              Dashboard &gt; User Management
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              className="bg-blue-700 hover:bg-blue-800 text-white rounded-full px-5"
              onClick={() => setIsAddModalOpen(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add New User
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Search users"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 rounded-xl"
            />
          </div>

          <div className="flex items-center gap-3">
            <select
              value={selectedTier}
              onChange={(e) => {
                setSelectedTier(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
            >
              <option value="all">All Tiers</option>
              <option value="starter">Starter</option>
              <option value="professional">Professional</option>
            </select>
            <select
              value={selectedRole}
              onChange={(e) => {
                setSelectedRole(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
            >
              <option value="all">All Roles</option>
              <option value="user">User</option>
              <option value="sub-admin">Sub-Admin</option>
              <option value="admin">Admin</option>
              <option value="storeman">Storeman</option>
            </select>
          </div>
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm">
                  User
                </th>
                <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm">
                  Email
                </th>
                <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm">
                  Subscription
                </th>
                <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm">
                  Status
                </th>
                <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm">
                  Active Device
                </th>
                <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm">
                  Exam taken
                </th>
                <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm">
                  Avg. Score
                </th>
                <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm">
                  Last Active
                </th>
                <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <tr
                    key={i}
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <Skeleton className="w-8 h-8 rounded-full" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <Skeleton className="h-4 w-32" />
                    </td>
                    <td className="py-4 px-6">
                      <Skeleton className="h-4 w-20" />
                    </td>
                    <td className="py-4 px-6">
                      <Skeleton className="h-6 w-20" />
                    </td>
                    <td className="py-4 px-6">
                      <Skeleton className="h-4 w-36" />
                    </td>
                    <td className="py-4 px-6">
                      <Skeleton className="h-4 w-10" />
                    </td>
                    <td className="py-4 px-6">
                      <Skeleton className="h-4 w-12" />
                    </td>
                    <td className="py-4 px-6">
                      <Skeleton className="h-4 w-24" />
                    </td>
                    <td className="py-4 px-6">
                      <Skeleton className="h-8 w-24" />
                    </td>
                  </tr>
                ))
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-gray-600">
                    No users found
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user: any) => (
                  <tr
                    key={user._id}
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="text-xs">
                            {(
                              user.name ||
                              user.firstName ||
                              user.email ||
                              "?"
                            )?.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-gray-900">
                            {user.name ||
                              [user.firstName, user.lastName]
                                .filter(Boolean)
                                .join(" ") ||
                              "N/A"}
                          </span>
                          <span className="text-xs text-gray-500">
                            {user.role || "user"}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-600">
                      {user.email}
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-600">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          user.subscriptionTier === "professional"
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {user.subscriptionTier === "professional"
                          ? "Professional"
                          : "Starter"}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          user.status === "active"
                            ? "bg-green-100 text-green-700"
                            : "bg-orange-100 text-orange-700"
                        }`}
                      >
                        {user.status === "active" ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-600 max-w-[240px] break-all">
                      {(
                        user.activeDeviceId || user.activeInstallationId
                      )?.slice(-4) || "N/A"}
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-600">
                      {user.unlockedExamCount ??
                        (user.unlockedExams || []).length ??
                        0}
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-600">
                      {typeof user.avgScore === "number"
                        ? `${user.avgScore}%`
                        : "--%"}
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-600">
                      {user.updatedAt || user.createdAt
                        ? new Date(
                            user.updatedAt || user.createdAt,
                          ).toLocaleDateString()
                        : "N/A"}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex gap-2">
                        <Button
                          size="icon"
                          className="h-9 w-9 rounded-full bg-blue-100 text-blue-700 hover:bg-blue-200"
                          onClick={() => {
                            setSelectedUser(user);
                            setSelectedUserId(user._id);
                            setIsManageModalOpen(true);
                          }}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          className="h-9 w-9 rounded-full bg-red-100 text-red-700 hover:bg-red-200"
                          onClick={() => {
                            setSelectedUserId(user._id);
                            setIsDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {!isLoading && usersPayload && (
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Showing {(currentPage - 1) * 10 + 1} to{" "}
              {Math.min(currentPage * 10, usersPayload?.meta?.total || 0)} of{" "}
              {usersPayload?.meta?.total || 0} results
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              >
                {"<"}
              </Button>
              {Array.from({
                length: Math.min(
                  3,
                  Math.ceil((usersPayload?.meta?.total || 0) / 10),
                ),
              }).map((_, i) => (
                <Button
                  key={i + 1}
                  variant={currentPage === i + 1 ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(i + 1)}
                  className={
                    currentPage === i + 1 ? "bg-blue-600 text-white" : ""
                  }
                >
                  {i + 1}
                </Button>
              ))}
              <Button
                variant="outline"
                size="sm"
                disabled={
                  currentPage >=
                  Math.ceil((usersPayload?.meta?.total || 0) / 10)
                }
                onClick={() => setCurrentPage(currentPage + 1)}
              >
                {">"}
              </Button>
            </div>
          </div>
        </Card>
      )}

      <ManageUserModal
        isOpen={isManageModalOpen}
        userId={selectedUserId || undefined}
        user={selectedUser || undefined}
        userName={selectedUser?.email || selectedUser?.name || "User"}
        onClose={() => {
          setIsManageModalOpen(false);
          setSelectedUser(null);
        }}
        onSuccess={() => {
          setIsManageModalOpen(false);
          setSelectedUser(null);
          refetch();
        }}
      />

      <AddUserModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => {
          setIsAddModalOpen(false);
          refetch();
        }}
      />

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The user will be permanently
              deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel className="rounded-lg">No</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              className="bg-red-600 hover:bg-red-700 text-white rounded-lg"
            >
              Yes, Delete
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
