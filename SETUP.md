# School Management System - Setup Guide

## 🚀 Quick Start

Your School Management System is now ready! Here's what you need to do to get it running:

### 1. Supabase Setup (Required)

You need to set up Supabase for the backend. Here's how:

#### Step 1: Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Sign up/Login and create a new project
3. Wait for the project to be created (takes 1-2 minutes)

#### Step 2: Get Your Credentials
1. Go to **Settings** → **API** in your Supabase dashboard
2. Copy the **Project URL** and **anon public key**

#### Step 3: Set Environment Variables
Create a `.env.local` file in the `skolmanagement` folder with:

```env
NEXT_PUBLIC_SUPABASE_URL=your_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

#### Step 4: Set Up Database
1. Go to **SQL Editor** in your Supabase dashboard
2. Copy and paste the entire SQL schema from the README.md file
3. Click **Run** to execute the schema

### 2. Start the Application

The development server should already be running. If not, run:

```bash
cd skolmanagement
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Initial Setup

1. **Create Admin Account**: 
   - Go to `/auth/signup`
   - Create an account with role "Administrator"
   - Verify your email (check spam folder)

2. **Login as Admin**:
   - Go to `/auth/login`
   - Login with your admin credentials

3. **Set Up Your School**:
   - Create teacher accounts
   - Create student accounts
   - Create courses
   - Assign teachers to courses
   - Enroll students in courses

## 🎯 Features Available

### For Administrators:
- ✅ User Management (Create, Edit, Delete users)
- ✅ Course Management (Create, Edit, Delete courses)
- ✅ Reports & Analytics Dashboard
- ✅ System Overview Statistics

### For Teachers:
- ✅ View assigned courses
- ✅ Take attendance for enrolled students
- ✅ Manage grades and assignments
- ✅ View student progress

### For Students:
- ✅ View enrolled courses
- ✅ Check attendance history
- ✅ View grades and performance
- ✅ Access course information

## 🔧 Technical Details

### Tech Stack:
- **Frontend**: Next.js 15, TypeScript, Tailwind CSS
- **UI Components**: shadcn/ui
- **Backend**: Supabase (PostgreSQL, Auth, Real-time)
- **Authentication**: Supabase Auth with role-based access
- **Database**: PostgreSQL with Row Level Security (RLS)

### Project Structure:
```
skolmanagement/
├── app/                    # Next.js App Router
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # Main dashboard
│   ├── users/             # User management
│   ├── courses/           # Course management
│   ├── attendance/        # Attendance tracking
│   ├── grades/            # Grade management
│   ├── reports/           # Reports and analytics
│   └── profile/           # User profile
├── components/            # Reusable components
│   ├── ui/               # shadcn/ui components
│   └── navigation.tsx    # Main navigation
├── lib/                  # Utilities and configurations
│   ├── auth.tsx         # Authentication context
│   └── supabase.ts      # Supabase client and types
└── public/              # Static assets
```

## 🐛 Troubleshooting

### Common Issues:

1. **"Invalid API key" error**:
   - Check your `.env.local` file
   - Make sure you copied the correct anon key (not the service role key)

2. **"Table doesn't exist" error**:
   - Make sure you ran the SQL schema in Supabase
   - Check the SQL Editor for any errors

3. **Authentication issues**:
   - Check if email confirmation is enabled in Supabase Auth settings
   - Verify your email address

4. **Permission errors**:
   - Make sure Row Level Security (RLS) policies are set up correctly
   - Check if the user has the correct role

### Getting Help:

1. Check the browser console for error messages
2. Check the Supabase dashboard logs
3. Verify your environment variables are correct
4. Make sure all dependencies are installed

## 🚀 Next Steps

Once you have the basic system running, you can:

1. **Customize the UI**: Modify colors, fonts, and layout in the components
2. **Add more features**: Implement course materials, notifications, etc.
3. **Deploy to production**: Deploy to Vercel, Netlify, or your preferred platform
4. **Add more reports**: Implement detailed analytics and PDF generation
5. **Mobile app**: Create a React Native app using the same Supabase backend

## 📞 Support

If you need help:
1. Check the README.md for detailed documentation
2. Review the Supabase documentation
3. Check the Next.js documentation
4. Open an issue in the repository

---

**Your School Management System is ready to use! 🎉**

Start by setting up Supabase and then create your first admin account. 