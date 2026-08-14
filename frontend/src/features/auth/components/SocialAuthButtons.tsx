import clsx from "clsx";
import React from "react";
import Image from "next/image";

interface SocialAuthButtonsProps {
    includeWhatsApp?: boolean;
    includeFacebook?: boolean;
}

export const SocialAuthButtons: React.FC<SocialAuthButtonsProps> = ({ includeWhatsApp = false, includeFacebook = false }) => {
    
    // Shared classes matching Image 4.html .social-btn
    const btnClasses = "w-full h-11 md:h-10 rounded flex items-center justify-center gap-sm text-[13px] leading-[16px] font-semibold tracking-[0.01em] transition-colors bg-white border border-[#DADDE1] text-[#191c1f] hover:bg-surface-container-low focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2";
    
    return (
        <div className="w-full flex flex-col gap-md">
            <button type="button" className={btnClasses}>
                {/* Normally you'd use next/image or lucide icons. I'll use standard img tags matching the HTML. */}
                <img alt="Google Logo" className="w-5 h-5" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBgiC4IGD_j6AGu6XX__mOwR2rnJ9Z_60s5w5Xd4fxhUVIjSQbI01ZENAE8KtdAJBiTibwnC9Vyd-WV3Yu98w1kepdtwZ8p0yaRnJzBuhqwiCdqD1Yy9k-__xKpix-aGI6bfpXowWccKTWDxOdDKx_pC86INfcsbOnt-rw8bET9pwvNNor_Ws79mWjdrWzmnYofRQeVnUNiArIN57VSyHLn8cyMfY5kxIEKYyCC5kMp1yZ28_FGvsEp"/>
                Continue with Google
            </button>
            
            {includeFacebook && (
                <button type="button" className={btnClasses}>
                    <img alt="Facebook Logo" className="w-5 h-5" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDGBW-T1RLsPx6E0PGjszU0qYP9SnKyDCqEbhLigx8TQH5VEiKNUHxvMGpVXjQBTRqYmbiSDjT9uvmAtMwGxD6pQF3dEkF3JNcJgscUbvkCatD7TTHEPWsNgofrhl8z5vnwYzhOePJxa1PkBCE6IrbG2tFsXzZGblhdhJMN4TMWwGVVhlNO4wgj14rnH63Bjy2uxzouJk0byTCMxe226tugYCQc_GfLajDl6Bb3dnkE23Xp6afAxgCm"/>
                    Continue with Facebook
                </button>
            )}
            
            {includeWhatsApp && (
                <button type="button" className={btnClasses}>
                    <img alt="WhatsApp Logo" className="w-5 h-5" src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg"/>
                    Continue with WhatsApp
                </button>
            )}
        </div>
    );
};
