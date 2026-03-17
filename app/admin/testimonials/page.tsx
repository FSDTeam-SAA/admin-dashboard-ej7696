'use client';

import { useState } from 'react';
import { useQuery } from 'react-query';
import { testimonialAPI } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Trash2, Star, Upload } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function TestimonialsPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTestimonialId, setSelectedTestimonialId] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [rating, setRating] = useState(4);
  const [formData, setFormData] = useState({
    name: '',
    testimonial: '',
    image: null as File | null,
  });
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: testimonialsData, isLoading, refetch } = useQuery(
    ['testimonials', currentPage],
    () => testimonialAPI.listTestimonials(currentPage, 10),
    {
      onError: (error: any) => {
        toast.error('Failed to load testimonials');
        console.error('[v0] Testimonials error:', error);
      },
    }
  );

  const testimonialsPayload = testimonialsData?.data?.data;
  const testimonials = testimonialsPayload?.testimonials || [];

  const handleCreateTestimonial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.testimonial || !rating) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const form = new FormData();
      form.append('name', formData.name);
      form.append('testimonial', formData.testimonial);
      form.append('rating', rating.toString());
      if (formData.image) {
        form.append('image', formData.image);
      }

      await testimonialAPI.createTestimonial(form);
      toast.success('Testimonial created successfully');
      setFormData({ name: '', testimonial: '', image: null });
      setPreviewUrl(null);
      setIsCreateModalOpen(false);
      refetch();
    } catch (error: any) {
      console.error('[v0] Create testimonial error:', error);
      toast.error(error.response?.data?.message || 'Failed to create testimonial');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTestimonial = async () => {
    if (!selectedTestimonialId) return;

    try {
      await testimonialAPI.deleteTestimonial(selectedTestimonialId);
      toast.success('Testimonial deleted successfully');
      setIsDeleteDialogOpen(false);
      setSelectedTestimonialId(null);
      refetch();
    } catch (error: any) {
      console.error('[v0] Delete testimonial error:', error);
      toast.error('Failed to delete testimonial');
    }
  };

  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Receiving Testimonials</h1>
          <p className="text-muted-foreground">Manage User Receiving Testimonials</p>
        </div>
        {selectedTestimonialId ? (
          <div className="flex gap-3">
            <Button 
              variant="destructive" 
              className="gap-2 rounded-full px-6 bg-red-500 hover:bg-red-600"
              onClick={() => setIsDeleteDialogOpen(true)}
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
            <Button 
              variant="outline"
              className="gap-2 h-10 border-[#1E3A8A] text-[#1E3A8A] hover:bg-[#1E3A8A]/10"
              onClick={() => toast.success('Testimonial posted')}
            >
              Post
            </Button>
          </div>
        ) : (
          <Button 
            className="gap-2 rounded-full px-6 bg-blue-700 hover:bg-blue-800 text-white"
            onClick={() => setIsCreateModalOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Create
          </Button>
        )}
      </div>

      {/* Testimonials Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="p-6">
              <Skeleton className="h-4 w-24 mb-4" />
              <Skeleton className="h-16 w-full mb-4" />
              <Skeleton className="h-4 w-32" />
            </Card>
          ))
        ) : testimonials.length === 0 ? (
          <Card className="p-12 col-span-3 text-center">
            <p className="text-gray-600">No testimonials found</p>
          </Card>
        ) : (
          testimonials.map((testimonial: any) => {
            const isSelected = selectedTestimonialId === testimonial._id;
            return (
              <Card
                key={testimonial._id}
                className={`p-6 hover:shadow-md transition-shadow cursor-pointer ${
                  isSelected ? 'bg-green-500 text-white' : ''
                }`}
                onClick={() => setSelectedTestimonialId(testimonial._id)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-200">
                      {testimonial.image?.url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={testimonial.image.url}
                          alt={testimonial.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-sm font-semibold text-slate-600">
                          {(testimonial.name || '?').charAt(0)}
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className={`font-semibold ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                        {testimonial.name}
                      </h3>
                      <p className={`text-xs ${isSelected ? 'text-white/80' : 'text-slate-500'}`}>
                        {testimonial.location || 'Portland, OR'}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < (testimonial.rating || 0)
                            ? 'fill-yellow-400 text-yellow-400'
                            : isSelected
                              ? 'text-white/40'
                              : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <p className={`mt-4 text-sm ${isSelected ? 'text-white/90' : 'text-slate-600'} italic`}>
                  {testimonial.testimonial}
                </p>
              </Card>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {!isLoading && testimonialsPayload && (
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Showing {(currentPage - 1) * 10 + 1} to {Math.min(currentPage * 10, testimonialsPayload?.meta?.total || 0)} of{' '}
              {testimonialsPayload?.meta?.total || 0} results
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              >
                ←
              </Button>
              {Array.from({ length: Math.min(3, Math.ceil((testimonialsPayload?.meta?.total || 0) / 10)) }).map(
                (_, i) => (
                  <Button
                    key={i + 1}
                    variant={currentPage === i + 1 ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCurrentPage(i + 1)}
                    className={currentPage === i + 1 ? 'bg-blue-600 text-white' : ''}
                  >
                    {i + 1}
                  </Button>
                )
              )}
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage >= Math.ceil((testimonialsPayload?.meta?.total || 0) / 10)}
                onClick={() => setCurrentPage(currentPage + 1)}
              >
                →
              </Button>
            </div>
          </div>
        </Card>
      )}

      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-lg bg-white">
          <DialogHeader>
            <DialogTitle>Create New Testimonial</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateTestimonial} className="space-y-4">
            <div>
              <p className="text-sm text-slate-600 mb-2">Rate 1 to 5 stars</p>
              <div className="flex gap-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setRating(i + 1)}
                    className="p-1"
                  >
                    <Star
                      className={`w-6 h-6 ${
                        i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-slate-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-slate-700 mb-2">Your Name</p>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Butlar Mane"
              />
            </div>

            <div>
              <p className="text-sm font-medium text-slate-700 mb-2">Your Testimonial</p>
              <Textarea
                value={formData.testimonial}
                onChange={(e) => setFormData({ ...formData, testimonial: e.target.value })}
                placeholder="e.g., This platform was a game-changer for my exam preparation."
                rows={4}
              />
            </div>

            <div>
              <p className="text-sm font-medium text-slate-700 mb-2">Upload an image as logo</p>
              <div className="flex items-center gap-4">
                {previewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
                    <Upload className="w-6 h-6 text-slate-400" />
                  </div>
                )}
                <label className="text-sm text-slate-600 cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setFormData({ ...formData, image: file });
                      const reader = new FileReader();
                      reader.onloadend = () => setPreviewUrl(reader.result as string);
                      reader.readAsDataURL(file);
                    }}
                  />
                  Choose file
                </label>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                className="ml-auto bg-blue-700 hover:bg-blue-800 text-white"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Creating...' : 'Create'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className='bg-white'>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This testimonial will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel className="rounded-lg">No</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTestimonial}
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
