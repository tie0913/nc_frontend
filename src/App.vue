<script setup>
import { onMounted, reactive, ref, computed } from "vue";
import NavBar from "./components/NavBar.vue";
import DashBoardSection from "./components/DashBoardSection.vue";
import FoodLogSection from "./components/FoodLogSection.vue";
import MealPlanSection from "./components/MealPlanSection.vue";
import AuthModal from "./components/AuthModal.vue";
import ProfileModal from "./components/ProfileModal.vue";

import { getToken } from "./services/apiClient";
import { getCurrentUser, signOutUser } from "./services/userAPI";
import { getProfileFromAPI } from "./services/profileAPI";
import { calculateNutritionTargets } from "./services/nutritionCalculator";
import { getDiagramDataAPI, getDateNDaysAgo, formatLocalDate } from "./services/useFoodAPI";

const selectedFoodDate = ref(formatLocalDate(new Date()));
const diagramData = ref([]);

const currentUser = ref(null);
const isSignedIn = ref(false);

const authModalMode = ref(null);
const isProfileModalOpen = ref(false);
const isDarkScreen = ref(false);

const profileRefreshTrigger = ref(0);

const dailyNutrition = reactive({
  caloriesCurrent: 0,
  caloriesTarget: 0,
  proteinCurrent: 0,
  proteinTarget: 0,
  fatCurrent: 0,
  fatTarget: 0,
  carbCurrent: 0,
  carbTarget: 0,
});

const themeIcon = computed(() => {
  return isDarkScreen.value ? "🌙" : "☀️";
});

const themeLabel = computed(() => {
  return isDarkScreen.value ? "Dark mode" : "Light mode";
});

function applyTheme() {
  const theme = isDarkScreen.value ? "dark" : "light";

  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("nutrition_theme", theme);
}

function toggleTheme() {
  isDarkScreen.value = !isDarkScreen.value;
  applyTheme();
}

onMounted(async () => {
  const savedTheme = localStorage.getItem("nutrition_theme");

  if (savedTheme === "dark") {
    isDarkScreen.value = true;
  } else if (savedTheme === "light") {
    isDarkScreen.value = false;
  } else {
    isDarkScreen.value = window.matchMedia("(prefers-color-scheme: dark)").matches;
  }

  applyTheme();
  await restoreSession();
  await refreshDailyNutrition(selectedFoodDate.value);
});

async function restoreSession() {
  if (!getToken()) {
    clearUserState();
    return;
  }

  const result = await getCurrentUser();

  if (result.code !== 0) {
    signOutUser();
    clearUserState();
    return;
  }

  currentUser.value = result.data;
  isSignedIn.value = true;
}

function clearUserState() {
  currentUser.value = null;
  isSignedIn.value = false;
  resetDailyNutrition();
}

async function refreshNutritionTargets() {
  console.log("[App] refreshNutritionTargets called");
  console.log(
    "[App] currentUser before target calculation:",
    currentUser.value,
  );

  if (!currentUser.value?.id) {
    dailyNutrition.caloriesTarget = 0;
    dailyNutrition.proteinTarget = 0;
    dailyNutrition.fatTarget = 0;
    dailyNutrition.carbTarget = 0;
    return;
  }

  const result = await getProfileFromAPI();

  console.log("[App] GET /profile for nutrition targets:", result);

  if (result.code !== 0 || !result.data) {
    dailyNutrition.caloriesTarget = 0;
    dailyNutrition.proteinTarget = 0;
    dailyNutrition.fatTarget = 0;
    dailyNutrition.carbTarget = 0;
    return;
  }

  const targets = calculateNutritionTargets(result.data);

  console.log("[App] calculated nutrition targets:", targets);

  dailyNutrition.caloriesTarget = targets.caloriesTarget;
  dailyNutrition.proteinTarget = targets.proteinTarget;
  dailyNutrition.fatTarget = targets.fatTarget;
  dailyNutrition.carbTarget = targets.carbTarget;
}

function resetDailyNutrition() {
  dailyNutrition.caloriesCurrent = 0;
  dailyNutrition.proteinCurrent = 0;
  dailyNutrition.fatCurrent = 0;
  dailyNutrition.carbCurrent = 0;

  dailyNutrition.caloriesTarget = 0;
  dailyNutrition.proteinTarget = 0;
  dailyNutrition.fatTarget = 0;
  dailyNutrition.carbTarget = 0;
}

async function refreshDailyNutrition(date = formatLocalDate(new Date())) {
  selectedFoodDate.value = date;

  if (!currentUser.value?.id) {
    resetDailyNutrition();
    diagramData.value = [];
    return;
  }

  await refreshNutritionTargets();

  const startDate = getDateNDaysAgo(6);
  const endDate = formatLocalDate(new Date());

  const result = await getDiagramDataAPI(startDate, endDate);

  console.log("[App] GET /diagram result:", result);

  if (result.code !== 0) {
    alert(result.message);

    dailyNutrition.caloriesCurrent = 0;
    dailyNutrition.proteinCurrent = 0;
    dailyNutrition.fatCurrent = 0;
    dailyNutrition.carbCurrent = 0;
    diagramData.value = [];
    return;
  }

  diagramData.value = Array.isArray(result.data) ? result.data : [];

  const selectedSummary =
    diagramData.value.find((item) => item.date === selectedFoodDate.value) || {
      calories: 0,
      protein: 0,
      fats: 0,
      carbs: 0,
    };

  dailyNutrition.caloriesCurrent = selectedSummary.calories;
  dailyNutrition.proteinCurrent = selectedSummary.protein;
  dailyNutrition.fatCurrent = selectedSummary.fats;
  dailyNutrition.carbCurrent = selectedSummary.carbs;
}

function openAuthModal(mode) {
  authModalMode.value = mode;
}

function closeAuthModal() {
  authModalMode.value = null;
}

function switchAuthMode(mode) {
  authModalMode.value = mode;
}

function handleAuthSuccess(user) {
  currentUser.value = user;
  isSignedIn.value = true;
  authModalMode.value = null;
  refreshDailyNutrition(selectedFoodDate.value);
}

async function handleProfileSaved() {
  profileRefreshTrigger.value += 1;
  await refreshDailyNutrition(selectedFoodDate.value);
}

function openProfileModal() {
  if (!isSignedIn.value) {
    authModalMode.value = "sign-in";
    return;
  }

  isProfileModalOpen.value = true;
}

function closeProfileModal() {
  isProfileModalOpen.value = false;
  refreshDailyNutrition(selectedFoodDate.value);
}

function signOut() {
  signOutUser();
  isProfileModalOpen.value = false;
  authModalMode.value = null;
  clearUserState();
}
</script>

<template>
  <NavBar
    :is-signed-in="isSignedIn"
    :is-dark-screen="isDarkScreen"
    :theme-label="themeLabel"
    @open-auth="openAuthModal"
    @open-profile="openProfileModal"
    @sign-out="signOut"
    @toggle-theme="toggleTheme"
  />

  <main class="main-container">
    <DashBoardSection
      :current-user="currentUser"
      :daily-nutrition="dailyNutrition"
      :diagram-data="diagramData"
      :profile-refresh-key="profileRefreshTrigger"
      @open-profile="openProfileModal"
      @profile-updated="handleProfileSaved"
    />

    <FoodLogSection
      :current-user="currentUser"
      :selected-date="selectedFoodDate"
      @food-log-changed="refreshDailyNutrition"
      @require-auth="openAuthModal('sign-in')"
    />

    <MealPlanSection :current-user="currentUser" />
  </main>

  <AuthModal
    v-if="authModalMode"
    :mode="authModalMode"
    @close="closeAuthModal"
    @switch-mode="switchAuthMode"
    @auth-success="handleAuthSuccess"
  />

  <ProfileModal
    v-if="isProfileModalOpen"
    :current-user="currentUser"
    @close="closeProfileModal"
    @profile-saved="handleProfileSaved"
  />
</template>
