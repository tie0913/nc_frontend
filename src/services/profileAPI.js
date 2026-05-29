import { apiRequest } from "./apiClient";

export async function getProfileFromAPI(){
    return await apiRequest("/profile",{
        method: "GET",
    });
}

export async function saveProfileToAPI(profileData){
    return await apiRequest("/profile",{
        method: "POST",
        body: JSON.stringify({
            weight: profileData.weight,
            height: profileData.height,
            chronic: Array.isArray(profileData.chronic) ? profileData.chronic : [],
            allergies: Array.isArray(profileData.allergies) ? profileData.allergies : [],
            goals: Array.isArray(profileData.goals) ? profileData.goals : [],
        }),
    });
}