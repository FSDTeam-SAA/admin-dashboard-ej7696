'use client';

import { useState } from 'react';
import { useQuery } from 'react-query';
import { announcementAPI } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function AnnouncementsPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedAnnouncementId, setSelectedAnnouncementId] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [newAnnouncement, setNewAnnouncement] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: announcementsData, isLoading, refetch } = useQuery(
    ['announcements', currentPage],
    () => announcementAPI.listAnnouncements(currentPage, 10),
    {
      onError: (error: any) => {
        toast.error('Failed to load announcements');
        console.error('[v0] Announcements error:', error);
      },
    }
  );

  const announcementsPayload = announcementsData?.data?.data;
  const announcements = announcementsPayload?.announcements || [];

  const handleCreateAnnouncement = async () => {
    const message = newAnnouncement.trim();
    if (!message) {
      toast.error('Please enter an announcement message');
      return;
    }

    setIsSubmitting(true);
    try {
      await announcementAPI.createAnnouncement({ message });
      toast.success('Announcement created');
      setNewAnnouncement('');
      refetch();
    } catch (error: any) {
      console.error('[v0] Create announcement error:', error);
      toast.error(error.response?.data?.message || 'Failed to create announcement');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (announcement: any) => {
    const nextStatus = announcement.status === 'visible' ? 'hidden' : 'visible';
    try {
      await announcementAPI.updateAnnouncement(announcement._id, { status: nextStatus });
      toast.success(`Announcement ${nextStatus === 'visible' ? 'shown' : 'hidden'}`);
      refetch();
    } catch (error: any) {
      console.error('[v0] Update announcement status error:', error);
      toast.error('Failed to update announcement status');
    }
  };

  const handleDeleteAnnouncement = async () => {
    if (!selectedAnnouncementId) return;

    try {
      await announcementAPI.deleteAnnouncement(selectedAnnouncementId);
      toast.success('Announcement deleted successfully');
      setIsDeleteDialogOpen(false);
      setSelectedAnnouncementId(null);
      refetch();
    } catch (error: any) {
      console.error('[v0] Delete announcement error:', error);
      toast.error('Failed to delete announcement');
    }
  };

  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Announcement</h1>
          <p className="text-slate-500">Manage Announcement</p>
        </div>
      </div>

      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-3 items-stretch">
          <Input
            placeholder="Enter new announcement message..."
            value={newAnnouncement}
            onChange={(e) => setNewAnnouncement(e.target.value)}
            className="flex-1"
            disabled={isSubmitting}
          />
          <Button
            className="rounded-full px-8 bg-blue-700 hover:bg-blue-800 text-white"
            onClick={handleCreateAnnouncement}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Adding...' : 'Add'}
          </Button>
        </div>
      </Card>

      {/* Announcements List */}
      <div className="space-y-4">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <Card key={i} className="p-6">
              <Skeleton className="h-6 w-48 mb-2" />
              <Skeleton className="h-16 w-full mb-4" />
              <Skeleton className="h-4 w-32" />
            </Card>
          ))
        ) : announcements.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-gray-600">No announcements found</p>
          </Card>
        ) : (
          announcements.map((announcement: any) => (
            <Card key={announcement._id} className="p-6 hover:shadow-md transition-shadow">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex-1">
                  <p className="text-gray-700 text-sm md:text-base">{announcement.message}</p>
                  <div className="mt-4">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                        announcement.status === 'visible'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {announcement.status === 'visible' ? 'Visible' : 'Hidden'}
                    </span>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full px-6 border-blue-500 text-blue-600 hover:bg-blue-50"
                    onClick={() => handleToggleStatus(announcement)}
                  >
                    {announcement.status === 'visible' ? 'Hide' : 'Show'}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="rounded-full px-6 text-red-600 hover:bg-red-50"
                    onClick={() => {
                      setSelectedAnnouncementId(announcement._id);
                      setIsDeleteDialogOpen(true);
                    }}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Pagination */}
      {!isLoading && announcementsPayload && (
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Showing {(currentPage - 1) * 10 + 1} to {Math.min(currentPage * 10, announcementsPayload?.meta?.total || 0)} of{' '}
              {announcementsPayload?.meta?.total || 0} results
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
              {Array.from({ length: Math.min(3, Math.ceil((announcementsPayload?.meta?.total || 0) / 10)) }).map(
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
                disabled={currentPage >= Math.ceil((announcementsPayload?.meta?.total || 0) / 10)}
                onClick={() => setCurrentPage(currentPage + 1)}
              >
                →
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Delete Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className='bg-white'>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This announcement will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel className="rounded-lg">No</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAnnouncement}
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
