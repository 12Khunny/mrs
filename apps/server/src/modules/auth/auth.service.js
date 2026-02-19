export const loginUser = (username, _password) => {
  return {
    access_token: "mock-token",
    user: {
      id: 1,
      username,
      role: "ADMIN",
    },
  };
};
