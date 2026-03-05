/**
 * API Configuration and Endpoint Reference
 * All endpoints follow RESTful conventions with JWT authentication via axios interceptor
 * Base URL: process.env.NEXT_PUBLIC_BASE_URL (injected through .env.local)
 */

export const API_ENDPOINTS = {
  // ============ AUTHENTICATION ============
  AUTH: {
    REGISTER: '/api/v1/auth/register',
    LOGIN: '/api/v1/auth/login',
    VERIFY_EMAIL: '/api/v1/auth/verify',
    FORGOT_PASSWORD: '/api/v1/auth/forget',
    RESET_PASSWORD: '/api/v1/auth/reset-password',
    CHANGE_PASSWORD: '/api/v1/auth/change-password',
    REFRESH_TOKEN: '/api/v1/auth/refresh-token',
    LOGOUT: '/api/v1/auth/logout',
    UPDATE_USER_ROLE: '/api/v1/auth/users/:userId/role',
  },

  // ============ USER MANAGEMENT ============
  USER: {
    GET_PROFILE: '/api/v1/user/profile',
    UPDATE_PROFILE: '/api/v1/user/profile',
    LIST_USERS: '/api/v1/user',
    GET_USER_DETAILS: '/api/v1/user/:userId',
    UPDATE_USER: '/api/v1/user/:userId',
    UPDATE_USER_STATUS: '/api/v1/user/:userId/status',
    UPDATE_SUBSCRIPTION: '/api/v1/user/:userId/subscription',
    UPDATE_PERMISSIONS: '/api/v1/user/:userId/permissions',
    SEND_PASSWORD_RESET_EMAIL: '/api/v1/user/:userId/password-reset-email',
    SET_TEMPORARY_PASSWORD: '/api/v1/user/:userId/password',
    DELETE_USER: '/api/v1/user/:userId',
    UNLOCK_EXAM_FOR_USER: '/api/v1/user/:userId/unlock-exam',
    EXPORT_USERS_CSV: '/api/v1/user/export/csv',
  },

  // ============ DASHBOARD ============
  DASHBOARD: {
    GET_OVERVIEW: '/api/v1/admin/dashboard',
  },

  // ============ EXAM MANAGEMENT ============
  EXAM: {
    LIST_ACTIVE_EXAMS: '/api/v1/exam',
    LIST_ALL_EXAMS: '/api/v1/exam/all',
    CREATE_EXAM: '/api/v1/exam',
    UPDATE_EXAM: '/api/v1/exam/:examId',
    UPDATE_EXAM_STATUS: '/api/v1/exam/:examId/status',
    DELETE_EXAM: '/api/v1/exam/:examId',
    START_EXAM: '/api/v1/exam/:examId/start',
    SUBMIT_EXAM: '/api/v1/exam/:examId/submit',
    GET_QUESTION_BANK_STATUS: '/api/v1/exam/:examId/question-bank/status',
    GET_QUESTION_BANK_QUESTIONS: '/api/v1/exam/:examId/question-bank/questions',
    GENERATE_QUESTION_BANK: '/api/v1/exam/:examId/question-bank/generate',
  },

  // ============ PAYMENTS & REVENUE ============
  PAYMENT: {
    UPDATE_PRICING: '/api/v1/payments/admin/pricing',
    GET_REVENUE_SUMMARY: '/api/v1/payments/admin/summary',
    GET_PURCHASES_LIST: '/api/v1/payments/admin/purchases',
    UNLOCK_EXAM_FOR_USER: '/api/v1/payments/admin/exam/:examId/unlock',
    LOCK_EXAM_FOR_USER: '/api/v1/payments/admin/exam/:examId/lock',
  },

  // ============ ANNOUNCEMENTS ============
  ANNOUNCEMENT: {
    LIST_ANNOUNCEMENTS: '/api/v1/announcement',
    CREATE_ANNOUNCEMENT: '/api/v1/announcement',
    UPDATE_ANNOUNCEMENT: '/api/v1/announcement/:announcementId',
    DELETE_ANNOUNCEMENT: '/api/v1/announcement/:announcementId',
  },

  // ============ TESTIMONIALS ============
  TESTIMONIAL: {
    LIST_TESTIMONIALS: '/api/v1/testimonial',
    CREATE_TESTIMONIAL: '/api/v1/testimonial',
    UPDATE_TESTIMONIAL: '/api/v1/testimonial/:testimonialId',
    DELETE_TESTIMONIAL: '/api/v1/testimonial/:testimonialId',
  },

  // ============ SUBSCRIPTIONS & PLANS ============
  SUBSCRIPTION: {
    LIST_SUBSCRIPTIONS: '/api/v1/subscription',
    GET_SUBSCRIPTION_DETAILS: '/api/v1/subscription/:subscriptionId',
    UPDATE_SUBSCRIPTION: '/api/v1/subscription/:subscriptionId',
    CANCEL_SUBSCRIPTION: '/api/v1/subscription/:subscriptionId',
    LIST_PLANS: '/api/v1/subscription-plan',
    GET_PLAN_DETAILS: '/api/v1/subscription-plan/:planId',
    CREATE_PLAN: '/api/v1/subscription-plan',
    UPDATE_PLAN: '/api/v1/subscription-plan/:planId',
    DELETE_PLAN: '/api/v1/subscription-plan/:planId',
  },

  // ============ ANALYTICS ============
  ANALYTICS: {
    GET_ADMIN_OVERVIEW: '/api/v1/admin/analytics/overview',
    GET_ADMIN_PERFORMANCE: '/api/v1/admin/analytics/performance',
    GET_ADMIN_GROWTH: '/api/v1/admin/analytics/growth',
    GET_ADMIN_REVENUE: '/api/v1/admin/analytics/revenue',
  },
};

// API Query Parameters
export const API_PARAMS = {
  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 10,
    MAX_LIMIT: 100,
  },
  FILTERS: {
    USER_TIERS: ['Starter', 'Professional'],
    USER_ROLES: ['User', 'Sub-Admin', 'Admin'],
    USER_STATUSES: ['Active', 'Inactive', 'Suspended'],
    EXAM_STATUSES: ['Active', 'Inactive', 'Draft'],
  },
};

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message: string;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// API Error Types
export interface ApiError {
  status: number;
  message: string;
  code: string;
  errors?: Record<string, string[]>;
}
