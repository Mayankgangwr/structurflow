import Link from "next/link";

const AuthFooter = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="w-full pt-4 pb-8">
      <div className="w-full flex flex-col items-center gap-4 text-sm text-gray-500">
        {/* Divider */}
        <div className="h-px w-full bg-gray-200" />

        {/* Links */}
        <nav className="flex items-center gap-6">
          <Link
            href="/terms"
            className="transition-colors hover:text-gray-900"
          >
            Terms
          </Link>

          <Link
            href="/privacy"
            className="transition-colors hover:text-gray-900"
          >
            Privacy
          </Link>

          <Link
            href="/support"
            className="transition-colors hover:text-gray-900"
          >
            Support
          </Link>
        </nav>

        {/* Copyright */}
        <p className="text-xs text-gray-400">
          © {year} SocialHub. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

export default AuthFooter;