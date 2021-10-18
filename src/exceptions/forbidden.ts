import HttpException from "./httpExceptions";


class ForbiddenException extends HttpException {
    constructor(message = "Forbidden") {
        super(403, message);
    }
}

export default ForbiddenException;