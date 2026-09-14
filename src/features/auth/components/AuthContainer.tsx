import React from "react";

interface IPageContainer {
    children: React.ReactNode;
}

const AuthContainer: React.FC<IPageContainer> = ({ children }) => {
    return (
        <main className="w-full max-w-container-max relative z-10 bg-surface-container-lowest rounded-xl shadow-[0px_4px_12px_rgba(0,0,0,0.08)] px-lg pt-lg pb-1.5 text-center border border-surface-container-low">
            {children}
        </main>
    )
}

export default AuthContainer;