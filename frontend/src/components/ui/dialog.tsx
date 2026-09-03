import { ReactNode, useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  showCloseButton?: boolean;
}

const sizeClasses = {
  sm: "w-[100vw]",
  md: "w-[90vw] max-w-[680px]",
  lg: "w-[90vw] max-w-[720px]",
  xl: "w-[90vw] max-w-[1024px]",
};

export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
  showCloseButton = true,
}: DialogProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!open || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
      />

      {/* Dialog */}
      <div
        className={`relative ${sizeClasses[size]} rounded-t-[1.5rem] sm:rounded-xl bg-surface shadow-xl max-h-[95vh] flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-10 sm:zoom-in-95 duration-200`}
        style={{ minWidth: 'min(100vw, 448px)' }}
      >
        {/* Mobile Drag Handle */}
        <div className="w-full flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-12 h-1.5 rounded-full bg-border-subtle" />
        </div>

        {/* Header */}
        {(title || description || showCloseButton) && (
          <div className="flex items-start justify-between border-b p-4">
            <div className="flex-1 min-w-0">
              {title && (
                <h2 className="text-xl font-bold text-text-primary truncate">
                  {title}
                </h2>
              )}

              {description && (
                <p className="mt-1 text-sm text-secondary truncate">
                  {description}
                </p>
              )}
            </div>

            {showCloseButton && (
              <button
                type="button"
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            )}
          </div>
        )}

        {/* Content */}
        <div className="p-4 overflow-y-auto">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="border-t border-border-subtle p-4 bg-surface-container-lowest">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}