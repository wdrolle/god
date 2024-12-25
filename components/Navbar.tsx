"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";
import { useState } from 'react';
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

export function Navbar() {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const router = useRouter();
  const supabase = createClientComponentClient();

  const handleSignOut = () => {
    supabase.auth.signOut()
      .then(() => {
        router.push("/login");
      })
      .catch((error) => {
        console.error("Error signing out:", error);
      });
  };

  return (
    <>
      {/* Main Navbar */}
      <div className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center px-4">
          {/* Hamburger Menu */}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="mr-4 p-2 hover:bg-accent rounded-md"
          >
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          
          <div className="flex flex-1 items-center justify-between">
            <div className="flex items-center">
              <Image
                src={Logo}
                alt="Daily Bible Verses"
                width={32}
                height={32}
                className="rounded-full"
              />
              <span className="ml-2 font-semibold text-lg">Daily Bible</span>
            </div>
            <div className="ml-auto">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div
        className={cn(
          "fixed top-14 left-0 z-50 w-64 h-[calc(100vh-3.5rem)] bg-background border-r transform transition-transform duration-200 ease-in-out overflow-y-auto",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <nav className="flex flex-col p-4 space-y-1">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors",
                pathname === item.href
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent"
              )}
              onClick={() => setIsSidebarOpen(false)}
            >
              <item.icon className="mr-3 h-5 w-5" />
              {item.name}
            </Link>
          ))}

          {/* Admin section */}
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200 dark:border-gray-700" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-background px-2 text-sm text-muted-foreground">
                Admin
              </span>
            </div>
          </div>

          {adminNavigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors",
                pathname === item.href
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent"
              )}
              onClick={() => setIsSidebarOpen(false)}
            >
              <item.icon className="mr-3 h-5 w-5" />
              {item.name}
            </Link>
          ))}
        </nav>

        {/* Sign Out Button */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleSignOut}
            className="flex w-full items-center px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/10 rounded-md transition-colors"
          >
            <LogOut className="mr-3 h-5 w-5" />
            Sign out
          </button>
        </div>
      </div>

      {/* Backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-background/80 backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </>
  );
} 