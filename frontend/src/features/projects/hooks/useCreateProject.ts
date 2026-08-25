import { useRouter } from "next/navigation";
import { useState } from "react"
import { useCreateProjectMutation } from "../projectApi";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createProjectSchema } from "../schema";
import { CreateProjectDto } from "../types";

const useCreateProject = (orgId: string) => {
    const [apierror, setApiError] = useState("");
    const router = useRouter();
    const [createProject, { isLoading }] = useCreateProjectMutation();

    const form = useForm<CreateProjectDto>({
        resolver: zodResolver(createProjectSchema),
        mode: "onBlur",  // Advanced: Validate fields as soon as the user leaves them
        defaultValues: {
            name: "",
            description: "",
            templateDocumentId: "",
        },
    })

    const { isValid, isDirty, isSubmitting } = form.formState;

    const onSubmit = async (data: CreateProjectDto) => {
        setApiError("");
        try {
            const res = await createProject({ name: data.name, description: data.description }).unwrap();

        } catch (error) {

        }
    }

}