# Brototype Connect - Admin Setup Guide

## Creating Admin Account

### Step 1: Sign Up
Go to the application and sign up with these credentials:
- **Email**: admin@brototype.com
- **Password**: Admin@2024

### Step 2: Make Yourself Admin
After signing up, open the Backend dashboard and run this SQL query:

```sql
UPDATE user_roles 
SET role = 'admin' 
WHERE user_id = (
  SELECT id FROM auth.users 
  WHERE email = 'admin@brototype.com'
);
```

### Step 3: Refresh the Page
After running the query, refresh your browser and you'll have admin access!

---

## Admin Panel Features

Once logged in as admin, you'll have access to:

### 1. **Dashboard** (`/admin`)
- Overview of all complaints with statistics
- Quick insights into pending, in-progress, and resolved complaints
- Center-wise breakdown of complaints

### 2. **Complaints Management** (`/admin/complaints`)
- View all student complaints (including anonymous ones)
- Search and filter complaints by status
- **Edit complaints**: Change status, priority, category
- Add admin notes to track resolution progress
- View complaint details and attachments

### 3. **Analytics** (`/admin/analytics`)
- Comprehensive analytics dashboard
- Complaints by status, priority, and category
- Time-based trends and resolution rates
- Center-wise performance metrics

### 4. **Announcements** (`/admin/announcements`)
- Create announcements for all centers or specific centers
- Set expiration dates for announcements
- Edit and delete existing announcements
- Toggle announcements active/inactive status

### 5. **Messages** (`/admin/messages`)
- Direct messaging with students
- View all conversations related to complaints
- Real-time message notifications

### 6. **Meeting Requests** (`/admin/meetings`)
- View all student meeting requests
- Accept, reject, or reschedule meetings
- Set scheduled date and time for accepted meetings
- Track meeting status (Pending, Accepted, Rejected, Rescheduled)

### 7. **User Management** (`/admin/users`)
- View all registered students
- Search users by name, email, or center
- **Edit user details**: name, center, role
- **Promote users to admin** or demote to student
- View user statistics (complaints submitted, resolved)

---

## Admin Capabilities

### Complaint Management
- **Status Updates**: Change between Pending, In Progress, Resolved
- **Priority Management**: Adjust Low, Medium, High priorities
- **Category Assignment**: Reassign Technical, Mentor, Facility, Other
- **Admin Notes**: Add internal notes for tracking
- **Timeline Tracking**: All changes are automatically logged

### User Management
- **Role Management**: Promote students to admin or vice versa
- **Profile Editing**: Update user information
- **User Analytics**: View individual user complaint history

### Announcements
- **Targeted Communication**: Send to specific centers or all
- **Expiration Control**: Set automatic expiration dates
- **Visibility Control**: Activate or deactivate announcements

### Meetings
- **Request Handling**: Accept or reject meeting requests
- **Scheduling**: Set specific date and time for meetings
- **Rescheduling**: Change meeting times as needed
- **Status Tracking**: Monitor all meeting states

---

## Security Features

✅ **Role-Based Access Control (RLS)** - All admin features are protected by Supabase RLS policies
✅ **Audit Trail** - All complaint changes are logged in the timeline
✅ **Anonymous Complaints** - Student identity protected when requested
✅ **Secure Authentication** - Email/password with auto-confirm enabled

---

## Quick Actions

### To Add More Admins:
1. Ask the user to sign up normally
2. Run this SQL in the Backend:
```sql
UPDATE user_roles 
SET role = 'admin' 
WHERE user_id = (
  SELECT id FROM auth.users 
  WHERE email = 'new-admin@example.com'
);
```

### To Reset a User's Password:
Users can use the "Forgot Password" feature on the login page.

### To View Backend Data:
Click "View Backend" button in the interface to access the database directly.

---

## Support

For any issues or questions about the admin panel, you can:
1. Check the complaint timeline for audit logs
2. View user statistics in the Users page
3. Monitor analytics for system health
4. Use the Messages feature to communicate with students

---

**Note**: Always refresh the page after making role changes in the database for them to take effect immediately.
