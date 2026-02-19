export const AuthContract = {
  login: {
    method: "POST",
    path: "/auth/login",
  },

  me: {
    method: "GET",
    path: "/auth/me",
  },
};
export const ExternalAuthContract = {
  login: {
    method: "POST",
    path: "/authen/login",
  },
};
