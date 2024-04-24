import { failEmbedTemplate, embedTemplate } from "@lib/embedTemplate";
import { state } from "@app";
import { SubCommand } from "@structs/command/subcommand";
import { ApplicationCommandOptionType } from "discord.js";
import { updateCollection } from "@modules/selfrole/lib/selfrole";
import { Template, templates } from "@modules/selfrole/lib/template";


export default SubCommand(

  // Info
  {
    name: "template",
    description: "Add a self role collection from a template.",

    arguments: [
      {
        type: ApplicationCommandOptionType.String,
        name: "template",
        description: "Which template do you want to use.",
        autoComplete: async (msg, value) => {
          return templates
            .filter((template) => template.title.toLowerCase().includes(value.toString().toLowerCase()))
            .map((template) => ({
              name: template.title,
              value: template.title,
            }));
        },
        required: true,
      },
      {
        type: ApplicationCommandOptionType.Boolean,
        name: "use_existing_roles",
        description: "Whether to use existing roles.",
        required: true,
      },
      {
        type: ApplicationCommandOptionType.Channel,
        name: "channel",
        description: "Which channel should the self role be in.",
        required: false,
      },
    ],

    botPermissions: ["ManageRoles"],
    userPermissions: ["ManageRoles"],

    throttling: {
      duration: 60,
      usages: 1,
    },
  },

  // Execute
  async (msg) => {
    const templateName = msg.options.getString("template", true);
    const template = templates.find((t) => t.title === templateName);

    if (template === undefined) {
      return { embeds: [failEmbedTemplate("This template does not exist")] };
    }

    const useExistingRoles = msg.options.getBoolean("use_existing_roles", true);
    const channel = msg.options.getChannel("channel", false) ?? msg.channel;

    if (!channel) {
      return { embeds: [failEmbedTemplate("Channel not found")] };
    }

    await msg.deferReply();

    type CreateRoleQuery = {
      title: string;
      roleId: string;
      emoji?: string;
    }
    const roleQuery: CreateRoleQuery[] = [];
    const toBeCreatedRoles: Template["roles"] = [];

    // Check which roles already exist
    for (const role of template.roles) {
      if (!useExistingRoles) {
        toBeCreatedRoles.push(role);
        continue;
      }

      const guildRole = msg.guild.roles.cache.find((r) => r.name === role.title);
      if (!guildRole) {
        toBeCreatedRoles.push(role);
      } else {
        roleQuery.push({
          title: role.title,
          roleId: guildRole.id,
          emoji: role.emoji,
        });
      }
    }

    if (msg.guild.roles.cache.size + toBeCreatedRoles.length > 250) {
      return { embeds: [failEmbedTemplate("Too many roles in guild")] };
    }

    // Iterate over the roles that need to be created
    for (const role of toBeCreatedRoles) {
      const roleData = await msg.guild.roles.create({
        permissions: [],
        reason: "Self role template",
        name: role.title,
        color: role.color,
        unicodeEmoji: msg.guild.premiumTier >= 2 ? role.emoji : undefined,
      });

      roleQuery.push({
        title: role.title,
        roleId: roleData.id,
        emoji: role.emoji,
      });
    }

    // Save
    const collection = await state.db.selfroleCollection.create({
      data: {
        title: template.title,
        description: template.description,
        channelId: channel.id,
        guildId: msg.guild.id,
        roles: { create: roleQuery },
      },
      include: { roles: true },
    });

    await updateCollection(collection);


    return { embeds: [embedTemplate(`Template added.\nRoles created: ${toBeCreatedRoles.length}\nRoles reused: ${template.roles.length - toBeCreatedRoles.length}`)] };
  },
);
