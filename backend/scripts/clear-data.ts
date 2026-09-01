import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { ProjectModel } from '../src/models/project.model';
import { DocumentModel } from '../src/models/document.model';
import { TemplateModel } from '../src/models/template.model';
import { AuditLogModel } from '../src/models/audit-log.model';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/structurflow';

async function clearData() {
    try {
        console.log('Connecting to database...');
        await mongoose.connect(MONGO_URI);
        console.log('Connected successfully.\n');

        console.log('🗑️  Deleting all Audit Logs...');
        const auditLogResult = await AuditLogModel.deleteMany({});
        console.log(`✅ Deleted ${auditLogResult.deletedCount} audit logs.`);

        console.log('🗑️  Deleting all Raw Documents...');
        const documentResult = await DocumentModel.deleteMany({});
        console.log(`✅ Deleted ${documentResult.deletedCount} raw documents.`);

        console.log('🗑️  Deleting all Templates...');
        const templateResult = await TemplateModel.deleteMany({});
        console.log(`✅ Deleted ${templateResult.deletedCount} templates.`);

        console.log('🗑️  Deleting all Projects...');
        const projectResult = await ProjectModel.deleteMany({});
        console.log(`✅ Deleted ${projectResult.deletedCount} projects.`);

        console.log('\n🎉 Data cleanup complete! Kept Users, Organizations, and Memberships intact.');
    } catch (error) {
        console.error('❌ Error during cleanup:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from database.');
        process.exit(0);
    }
}

clearData();
