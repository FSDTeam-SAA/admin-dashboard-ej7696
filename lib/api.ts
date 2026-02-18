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
  getOverview: () =>
    axiosInstance.get('/api/v1/admin/dashboard'),
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
  createProfessionalPlanPayPalOrder: (data: { examId?: string }) =>
    axiosInstance.post(`/api/v1/payments/plan/professional/paypal/create`, data),

  captureProfessionalPlanPayPalOrder: (data: { orderId: string }) =>
    axiosInstance.post(`/api/v1/payments/plan/professional/paypal/capture`, data),

  createProfessionalPlanStripeIntent: (data: { examId?: string }) =>
    axiosInstance.post(`/api/v1/payments/plan/professional/stripe/create`, data),

  confirmProfessionalPlanStripePayment: (data: { paymentIntentId: string }) =>
    axiosInstance.post(`/api/v1/payments/plan/professional/stripe/confirm`, data),

  // Admin
  unlockExamForUser: (examId: string, data: { userId: string }) =>
    axiosInstance.post(`/api/v1/payments/admin/exam/${examId}/unlock`, data),

  updatePricing: (data: {
    examUnlockPrice: number;
    professionalPlanPrice: number;
    currency: string;
    professionalPlanIntervalCount?: number;
    professionalPlanIntervalUnit?: string;
    professionalPlanDescription?: string;
    professionalPlanFeatures?: string[];
  }) =>
    axiosInstance.patch('/api/v1/payments/admin/pricing', data),

  getPricingSettings: () =>
    axiosInstance.get('/api/v1/payments/admin/pricing'),

  getRevenueSummary: () =>
    axiosInstance.get('/api/v1/payments/admin/summary'),

  getPurchasesList: (page = 1, limit = 20) =>
    axiosInstance.get(`/api/v1/payments/admin/purchases?page=${page}&limit=${limit}`),
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
    finalRole = roleMap[normalizedRole] || normalizedRole;
    await authAPI.updateUserRole(userId, { role: finalRole });
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
};
