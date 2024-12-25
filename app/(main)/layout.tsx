// app/(main)/layout.tsx
// This file is used to handle the layout of the main pages
// It is used to display the sidebar and the main content

"use client";

import React from "react";
import { Navbar } from "@/components/Navbar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      {/* Main content */}
      <div className="lg:pl-64"> {/* Keep the padding for desktop layout */}
        <main className="py-8">
          {children}
        </main>
      </div>
    </div>
  );
} 