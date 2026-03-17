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

type ProductFormState = {
  categoryId: string;
  title: string;
  shortDescription: string;
  coverImageUrl: string;
  contentUrl: string;
  price: string;
  originalPrice: string;
  currency: string;
  bundleIncludes: string[];
};

const initialProductForm: ProductFormState = {
  categoryId: "",
  title: "",
  shortDescription: "",
  coverImageUrl: "",
  contentUrl: "",
  price: "59",
  originalPrice: "59",
  currency: "USD",
  bundleIncludes: [],
};

export default function ResourcesAdminPage() {
  const [resourceView, setResourceView] = useState<"resources" | "bundles">("resources");
  const [productForm, setProductForm] = useState<ProductFormState>(initialProductForm);
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [coverImagePreviewUrl, setCoverImagePreviewUrl] = useState("");
  const [contentFile, setContentFile] = useState<File | null>(null);
  const [bundleDiscountInput, setBundleDiscountInput] = useState("0");
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [isBundleCreateMode, setIsBundleCreateMode] = useState(false);
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
  const resourceProducts = useMemo(
    () => (products || []).filter((product: any) => !product?.isBundle),
    [products],
  );
  const bundles = useMemo(
    () => (products || []).filter((product: any) => Boolean(product?.isBundle)),
    [products],
  );
  const listedProducts = resourceView === "bundles" ? bundles : resourceProducts;

  const categoryMap = useMemo(() => {
    const map: Record<string, any> = {};
    categories.forEach((item: any) => {
      map[item._id] = item;
    });
    return map;
  }, [categories]);

  const bundleSourceProducts = useMemo(() => {
    const selectedCategoryId = productForm.categoryId?.trim() || "";
    if (isBundleCreateMode && !selectedCategoryId) {
      return [];
    }

    return (products || [])
      .filter((product: any) => {
        if (!product?._id) return false;
        if (product.isBundle) return false;
        if (editingProductId && String(product._id) === editingProductId)
          return false;
        if (selectedCategoryId) {
          const productCategoryId =
            typeof product.categoryId === "object"
              ? String(product.categoryId?._id || "")
              : String(product.categoryId || "");
          if (productCategoryId !== selectedCategoryId) return false;
        }
        return true;
      })
      .sort((a: any, b: any) => {
        const aTitle = String(a?.title || "").toLowerCase();
        const bTitle = String(b?.title || "").toLowerCase();
        return aTitle.localeCompare(bTitle);
      });
  }, [products, editingProductId, productForm.categoryId, isBundleCreateMode]);

  const productByCode = useMemo(() => {
    const map: Record<string, any> = {};
    (products || []).forEach((product: any) => {
      const code = String(product?.code || "").trim().toLowerCase();
      if (!code) return;
      map[code] = product;
    });
    return map;
  }, [products]);

  const productById = useMemo(() => {
    const map: Record<string, any> = {};
    (products || []).forEach((product: any) => {
      const id = String(product?._id || "").trim();
      if (!id) return;
      map[id] = product;
    });
    return map;
  }, [products]);

  const selectedBundleProducts = useMemo(() => {
    return productForm.bundleIncludes
      .map((productId) => productById[productId])
      .filter(Boolean);
  }, [productForm.bundleIncludes, productById]);

  const bundleOriginalPrice = useMemo(() => {
    return selectedBundleProducts.reduce(
      (sum: number, product: any) => sum + toNumberOrZero(String(product?.price ?? 0)),
      0,
    );
  }, [selectedBundleProducts]);

  const bundleDiscountAmount = useMemo(() => {
    const rawDiscount = toNumberOrZero(bundleDiscountInput);
    if (rawDiscount <= 0) return 0;
    return Math.min(rawDiscount, bundleOriginalPrice);
  }, [bundleDiscountInput, bundleOriginalPrice]);

  const bundleFinalPrice = useMemo(() => {
    const finalValue = bundleOriginalPrice - bundleDiscountAmount;
    return Number((finalValue > 0 ? finalValue : 0).toFixed(2));
  }, [bundleOriginalPrice, bundleDiscountAmount]);

  useEffect(() => {
    if (coverImageFile) {
      const localPreviewUrl = URL.createObjectURL(coverImageFile);
      setCoverImagePreviewUrl(localPreviewUrl);
      return () => URL.revokeObjectURL(localPreviewUrl);
    }

    setCoverImagePreviewUrl(productForm.coverImageUrl.trim());
    return undefined;
  }, [coverImageFile, productForm.coverImageUrl]);

  useEffect(() => {
    if (!isBundleCreateMode) return;
    const rawDiscount = toNumberOrZero(bundleDiscountInput);
    if (rawDiscount <= bundleOriginalPrice) return;
    setBundleDiscountInput(String(bundleOriginalPrice));
  }, [bundleDiscountInput, bundleOriginalPrice, isBundleCreateMode]);

  const reloadAll = async () => {
    await Promise.all([refetchCategories(), refetchProducts()]);
  };

  const closeProductModal = () => {
    setIsProductModalOpen(false);
    setEditingProductId(null);
    setIsBundleCreateMode(false);
    setBundleDiscountInput("0");
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
    setIsBundleCreateMode(false);
    setBundleDiscountInput("0");
    setProductForm(initialProductForm);
    setCoverImageFile(null);
    setContentFile(null);
    setIsProductModalOpen(true);
  };

  const openCreateBundleModal = () => {
    setEditingProductId(null);
    setIsBundleCreateMode(true);
    setBundleDiscountInput("0");
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
    setIsBundleCreateMode(Boolean(product.isBundle));
    const originalPrice = Number(product.originalPrice ?? product.price ?? 0);
    const listedPrice = Number(product.price ?? 0);
    const inferredDiscount = Math.max(originalPrice - listedPrice, 0);
    setBundleDiscountInput(String(inferredDiscount));
    const resolvedBundleProductIds = Array.isArray(product.bundleIncludes)
      ? product.bundleIncludes
          .map((item: string) => {
            const raw = item?.toString().trim() || "";
            if (!raw) return "";
            if (productById[raw]) return raw;
            const normalized = raw.toLowerCase();
            const matchedByCode = productByCode[normalized];
            return matchedByCode?._id?.toString() || "";
          })
          .filter(Boolean)
      : [];

    setProductForm({
      categoryId: resolvedCategoryId,
      title: product.title || "",
      shortDescription: product.shortDescription || "",
      coverImageUrl: product.coverImageUrl || "",
      contentUrl: product.contentUrl || "",
      price: String(product.price ?? ""),
      originalPrice: String(product.originalPrice ?? product.price ?? ""),
      currency: product.currency || "USD",
      bundleIncludes: resolvedBundleProductIds,
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
    if (!productForm.categoryId || !productForm.title.trim()) {
      toast.error("categoryId and title are required");
      return;
    }

    const bundleIncludes = Array.from(
      new Set(
        productForm.bundleIncludes
          .map((item) => item.toString().trim())
          .filter(Boolean),
      ),
    );
    const shouldCreateAsBundle = isBundleCreateMode || bundleIncludes.length > 0;

    if (shouldCreateAsBundle && bundleIncludes.length < 2) {
      toast.error("Bundle must include at least two ebooks");
      return;
    }

    const payload = new FormData();
    payload.append("categoryId", productForm.categoryId);
    payload.append("title", productForm.title.trim());
    payload.append("shortDescription", productForm.shortDescription.trim());
    payload.append("coverImageUrl", productForm.coverImageUrl.trim());
    payload.append("contentUrl", shouldCreateAsBundle ? "" : productForm.contentUrl.trim());
    const resolvedPrice = shouldCreateAsBundle
      ? bundleFinalPrice
      : toNumberOrZero(productForm.price);
    const resolvedOriginalPrice = shouldCreateAsBundle
      ? bundleOriginalPrice
      : toNumberOrZero(productForm.originalPrice);

    payload.append("price", String(resolvedPrice));
    payload.append(
      "originalPrice",
      String(resolvedOriginalPrice),
    );
    payload.append("upgradeDiscountPrice", "");
    payload.append(
      "currency",
      productForm.currency.trim().toUpperCase() || "USD",
    );
    payload.append("isBundle", String(shouldCreateAsBundle));
    payload.append("bundleIncludes", JSON.stringify(bundleIncludes));

    if (coverImageFile) {
      payload.append("coverImage", coverImageFile);
    }
    if (!shouldCreateAsBundle && contentFile) {
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

  const toggleBundleInclude = (productId: string, checked: boolean) => {
    const normalizedId = productId.trim();
    if (!normalizedId) return;

    setProductForm((prev) => {
      const current = new Set(
        prev.bundleIncludes
          .map((item) => item.trim())
          .filter(Boolean),
      );
      if (checked) {
        current.add(normalizedId);
      } else {
        current.delete(normalizedId);
      }
      return {
        ...prev,
        bundleIncludes: [...current],
      };
    });
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
          <Button onClick={openCreateProductModal} className="gap-2 cursor-pointer">
            <Plus className="h-4 w-4" /> Add Resources
          </Button>
          <Button onClick={openCreateBundleModal} variant="outline" className="gap-2 cursor-pointer">
            <Plus className="h-4 w-4" /> Create Bundle
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <p className="text-sm text-slate-500">Categories</p>
          <p className="text-2xl font-bold text-slate-900">
            {categories.length}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-slate-500">Products</p>
          <p className="text-2xl font-bold text-slate-900">{resourceProducts.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-slate-500">Bundles</p>
          <p className="text-2xl font-bold text-slate-900">{bundles.length}</p>
        </Card>
      </div>

      <Card className="p-5">
        <div className="mb-4 flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setResourceView("resources")}
            className={`text-sm font-semibold transition-colors cursor-pointer ${
              resourceView === "resources"
                ? "bg-slate-900 text-white border-slate-900 hover:bg-slate-800 hover:text-white"
                : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100"
            }`}
          >
            resources
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => setResourceView("bundles")}
            className={`text-sm font-semibold transition-colors cursor-pointer ${
              resourceView === "bundles"
                ? "bg-slate-900 text-white border-slate-900 hover:bg-slate-800 hover:text-white"
                : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100"
            }`}
          >
            Bundle resources
          </Button>
        </div>
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
                <th className="text-left py-2">Status</th>
                <th className="text-left py-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {(loadingProducts ? [] : listedProducts).map((product: any) => (
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
              {!loadingProducts && listedProducts.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-4 text-slate-500">
                    {resourceView === "bundles"
                      ? "No bundle resources found."
                      : "No resources found."}
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
              {editingProductId
                ? isBundleCreateMode
                  ? "Edit Bundle"
                  : "Edit Product"
                : isBundleCreateMode
                  ? "Create Bundle"
                  : "Add Product"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {isBundleCreateMode && (
              <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                Bundle mode: select one category, choose multiple ebooks, and set bundle pricing.
              </div>
            )}
            <div className="space-y-2">
              <Label>Category</Label>
              <select
                className="w-full h-10 border border-slate-200 rounded-md px-3 text-sm"
                value={productForm.categoryId}
                onChange={(e) => {
                  const nextCategoryId = e.target.value;
                  setProductForm((prev) => ({
                    ...prev,
                    categoryId: nextCategoryId,
                    bundleIncludes: isBundleCreateMode ? [] : prev.bundleIncludes,
                  }));
                }}
              >
                <option value="">Select category</option>
                {categories.map((category: any) => (
                  <option key={category._id} value={category._id}>
                    {category.title}
                  </option>
                ))}
              </select>
            </div>
            {isBundleCreateMode && (
              <div className="space-y-2">
                <Label>Products In Selected Category</Label>
                <div className="max-h-48 overflow-y-auto rounded-md border border-slate-200 p-2 space-y-2">
                  {bundleSourceProducts.map((bundleProduct: any) => {
                    const productId = String(bundleProduct?._id || "").trim();
                    const code = String(bundleProduct?.code || "").trim().toLowerCase();
                    const checked = productForm.bundleIncludes.includes(productId);
                    const isActive = Boolean(bundleProduct?.isActive);

                    return (
                      <label
                        key={bundleProduct._id}
                        className="flex items-center justify-between gap-3 rounded-md px-2 py-1.5 hover:bg-slate-50 cursor-pointer"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) =>
                              toggleBundleInclude(productId, e.target.checked)
                            }
                            className="h-4 w-4 rounded border-slate-300"
                          />
                          <div className="min-w-0">
                            <p className="text-sm text-slate-800 truncate">
                              {bundleProduct.title}
                            </p>
                            <p className="text-[11px] text-slate-500 truncate">
                              {code}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-semibold text-slate-700">
                            ${Number(bundleProduct?.price || 0).toFixed(2)}
                          </p>
                          <span
                            className={`text-[11px] ${isActive ? "text-emerald-600" : "text-amber-600"}`}
                          >
                            {isActive ? "Active" : "Inactive"}
                          </span>
                        </div>
                      </label>
                    );
                  })}
                  {!bundleSourceProducts.length && (
                    <p className="text-xs text-slate-500">
                      {!productForm.categoryId
                        ? "Select a category first, then products will appear here."
                        : "No eligible non-bundle ebooks found for this category."}
                    </p>
                  )}
                </div>
                <p className="text-xs text-slate-500">
                  Selected products: {productForm.bundleIncludes.length}
                </p>
              </div>
            )}
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
            {!isBundleCreateMode && (
              <>
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
              </>
            )}
            {isBundleCreateMode ? (
              <div className="space-y-3 rounded-md border border-slate-200 bg-slate-50 p-3">
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <Label>Products Total</Label>
                    <Input value={bundleOriginalPrice.toFixed(2)} readOnly />
                  </div>
                  <div className="space-y-2">
                    <Label>Bundle Discount</Label>
                    <Input
                      type="number"
                      min={0}
                      value={bundleDiscountInput}
                      onChange={(e) => setBundleDiscountInput(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Final Bundle Price</Label>
                    <Input value={bundleFinalPrice.toFixed(2)} readOnly />
                  </div>
                </div>
                <p className="text-xs text-slate-500">
                  Final price = total of selected products - discount.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
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
              </div>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={closeProductModal}>
                Cancel
              </Button>
              <Button onClick={handleSaveProduct} disabled={savingProduct}>
                {editingProductId
                  ? isBundleCreateMode
                    ? "Update Bundle"
                    : "Update Product"
                  : isBundleCreateMode
                    ? "Create Bundle"
                    : "Create Product"}
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
