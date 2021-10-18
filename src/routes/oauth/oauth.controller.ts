import { Router, Request, Response, NextFunction } from "express";
import authMiddleware from "../../middleware/auth.middleware";
import Controller from "../../types/controller";
import OauthGetService from "./oauth.get.service";

class OauthController implements Controller {
    public path = "/oauth";
    public router = Router();

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes = () => {
        this.router.get(this.path, this.oauthPost);
        this.router.get("auth", authMiddleware, this.authPost);
    }

    private oauthPost = async (req: Request, res: Response, next: NextFunction) => {
        new OauthGetService().execute(req, res).catch(e => next(e));
    }

    private authPost = async (_req: Request, res: Response, _next: NextFunction) => {
        res.status(200).send({ message: "ok" });
    }

}

export default OauthController;