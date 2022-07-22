import { validate, ValidationError } from "class-validator";
import HttpException from "../exceptions/httpExceptions";
import { plainToInstance } from "class-transformer";
import * as express from "express";

function validationMiddleware(
    type: any,
    skipMissingProperties = false,
): express.RequestHandler {
    return (req, _res, next) => {
        validate(plainToInstance(type, req.body), {
            skipMissingProperties,
        }).then((errors: ValidationError[]) => {
            if (errors.length > 0) {
                const message = errors
                    .map((error: ValidationError) =>
                        error.constraints
                            ? Object.values(error.constraints)
                            : null,
                    )
                    .join(", ");
                next(new HttpException(400, message));
            } else {
                next();
            }
        });
    };
}

export default validationMiddleware;
