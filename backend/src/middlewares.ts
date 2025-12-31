import type { NextFunction, Request, Response } from "express";
import { z } from "zod";

export const validate = (schema: z.ZodSchema) => (req: Request, res: Response, next: NextFunction) => {
    try {
        const data = schema.parse(req.body)
        req.body = data
        return next()
    } catch (error: any) {
        console.error(`Input validation failed path: ${req.path}`)
        console.error(error)
        return res.status(400).json({ msg: 'Invalid input' })
    }
}