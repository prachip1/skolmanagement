'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth'
import { Navigation } from '@/components/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  BarChart3, 
  Users, 
  BookOpen, 
  GraduationCap, 
  Calendar, 
  TrendingUp,
  Download,
  FileText,
  PieChart
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

interface ReportStats {
  totalStudents: number
  totalTeachers: number
  totalCourses: number
  totalEnrollments: number
  averageAttendance: number
  averageGrade: number
  topCourses: Array<{ name: string; enrollment_count: number }>
  recentGrades: Array<{ student_name: string; course_name: string; score: number; max_score: number }>
}

export default function ReportsPage() {
  const { userProfile } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState<ReportStats>({
    totalStudents: 0,
    totalTeachers: 0,
    totalCourses: 0,
    totalEnrollments: 0,
    averageAttendance: 0,
    averageGrade: 0,
    topCourses: [],
    recentGrades: []
  })
  const [loading, setLoading] = useState(true)
  const [selectedReport, setSelectedReport] = useState('overview')

  useEffect(() => {
    if (userProfile?.role !== 'admin') {
      router.push('/dashboard')
      return
    }
    fetchReportData()
  }, [userProfile, router])

  const fetchReportData = async () => {
    try {
      // Fetch basic stats
      const [students, teachers, courses, enrollments] = await Promise.all([
        supabase.from('users').select('id').eq('role', 'student'),
        supabase.from('users').select('id').eq('role', 'teacher'),
        supabase.from('courses').select('id'),
        supabase.from('enrollments').select('id')
      ])

      // Fetch attendance stats
      const { data: attendanceData } = await supabase
        .from('attendance')
        .select('status')

      const totalAttendance = attendanceData?.length || 0
      const presentAttendance = attendanceData?.filter(a => a.status === 'present').length || 0
      const averageAttendance = totalAttendance > 0 ? Math.round((presentAttendance / totalAttendance) * 100) : 0

      // Fetch grade stats
      const { data: gradesData } = await supabase
        .from('grades')
        .select('score, max_score')

             const totalGrades = gradesData?.length || 0
       const averageGrade = totalGrades > 0 && gradesData
         ? Math.round(gradesData.reduce((sum, grade) => sum + (grade.score / grade.max_score) * 100, 0) / totalGrades)
         : 0

             // Fetch top courses by enrollment
       const { data: topCoursesData } = await supabase
         .from('courses')
         .select(`
           name,
           enrollment_count:enrollments(count)
         `)
         .order('enrollment_count', { ascending: false })
         .limit(5)

       // Fetch recent grades
       const { data: recentGradesData } = await supabase
         .from('grades')
         .select(`
           score,
           max_score,
           student:users!grades_student_id_fkey(first_name, last_name),
           course:courses!grades_course_id_fkey(name)
         `)
         .order('created_at', { ascending: false })
         .limit(10)

       const topCourses = topCoursesData?.map(course => ({
         name: course.name || 'Unknown',
         enrollment_count: (course.enrollment_count as any)?.[0]?.count || 0
       })) || []

       const recentGrades = recentGradesData?.map(grade => ({
         student_name: `${(grade.student as any)?.first_name || ''} ${(grade.student as any)?.last_name || ''}`,
         course_name: (grade.course as any)?.name || 'Unknown',
         score: grade.score,
         max_score: grade.max_score
       })) || []

       setStats({
         totalStudents: students.data?.length || 0,
         totalTeachers: teachers.data?.length || 0,
         totalCourses: courses.data?.length || 0,
         totalEnrollments: enrollments.data?.length || 0,
         averageAttendance,
         averageGrade,
         topCourses,
         recentGrades
       })
    } catch (error) {
      console.error('Error fetching report data:', error)
    } finally {
      setLoading(false)
    }
  }

  const generatePDFReport = async () => {
    // This would integrate with jsPDF for actual PDF generation
    alert('PDF generation feature would be implemented here with jsPDF library')
  }

  const exportData = async (type: string) => {
    // This would export data as CSV/Excel
    alert(`${type} export feature would be implemented here`)
  }

  if (userProfile?.role !== 'admin') {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600 mt-2">
            Comprehensive reports and analytics for the school
          </p>
        </div>

        {/* Report Type Selector */}
        <div className="mb-6">
          <Select value={selectedReport} onValueChange={setSelectedReport}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Select report type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="overview">Overview Dashboard</SelectItem>
              <SelectItem value="attendance">Attendance Report</SelectItem>
              <SelectItem value="grades">Grade Analysis</SelectItem>
              <SelectItem value="courses">Course Performance</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Export Actions */}
        <div className="mb-6 flex space-x-4">
          <Button onClick={generatePDFReport}>
            <Download className="mr-2 h-4 w-4" />
            Generate PDF Report
          </Button>
          <Button variant="outline" onClick={() => exportData('CSV')}>
            <FileText className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button variant="outline" onClick={() => exportData('Excel')}>
            <TrendingUp className="mr-2 h-4 w-4" />
            Export Excel
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="grid gap-6">
            {/* Key Metrics */}
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

            {/* Performance Metrics */}
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Attendance Overview</CardTitle>
                  <CardDescription>
                    Overall attendance rate across all courses
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600">{stats.averageAttendance}%</div>
                  <p className="text-sm text-gray-600 mt-2">
                    Average attendance rate
                  </p>
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-sm">
                      <span>Present</span>
                      <span className="font-medium">{stats.averageAttendance}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${stats.averageAttendance}%` }}
                      ></div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Grade Performance</CardTitle>
                  <CardDescription>
                    Average grade performance across all courses
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">{stats.averageGrade}%</div>
                  <p className="text-sm text-gray-600 mt-2">
                    Average grade score
                  </p>
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-sm">
                      <span>Performance</span>
                      <span className="font-medium">{stats.averageGrade}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                      <div 
                        className="bg-green-600 h-2 rounded-full" 
                        style={{ width: `${stats.averageGrade}%` }}
                      ></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Top Courses */}
            <Card>
              <CardHeader>
                <CardTitle>Top Courses by Enrollment</CardTitle>
                <CardDescription>
                  Most popular courses in the school
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats.topCourses.map((course, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-blue-600">{index + 1}</span>
                        </div>
                        <div>
                          <p className="font-medium">{course.name}</p>
                          <p className="text-sm text-gray-500">{course.enrollment_count} students</p>
                        </div>
                      </div>
                      <Badge variant="secondary">{course.enrollment_count} enrollments</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Grades */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Grades</CardTitle>
                <CardDescription>
                  Latest grade entries across all courses
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats.recentGrades.map((grade, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{grade.student_name}</p>
                        <p className="text-sm text-gray-500">{grade.course_name}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{grade.score}/{grade.max_score}</p>
                        <p className="text-sm text-gray-500">
                          {Math.round((grade.score / grade.max_score) * 100)}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
} 