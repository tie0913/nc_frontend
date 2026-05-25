<script setup>
import { onMounted, reactive, ref, watch } from "vue";
import {
  createFoodLog,
  deleteFoodLog,
  getFoodLogsByDate,
} from "../mock/mockDatabase";

const props = defineProps({
  selectedDate: {
    type: String,
    required: true,
  },
});

const emit = defineEmits(["food-log-changed"]);

const foodLogs = ref([]);

const filterDate = ref(props.selectedDate);


const newFood = reactive({
  name: "",
  quantity: 0,
  unit: "grams",
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
  },
);

function loadFoodLogs() {
  const result = getFoodLogsByDate(filterDate.value);

  if (result.code !== 0) {
    alert(result.message);
    return;
  }

  foodLogs.value = result.data;
}

function submitFood() {
  if (!newFood.name.trim()) {
    alert("Food name is required.");
    return;
  }

  if (newFood.quantity <= 0) {
    alert("Quantity must be greater than 0.");
    return;
  }

  const foodData = {
    ...newFood,
    create_time: new Date(filterDate.value).toISOString(),
  };

  const result = createFoodLog(foodData);

  if (result.code !== 0) {
    alert(result.message);
    return;
  }

  resetForm();
  loadFoodLogs();

  emit("food-log-changed", filterDate.value);
}

function removeFood(foodId) {
  const result = deleteFoodLog(foodId);

  if (result.code !== 0) {
    alert(result.message);
    return;
  }

  loadFoodLogs();

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
  newFood.unit = "grams";
  newFood.calories = 0;
  newFood.carbs = 0;
  newFood.protein = 0;
  newFood.fats = 0;
}
</script>

<template>
  <section id="food-log" class="page-section">
    <h2>Food Log</h2>

    <div class="food-log-layout">
      <!-- Left: Food log table -->
      <div class="card food-table-card">
        <h3>Food Log</h3>

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
                No food recorded for this date.
              </td>
            </tr>

            <tr v-for="food in foodLogs" :key="food.id">
              <td>{{ food.name }}</td>
              <td>{{ food.quantity }} {{ food.unit }}</td>
              <td>{{ food.calories }}</td>
              <td>{{ food.carbs }}</td>
              <td>{{ food.protein }}</td>
              <td>{{ food.fats }}</td>
              <td>
                <button
                  type="button"
                  class="delete-food-btn"
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
              placeholder="Example: Rice"
            />
          </label>

          <div class="quantity-row">
            <label>
              Quantity:
              <input
                v-model.number="newFood.quantity"
                type="number"
                min="0"
                step="0.1"
              />
            </label>

            <select v-model="newFood.unit">
              <option value="grams">grams</option>
              <option value="units">units</option>
            </select>
          </div>

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

          <button
            type="button"
            class="fetch-food-btn"
            @click="fetchNutritionData"
          >
            Fetch Nutrition
          </button>

          <div class="add-food-actions">
            <button type="submit" class="submit-food-btn">Submit</button>

            <button type="button" class="clear-food-btn" @click="clearForm">
              Clear
            </button>
          </div>
        </form>
      </div>
    </div>
  </section>
</template>
