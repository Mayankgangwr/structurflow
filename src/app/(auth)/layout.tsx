import AuthContainer from '@/features/auth/components/AuthContainer';
import BackgroundPattern from '@/components/layout/BackgroundPattern';
import React from 'react';
import AuthFooter from '@/features/auth/components/AuthFooter';

const AuthLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
        <div className='bg-surface text-on-surface min-h-screen flex items-center justify-center p-4 md:p-8 relative overflow-hidden'>
            <BackgroundPattern />
            <AuthContainer>
                {children}
                <AuthFooter />
            </AuthContainer>
        </div>
    );
}

export default AuthLayout;