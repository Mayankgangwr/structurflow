const BackgroundPattern = () => {
    return (
        // Decorative background elements
        <div className="absolute inset-0 pointer-events-none opacity-40">
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary-fixed-dim blur-3xl mix-blend-multiply"></div>
            <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-secondary-fixed-dim blur-3xl mix-blend-multiply"></div>
        </div>
    );
}

export default BackgroundPattern;

