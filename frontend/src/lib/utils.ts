import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getPageDetails(pathname: string): { title: string, description: string } {
  if (pathname.startsWith('/dashboard')) {
    return {
      title: "Dashboard",
      description: 'Overview of your document processing activity'
    };
  }
  if (pathname.startsWith('/project')) {
    return {
      title: 'Projects',
      description: 'Manage and organize your processing workflows.'
    };
  }

  if (pathname.startsWith('/documents')) {
    return {
      title: 'Documents',
      description: 'View and manage all your processed documents.'
    };
  }

  if (pathname.startsWith('/team')) {
    return {
      title: 'Team',
      description: 'Manage your organization members and roles.'
    };
  }

  if (pathname.startsWith('/settings')) {
    return {
      title: 'Settings',
      description: 'Configure your organization and personal preferences.'
    };
  }

  // Default to Dashboard
  return {
    title: 'Dashboard',
    description: 'Overview of your document processing activity'
  };
}
