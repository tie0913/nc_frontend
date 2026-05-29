export function generateMockMealPlan({ profile, goals, weeklyFoodSummary }) {
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

  return `Date: ${today}

Introduction Part
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