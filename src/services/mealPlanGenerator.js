import { apiRequest } from "./apiClient";
export async function generateMealPlanAPI(budget){
  const payload = {
    budget: Number(budget),
  };

  console.log("[MealPlan API] POST /plan payload:", payload);

  const result = await apiRequest("/plan", {
    method: "POST",
    body: JSON.stringify(payload),
    } );

    console.log("[MealPlan API] POST /plan Response:", result);

    return result;
}

export async function getMealPlanAPI(page = 1, pageSize = 10){
  const query = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
  });

  console.log("[MealPlan API] GET /plan query:", query.toString());

  const result = await apiRequest(`/plan?${query.toString()}`, {
    method: "GET",
  });

  console.log("[MealPlan API] GET /plan Response:", result);

  return result;
}

export function generateMockMealPlan({ profile, goals, weeklyFoodSummary, budget }) {
  const today = new Date().toISOString().split("T")[0];

  const totalCalories = weeklyFoodSummary.reduce((sum, item) => {
    return sum + (Number(item.calories) || 0);
  }, 0);

  const averageCalories =
    weeklyFoodSummary.length > 0
      ? Math.round(totalCalories / weeklyFoodSummary.length)
      : 0;

  const goalLines =
    goals.length > 0
      ? goals.map((goal) => `+ ${goal}`).join("\n")
      : "+ No goals provided yet.";

  const budgetLine = budget
    ? `- Budget: $${Number(budget).toFixed(2)}`
    : "- Budget: Not provided.";

  return `Date: ${today}

Introduction Part
- [ 1-2 Sen]
${budgetLine}

- Goals:
${goalLines}

Body Part:
- Breakfast:
+ Oatmeal with fruit and low-fat milk.
+ Add boiled eggs or Greek yogurt if protein intake is low.


- Lunch:
+ Grilled chicken or tofu with rice and vegetables.
+ Keep the meal balanced with protein, carbs, and healthy fats.

- Dinner:
+ Salmon, lean meat, or beans with vegetables.
+ Reduce heavy fried food if calories are already high.

- Snack:
+ Fruit, nuts, yogurt, or a small protein snack.
+ Avoid high-sugar snacks if daily calories are close to the target.

Conclusion Part
- Based on the food logs from the last 7 days, your average recorded calories are approximately ${averageCalories} kcal/day.
- Recommendation:
+ Keep tracking your meals consistently.
+ Try to match your protein target first.
+ Adjust carbs and fats depending on your daily calorie target.
+ This plan is a temporary AI-style suggestion and can later be replaced by an OpenAI-generated plan.`;
}