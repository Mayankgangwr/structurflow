"use client";

import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { usePermissions } from "@/features/auth/hooks/usePermissions";

const WelcomeSection: React.FC = () => {
    const { can } = usePermissions();

    return (
        <section className="flex xs:hidden w-full justify-between items-center">
            <div>
                <h2 className="font-headline-lg text-headline-lg text-text-primary">Projects</h2>
            </div>

            {can("create_project") && (
                <Button
                    className={`bg-primary !text-white hover:!text-white font-label-md hover:bg-primary-container transition-colors shrink-0`}
                    title={"New Project"}
                >
                    <div className="flex items-center gap-2">
                        <Plus className="h-5 w-5" />
                        <span>New Project</span>
                    </div>
                </Button>
            )}
        </section>
    );
};

export default WelcomeSection;