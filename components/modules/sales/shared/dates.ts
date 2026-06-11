import dayjs, { type Dayjs } from "dayjs";

// antd's DatePicker works in dayjs objects; Django DateField wants "YYYY-MM-DD".
// These bridge the two so every sales form handles dates the same way.

/** ISO date string → dayjs for seeding a DatePicker (undefined when blank). */
export function toPicker(value: string | null | undefined): Dayjs | undefined {
  if (!value) return undefined;
  const d = dayjs(value);
  return d.isValid() ? d : undefined;
}

/** DatePicker value (dayjs) → "YYYY-MM-DD" for the API (null when blank). */
export function fromPicker(value: Dayjs | null | undefined): string | null {
  return value && dayjs.isDayjs(value) && value.isValid() ? value.format("YYYY-MM-DD") : null;
}
