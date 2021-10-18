import HttpException from "./httpExceptions";


class ServerErrorException extends HttpException {
    constructor(message = "A server occured") {
        super(500, message);
    }
}

export default ServerErrorException;