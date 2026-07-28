import React from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { ChevronDown } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'
import { getInitials } from '@/lib/utils'
import logo from '../assets/logo.png'

const Header: React.FC = () => {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { user, isAuthenticated, isAdmin, logout } = useAuth()
  const isAdminRoute = pathname.startsWith('/admin')

  const handleLogout = (): void => {
    logout()
    navigate('/')
  }

  return (
    <div className="flex items-center justify-between px-8 bg-primary-600">
      <div onClick={() => navigate('/')} className="cursor-pointer py-2">
        <img src={logo} alt="Logo" width={56} height={56} className="block" />
      </div>
      <div className="text-center text-white">
        <p className="font-bold text-xl">COLLEGE OF CRYPTOGRAPHY TECHNIQUES</p>
        <p>E-DICTIONARY</p>
      </div>
      <div>
        {pathname !== '/login' &&
          !isAdminRoute &&
          (isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 text-white cursor-pointer">
                  <Avatar size="sm">
                    <AvatarFallback className="bg-primary-800 text-white">
                      {getInitials(user?.fullName)}
                    </AvatarFallback>
                  </Avatar>
                  {user?.fullName ?? ''}
                  <ChevronDown size={16} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link to="/">Trang chủ</Link>
                </DropdownMenuItem>
                {isAdmin ? (
                  <DropdownMenuItem asChild>
                    <Link to="/admin">Quản trị</Link>
                  </DropdownMenuItem>
                ) : (
                  <>
                    <DropdownMenuItem asChild>
                      <Link to="/exercise">Bài tập</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/curriculum">Giáo trình</Link>
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuItem variant="destructive" onClick={handleLogout}>
                  Đăng xuất
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="secondary" onClick={() => navigate('/login')}>
              Đăng nhập
            </Button>
          ))}
      </div>
    </div>
  )
}
export default Header
