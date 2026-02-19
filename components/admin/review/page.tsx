"use client";

import { useEffect, useState } from "react";
import { useQuery } from "react-query";
import { reviewAPI } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { toast } from "sonner";
import {
  Star,
  Trash2,
  User,
  ChevronLeft,
  ChevronRight,
  Plus,
  Upload,
  Send,
  Edit,
} from "lucide-react";

type ReviewItem = {
  reviewId?: string;
  _id?: string;
  examId?: string;
  examName?: string;
  userId?: string;
  userName?: string;
  userEmail?: string;
  stars?: number;
  feedbackText?: string;
  displayName?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
};

const normalizeStatus = (value?: string) =>
  value === "published" ? "published" : "pending";

const getReviewId = (review: ReviewItem) => review.reviewId || review._id || "";

const defaultCreateForm = {
  displayName: "",
  feedbackText: "",
  stars: 4,
  image: null as File | null,
};

export default function ReviewPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedReview, setSelectedReview] = useState<ReviewItem | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isPostDialogOpen, setIsPostDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [createForm, setCreateForm] = useState(defaultCreateForm);
  const [editForm, setEditForm] = useState({
    displayName: "",
    feedbackText: "",
    stars: 4,
  });

  // Page size 9 works best for a 3-column grid (3 rows of 3)
  const pageSize = 9;

  const { data: reviewsData, isLoading, refetch } = useQuery(
    ["admin-reviews", currentPage, pageSize],
    () => reviewAPI.listAdminReviews(currentPage, pageSize),
    { onError: () => toast.error("Failed to load reviews") }
  );

  const reviewsPayload = reviewsData?.data?.data;
  const reviews: ReviewItem[] = reviewsPayload?.reviews || [];
  const totalCount = reviewsPayload?.meta?.total || 0;
  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  useEffect(() => {
    if (!selectedReview) return;
    const selectedId = getReviewId(selectedReview);
    const stillExists = reviews.some((r) => getReviewId(r) === selectedId);
    if (!stillExists) {
      setSelectedReview(null);
    }
  }, [reviews, selectedReview]);

  const handlePostReview = async () => {
    if (!selectedReview) return;
    const id = getReviewId(selectedReview);
    if (!id) return;

    if (normalizeStatus(selectedReview.status) === "published") {
      toast.info("Testimonial is already posted");
      setIsPostDialogOpen(false);
      return;
    }

    setIsPosting(true);
    try {
      await reviewAPI.updateReview(id, { status: "published" });
      toast.success("Testimonial posted");
      setIsPostDialogOpen(false);
      refetch();
    } catch {
      toast.error("Failed to post testimonial");
    } finally {
      setIsPosting(false);
    }
  };

  const handleDeleteReview = async () => {
    if (!selectedReview) return;
    const id = getReviewId(selectedReview);
    if (!id) return;

    setIsDeleting(true);
    try {
      await reviewAPI.deleteReview(id);
      toast.success("Testimonial deleted");
      setIsDeleteDialogOpen(false);
      setSelectedReview(null);
      refetch();
    } catch {
      toast.error("Delete failed");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCreateTestimonial = async () => {
    if (!createForm.displayName.trim() || !createForm.feedbackText.trim()) {
      toast.error("Please fill in name and testimonial");
      return;
    }

    setIsCreating(true);
    try {
      toast.success("Testimonial created");
      setIsCreateDialogOpen(false);
      setCreateForm(defaultCreateForm);
    } finally {
      setIsCreating(false);
    }
  };

  const handleOpenEdit = () => {
    if (!selectedReview) return;
    setEditForm({
      displayName: selectedReview.displayName || selectedReview.userName || "",
      feedbackText: selectedReview.feedbackText || "",
      stars: selectedReview.stars || 4,
    });
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedReview) return;
    const id = getReviewId(selectedReview);
    if (!id) return;

    if (!editForm.displayName.trim() || !editForm.feedbackText.trim()) {
      toast.error("Please fill in name and testimonial");
      return;
    }

    setIsSaving(true);
    try {
      await reviewAPI.updateReview(id, {
        displayName: editForm.displayName,
        feedbackText: editForm.feedbackText,
        stars: editForm.stars,
      });
      toast.success("Testimonial updated");
      setIsEditDialogOpen(false);
      refetch();
    } catch {
      toast.error("Update failed");
    } finally {
      setIsSaving(false);
    }
  };

  const selectedId = selectedReview ? getReviewId(selectedReview) : "";
  const hasSelection = Boolean(selectedId);

  return (
    <div className=" space-y-6">
      {/* Header Section */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Receiving Testimonials
          </h1>
          <p className="text-sm text-slate-500">
            Manage User Receiving Testimonials
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {hasSelection && (
            <>
              <Button
                className="h-10 rounded-full bg-red-500 px-6 text-white hover:bg-red-600"
                onClick={() => setIsDeleteDialogOpen(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
              <Button
                className="h-10 rounded-full bg-green-600 px-6 text-white hover:bg-green-700"
                onClick={() => setIsPostDialogOpen(true)}
              >
                <Send className="mr-2 h-4 w-4" />
                Post
              </Button>
              <Button
                className="h-10 rounded-full bg-green-600 px-6 text-white hover:bg-green-700"
                onClick={handleOpenEdit}
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
            </>
          )}
          <Button
            className="h-10 rounded-full bg-[#1E3A8A] px-6 text-white hover:bg-[#1E40AF]"
            onClick={() => setIsCreateDialogOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Create
          </Button>
        </div>
      </div>

      {/* 3-Column Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Card
              key={i}
              className="rounded-2xl border border-slate-100 bg-white p-6"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
                <div className="flex gap-1">
                  {Array.from({ length: 5 }).map((__, starIdx) => (
                    <Skeleton key={starIdx} className="h-3 w-3 rounded-full" />
                  ))}
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-5/6" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            </Card>
          ))
        ) : reviews.length === 0 ? (
          <div className="col-span-full rounded-2xl border border-dashed border-slate-200 bg-white py-20 text-center text-slate-400">
            No testimonials found.
          </div>
        ) : (
          reviews.map((review, index) => {
            const id = getReviewId(review);
            const cardKey = id || `review-${index}`;
            const isSelected = id && id === selectedId;
            const name = review.displayName || review.userName || "Guest";
            const subline = review.userEmail || review.examName || "Unknown";
            const rating = review.stars || 0;

            return (
              <Card
                key={cardKey}
                className={`rounded-2xl border bg-white shadow-sm transition-all duration-200 hover:shadow-md ${
                  isSelected
                    ? "border-green-500 bg-[#E7F7EC] ring-1 ring-green-200"
                    : "border-slate-200"
                }`}
              >
                <button
                  type="button"
                  onClick={() => setSelectedReview(review)}
                  className="w-full text-left"
                  aria-pressed={isSelected}
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                          <User className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-slate-800">
                            {name}
                          </h3>
                          <p className="text-xs text-slate-500">{subline}</p>
                        </div>
                      </div>
                      <div className="flex gap-0.5">
                        {Array.from({ length: 5 }).map((_, starIdx) => (
                          <Star
                            key={starIdx}
                            className={`h-3.5 w-3.5 ${
                              starIdx < rating
                                ? "fill-amber-400 text-amber-400"
                                : "text-slate-200"
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    <p className="mt-4 min-h-[80px] text-sm italic leading-relaxed text-slate-600 line-clamp-4">
                      "{review.feedbackText || "No feedback text provided."}"
                    </p>
                  </div>
                </button>
              </Card>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {!isLoading && totalCount > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-white px-5 py-4 shadow-sm">
          <p className="text-sm text-slate-500">
            Showing{" "}
            <span className="font-semibold text-slate-900">
              {(currentPage - 1) * pageSize + 1}
            </span>{" "}
            to{" "}
            <span className="font-semibold text-slate-900">
              {Math.min(currentPage * pageSize, totalCount)}
            </span>{" "}
            of {totalCount} testimonials
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 rounded-lg border-slate-200"
              disabled={currentPage === 1}
              onClick={() => {
                setCurrentPage((p) => p - 1);
                setSelectedReview(null);
              }}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {Array.from({ length: totalPages }).map((_, i) => {
              const pageNum = i + 1;
              if (
                pageNum === 1 ||
                pageNum === totalPages ||
                (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
              ) {
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    className={`h-9 w-9 rounded-lg ${
                      currentPage === pageNum ? "bg-[#1E3A8A] text-white" : ""
                    }`}
                    onClick={() => {
                      setCurrentPage(pageNum);
                      setSelectedReview(null);
                    }}
                  >
                    {pageNum}
                  </Button>
                );
              }
              return null;
            })}
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 rounded-lg border-slate-200"
              disabled={currentPage === totalPages}
              onClick={() => {
                setCurrentPage((p) => p + 1);
                setSelectedReview(null);
              }}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Post Confirmation */}
      <AlertDialog open={isPostDialogOpen} onOpenChange={setIsPostDialogOpen}>
        <AlertDialogContent className="max-w-md rounded-2xl border-none bg-white p-6">
          <AlertDialogHeader className="text-center">
            <AlertDialogTitle className="text-xl font-semibold text-slate-900">
              Are you sure?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-slate-500">
              Are you sure you want to Share this on your Landing page?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="mt-6 flex items-center justify-center gap-3">
            <AlertDialogCancel className="rounded-full border border-slate-200 px-6">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handlePostReview}
              className="rounded-full bg-blue-600 px-6 text-white hover:bg-blue-700"
              disabled={isPosting}
            >
              {isPosting ? "Sharing..." : "Share"}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent className="max-w-md rounded-2xl border-none bg-white p-6">
          <AlertDialogHeader className="text-center">
            <AlertDialogTitle className="text-xl font-semibold text-slate-900">
              Are you sure?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-slate-500">
              Are you sure you want to Delete the Testimonial.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="mt-6 flex items-center justify-center gap-3">
            <AlertDialogCancel className="rounded-full border border-slate-200 px-6">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteReview}
              className="rounded-full bg-red-500 px-6 text-white hover:bg-red-600"
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create Testimonial */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-md rounded-2xl bg-white p-6">
          <DialogHeader>
            <DialogTitle className="text-center text-lg font-semibold text-slate-900">
              Create New Testimonial
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <label className="text-xs font-semibold text-slate-500">
                Rate 1 to 5 stars
              </label>
              <div className="mt-2 flex items-center gap-2">
                {Array.from({ length: 5 }).map((_, idx) => {
                  const rating = idx + 1;
                  return (
                    <button
                      key={rating}
                      type="button"
                      onClick={() =>
                        setCreateForm((p) => ({ ...p, stars: rating }))
                      }
                      className="leading-none"
                    >
                      <Star
                        className={`h-5 w-5 ${
                          rating <= createForm.stars
                            ? "fill-amber-400 text-amber-400"
                            : "text-slate-300"
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500">
                Your Name
              </label>
              <Input
                value={createForm.displayName}
                onChange={(e) =>
                  setCreateForm((p) => ({
                    ...p,
                    displayName: e.target.value,
                  }))
                }
                placeholder="Butlar Mane"
                className="mt-2 rounded-xl border-slate-200"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500">
                Your Testimonial
              </label>
              <Textarea
                value={createForm.feedbackText}
                onChange={(e) =>
                  setCreateForm((p) => ({
                    ...p,
                    feedbackText: e.target.value,
                  }))
                }
                placeholder="e.g. This platform was a game-changer for my exam preparation."
                className="mt-2 min-h-[110px] rounded-xl border-slate-200"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500">
                Upload an image as logo
              </label>
              <div className="mt-3 flex items-center gap-3">
                <label
                  htmlFor="testimonial-logo"
                  className="flex h-12 w-12 cursor-pointer items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100"
                >
                  <Upload className="h-4 w-4" />
                </label>
                <input
                  id="testimonial-logo"
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(e) =>
                    setCreateForm((p) => ({
                      ...p,
                      image: e.target.files?.[0] || null,
                    }))
                  }
                />
                <span className="text-xs text-slate-400">
                  {createForm.image ? createForm.image.name : "No file selected"}
                </span>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                className="flex-1 rounded-full border-slate-200"
                onClick={() => setIsCreateDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 rounded-full bg-[#1E3A8A] text-white hover:bg-[#1E40AF]"
                onClick={handleCreateTestimonial}
                disabled={isCreating}
              >
                {isCreating ? "Creating..." : "Create"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Testimonial */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md rounded-2xl bg-white p-6">
          <DialogHeader>
            <DialogTitle className="text-center text-lg font-semibold text-slate-900">
              Update Testimonial
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <label className="text-xs font-semibold text-slate-500">
                Rate 1 to 5 stars
              </label>
              <div className="mt-2 flex items-center gap-2">
                {Array.from({ length: 5 }).map((_, idx) => {
                  const rating = idx + 1;
                  return (
                    <button
                      key={rating}
                      type="button"
                      onClick={() =>
                        setEditForm((p) => ({ ...p, stars: rating }))
                      }
                      className="leading-none"
                    >
                      <Star
                        className={`h-5 w-5 ${
                          rating <= editForm.stars
                            ? "fill-amber-400 text-amber-400"
                            : "text-slate-300"
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500">
                Your Name
              </label>
              <Input
                value={editForm.displayName}
                onChange={(e) =>
                  setEditForm((p) => ({
                    ...p,
                    displayName: e.target.value,
                  }))
                }
                placeholder="Butlar Mane"
                className="mt-2 rounded-xl border-slate-200"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500">
                Your Testimonial
              </label>
              <Textarea
                value={editForm.feedbackText}
                onChange={(e) =>
                  setEditForm((p) => ({
                    ...p,
                    feedbackText: e.target.value,
                  }))
                }
                placeholder="e.g. This platform was a game-changer for my exam preparation."
                className="mt-2 min-h-[110px] rounded-xl border-slate-200"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                className="flex-1 rounded-full border-slate-200"
                onClick={() => setIsEditDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 rounded-full bg-[#1E3A8A] text-white hover:bg-[#1E40AF]"
                onClick={handleSaveEdit}
                disabled={isSaving}
              >
                {isSaving ? "Updating..." : "Update"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
