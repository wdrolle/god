// components/ui/form.tsx
// This file is used to handle the form component
// It is used to display the form component which is used to handle the form validation

"use client"

import * as React from "react"
import {
  useFormContext,
  UseFormReturn,
  FieldValues,
  FieldPath,
  Controller,
  ControllerRenderProps,
  FormProvider,
  Control,
} from "react-hook-form"
import { cn } from "@/lib/utils"

interface FormProps<TFieldValues extends FieldValues = FieldValues>
  extends Omit<React.FormHTMLAttributes<HTMLFormElement>, "onSubmit"> {
  form: UseFormReturn<TFieldValues>
  onSubmit: (data: TFieldValues) => void
}

const Form = <TFieldValues extends FieldValues>({
  form,
  onSubmit,
  children,
  className,
  ...props
}: FormProps<TFieldValues>) => (
  <FormProvider {...form}>
    <form onSubmit={form.handleSubmit(onSubmit)} className={cn("space-y-6", className)} {...props}>
      {children}
    </form>
  </FormProvider>
)

const FormField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  name,
  control,
  render,
}: {
  name: TName;
  control: Control<TFieldValues>;
  render: (props: { field: ControllerRenderProps<TFieldValues, TName> }) => React.ReactElement;
}) => {
  return <Controller control={control} name={name} render={render} />;
};

const FormItem = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return (
      <div ref={ref} className={cn("space-y-2", className)} {...props} />
    )
  }
)
FormItem.displayName = "FormItem"

const FormControl = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ ...props }, ref) => {
    return <div ref={ref} {...props} />
  }
)
FormControl.displayName = "FormControl"

const FormMessage = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <p
        ref={ref}
        className={cn("text-sm font-medium text-red-500", className)}
        {...props}
      >
        {children}
      </p>
    )
  }
)
FormMessage.displayName = "FormMessage"

export {
  Form,
  FormItem,
  FormControl,
  FormMessage,
  FormField,
}
