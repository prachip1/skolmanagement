'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth'
import { Navigation } from '@/components/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
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
import { Textarea } from '@/components/ui/textarea'
import { Plus, Search, Edit, Trash2, BookOpen, Users } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

interface Course {
  id: string
  name: string
  description: string
  teacher_id: string
  created_at: string
  teacher?: {
    first_name: string
    last_name: string
  }
  enrollment_count?: number
}

interface User {
  id: string
  first_name: string
  last_name: string
  role: string
}

export default function CoursesPage() {
  const { userProfile } = useAuth()
  const router = useRouter()
  const [courses, setCourses] = useState<Course[]>([])
  const [teachers, setTeachers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingCourse, setEditingCourse] = useState<Course | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    teacher_id: ''
  })

  useEffect(() => {
    if (!userProfile) {
      router.push('/auth/login')
      return
    }
    fetchCourses()
    if (userProfile.role === 'admin') {
      fetchTeachers()
    }
  }, [userProfile, router])

  const fetchCourses = async () => {
    try {
      let query = supabase
        .from('courses')
        .select(`
          *,
          teacher:users!courses_teacher_id_fkey(first_name, last_name),
          enrollment_count:enrollments(count)
        `)
        .order('created_at', { ascending: false })

      // If teacher, only show their courses
      if (userProfile?.role === 'teacher') {
        query = query.eq('teacher_id', userProfile.id)
      }

      const { data, error } = await query

      if (error) throw error
      setCourses(data || [])
    } catch (error) {
      console.error('Error fetching courses:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchTeachers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, first_name, last_name')
        .eq('role', 'teacher')
        .order('first_name')

      if (error) throw error
      setTeachers(data || [])
    } catch (error) {
      console.error('Error fetching teachers:', error)
    }
  }

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const { error } = await supabase
        .from('courses')
        .insert({
          name: formData.name,
          description: formData.description,
          teacher_id: formData.teacher_id || userProfile?.id
        })

      if (error) throw error

      setShowCreateDialog(false)
      setFormData({ name: '', description: '', teacher_id: '' })
      fetchCourses()
    } catch (error: any) {
      console.error('Error creating course:', error)
      alert(error.message)
    }
  }

  const handleUpdateCourse = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingCourse) return

    try {
      const { error } = await supabase
        .from('courses')
        .update({
          name: formData.name,
          description: formData.description,
          teacher_id: formData.teacher_id || userProfile?.id
        })
        .eq('id', editingCourse.id)

      if (error) throw error

      setEditingCourse(null)
      setFormData({ name: '', description: '', teacher_id: '' })
      fetchCourses()
    } catch (error: any) {
      console.error('Error updating course:', error)
      alert(error.message)
    }
  }

  const handleDeleteCourse = async (courseId: string) => {
    if (!confirm('Are you sure you want to delete this course?')) return

    try {
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', courseId)

      if (error) throw error
      fetchCourses()
    } catch (error: any) {
      console.error('Error deleting course:', error)
      alert(error.message)
    }
  }

  const filteredCourses = courses.filter(course =>
    course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.teacher?.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.teacher?.last_name.toLowerCase().includes(searchTerm.toLowerCase())
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
            {userProfile.role === 'admin' ? 'Course Management' : 'My Courses'}
          </h1>
          <p className="text-gray-600 mt-2">
            {userProfile.role === 'admin' 
              ? 'Manage all courses in the system' 
              : 'View and manage your assigned courses'
            }
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Courses</CardTitle>
                <CardDescription>
                  {userProfile.role === 'admin' 
                    ? 'All courses in the system' 
                    : 'Your assigned courses'
                  }
                </CardDescription>
              </div>
              {(userProfile.role === 'admin' || userProfile.role === 'teacher') && (
                <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Course
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New Course</DialogTitle>
                      <DialogDescription>
                        Add a new course to the system
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreateCourse} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Course Name</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          value={formData.description}
                          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                          required
                        />
                      </div>
                      {userProfile.role === 'admin' && (
                        <div className="space-y-2">
                          <Label htmlFor="teacher">Teacher</Label>
                          <Select value={formData.teacher_id} onValueChange={(value) => setFormData(prev => ({ ...prev, teacher_id: value }))}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select teacher" />
                            </SelectTrigger>
                            <SelectContent>
                              {teachers.map((teacher) => (
                                <SelectItem key={teacher.id} value={teacher.id}>
                                  {teacher.first_name} {teacher.last_name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                      <div className="flex justify-end space-x-2">
                        <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                          Cancel
                        </Button>
                        <Button type="submit">Create Course</Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search courses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Course Name</TableHead>
                    <TableHead>Description</TableHead>
                    {userProfile.role === 'admin' && <TableHead>Teacher</TableHead>}
                    <TableHead>Students</TableHead>
                    <TableHead>Created</TableHead>
                    {(userProfile.role === 'admin' || userProfile.role === 'teacher') && (
                      <TableHead>Actions</TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCourses.map((course) => (
                    <TableRow key={course.id}>
                      <TableCell className="font-medium">{course.name}</TableCell>
                      <TableCell className="max-w-xs truncate">{course.description}</TableCell>
                      {userProfile.role === 'admin' && (
                        <TableCell>
                          {course.teacher ? `${course.teacher.first_name} ${course.teacher.last_name}` : 'Unassigned'}
                        </TableCell>
                      )}
                      <TableCell>
                        <Badge variant="secondary">
                          <Users className="mr-1 h-3 w-3" />
                          {course.enrollment_count?.[0]?.count || 0}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(course.created_at).toLocaleDateString()}
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
                                    setEditingCourse(course)
                                    setFormData({
                                      name: course.name,
                                      description: course.description,
                                      teacher_id: course.teacher_id
                                    })
                                  }}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Edit Course</DialogTitle>
                                  <DialogDescription>
                                    Update course information
                                  </DialogDescription>
                                </DialogHeader>
                                <form onSubmit={handleUpdateCourse} className="space-y-4">
                                  <div className="space-y-2">
                                    <Label htmlFor="editName">Course Name</Label>
                                    <Input
                                      id="editName"
                                      value={formData.name}
                                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                      required
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="editDescription">Description</Label>
                                    <Textarea
                                      id="editDescription"
                                      value={formData.description}
                                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                      required
                                    />
                                  </div>
                                  {userProfile.role === 'admin' && (
                                    <div className="space-y-2">
                                      <Label htmlFor="editTeacher">Teacher</Label>
                                      <Select value={formData.teacher_id} onValueChange={(value) => setFormData(prev => ({ ...prev, teacher_id: value }))}>
                                        <SelectTrigger>
                                          <SelectValue placeholder="Select teacher" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {teachers.map((teacher) => (
                                            <SelectItem key={teacher.id} value={teacher.id}>
                                              {teacher.first_name} {teacher.last_name}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </div>
                                  )}
                                  <div className="flex justify-end space-x-2">
                                    <Button type="button" variant="outline" onClick={() => setEditingCourse(null)}>
                                      Cancel
                                    </Button>
                                    <Button type="submit">Update Course</Button>
                                  </div>
                                </form>
                              </DialogContent>
                            </Dialog>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteCourse(course.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 