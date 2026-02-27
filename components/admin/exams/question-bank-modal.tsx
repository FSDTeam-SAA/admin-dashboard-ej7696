'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from 'react-query';
import { examAPI } from '@/lib/api';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Loader2, RefreshCw } from 'lucide-react';

interface ExamLite {
  _id: string;
  name: string;
}

interface QuestionBankModalProps {
  isOpen: boolean;
  onClose: () => void;
  exam: ExamLite | null;
}

interface GenerationFormData {
  targetCount: string;
  batchSize: string;
  maxBatchesPerRun: string;
  examType: string;
}

const DEFAULT_FORM: GenerationFormData = {
  targetCount: '10000',
  batchSize: '100',
  maxBatchesPerRun: '100',
  examType: 'closed_book',
};

interface QuestionOption {
  key?: string;
  option?: string;
  is_correct?: boolean;
}

interface QuestionBankQuestion {
  questionId?: string;
  questionHash?: string;
  question?: string;
  options?: QuestionOption[];
}

interface QuestionBankQuestionMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasPrevPage: boolean;
  hasNextPage: boolean;
}

const toPositiveInteger = (value: string) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return Math.ceil(parsed);
};

const toDisplayNumber = (value: unknown) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return 0;
  return num;
};

const calculateTotalBatches = (targetCount: number, batchSize: number) => {
  const safeTarget = Math.max(targetCount, 1);
  const safeBatchSize = Math.max(batchSize, 1);
  return Math.max(Math.ceil(safeTarget / safeBatchSize), 1);
};

const getStatusClass = (status: string) => {
  const normalized = status.toLowerCase();
  if (['approved', 'completed', 'success'].includes(normalized)) {
    return 'bg-green-100 text-green-700';
  }
  if (['failed', 'error'].includes(normalized)) {
    return 'bg-red-100 text-red-700';
  }
  if (['partial', 'validated', 'staged', 'requested'].includes(normalized)) {
    return 'bg-yellow-100 text-yellow-700';
  }
  return 'bg-gray-100 text-gray-700';
};

export function QuestionBankModal({ isOpen, onClose, exam }: QuestionBankModalProps) {
  const [formData, setFormData] = useState<GenerationFormData>(DEFAULT_FORM);
  const [latestGeneration, setLatestGeneration] = useState<any | null>(null);
  const [questionPage, setQuestionPage] = useState(1);
  const [questionSearch, setQuestionSearch] = useState('');

  const examId = exam?._id;

  const {
    data: statusResponse,
    isLoading: isStatusLoading,
    isFetching: isStatusFetching,
    refetch: refetchStatus,
  } = useQuery(
    ['exam-question-bank-status', examId],
    () => examAPI.getQuestionBankStatus(examId as string),
    {
      enabled: isOpen && Boolean(examId),
      retry: 1,
      refetchInterval: isOpen ? 15000 : false,
      onError: (error: any) => {
        console.error('[v0] Question bank status error:', error);
        toast.error(error?.response?.data?.message || 'Failed to load question bank status');
      },
    }
  );

  const statusData = statusResponse?.data?.data;
  const defaults = statusData?.defaults;

  const {
    data: questionResponse,
    isLoading: isQuestionsLoading,
    isFetching: isQuestionsFetching,
    refetch: refetchQuestions,
  } = useQuery(
    ['exam-question-bank-questions', examId, questionPage, questionSearch],
    () =>
      examAPI.getQuestionBankQuestions(examId as string, {
        page: questionPage,
        limit: 10,
        search: questionSearch.trim() || undefined,
      }),
    {
      enabled: isOpen && Boolean(examId),
      keepPreviousData: true,
      retry: 1,
      onError: (error: any) => {
        console.error('[v0] Question bank questions error:', error);
        toast.error(error?.response?.data?.message || 'Failed to load question bank questions');
      },
    }
  );

  useEffect(() => {
    if (!isOpen || !examId) return;
    setFormData(DEFAULT_FORM);
    setLatestGeneration(null);
    setQuestionPage(1);
    setQuestionSearch('');
  }, [isOpen, examId]);

  useEffect(() => {
    if (!isOpen || !defaults) return;
    const targetCount = toDisplayNumber(defaults.targetCount) || 10000;
    const batchSize = toDisplayNumber(defaults.batchSize) || 100;
    const totalBatches = calculateTotalBatches(targetCount, batchSize);
    setFormData((prev) => ({
      ...prev,
      targetCount: `${targetCount}`,
      batchSize: `${batchSize}`,
      maxBatchesPerRun: `${toDisplayNumber(defaults.totalBatches) || totalBatches}`,
    }));
  }, [isOpen, defaults]);

  const generateMutation = useMutation(
    (payload: {
      targetCount: number;
      batchSize: number;
      maxBatchesPerRun: number;
      exam_type?: string;
    }) => examAPI.generateQuestionBank(examId as string, payload),
    {
      onSuccess: (response: any) => {
        const data = response?.data?.data;
        setLatestGeneration(data || null);
        if (data?.failed) {
          toast.error(data?.failureMessage || 'Question bank generation completed with failures');
        } else {
          toast.success('Question bank generation started/completed successfully');
        }
        refetchStatus();
        refetchQuestions();
      },
      onError: (error: any) => {
        console.error('[v0] Generate question bank error:', error);
        const isTimeout =
          error?.code === 'ECONNABORTED' ||
          error?.message?.toString?.().toLowerCase?.().includes('timeout');
        if (isTimeout) {
          toast.error(
            'Generation request timed out in browser. Reduce max batches per run or wait and refresh status.'
          );
          return;
        }
        toast.error(error?.response?.data?.message || 'Failed to generate question bank');
      },
    }
  );

  const batchStatusEntries = useMemo(() => {
    const map = statusData?.batchStatus || {};
    return Object.entries(map);
  }, [statusData?.batchStatus]);

  const approvedCount = toDisplayNumber(statusData?.approvedCount);
  const totalStoredCount = toDisplayNumber(statusData?.totalCount);
  const targetCountValue = toPositiveInteger(formData.targetCount) || 1;
  const batchSizeValue = toPositiveInteger(formData.batchSize) || 1;
  const maxBatchesPerRunValue = toPositiveInteger(formData.maxBatchesPerRun) || 1;
  const totalBatches = useMemo(
    () => calculateTotalBatches(targetCountValue, batchSizeValue),
    [targetCountValue, batchSizeValue]
  );
  const remainingToTarget = Math.max(targetCountValue - approvedCount, 0);
  const remainingBatchesToTarget =
    remainingToTarget > 0 ? calculateTotalBatches(remainingToTarget, batchSizeValue) : 0;
  const plannedBatchesThisRun = Math.min(maxBatchesPerRunValue, remainingBatchesToTarget);
  const plannedQuestionsThisRun = plannedBatchesThisRun * batchSizeValue;
  const targetAlreadyMet = remainingToTarget === 0;

  const questionData = questionResponse?.data?.data;
  const questionItems: QuestionBankQuestion[] = Array.isArray(questionData?.questions)
    ? questionData.questions
    : [];
  const questionMeta: QuestionBankQuestionMeta | null = questionData?.meta || null;

  useEffect(() => {
    setFormData((prev) => {
      const current = toPositiveInteger(prev.maxBatchesPerRun);
      if (!current || current <= totalBatches) return prev;
      return { ...prev, maxBatchesPerRun: `${totalBatches}` };
    });
  }, [totalBatches]);

  const handleInputChange = (name: keyof GenerationFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRefreshAll = () => {
    refetchStatus();
    refetchQuestions();
  };

  const handleGenerate = () => {
    if (!examId) return;

    const targetCount = toPositiveInteger(formData.targetCount);
    const batchSize = toPositiveInteger(formData.batchSize);
    const maxBatchesPerRun = toPositiveInteger(formData.maxBatchesPerRun);

    if (!targetCount || !batchSize || !maxBatchesPerRun) {
      toast.error('All generation values must be positive numbers');
      return;
    }
    if (targetAlreadyMet) {
      toast.error('Target is already reached. Increase target count to generate more questions.');
      return;
    }
    if (maxBatchesPerRun > totalBatches) {
      toast.error('maxBatchesPerRun cannot be greater than totalBatches');
      return;
    }

    generateMutation.mutate({
      targetCount,
      batchSize,
      maxBatchesPerRun,
      exam_type: formData.examType?.trim() || undefined,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="max-h-[90vh] overflow-y-auto sm:max-w-3xl"
        style={{
          background:
            'linear-gradient(180deg, #FFFFFF 0%, #E5EEFF 20.91%, #EDF3FF 41.83%, #DEE9FF 69.71%, #FFFFFF 100%)',
        }}
      >
        <DialogHeader>
          <DialogTitle>Question Bank Management</DialogTitle>
          <DialogDescription>
            {exam ? `Manage question bank generation for ${exam.name}` : 'Manage question bank generation'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h4 className="font-semibold text-gray-900">Current Bank Status</h4>
              <p className="text-xs text-gray-600">
                Counts below are for the current exam content version only.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRefreshAll}
              disabled={isStatusFetching || isQuestionsFetching || generateMutation.isLoading}
            >
              {isStatusFetching || isQuestionsFetching ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Refresh Actual Bank Size
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border bg-white p-3">
              <p className="text-xs text-gray-500">Approved in Final Bank</p>
              <p className="text-xl font-semibold text-gray-900">{approvedCount}</p>
            </div>
            <div className="rounded-lg border bg-white p-3">
              <p className="text-xs text-gray-500">Total Stored (Current Content)</p>
              <p className="text-xl font-semibold text-gray-900">{totalStoredCount}</p>
            </div>
            <div className="rounded-lg border bg-white p-3">
              <p className="text-xs text-gray-500">Last Batch Number</p>
              <p className="text-xl font-semibold text-gray-900">{toDisplayNumber(statusData?.lastBatchNumber)}</p>
            </div>
            <div className="rounded-lg border bg-white p-3">
              <p className="text-xs text-gray-500">Last Batch Status</p>
              <span
                className={`mt-1 inline-flex rounded-full px-2 py-1 text-xs font-medium ${getStatusClass(
                  statusData?.lastBatchStatus || 'unknown'
                )}`}
              >
                {(statusData?.lastBatchStatus || 'N/A').toString()}
              </span>
            </div>
          </div>

          <div className="rounded-lg border bg-white p-4 space-y-4">
            <div>
              <h4 className="font-semibold text-gray-900">Batch Generation Setup</h4>
              <p className="text-xs text-gray-600">
                Example: target 50, batch size 10, total batches 5.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Final Target (Approved Questions)
                </label>
                <Input
                  type="number"
                  value={formData.targetCount}
                  onChange={(e) => handleInputChange('targetCount', e.target.value)}
                  disabled={generateMutation.isLoading}
                  min={1}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Questions Per Batch
                </label>
                <Input
                  type="number"
                  value={formData.batchSize}
                  onChange={(e) => handleInputChange('batchSize', e.target.value)}
                  disabled={generateMutation.isLoading}
                  min={1}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Total Batches Needed (Auto)
                </label>
                <Input
                  type="number"
                  value={totalBatches}
                  disabled
                  readOnly
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Max Batches This Run
                </label>
                <Input
                  type="number"
                  value={formData.maxBatchesPerRun}
                  onChange={(e) => handleInputChange('maxBatchesPerRun', e.target.value)}
                  disabled={generateMutation.isLoading}
                  min={1}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-medium text-gray-700">Exam Type (optional)</label>
                <Input
                  value={formData.examType}
                  onChange={(e) => handleInputChange('examType', e.target.value)}
                  disabled={generateMutation.isLoading}
                  placeholder="closed_book"
                />
              </div>
            </div>

            <div className="rounded border bg-slate-50 p-3 text-sm text-gray-700 space-y-1">
              <p>
                Remaining to target: <span className="font-semibold">{remainingToTarget}</span>
              </p>
              <p>
                Batches still needed: <span className="font-semibold">{remainingBatchesToTarget}</span>
              </p>
              <p>
                This click will run up to <span className="font-semibold">{plannedBatchesThisRun}</span> batch(es)
                and request about <span className="font-semibold">{plannedQuestionsThisRun}</span> question(s).
              </p>
              <p>
                Validation flow:{' '}
                <span className="font-semibold">
                  Generate, auto validate, remove duplicates, store only approved.
                </span>
              </p>
              {targetAlreadyMet ? (
                <p className="font-medium text-amber-700">
                  Target already reached. Increase the target above {approvedCount} to add more questions.
                </p>
              ) : null}
            </div>

            <div className="flex justify-end">
              <Button
                type="button"
                className="bg-blue-600 hover:bg-blue-700 text-white"
                onClick={handleGenerate}
                disabled={generateMutation.isLoading || !examId}
              >
                {generateMutation.isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  'Generate Question Bank'
                )}
              </Button>
            </div>
          </div>

          <div className="rounded-lg border bg-white p-4 space-y-3">
            <h4 className="font-semibold text-gray-900">Batch Status Summary</h4>
            {isStatusLoading ? (
              <p className="text-sm text-gray-600">Loading status...</p>
            ) : batchStatusEntries.length === 0 ? (
              <p className="text-sm text-gray-600">No batches found for this exam content yet.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {batchStatusEntries.map(([status, count]) => (
                  <span
                    key={status}
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${getStatusClass(status)}`}
                  >
                    {status}: {toDisplayNumber(count)}
                  </span>
                ))}
              </div>
            )}
          </div>

          {latestGeneration ? (
            <div className="rounded-lg border bg-white p-4 space-y-1">
              <h4 className="font-semibold text-gray-900">Latest Generation Result</h4>
              <p className="text-sm text-gray-700">
                Approved Before Run: {toDisplayNumber(latestGeneration.approvedBefore)}
              </p>
              <p className="text-sm text-gray-700">
                Approved After Run: {toDisplayNumber(latestGeneration.approvedAfter)}
              </p>
              <p className="text-sm text-gray-700">
                Inserted This Run: {toDisplayNumber(latestGeneration.insertedThisRun)}
              </p>
              <p className="text-sm text-gray-700">
                Executed Batches: {toDisplayNumber(latestGeneration.executedBatches)} /{' '}
                {toDisplayNumber(latestGeneration.requestedBatches)}
              </p>
              <p className="text-sm text-gray-700">
                Target Completed: {latestGeneration.completedTarget ? 'Yes' : 'No'}
              </p>
              {toDisplayNumber(latestGeneration.executedBatches) === 0 &&
              !latestGeneration.failed &&
              latestGeneration.completedTarget ? (
                <p className="text-sm font-medium text-amber-700">
                  No batch ran because approved questions already met the target.
                </p>
              ) : null}
              {latestGeneration.failureMessage ? (
                <p className="text-sm text-red-600">{latestGeneration.failureMessage}</p>
              ) : null}
            </div>
          ) : null}

          <div className="rounded-lg border bg-white p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h4 className="font-semibold text-gray-900">Question Bank Questions</h4>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => refetchQuestions()}
                disabled={isQuestionsFetching || generateMutation.isLoading}
              >
                {isQuestionsFetching ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                Refresh
              </Button>
            </div>

            <Input
              value={questionSearch}
              onChange={(e) => {
                setQuestionPage(1);
                setQuestionSearch(e.target.value);
              }}
              placeholder="Search by question text, category, or tag"
              disabled={generateMutation.isLoading}
            />

            {isQuestionsLoading ? (
              <p className="text-sm text-gray-600">Loading questions...</p>
            ) : questionItems.length === 0 ? (
              <p className="text-sm text-gray-600">No approved question bank questions found.</p>
            ) : (
              <div className="max-h-[360px] space-y-2 overflow-y-auto">
                {questionItems.map((item, index) => (
                  <div
                    key={item.questionHash || item.questionId || `question-${index}`}
                    className="rounded border p-3"
                  >
                    <p className="text-sm font-medium text-gray-900">
                      {item.question || `Question ${index + 1}`}
                    </p>
                    <div className="mt-2 space-y-1">
                      {(item.options || []).map((option, optionIndex) => (
                        <p
                          key={`${item.questionHash || item.questionId || index}-option-${optionIndex}`}
                          className={`text-xs ${
                            option?.is_correct ? 'font-medium text-green-700' : 'text-gray-700'
                          }`}
                        >
                          {option?.key ? `${option.key}. ` : ''}
                          {option?.option || ''}
                          {option?.is_correct ? ' (Correct)' : ''}
                        </p>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {questionMeta ? (
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs text-gray-500">
                  Page {toDisplayNumber(questionMeta.page)} of {toDisplayNumber(questionMeta.totalPages)} | Total{' '}
                  {toDisplayNumber(questionMeta.total)}
                </p>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setQuestionPage((prev) => Math.max(prev - 1, 1))}
                    disabled={!questionMeta.hasPrevPage || isQuestionsFetching}
                  >
                    Previous
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setQuestionPage((prev) => prev + 1)}
                    disabled={!questionMeta.hasNextPage || isQuestionsFetching}
                  >
                    Next
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
