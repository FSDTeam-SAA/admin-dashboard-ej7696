"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "react-query";
import { resourceAPI } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Pencil, Plus, RefreshCw, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

const initialProductForm = {
  categoryId: "",
  code: "",
  title: "",
  shortDescription: "",
  coverImageUrl: "",
  contentUrl: "",
  price: "59",
  originalPrice: "59",
  upgradeDiscountPrice: "35",
  currency: "USD",
  bundleIncludes: "",
};

export default function ResourcesAdminPage() {
  const [productForm, setProductForm] = useState(initialProductForm);
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [coverImagePreviewUrl, setCoverImagePreviewUrl] = useState("");
  const [contentFile, setContentFile] = useState<File | null>(null);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);

  const { data: categoriesRes, refetch: refetchCategories } = useQuery(
    ["resource-categories-for-products"],
    () => resourceAPI.listCategories(),
  );

  const {
    data: productsRes,
    isLoading: loadingProducts,
    refetch: refetchProducts,
  } = useQuery(["resource-products"], () => resourceAPI.listProducts());

  const categories = categoriesRes?.data?.data || [];
  const products = productsRes?.data?.data || [];

  const categoryMap = useMemo(() => {
    const map: Record<string, any> = {};
    categories.forEach((item: any) => {
      map[item._id] = item;
    });
    return map;
  }, [categories]);

  useEffect(() => {
    if (coverImageFile) {
      const localPreviewUrl = URL.createObjectURL(coverImageFile);
      setCoverImagePreviewUrl(localPreviewUrl);
      return () => URL.revokeObjectURL(localPreviewUrl);
    }

    setCoverImagePreviewUrl(productForm.coverImageUrl.trim());
    return undefined;
  }, [coverImageFile, productForm.coverImageUrl]);

  const reloadAll = async () => {
    await Promise.all([refetchCategories(), refetchProducts()]);
  };

  const closeProductModal = () => {
    setIsProductModalOpen(false);
    setEditingProductId(null);
    setProductForm(initialProductForm);
    setCoverImageFile(null);
    setContentFile(null);
  };

  const createProductMutation = useMutation(
    (payload: any) => resourceAPI.createProduct(payload),
    {
      onSuccess: () => {
        toast.success("Product created");
        closeProductModal();
        refetchProducts();
      },
      onError: (error: any) => {
        toast.error(
          error?.response?.data?.message || "Failed to create product",
        );
      },
    },
  );

  const updateProductMutation = useMutation(
    ({ productId, payload }: { productId: string; payload: any }) =>
      resourceAPI.updateProduct(productId, payload),
    {
      onSuccess: () => {
        toast.success("Product updated");
        closeProductModal();
        refetchProducts();
      },
      onError: (error: any) => {
        toast.error(
          error?.response?.data?.message || "Failed to update product",
        );
      },
    },
  );

  const deleteProductMutation = useMutation(
    (productId: string) => resourceAPI.deleteProduct(productId),
    {
      onSuccess: () => {
        toast.success("Product deleted");
        setIsDeleteModalOpen(false);
        setDeleteTarget(null);
        refetchProducts();
      },
      onError: (error: any) => {
        toast.error(
          error?.response?.data?.message || "Failed to delete product",
        );
      },
    },
  );

  const toggleProductMutation = useMutation(
    ({ productId, isActive }: { productId: string; isActive: boolean }) =>
      resourceAPI.updateProduct(productId, { isActive }),
    {
      onSuccess: () => {
        refetchProducts();
      },
      onError: () => {
        toast.error("Failed to update product status");
      },
    },
  );

  const openCreateProductModal = () => {
    setEditingProductId(null);
    setProductForm(initialProductForm);
    setCoverImageFile(null);
    setContentFile(null);
    setIsProductModalOpen(true);
  };

  const openEditProductModal = (product: any) => {
    const resolvedCategoryId =
      typeof product.categoryId === "object"
        ? product.categoryId?._id || ""
        : product.categoryId || "";

    setEditingProductId(product._id);
    setProductForm({
      categoryId: resolvedCategoryId,
      code: product.code || "",
      title: product.title || "",
      shortDescription: product.shortDescription || "",
      coverImageUrl: product.coverImageUrl || "",
      contentUrl: product.contentUrl || "",
      price: String(product.price ?? ""),
      originalPrice: String(product.originalPrice ?? product.price ?? ""),
      upgradeDiscountPrice: String(product.upgradeDiscountPrice ?? ""),
      currency: product.currency || "USD",
      bundleIncludes: Array.isArray(product.bundleIncludes)
        ? product.bundleIncludes.join(", ")
        : "",
    });
    setCoverImageFile(null);
    setContentFile(null);
    setIsProductModalOpen(true);
  };

  const openDeleteModal = (product: any) => {
    setDeleteTarget(product);
    setIsDeleteModalOpen(true);
  };

  const handleSaveProduct = () => {
    if (
      !productForm.categoryId ||
      !productForm.code.trim() ||
      !productForm.title.trim()
    ) {
      toast.error("categoryId, code, and title are required");
      return;
    }

    const bundleIncludes = productForm.bundleIncludes
      .split(",")
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean);

    const payload = new FormData();
    payload.append("categoryId", productForm.categoryId);
    payload.append("code", productForm.code.trim().toLowerCase());
    payload.append("title", productForm.title.trim());
    payload.append("shortDescription", productForm.shortDescription.trim());
    payload.append("coverImageUrl", productForm.coverImageUrl.trim());
    payload.append("contentUrl", productForm.contentUrl.trim());
    payload.append("price", String(toNumberOrZero(productForm.price)));
    payload.append(
      "originalPrice",
      String(toNumberOrZero(productForm.originalPrice)),
    );
    payload.append(
      "upgradeDiscountPrice",
      String(toNumberOrZero(productForm.upgradeDiscountPrice)),
    );
    payload.append(
      "currency",
      productForm.currency.trim().toUpperCase() || "USD",
    );
    payload.append("isBundle", String(bundleIncludes.length > 0));
    payload.append("bundleIncludes", JSON.stringify(bundleIncludes));

    if (coverImageFile) {
      payload.append("coverImage", coverImageFile);
    }
    if (contentFile) {
      payload.append("contentFile", contentFile);
    }

    if (editingProductId) {
      updateProductMutation.mutate({
        productId: editingProductId,
        payload,
      });
      return;
    }

    payload.append("previewAvailable", "true");
    payload.append("previewTitle", "Introduction");
    payload.append("previewContent", "Preview introduction content");
    payload.append("sortOrder", "0");
    payload.append("isActive", "true");
    payload.append("showInUpgradeAddOn", "true");

    createProductMutation.mutate(payload);
  };

  const savingProduct =
    createProductMutation.isLoading || updateProductMutation.isLoading;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Resources Store</h1>
          <p className="text-gray-500 mt-1 text-sm">Manage eBook products.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={openCreateProductModal} className="gap-2">
            <Plus className="h-4 w-4" /> Add Product
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin/resources-category">Manage Categories</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin/purchase">View Purchases</Link>
          </Button>
          <Button variant="outline" onClick={reloadAll} className="gap-2">
            <RefreshCw className="h-4 w-4" /> Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-4">
          <p className="text-sm text-slate-500">Categories</p>
          <p className="text-2xl font-bold text-slate-900">
            {categories.length}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-slate-500">Products</p>
          <p className="text-2xl font-bold text-slate-900">{products.length}</p>
        </Card>
      </div>

      <Card className="p-5">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Products</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-2">Cover</th>
                <th className="text-left py-2">Title</th>
                <th className="text-left py-2">Code</th>
                <th className="text-left py-2">Category</th>
                <th className="text-left py-2">Price</th>
                <th className="text-left py-2">Original Price</th>
                <th className="text-left py-2">Upgrade Price</th>
                <th className="text-left py-2">Status</th>
                <th className="text-left py-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {(loadingProducts ? [] : products).map((product: any) => (
                <tr key={product._id} className="border-b border-slate-100">
                  <td className="py-2">
                    <div className="w-12 h-12 rounded-md overflow-hidden bg-slate-100 flex items-center justify-center">
                      {product.coverImageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={product.coverImageUrl}
                          alt={`${product.title || "Product"} cover`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-[10px] text-slate-500">
                          No image
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-2">{product.title}</td>
                  <td className="py-2">{product.code}</td>
                  <td className="py-2">
                    {typeof product.categoryId === "object"
                      ? product.categoryId?.title || "-"
                      : categoryMap[product.categoryId]?.title || "-"}
                  </td>
                  <td className="py-2">
                    ${Number(product.price || 0).toFixed(2)}
                  </td>
                  <td className="py-2">
                    ${Number(product.originalPrice || 0).toFixed(2)}
                  </td>
                  <td className="py-2">
                    ${Number(product.upgradeDiscountPrice || 0).toFixed(2)}
                  </td>
                  <td className="py-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        toggleProductMutation.mutate({
                          productId: product._id,
                          isActive: !product.isActive,
                        })
                      }
                      className="cursor-pointer"
                    >
                      {product.isActive ? "Active" : "Inactive"}
                    </Button>
                  </td>
                  <td className="py-2">
                    <div className="flex items-center gap-2">
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => openEditProductModal(product)}
                        title="Edit product"
                        className="cursor-pointer"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="destructive"
                        onClick={() => openDeleteModal(product)}
                        title="Delete product"
                        className="bg-red-400 hover:bg-red-500 cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {loadingProducts && (
                <tr>
                  <td colSpan={9} className="py-4 text-slate-500">
                    Loading products...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Dialog
        open={isProductModalOpen}
        onOpenChange={(open) => {
          if (!open) {
            closeProductModal();
            return;
          }
          setIsProductModalOpen(true);
        }}
      >
        <DialogContent className="sm:max-w-xl sm:max-h-[90vh] overflow-y-auto bg-white rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle>
              {editingProductId ? "Edit Product" : "Add Product"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>Category</Label>
              <select
                className="w-full h-10 border border-slate-200 rounded-md px-3 text-sm"
                value={productForm.categoryId}
                onChange={(e) =>
                  setProductForm((prev) => ({
                    ...prev,
                    categoryId: e.target.value,
                  }))
                }
              >
                <option value="">Select category</option>
                {categories.map((category: any) => (
                  <option key={category._id} value={category._id}>
                    {category.title}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={productForm.title}
                  onChange={(e) =>
                    setProductForm((prev) => ({
                      ...prev,
                      title: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Code</Label>
                <Input
                  value={productForm.code}
                  onChange={(e) =>
                    setProductForm((prev) => ({
                      ...prev,
                      code: e.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Short Description</Label>
              <Input
                value={productForm.shortDescription}
                onChange={(e) =>
                  setProductForm((prev) => ({
                    ...prev,
                    shortDescription: e.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Cover Image URL (optional)</Label>
              <Input
                value={productForm.coverImageUrl}
                onChange={(e) =>
                  setProductForm((prev) => ({
                    ...prev,
                    coverImageUrl: e.target.value,
                  }))
                }
                placeholder="https://res.cloudinary.com/.../cover.jpg"
              />
            </div>
            <div className="space-y-2">
              <Label>Upload Cover Image</Label>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  setCoverImageFile(file);
                }}
              />
              {coverImageFile && (
                <p className="text-xs text-slate-500">
                  Selected: {coverImageFile.name}
                </p>
              )}
              {coverImagePreviewUrl ? (
                <div className="rounded-md border border-slate-200 bg-slate-50 p-2">
                  <p className="text-xs text-slate-500 mb-2">Cover Preview</p>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={coverImagePreviewUrl}
                    alt="Cover preview"
                    className="w-full h-40 rounded-md object-cover border border-slate-200"
                  />
                </div>
              ) : (
                <p className="text-xs text-slate-500">No cover image selected</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Content URL (optional)</Label>
              <Input
                value={productForm.contentUrl}
                onChange={(e) =>
                  setProductForm((prev) => ({
                    ...prev,
                    contentUrl: e.target.value,
                  }))
                }
                placeholder="https://res.cloudinary.com/.../guide.pdf"
              />
            </div>
            <div className="space-y-2">
              <Label>Upload Content File (PDF/DOC/DOCX/etc.)</Label>
              <Input
                type="file"
                accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.zip,.csv"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  setContentFile(file);
                }}
              />
              {contentFile && (
                <p className="text-xs text-slate-500">
                  Selected: {contentFile.name}
                </p>
              )}
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label>Price</Label>
                <Input
                  type="number"
                  value={productForm.price}
                  onChange={(e) =>
                    setProductForm((prev) => ({
                      ...prev,
                      price: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Original</Label>
                <Input
                  type="number"
                  value={productForm.originalPrice}
                  onChange={(e) =>
                    setProductForm((prev) => ({
                      ...prev,
                      originalPrice: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Upgrade Discount</Label>
                <Input
                  type="number"
                  value={productForm.upgradeDiscountPrice}
                  onChange={(e) =>
                    setProductForm((prev) => ({
                      ...prev,
                      upgradeDiscountPrice: e.target.value,
                    }))
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Bundle Includes (comma-separated codes)</Label>
              <Input
                value={productForm.bundleIncludes}
                onChange={(e) =>
                  setProductForm((prev) => ({
                    ...prev,
                    bundleIncludes: e.target.value,
                  }))
                }
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={closeProductModal}>
                Cancel
              </Button>
              <Button onClick={handleSaveProduct} disabled={savingProduct}>
                {editingProductId ? "Update Product" : "Create Product"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={isDeleteModalOpen}
        onOpenChange={(open) => {
          setIsDeleteModalOpen(open);
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent className="bg-white rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-medium text-slate-800">
                {deleteTarget?.title || "this product"}
              </span>
              ? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end gap-2">
            <AlertDialogCancel className="cursor-pointer">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white cursor-pointer"
              onClick={() => {
                if (!deleteTarget?._id) return;
                deleteProductMutation.mutate(deleteTarget._id);
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
