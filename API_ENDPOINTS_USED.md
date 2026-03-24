# API Endpoints Reference

All endpoints are organized in `/lib/api.ts` by module. The base URL is configured via `NEXT_PUBLIC_BASE_URL` environment variable.

## Authentication APIs

### Register
```typescript
authAPI.register(data: { email, password, name })
POST /api/v1/auth/register
```

### Login
```typescript
authAPI.login(data: { email, password })
POST /api/v1/auth/login
Response: { accessToken, _id, role, user: { name, email } }
```

### Verify Email
```typescript
authAPI.verifyEmail(data: { token })
POST /api/v1/auth/verify
```

### Forgot Password
```typescript
authAPI.forgotPassword(data: { email })
POST /api/v1/auth/forget
```

### Reset Password
```typescript
authAPI.resetPassword(data: { token, password })
POST /api/v1/auth/reset-password
```

### Change Password
```typescript
authAPI.changePassword(data: { currentPassword, newPassword, confirmPassword })
POST /api/v1/auth/change-password
Headers: Authorization: Bearer {token}
```

### Refresh Token
```typescript
authAPI.refreshToken()
POST /api/v1/auth/refresh-token
```

### Logout
```typescript
authAPI.logout()
POST /api/v1/auth/logout
Headers: Authorization: Bearer {token}
```

### Update User Role (Admin)
```typescript
authAPI.updateUserRole(userId: string, data: { role })
PATCH /api/v1/auth/users/{userId}/role
Headers: Authorization: Bearer {admin_token}
```

## User APIs

### Get Profile
```typescript
userAPI.getProfile()
GET /api/v1/user/profile
Headers: Authorization: Bearer {token}
```

### Update Profile
```typescript
userAPI.updateProfile(formData: FormData)
PUT /api/v1/user/profile
Headers: Authorization: Bearer {token}
FormData: { name, avatar: File }
```

### Change Password (User)
```typescript
userAPI.changePassword(data: { currentPassword, newPassword })
PUT /api/v1/user/password
Headers: Authorization: Bearer {token}
```

### List Users (Admin)
```typescript
userAPI.listUsers(page: number, limit: number)
GET /api/v1/user?page={page}&limit={limit}
Headers: Authorization: Bearer {admin_token}
Response: { data: User[], total: number }
```

### Get User Details (Admin)
```typescript
userAPI.getUserDetails(userId: string)
GET /api/v1/user/{userId}
Headers: Authorization: Bearer {admin_token}
```

### Update User Status (Admin)
```typescript
userAPI.updateUserStatus(userId: string, data: { status })
PATCH /api/v1/user/{userId}/status
Headers: Authorization: Bearer {admin_token}
```

### Update Subscription (Admin)
```typescript
userAPI.updateSubscription(userId: string, data: { subscriptionTier })
PATCH /api/v1/user/{userId}/subscription
Headers: Authorization: Bearer {admin_token}
```

### Update Permissions (Admin)
```typescript
userAPI.updatePermissions(userId: string, data: { permissions: string[] })
PATCH /api/v1/user/{userId}/permissions
Headers: Authorization: Bearer {admin_token}
```

### Send Password Reset Email (Admin)
```typescript
userAPI.sendPasswordResetEmail(userId: string)
POST /api/v1/user/{userId}/password-reset-email
Headers: Authorization: Bearer {admin_token}
```

### Set Temporary Password (Admin)
```typescript
userAPI.setTemporaryPassword(userId: string, data: { password })
PATCH /api/v1/user/{userId}/password
Headers: Authorization: Bearer {admin_token}
```

### Delete User (Admin)
```typescript
userAPI.deleteUser(userId: string)
DELETE /api/v1/user/{userId}
Headers: Authorization: Bearer {admin_token}
```

## Dashboard APIs

### Get Overview
```typescript
dashboardAPI.getOverview()
GET /api/v1/admin/dashboard
Headers: Authorization: Bearer {admin_token}
Response: { totalUsers, starterUsers, professionalUsers, totalRevenue }
```

## Exam APIs

### List Active Exams
```typescript
examAPI.listActiveExams(page: number, limit: number)
GET /api/v1/exam?page={page}&limit={limit}
```

### List All Exams (Admin)
```typescript
examAPI.listAllExams(page: number, limit: number)
GET /api/v1/exam/all?page={page}&limit={limit}
Headers: Authorization: Bearer {admin_token}
Response: { data: Exam[], total: number }
```

### Create Exam (Admin)
```typescript
examAPI.createExam(formData: FormData)
POST /api/v1/exam
Headers: Authorization: Bearer {admin_token}
FormData: { 
  name, 
  effectivitySheetContent, 
  bodyOfKnowledgeContent, 
  n_question, 
  durationMinutes, 
  image: File 
}
```

### Update Exam (Admin)
```typescript
examAPI.updateExam(examId: string, formData: FormData)
PUT /api/v1/exam/{examId}
Headers: Authorization: Bearer {admin_token}
FormData: { name, effectivitySheetContent, bodyOfKnowledgeContent, image }
```

### Update Exam Status (Admin)
```typescript
examAPI.updateExamStatus(examId: string, data: { status })
PATCH /api/v1/exam/{examId}/status
Headers: Authorization: Bearer {admin_token}
```

### Delete Exam (Admin)
```typescript
examAPI.deleteExam(examId: string)
DELETE /api/v1/exam/{examId}
Headers: Authorization: Bearer {admin_token}
```

### Start Exam
```typescript
examAPI.startExam(examId: string, data: { n_question, recreate })
POST /api/v1/exam/{examId}/start
Headers: Authorization: Bearer {token}
```

### Submit Exam
```typescript
examAPI.submitExam(examId: string, data: { answers, flaggedQuestionIds, timeSpent })
POST /api/v1/exam/{examId}/submit
Headers: Authorization: Bearer {token}
```

## Payment APIs

### Create Exam PayPal Order
```typescript
paymentAPI.createExamPayPalOrder(examId: string)
POST /api/v1/payments/exam/{examId}/paypal/create
Headers: Authorization: Bearer {token}
```

### Capture Exam PayPal Order
```typescript
paymentAPI.captureExamPayPalOrder(examId: string, data: { orderId })
POST /api/v1/payments/exam/{examId}/paypal/capture
Headers: Authorization: Bearer {token}
```

### Create Exam Stripe Intent
```typescript
paymentAPI.createExamStripeIntent(examId: string)
POST /api/v1/payments/exam/{examId}/stripe/create
Headers: Authorization: Bearer {token}
```

### Confirm Exam Stripe Payment
```typescript
paymentAPI.confirmExamStripePayment(examId: string, data: { paymentIntentId })
POST /api/v1/payments/exam/{examId}/stripe/confirm
Headers: Authorization: Bearer {token}
```

### Create Plan PayPal Order
```typescript
paymentAPI.createPlanPayPalOrder(plan: string, data: { examId })
POST /api/v1/payments/plan/{plan}/paypal/create
Headers: Authorization: Bearer {token}
```

### Capture Plan PayPal Order
```typescript
paymentAPI.capturePlanPayPalOrder(plan: string, data: { orderId })
POST /api/v1/payments/plan/{plan}/paypal/capture
Headers: Authorization: Bearer {token}
```

### Create Plan Stripe Intent
```typescript
paymentAPI.createPlanStripeIntent(plan: string, data: { examId })
POST /api/v1/payments/plan/{plan}/stripe/create
Headers: Authorization: Bearer {token}
```

### Confirm Plan Stripe Payment
```typescript
paymentAPI.confirmPlanStripePayment(plan: string, data: { paymentIntentId })
POST /api/v1/payments/plan/{plan}/stripe/confirm
Headers: Authorization: Bearer {token}
```

### Unlock Exam For User (Admin)
```typescript
paymentAPI.unlockExamForUser(examId: string, data: { userId })
POST /api/v1/payments/admin/exam/{examId}/unlock
Headers: Authorization: Bearer {admin_token}
```

### Update Pricing (Admin)
```typescript
paymentAPI.updatePricing(data: { examUnlockPrice, professionalPlanPrice, currency })
PATCH /api/v1/payments/admin/pricing
Headers: Authorization: Bearer {admin_token}
```

### Get Revenue Summary (Admin)
```typescript
paymentAPI.getRevenueSummary()
GET /api/v1/payments/admin/summary
Headers: Authorization: Bearer {admin_token}
Response: { totalRevenue, examUnlockRevenue, professionalPlanRevenue }
```

### Get Purchases List (Admin)
```typescript
paymentAPI.getPurchasesList(page: number, limit: number)
GET /api/v1/payments/admin/purchases?page={page}&limit={limit}
Headers: Authorization: Bearer {admin_token}
Response: { data: Purchase[], total: number }
```

## Support APIs

### Create Ticket
```typescript
supportAPI.createTicket(formData: FormData)
POST /api/v1/support
Headers: Authorization: Bearer {token}
FormData: { email, phone, subject, description, attachment: File }
```

### Reply to Ticket (Admin)
```typescript
supportAPI.replyToTicket(ticketId: string, formData: FormData)
POST /api/v1/support/{ticketId}/reply
Headers: Authorization: Bearer {admin_token}
FormData: { message, attachment: File }
```

## Analytics APIs

### Get Overview
```typescript
analyticsAPI.getOverview()
GET /api/v1/analytics/me/overview
Headers: Authorization: Bearer {token}
```

### Get Performance
```typescript
analyticsAPI.getPerformance(examId?: string)
GET /api/v1/analytics/me/performance[?examId={examId}]
Headers: Authorization: Bearer {token}
```

### Get Attempts
```typescript
analyticsAPI.getAttempts(page: number, limit: number)
GET /api/v1/analytics/history/attempts?page={page}&limit={limit}
Headers: Authorization: Bearer {token}
```

### Get Attempt Details
```typescript
analyticsAPI.getAttemptDetails(attemptId: string)
GET /api/v1/analytics/history/attempts/{attemptId}
Headers: Authorization: Bearer {token}
```

### Admin Get Overview
```typescript
analyticsAPI.adminGetOverview()
GET /api/v1/admin/analytics/overview
Headers: Authorization: Bearer {admin_token}
```

### Admin Get Performance
```typescript
analyticsAPI.adminGetPerformance(page: number, limit: number)
GET /api/v1/admin/analytics/performance?page={page}&limit={limit}
Headers: Authorization: Bearer {admin_token}
```

### Admin Get Growth
```typescript
analyticsAPI.adminGetGrowth()
GET /api/v1/admin/analytics/growth
Headers: Authorization: Bearer {admin_token}
```

### Admin Get Revenue
```typescript
analyticsAPI.adminGetRevenue(page: number, limit: number)
GET /api/v1/admin/analytics/revenue?page={page}&limit={limit}
Headers: Authorization: Bearer {admin_token}
```

## Announcement APIs

### List Announcements
```typescript
announcementAPI.listAnnouncements(page: number, limit: number)
GET /api/v1/announcement?page={page}&limit={limit}
Response: { data: Announcement[], total: number }
```

### Create Announcement
```typescript
announcementAPI.createAnnouncement(data: any)
POST /api/v1/announcement
Headers: Authorization: Bearer {admin_token}
```

### Update Announcement
```typescript
announcementAPI.updateAnnouncement(announcementId: string, data: any)
PUT /api/v1/announcement/{announcementId}
Headers: Authorization: Bearer {admin_token}
```

### Delete Announcement
```typescript
announcementAPI.deleteAnnouncement(announcementId: string)
DELETE /api/v1/announcement/{announcementId}
Headers: Authorization: Bearer {admin_token}
```

## Testimonial APIs

### List Testimonials
```typescript
testimonialAPI.listTestimonials(page: number, limit: number)
GET /api/v1/testimonial?page={page}&limit={limit}
Response: { data: Testimonial[], total: number }
```

### Create Testimonial
```typescript
testimonialAPI.createTestimonial(data: any)
POST /api/v1/testimonial
Headers: Authorization: Bearer {admin_token}
```

### Update Testimonial
```typescript
testimonialAPI.updateTestimonial(testimonialId: string, data: any)
PUT /api/v1/testimonial/{testimonialId}
Headers: Authorization: Bearer {admin_token}
```

### Delete Testimonial
```typescript
testimonialAPI.deleteTestimonial(testimonialId: string)
DELETE /api/v1/testimonial/{testimonialId}
Headers: Authorization: Bearer {admin_token}
```

## Subscription APIs

### List Subscriptions
```typescript
subscriptionAPI.listSubscriptions(page: number, limit: number)
GET /api/v1/subscription?page={page}&limit={limit}
Response: { data: Subscription[], total: number }
```

### Get Subscription Details
```typescript
subscriptionAPI.getSubscriptionDetails(subscriptionId: string)
GET /api/v1/subscription/{subscriptionId}
```

### Update Subscription
```typescript
subscriptionAPI.updateSubscription(subscriptionId: string, data: any)
PUT /api/v1/subscription/{subscriptionId}
Headers: Authorization: Bearer {admin_token}
```

### Cancel Subscription
```typescript
subscriptionAPI.cancelSubscription(subscriptionId: string)
DELETE /api/v1/subscription/{subscriptionId}
Headers: Authorization: Bearer {admin_token}
```

## Usage Examples

### In Components
```typescript
import { useQuery } from 'react-query';
import { examAPI } from '@/lib/api';
import { toast } from 'sonner';

function ExamList() {
  const { data, isLoading, error } = useQuery(
    ['exams', currentPage],
    () => examAPI.listAllExams(currentPage, 10),
    {
      onError: (error: any) => {
        toast.error('Failed to load exams');
      }
    }
  );

  if (isLoading) return <Skeleton />;
  if (error) return <Error />;
  
  return <ExamTable data={data.data} />;
}
```

### For Mutations
```typescript
const handleCreateExam = async (formData: FormData) => {
  try {
    const response = await examAPI.createExam(formData);
    toast.success('Exam created successfully');
    refetch();
  } catch (error: any) {
    toast.error(error.response?.data?.message || 'Failed');
  }
};
```

All APIs automatically include the JWT token via the Axios interceptor.
