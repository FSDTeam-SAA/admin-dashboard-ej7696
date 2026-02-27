'use client';

import { useState } from 'react';
import { useQuery } from 'react-query';
import { examAPI } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Plus, Search, Edit, Trash2, Database } from 'lucide-react';
import Image from 'next/image';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { AddExamModal } from '@/components/admin/exams/add-exam-modal';
import { QuestionBankModal } from '@/components/admin/exams/question-bank-modal';

export default function ExamManagementPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [isExamModalOpen, setIsExamModalOpen] = useState(false);
  const [examModalMode, setExamModalMode] = useState<'add' | 'edit'>('add');
  const [selectedExam, setSelectedExam] = useState<any | null>(null);
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isQuestionBankModalOpen, setIsQuestionBankModalOpen] = useState(false);
  const [selectedQuestionBankExam, setSelectedQuestionBankExam] = useState<any | null>(null);

  const { data: examsData, isLoading, refetch } = useQuery(
    ['exams', currentPage],
    () => examAPI.listAllExams(currentPage, 8),
    {
      onError: (error: any) => {
        toast.error('Failed to load exams');
        console.error('[v0] Exams error:', error);
      },
    }
  );

  const handleDeleteExam = async () => {
    if (!selectedExamId) return;

    try {
      await examAPI.deleteExam(selectedExamId);
      toast.success('Exam deleted successfully');
      setIsDeleteDialogOpen(false);
      setSelectedExamId(null);
      refetch();
    } catch (error: any) {
      console.error('[v0] Delete exam error:', error);
      toast.error('Failed to delete exam');
    }
  };

  const examsPayload = examsData?.data?.data;
  const exams = examsPayload?.exams || [];
  const filteredExams = exams.filter((exam: any) =>
    exam.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openAddExam = () => {
    setSelectedExam(null);
    setExamModalMode('add');
    setIsExamModalOpen(true);
  };

  const openEditExam = (exam: any) => {
    setSelectedExam(exam);
    setExamModalMode('edit');
    setIsExamModalOpen(true);
  };

  const openQuestionBank = (exam: any) => {
    setSelectedQuestionBankExam(exam);
    setIsQuestionBankModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Exam Content Management</h1>
          <p className="text-gray-600 mt-2">Management the exam content</p>
        </div>
        <Button
          onClick={openAddExam}
          className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 rounded-full"
        >
          <Plus className="w-4 h-4" />
          Add New Exam
        </Button>
      </div>

      {/* Search */}
      <Card className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
          <Input
            placeholder="Search exams"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </Card>

      {/* Exams List */}
      <div className="space-y-4">
        {isLoading ? (
          Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="p-4 md:p-6">
              <div className="flex items-center gap-4">
                <Skeleton className="w-16 h-16 md:w-24 md:h-24 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-4 w-64" />
                </div>
                <div className="flex gap-2">
                  <Skeleton className="w-20 h-8" />
                  <Skeleton className="w-20 h-8" />
                </div>
              </div>
            </Card>
          ))
        ) : filteredExams.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-gray-600">No exams found</p>
          </Card>
        ) : (
          filteredExams.map((exam: any) => (
            <Card key={exam._id} className="p-4 md:p-6 hover:shadow-md transition-shadow">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                {/* Exam Image */}
                <div className="w-16 h-16 md:w-24 md:h-24 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                  {exam.image?.url ? (
                    <Image
                      src={exam.image.url || "/placeholder.svg"}
                      alt={exam.name}
                      width={96}
                      height={96}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center text-blue-600 font-bold">
                      {exam.name.charAt(0)}
                    </div>
                  )}
                </div>

                {/* Exam Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 text-lg truncate">{exam.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {exam.n_question} Questions • {exam.durationMinutes || 0} minutes
                  </p>
                </div>

                {/* Status Badge */}
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    exam.status === 'active'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {exam.status === 'active' ? 'Active' : 'Inactive'}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2 w-full md:w-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 md:flex-none bg-transparent"
                    onClick={() => openQuestionBank(exam)}
                  >
                    <Database className="w-4 h-4 mr-2" />
                    Question Bank
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 md:flex-none bg-transparent"
                    onClick={() => openEditExam(exam)}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="flex-1 md:flex-none bg-red-600 hover:bg-red-700 text-white"
                    onClick={() => {
                      setSelectedExamId(exam._id);
                      setIsDeleteDialogOpen(true);
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Pagination */}
      {!isLoading && examsPayload && (
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Showing 1 to 8 of {examsPayload?.meta?.total || 0} results
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
              {Array.from({ length: Math.min(3, Math.ceil((examsPayload?.meta?.total || 0) / 8)) }).map(
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
                disabled={currentPage >= Math.ceil((examsPayload?.meta?.total || 0) / 8)}
                onClick={() => setCurrentPage(currentPage + 1)}
              >
                →
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Add Exam Modal */}
      <AddExamModal
        isOpen={isExamModalOpen}
        isEdit={examModalMode === 'edit'}
        exam={selectedExam}
        onClose={() => setIsExamModalOpen(false)}
        onSuccess={() => {
          setIsExamModalOpen(false);
          setSelectedExam(null);
          refetch();
        }}
      />

      <QuestionBankModal
        isOpen={isQuestionBankModalOpen}
        exam={selectedQuestionBankExam}
        onClose={() => {
          setIsQuestionBankModalOpen(false);
          setSelectedQuestionBankExam(null);
        }}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent  style={{
          background: 'linear-gradient(180deg, #FFFFFF 0%, #E5EEFF 20.91%, #EDF3FF 41.83%, #DEE9FF 69.71%, #FFFFFF 100%)',
        }}>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure want to remove the exam form list
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel className="rounded-lg">No</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteExam}
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
