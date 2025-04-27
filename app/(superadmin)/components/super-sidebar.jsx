"use client"
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Ticket, Users2 } from "lucide-react"
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, 
         SidebarGroupLabel, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar'

// Menu items.
const items = [
  {
    title: "Dashboard",
    url: "/admin-dashboard",
    icon: Home,
  },
  {
    title: "Users",
    url: "/admin-dashboard/Users",
    icon: Users2,
  },
  {
    title: "Store Service",
    url: "/admin-dashboard/Store-Management",
    icon: Home,
  },
  {
    title: "Coupon Management",
    url: "/admin-dashboard/Coupons",
    icon: Ticket,
  },
  {
    title: "Categories",
    url: "/admin-dashboard/Category",
    icon: Home,
  },
  {
    title: "Cashback",
    url: "/admin-dashboard/Cashback",
    icon: Home,
  },
]

export function AppSidebar() {
  const pathname = usePathname()
  
  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Application</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const isActive = pathname === item.url
                
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton 
                      asChild
                      active={isActive ? "true" : undefined}
                      // Fixed the active prop by converting boolean to string
                    >
                      <Link href={item.url} className="flex items-center gap-2">
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}