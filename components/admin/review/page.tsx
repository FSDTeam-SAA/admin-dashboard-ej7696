"use client";

import { useMemo, useState } from "react";
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
  Search,
  Star,
  Trash2,
  Pencil,
  CheckCircle,
  XCircle,
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

const formatDate = (value?: string) => {
  if (!value) return "N/A";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "N/A" : parsed.toLocaleDateString();
};

export default function ReviewPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedReview, setSelectedReview] = useState<ReviewItem | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [pendingActionId, setPendingActionId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    status: "pending",
    stars: 5,
    feedbackText: "",
    displayName: "",
  });

  const pageSize = 10;
  const normalizedStatus =
    statusFilter === "all" ? undefined : statusFilter.toLowerCase();

  const {
    data: reviewsData,
    isLoading,
    refetch,
  } = useQuery(
    ["admin-reviews", currentPage, normalizedStatus],
    () =>
      reviewAPI.listAdminReviews(currentPage, pageSize, {
        status: normalizedStatus,
      }),
    {
      onError: (error: any) => {
        toast.error("Failed to load reviews");
        console.error("[v0] Reviews error:", error);
      },
    },
  );

  const reviewsPayload = reviewsData?.data?.data;
  const reviews: ReviewItem[] = reviewsPayload?.reviews || [];

  const filteredReviews = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return reviews;
    return reviews.filter((review) => {
      const userName =
        review.displayName || review.userName || review.userEmail || "";
      const examName = review.examName || "";
      const feedbackText = review.feedbackText || "";
      return (
        userName.toLowerCase().includes(term) ||
        examName.toLowerCase().includes(term) ||
        feedbackText.toLowerCase().includes(term) ||
        (review.userEmail || "").toLowerCase().includes(term)
      );
    });
  }, [reviews, searchTerm]);

  const totalCount = reviewsPayload?.meta?.total || 0;
  const totalPages = Math.ceil(totalCount / pageSize) || 1;
  const resultStart = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const resultEnd = Math.min(currentPage * pageSize, totalCount);

  const openEditDialog = (review: ReviewItem) => {
    setSelectedReview(review);
    setEditForm({
      status: normalizeStatus(review.status),
      stars: review.stars || 5,
      feedbackText: review.feedbackText || "",
      displayName: review.displayName || review.userName || "",
    });
    setIsEditDialogOpen(true);
  };

  const handleToggleStatus = async (review: ReviewItem) => {
    const reviewId = review.reviewId || review._id;
    if (!reviewId) return;
    const nextStatus =
      normalizeStatus(review.status) === "published" ? "pending" : "published";

    setPendingActionId(reviewId);
    try {
      await reviewAPI.updateReview(reviewId, { status: nextStatus });
      toast.success(
        `Review ${nextStatus === "published" ? "published" : "unpublished"}`,
      );
      refetch();
    } catch (error: any) {
      console.error("[v0] Update review status error:", error);
      toast.error("Failed to update review status");
    } finally {
      setPendingActionId(null);
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedReview) return;
    const reviewId = selectedReview.reviewId || selectedReview._id;
    if (!reviewId) return;

    setIsSaving(true);
    try {
      await reviewAPI.updateReview(reviewId, {
        status: editForm.status,
        stars: editForm.stars,
        feedbackText: editForm.feedbackText,
        displayName: editForm.displayName,
      });
      toast.success("Review updated");
      setIsEditDialogOpen(false);
      setSelectedReview(null);
      refetch();
    } catch (error: any) {
      console.error("[v0] Update review error:", error);
      toast.error(error.response?.data?.message || "Failed to update review");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteReview = async () => {
    if (!selectedReview) return;
    const reviewId = selectedReview.reviewId || selectedReview._id;
    if (!reviewId) return;

    setIsDeleting(true);
    try {
      await reviewAPI.deleteReview(reviewId);
      toast.success("Review deleted");
      setIsDeleteDialogOpen(false);
      setSelectedReview(null);
      refetch();
    } catch (error: any) {
      console.error("[v0] Delete review error:", error);
      toast.error("Failed to delete review");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Review Management
            </h1>
            <p className="text-gray-500 mt-1 text-sm">Dashboard &gt; Review</p>
          </div>
        </div>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Search by user, exam, or text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 rounded-xl"
            />
          </div>

          <div className="flex items-center gap-3">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="published">Published</option>
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
                  Exam
                </th>
                <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm">
                  Rating
                </th>
                <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm">
                  Feedback
                </th>
                <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm">
                  Status
                </th>
                <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm">
                  Updated
                </th>
                <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="border-b border-gray-100">
                    <td className="py-4 px-6">
                      <Skeleton className="h-4 w-28" />
                    </td>
                    <td className="py-4 px-6">
                      <Skeleton className="h-4 w-24" />
                    </td>
                    <td className="py-4 px-6">
                      <Skeleton className="h-4 w-16" />
                    </td>
                    <td className="py-4 px-6">
                      <Skeleton className="h-4 w-48" />
                    </td>
                    <td className="py-4 px-6">
                      <Skeleton className="h-6 w-20" />
                    </td>
                    <td className="py-4 px-6">
                      <Skeleton className="h-4 w-20" />
                    </td>
                    <td className="py-4 px-6">
                      <Skeleton className="h-8 w-24" />
                    </td>
                  </tr>
                ))
              ) : filteredReviews.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-600">
                    No reviews found
                  </td>
                </tr>
              ) : (
                filteredReviews.map((review) => {
                  const reviewId = review.reviewId || review._id || "";
                  const status = normalizeStatus(review.status);
                  const rating = review.stars || 0;
                  const displayName =
                    review.userName ||
                    review.displayName ||
                    review.userEmail ||
                    "Unknown";
                  return (
                    <tr
                      key={reviewId}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="py-4 px-6">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-gray-900">
                            {displayName}
                          </span>
                          <span className="text-xs text-gray-500">
                            {review.userEmail || "—"}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-600">
                        {review.examName || "Exam"}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${
                                i < rating
                                  ? "fill-yellow-400 text-yellow-400"
                                  : "text-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-600 max-w-[260px]">
                        <span
                          className="block truncate"
                          title={review.feedbackText || ""}
                        >
                          {review.feedbackText || "—"}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            status === "published"
                              ? "bg-green-100 text-green-700"
                              : "bg-orange-100 text-orange-700"
                          }`}
                        >
                          {status === "published" ? "Published" : "Pending"}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-600">
                        {formatDate(review.updatedAt || review.createdAt)}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className={`gap-1 ${
                              status === "published"
                                ? "border-orange-200 text-orange-700 hover:bg-orange-50"
                                : "border-green-200 text-green-700 hover:bg-green-50"
                            }`}
                            onClick={() => handleToggleStatus(review)}
                            disabled={pendingActionId === reviewId}
                          >
                            {status === "published" ? (
                              <>
                                <XCircle className="w-4 h-4" /> Unpublish
                              </>
                            ) : (
                              <>
                                <CheckCircle className="w-4 h-4" /> Publish
                              </>
                            )}
                          </Button>
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-8 w-8 rounded-full border-blue-200 text-blue-700 hover:bg-blue-50"
                            onClick={() => openEditDialog(review)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-8 w-8 rounded-full border-red-200 text-red-700 hover:bg-red-50"
                            onClick={() => {
                              setSelectedReview(review);
                              setIsDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {!isLoading && reviewsPayload && (
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Showing {resultStart} to {resultEnd} of {totalCount} results
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
              {Array.from({ length: Math.min(3, totalPages) }).map((_, i) => (
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
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
              >
                {">"}
              </Button>
            </div>
          </div>
        </Card>
      )}

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-lg bg-white">
          <DialogHeader>
            <DialogTitle>Edit Review</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-slate-700 mb-2">Status</p>
              <select
                value={editForm.status}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, status: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
              >
                <option value="pending">Pending</option>
                <option value="published">Published</option>
              </select>
            </div>

            <div>
              <p className="text-sm font-medium text-slate-700 mb-2">Rating</p>
              <div className="flex gap-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() =>
                      setEditForm((prev) => ({ ...prev, stars: i + 1 }))
                    }
                    className="p-1"
                  >
                    <Star
                      className={`w-6 h-6 ${
                        i < editForm.stars
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-slate-300"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-slate-700 mb-2">
                Display Name
              </p>
              <Input
                value={editForm.displayName}
                onChange={(e) =>
                  setEditForm((prev) => ({
                    ...prev,
                    displayName: e.target.value,
                  }))
                }
                placeholder="Reviewer name"
              />
            </div>

            <div>
              <p className="text-sm font-medium text-slate-700 mb-2">
                Feedback
              </p>
              <Textarea
                value={editForm.feedbackText}
                onChange={(e) =>
                  setEditForm((prev) => ({
                    ...prev,
                    feedbackText: e.target.value,
                  }))
                }
                placeholder="Feedback text"
                rows={4}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                className="ml-auto bg-blue-700 hover:bg-blue-800 text-white"
                onClick={handleSaveEdit}
                disabled={isSaving}
              >
                {isSaving ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This review will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel className="rounded-lg">No</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteReview}
              className="bg-red-600 hover:bg-red-700 text-white rounded-lg"
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Yes, Delete"}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
