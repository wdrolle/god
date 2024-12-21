// app/(auth)/signup/Signup.tsx
// This file is used to handle the signup page
// It is used to create a new user account

"use client";

import { useForm, ControllerRenderProps, FieldValues } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@nextui-org/react";
import { useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import Logo from "@/assets/images/logo_God.jpg";
import { toast } from "sonner";
import { Loader2, MailCheck, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import SignUpModal from "@/components/modals/SignUpModal";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import dynamic from "next/dynamic";

const Confetti = dynamic(() => import("react-confetti"), {
  ssr: false,
});

const FormSchema = z
  .object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirm_password: z.string(),
    username: z.string().min(3, "Username must be at least 3 characters"),
    first_name: z.string().min(1, "First name is required"),
    last_name: z.string().min(1, "Last name is required"),
    bank_name: z.string().min(1, "Bank name is required"),
    bank_address: z.string().min(1, "Bank address is required"),
    phone: z.string().min(1, "Phone number is required"),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  });

type FormData = z.infer<typeof FormSchema>;

export default function SignupPage() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { theme, setTheme } = useTheme();
  const [showConfetti, setShowConfetti] = useState(false);
  const [mounted, setMounted] = useState(false); // Ensure client-side mounting before rendering dimensions

  const [screenDimensions, setScreenDimensions] = useState<{ width: number; height: number }>(
    { width: 0, height: 0 }
  );

  useEffect(() => {
    // Mark that the component has mounted so client-only code can run
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && typeof window !== "undefined") {
      const handleResize = () => {
        setScreenDimensions({
          width: window.innerWidth * 0.95,
          height: window.innerHeight * 0.95,
        });
      };

      window.addEventListener("resize", handleResize, { passive: true });
      return () => window.removeEventListener("resize", handleResize);
    }
  }, [mounted]);

  useEffect(() => {
    if (showConfetti) {
      const timer = setTimeout(() => setShowConfetti(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [showConfetti]);

  const COLORS = {
    light: {
      separator: "bg-gray-200",
      border: "border-gray-300",
      background: "bg-white",
      text: "text-gray-900",
    },
    dark: {
      separator: "bg-gray-700",
      border: "border-gray-600",
      background: "bg-gray-900",
      text: "text-white",
    },
  } as const;

  const currentThemeStyles = COLORS[theme as "dark" | "light"] || COLORS.light;

  const form = useForm<FormData>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      email: "",
      password: "",
      confirm_password: "",
      username: "",
      first_name: "",
      last_name: "",
      bank_name: "",
      bank_address: "",
      phone: "",
    },
  });

  function formatPhoneNumber(phone: string): string {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length <= 3) {
      return `(${cleaned}`;
    } else if (cleaned.length <= 6) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
    } else {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
    }
  }

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "An unexpected error occurred");
        console.error(result.error);
      } else {
        setShowConfetti(true);
        toast.success(
          "Signup successful! Please check your email to confirm your account.",
          { duration: 5000 }
        );
        form.reset();
      }
    } catch (error) {
      setError("An unexpected error occurred");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const currentTheme =
    theme === "dark" ||
    (!theme &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches)
      ? "dark"
      : "light";

  const bodyCell = `text-left align-middle text-sm p-2 break-words ${
    currentTheme === "dark" ? "text-white" : "text-black"
  }`;

  const headerCell = `text-left align-middle text-sm font-bold p-2 bg-transparent ${
    currentTheme === "dark" ? "text-white" : "text-black"
  }`;

  return (
    // Only render the dimension-dependent container once mounted
    <div
      className="relative w-full min-h-screen"
      style={
        mounted
          ? { width: `${screenDimensions.width}px`, height: `${screenDimensions.height}px` }
          : {}
      }
    >
      {mounted && showConfetti && (
        <Confetti width={screenDimensions.width} height={screenDimensions.height} />
      )}

      {/* Theme Toggle Button */}
      <div className="absolute top-4 right-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className={`
            rounded-full w-12 h-12 flex items-center justify-center
            bg-white dark:bg-gray-800 border-gray-300 
            hover:bg-gray-200 dark:hover:bg-gray-700 
            ${currentThemeStyles.text}
          `}
          type="button"
        >
          {theme === "dark" ? (
            <Sun className="h-[1.2rem] w-[1.2rem]" />
          ) : (
            <Moon className="h-[1.2rem] w-[1.2rem]" />
          )}
          <span className="sr-only">Toggle theme</span>
        </Button>
      </div>

      {/* Only render form once mounted, to ensure no SSR/CSR mismatches */}
      {mounted && (
        <Form 
          form={form} 
          onSubmit={async (data: FormData) => {
            setIsLoading(true);
            setError(null);
            try {
              await onSubmit(data);
            } catch (error) {
              setError("An unexpected error occurred");
              console.error(error);
            } finally {
              setIsLoading(false);
            }
          }} 
          className="space-y-4"
        >
          {/* Logo and Title */}
          <div className="flex flex-col items-center text-center mb-4">
            <Link href="/" className="flex flex-col items-center">
              <Image
                src={Logo}
                alt="co-lab ai Logo"
                width={150}
                height={150}
                priority
              />
              <span className="font-semibold dark:text-white text-3xl mt-2 mb-2">
                INHERENT RISK AI
              </span>
            </Link>
          </div>

          {/* Tagline */}
          <div className={`text-center text-lg pb-4 bg-transparent ${currentThemeStyles.text}`}>
            Your AI-Powered Platform for Comprehensive Risk Assessments:
            <br />
            Analyze, Mitigate, and Manage Residual Risk with Confidence.
          </div>

          {!error && (
            <>
              <div className="w-full max-w-[600px] mx-auto space-y-4">
                <div className="flex space-x-4">
                  <FormField
                    control={form.control}
                    name="first_name"
                    render={({ field }: { field: ControllerRenderProps<FormData> }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Input
                            type="text"
                            placeholder="First Name"
                            {...field}
                            autoComplete="off"
                            required
                            className={`
                              text-center text-xl p-3 bg-transparent rounded-full
                              ${currentThemeStyles.text} border-2 border-gray-300
                            `}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="last_name"
                    render={({ field }: { field: ControllerRenderProps<FormData> }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Input
                            type="text"
                            placeholder="Last Name"
                            {...field}
                            autoComplete="off"
                            required
                            className={`
                              text-center text-xl p-3 bg-transparent rounded-full
                              ${currentThemeStyles.text} border-2 border-gray-300
                            `}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="flex space-x-4">
                  <FormField
                    control={form.control}
                    name="bank_name"
                    render={({ field }: { field: ControllerRenderProps<FormData> }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Input
                            type="text"
                            placeholder="Client Name"
                            {...field}
                            autoComplete="off"
                            required
                            className={`
                              text-center text-xl p-3 bg-transparent rounded-full
                              ${currentThemeStyles.text} border-2 border-gray-300
                            `}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="bank_address"
                    render={({ field }: { field: ControllerRenderProps<FormData> }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Input
                            type="text"
                            placeholder="Client Address"
                            {...field}
                            autoComplete="off"
                            required
                            className={`
                              text-center text-xl p-3 bg-transparent rounded-full
                              ${currentThemeStyles.text} border-2 border-gray-300
                            `}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="flex space-x-4">
                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }: { field: ControllerRenderProps<FormData> }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Input
                            type="text"
                            placeholder="Username"
                            {...field}
                            required
                            className={`
                              text-center text-xl p-3 bg-transparent rounded-full
                              ${currentThemeStyles.text} border-2 border-gray-300
                            `}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }: { field: ControllerRenderProps<FormData> }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Input
                            type="text"
                            placeholder="Phone Number"
                            {...field}
                            required
                            onChange={(e) => field.onChange(formatPhoneNumber(e.target.value))}
                            className={`
                              text-center text-xl p-3 bg-transparent rounded-full
                              ${currentThemeStyles.text} border-2 border-gray-300
                            `}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }: { field: ControllerRenderProps<FormData> }) => (
                    <FormItem className="flex-1">
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="Email"
                          {...field}
                          autoComplete="off"
                          required
                          className={`
                            text-center text-xl p-3 bg-transparent rounded-full
                            ${currentThemeStyles.text} border-2 border-gray-300
                          `}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex space-x-4">
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }: { field: ControllerRenderProps<FormData> }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="Password"
                            {...field}
                            autoComplete="new-password"
                            required
                            className={`
                              text-center text-xl p-3 bg-transparent rounded-full
                              ${currentThemeStyles.text} border-2 border-gray-300
                            `}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="confirm_password"
                    render={({ field }: { field: ControllerRenderProps<FormData> }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="Confirm Password"
                            {...field}
                            required
                            className={`
                              text-center text-xl p-3 bg-transparent rounded-full
                              ${currentThemeStyles.text} border-2 border-gray-300
                            `}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </>
          )}

          {error && (
            <Alert className="bg-red-100 border-red-400 text-red-700">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold"
            size="lg"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                <p className="text-sm">Creating Account...</p>
              </div>
            ) : (
              "Create Account"
            )}
          </Button>
          <span className="self-center text-lg block text-center">
            Already have an account?{" "}
            <Link href="/login" className="text-primary font-semibold">
              Log In
            </Link>
          </span>
        </Form>
      )}
    </div>
  );
}
