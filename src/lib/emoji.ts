export const checkEmojis = (string: string) => {
  const UnicodeEmojis = string.match(reg);
  const CustomEmojis = Array.from(string.matchAll(/<?(?:(a):)?(\w{2,32}):(\d{17,19})?>?/g));
  return {
    custom: CustomEmojis ?? [],
    unicode: UnicodeEmojis ?? [],
  };
};
const reg = new RegExp(/\p{Extended_Pictographic}/ug);
