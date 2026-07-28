import React from 'react'
import { Outlet } from 'react-router-dom'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import AdminSidebar from '@/components/admin/admin-sidebar'

/**
 * Routed admin shell: sidebar + content outlet. Rendered nested under
 * `AppLayout`'s existing Header/Footer (Footer owns the LAN IP config and
 * must stay reachable from admin routes too — see phase-03 spec §Architecture).
 */
const AdminLayout: React.FC = () => {
  return (
    <SidebarProvider
      style={{ '--sidebar-width': '240px', '--sidebar-width-icon': '64px' } as React.CSSProperties}
    >
      <AdminSidebar />
      <SidebarInset className="bg-background">
        <div className="p-6">
          <div className="rounded-lg bg-card p-6 shadow-sm">
            <Outlet />
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

export default AdminLayout
