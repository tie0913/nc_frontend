const PROFILE_KEY = "nutrition_coach_profile";
const FOOD_LOG_KEY = "nutrition_coach_food_logs";

const defaultProfile = {
  id: 1,
  user_id: 1,
  name: "Nguyen",
  weight: 70,
  height: 1.75,
  BMR: 1600,
  chronic: ["Diabetes"],
  allergies: ["Peanuts", "Seafood"],
  goals: ["Maintain weight"],
};

function createResult(code, message, data) {
  return {
    code,
    message,
    data,
  };
}

// =========================
// Profile mock database
// =========================

export function getProfile() {
  const storedProfile = localStorage.getItem(PROFILE_KEY);

  if (!storedProfile) {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(defaultProfile));
    return createResult(0, null, defaultProfile);
  }

  return createResult(0, null, JSON.parse(storedProfile));
}

export function saveProfile(profile) {
  if (!profile) {
    return createResult(1, "Profile data is required.", null);
  }

  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));

  return createResult(0, null, profile);
}

// =========================
// Food Log mock database
// =========================

function getAllFoodLogs() {
  const storedFoodLogs = localStorage.getItem(FOOD_LOG_KEY);

  if (!storedFoodLogs) {
    localStorage.setItem(FOOD_LOG_KEY, JSON.stringify([]));
    return [];
  }

  return JSON.parse(storedFoodLogs);
}

function saveAllFoodLogs(foodLogs) {
  localStorage.setItem(FOOD_LOG_KEY, JSON.stringify(foodLogs));
}

function getDateOnly(dateValue) {
  return new Date(dateValue).toISOString().split("T")[0];
}

export function getFoodLogsByDate(date) {
  const foodLogs = getAllFoodLogs();
  const selectedDate = getDateOnly(date);

  const result = foodLogs
    .filter((food) => getDateOnly(food.create_time) === selectedDate)
    .sort((a, b) => new Date(b.create_time) - new Date(a.create_time));

  return createResult(0, null, result);
}

export function createFoodLog(food) {
  if (!food.name || !food.quantity) {
    return createResult(1, "Food name and quantity are required.", null);
  }

  const foodLogs = getAllFoodLogs();

  const newFood = {
    id: Date.now(),
    user_id: 1,
    name: food.name,
    quantity: Number(food.quantity),
    unit: food.unit || "grams",
    calories: Number(food.calories) || 0,
    carbs: Number(food.carbs) || 0,
    protein: Number(food.protein) || 0,
    fats: Number(food.fats) || 0,
    create_time: food.create_time || new Date().toISOString(),
  };

  foodLogs.push(newFood);
  saveAllFoodLogs(foodLogs);

  return createResult(0, null, newFood);
}

export function deleteFoodLog(foodId) {
  const foodLogs = getAllFoodLogs();
  const updatedFoodLogs = foodLogs.filter((food) => food.id !== foodId);

  saveAllFoodLogs(updatedFoodLogs);

  return createResult(0, null, updatedFoodLogs);
}

export function getDiagramSummaryByDate(date) {
  const selectedDateResult = getFoodLogsByDate(date);

  if (selectedDateResult.code !== 0) {
    return selectedDateResult;
  }

  const summary = selectedDateResult.data.reduce(
    (total, food) => {
      total.calories += Number(food.calories) || 0;
      total.carbs += Number(food.carbs) || 0;
      total.protein += Number(food.protein) || 0;
      total.fats += Number(food.fats) || 0;

      return total;
    },
    {
      calories: 0,
      carbs: 0,
      protein: 0,
      fats: 0,
    }
  );

  return createResult(0, null, summary);
}