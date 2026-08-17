import {
    ClientSession,
    Document,
    Model,
    UpdateQuery,
} from "mongoose";

export default class BaseRepository<T extends Document> {
    constructor(protected readonly model: Model<T>) { }

    async create(data: any, session?: ClientSession): Promise<T> {
        const [doc] = await this.model.create([data], { session });
        return doc;
    }

    async findById(id: string, session?: ClientSession): Promise<T | null> {
        return this.model.findById(id).session(session ?? null).exec();
    }

    async findOne(filter: Record<string, any>): Promise<T | null> {
        return this.model.findOne(filter).exec();
    }

    async find(filter: Record<string, any> = {}): Promise<T[]> {
        return this.model.find(filter).exec();
    }

    async updateById(id: string, update: UpdateQuery<T>, session?: ClientSession): Promise<T | null> {
        return this.model.findByIdAndUpdate(id, update, { new: true, session }).exec();
    }

    async deleteById(id: string, session?: ClientSession): Promise<T | null> {
        return this.model.findByIdAndDelete(id, { session }).exec();
    }
}