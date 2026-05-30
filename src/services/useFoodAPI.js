import { apiRequest } from "./apiClient";
const API_KEY = "XgbOn8NEonyrgz3eHJ3tx4eYRXMWqU4oP0fbdGOC";
const API_BASE_URL = "https://api.nal.usda.gov/fdc/v1/foods/search";

function createResult(code, message, data) {
    return {
        code,
        message,
        data,
    };
}

function getNutritionData(food, nutrientNumbers, nutrientNameFallback=[]) {
    if (!food || !Array.isArray(food.foodNutrients)) {
        return 0;
    }
    
    const nutrient = food.foodNutrients.find((item) => {
        const nutrientNumber = String(item.nutrientNumber || "");
        const nutrientName = String(item.nutrientName || "").toLowerCase();

        const matchedByNumber = nutrientNumbers.includes(nutrientNumber);

        const matchedByName = nutrientNameFallback.some((name) => nutrientName.includes(name.toLowerCase()));

        return matchedByNumber || matchedByName;
    });

    return Number(nutrient ? nutrient.value : 0);
}

function calculateCalories(valuePer100g, grams) {
    const result = (Number(valuePer100g) * Number(grams)) / 100;

    return Math.round(result * 100) / 100; // Round to 2 decimal places
}

export async function searchFood(foodName, grams) {
    if (!foodName || !foodName.trim()) {
        return createResult(1, "Food name is required.", null);
    }
    if (!grams || Number(grams) <= 0) {
        return createResult(1, "Quantity in grams must be greater than zero.", null);
    }

    const url = new URL(API_BASE_URL);
    url.searchParams.set("query", foodName.trim());
    url.searchParams.set("api_key", API_KEY);
    url.searchParams.set("pageSize", "1"); // We only need the top result

    try{
        const response = await fetch(url.toString());
        if (!response.ok) {
            return createResult(1, `API request failed with status ${response.status}.`, null);
        }

        const data = await response.json();

        if (!data.foods || data.foods.length === 0) {
            return createResult(1, "No food items found for the given name.", null);
        }

        const food = data.foods[0]; // Take the first result

        const caloriesPer100g = getNutritionData(food, ["208"], ["calories", "energy"]);
        const carbsPer100g = getNutritionData(food, ["205"], ["carbohydrates"]);
        const proteinPer100g = getNutritionData(food, ["203"], ["protein"]);
        const fatsPer100g = getNutritionData(food, ["204"], ["fats", "lipids"]);

        const nutritionData = {
            fdcId: food.fdcId,
            description: food.description,

            calories: calculateCalories(caloriesPer100g, grams),
            carbs: calculateCalories(carbsPer100g, grams),
            protein: calculateCalories(proteinPer100g, grams),
            fats: calculateCalories(fatsPer100g, grams),
            create_time: new Date().toISOString(),
        };

        return createResult(0, null, nutritionData);
    } catch (error) {
        return createResult(1, `An error occurred while fetching data: ${error.message}`, null);
    }
}

export async function createFoodLogAPI(foodData) {
  const payload = {
    name: foodData.name,
    quantity: Number(foodData.quantity),
    calories: Math.round(Number(foodData.calories) || 0),
    carbs: Math.round(Number(foodData.carbs) || 0),
    protein: Math.round(Number(foodData.protein) || 0),
    fats: Math.round(Number(foodData.fats) || 0),
  };

  console.log("[FoodLog API] POST /foodlog payload:", payload);

  const result = await apiRequest("/foodlog", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  console.log("[FoodLog API] POST /foodlog response:", result);

  return result;
}

export async function getFoodLogsAPI(page = 1, pageSize = 100) {
  const query = new URLSearchParams({
    page: String(page),
    page_size: String(pageSize),
  });

  console.log("[FoodLog API] GET /foodlog query:", query.toString());

  const result = await apiRequest(`/foodlog?${query.toString()}`, {
    method: "GET",
  });

  console.log("[FoodLog API] GET /foodlog response:", result);

  return result;
}

export async function deleteFoodLogAPI(logId) {
  if (!logId) {
    return{
      code: 1,
      message: "Log ID is required for deletion.",
      data: null,
    }
  }

  const query = new URLSearchParams({
    id: String(logId),
  });

  console.log("[FoodLog API] DELETE /foodlog query:", query.toString());

  const result = await apiRequest(`/foodlog?${query.toString()}`, {
    method: "DELETE",
  });

  console.log("[FoodLog API] DELETE /foodlog response:", result);

  return result;
}

export async function getDiagramDataAPI(startDate, endDate) {
  const query = new URLSearchParams({
    start_date: startDate,
    end_date: endDate,
  });

  console.log("[FoodLog API] GET /diagram query:", query.toString());

  const result = await apiRequest(`/diagram?${query.toString()}`, {
    method: "GET",
  });

  console.log("[FoodLog API] GET /diagram response:", result);

  return result;
}
export function formatLocalDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function getDateNDaysAgo(days) {
  const date = new Date();
  date.setDate(date.getDate() - days);

  return formatLocalDate(date);
}