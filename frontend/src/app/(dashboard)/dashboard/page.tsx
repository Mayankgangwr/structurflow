import { Button } from "@/components/ui/button";

const DashboardPage = () => {
    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold tracking-tight">Dashboard overview</h2>

            <div className="p-6 bg-white rounded-lg border border-slate-200">
                <p className="text-slate-500 mb-4">
                    Welcome to the StructurFlow dashboard This is the foundation.
                </p>
                <Button>Test Button Component</Button>
            </div>
        </div>
    )

}

export default DashboardPage;