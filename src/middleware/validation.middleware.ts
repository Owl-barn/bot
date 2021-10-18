import { validate, ValidationError } from "class-validator";
import HttpException from "../exceptions/httpExceptions";
import { plainToClass } from "class-transformer";
import * as express from "express";

function validationMiddleware<T>(type: any, skipMissingProperties = false): express.RequestHandler {
    return (req, _res, next) => {
        validate(plainToClass(type, req.body), { skipMissingProperties })
            .then((errors: ValidationError[]) => {
                if (errors.length > 0) {
                    const message = errors.map((error: ValidationError) => Object.values(error.constraints!)).join(", ");
                    next(new HttpException(400, message));
                } else {
                    next();
                }
            });
    };
}

export default validationMiddleware;