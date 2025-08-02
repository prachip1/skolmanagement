'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth'
import { Navigation } from '@/components/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Users, 
  BookOpen, 
  GraduationCap, 
  Calendar, 
  TrendingUp, 
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

interface DashboardStats {
  totalStudents: number
  totalTeachers: number
  totalCourses: number
  totalEnrollments: number
  attendanceRate: number
  averageGrade: number
}

export default function DashboardPage() {
  const { userProfile } = useAuth()
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    totalTeachers: 0,
    totalCourses: 0,
    totalEnrollments: 0,
    attendanceRate: 0,
    averageGrade: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardStats()
  }, [userProfile])

  const fetchDashboardStats = async () => {
    if (!userProfile) return

    try {
      let statsData: DashboardStats = {
        totalStudents: 0,
        totalTeachers: 0,
        totalCourses: 0,
        totalEnrollments: 0,
        attendanceRate: 0,
        averageGrade: 0
      }

      if (userProfile.role === 'admin') {
        // Admin sees all stats
        const [students, teachers, courses, enrollments] = await Promise.all([
          supabase.from('users').select('id').eq('role', 'student'),
          supabase.from('users').select('id').eq('role', 'teacher'),
          supabase.from('courses').select('id'),
          supabase.from('enrollments').select('id')
        ])

        statsData = {
          totalStudents: students.data?.length || 0,
          totalTeachers: teachers.data?.length || 0,
          totalCourses: courses.data?.length || 0,
          totalEnrollments: enrollments.data?.length || 0,
          attendanceRate: 85, // Mock data
          averageGrade: 78 // Mock data
        }
      } else if (userProfile.role === 'teacher') {
        // Teacher sees their course stats
        const [courses, enrollments] = await Promise.all([
          supabase.from('courses').select('id').eq('teacher_id', userProfile.id),
          supabase.from('enrollments').select('id').in('course_id', 
            (await supabase.from('courses').select('id').eq('teacher_id', userProfile.id)).data?.map(c => c.id) || []
          )
        ])

        statsData = {
          totalStudents: enrollments.data?.length || 0,
          totalTeachers: 1,
          totalCourses: courses.data?.length || 0,
          totalEnrollments: enrollments.data?.length || 0,
          attendanceRate: 88, // Mock data
          averageGrade: 82 // Mock data
        }
      } else if (userProfile.role === 'student') {
        // Student sees their personal stats
        const [enrollments, attendance, grades] = await Promise.all([
          supabase.from('enrollments').select('id').eq('student_id', userProfile.id),
          supabase.from('attendance').select('status').eq('student_id', userProfile.id),
          supabase.from('grades').select('score, max_score').eq('student_id', userProfile.id)
        ])

        const totalAttendance = attendance.data?.length || 0
        const presentAttendance = attendance.data?.filter(a => a.status === 'present').length || 0
        const attendanceRate = totalAttendance > 0 ? Math.round((presentAttendance / totalAttendance) * 100) : 0

        const totalGrades = grades.data?.length || 0
        const averageGrade = totalGrades > 0 
          ? Math.round(grades.data?.reduce((sum, grade) => sum + (grade.score / grade.max_score) * 100, 0) / totalGrades)
          : 0

        statsData = {
          totalStudents: 1,
          totalTeachers: 0,
          totalCourses: enrollments.data?.length || 0,
          totalEnrollments: enrollments.data?.length || 0,
          attendanceRate,
          averageGrade
        }
      }

      setStats(statsData)
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const getRoleBasedContent = () => {
    if (!userProfile) return null

    switch (userProfile.role) {
      case 'admin':
        return (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalStudents}</div>
                <p className="text-xs text-muted-foreground">
                  Enrolled students
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Teachers</CardTitle>
                <GraduationCap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalTeachers}</div>
                <p className="text-xs text-muted-foreground">
                  Active teachers
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalCourses}</div>
                <p className="text-xs text-muted-foreground">
                  Available courses
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Enrollments</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalEnrollments}</div>
                <p className="text-xs text-muted-foreground">
                  Course enrollments
                </p>
              </CardContent>
            </Card>
          </div>
        )

      case 'teacher':
        return (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">My Students</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalStudents}</div>
                <p className="text-xs text-muted-foreground">
                  Enrolled in my courses
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">My Courses</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalCourses}</div>
                <p className="text-xs text-muted-foreground">
                  Courses I teach
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.attendanceRate}%</div>
                <p className="text-xs text-muted-foreground">
                  Average attendance
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Grade</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.averageGrade}%</div>
                <p className="text-xs text-muted-foreground">
                  Class average
                </p>
              </CardContent>
            </Card>
          </div>
        )

      case 'student':
        return (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">My Courses</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalCourses}</div>
                <p className="text-xs text-muted-foreground">
                  Enrolled courses
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">My Attendance</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.attendanceRate}%</div>
                <p className="text-xs text-muted-foreground">
                  Attendance rate
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">My Average</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.averageGrade}%</div>
                <p className="text-xs text-muted-foreground">
                  Grade average
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Next Class</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">9:00 AM</div>
                <p className="text-xs text-muted-foreground">
                  Mathematics
                </p>
              </CardContent>
            </Card>
          </div>
        )

      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {userProfile?.first_name}!
          </h1>
          <p className="text-gray-600 mt-2">
            Here's what's happening in your {userProfile?.role === 'admin' ? 'school' : userProfile?.role === 'teacher' ? 'classes' : 'academic journey'} today.
          </p>
        </div>

        {getRoleBasedContent()}

        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Common tasks and shortcuts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {userProfile?.role === 'admin' && (
                  <>
                    <Link href="/users">
                      <Button variant="outline" className="w-full justify-start">
                        <Users className="mr-2 h-4 w-4" />
                        Manage Users
                      </Button>
                    </Link>
                    <Link href="/courses">
                      <Button variant="outline" className="w-full justify-start">
                        <BookOpen className="mr-2 h-4 w-4" />
                        Manage Courses
                      </Button>
                    </Link>
                    <Link href="/reports">
                      <Button variant="outline" className="w-full justify-start">
                        <TrendingUp className="mr-2 h-4 w-4" />
                        View Reports
                      </Button>
                    </Link>
                  </>
                )}
                {userProfile?.role === 'teacher' && (
                  <>
                    <Link href="/courses">
                      <Button variant="outline" className="w-full justify-start">
                        <BookOpen className="mr-2 h-4 w-4" />
                        My Courses
                      </Button>
                    </Link>
                    <Link href="/attendance">
                      <Button variant="outline" className="w-full justify-start">
                        <Calendar className="mr-2 h-4 w-4" />
                        Take Attendance
                      </Button>
                    </Link>
                    <Link href="/grades">
                      <Button variant="outline" className="w-full justify-start">
                        <GraduationCap className="mr-2 h-4 w-4" />
                        Grade Students
                      </Button>
                    </Link>
                  </>
                )}
                {userProfile?.role === 'student' && (
                  <>
                    <Link href="/courses">
                      <Button variant="outline" className="w-full justify-start">
                        <BookOpen className="mr-2 h-4 w-4" />
                        My Courses
                      </Button>
                    </Link>
                    <Link href="/grades">
                      <Button variant="outline" className="w-full justify-start">
                        <GraduationCap className="mr-2 h-4 w-4" />
                        My Grades
                      </Button>
                    </Link>
                    <Link href="/attendance">
                      <Button variant="outline" className="w-full justify-start">
                        <Calendar className="mr-2 h-4 w-4" />
                        Attendance History
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 