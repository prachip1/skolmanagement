'use client'

import { useAuth } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { BookOpen, GraduationCap, Users, BarChart3, Calendar, FileText, LogOut, User } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function Navigation() {
  const { userProfile, signOut } = useAuth()
  const pathname = usePathname()

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  }

  const getNavigationItems = () => {
    if (!userProfile) return []

    switch (userProfile.role) {
      case 'admin':
        return [
          { href: '/dashboard', label: 'Dashboard', icon: BarChart3 },
          { href: '/users', label: 'Users', icon: Users },
          { href: '/courses', label: 'Courses', icon: BookOpen },
          { href: '/reports', label: 'Reports', icon: FileText },
        ]
      case 'teacher':
        return [
          { href: '/dashboard', label: 'Dashboard', icon: BarChart3 },
          { href: '/courses', label: 'My Courses', icon: BookOpen },
          { href: '/attendance', label: 'Attendance', icon: Calendar },
          { href: '/grades', label: 'Grades', icon: GraduationCap },
        ]
      case 'student':
        return [
          { href: '/dashboard', label: 'Dashboard', icon: BarChart3 },
          { href: '/courses', label: 'My Courses', icon: BookOpen },
          { href: '/grades', label: 'My Grades', icon: GraduationCap },
        ]
      default:
        return []
    }
  }

  const navigationItems = getNavigationItems()

  return (
    <nav className="border-b bg-white">
      <div className="flex h-16 items-center px-4">
        <div className="flex items-center space-x-4">
          <Link href="/dashboard" className="flex items-center space-x-2">
            <GraduationCap className="h-6 w-6 text-blue-600" />
            <span className="text-xl font-bold text-gray-900">SchoolMS</span>
          </Link>
        </div>

        <div className="flex-1 flex items-center space-x-4 ml-8">
          {navigationItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </div>

        <div className="flex items-center space-x-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>
                    {userProfile ? getInitials(userProfile.first_name, userProfile.last_name) : 'U'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {userProfile?.first_name} {userProfile?.last_name}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {userProfile?.email}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground capitalize">
                    {userProfile?.role}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/profile" className="flex items-center">
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={signOut} className="flex items-center">
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  )
} 