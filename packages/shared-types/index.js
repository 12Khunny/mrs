export const LoginRequestDto = {
  username: "string",
  password: "string",
};

export const LoginResponseDto = {
  accessToken: "string",
  refreshToken: "string",
  user: {
    id: "number",
    username: "string",
    role: "string",
  },
};
