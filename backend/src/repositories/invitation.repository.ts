import { InvitationModel, IInvitation, InvitationStatus } from "@/models/invitation.model";
import BaseRepository from "./base.repository";
import mongoose from "mongoose";

class InvitationRepository extends BaseRepository<IInvitation> {
    constructor() {
        super(InvitationModel);
    }

    async findPendingByOrg(organizationId: string) {
        return this.model
            .find({
                organizationId: new mongoose.Types.ObjectId(organizationId),
                status: InvitationStatus.PENDING,
                expiresAt: { $gt: new Date() },
            })
            .populate("inviterId", "firstName lastName email")
            .sort({ createdAt: -1 })
            .lean();
    }

    async findPendingByOrgAndEmail(organizationId: string, email: string) {
        return this.model
            .findOne({
                organizationId: new mongoose.Types.ObjectId(organizationId),
                email: email.toLowerCase().trim(),
                status: InvitationStatus.PENDING,
                expiresAt: { $gt: new Date() },
            })
            .exec();
    }

    async findByToken(token: string) {
        return this.model
            .findOne({ token })
            .populate("organizationId", "name")
            .populate("inviterId", "firstName lastName email")
            .exec();
    }

    async revoke(inviteId: string, organizationId: string) {
        return this.model
            .findOneAndUpdate(
                {
                    _id: new mongoose.Types.ObjectId(inviteId),
                    organizationId: new mongoose.Types.ObjectId(organizationId),
                    status: InvitationStatus.PENDING,
                },
                { status: InvitationStatus.REVOKED },
                { new: true }
            )
            .exec();
    }

    async markAccepted(token: string) {
        return this.model
            .findOneAndUpdate(
                { token, status: InvitationStatus.PENDING },
                { status: InvitationStatus.ACCEPTED },
                { new: true }
            )
            .exec();
    }

    async countPendingByOrg(organizationId: string): Promise<number> {
        return this.model.countDocuments({
            organizationId: new mongoose.Types.ObjectId(organizationId),
            status: InvitationStatus.PENDING,
            expiresAt: { $gt: new Date() },
        });
    }
}

const invitationRepository = new InvitationRepository();
export default invitationRepository;
