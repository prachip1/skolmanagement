'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth'
import { Navigation } from '@/components/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Search, Edit, Trash2, GraduationCap, TrendingUp } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

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

interface Grade {
  id: string
  student_id: string
  course_id: string
  assignment_name: string
  score: number
  max_score: number
  grade_date: string
  created_at: string
  student?: Student
  course?: Course
}

export default function GradesPage() {
  const { userProfile } = useAuth()
  const router = useRouter()
  const [courses, setCourses] = useState<Course[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [grades, setGrades] = useState<Grade[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingGrade, setEditingGrade] = useState<Grade | null>(null)
  const [selectedCourse, setSelectedCourse] = useState<string>('')
  const [formData, setFormData] = useState({
    student_id: '',
    course_id: '',
    assignment_name: '',
    score: '',
    max_score: '',
    grade_date: ''
  })

  useEffect(() => {
    if (!userProfile) {
      router.push('/auth/login')
      return
    }
    fetchData()
  }, [userProfile, router])

  useEffect(() => {
    if (selectedCourse) {
      fetchGrades()
    }
  }, [selectedCourse])

  const fetchData = async () => {
    try {
      if (userProfile?.role === 'teacher') {
        // Teachers see their courses and students
        const [coursesData, studentsData] = await Promise.all([
          supabase.from('courses').select('*').eq('teacher_id', userProfile.id),
          supabase.from('enrollments')
            .select(`
              student:users!enrollments_student_id_fkey(
                id,
                first_name,
                last_name,
                email
              )
            `)
            .in('course_id', 
              (await supabase.from('courses').select('id').eq('teacher_id', userProfile.id)).data?.map(c => c.id) || []
            )
        ])

        setCourses(coursesData.data || [])
        setStudents(studentsData.data?.map(item => item.student) || [])
        
        if (coursesData.data && coursesData.data.length > 0) {
          setSelectedCourse(coursesData.data[0].id)
        }
      } else if (userProfile?.role === 'admin') {
        // Admins see all courses and students
        const [coursesData, studentsData] = await Promise.all([
          supabase.from('courses').select('*'),
          supabase.from('users').select('*').eq('role', 'student')
        ])

        setCourses(coursesData.data || [])
        setStudents(studentsData.data || [])
      } else if (userProfile?.role === 'student') {
        // Students see their grades
        fetchStudentGrades()
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchGrades = async () => {
    if (!selectedCourse) return

    try {
      let query = supabase
        .from('grades')
        .select(`
          *,
          student:users!grades_student_id_fkey(
            id,
            first_name,
            last_name,
            email
          ),
          course:courses!grades_course_id_fkey(
            id,
            name,
            description
          )
        `)
        .eq('course_id', selectedCourse)
        .order('grade_date', { ascending: false })

      if (userProfile?.role === 'teacher') {
        // Teachers only see grades for their courses
        query = query.eq('course_id', selectedCourse)
      }

      const { data, error } = await query

      if (error) throw error
      setGrades(data || [])
    } catch (error) {
      console.error('Error fetching grades:', error)
    }
  }

  const fetchStudentGrades = async () => {
    try {
      const { data, error } = await supabase
        .from('grades')
        .select(`
          *,
          course:courses!grades_course_id_fkey(
            id,
            name,
            description
          )
        `)
        .eq('student_id', userProfile?.id)
        .order('grade_date', { ascending: false })

      if (error) throw error
      setGrades(data || [])
    } catch (error) {
      console.error('Error fetching student grades:', error)
    }
  }

  const handleCreateGrade = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const { error } = await supabase
        .from('grades')
        .insert({
          student_id: formData.student_id,
          course_id: formData.course_id || selectedCourse,
          assignment_name: formData.assignment_name,
          score: parseFloat(formData.score),
          max_score: parseFloat(formData.max_score),
          grade_date: formData.grade_date
        })

      if (error) throw error

      setShowCreateDialog(false)
      setFormData({ student_id: '', course_id: '', assignment_name: '', score: '', max_score: '', grade_date: '' })
      fetchGrades()
    } catch (error: any) {
      console.error('Error creating grade:', error)
      alert(error.message)
    }
  }

  const handleUpdateGrade = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingGrade) return

    try {
      const { error } = await supabase
        .from('grades')
        .update({
          student_id: formData.student_id,
          course_id: formData.course_id || selectedCourse,
          assignment_name: formData.assignment_name,
          score: parseFloat(formData.score),
          max_score: parseFloat(formData.max_score),
          grade_date: formData.grade_date
        })
        .eq('id', editingGrade.id)

      if (error) throw error

      setEditingGrade(null)
      setFormData({ student_id: '', course_id: '', assignment_name: '', score: '', max_score: '', grade_date: '' })
      fetchGrades()
    } catch (error: any) {
      console.error('Error updating grade:', error)
      alert(error.message)
    }
  }

  const handleDeleteGrade = async (gradeId: string) => {
    if (!confirm('Are you sure you want to delete this grade?')) return

    try {
      const { error } = await supabase
        .from('grades')
        .delete()
        .eq('id', gradeId)

      if (error) throw error
      fetchGrades()
    } catch (error: any) {
      console.error('Error deleting grade:', error)
      alert(error.message)
    }
  }

  const getGradePercentage = (score: number, maxScore: number) => {
    return Math.round((score / maxScore) * 100)
  }

  const getGradeBadge = (percentage: number) => {
    if (percentage >= 90) return <Badge className="bg-green-100 text-green-800">A</Badge>
    if (percentage >= 80) return <Badge className="bg-blue-100 text-blue-800">B</Badge>
    if (percentage >= 70) return <Badge className="bg-yellow-100 text-yellow-800">C</Badge>
    if (percentage >= 60) return <Badge className="bg-orange-100 text-orange-800">D</Badge>
    return <Badge className="bg-red-100 text-red-800">F</Badge>
  }

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  }

  const filteredGrades = grades.filter(grade =>
    grade.assignment_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    grade.student?.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    grade.student?.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    grade.course?.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (!userProfile) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {userProfile.role === 'student' ? 'My Grades' : 'Grade Management'}
          </h1>
          <p className="text-gray-600 mt-2">
            {userProfile.role === 'student' 
              ? 'View your academic performance' 
              : 'Manage student grades and assignments'
            }
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Grades</CardTitle>
                <CardDescription>
                  {userProfile.role === 'student' 
                    ? 'Your grade history' 
                    : 'Student grades and assignments'
                  }
                </CardDescription>
              </div>
              {(userProfile.role === 'admin' || userProfile.role === 'teacher') && (
                <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Grade
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Grade</DialogTitle>
                      <DialogDescription>
                        Record a new grade for a student
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreateGrade} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="student">Student</Label>
                        <Select value={formData.student_id} onValueChange={(value) => setFormData(prev => ({ ...prev, student_id: value }))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select student" />
                          </SelectTrigger>
                          <SelectContent>
                            {students.map((student) => (
                              <SelectItem key={student.id} value={student.id}>
                                {student.first_name} {student.last_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      {userProfile.role === 'admin' && (
                        <div className="space-y-2">
                          <Label htmlFor="course">Course</Label>
                          <Select value={formData.course_id} onValueChange={(value) => setFormData(prev => ({ ...prev, course_id: value }))}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select course" />
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
                      )}
                      <div className="space-y-2">
                        <Label htmlFor="assignment">Assignment Name</Label>
                        <Input
                          id="assignment"
                          value={formData.assignment_name}
                          onChange={(e) => setFormData(prev => ({ ...prev, assignment_name: e.target.value }))}
                          required
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="score">Score</Label>
                          <Input
                            id="score"
                            type="number"
                            step="0.01"
                            value={formData.score}
                            onChange={(e) => setFormData(prev => ({ ...prev, score: e.target.value }))}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="maxScore">Max Score</Label>
                          <Input
                            id="maxScore"
                            type="number"
                            step="0.01"
                            value={formData.max_score}
                            onChange={(e) => setFormData(prev => ({ ...prev, max_score: e.target.value }))}
                            required
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="gradeDate">Grade Date</Label>
                        <Input
                          id="gradeDate"
                          type="date"
                          value={formData.grade_date}
                          onChange={(e) => setFormData(prev => ({ ...prev, grade_date: e.target.value }))}
                          required
                        />
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                          Cancel
                        </Button>
                        <Button type="submit">Add Grade</Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {(userProfile.role === 'admin' || userProfile.role === 'teacher') && (
              <div className="mb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <label className="text-sm font-medium">Search</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search grades..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {userProfile.role === 'student' && (
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search your grades..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            )}

            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    {(userProfile.role === 'admin' || userProfile.role === 'teacher') && (
                      <TableHead>Student</TableHead>
                    )}
                    {userProfile.role === 'admin' && <TableHead>Course</TableHead>}
                    <TableHead>Assignment</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Grade</TableHead>
                    <TableHead>Date</TableHead>
                    {(userProfile.role === 'admin' || userProfile.role === 'teacher') && (
                      <TableHead>Actions</TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredGrades.map((grade) => {
                    const percentage = getGradePercentage(grade.score, grade.max_score)
                    return (
                      <TableRow key={grade.id}>
                        {(userProfile.role === 'admin' || userProfile.role === 'teacher') && (
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <Avatar>
                                <AvatarFallback>
                                  {grade.student ? getInitials(grade.student.first_name, grade.student.last_name) : 'S'}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium">
                                  {grade.student ? `${grade.student.first_name} ${grade.student.last_name}` : 'Unknown'}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {grade.student?.email}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                        )}
                        {userProfile.role === 'admin' && (
                          <TableCell>{grade.course?.name || 'Unknown'}</TableCell>
                        )}
                        <TableCell className="font-medium">{grade.assignment_name}</TableCell>
                        <TableCell>
                          {grade.score} / {grade.max_score}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {getGradeBadge(percentage)}
                            <span className="text-sm text-gray-500">({percentage}%)</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {new Date(grade.grade_date).toLocaleDateString()}
                        </TableCell>
                        {(userProfile.role === 'admin' || userProfile.role === 'teacher') && (
                          <TableCell>
                            <div className="flex space-x-2">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setEditingGrade(grade)
                                      setFormData({
                                        student_id: grade.student_id,
                                        course_id: grade.course_id,
                                        assignment_name: grade.assignment_name,
                                        score: grade.score.toString(),
                                        max_score: grade.max_score.toString(),
                                        grade_date: grade.grade_date
                                      })
                                    }}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Edit Grade</DialogTitle>
                                    <DialogDescription>
                                      Update grade information
                                    </DialogDescription>
                                  </DialogHeader>
                                  <form onSubmit={handleUpdateGrade} className="space-y-4">
                                    <div className="space-y-2">
                                      <Label htmlFor="editAssignment">Assignment Name</Label>
                                      <Input
                                        id="editAssignment"
                                        value={formData.assignment_name}
                                        onChange={(e) => setFormData(prev => ({ ...prev, assignment_name: e.target.value }))}
                                        required
                                      />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                      <div className="space-y-2">
                                        <Label htmlFor="editScore">Score</Label>
                                        <Input
                                          id="editScore"
                                          type="number"
                                          step="0.01"
                                          value={formData.score}
                                          onChange={(e) => setFormData(prev => ({ ...prev, score: e.target.value }))}
                                          required
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <Label htmlFor="editMaxScore">Max Score</Label>
                                        <Input
                                          id="editMaxScore"
                                          type="number"
                                          step="0.01"
                                          value={formData.max_score}
                                          onChange={(e) => setFormData(prev => ({ ...prev, max_score: e.target.value }))}
                                          required
                                        />
                                      </div>
                                    </div>
                                    <div className="space-y-2">
                                      <Label htmlFor="editGradeDate">Grade Date</Label>
                                      <Input
                                        id="editGradeDate"
                                        type="date"
                                        value={formData.grade_date}
                                        onChange={(e) => setFormData(prev => ({ ...prev, grade_date: e.target.value }))}
                                        required
                                      />
                                    </div>
                                    <div className="flex justify-end space-x-2">
                                      <Button type="button" variant="outline" onClick={() => setEditingGrade(null)}>
                                        Cancel
                                      </Button>
                                      <Button type="submit">Update Grade</Button>
                                    </div>
                                  </form>
                                </DialogContent>
                              </Dialog>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteGrade(grade.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 