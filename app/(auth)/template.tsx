// app/(auth)/template.tsx
// This file is used to handle the template for the auth pages
// It is used to display the template for the auth pages

"use client";

import { Spinner } from "@nextui-org/spinner";
import React, { Suspense } from "react";

interface TemplateProps {
  children: React.ReactNode;
}

const Template: React.FC<TemplateProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full space-y-8 bg-transparent">
        <Suspense 
          fallback={
            <div className="flex flex-col items-center justify-center h-full">
              <Spinner size="lg" />
            </div>
          }
        >
          {children}
        </Suspense>
      </div>
    </div>
  );
};

export default Template;

