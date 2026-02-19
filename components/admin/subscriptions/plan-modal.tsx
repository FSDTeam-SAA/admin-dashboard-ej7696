'use client';

import { useEffect, useState } from 'react';
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
import { Loader2, X, Plus, Check } from 'lucide-react';
import { paymentAPI } from '@/lib/api';

interface PlanItem {
  id: string;
  text: string;
}

interface AddPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  planData?: {
    id: string;
    name: string;
    price: number;
    duration: string;
    items: PlanItem[];
    note: string;
    status: string;
  };
  isEdit?: boolean;
}

export function AddPlanModal({
  isOpen,
  onClose,
  onSuccess,
  planData,
  isEdit = false,
}: AddPlanModalProps) {
  const [newItemId, setNewItemId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: planData?.name || '',
    price: planData?.price?.toString() || '',
    duration: planData?.duration || 'Monthly',
    items: planData?.items || [{ id: '1', text: '' }],
    note: planData?.note || '',
    status: planData?.status || 'Active',
  });

  useEffect(() => {
    if (!isOpen) return;
    setNewItemId(null);
    setFormData({
      name: planData?.name || '',
      price: planData?.price?.toString() || '',
      duration: planData?.duration || 'Monthly',
      items: planData?.items || [{ id: '1', text: '' }],
      note: planData?.note || '',
      status: planData?.status || 'Active',
    });
  }, [isOpen, planData]);

  useEffect(() => {
    if (!newItemId) return;
    const input = document.getElementById(
      `plan-item-${newItemId}`
    ) as HTMLInputElement | null;
    if (input) {
      input.focus();
      input.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      setNewItemId(null);
    }
  }, [newItemId, formData.items.length]);

  const toInterval = (duration: string) => {
    const value = duration?.toString().toLowerCase() || 'monthly';
    if (value.includes('year')) {
      return { count: 1, unit: 'years' };
    }
    if (value.includes('quarter') || value.includes('3')) {
      return { count: 3, unit: 'months' };
    }
    return { count: 1, unit: 'months' };
  };

  const { mutate: savePlan, isLoading } = useMutation(
    async () => {
      const price = Number(formData.price);
      const features = formData.items
        .map((item) => item.text?.toString().trim())
        .filter(Boolean);
      const { count, unit } = toInterval(formData.duration);

      return paymentAPI.updatePricing({
        professionalPlanPrice: price,
        professionalPlanIntervalCount: count,
        professionalPlanIntervalUnit: unit,
        professionalPlanDescription:
          formData.note?.toString().trim() || "What's included in your plan",
        professionalPlanFeatures: features,
        currency: 'USD',
      });
    },
    {
      onSuccess: () => {
        toast.success(
          isEdit ? 'Plan updated successfully' : 'Plan created successfully'
        );
        onSuccess?.();
        onClose();
      },
      onError: (error: any) => {
        toast.error(error?.response?.data?.message || 'Failed to save plan');
      },
    }
  );

  const addItem = () => {
    const id = `${Date.now()}`;
    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, { id, text: '' }],
    }));
    setNewItemId(id);
  };

  const removeItem = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((item) => item.id !== id),
    }));
  };

  const updateItemText = (id: string, text: string) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.map((item) =>
        item.id === id ? { ...item, text } : item
      ),
    }));
  };

  const priceValue = Number(formData.price);
  const isFormValid =
    formData.name &&
    Number.isFinite(priceValue) &&
    priceValue > 0 &&
    formData.note &&
    formData.items.length > 0 &&
    formData.items.every((item) => item.text.trim());

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="max-w-[640px] rounded-2xl bg-white p-6">
        <DialogHeader className="text-center">
          <DialogTitle className="text-lg font-semibold text-slate-900">
            {isEdit ? 'Edit Plan' : 'Add New Plan'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="name" className="text-xs font-semibold text-slate-500">
                Plan Name
              </Label>
              <Input
                id="name"
                placeholder="Starter"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="mt-2 h-10 rounded-lg border-slate-200"
              />
            </div>
            <div>
              <Label htmlFor="price" className="text-xs font-semibold text-slate-500">
                Plan Price
              </Label>
              <div className="mt-2 flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-500">$</span>
                <Input
                  id="price"
                  type="number"
                  placeholder="500"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({ ...formData, price: e.target.value })
                  }
                  className="h-10 rounded-lg border-slate-200"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="duration" className="text-xs font-semibold text-slate-500">
                Plan Duration
              </Label>
              <Select
                value={formData.duration}
                onValueChange={(value) =>
                  setFormData({ ...formData, duration: value })
                }
              >
                <SelectTrigger id="duration" className="mt-2 h-10 rounded-lg border-slate-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className='bg-white'>
                  <SelectItem value="Monthly">Monthly</SelectItem>
                  <SelectItem value="Quarterly">Quarterly</SelectItem>
                  <SelectItem value="Yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="note" className="text-xs font-semibold text-slate-500">
                Plan Note
              </Label>
              <Input
                id="note"
                placeholder="Add a short note"
                value={formData.note}
                onChange={(e) =>
                  setFormData({ ...formData, note: e.target.value })
                }
                className="mt-2 h-10 rounded-lg border-slate-200"
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-xs font-semibold text-slate-500">Plan Items</Label>
            <div className="space-y-2">
              {formData.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2"
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100 text-green-600">
                    <Check className="h-3.5 w-3.5" />
                  </span>
                  <Input
                    id={`plan-item-${item.id}`}
                    placeholder="Up to 2 practice questions per certification"
                    value={item.text}
                    onChange={(e) =>
                      updateItemText(item.id, e.target.value)
                    }
                    className="h-9 flex-1 border-none px-0 shadow-none focus-visible:ring-0"
                  />
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className="rounded-full p-1 text-slate-400 transition hover:text-red-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={addItem}
                className="h-9 rounded-full border-slate-300 px-4 text-xs"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add More
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="h-10 rounded-full border-slate-300 px-6"
            >
              Cancel
            </Button>
            <Button
              onClick={() => savePlan()}
              disabled={!isFormValid || isLoading}
              className="h-10 rounded-full bg-[#1E3A8A] px-6 text-white hover:bg-[#1C357B]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Plan'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
