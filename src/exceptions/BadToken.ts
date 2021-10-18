import HttpException from "./httpExceptions";


class BadTokenException extends HttpException {
    constructor(message = "Invalid Token") {
        super(403, message);
    }
}

export default BadTokenException;