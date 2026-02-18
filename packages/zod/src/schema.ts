import { z } from "zod";

const roomSchema = z.object({
    name : z.string().min(1 , "Name is required"),
    img : z.instanceof(File).optional(),
})

export { roomSchema };