import { snakeCase } from "snake-case";

export const blobToBase64 = (blob: Blob): Promise<string | null> => {
  return new Promise((resolve, _) => {
    const reader = new FileReader();
    reader.onloadend = () =>
      resolve(reader.result?.toString().split(",")[1] || null);
    reader.readAsDataURL(blob);
  });
};

export const stringify = (obj: object): string => {
  return JSON.stringify(obj, (_, value) => {
    if (value && typeof value === "object") {
      return Object.fromEntries(
        Object.entries(value).map(([k, v]) => [snakeCase(k), v])
      );
    }
    return value;
  });
};
