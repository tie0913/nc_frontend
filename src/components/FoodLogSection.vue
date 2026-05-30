<script setup>
import { onMounted, reactive, ref, watch } from "vue";
import { searchFood, createFoodLogAPI, getFoodLogsAPI, getDiagramDataAPI, deleteFoodLogAPI } from "../services/useFoodAPI";

const props = defineProps({
  currentUser: {
    type: Object,
    default: null,
  },
  selectedDate: {
    type: String,
    required: true,
  },
});

const emit = defineEmits(["food-log-changed", "require-auth"]);

const foodLogs = ref([]);
const filterDate = ref(props.selectedDate);
const isFetchingNutrition = ref(false);
const isLoadingFoodLogs = ref(false);
const errorMessage = ref("");

const newFood = reactive({
  name: "",
  quantity: 0,
  calories: 0,
  carbs: 0,
  protein: 0,
  fats: 0,
});

onMounted(() => {
  loadFoodLogs();
});

watch(
  () => props.selectedDate,
  (newDate) => {
    filterDate.value = newDate;
    loadFoodLogs();
  }
);

watch(
  () => props.currentUser,
  () =>{
    loadFoodLogs();
  },
  {immediate: true}
)

function getDateOnly(dateValue) {
  if (!dateValue) {
    return "";
  }

  if (typeof dateValue === "string") {
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
      return dateValue;
    }

    return dateValue.slice(0, 10);
  }

  const year = dateValue.getFullYear();
  const month = String(dateValue.getMonth() + 1).padStart(2, "0");
  const day = String(dateValue.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

async function loadFoodLogs() {
  errorMessage.value = "";

  if (!props.currentUser || !props.currentUser.id) {
    foodLogs.value = [];
    return;
  }

  isLoadingFoodLogs.value = true;

  const result = await getFoodLogsAPI(1, 100);

  isLoadingFoodLogs.value = false;

  if( result.code !== 0){
    errorMessage.value = result.message || "Failed to load food logs.";
    foodLogs.value = [];
    return;
  }

  const items = Array.isArray(result.data?.items) ? result.data.items : [];

foodLogs.value = items.filter((item) => {
  const itemDate = getDateOnly(item.food_date || item.create_time);
  const selectedDate = getDateOnly(filterDate.value);

  return itemDate === selectedDate;
});
}

async function fetchNutritionData() {
  if (!newFood.name.trim()) {
    alert("Please enter a food name first.");
    return;
  }

  if (!newFood.quantity || Number(newFood.quantity) <= 0) {
    alert("Quantity in grams must be greater than 0.");
    return;
  }

  isFetchingNutrition.value = true;

  const result = await searchFood(
    newFood.name,
    newFood.quantity
  );

  isFetchingNutrition.value = false;

  if (result.code !== 0) {
    alert(result.message);
    return;
  }

  newFood.name = result.data.description;
  newFood.calories = result.data.calories;
  newFood.carbs = result.data.carbs;
  newFood.protein = result.data.protein;
  newFood.fats = result.data.fats;
}

async function submitFood() {
  if (!props.currentUser?.id) {
    emit("require-auth");
    return;
  }

  if (!newFood.name.trim()) {
    alert("Food name is required.");
    return;
  }

  if (!newFood.quantity || Number(newFood.quantity) <= 0) {
    alert("Quantity in grams must be greater than 0.");
    return;
  }

  const hasNutritionData =
    Number(newFood.calories) > 0 ||
    Number(newFood.carbs) > 0 ||
    Number(newFood.protein) > 0 ||
    Number(newFood.fats) > 0;

  if (!hasNutritionData) {
    alert("Please fetch nutrition data before submitting.");
    return;
  }

  const result = await createFoodLogAPI({
    name: newFood.name,
    quantity: Number(newFood.quantity),
    calories: Number(newFood.calories),
    carbs: Number(newFood.carbs),
    protein: Number(newFood.protein),
    fats: Number(newFood.fats),
  });

  if (result.code !== 0) {
    alert(result.message || "Failed to create food log.");
    return;
  }

  resetForm();
  await loadFoodLogs();

  emit("food-log-changed", filterDate.value);
}

async function removeFood(foodId) {

  if (!props.currentUser?.id) {
    emit("require-auth");
    return;
  }

  if(!foodId){
    alert("Invalid food log ID.");
    return;
  }
  const result = await deleteFoodLogAPI(foodId);

  if (result.code !== 0) {
    alert(result.message || "Failed to delete food log.");
    return;
  }

  await loadFoodLogs();

  emit("food-log-changed", filterDate.value);
}

function changeFilterDate() {
  loadFoodLogs();
  emit("food-log-changed", filterDate.value);
}

function clearForm() {
  resetForm();
}

function resetForm() {
  newFood.name = "";
  newFood.quantity = 0;
  newFood.calories = 0;
  newFood.carbs = 0;
  newFood.protein = 0;
  newFood.fats = 0;
}
</script>

<template>
  <section id="food-log" class="page-section">
    <h2>Food Log</h2>
    <p v-if="!currentUser" class="empty-section-message">
      Please sign in to view and add your food log.
    </p>

    <p v-if="errorMessage" class="food-error-text">
      {{ errorMessage }}
    </p>

    <div v-if="currentUser" class="food-log-layout">
      <!-- Left: Food table -->
      <div class="card food-table-card">
        <h3>Food Log</h3>

        <!--
          DEV ONLY DATE FILTER:
          Nếu không muốn hiện khi demo, có thể comment nguyên div này.
        -->
        <div class="food-filter-row">
          <label>
            Food date:
            <input
              v-model="filterDate"
              type="date"
              @change="changeFilterDate"
            />
          </label>

          <button type="button" @click="changeFilterDate">Submit</button>
        </div>

        <table class="food-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Quantity</th>
              <th>Calories</th>
              <th>Carbs</th>
              <th>Protein</th>
              <th>Fat</th>
              <th></th>
            </tr>
          </thead>

          <tbody>
            <tr v-if="foodLogs.length === 0">
              <td colspan="7" class="empty-table-text">
                {{
                  isLoadingFoodLogs
                    ? "Loading..."
                    : "No food recorded for this date."
                }}
              </td>
            </tr>

            <tr v-for="food in foodLogs" :key="food.id">
              <td>{{ food.name }}</td>
              <td>{{ food.quantity }} g</td>
              <td>{{ food.calories }}</td>
              <td>{{ food.carbs }}</td>
              <td>{{ food.protein }}</td>
              <td>{{ food.fats }}</td>
              <td>
                <button
                  type="button"
                  class="delete-food-btn"
                  title="Remove this food log"
                  @click="removeFood(food.id)"
                >
                  -
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Right: Add food card -->
      <div class="card add-food-card">
        <h3>Add Food</h3>

        <form @submit.prevent="submitFood">
          <label>
            Name:
            <input
              v-model="newFood.name"
              type="text"
              placeholder="Example: egg"
            />
          </label>

          <label>
            Quantity:
            <input
              v-model.number="newFood.quantity"
              type="number"
              min="0"
              step="0.1"
              placeholder="grams"
            />
            grams
          </label>

          <button
            type="button"
            class="fetch-food-btn"
            :disabled="isFetchingNutrition"
            @click="fetchNutritionData"
          >
            {{ isFetchingNutrition ? "Fetching..." : "Fetch Nutrition" }}
          </button>

          <label>
            Calories:
            <input
              v-model.number="newFood.calories"
              type="number"
              min="0"
              placeholder="Data from API"
              readonly
            />
          </label>

          <label>
            Carbs:
            <input
              v-model.number="newFood.carbs"
              type="number"
              min="0"
              placeholder="Data from API"
              readonly
            />
          </label>

          <label>
            Protein:
            <input
              v-model.number="newFood.protein"
              type="number"
              min="0"
              placeholder="Data from API"
              readonly
            />
          </label>

          <label>
            Fats:
            <input
              v-model.number="newFood.fats"
              type="number"
              min="0"
              placeholder="Data from API"
              readonly
            />
          </label>

          <div class="add-food-actions">
            <button type="submit">Submit</button>

            <button type="button" class="clear-food-btn" @click="clearForm">
              Clear
            </button>
          </div>
        </form>
      </div>
    </div>
  </section>
</template>
