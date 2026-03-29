"use client";

import { useState } from "react";
import { useMutation, useQuery } from "react-query";
import { resourceAPI } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Pencil, Plus, RefreshCw, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const toNumberOrZero = (value: string) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const initialForm = {
  title: "",
  slug: "",
  shortCode: "",
  description: "",
  sortOrder: "0",
};

export default function ResourcesCategoryAdminPage() {
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);

  const {
    data: categoriesRes,
    isLoading,
    refetch,
  } = useQuery(["resource-categories-admin"], () => resourceAPI.listCategories());

  const categories = categoriesRes?.data?.data || [];

  const closeFormModal = () => {
    setIsFormModalOpen(false);
    setEditingId(null);
    setForm(initialForm);
  };

  const createCategoryMutation = useMutation(
    (payload: any) => resourceAPI.createCategory(payload),
    {
      onSuccess: () => {
        toast.success("Category created");
        closeFormModal();
        refetch();
      },
      onError: (error: any) => {
        toast.error(error?.response?.data?.message || "Failed to create category");
      },
    }
  );

  const updateCategoryMutation = useMutation(
    ({ categoryId, payload }: { categoryId: string; payload: any }) =>
      resourceAPI.updateCategory(categoryId, payload),
    {
      onSuccess: () => {
        toast.success("Category updated");
        closeFormModal();
        refetch();
      },
      onError: (error: any) => {
        toast.error(error?.response?.data?.message || "Failed to update category");
      },
    }
  );

  const deleteCategoryMutation = useMutation(
    (categoryId: string) => resourceAPI.deleteCategory(categoryId),
    {
      onSuccess: () => {
        toast.success("Category deleted");
        setIsDeleteModalOpen(false);
        setDeleteTarget(null);
        refetch();
      },
      onError: (error: any) => {
        toast.error(error?.response?.data?.message || "Failed to delete category");
      },
    }
  );

  const toggleCategoryStatusMutation = useMutation(
    ({ categoryId, isActive }: { categoryId: string; isActive: boolean }) =>
      resourceAPI.updateCategory(categoryId, { isActive }),
    {
      onSuccess: () => {
        refetch();
      },
      onError: (error: any) => {
        toast.error(error?.response?.data?.message || "Failed to update status");
      },
    }
  );

  const handleSubmit = () => {
    if (!form.title.trim() || !form.slug.trim()) {
      toast.error("Title and slug are required");
      return;
    }

    const payload = {
      title: form.title.trim(),
      slug: form.slug.trim().toLowerCase(),
      shortCode: form.shortCode.trim(),
      description: form.description.trim(),
      sortOrder: toNumberOrZero(form.sortOrder),
    };

    if (editingId) {
      updateCategoryMutation.mutate({ categoryId: editingId, payload });
      return;
    }

    createCategoryMutation.mutate({
      ...payload,
      isActive: true,
    });
  };

  const openCreateModal = () => {
    setEditingId(null);
    setForm(initialForm);
    setIsFormModalOpen(true);
  };

  const openEditModal = (category: any) => {
    setEditingId(category._id);
    setForm({
      title: category.title || "",
      slug: category.slug || "",
      shortCode: category.shortCode || "",
      description: category.description || "",
      sortOrder: String(category.sortOrder ?? 0),
    });
    setIsFormModalOpen(true);
  };

  const openDeleteModal = (category: any) => {
    setDeleteTarget(category);
    setIsDeleteModalOpen(true);
  };

  const saving = createCategoryMutation.isLoading || updateCategoryMutation.isLoading;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Resources Categories</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Add, edit, list, and delete certification tabs.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={openCreateModal} className="gap-2">
            <Plus className="h-4 w-4" /> Add Category
          </Button>
        </div>
      </div>

      <Card className="p-5">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">All Categories</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-2">Title</th>
                <th className="text-left py-2">Status</th>
                <th className="text-left py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(isLoading ? [] : categories).map((category: any) => (
                <tr key={category._id} className="border-b border-slate-100">
                  <td className="py-2">{category.title}</td>
                  <td className="py-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        toggleCategoryStatusMutation.mutate({
                          categoryId: category._id,
                          isActive: !category.isActive,
                        })
                      }
                    >
                      {category.isActive ? "Active" : "Inactive"}
                    </Button>
                  </td>
                  <td className="py-2">
                    <div className="flex items-center gap-2">
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => openEditModal(category)}
                        title="Edit category"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="destructive"
                        onClick={() => openDeleteModal(category)}
                        title="Delete category"
                        className="bg-red-400"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {isLoading && (
                <tr>
                  <td colSpan={6} className="py-4 text-slate-500">
                    Loading categories...
                  </td>
                </tr>
              )}
              {!isLoading && categories.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-slate-500">
                    No categories found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Dialog open={isFormModalOpen} onOpenChange={(open) => !open && closeFormModal()}>
        <DialogContent className="max-w-lg bg-white p-6 rounded-2xl">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Category" : "Add Category"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="API 510 - Pressure Vessel Inspector"
              />
            </div>
            <div className="space-y-2">
              <Label>Slug</Label>
              <Input
                value={form.slug}
                onChange={(e) => setForm((prev) => ({ ...prev, slug: e.target.value }))}
                placeholder="api-510"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Short Code</Label>
                <Input
                  value={form.shortCode}
                  onChange={(e) => setForm((prev) => ({ ...prev, shortCode: e.target.value }))}
                  placeholder="API510"
                />
              </div>
              <div className="space-y-2">
                <Label>Sort Order</Label>
                <Input
                  type="number"
                  value={form.sortOrder}
                  onChange={(e) => setForm((prev) => ({ ...prev, sortOrder: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Pressure vessel inspection learning resources"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button variant="outline" onClick={closeFormModal}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={saving}>
                {editingId ? "Update Category" : "Create Category"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <AlertDialogContent className="bg-white rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-medium text-slate-800">{deleteTarget?.title || "this category"}</span>
              ? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end gap-2">
            <AlertDialogCancel onClick={() => setDeleteTarget(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => {
                if (!deleteTarget?._id) return;
                deleteCategoryMutation.mutate(deleteTarget._id);
              }}
            >
              Delete
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
