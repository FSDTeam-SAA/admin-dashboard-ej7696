"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useQuery } from "react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ChangePasswordModal } from "@/components/admin/settings/profile-forms";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";

type ProfileForm = {
  fullName: string;
  email: string;
  phone: string;
  gender: string;
  dateOfBirth: string;
  address: string;
};

const emptyProfile: ProfileForm = {
  fullName: "",
  email: "",
  phone: "",
  gender: "",
  dateOfBirth: "",
  address: "",
};

const normalizeDate = (value: string) => {
  if (!value) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toISOString().slice(0, 10);
};

export default function SettingsPage() {
  const [profileForm, setProfileForm] = useState<ProfileForm>(emptyProfile);
  const [initialProfile, setInitialProfile] =
    useState<ProfileForm>(emptyProfile);
  const [avatarUrl, setAvatarUrl] = useState<string>("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isAvatarHovered, setIsAvatarHovered] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isModelModalOpen, setIsModelModalOpen] = useState(false);
  const [isUpdatingModel, setIsUpdatingModel] = useState(false);
  const [selectedModel, setSelectedModel] = useState("gemini-3-flash-preview");

  const {
    data: profileData,
    isLoading,
    refetch,
  } = useQuery("admin-profile", api.getProfile, {
    onError: () => toast.error("Failed to load profile"),
  });

  const profileInfo = useMemo(() => {
    const payload = profileData?.data?.data ?? profileData?.data ?? {};
    const user = payload?.user ?? payload;

    const avatarValue =
      user?.avatar?.url ||
      user?.avatar?.secure_url ||
      user?.avatar?.path ||
      user?.avatar ||
      user?.image ||
      "";

    return {
      fullName: user?.name || user?.fullName || "",
      email: user?.email || "",
      phone: user?.phone || "",
      gender: user?.gender || "",
      dateOfBirth: normalizeDate(user?.dob || user?.dateOfBirth || ""),
      address: Array.isArray(user?.addresses)
        ? user.addresses[0] || ""
        : user?.address || "",
      avatar: avatarValue,
    };
  }, [profileData]);

  useEffect(() => {
    if (!profileData) return;
    setProfileForm({
      fullName: profileInfo.fullName,
      email: profileInfo.email,
      phone: profileInfo.phone,
      gender: profileInfo.gender,
      dateOfBirth: profileInfo.dateOfBirth,
      address: profileInfo.address,
    });
    setInitialProfile({
      fullName: profileInfo.fullName,
      email: profileInfo.email,
      phone: profileInfo.phone,
      gender: profileInfo.gender,
      dateOfBirth: profileInfo.dateOfBirth,
      address: profileInfo.address,
    });
    setAvatarUrl(profileInfo.avatar);
  }, [profileData, profileInfo]);

  const handleSaveProfile = async () => {
    if (!profileForm.fullName.trim()) {
      toast.error("Full name is required");
      return;
    }
    if (!profileForm.email.trim()) {
      toast.error("Email is required");
      return;
    }

    setIsSaving(true);
    try {
      const payload = new FormData();
      payload.append("name", profileForm.fullName);
      payload.append("email", profileForm.email.trim());
      if (profileForm.phone) payload.append("phone", profileForm.phone);
      if (profileForm.gender) payload.append("gender", profileForm.gender);
      if (profileForm.dateOfBirth)
        payload.append("dob", profileForm.dateOfBirth);
      if (profileForm.address) {
        payload.append("addresses", JSON.stringify([profileForm.address]));
      }
      if (avatarFile) payload.append("avatar", avatarFile);

      await api.updateProfile(payload);
      toast.success("Profile updated successfully");
      setInitialProfile(profileForm);
      setAvatarFile(null);
      refetch();
    } catch (error) {
      toast.error("Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setProfileForm(initialProfile);
    setAvatarFile(null);
    setAvatarUrl(profileInfo.avatar || "");
  };

  // ✅ AI model modal handlers
  const openModelModal = () => {
    setIsModelModalOpen(true);
  };

  const closeModelModal = () => {
    if (isUpdatingModel) return;
    setIsModelModalOpen(false);
  };

  const handleUpdateModel = async (event: FormEvent) => {
    event.preventDefault();

    if (!selectedModel) {
      toast.error("Please select a model");
      return;
    }

    setIsUpdatingModel(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/api/v1/config-model`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ model_name: selectedModel }),
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to update AI model");
      }

      toast.success("AI model updated successfully");
      setIsModelModalOpen(false);
    } catch (error: any) {
      toast.error(error?.message || "Failed to update AI model");
    } finally {
      setIsUpdatingModel(false);
    }
  };

  const avatarFallback = profileForm.fullName
    ? profileForm.fullName.charAt(0).toUpperCase()
    : "U";

  return (
    <div className="min-h-screen bg-[#F5F8FF] p-4 md:p-6 space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Setting</h1>
          <p className="text-sm text-slate-500">Manage your settings</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="outline"
            className="h-10 rounded-full border-[#1E3A8A] text-[#1E3A8A] hover:bg-[#1E3A8A]/10"
            onClick={() => setIsPasswordModalOpen(true)}
          >
            Change Password
          </Button>
          <Button
            type="button"
            onClick={openModelModal}
            variant="outline"
            className="h-10 rounded-full border-[#1E3A8A] text-[#1E3A8A] hover:bg-[#1E3A8A]/10"
          >
            Change AI model
          </Button>
          <Button
            className="h-10 rounded-full bg-[#1E3A8A] px-6 text-white hover:bg-[#1C357B]"
            onClick={handleSaveProfile}
            disabled={isSaving || isLoading}
          >
            Update Profile
          </Button>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-6 md:p-8 shadow-sm">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div
              className="relative"
              onMouseEnter={() => setIsAvatarHovered(true)}
              onMouseLeave={() => setIsAvatarHovered(false)}
            >
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Profile"
                  className="h-20 w-20 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-200 text-xl font-semibold text-slate-600">
                  {avatarFallback}
                </div>
              )}
              <label
                htmlFor="profile-avatar-upload"
                className={`absolute inset-0 flex cursor-pointer items-center justify-center rounded-full bg-black/40 text-white transition ${
                  isAvatarHovered ? "opacity-100" : "opacity-0"
                }`}
                title="Change profile image"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M12 5H7C5.89543 5 5 5.89543 5 7V17C5 18.1046 5.89543 19 7 19H17C18.1046 19 19 18.1046 19 17V12"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M17 3H21V7"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M10 14L21 3"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </label>
              <input
                id="profile-avatar-upload"
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  if (!file) return;
                  const preview = URL.createObjectURL(file);
                  setAvatarUrl(preview);
                  setAvatarFile(file);
                }}
              />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                {profileForm.fullName || "User"}
              </h2>
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-slate-600">
              Full Name
            </label>
            {isLoading ? (
              <Skeleton className="mt-2 h-11 w-full" />
            ) : (
              <Input
                value={profileForm.fullName}
                onChange={(e) =>
                  setProfileForm((prev) => ({
                    ...prev,
                    fullName: e.target.value,
                  }))
                }
                className="mt-2 h-11 rounded-lg border-[#1E3A8A]"
                placeholder="Emmanuel Zibili"
              />
            )}
          </div>

          <div>
            <label className="text-sm font-medium text-slate-600">Email</label>
            {isLoading ? (
              <Skeleton className="mt-2 h-11 w-full" />
            ) : (
              <Input
                value={profileForm.email}
                type="email"
                onChange={(e) =>
                  setProfileForm((prev) => ({
                    ...prev,
                    email: e.target.value,
                  }))
                }
                className="mt-2 h-11 rounded-lg border-[#1E3A8A]"
                placeholder="Emmanuel.Zibili123@gmail.com"
              />
            )}
          </div>

          <div>
            <label className="text-sm font-medium text-slate-600">
              Phone Number
            </label>
            {isLoading ? (
              <Skeleton className="mt-2 h-11 w-full" />
            ) : (
              <Input
                value={profileForm.phone}
                onChange={(e) =>
                  setProfileForm((prev) => ({
                    ...prev,
                    phone: e.target.value,
                  }))
                }
                className="mt-2 h-11 rounded-lg border-[#1E3A8A]"
                placeholder="+1 (888) 000-0000"
              />
            )}
          </div>


          <div>
            <label className="text-sm font-medium text-slate-600">
              Address
            </label>
            {isLoading ? (
              <Skeleton className="mt-2 h-11 w-full" />
            ) : (
              <Input
                value={profileForm.address}
                onChange={(e) =>
                  setProfileForm((prev) => ({
                    ...prev,
                    address: e.target.value,
                  }))
                }
                className="mt-2 h-11 rounded-lg border-[#1E3A8A]"
                placeholder="00000 Artesia Blvd, Suite A-000"
              />
            )}
          </div>
        </div>

        <div className="mt-8 flex flex-wrap justify-end gap-3">
          <Button
            variant="outline"
            className="h-10 rounded-xl border-[#1E3A8A] px-6 text-[#1E3A8A]"
            onClick={handleCancel}
            disabled={isSaving || isLoading}
          >
            Cancel
          </Button>
          <Button
            className="h-10 rounded-xl bg-[#1E3A8A] px-6 text-white hover:bg-[#1C357B]"
            onClick={handleSaveProfile}
            disabled={isSaving || isLoading}
          >
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>

      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        onSuccess={refetch}
      />

      {/* ✅ Change AI Model Modal */}
      <Dialog
        open={isModelModalOpen}
        onOpenChange={(open) => {
          if (isUpdatingModel) return;
          setIsModelModalOpen(open);
        }}
      >
        <DialogContent className="sm:max-w-md bg-white">
          <DialogHeader>
            <DialogTitle>Change AI Model</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleUpdateModel} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Select Model
              </label>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                disabled={isUpdatingModel}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="gemini-3-flash-preview">
                  Gemini 3 Flash (Preview)
                </option>
                <option value="gpt-4.1-2025-04-14">gpt-4.1-2025-04-14</option>
              </select>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={closeModelModal}
                disabled={isUpdatingModel}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isUpdatingModel}>
                {isUpdatingModel ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Model"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
