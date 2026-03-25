"use client"

import * as React from "react"
import type {
  FieldPath,
  FieldValues,
  UseControllerProps,
} from "react-hook-form"
import type { DateRange } from "react-day-picker"

import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../../components/form"
import { Input } from "../../components/input"
import { Textarea } from "../../components/textarea"
import { Checkbox } from "../../components/checkbox"
import { Switch } from "../../components/switch"
import { RadioGroup, RadioGroupItem } from "../../components/radio-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/select"
import { DatePicker, DateRangePicker } from "../../components/date-picker"
import { Label } from "../../components/label"
import { cn } from "../../lib/utils"

// ── Shared option type ────────────────────────────────────

interface FieldOption {
  label: string
  value: string
  disabled?: boolean
}

// ── InputField ────────────────────────────────────────────

interface InputFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> extends UseControllerProps<TFieldValues, TName> {
  label?: string
  description?: string
  placeholder?: string
  type?: React.HTMLInputTypeAttribute
  disabled?: boolean
  className?: string
}

function InputField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  label,
  description,
  placeholder,
  type = "text",
  disabled,
  className,
  ...controllerProps
}: InputFieldProps<TFieldValues, TName>) {
  return (
    <FormField
      {...controllerProps}
      render={({ field }) => (
        <FormItem className={className}>
          {label && <FormLabel>{label}</FormLabel>}
          <FormControl>
            <Input
              type={type}
              placeholder={placeholder}
              disabled={disabled}
              {...field}
              value={field.value ?? ""}
            />
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

// ── TextareaField ─────────────────────────────────────────

interface TextareaFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> extends UseControllerProps<TFieldValues, TName> {
  label?: string
  description?: string
  placeholder?: string
  disabled?: boolean
  rows?: number
  className?: string
}

function TextareaField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  label,
  description,
  placeholder,
  disabled,
  rows,
  className,
  ...controllerProps
}: TextareaFieldProps<TFieldValues, TName>) {
  return (
    <FormField
      {...controllerProps}
      render={({ field }) => (
        <FormItem className={className}>
          {label && <FormLabel>{label}</FormLabel>}
          <FormControl>
            <Textarea
              placeholder={placeholder}
              disabled={disabled}
              rows={rows}
              {...field}
              value={field.value ?? ""}
            />
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

// ── SelectField ───────────────────────────────────────────

interface SelectFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> extends UseControllerProps<TFieldValues, TName> {
  label?: string
  description?: string
  placeholder?: string
  options: FieldOption[]
  disabled?: boolean
  className?: string
}

function SelectField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  label,
  description,
  placeholder = "Select an option",
  options,
  disabled,
  className,
  ...controllerProps
}: SelectFieldProps<TFieldValues, TName>) {
  return (
    <FormField
      {...controllerProps}
      render={({ field }) => (
        <FormItem className={className}>
          {label && <FormLabel>{label}</FormLabel>}
          <Select
            onValueChange={field.onChange}
            value={field.value ?? ""}
            disabled={disabled}
          >
            <FormControl>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={placeholder} />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {options.map((option) => (
                <SelectItem
                  key={option.value}
                  value={option.value}
                  disabled={option.disabled}
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

// ── CheckboxField ─────────────────────────────────────────

interface CheckboxFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> extends UseControllerProps<TFieldValues, TName> {
  label?: string
  description?: string
  disabled?: boolean
  className?: string
}

function CheckboxField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  label,
  description,
  disabled,
  className,
  ...controllerProps
}: CheckboxFieldProps<TFieldValues, TName>) {
  return (
    <FormField
      {...controllerProps}
      render={({ field }) => (
        <FormItem
          className={cn("flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4", className)}
        >
          <FormControl>
            <Checkbox
              checked={field.value}
              onCheckedChange={field.onChange}
              disabled={disabled}
            />
          </FormControl>
          <div className="space-y-1 leading-none">
            {label && <FormLabel>{label}</FormLabel>}
            {description && <FormDescription>{description}</FormDescription>}
            <FormMessage />
          </div>
        </FormItem>
      )}
    />
  )
}

// ── SwitchField ───────────────────────────────────────────

interface SwitchFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> extends UseControllerProps<TFieldValues, TName> {
  label?: string
  description?: string
  disabled?: boolean
  className?: string
}

function SwitchField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  label,
  description,
  disabled,
  className,
  ...controllerProps
}: SwitchFieldProps<TFieldValues, TName>) {
  return (
    <FormField
      {...controllerProps}
      render={({ field }) => (
        <FormItem
          className={cn("flex flex-row items-center justify-between rounded-lg border p-3 shadow-xs", className)}
        >
          <div className="space-y-0.5">
            {label && <FormLabel>{label}</FormLabel>}
            {description && <FormDescription>{description}</FormDescription>}
          </div>
          <FormControl>
            <Switch
              checked={field.value}
              onCheckedChange={field.onChange}
              disabled={disabled}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

// ── RadioGroupField ───────────────────────────────────────

interface RadioGroupFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> extends UseControllerProps<TFieldValues, TName> {
  label?: string
  description?: string
  options: FieldOption[]
  disabled?: boolean
  className?: string
}

function RadioGroupField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  label,
  description,
  options,
  disabled,
  className,
  ...controllerProps
}: RadioGroupFieldProps<TFieldValues, TName>) {
  return (
    <FormField
      {...controllerProps}
      render={({ field }) => (
        <FormItem className={className}>
          {label && <FormLabel>{label}</FormLabel>}
          <FormControl>
            <RadioGroup
              onValueChange={field.onChange}
              value={field.value}
              disabled={disabled}
              className="flex flex-col space-y-1"
            >
              {options.map((option) => (
                <div key={option.value} className="flex items-center space-x-3 space-y-0">
                  <RadioGroupItem value={option.value} id={option.value} disabled={option.disabled} />
                  <Label htmlFor={option.value} className="font-normal cursor-pointer">
                    {option.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

// ── DatePickerField ───────────────────────────────────────

interface DatePickerFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> extends UseControllerProps<TFieldValues, TName> {
  label?: string
  description?: string
  placeholder?: string
  disabled?: boolean
  dateFormat?: string
  className?: string
}

function DatePickerField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  label,
  description,
  placeholder,
  disabled,
  dateFormat,
  className,
  ...controllerProps
}: DatePickerFieldProps<TFieldValues, TName>) {
  return (
    <FormField
      {...controllerProps}
      render={({ field }) => (
        <FormItem className={cn("flex flex-col", className)}>
          {label && <FormLabel>{label}</FormLabel>}
          <FormControl>
            <DatePicker
              value={field.value}
              onChange={field.onChange}
              placeholder={placeholder}
              disabled={disabled}
              dateFormat={dateFormat}
            />
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

// ── DateRangePickerField ──────────────────────────────────

interface DateRangePickerFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> extends UseControllerProps<TFieldValues, TName> {
  label?: string
  description?: string
  placeholder?: string
  disabled?: boolean
  dateFormat?: string
  numberOfMonths?: number
  className?: string
}

function DateRangePickerField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  label,
  description,
  placeholder,
  disabled,
  dateFormat,
  numberOfMonths,
  className,
  ...controllerProps
}: DateRangePickerFieldProps<TFieldValues, TName>) {
  return (
    <FormField
      {...controllerProps}
      render={({ field }) => (
        <FormItem className={cn("flex flex-col", className)}>
          {label && <FormLabel>{label}</FormLabel>}
          <FormControl>
            <DateRangePicker
              value={field.value as DateRange | undefined}
              onChange={field.onChange}
              placeholder={placeholder}
              disabled={disabled}
              dateFormat={dateFormat}
              numberOfMonths={numberOfMonths}
            />
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

export {
  InputField,
  TextareaField,
  SelectField,
  CheckboxField,
  SwitchField,
  RadioGroupField,
  DatePickerField,
  DateRangePickerField,
}
export type { FieldOption }
