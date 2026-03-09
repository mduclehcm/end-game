import { z } from "zod";
import { DocumentSource } from "../entity/common";

export const DocumentSourceSchema = z.enum(Object.values(DocumentSource));
