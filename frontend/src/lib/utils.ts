import { clsx, type ClassValue } from "clsx"
import moment from "moment";
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

// Helper to get a clean file type display string
export const getFileType = (mimeType: string, originalFileName: string) => {
  if (mimeType.includes('/pdf')) return 'PDF';
  if (mimeType.includes('/json')) return 'JSON';
  if (mimeType.includes('/csv')) return 'CSV';
  const parts = originalFileName.split('.');
  return parts.length > 1 ? parts.pop()?.toUpperCase() : 'FILE';
};

// Helper to format file size
export const formatSize = (bytes: number) => {
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

// Helper to format date using moment
export const formatDate = (dateString: string) => {
  return moment(dateString).format('MMM D, YYYY');
};