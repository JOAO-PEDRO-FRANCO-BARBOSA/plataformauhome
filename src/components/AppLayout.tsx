import { Outlet, useLocation } from 'react-router-dom';
import { Home, Search, Users, User } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { AppFooter } from './AppFooter';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import { useIsMobile } from '@/hooks/use-mobile';
import logoImg from '@/assets/Logo_Uhome.png';

const navItems = [
  { title: 'Dashboard', url: '/dashboard', icon: Home },
  { title: 'Marketplace', url: '/marketplace', icon: Search },
  { title: 'Match', url: '/match', icon: Users },
  { title: 'Perfil', url: '/profile', icon: User },
];

function DesktopSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const location = useLocation();

  return (
    <Sidebar collapsible="icon" className="border-r">
      <div className="p-4 flex items-center gap-2">
        <img src={logoImg} alt="Uhome" className="h-8 w-8 object-contain shrink-0" />
        {!collapsed && <span className="font-bold text-lg text-primary">Uhome</span>}
      </div>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end
                      className="hover:bg-accent/50"
                      activeClassName="bg-accent text-primary font-medium"
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

function MobileBottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t flex items-center justify-around h-16 md:hidden">
      {navItems.map((item) => (
        <NavLink
          key={item.title}
          to={item.url}
          end
          className="flex flex-col items-center gap-0.5 text-muted-foreground text-xs py-2 px-3"
          activeClassName="text-primary font-medium"
        >
          <item.icon className="w-5 h-5" />
          <span>{item.title}</span>
        </NavLink>
      ))}
    </nav>
  );
}

export function AppLayout() {
  const isMobile = useIsMobile();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        {!isMobile && <DesktopSidebar />}
        <div className="flex-1 flex flex-col min-h-screen">
          <header className="h-14 flex items-center border-b px-4 gap-3 bg-card sticky top-0 z-40">
            {!isMobile && <SidebarTrigger />}
            <img src={logoImg} alt="Uhome" className="h-7 w-7 object-contain md:hidden" />
            <span className="font-bold text-primary md:hidden">Uhome</span>
          </header>
          <main className="flex-1 p-4 md:p-6 pb-20 md:pb-6">
            <Outlet />
          </main>
          <AppFooter />
        </div>
        {isMobile && <MobileBottomNav />}
      </div>
    </SidebarProvider>
  );
}
