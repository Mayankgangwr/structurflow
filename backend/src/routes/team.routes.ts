import { teamController } from "@/controllers/team.controller";
import { requireAuth } from "@/middlewares/auth.middleware";
import { validateRequest } from "@/middlewares/validate.middleware";
import { inviteMemberSchema } from "@/schemas/team.schema";
import { Router } from "express";

const teamRouter = Router();

teamRouter.use(requireAuth);

teamRouter.post('/', validateRequest(inviteMemberSchema), teamController.invite);

export default teamRouter;