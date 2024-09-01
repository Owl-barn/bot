import { state } from "@app";
import { cron } from "@structs/cron";
import { removeBirthdayRoles } from "../lib/removeRoles";
import { filterActiveBirthday, filterExpiredBirthday } from "../lib/filter";
import { HandleBirthdays } from "../lib/addRoles";


export default cron(
  {
    name: "BirthdayLoop",
    time: "*/15 * * * *",
  },

  async () => {
    // Remove roles from users who had a birthday before.
    let BirthdayRemoveQueue = await state.db.userGuildConfig.findMany({
      where: { birthdayHasRole: true },
      include: {
        user: true,
        guild: true,
      },
    });


    // Filter out birthdays that are not today.
    BirthdayRemoveQueue = BirthdayRemoveQueue.filter(filterExpiredBirthday);

    await removeBirthdayRoles(BirthdayRemoveQueue);


    // Add roles to users who have a birthday today.
    let birthdayAddQueue = await state.db.userGuildConfig.findMany({
      where: {
        birthdayHasRole: false,
        birthdayEnabled: true,
        birthdayAnnounceEnabled: true,
        user: { birthdate: { not: null } },
      },
      include: {
        user: true,
        guild: true,
      },
    });

    // Filter out birthdays that are active.
    birthdayAddQueue = birthdayAddQueue.filter(filterActiveBirthday);

    await HandleBirthdays(birthdayAddQueue);
  },
);
