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
  extends Omit<React.FormHTMLAttributes<HTMLFormElement>, 'onSubmit'> {
  form: UseFormReturn<TFieldValues>;
  onSubmit?: (data: TFieldValues) => void | Promise<void>;
}

const Form = <TFieldValues extends FieldValues = FieldValues>({
  form,
  className,
  onSubmit,
  children,
  ...props
}: FormProps<TFieldValues>) => {
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (onSubmit) {
      await form.handleSubmit(onSubmit)(e);
    }
  };

  return (
    <FormProvider {...form}>
      <form
        onSubmit={handleSubmit}
        className={cn("space-y-6", className)}
        {...props}
      >
        {children}
      </form>
    </FormProvider>
  );
}
Form.displayName = "Form"

const FormItem = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("space-y-2", className)}
        {...props}
      />
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

interface FormFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> {
  name: TName;
  control?: Control<TFieldValues>;
  render: (props: {
    field: ControllerRenderProps<TFieldValues, TName>;
  }) => React.ReactElement;
}

const FormField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  name,
  control,
  render
}: FormFieldProps<TFieldValues, TName>) => {
  const formContext = useFormContext<TFieldValues>();
  const formControl = control || formContext?.control;

  if (!formControl) {
    throw new Error(
      "FormField must be used within a Form or be passed a control prop"
    );
  }

  return (
    <Controller
      control={formControl}
      name={name}
      render={({ field }) => render({ field })}
    />
  );
}

FormField.displayName = "FormField"

export {
  Form,
  FormItem,
  FormControl,
  FormMessage,
  FormField
}
