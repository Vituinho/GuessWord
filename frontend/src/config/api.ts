export const LOCAL_API_URL = "http://127.0.0.1:8000/api";

export function getEnvApiUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL ?? LOCAL_API_URL;
}
