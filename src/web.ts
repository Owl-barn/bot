import NotFoundException from "./exceptions/notFound";
import express, { Request, Response, NextFunction, Application } from "express";
import logger from "morgan";
import colors from "colors";
import cookieParser from "cookie-parser";

import errorMiddleware from "./middleware/error.middleware";
import Controller from "./types/controller";
import env from "./modules/env";

colors.enable();

class WebServer {
    private app: Application;

    constructor(controllers: Controller[]) {
        this.app = express();

        this.initializeMiddlewares();
        this.initializeControllers(controllers);
        this.initializeErrorHandling();
    }

    private initializeMiddlewares() {
        this.app.use(express.json());
        this.app.set("trust proxy", true);
        this.app.use(logger("short"));
        this.app.use(cookieParser(env.COOKIE_TOKEN));
        this.app.use((req, res, next) => {
            res.header("Access-Control-Allow-Credentials", "true");
            res.header("Access-Control-Allow-Origin", env.URL);
            res.header(
                "Access-Control-Allow-Headers",
                "Origin, X-Requested-With, Content-Type, Accept, Authorization",
            );
            next();
        });

        console.log(" ✓ Middleware initialized:".green.bold);
    }

    private initializeControllers(controllers: Controller[]) {
        console.log(" > Loading controllers:".green.bold);

        controllers.forEach((controller) => {
            this.app.use("/", controller.router);
            console.log(` - Loaded controller: ${controller.path}`.cyan.italic);
        });

        console.log(" ✓ all controllers loaded:".green.bold);
    }

    private initializeErrorHandling() {
        this.app.use((_req: Request, _res: Response, next: NextFunction) => {
            next(new NotFoundException());
        });
        this.app.use(errorMiddleware);

        console.log(" ✓ Web error handler initialized".green.bold);
    }

    public getServer(): Application {
        return this.app;
    }

    public listen(): void {
        this.app.listen(env.PORT, () => {
            console.log(
                " > Web server ready on port ".green.bold +
                    env.PORT.toString().cyan,
            );
        });
    }
}

export default WebServer;
