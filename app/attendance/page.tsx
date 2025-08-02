'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth'
import { Navigation } from '@/components/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar, CheckCircle, XCircle, Clock, Users } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'

interface Course {
  id: string
  name: string
  description: string
}

interface Student {
  id: string
  first_name: string
  last_name: string
  email: string
}

interface AttendanceRecord {
  id: string
  student_id: string
  course_id: string
  date: string
  status: 'present' | 'absent' | 'late'
  student: Student
}

export default function AttendancePage() {
  const { userProfile } = useAuth()
  const router = useRouter()
  const [courses, setCourses] = useState<Course[]>([])
  const [selectedCourse, setSelectedCourse] = useState<string>('')
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [students, setStudents] = useState<Student[]>([])
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!userProfile) {
      router.push('/auth/login')
      return
    }
    fetchCourses()
  }, [userProfile, router])

  useEffect(() => {
    if (selectedCourse) {
      fetchStudents()
      fetchAttendance()
    }
  }, [selectedCourse, selectedDate])

  const fetchCourses = async () => {
    try {
      let query = supabase
        .from('courses')
        .select('*')
        .order('name')

      // If teacher, only show their courses
      if (userProfile?.role === 'teacher') {
        query = query.eq('teacher_id', userProfile.id)
      }

      const { data, error } = await query

      if (error) throw error
      setCourses(data || [])
      
      // Auto-select first course for teachers
      if (userProfile?.role === 'teacher' && data && data.length > 0) {
        setSelectedCourse(data[0].id)
      }
    } catch (error) {
      console.error('Error fetching courses:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('enrollments')
        .select(`
          student:users!enrollments_student_id_fkey(
            id,
            first_name,
            last_name,
            email
          )
        `)
        .eq('course_id', selectedCourse)

      if (error) throw error
      setStudents(data?.map(item => item.student) || [])
    } catch (error) {
      console.error('Error fetching students:', error)
    }
  }

  const fetchAttendance = async () => {
    try {
      const { data, error } = await supabase
        .from('attendance')
        .select(`
          *,
          student:users!attendance_student_id_fkey(
            id,
            first_name,
            last_name,
            email
          )
        `)
        .eq('course_id', selectedCourse)
        .eq('date', selectedDate)

      if (error) throw error
      setAttendance(data || [])
    } catch (error) {
      console.error('Error fetching attendance:', error)
    }
  }

  const handleAttendanceChange = async (studentId: string, status: 'present' | 'absent' | 'late') => {
    try {
      setSaving(true)

      // Check if attendance record already exists
      const existingRecord = attendance.find(record => record.student_id === studentId)

      if (existingRecord) {
        // Update existing record
        const { error } = await supabase
          .from('attendance')
          .update({ status })
          .eq('id', existingRecord.id)

        if (error) throw error
      } else {
        // Create new record
        const { error } = await supabase
          .from('attendance')
          .insert({
            student_id: studentId,
            course_id: selectedCourse,
            date: selectedDate,
            status
          })

        if (error) throw error
      }

      // Refresh attendance data
      fetchAttendance()
    } catch (error: any) {
      console.error('Error updating attendance:', error)
      alert(error.message)
    } finally {
      setSaving(false)
    }
  }

  const getAttendanceStatus = (studentId: string) => {
    const record = attendance.find(record => record.student_id === studentId)
    return record?.status || null
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      present: 'default',
      absent: 'destructive',
      late: 'secondary'
    } as const

    const icons = {
      present: CheckCircle,
      absent: XCircle,
      late: Clock
    } as const

    const Icon = icons[status as keyof typeof icons]

    return (
      <Badge variant={variants[status as keyof typeof variants]}>
        <Icon className="mr-1 h-3 w-3" />
        {status}
      </Badge>
    )
  }

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  }

  if (!userProfile) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Attendance Tracking</h1>
          <p className="text-gray-600 mt-2">
            Mark and track student attendance
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Take Attendance</CardTitle>
            <CardDescription>
              Select a course and date to mark attendance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Course</label>
                <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a course" />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.map((course) => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Date</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : selectedCourse && students.length > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">
                    Students ({students.length})
                  </h3>
                  {saving && (
                    <Badge variant="secondary">
                      Saving...
                    </Badge>
                  )}
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map((student) => {
                      const currentStatus = getAttendanceStatus(student.id)
                      return (
                        <TableRow key={student.id}>
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <Avatar>
                                <AvatarFallback>
                                  {getInitials(student.first_name, student.last_name)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium">
                                  {student.first_name} {student.last_name}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{student.email}</TableCell>
                          <TableCell>
                            {currentStatus ? getStatusBadge(currentStatus) : (
                              <Badge variant="outline">Not marked</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                variant={currentStatus === 'present' ? 'default' : 'outline'}
                                onClick={() => handleAttendanceChange(student.id, 'present')}
                                disabled={saving}
                              >
                                <CheckCircle className="mr-1 h-3 w-3" />
                                Present
                              </Button>
                              <Button
                                size="sm"
                                variant={currentStatus === 'late' ? 'secondary' : 'outline'}
                                onClick={() => handleAttendanceChange(student.id, 'late')}
                                disabled={saving}
                              >
                                <Clock className="mr-1 h-3 w-3" />
                                Late
                              </Button>
                              <Button
                                size="sm"
                                variant={currentStatus === 'absent' ? 'destructive' : 'outline'}
                                onClick={() => handleAttendanceChange(student.id, 'absent')}
                                disabled={saving}
                              >
                                <XCircle className="mr-1 h-3 w-3" />
                                Absent
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            ) : selectedCourse ? (
              <div className="text-center py-8">
                <Users className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No students enrolled</h3>
                <p className="mt-1 text-sm text-gray-500">
                  No students are currently enrolled in this course.
                </p>
              </div>
            ) : (
              <div className="text-center py-8">
                <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Select a course</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Choose a course to start taking attendance.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 