import { AuditLogModel, IAuditLog } from "@/models/audit-log.model";
import BaseRepository from "./base.repository";

class AuditLogRepository extends BaseRepository<IAuditLog> {
    constructor() {
        super(AuditLogModel)
    }

    async findByDocument(documentId: string) {
        return await this.model.find({ documentId })
            .sort({ createdAt: -1 })
            .populate('actorId', 'firstName lastName')
    }
}

const auditLogRepository = new AuditLogRepository();
export default auditLogRepository;