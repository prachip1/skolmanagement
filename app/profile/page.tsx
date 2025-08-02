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
import { User, Mail, Calendar, Shield } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function ProfilePage() {
  const { userProfile, user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!userProfile) {
      router.push('/auth/login')
    }
  }, [userProfile, router])

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  }

  const getRoleBadge = (role: string) => {
    const variants = {
      admin: 'destructive',
      teacher: 'default',
      student: 'secondary'
    } as const

    return <Badge variant={variants[role as keyof typeof variants]}>{role}</Badge>
  }

  if (!userProfile) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
          <p className="text-gray-600 mt-2">
            Your account information and settings
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Profile Information */}
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Your personal details and account information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center space-x-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="text-lg">
                    {getInitials(userProfile.first_name, userProfile.last_name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-semibold">
                    {userProfile.first_name} {userProfile.last_name}
                  </h3>
                  <p className="text-gray-600">{userProfile.email}</p>
                  <div className="mt-2">
                    {getRoleBadge(userProfile.role)}
                  </div>
                </div>
              </div>

              <div className="grid gap-4">
                <div className="flex items-center space-x-3">
                  <User className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium">Full Name</p>
                    <p className="text-sm text-gray-600">
                      {userProfile.first_name} {userProfile.last_name}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium">Email Address</p>
                    <p className="text-sm text-gray-600">{userProfile.email}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Shield className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium">Role</p>
                    <p className="text-sm text-gray-600 capitalize">{userProfile.role}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium">Member Since</p>
                    <p className="text-sm text-gray-600">
                      {new Date(userProfile.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Account Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Account Settings</CardTitle>
              <CardDescription>
                Manage your account preferences and security
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={userProfile.first_name}
                  disabled
                  className="bg-gray-50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={userProfile.last_name}
                  disabled
                  className="bg-gray-50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  value={userProfile.email}
                  disabled
                  className="bg-gray-50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Input
                  id="role"
                  value={userProfile.role}
                  disabled
                  className="bg-gray-50"
                />
              </div>

              <div className="pt-4">
                <Button disabled className="w-full">
                  Edit Profile (Coming Soon)
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Quick Statistics</CardTitle>
              <CardDescription>
                Overview of your activity in the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {userProfile.role === 'student' ? '3' : userProfile.role === 'teacher' ? '5' : '12'}
                  </div>
                  <p className="text-sm text-gray-600">
                    {userProfile.role === 'student' ? 'Enrolled Courses' : 
                     userProfile.role === 'teacher' ? 'Teaching Courses' : 'Total Users'}
                  </p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {userProfile.role === 'student' ? '85' : userProfile.role === 'teacher' ? '92' : '78'}
                  </div>
                  <p className="text-sm text-gray-600">
                    {userProfile.role === 'student' ? 'Attendance %' : 
                     userProfile.role === 'teacher' ? 'Student Attendance' : 'Active Users'}
                  </p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {userProfile.role === 'student' ? '82' : userProfile.role === 'teacher' ? '88' : '15'}
                  </div>
                  <p className="text-sm text-gray-600">
                    {userProfile.role === 'student' ? 'Average Grade' : 
                     userProfile.role === 'teacher' ? 'Class Average' : 'Total Courses'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 