<script setup>
import { onMounted, reactive, ref } from "vue";
import NavBar from "./components/NavBar.vue";
import DashBoardSection from "./components/DashBoardSection.vue";
import FoodLogSection from "./components/FoodLogSection.vue";
//import MealPlanSection from "./components/MealPlanSection.vue";
import { getDiagramSummaryByDate } from "./mock/mockDatabase";

const selectedFoodDate = ref(new Date().toISOString().split("T")[0]);

const dailyNutrition = reactive({
  caloriesCurrent: 0,
  caloriesTarget: 2000,
  proteinCurrent: 0,
  proteinTarget: 180,
  fatCurrent: 0,
  fatTarget: 100,
  carbCurrent: 0,
  carbTarget: 300,
});

onMounted(() => {
  refreshDailyNutrition(selectedFoodDate.value);
});

function refreshDailyNutrition(date) {
  selectedFoodDate.value = date;

  const result = getDiagramSummaryByDate(date);

  if (result.code !== 0) {
    alert(result.message);
    return;
  }

  dailyNutrition.caloriesCurrent = result.data.calories;
  dailyNutrition.proteinCurrent = result.data.protein;
  dailyNutrition.fatCurrent = result.data.fats;
  dailyNutrition.carbCurrent = result.data.carbs;
}
</script>


<template>
  <NavBar />

  <main class="main-container">
    <DashBoardSection :daily-nutrition="dailyNutrition" />

    <FoodLogSection
      :selected-date="selectedFoodDate"
      @food-log-changed="refreshDailyNutrition"
    />

    <!-- <MealPlanSection /> -->
  </main>
</template>
