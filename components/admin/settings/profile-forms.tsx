'use client';

import { useState } from 'react';
import { useMutation } from 'react-query';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { api } from '@/lib/api';
import { Loader2, Eye, EyeOff } from 'lucide-react';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function ChangePasswordModal({
  isOpen,
  onClose,
  onSuccess,
}: ChangePasswordModalProps) {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const { mutate: changePassword, isLoading } = useMutation(
    () => api.changePassword(formData),
    {
      onSuccess: () => {
        toast.success('Password changed successfully');
        setFormData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
        onSuccess?.();
        onClose();
      },
      onError: (error: any) => {
        toast.error(
          error?.response?.data?.message || 'Failed to change password'
        );
      },
    }
  );

  const isFormValid =
    formData.currentPassword &&
    formData.newPassword &&
    formData.confirmPassword &&
    formData.newPassword === formData.confirmPassword;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md rounded-2xl bg-white p-6">
        <DialogHeader className="text-left">
          <DialogTitle className="text-base font-semibold text-slate-900">
            Change Password
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="current" className="text-xs font-semibold text-slate-600">
              Current Password
            </Label>
            <div className="relative mt-2">
              <Input
                id="current"
                type={showCurrent ? 'text' : 'password'}
                placeholder="********"
                value={formData.currentPassword}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    currentPassword: e.target.value,
                  })
                }
                className="h-10 rounded-lg border-slate-200 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowCurrent((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                aria-label={showCurrent ? 'Hide password' : 'Show password'}
              >
                {showCurrent ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <div>
            <Label htmlFor="new" className="text-xs font-semibold text-slate-600">
              New Password
            </Label>
            <div className="relative mt-2">
              <Input
                id="new"
                type={showNew ? 'text' : 'password'}
                placeholder="********"
                value={formData.newPassword}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    newPassword: e.target.value,
                  })
                }
                className="h-10 rounded-lg border-slate-200 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowNew((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                aria-label={showNew ? 'Hide password' : 'Show password'}
              >
                {showNew ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <div>
            <Label htmlFor="confirm" className="text-xs font-semibold text-slate-600">
              Confirm New Password
            </Label>
            <div className="relative mt-2">
              <Input
                id="confirm"
                type={showConfirm ? 'text' : 'password'}
                placeholder="********"
                value={formData.confirmPassword}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    confirmPassword: e.target.value,
                  })
                }
                className="h-10 rounded-lg border-slate-200 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                aria-label={showConfirm ? 'Hide password' : 'Show password'}
              >
                {showConfirm ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <div className="pt-2">
            <Button
              onClick={() => changePassword()}
              disabled={!isFormValid || isLoading}
              className="h-10 rounded-lg bg-[#1E3A8A] px-6 text-white hover:bg-[#1C357B]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Password'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface UpdateProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialData?: {
    fullName: string;
    email: string;
    phone: string;
    gender: string;
    dateOfBirth: string;
    address: string;
  };
}

export function UpdateProfileModal({
  isOpen,
  onClose,
  onSuccess,
  initialData,
}: UpdateProfileModalProps) {
  const [formData, setFormData] = useState({
    fullName: initialData?.fullName || '',
    email: initialData?.email || '',
    phone: initialData?.phone || '',
    gender: initialData?.gender || '',
    dateOfBirth: initialData?.dateOfBirth || '',
    address: initialData?.address || '',
  });

  const { mutate: updateProfile, isLoading } = useMutation(
    () => {
      const payload = new FormData();
      if (formData.fullName) payload.append('name', formData.fullName);
      if (formData.email) payload.append('email', formData.email);
      if (formData.phone) payload.append('phone', formData.phone);
      if (formData.gender) payload.append('gender', formData.gender);
      if (formData.dateOfBirth) payload.append('dob', formData.dateOfBirth);
      if (formData.address) {
        payload.append('addresses', JSON.stringify([formData.address]));
      }
      return api.updateProfile(payload);
    },
    {
      onSuccess: () => {
        toast.success('Profile updated successfully');
        onSuccess?.();
        onClose();
      },
      onError: (error: any) => {
        toast.error(
          error?.response?.data?.message || 'Failed to update profile'
        );
      },
    }
  );

  const isFormValid =
    formData.fullName &&
    formData.email &&
    formData.phone &&
    formData.dateOfBirth &&
    formData.address;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl rounded-2xl bg-white p-6">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-slate-900">
            Update Profile
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="fullName" className="text-xs font-semibold text-slate-600">
                Full Name
              </Label>
              <Input
                id="fullName"
                placeholder="Emmanuel Zibili"
                value={formData.fullName}
                onChange={(e) =>
                  setFormData({ ...formData, fullName: e.target.value })
                }
                className="mt-2 h-10 rounded-lg border-slate-200"
              />
            </div>
            <div>
              <Label htmlFor="email" className="text-xs font-semibold text-slate-600">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="Emmanuel.Zibili123@gmail.com"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="mt-2 h-10 rounded-lg border-slate-200"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="phone" className="text-xs font-semibold text-slate-600">
                Phone Number
              </Label>
              <Input
                id="phone"
                placeholder="+1 (888) 000-0000"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                className="mt-2 h-10 rounded-lg border-slate-200"
              />
            </div>
            <div>
              <Label htmlFor="gender" className="text-xs font-semibold text-slate-600">
                Gender
              </Label>
              <Select
                value={formData.gender}
                onValueChange={(value) =>
                  setFormData({ ...formData, gender: value })
                }
              >
                <SelectTrigger id="gender" className="mt-2 h-10 rounded-lg border-slate-200">
                  <SelectValue placeholder="Select Gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="dob" className="text-xs font-semibold text-slate-600">
                Date of Birth
              </Label>
              <Input
                id="dob"
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) =>
                  setFormData({ ...formData, dateOfBirth: e.target.value })
                }
                className="mt-2 h-10 rounded-lg border-slate-200"
              />
            </div>
            <div>
              <Label htmlFor="address" className="text-xs font-semibold text-slate-600">
                Address
              </Label>
              <Input
                id="address"
                placeholder="00000 Artesia Blvd, Suite A-000"
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                className="mt-2 h-10 rounded-lg border-slate-200"
              />
            </div>
          </div>

          <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={onClose} className="rounded-lg">
              Cancel
            </Button>
            <Button
              onClick={() => updateProfile()}
              disabled={!isFormValid || isLoading}
              className="rounded-lg bg-[#1E3A8A] text-white hover:bg-[#1C357B]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
