// Messages the auth forms need to recognise as well as show (docs/08 >
// /register and /login). Safe to import from client components.

/** Register with an email that already has an account (TC-46, TC-50). */
export const DUPLICATE_EMAIL =
  "An account with this email already exists. Log in instead.";

/** Wrong email or password. Never says which one (TC-51). */
export const WRONG_CREDENTIALS = "Email or password is incorrect.";
