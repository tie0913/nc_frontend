<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { getProfileFromAPI, saveProfileToAPI } from "../services/profileAPI";
import { getDiagramDataAPI } from "../services/useFoodAPI";
import { generateMockMealPlan } from "../services/mealPlanGenerator";

const props = defineProps({
  currentUser: {
    type: Object,
    default: null,
  },
});

const goals = ref([]);
const newGoal = ref("");
const mealPlanText = ref("");
const profile = ref(null);
const weeklyFoodSummary = ref([]);

const isLoading = ref(false);
const isGenerating = ref(false);
const errorMessage = ref("");

const hasGoals = computed(() => {
  return goals.value.length > 0;
});

onMounted(() => {
  loadMealPlanData();
});

watch(
  () => props.currentUser,
  () => {
    loadMealPlanData();
  },
  { immediate: true }
);

function getDateNDaysAgo(days) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().split("T")[0];
}

async function loadMealPlanData() {
  errorMessage.value = "";
  mealPlanText.value = "";

  if (!props.currentUser?.id) {
    profile.value = null;
    goals.value = [];
    weeklyFoodSummary.value = [];
    return;
  }

  isLoading.value = true;

  const profileResult = await getProfileFromAPI();

  if (profileResult.code === 0 && profileResult.data) {
    profile.value = profileResult.data;
    goals.value = Array.isArray(profileResult.data.goals)
      ? [...profileResult.data.goals]
      : [];
  } else {
    profile.value = null;
    goals.value = [];
  }

  const startDate = getDateNDaysAgo(6);
  const endDate = new Date().toISOString().split("T")[0];

  const diagramResult = await getDiagramDataAPI(startDate, endDate);

  if (diagramResult.code === 0 && Array.isArray(diagramResult.data)) {
    weeklyFoodSummary.value = diagramResult.data;
  } else {
    weeklyFoodSummary.value = [];
  }

  isLoading.value = false;
}

function addGoal() {
  const value = newGoal.value.trim();

  if (!value) {
    return;
  }

  goals.value.push(value);
  newGoal.value = "";
}

function removeGoal(index) {
  goals.value.splice(index, 1);
}

async function saveGoalsToProfile() {
  if (!profile.value) {
    errorMessage.value = "Please create your profile first.";
    return;
  }

  const result = await saveProfileToAPI({
    ...profile.value,
    goals: goals.value,
  });

  if (result.code !== 0) {
    errorMessage.value = result.message || "Failed to save goals.";
    return;
  }

  profile.value = result.data;
  goals.value = Array.isArray(result.data.goals) ? result.data.goals : [];
}

async function generateMealPlan() {
  if (!props.currentUser?.id) {
    errorMessage.value = "Please sign in before generating a meal plan.";
    return;
  }

  errorMessage.value = "";
  isGenerating.value = true;

  await saveGoalsToProfile();

  mealPlanText.value = generateMockMealPlan({
    profile: profile.value,
    goals: goals.value,
    weeklyFoodSummary: weeklyFoodSummary.value,
  });

  isGenerating.value = false;
}
</script>

<template>
  <section id="meal-plan" class="page-section">
    <h2>Meal Plan</h2>

    <p v-if="!currentUser" class="empty-section-message">
      Please sign in to generate your meal plan.
    </p>

    <div v-else class="meal-plan-layout">
      <div class="meal-plan-output-card">
        <p v-if="isLoading" class="empty-text">
          Loading meal plan data...
        </p>

        <pre v-else-if="mealPlanText" class="meal-plan-text">{{ mealPlanText }}</pre>

        <div v-else class="meal-plan-placeholder">
          [AI Generate Text]
        </div>

        <button
          type="button"
          class="generate-meal-btn"
          :disabled="isGenerating"
          @click="generateMealPlan"
        >
          {{ isGenerating ? "Generating..." : "Generate Meal Plan" }}
        </button>
      </div>

      <div class="goals-card">
        <h3>Goals</h3>

        <p v-if="!hasGoals" class="empty-text">
          No goals recorded.
        </p>

        <div
          v-for="(goal, index) in goals"
          :key="`meal-goal-${index}`"
          class="goal-item"
        >
          <span>{{ goal }}</span>

          <button type="button" @click="removeGoal(index)">
            ×
          </button>
        </div>

        <div class="goal-add-row">
          <input
            v-model="newGoal"
            type="text"
            placeholder="Text..."
            @keyup.enter="addGoal"
          />

          <button type="button" @click="addGoal">
            +
          </button>
        </div>

        <button type="button" class="save-goals-btn" @click="saveGoalsToProfile">
          Save Goals
        </button>

        <p v-if="errorMessage" class="meal-error-text">
          {{ errorMessage }}
        </p>
      </div>
    </div>
  </section>
</template>