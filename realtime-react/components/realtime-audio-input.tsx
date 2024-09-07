import { useAvailableMediaDevices } from "../hooks";
import { FormDescription, FormItem, FormLabel } from "./__internal/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./__internal/select";

export type TRealtimeAudioInputProps = {
  /**
   * @default "Select a audio device"
   */
  placeholder?: string;

  /**
   * @default "audio"
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
  onChange: (value: string) => void;
};

export function RealtimeAudioInput(props: TRealtimeAudioInputProps) {
  const {
    onChange,
    placeholder = "Select audio device",
    label = "Autio",
    description,
  } = props;

  const { availableAudioDevices } = useAvailableMediaDevices();

  return (
    <FormItem>
      <FormLabel htmlFor="audio-device">{label}</FormLabel>
      <Select onValueChange={onChange}>
        <SelectTrigger id="audio-device">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {availableAudioDevices.map(({ deviceId, label }) => (
            <SelectItem key={deviceId} value={deviceId}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {description && <FormDescription>{description}</FormDescription>}
    </FormItem>
  );
}
