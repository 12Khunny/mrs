export const loginUser = (username, _password) => {
  return {
    accessToken: "mock-token",
    user: {
      id: 1,
      username,
      role: "ADMIN",
    },
  };
};
