<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { getProfileFromAPI, saveProfileToAPI } from "../services/profileAPI";
import { getDiagramDataAPI } from "../services/useFoodAPI";
import { generateMockMealPlan, generateMealPlanAPI, getMealPlanAPI } from "../services/mealPlanGenerator";

const props = defineProps({
  currentUser: {
    type: Object,
    default: null,
  },
});
const budget = ref("");
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
function formatMealPlanFromAPI(plan){
  if (!plan){
    return "No meal plan was generated";
  }

  const today = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });


  const formatList = (items) =>{
    if (!Array.isArray(items) || items.length === 0){
      return "None items provided.";
    }
    return items.map(item => `- ${item}`).join("\n");
  };

  const goalLines =
    goals.value.length > 0
      ? goals.value.map((goal) => `+ ${goal}`).join("\n")
      : "+ No goals provided.";

  const chronicLines =
    profile.value?.chronic?.length > 0
      ? profile.value.chronic.join(", ")
      : "None";

  const allergyLines =
    profile.value?.allergies?.length > 0
      ? profile.value.allergies.join(", ")
      : "None";

  return `
  ${today}

  This meal is designed based on your profile, goals, and recent food intake summary.
  - Goals:
  ${goalLines}

  Budget: $${Number(budget.value).toFixed(2)} CAD

  Here is a our suggested meal plan for you today:

  Breakfast:
  ${formatList(plan.breakfast)}

  Lunch:
  ${formatList(plan.lunch)}

  Dinner:
  ${formatList(plan.dinner)}

  Snacks:
  ${formatList(plan.snack)}
  
  In Conclusion, this meal plan is tailored to your specific needs and preferences, taking into account your health goals, dietary restrictions, and budget. We hope this plan helps you achieve your health objectives while enjoying delicious and nutritious meals.`;
}
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

async function generateMealPlan(){
  if (!props.currentUser?.id){
    errorMessage.value = "Please sign in before generating a meal plan.";
    return;
  }

  const budgetValue = Number(budget.value);

  if(!budgetValue || budgetValue <= 0){
    errorMessage.value = "Please enter a valid positive number for budget.";
    return;
  }

  errorMessage.value = "";
  isGenerating.value = true;

  try{
    await saveGoalsToProfile();

    const result = await generateMealPlanAPI(budgetValue);

    if(result.code !== 0){
      errorMessage.value = result.message || "Failed to generate meal plan.";

      mealPlanText.value = generateMockMealPlan({
        profile: profile.value,
        goals: goals.value,
        weeklyFoodSummary: weeklyFoodSummary.value,
        budget: budgetValue,
      });
      return;
    }

    mealPlanText.value = formatMealPlanFromAPI(result.data);
  } catch (error){
    errorMessage.value = "An error occurred while generating the meal plan.";
    mealPlanText.value = generateMockMealPlan({
      profile: profile.value,
      goals: goals.value,
      weeklyFoodSummary: weeklyFoodSummary.value,
      budget: budgetValue,
    });
  } finally {
    isGenerating.value = false;

  }
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
        <h3>Budget</h3>

        <div class="budget-field">
          <label>Budget</label>
            <input
              v-model="budget"
              type="number"
              min="0"
              step="0.01"
              placeholder="Enter your budget in dollars..."/>
        </div>

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