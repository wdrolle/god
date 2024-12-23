// app/(auth)/login/page.tsx
// This file is used to handle the login page
// It is used to handle the login page and the login form

"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Link from "next/link";
import Image from "next/image";
import Logo from "@/assets/images/logo_God.webp";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "components/ui/form";
import { Input } from "components/ui/input";
import { Button } from "@nextui-org/react";
import dynamic from "next/dynamic";
import { ThemeWrapper } from '@/components/theme-wrapper'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { toast } from 'sonner';

const ThemeToggle = dynamic(
  () => import("components/theme-toggle").then(mod => mod.ThemeToggle),
  {
    ssr: false,
  }
);

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const handleSubmit = (data: LoginFormData) => {
    setIsLoading(true);
    setError(null);

    signIn("credentials", {
      email: data.email.toLowerCase(),
      password: data.password,
      redirect: false
    })
    .then((result) => {
      if (result?.error) {
        throw new Error(result.error);
      }

      if (result?.ok) {
        const returnUrl = new URLSearchParams(window.location.search).get('from');
        router.push(returnUrl || '/dashboard');
        router.refresh();
        toast.success('Successfully signed in!');
      }
    })
    .catch((err) => {
      console.error('Login error:', err);
      setError(err instanceof Error ? err.message : 'Failed to sign in');
      toast.error('Failed to sign in. Please check your credentials.');
    })
    .finally(() => {
      setIsLoading(false);
    });
  };

  return (
    <ThemeWrapper>
      <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-gray-50 dark:bg-gray-900">
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>

        <div className="w-full max-w-[400px] space-y-6 bg-transparent">
          <div className="flex flex-col items-center space-y-4">
            <Image
              src={Logo}
              alt="Daily Bible Verses"
              width={80}
              height={80}
              style={{ width: 'auto', height: 'auto' }}
              priority
              className="rounded-full"
            />
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
              Welcome Back
            </h1>
            <p className="text-gray-600 dark:text-gray-300 text-center">
              Sign in to your account
            </p>
          </div>

          <Form 
            form={form} 
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      {...field}
                      type="email"
                      placeholder="Email"
                      className="w-full h-11 bg-white/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-md text-gray-900 dark:text-white px-4"
                      required
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      {...field}
                      type="password"
                      placeholder="Password"
                      className="w-full h-11 bg-white/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-md text-gray-900 dark:text-white px-4"
                      required
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {error && (
              <p className="text-sm text-red-500 text-center">{error}</p>
            )}

            {error && error.includes('confirm your email') && (
              <Button
                type="button"
                variant="light"
                onPress={() => handleSubmit(form.getValues())}
                className="w-full mt-2"
              >
                Resend Confirmation Email
              </Button>
            )}

            <Button
              type="submit"
              className="w-full h-11 bg-primary hover:bg-primary/90 dark:bg-primary/80 dark:hover:bg-primary/70 text-white font-semibold"
              disabled={isLoading}
            >
              {isLoading ? "Signing in..." : "Sign in"}
            </Button>

            <div className="text-center text-sm">
              <span className="text-gray-600 dark:text-gray-400">
                Don&apos;t have an account?{" "}
                <Link
                  href="/signup"
                  className="text-primary dark:text-primary/80 hover:underline"
                >
                  Sign up
                </Link>
              </span>
            </div>
          </Form>
        </div>
      </div>
    </ThemeWrapper>
  );
}