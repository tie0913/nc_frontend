function createResult(code, message, data) {
  return {
    code,
    message,
    data,
  };
}

/*
  IMPORTANT IDEA:

  Backend hiện tại đã quản lý:
  - user sign up
  - user sign in
  - JWT token
  - current user

  Nhưng profile, food log, meal plan chưa có backend API thật.
  Vì vậy các dữ liệu này tạm thời lưu localStorage,
  nhưng PHẢI lưu theo user.id.

  Ví dụ:
  User 1:
  - nutrition_coach_profile_user_1
  - nutrition_coach_food_logs_user_1
  - nutrition_coach_meal_plans_user_1

  User 2:
  - nutrition_coach_profile_user_2
  - nutrition_coach_food_logs_user_2
  - nutrition_coach_meal_plans_user_2
*/

function getProfileKey(userId) {
  return `nutrition_coach_profile_user_${userId}`;
}

function getFoodLogKey(userId) {
  return `nutrition_coach_food_logs_user_${userId}`;
}

function getMealPlanKey(userId) {
  return `nutrition_coach_meal_plans_user_${userId}`;
}

function getDateOnly(dateValue) {
  return new Date(dateValue).toISOString().split("T")[0];
}

/*
  Empty profile for a newly signed-in user.

  Lưu ý:
  - name, email, birth_date lấy từ backend user.
  - weight, height, BMR ban đầu là 0.
  - goals, chronic, allergies ban đầu là [].

  Nghĩa là user mới đăng nhập lần đầu sẽ chưa có status.
  Dashboard sau này sẽ kiểm tra:
  weight > 0 && height > 0
*/
function createEmptyProfile(user) {
  return {
    id: null,
    user_id: user.id,
    name: user.name || "",
    email: user.email || "",
    birth_date: user.birth_date || "",
    weight: 0,
    height: 0,
    BMR: 0,
    chronic: [],
    allergies: [],
    goals: [],
  };
}

// =========================
// Profile local database
// =========================

export function getLocalProfile(user) {
  if (!user?.id) {
    return createResult(0, null, null);
  }

  const key = getProfileKey(user.id);
  const storedProfile = localStorage.getItem(key);

  if (!storedProfile) {
    const emptyProfile = createEmptyProfile(user);
    localStorage.setItem(key, JSON.stringify(emptyProfile));

    return createResult(0, null, emptyProfile);
  }

  const profile = JSON.parse(storedProfile);

  /*
    Sync basic backend user data into local profile.
    This is useful if user name/email/birth_date changes later.
  */
  const syncedProfile = {
    ...profile,
    user_id: user.id,
    name: user.name || profile.name || "",
    email: user.email || profile.email || "",
    birth_date: user.birth_date || profile.birth_date || "",
  };

  localStorage.setItem(key, JSON.stringify(syncedProfile));

  return createResult(0, null, syncedProfile);
}

export function saveLocalProfile(userId, profile) {
  if (!userId) {
    return createResult(1, "User is required.", null);
  }

  if (!profile) {
    return createResult(1, "Profile data is required.", null);
  }

  const profileToSave = {
    ...profile,
    user_id: userId,
    weight: Number(profile.weight) || 0,
    height: Number(profile.height) || 0,
    BMR: Number(profile.BMR) || 0,
    chronic: Array.isArray(profile.chronic) ? profile.chronic : [],
    allergies: Array.isArray(profile.allergies) ? profile.allergies : [],
    goals: Array.isArray(profile.goals) ? profile.goals : [],
  };

  localStorage.setItem(getProfileKey(userId), JSON.stringify(profileToSave));

  return createResult(0, null, profileToSave);
}

export function hasInitialProfileStatus(user) {
  if (!user?.id) {
    return createResult(0, null, false);
  }

  const profileResult = getLocalProfile(user);

  if (profileResult.code !== 0 || !profileResult.data) {
    return createResult(0, null, false);
  }

  const profile = profileResult.data;

  const hasStatus =
    Number(profile.weight) > 0 &&
    Number(profile.height) > 0;

  return createResult(0, null, hasStatus);
}

export function clearLocalProfile(userId) {
  if (!userId) {
    return createResult(1, "User is required.", null);
  }

  localStorage.removeItem(getProfileKey(userId));

  return createResult(0, null, true);
}

// =========================
// Food Log local database
// =========================

function getAllFoodLogs(userId) {
  if (!userId) {
    return [];
  }

  const key = getFoodLogKey(userId);
  const storedFoodLogs = localStorage.getItem(key);

  if (!storedFoodLogs) {
    localStorage.setItem(key, JSON.stringify([]));
    return [];
  }

  return JSON.parse(storedFoodLogs);
}

function saveAllFoodLogs(userId, foodLogs) {
  localStorage.setItem(getFoodLogKey(userId), JSON.stringify(foodLogs));
}

export function getFoodLogsByDate(userId, date) {
  if (!userId) {
    return createResult(0, null, []);
  }

  const foodLogs = getAllFoodLogs(userId);
  const selectedDate = getDateOnly(date);

  const result = foodLogs
    .filter((food) => getDateOnly(food.create_time) === selectedDate)
    .sort((a, b) => new Date(b.create_time) - new Date(a.create_time));

  return createResult(0, null, result);
}

export function createFoodLog(userId, food) {
  if (!userId) {
    return createResult(1, "Please sign in before adding food.", null);
  }

  if (!food?.name || !food.name.trim()) {
    return createResult(1, "Food name is required.", null);
  }

  if (!food.quantity || Number(food.quantity) <= 0) {
    return createResult(1, "Food quantity must be greater than 0.", null);
  }

  const foodLogs = getAllFoodLogs(userId);

  const newFood = {
    id: Date.now(),
    user_id: userId,
    name: food.name.trim(),
    quantity: Number(food.quantity),
    calories: Number(food.calories) || 0,
    carbs: Number(food.carbs) || 0,
    protein: Number(food.protein) || 0,
    fats: Number(food.fats) || 0,
    create_time: food.create_time || new Date().toISOString(),
  };

  foodLogs.push(newFood);
  saveAllFoodLogs(userId, foodLogs);

  return createResult(0, null, newFood);
}

export function deleteFoodLog(userId, foodId) {
  if (!userId) {
    return createResult(1, "User is required.", null);
  }

  const foodLogs = getAllFoodLogs(userId);

  const updatedFoodLogs = foodLogs.filter((food) => {
    return food.id !== foodId;
  });

  saveAllFoodLogs(userId, updatedFoodLogs);

  return createResult(0, null, updatedFoodLogs);
}

export function getDiagramSummaryByDate(userId, date) {
  if (!userId) {
    return createResult(0, null, {
      calories: 0,
      carbs: 0,
      protein: 0,
      fats: 0,
    });
  }

  const result = getFoodLogsByDate(userId, date);

  if (result.code !== 0) {
    return result;
  }

  const summary = result.data.reduce(
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

export function clearLocalFoodLogs(userId) {
  if (!userId) {
    return createResult(1, "User is required.", null);
  }

  localStorage.removeItem(getFoodLogKey(userId));

  return createResult(0, null, true);
}

// =========================
// Meal Plan local database
// =========================

function getAllMealPlans(userId) {
  if (!userId) {
    return [];
  }

  const key = getMealPlanKey(userId);
  const storedMealPlans = localStorage.getItem(key);

  if (!storedMealPlans) {
    localStorage.setItem(key, JSON.stringify([]));
    return [];
  }

  return JSON.parse(storedMealPlans);
}

function saveAllMealPlans(userId, mealPlans) {
  localStorage.setItem(getMealPlanKey(userId), JSON.stringify(mealPlans));
}

export function getMealPlans(userId) {
  if (!userId) {
    return createResult(0, null, []);
  }

  const mealPlans = getAllMealPlans(userId).sort((a, b) => {
    return new Date(b.create_time) - new Date(a.create_time);
  });

  return createResult(0, null, mealPlans);
}

export function createMealPlan(userId, plan) {
  if (!userId) {
    return createResult(1, "Please sign in before creating a meal plan.", null);
  }

  const mealPlans = getAllMealPlans(userId);

  const newPlan = {
    id: Date.now(),
    user_id: userId,
    breakfast: Array.isArray(plan.breakfast) ? plan.breakfast : [],
    lunch: Array.isArray(plan.lunch) ? plan.lunch : [],
    snack: Array.isArray(plan.snack) ? plan.snack : [],
    dinner: Array.isArray(plan.dinner) ? plan.dinner : [],
    create_time: plan.create_time || new Date().toISOString(),
  };

  mealPlans.push(newPlan);
  saveAllMealPlans(userId, mealPlans);

  return createResult(0, null, newPlan);
}

export function deleteMealPlan(userId, planId) {
  if (!userId) {
    return createResult(1, "User is required.", null);
  }

  const mealPlans = getAllMealPlans(userId);

  const updatedMealPlans = mealPlans.filter((plan) => {
    return plan.id !== planId;
  });

  saveAllMealPlans(userId, updatedMealPlans);

  return createResult(0, null, updatedMealPlans);
}

export function clearLocalMealPlans(userId) {
  if (!userId) {
    return createResult(1, "User is required.", null);
  }

  localStorage.removeItem(getMealPlanKey(userId));

  return createResult(0, null, true);
}

// =========================
// Utility for sign out / delete account
// =========================

export function clearAllLocalUserData(userId) {
  if (!userId) {
    return createResult(1, "User is required.", null);
  }

  clearLocalProfile(userId);
  clearLocalFoodLogs(userId);
  clearLocalMealPlans(userId);

  return createResult(0, null, true);
}