import axiosInstance from './axios-instance';

const buildQueryString = (params: Record<string, string | number | undefined>) => {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    searchParams.append(key, value.toString());
  });
  const query = searchParams.toString();
  return query ? `?${query}` : '';
};

const QUESTION_BANK_GENERATE_TIMEOUT_MS = 10 * 60 * 1000;

// ============ AUTH APIs ============

export const authAPI = {
  register: (data: { email: string; password: string; name: string; confirmPassword?: string; phone?: string }) =>
    axiosInstance.post('/api/v1/auth/register', data),

  login: (data: { email: string; password: string }) =>
    axiosInstance.post('/api/v1/auth/login', data),

  verifyEmail: (data: { token: string }) =>
    axiosInstance.post('/api/v1/auth/verify', data),

  forgotPassword: (data: { email: string }) =>
    axiosInstance.post('/api/v1/auth/forget', data),

  resetPassword: (data: { token: string; password: string }) =>
    axiosInstance.post('/api/v1/auth/reset-password', data),

  changePassword: (data: { currentPassword: string; newPassword: string; confirmPassword: string }) =>
    axiosInstance.post('/api/v1/auth/change-password', data),

  refreshToken: () =>
    axiosInstance.post('/api/v1/auth/refresh-token', {}),

  logout: () =>
    axiosInstance.post('/api/v1/auth/logout'),

  updateUserRole: (userId: string, data: { role: string }) =>
    axiosInstance.patch(`/api/v1/auth/users/${userId}/role`, data),
};

// ============ USER APIs ============

export const userAPI = {
  getProfile: () =>
    axiosInstance.get('/api/v1/user/profile'),

  updateProfile: (formData: FormData) =>
    axiosInstance.put('/api/v1/user/profile', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    axiosInstance.put('/api/v1/user/password', data),

  listUsers: (
    page = 1,
    limit = 20,
    filters?: { status?: string; role?: string; tier?: string }
  ) => {
    const query = buildQueryString({ page, limit, ...filters });
    return axiosInstance.get(`/api/v1/user${query}`);
  },

  getUserDetails: (userId: string) =>
    axiosInstance.get(`/api/v1/user/${userId}`),

  clearInstallationSession: (userId: string) =>
    axiosInstance.delete(`/api/v1/user/${userId}/installation-session`),

  getUserExamReviews: (userId: string) =>
    axiosInstance.get(`/api/v1/user/${userId}/exam-reviews`),

  updateUserStatus: (userId: string, data: { status: string }) =>
    axiosInstance.patch(`/api/v1/user/${userId}/status`, data),

  updateSubscription: (userId: string, data: { subscriptionTier: string }) =>
    axiosInstance.patch(`/api/v1/user/${userId}/subscription`, data),

  updatePermissions: (userId: string, data: { permissions: string[] }) =>
    axiosInstance.patch(`/api/v1/user/${userId}/permissions`, data),

  sendPasswordResetEmail: (userId: string) =>
    axiosInstance.post(`/api/v1/user/${userId}/password-reset-email`),

  setTemporaryPassword: (userId: string, data: { password: string }) =>
    axiosInstance.patch(`/api/v1/user/${userId}/password`, data),

  deleteUser: (userId: string) =>
    axiosInstance.delete(`/api/v1/user/${userId}`),
};

// ============ DASHBOARD APIs ============

export const dashboardAPI = {
  getOverview: (params?: { page?: number; limit?: number; range?: string }) => {
    const query = buildQueryString(params ?? {});
    return axiosInstance.get(`/api/v1/admin/dashboard${query}`);
  },
};

// ============ EXAM APIs ============

export const examAPI = {
  listActiveExams: (page = 1, limit = 10) =>
    axiosInstance.get(`/api/v1/exam?page=${page}&limit=${limit}`),

  listAllExams: (page = 1, limit = 10) =>
    axiosInstance.get(`/api/v1/exam/all?page=${page}&limit=${limit}`),

  createExam: (formData: FormData) =>
    axiosInstance.post('/api/v1/exam', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  updateExam: (examId: string, formData: FormData) =>
    axiosInstance.put(`/api/v1/exam/${examId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  updateExamStatus: (examId: string, data: { status: string }) =>
    axiosInstance.patch(`/api/v1/exam/${examId}/status`, data),

  deleteExam: (examId: string) =>
    axiosInstance.delete(`/api/v1/exam/${examId}`),

  startExam: (examId: string, data: { n_question: number; recreate: boolean }) =>
    axiosInstance.post(`/api/v1/exam/${examId}/start`, data),

  submitExam: (examId: string, data: { answers: string[]; flaggedQuestionIds: string[]; timeSpent: number[] }) =>
    axiosInstance.post(`/api/v1/exam/${examId}/submit`, data),

  getQuestionBankStatus: (examId: string) =>
    axiosInstance.get(`/api/v1/exam/${examId}/question-bank/status`),

  getQuestionBankQuestions: (
    examId: string,
    params?: { page?: number; limit?: number; search?: string }
  ) => {
    const query = buildQueryString(params ?? {});
    return axiosInstance.get(`/api/v1/exam/${examId}/question-bank/questions${query}`);
  },

  generateQuestionBank: (
    examId: string,
    data: {
      targetCount?: number;
      batchSize?: number;
      maxBatchesPerRun?: number;
      exam_type?: string;
    }
  ) =>
    axiosInstance.post(`/api/v1/exam/${examId}/question-bank/generate`, data, {
      timeout: QUESTION_BANK_GENERATE_TIMEOUT_MS,
    }),
};

// ============ PAYMENT APIs ============

export const paymentAPI = {
  // Exam Payments
  createExamPayPalOrder: (examId: string) =>
    axiosInstance.post(`/api/v1/payments/exam/${examId}/paypal/create`),

  captureExamPayPalOrder: (examId: string, data: { orderId: string }) =>
    axiosInstance.post(`/api/v1/payments/exam/${examId}/paypal/capture`, data),

  createExamStripeIntent: (examId: string) =>
    axiosInstance.post(`/api/v1/payments/exam/${examId}/stripe/create`),

  confirmExamStripePayment: (examId: string, data: { paymentIntentId: string }) =>
    axiosInstance.post(`/api/v1/payments/exam/${examId}/stripe/confirm`, data),

  // Plan Payments (backend currently supports professional plan only)
  createProfessionalPlanPayPalOrder: (data: {
    examId?: string;
    addonProductCode?: string;
    addonProductId?: string;
  }) =>
    axiosInstance.post(`/api/v1/payments/plan/professional/paypal/create`, data),

  captureProfessionalPlanPayPalOrder: (data: { orderId: string }) =>
    axiosInstance.post(`/api/v1/payments/plan/professional/paypal/capture`, data),

  createProfessionalPlanStripeIntent: (data: {
    examId?: string;
    addonProductCode?: string;
    addonProductId?: string;
  }) =>
    axiosInstance.post(`/api/v1/payments/plan/professional/stripe/create`, data),

  confirmProfessionalPlanStripePayment: (data: { paymentIntentId: string }) =>
    axiosInstance.post(`/api/v1/payments/plan/professional/stripe/confirm`, data),

  // Admin
  unlockExamForUser: (examId: string, data: { userId: string }) =>
    axiosInstance.post(`/api/v1/payments/admin/exam/${examId}/unlock`, data),

  lockExamForUser: (examId: string, data: { userId: string }) =>
    axiosInstance.post(`/api/v1/payments/admin/exam/${examId}/lock`, data),

  updatePricing: (data: {
    examUnlockPrice?: number;
    professionalPlanPrice?: number;
    currency?: string;
    referralCommissionRate?: number;
    referralCommissionPercent?: number;
    professionalPlanIntervalCount?: number;
    professionalPlanIntervalUnit?: string;
    professionalPlanDescription?: string;
    professionalPlanFeatures?: string[];
  }) =>
    axiosInstance.patch('/api/v1/payments/admin/pricing', data),

  getPricingSettings: () =>
    axiosInstance.get('/api/v1/payments/admin/pricing'),

  getRevenueSummary: (params?: { range?: string }) => {
    const query = buildQueryString(params ?? {});
    return axiosInstance.get(`/api/v1/payments/admin/summary${query}`);
  },

  getPurchasesList: (page = 1, limit = 20) =>
    axiosInstance.get(`/api/v1/payments/admin/purchases?page=${page}&limit=${limit}`),

  getProfessionalPlanPurchases: (
    page = 1,
    limit = 20,
    filters?: { status?: string; userId?: string; provider?: string; examId?: string }
  ) => {
    const query = buildQueryString({ page, limit, ...filters });
    return axiosInstance.get(`/api/v1/payments/admin/plan-purchases${query}`);
  },

  updateProfessionalPlanPurchaseStatus: (
    purchaseId: string,
    data: { status: "pending" | "completed" | "failed" | "cancelled" | "refunded"; reason?: string }
  ) => axiosInstance.patch(`/api/v1/payments/admin/plan-purchases/${purchaseId}/status`, data),
};

// ============ RESOURCE STORE APIs ============

export const resourceAPI = {
  // User
  getStore: () => axiosInstance.get("/api/v1/resources/store"),
  getUpgradeAddOnOptions: () => axiosInstance.get("/api/v1/resources/upgrade-addon-options"),
  getPreview: (productId: string) => axiosInstance.get(`/api/v1/resources/products/${productId}/preview`),
  getContent: (productId: string) => axiosInstance.get(`/api/v1/resources/products/${productId}/content`),
  getMyUnlocks: () => axiosInstance.get("/api/v1/resources/my-unlocks"),

  createStripePurchase: (data: { productId?: string; productCode?: string }) =>
    axiosInstance.post("/api/v1/resources/purchase/stripe/create", data),
  confirmStripePurchase: (data: { paymentIntentId: string }) =>
    axiosInstance.post("/api/v1/resources/purchase/stripe/confirm", data),
  createPayPalPurchase: (data: { productId?: string; productCode?: string }) =>
    axiosInstance.post("/api/v1/resources/purchase/paypal/create", data),
  capturePayPalPurchase: (data: { orderId: string }) =>
    axiosInstance.post("/api/v1/resources/purchase/paypal/capture", data),

  // Admin
  listCategories: () => axiosInstance.get("/api/v1/resources/admin/categories"),
  createCategory: (data: {
    title: string;
    slug: string;
    shortCode?: string;
    description?: string;
    sortOrder?: number;
    isActive?: boolean;
  }) => axiosInstance.post("/api/v1/resources/admin/categories", data),
  updateCategory: (
    categoryId: string,
    data: {
      title?: string;
      slug?: string;
      shortCode?: string;
      description?: string;
      sortOrder?: number;
      isActive?: boolean;
    }
  ) => axiosInstance.patch(`/api/v1/resources/admin/categories/${categoryId}`, data),
  deleteCategory: (categoryId: string) =>
    axiosInstance.delete(`/api/v1/resources/admin/categories/${categoryId}`),

  listProducts: () => axiosInstance.get("/api/v1/resources/admin/products"),
  createProduct: (data: any) =>
    axiosInstance.post("/api/v1/resources/admin/products", data, data instanceof FormData
      ? { headers: { "Content-Type": "multipart/form-data" } }
      : undefined),
  updateProduct: (productId: string, data: any) =>
    axiosInstance.patch(
      `/api/v1/resources/admin/products/${productId}`,
      data,
      data instanceof FormData
        ? { headers: { "Content-Type": "multipart/form-data" } }
        : undefined
    ),
  deleteProduct: (productId: string) =>
    axiosInstance.delete(`/api/v1/resources/admin/products/${productId}`),

  listPurchases: (
    page = 1,
    limit = 20,
    filters?: { status?: string; purchaseType?: string; userId?: string; productCode?: string }
  ) => {
    const query = buildQueryString({ page, limit, ...filters });
    return axiosInstance.get(`/api/v1/resources/admin/purchases${query}`);
  },
};

// ============ REFERRAL APIs ============

export const referralAPI = {
  // User/Public
  validateCode: (code: string) => axiosInstance.get(`/api/v1/referrals/public/${code}`),
  getMyProfile: () => axiosInstance.get("/api/v1/referrals/me"),
  getMyReferredUsers: (page = 1, limit = 20) =>
    axiosInstance.get(`/api/v1/referrals/referred-users?page=${page}&limit=${limit}`),
  getMyLedger: (page = 1, limit = 20) =>
    axiosInstance.get(`/api/v1/referrals/ledger?page=${page}&limit=${limit}`),
  convertToCredit: (data: { amount?: number }) =>
    axiosInstance.post("/api/v1/referrals/convert-to-credit", data),
  requestCashPayout: (data: { amount?: number }) =>
    axiosInstance.post("/api/v1/referrals/cash-payout-request", data),

  // Admin
  getOverview: () => axiosInstance.get("/api/v1/referrals/admin/overview"),
  listAdminRelationships: (
    page = 1,
    limit = 20,
    kind?: "shared" | "used"
  ) => {
    const query = buildQueryString({ page, limit, kind });
    return axiosInstance.get(`/api/v1/referrals/admin/relationships${query}`);
  },
  listPayoutRequests: (page = 1, limit = 20, status?: string) => {
    const query = buildQueryString({ page, limit, status });
    return axiosInstance.get(`/api/v1/referrals/admin/payout-requests${query}`);
  },
  updatePayoutRequestStatus: (
    requestId: string,
    data: { status: "approved" | "rejected" | "paid"; notes?: string }
  ) => axiosInstance.patch(`/api/v1/referrals/admin/payout-requests/${requestId}`, data),
};

// ============ SUPPORT APIs ============

export const supportAPI = {
  createTicket: (formData: FormData) =>
    axiosInstance.post('/api/v1/support', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  listTickets: (
    page = 1,
    limit = 20,
    filters?: { status?: string; search?: string }
  ) => {
    const query = buildQueryString({ page, limit, ...filters });
    return axiosInstance.get(`/api/v1/support${query}`);
  },

  getTicketDetails: (ticketId: string) =>
    axiosInstance.get(`/api/v1/support/${ticketId}`),

  replyToTicket: (ticketId: string, formData: FormData) =>
    axiosInstance.post(`/api/v1/support/${ticketId}/reply`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};

// ============ ANALYTICS APIs ============

export const analyticsAPI = {
  getOverview: () =>
    axiosInstance.get('/api/v1/analytics/me/overview'),

  getPerformance: (examId?: string) =>
    axiosInstance.get(`/api/v1/analytics/me/performance${examId ? `?examId=${examId}` : ''}`),

  getAttempts: (page = 1, limit = 20) =>
    axiosInstance.get(`/api/v1/analytics/history/attempts?page=${page}&limit=${limit}`),

  getAttemptDetails: (attemptId: string) =>
    axiosInstance.get(`/api/v1/analytics/history/attempts/${attemptId}`),
};

// ============ ANNOUNCEMENTS APIs ============

export const announcementAPI = {
  listAnnouncements: (page = 1, limit = 10) =>
    axiosInstance.get(`/api/v1/announcement/all?page=${page}&limit=${limit}`),

  createAnnouncement: (data: any) =>
    axiosInstance.post('/api/v1/announcement', data),

  updateAnnouncement: (announcementId: string, data: { status: 'visible' | 'hidden' }) =>
    axiosInstance.patch(`/api/v1/announcement/${announcementId}/status`, data),

  deleteAnnouncement: (announcementId: string) =>
    axiosInstance.delete(`/api/v1/announcement/${announcementId}`),
};

// ============ TESTIMONIALS APIs ============

export const testimonialAPI = {
  listTestimonials: (page = 1, limit = 10) =>
    axiosInstance.get(`/api/v1/testimonial?page=${page}&limit=${limit}`),

  createTestimonial: (formData: FormData) =>
    axiosInstance.post('/api/v1/testimonial', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  updateTestimonial: (testimonialId: string, formData: FormData) =>
    axiosInstance.put(`/api/v1/testimonial/${testimonialId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  deleteTestimonial: (testimonialId: string) =>
    axiosInstance.delete(`/api/v1/testimonial/${testimonialId}`),
};

// ============ REVIEWS APIs ============

export const reviewAPI = {
  listAdminReviews: (
    page = 1,
    limit = 10,
    filters?: { status?: string; examId?: string; userId?: string }
  ) => {
    const query = buildQueryString({ page, limit, ...filters });
    return axiosInstance.get(`/api/v1/exam/reviews/admin${query}`);
  },

  updateReview: (
    reviewId: string,
    data: { status?: string; stars?: number; feedbackText?: string; displayName?: string }
  ) => axiosInstance.patch(`/api/v1/exam/reviews/${reviewId}`, data),

  deleteReview: (reviewId: string) =>
    axiosInstance.delete(`/api/v1/exam/reviews/${reviewId}`),
};

// ============ SUBSCRIPTIONS APIs ============

export const subscriptionAPI = {
  // Backend stores subscription tier on user records
  listSubscriptions: (page = 1, limit = 10) =>
    userAPI.listUsers(page, limit, { role: 'user' }),

  updateSubscription: (userId: string, data: { subscriptionTier: string }) =>
    userAPI.updateSubscription(userId, data),

  cancelSubscription: (userId: string) =>
    userAPI.updateSubscription(userId, { subscriptionTier: 'starter' }),
};

const updateUserComposite = async (userId: string, data: any) => {
  if (!userId) throw new Error('User ID is required');

  const actions: Promise<any>[] = [];
  let finalRole: string | undefined;

  if (data?.role) {
    const normalizedRole = data.role.toString().toLowerCase().replace('_', '-');
    const roleMap: Record<string, string> = {
      user: 'user',
      'sub-admin': 'sub-admin',
      subadmin: 'sub-admin',
      admin: 'admin',
    };
    const resolvedRole = roleMap[normalizedRole] || normalizedRole;
    finalRole = resolvedRole;
    await authAPI.updateUserRole(userId, { role: resolvedRole });
  }

  if (data?.subscriptionTier) {
    const tier = data.subscriptionTier.toString().toLowerCase();
    actions.push(userAPI.updateSubscription(userId, { subscriptionTier: tier }));
  }

  if (Array.isArray(data?.permissions) && finalRole === 'sub-admin') {
    actions.push(userAPI.updatePermissions(userId, { permissions: data.permissions }));
  }

  if (data?.isActive !== undefined) {
    const status = data.isActive ? 'active' : 'inactive';
    actions.push(userAPI.updateUserStatus(userId, { status }));
  }

  if (data?.tempPassword) {
    actions.push(userAPI.setTemporaryPassword(userId, { password: data.tempPassword }));
  }

  if (!actions.length) {
    return Promise.resolve({ data: null });
  }

  return Promise.all(actions);
};

// ============ UNIFIED API EXPORTS ============

export const api = {
  // Auth
  register: authAPI.register,
  login: authAPI.login,
  forgotPassword: authAPI.forgotPassword,
  resetPassword: authAPI.resetPassword,
  changePassword: authAPI.changePassword,
  logout: authAPI.logout,

  // User/Profile
  getProfile: userAPI.getProfile,
  updateProfile: userAPI.updateProfile,
  listUsers: userAPI.listUsers,
  getUserDetails: userAPI.getUserDetails,
  updateUser: updateUserComposite,
  updateUserStatus: userAPI.updateUserStatus,
  updateSubscription: userAPI.updateSubscription,
  updatePermissions: userAPI.updatePermissions,
  deleteUser: userAPI.deleteUser,

  // Dashboard
  getDashboardOverview: dashboardAPI.getOverview,

  // Exams
  listExams: examAPI.listActiveExams,
  createExam: examAPI.createExam,
  updateExam: examAPI.updateExam,
  updateExamStatus: examAPI.updateExamStatus,
  deleteExam: examAPI.deleteExam,

  // Payments
  updatePricing: paymentAPI.updatePricing,
  getRevenueSummary: paymentAPI.getRevenueSummary,
  getPurchasesList: paymentAPI.getPurchasesList,
  getProfessionalPlanPurchases: paymentAPI.getProfessionalPlanPurchases,
  updateProfessionalPlanPurchaseStatus: paymentAPI.updateProfessionalPlanPurchaseStatus,

  // Announcements
  listAnnouncements: announcementAPI.listAnnouncements,
  createAnnouncement: announcementAPI.createAnnouncement,
  updateAnnouncement: announcementAPI.updateAnnouncement,
  deleteAnnouncement: announcementAPI.deleteAnnouncement,

  // Testimonials
  listTestimonials: testimonialAPI.listTestimonials,
  createTestimonial: testimonialAPI.createTestimonial,
  updateTestimonial: testimonialAPI.updateTestimonial,
  deleteTestimonial: testimonialAPI.deleteTestimonial,

  // Subscriptions
  listSubscriptions: subscriptionAPI.listSubscriptions,

  // Resource Store (Admin)
  listResourceCategories: resourceAPI.listCategories,
  createResourceCategory: resourceAPI.createCategory,
  updateResourceCategory: resourceAPI.updateCategory,
  deleteResourceCategory: resourceAPI.deleteCategory,
  listResourceProducts: resourceAPI.listProducts,
  createResourceProduct: resourceAPI.createProduct,
  updateResourceProduct: resourceAPI.updateProduct,
  deleteResourceProduct: resourceAPI.deleteProduct,
  listResourcePurchases: resourceAPI.listPurchases,

  // Referrals (Admin)
  getReferralOverview: referralAPI.getOverview,
  listReferralPayoutRequests: referralAPI.listPayoutRequests,
  updateReferralPayoutRequestStatus: referralAPI.updatePayoutRequestStatus,
};
