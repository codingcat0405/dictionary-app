import React from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { BookOpen, ClipboardList, GraduationCap, LayoutDashboard, LogOut } from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger
} from '@/components/ui/sidebar'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'
import { getInitials } from '@/lib/utils'
import logo from '../../assets/logo.png'

/** Nav labels must stay byte-identical to the old admin tab labels. */
const NAV_ITEMS = [
  { to: 'dashboard', label: 'Tổng quan', icon: LayoutDashboard },
  { to: 'dictionary', label: 'Từ điển', icon: BookOpen },
  { to: 'exercises', label: 'Bài tập', icon: ClipboardList },
  { to: 'curriculum', label: 'Giáo trình', icon: GraduationCap }
] as const

/** Solid-fill active state (bolder, clearer for low-tech-literacy admin users per design brief §6). */
const ACTIVE_FILL =
  'data-[active=true]:bg-primary-500 data-[active=true]:text-white data-[active=true]:hover:bg-primary-500 data-[active=true]:hover:text-white'

const AdminSidebar: React.FC = () => {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const handleLogout = (): void => {
    logout()
    navigate('/')
  }

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="h-16 justify-center border-b border-sidebar-border px-3">
        <div className="flex items-center gap-2 overflow-hidden">
          <img src={logo} alt="Logo" className="size-8 shrink-0 rounded-md" />
          <span className="truncate text-body-md text-neutral-900 group-data-[collapsible=icon]:hidden">
            E-Dictionary Admin
          </span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {NAV_ITEMS.map((item) => {
              const isActive = pathname.startsWith(`/admin/${item.to}`)
              return (
                <SidebarMenuItem key={item.to}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive}
                    tooltip={item.label}
                    className={ACTIVE_FILL}
                  >
                    <NavLink to={item.to}>
                      <item.icon size={18} />
                      <span>{item.label}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="gap-3 border-t border-sidebar-border p-3">
        <div className="flex items-center gap-2 overflow-hidden">
          <Avatar size="sm">
            <AvatarFallback className="bg-primary-100 text-primary-700">
              {getInitials(user?.fullName)}
            </AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-col gap-0.5 group-data-[collapsible=icon]:hidden">
            <span className="truncate text-body-md text-neutral-900">
              {user?.fullName ?? user?.username ?? 'Quản trị viên'}
            </span>
            <Badge variant="secondary" className="w-fit text-tiny">
              Quản trị viên
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="flex-1 justify-start gap-2 text-neutral-600 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
          >
            <LogOut size={16} />
            <span className="group-data-[collapsible=icon]:hidden">Đăng xuất</span>
          </Button>
          <SidebarTrigger />
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}

export default AdminSidebar
