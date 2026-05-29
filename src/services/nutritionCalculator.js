export function calculateNutritionTargets(profile) {
  const weight = Number(profile?.weight) || 0;
  const bmr = Number(profile?.BMR) || 0;

  if (weight <= 0 || bmr <= 0) {
    return {
      caloriesTarget: 0,
      proteinTarget: 0,
      fatTarget: 0,
      carbTarget: 0,
    };
  }

  /*
    Use BMR calculated by backend.

    MVP formula:
    - caloriesTarget = BMR * activity factor
    - proteinTarget = 1.6g per kg body weight
    - fatTarget = 25% of calories
    - carbTarget = remaining calories after protein and fat

    Calories conversion:
    - protein: 4 kcal / gram
    - carbs: 4 kcal / gram
    - fat: 9 kcal / gram
  */

  const activityFactor = 1.3;

  const caloriesTarget = Math.round(bmr * activityFactor);

  const proteinTarget = Math.round(weight * 1.6);

  const fatTarget = Math.round((caloriesTarget * 0.25) / 9);

  const remainingCalories =
    caloriesTarget - proteinTarget * 4 - fatTarget * 9;

  const carbTarget = Math.max(Math.round(remainingCalories / 4), 0);

  return {
    caloriesTarget,
    proteinTarget,
    fatTarget,
    carbTarget,
  };
}