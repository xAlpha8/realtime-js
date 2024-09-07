import React from "react";
import { FormDescription, FormItem, FormLabel } from "./__internal/form";
import { Input } from "./__internal/input";

export type TRealtimeFunctionURLInputProps = {
  /**
   * @default "https://infra.getadapt.ai/run/..."
   */
  placeholder?: string;

  /**
   * @default "Function URL"
   */
  label?: string;

  /**
   * Optional description text.
   * This will be shown below the select.
   */
  description?: string;
  /**
   * Callback when the value changes.
   */
  onChange: (e: React.FormEvent<HTMLInputElement>) => void;
};

export function RealtimeFunctionURLInput(
  props: TRealtimeFunctionURLInputProps
) {
  const {
    onChange,
    placeholder = "https://infra.getadapt.ai/run/...",
    description,
    label = "Function URL",
  } = props;

  return (
    <FormItem>
      <FormLabel htmlFor="FunctionURL-device">{label}</FormLabel>
      <Input placeholder={placeholder} onChange={onChange} />
      {description && <FormDescription>{description}</FormDescription>}
    </FormItem>
  );
}
