import { apiRequest, setToken, clearToken } from "./apiClient";

export async function signUpUser(formData) {
  return await apiRequest("/user/sign-up", {
    method: "POST",
    body: JSON.stringify({
      name: formData.name,
      email: formData.email,
      password: formData.password,
      confirm_password: formData.confirm_password,
      birth_date: formData.birth_date,
    }),
  });
}

export async function signInUser(formData) {
  const result = await apiRequest("/user/sign-in", {
    method: "POST",
    body: JSON.stringify({
      email: formData.email,
      password: formData.password,
    }),
  });

  if (result.code === 0 && result.data?.token) {
    setToken(result.data.token);
  }

  return result;
}

export async function getCurrentUser() {
  return await apiRequest("/user/me", {
    method: "GET",
  });
}

export function signOutUser() {
  clearToken();
}

export async function deleteAccount() {
  return await apiRequest("/user/delete-account", {
    method: "DELETE",
  });
}