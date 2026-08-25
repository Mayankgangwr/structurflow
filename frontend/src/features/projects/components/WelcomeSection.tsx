import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

const WelcomeSection: React.FC = () => {
    return (
        <section className="flex xs:hidden w-full justify-between items-center">
            <div>
                <h2 className="font-headline-lg text-headline-lg text-text-primary">Projects</h2>
                {/* <p className="font-body-md text-body-md text-on-surface-variant mt-xs">Manage and organize your processing workflows.</p> */}
            </div>

            <Button
                className={`bg-primary !text-white hover:!text-white font-label-md hover:bg-primary-container transition-colors shrink-0`}
                title={"New Project"}
            >
                <div className="flex items-center gap-2">
                    <Plus className="h-5 w-5" />
                    <span>New Project</span>
                </div>
            </Button>
        </section>
    )
}

export default WelcomeSection;