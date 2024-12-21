// app/(main)/layout.tsx
// This file is used to handle the layout of the main pages
// It is used to display the sidebar and the main content

"use client";

import React, { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import {
  Home,
  Settings,
  MessageSquare,
  Users,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { Button } from "@nextui-org/react";
import Image from "next/image";
import Logo from "@/assets/images/logo_God.webp";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Bible Chat", href: "/bible-chat", icon: MessageSquare },
  { name: "Settings", href: "/settings", icon: Settings },
];

const adminNavigation = [
  { name: "Users", href: "/admin/users", icon: Users },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClientComponentClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile sidebar */}
      <div className="lg:hidden">
        <Button
          isIconOnly
          className="fixed top-4 left-4 z-50"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? <X /> : <Menu />}
        </Button>

        {sidebarOpen && (
          <div className="fixed inset-0 z-40 bg-black bg-opacity-50" onClick={() => setSidebarOpen(false)}>
            <div className="fixed inset-y-0 left-0 w-64 bg-white dark:bg-gray-800" onClick={e => e.stopPropagation()}>
              <SidebarContent pathname={pathname} onSignOut={handleSignOut} />
            </div>
          </div>
        )}
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-grow flex-col overflow-y-auto bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
          <SidebarContent pathname={pathname} onSignOut={handleSignOut} />
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        <main className="py-8">
          {children}
        </main>
      </div>
    </div>
  );
}

function SidebarContent({ pathname, onSignOut }: { pathname: string; onSignOut: () => void }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex h-16 flex-shrink-0 items-center px-4">
        <Image
          src={Logo}
          alt="Daily Bible Verses"
          width={40}
          height={40}
          className="rounded-full"
        />
        <span className="ml-2 text-xl font-semibold text-gray-900 dark:text-white">
          Daily Bible
        </span>
      </div>
      <div className="flex flex-1 flex-col overflow-y-auto">
        <nav className="flex-1 space-y-1 px-2 py-4">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`
                  group flex items-center px-2 py-2 text-sm font-medium rounded-md
                  ${isActive
                    ? 'bg-gray-100 dark:bg-gray-700 text-primary'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }
                `}
              >
                <item.icon
                  className={`
                    mr-3 h-5 w-5 flex-shrink-0
                    ${isActive
                      ? 'text-primary'
                      : 'text-gray-400 dark:text-gray-300 group-hover:text-gray-500'
                    }
                  `}
                />
                {item.name}
              </Link>
            );
          })}

          {/* Admin section */}
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-gray-200 dark:border-gray-700" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white dark:bg-gray-800 px-2 text-sm text-gray-500 dark:text-gray-400">
                Admin
              </span>
            </div>
          </div>

          {adminNavigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`
                  group flex items-center px-2 py-2 text-sm font-medium rounded-md
                  ${isActive
                    ? 'bg-gray-100 dark:bg-gray-700 text-primary'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }
                `}
              >
                <item.icon
                  className={`
                    mr-3 h-5 w-5 flex-shrink-0
                    ${isActive
                      ? 'text-primary'
                      : 'text-gray-400 dark:text-gray-300 group-hover:text-gray-500'
                    }
                  `}
                />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="flex flex-shrink-0 border-t border-gray-200 dark:border-gray-700 p-4">
          <Button
            onClick={onSignOut}
            className="w-full"
            color="danger"
            variant="flat"
          >
            <LogOut className="mr-2 h-5 w-5" />
            Sign out
          </Button>
        </div>
      </div>
    </div>
  );
} 