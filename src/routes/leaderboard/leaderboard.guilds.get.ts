import { Response } from "express";
import prisma from "../../lib/db.service";
import { RavenRequest } from "../../types/web";

const guildsGet = async (req: RavenRequest, res: Response): Promise<void> => {
    const guilds = await prisma.guilds.findMany({ where: { level: true } });

    const response = guilds.map(x => ({
        id: x.guild_id,
    }));

    res.json(response);
};

export default guildsGet;