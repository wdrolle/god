// app/(auth)/signup/page.tsx
// This file is used to handle the signup page
// It is used to create a new user account

"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { ControllerRenderProps, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@nextui-org/react";
import Link from "next/link";
import Image from "next/image";
import Logo from "@/assets/images/logo_God.webp";
import { countryCodes, isValidPhoneNumber, formatPhoneNumber } from "@/lib/utils/phone";

// Import the ThemeToggle with SSR disabled
const ThemeToggle = dynamic(
  () => import("@/components/ThemeToggle").then(mod => mod.default),
  {
    ssr: false,
  }
);

type SignupFormData = {
  email: string;
  password: string;
  confirm_password: string;
  first_name: string;
  last_name: string;
  phone: string;
  country_code: string;
};

export default function SignupPage() {
  // 1) Still can use client hooks
  const [isLoading, setIsLoading] = useState(false);
  const [confirmationSent, setConfirmationSent] = useState(false);
  const router = useRouter();
  const supabase = createClientComponentClient();

  // 2) Form + Zod schema
  const signupSchema = z
    .object({
      email: z.string().email(),
      password: z.string().min(6),
      confirm_password: z.string().min(6),
      first_name: z.string().min(2),
      last_name: z.string().min(2),
      country_code: z.string().default("US"),
      phone: z.string().min(10),
    })
    .refine((data) => data.password === data.confirm_password, {
      message: "Passwords don't match",
      path: ["confirm_password"],
    })
    .refine((data) => isValidPhoneNumber(data.phone, data.country_code), {
      message: "Invalid phone number format",
      path: ["phone"],
    });

  const form = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: "",
      password: "",
      confirm_password: "",
      first_name: "",
      last_name: "",
      phone: "",
      country_code: "US",
    },
  });

  // 3) Format phone with country code
  const formatPhoneNumber = (phone: string, country: string) => {
    // your logic or reference phone.ts
    return phone; // simplified
  };

  // 4) onSubmit
  const onSubmit = async (data: SignupFormData) => {
    setIsLoading(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            first_name: data.first_name,
            last_name: data.last_name,
            phone: data.phone,
          }
        }
      });

      if (authError) throw authError;

      // Show confirmation message instead of redirecting
      setConfirmationSent(true);

      // Create user record in god schema
      const response = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: authData.user?.id,
          email: data.email,
          first_name: data.first_name,
          last_name: data.last_name,
          phone: formatPhoneNumber(data.phone, data.country_code),
          country_code: data.country_code,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create user");
      }

    } catch (error) {
      console.error("Signup error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Show confirmation message if email was sent
  if (confirmationSent) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-gray-50 dark:bg-gray-900">
        <div className="w-full max-w-[400px] space-y-6 bg-transparent text-center">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Check your email
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            We've sent you a confirmation link. Please check your email to verify your account.
          </p>
          <Button
            className="mt-4"
            onPress={() => router.push('/login')}
          >
            Return to Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-gray-50 dark:bg-gray-900">
      {/* Theme Toggle button - now client-only */}
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-[400px] space-y-2 bg-transparent">
        {/* Logo + Title */}
        <div className="flex flex-col items-center space-y-2 mb-2">
          <Image
            src={Logo}
            alt="Daily Bible Verses Delivered via Text (SMS)"
            width={80}
            height={80}
            priority
            className="rounded-full"
          />
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Daily Bible Verses
          </h1>
          <p className="text-gray-600 dark:text-gray-300 text-center">
            Sign up to receive daily Bible verses via text message
          </p>
        </div>

        <Form
          form={form}
          onSubmit={onSubmit}
          className="space-y-2 w-full"
        >
          {/* First/Last Name */}
          <div className="flex gap-2">
            <FormField
              name="first_name"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="First Name"
                      className="
                        w-full h-11
                        bg-white/50 dark:bg-gray-800/50
                        border border-gray-200 dark:border-gray-700
                        rounded-md text-gray-900 dark:text-white px-4
                      "
                      required
                    />
                  </FormControl>
                  <FormMessage className="text-red-500" />
                </FormItem>
              )}
            />
            <FormField
              name="last_name"
              render={({ field }: { field: ControllerRenderProps<SignupFormData, "last_name"> }) => (
                <FormItem className="flex-1">
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Last Name"
                      className="
                        w-full h-11
                        bg-white/50 dark:bg-gray-800/50
                        border border-gray-200 dark:border-gray-700
                        rounded-md text-gray-900 dark:text-white px-4
                      "
                      required
                    />
                  </FormControl>
                  <FormMessage className="text-red-500" />
                </FormItem>
              )}
            />
          </div>

          {/* Country code / Phone */}
          <div className="flex gap-2">
            <div className="w-[30%]">
              <FormField
                name="country_code"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <select
                        {...field}
                        className="
                          w-full h-11
                          bg-white/50 dark:bg-gray-800/50
                          border border-gray-200 dark:border-gray-700
                          rounded-md text-gray-900 dark:text-white px-4
                        "
                      >
                        {Object.entries(countryCodes).map(([key, info]) => (
                          <option key={key} value={key}>
                            {`${key} (${info.code})`}
                          </option>
                        ))}
                      </select>
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
            <div className="w-[70%]">
              <FormField
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        {...field}
                        type="tel"
                        placeholder={countryCodes[form.watch("country_code")]?.example}
                        onChange={(e) => {
                          const formatted = formatPhoneNumber(
                            e.target.value,
                            form.watch("country_code")
                          );
                          field.onChange(formatted);
                        }}
                        value={field.value}
                        required
                        className="w-full h-11
                          bg-white/50 dark:bg-gray-800/50
                          border border-gray-200 dark:border-gray-700
                          rounded-md text-gray-900 dark:text-white px-4"
                      />
                    </FormControl>
                    <FormMessage className="text-red-500" />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Email */}
          <FormField
            name="email"
            render={({ field }: { field: ControllerRenderProps<SignupFormData, "email"> }) => (
              <FormItem>
                <FormControl>
                  <Input
                    {...field}
                    type="email"
                    placeholder="Email"
                    autoComplete="email"
                    className="
                      w-full h-11
                      bg-white/50 dark:bg-gray-800/50
                      border border-gray-200 dark:border-gray-700
                      rounded-md text-gray-900 dark:text-white px-4
                    "
                    required
                  />
                </FormControl>
                <FormMessage className="text-red-500" />
              </FormItem>
            )}
          />

          {/* Password / Confirm Password */}
          <div className="flex gap-2">
            <FormField
              name="password"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormControl>
                    <Input
                      {...field}
                      type="password"
                      placeholder="Password"
                      autoComplete="new-password"
                      className="
                        w-full h-11
                        bg-white/50 dark:bg-gray-800/50
                        border border-gray-200 dark:border-gray-700
                        rounded-md text-gray-900 dark:text-white px-4
                      "
                      required
                    />
                  </FormControl>
                  <FormMessage className="text-red-500" />
                </FormItem>
              )}
            />
            <FormField
              name="confirm_password"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormControl>
                    <Input
                      {...field}
                      type="password"
                      placeholder="Confirm Password"
                      autoComplete="new-password"
                      className="
                        w-full h-11
                        bg-white/50 dark:bg-gray-800/50
                        border border-gray-200 dark:border-gray-700
                        rounded-md text-gray-900 dark:text-white px-4
                      "
                      required
                    />
                  </FormControl>
                  <FormMessage className="text-red-500" />
                </FormItem>
              )}
            />
          </div>

          {/* Submit */}
          <div>
            <Button
              type="submit"
              className="
                w-full h-11
                bg-primary hover:bg-primary/90
                dark:bg-primary/80 dark:hover:bg-primary/70
                text-white font-semibold transition-colors
              "
              disabled={isLoading}
            >
              {isLoading ? "Creating Account..." : "Create Account"}
            </Button>
          </div>

          {/* Already have account */}
          <div className="text-center text-sm">
            <span className="text-gray-600 dark:text-gray-400">
              Already have an account?{" "}
              <Link
                href="/login"
                className="text-primary dark:text-primary/80 hover:underline"
              >
                Sign in
              </Link>
            </span>
          </div>
        </Form>
      </div>
    </div>
  );
}
