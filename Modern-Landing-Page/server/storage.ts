import { db } from "./db";
import { datasets, type Dataset, type InsertDataset } from "@shared/schema";

export interface IStorage {
  createDataset(dataset: InsertDataset): Promise<Dataset>;
  getDatasets(): Promise<Dataset[]>;
}

export class DatabaseStorage implements IStorage {
  async createDataset(insertDataset: InsertDataset): Promise<Dataset> {
    const [dataset] = await db.insert(datasets).values(insertDataset).returning();
    return dataset;
  }

  async getDatasets(): Promise<Dataset[]> {
    return await db.select().from(datasets);
  }
}

export const storage = new DatabaseStorage();
