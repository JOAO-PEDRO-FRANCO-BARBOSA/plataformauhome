import { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Home, Search, Users, User, Plus, MessageSquare, LogOut, Building2 } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { AppFooter } from './AppFooter';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider,
  SidebarTrigger, useSidebar,
} from '@/components/ui/sidebar';
import { useIsMobile } from '@/hooks/use-mobile';
import logoImg from '@/assets/Logo_Uhome.png';

const navItems = [
  { title: 'Dashboard', url: '/dashboard', icon: Home },
  { title: 'Marketplace', url: '/marketplace', icon: Search },
  { title: 'Match', url: '/match', icon: Users },
  { title: 'Mensagens', url: '/messages', icon: MessageSquare },
  { title: 'Meus Imóveis', url: '/my-properties', icon: Building2 },
  { title: 'Perfil', url: '/profile', icon: User },
];

function DesktopSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';

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
                    <NavLink to={item.url} end className="hover:bg-accent/50" activeClassName="bg-accent text-primary font-medium">
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
        <NavLink key={item.title} to={item.url} end className="flex flex-col items-center gap-0.5 text-muted-foreground text-xs py-2 px-3" activeClassName="text-primary font-medium">
          <item.icon className="w-5 h-5" />
          <span>{item.title}</span>
        </NavLink>
      ))}
    </nav>
  );
}

function UserMenu() {
  const { profile, logout, user } = useAuth();
  const navigate = useNavigate();
  const [hasProperties, setHasProperties] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('properties')
      .select('id', { count: 'exact', head: true })
      .eq('owner_id', user.id)
      .then(({ count }) => {
        setHasProperties((count ?? 0) > 0);
      });
  }, [user]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="rounded-full ring-2 ring-primary/20 hover:ring-primary/50 transition-all">
          <Avatar className="h-8 w-8">
            <AvatarImage src={profile?.avatar_url ?? undefined} alt={profile?.full_name ?? 'U'} />
            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
              {profile?.full_name?.charAt(0)?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={() => navigate('/profile')} className="cursor-pointer">
          <User className="mr-2 h-4 w-4" /> Meu Perfil
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate('/messages')} className="cursor-pointer">
          <MessageSquare className="mr-2 h-4 w-4" /> Mensagens
        </DropdownMenuItem>
        {hasProperties && (
          <DropdownMenuItem onClick={() => navigate('/my-properties')} className="cursor-pointer">
            <Building2 className="mr-2 h-4 w-4" /> Meus Imóveis
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={async () => { await logout(); navigate('/login'); }} className="cursor-pointer text-destructive focus:text-destructive">
          <LogOut className="mr-2 h-4 w-4" /> Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function AppLayout() {
  const isMobile = useIsMobile();
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        {!isMobile && <DesktopSidebar />}
        <div className="flex-1 flex flex-col min-h-screen">
          <header className="h-14 flex items-center justify-between border-b px-4 gap-3 bg-card sticky top-0 z-40">
            <div className="flex items-center gap-3">
              {!isMobile && <SidebarTrigger />}
              <img src={logoImg} alt="Uhome" className="h-7 w-7 object-contain md:hidden" />
              <span className="font-bold text-primary md:hidden">Uhome</span>
            </div>
            {isLoggedIn && (
              <div className="flex items-center gap-2">
                {isMobile ? (
                  <Button size="icon" variant="default" onClick={() => navigate('/host/new')} className="h-8 w-8">
                    <Plus className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button size="sm" onClick={() => navigate('/host/new')} className="gap-1.5">
                    <Plus className="h-4 w-4" /> Anunciar Imóvel / Vaga
                  </Button>
                )}
                <UserMenu />
              </div>
            )}
          </header>
          <main className="flex-1 p-4 md:p-6 pb-20 md:pb-6"><Outlet /></main>
          <AppFooter />
        </div>
        {isMobile && <MobileBottomNav />}
      </div>
    </SidebarProvider>
  );
}
