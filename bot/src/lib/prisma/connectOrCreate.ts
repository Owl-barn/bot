export const connectOrCreate = (id: string) => ({
  connectOrCreate: {
    where: { id },
    create: { id },
  },
});
