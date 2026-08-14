import crypto from "crypto";

// Generate OTP
export const generateOtp = () => `${Math.floor(100000 + Math.random() * 900000)}`;

// Generate token
export const generateToken = (length = 48) => crypto.randomBytes(length).toString("hex");

export const generateWorkspaceName = (firstName: string) => {
  const name = `${firstName.trim()}'s Workspace`;

  const slug = `${firstName.trim()}-s-workspace`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  return {
    name,
    slug,
  };
};

export const generateSlug = (name: string): string => {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
};