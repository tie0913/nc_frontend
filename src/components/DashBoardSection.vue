<script setup>
import { computed, reactive, ref, watch } from "vue";
import { getProfileFromAPI, saveProfileToAPI } from "../services/profileAPI";

const props = defineProps({
  currentUser: {
    type: Object,
    default: null,
  },
  dailyNutrition: {
    type: Object,
    required: true,
  },
  profileRefreshKey: {
    type: Number,
    default: 0,
  },
  diagramData: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(["open-profile", "profile-updated"]);
const profile = reactive({
  id: null,
  user_id: null,
  name: "",
  email: "",
  birth_date: "",
  weight: 0,
  height: 0,
  BMR: 0,
  chronic: [],
  allergies: [],
  goals: [],
});

const isSignedIn = computed(() => {
  return !!props.currentUser && !!props.currentUser.id;
});

const hasInitialProfile = computed(() => {
  return Number(profile.weight) > 0 && Number(profile.height) > 0;
});

const hasInitialStatus = computed(() => {
  return Number(profile.weight) > 0 && Number(profile.height) > 0;
});

const dailyNutrition = props.dailyNutrition;

const isLoadingProfile = ref(false);
const isEditingProfile = ref(false);

const isAddingAllergy = ref(false);
const isAddingDisease = ref(false);

const newAllergy = ref("");
const newDisease = ref("");
watch(
  () => props.profileRefreshKey,
  async () => {
    if (!props.currentUser?.id) {
      return;
    }

    await loadProfile();
  },
);
watch(
  () => props.currentUser,
  async (user) => {
    if (!user?.id) {
      resetProfile();
      return;
    }

    await loadProfile();
  },
  { immediate: true },
);
watch(
  () => props.dailyNutrition,
  (value) => {
    console.log(
      "[Dashboard] dailyNutrition received:",
      JSON.parse(JSON.stringify(value)),
    );
  },
  { deep: true, immediate: true },
);
function resetProfile() {
  Object.assign(profile, {
    id: null,
    user_id: null,
    name: props.currentUser?.name || "",
    email: props.currentUser?.email || "",
    birth_date: props.currentUser?.birth_date || "",
    weight: 0,
    height: 0,
    BMR: 0,
    chronic: [],
    allergies: [],
    goals: [],
  });

  isEditingProfile.value = false;
  isAddingAllergy.value = false;
  isAddingDisease.value = false;
  newAllergy.value = "";
  newDisease.value = "";
}

async function loadProfile() {
  if (!props.currentUser?.id) {
    resetProfile();
    return;
  }

  isLoadingProfile.value = true;

  const result = await getProfileFromAPI();

  isLoadingProfile.value = false;

  console.log("[Dashboard] GET /profile response:", result);

  if (result.code !== 0) {
    resetProfile();
    return;
  }

  Object.assign(profile, {
    ...result.data,
    name: props.currentUser.name,
    email: props.currentUser.email,
    birth_date: props.currentUser.birth_date,
    chronic: Array.isArray(result.data.chronic) ? result.data.chronic : [],
    allergies: Array.isArray(result.data.allergies)
      ? result.data.allergies
      : [],
    goals: Array.isArray(result.data.goals) ? result.data.goals : [],
  });

  console.log(
    "[Dashboard] profile after assign:",
    JSON.parse(JSON.stringify(profile)),
  );
  console.log("[Dashboard] hasInitialStatus:", hasInitialStatus.value);
}

async function saveProfileInfo() {
  if (Number(profile.weight) <= 0 || Number(profile.height) <= 0) {
    alert("Weight and height must be greater than 0.");
    return;
  }

  console.log("[Dashboard] POST /profile payload:", {
    weight: profile.weight,
    height: profile.height,
    chronic: profile.chronic,
    allergies: profile.allergies,
    goals: profile.goals,
  });

  const result = await saveProfileToAPI(profile);

  console.log("[Dashboard] POST /profile response:", result);

  if (result.code !== 0) {
    alert(result.message || "Failed to save profile.");
    return;
  }

  Object.assign(profile, {
    ...result.data,
    name: props.currentUser.name,
    email: props.currentUser.email,
    birth_date: props.currentUser.birth_date,
    chronic: Array.isArray(result.data.chronic) ? result.data.chronic : [],
    allergies: Array.isArray(result.data.allergies)
      ? result.data.allergies
      : [],
    goals: Array.isArray(result.data.goals) ? result.data.goals : [],
  });

  isEditingProfile.value = false;
  emit("profile-updated");
}

function addAllergy() {
  const value = newAllergy.value.trim();

  if (!value) {
    return;
  }

  profile.allergies.push(value);
  newAllergy.value = "";
  isAddingAllergy.value = false;
}

function removeAllergy(index) {
  profile.allergies.splice(index, 1);
}

function addDisease() {
  const value = newDisease.value.trim();

  if (!value) {
    return;
  }

  profile.chronic.push(value);
  newDisease.value = "";
  isAddingDisease.value = false;
}

function removeDisease(index) {
  profile.chronic.splice(index, 1);
}

function openProfilePanel() {
  emit("open-profile");
}

function getProgressPercent(current, target) {
  if (!target || target <= 0) {
    return 0;
  }

  return Math.min((current / target) * 100, 100);
}

const caloriesPercent = computed(() => {
  return getProgressPercent(
    dailyNutrition.caloriesCurrent,
    dailyNutrition.caloriesTarget,
  );
});

const proteinPercent = computed(() => {
  return getProgressPercent(
    dailyNutrition.proteinCurrent,
    dailyNutrition.proteinTarget,
  );
});

const fatPercent = computed(() => {
  return getProgressPercent(
    dailyNutrition.fatCurrent,
    dailyNutrition.fatTarget,
  );
});

const carbPercent = computed(() => {
  return getProgressPercent(
    dailyNutrition.carbCurrent,
    dailyNutrition.carbTarget,
  );
});

const selectedDiagramMetric = ref("calories");
const selectedDiagramType = ref("bar");

const diagramMetricOptions = [
  { value: "calories", label: "Calories", suffix: "kcal" },
  { value: "protein", label: "Protein", suffix: "g" },
  { value: "carbs", label: "Carbs", suffix: "g" },
  { value: "fats", label: "Fats", suffix: "g" },
];
const diagramTypeOptions = [
  { value: "bar", label: "Bar Chart" },
  { value: "line", label: "Line Chart" },
];
const selectedDiagramOption = computed(() => {
  return (
    diagramMetricOptions.find(
      (option) => option.value === selectedDiagramMetric.value,
    ) || diagramMetricOptions[0]
  );
});

const maxDiagramValue = computed(() => {
  if (!props.diagramData || props.diagramData.length === 0) {
    return 0;
  }

  return Math.max(
    ...props.diagramData.map((item) => {
      return Number(item[selectedDiagramMetric.value]) || 0;
    }),
  );
});

const lineGraphPoints = computed(() => {
  if (!props.diagramData || props.diagramData.length === 0) {
    return "";
  }

  const chartWidth = 520;
  const chartHeight = 180;
  const padding = 24;

  const maxValue = maxDiagramValue.value || 1;
  const itemCount = props.diagramData.length;

  return props.diagramData
    .map((item, index) => {
      const value = Number(item[selectedDiagramMetric.value]) || 0;

      const x =
        itemCount === 1
          ? chartWidth / 2
          : padding + (index * (chartWidth - padding * 2)) / (itemCount - 1);

      const y =
        chartHeight -
        padding -
        (value / maxValue) * (chartHeight - padding * 2);

      return `${x},${y}`;
    })
    .join(" ");
});
</script>

<template>
  <section id="dashboard" class="page-section">
    <h2>Dashboard</h2>
    <!-- Case 1: User has not signed in -->
    <div v-if="!isSignedIn" class="dashboard-empty-state">
      <h3>Please sign in to view your dashboard.</h3>

      <p>
        Your nutrition profile, food log summary, and progress tracker will
        appear here after you sign in.
      </p>
    </div>

    <!-- Case 2: User signed in but has not entered initial profile status -->
    <div v-else-if="!hasInitialStatus" class="dashboard-empty-state">
      <h3>Please enter your initial status.</h3>

      <p>
        Before using Nutrition Coach, please enter your weight, height, goals,
        allergies, and chronic disease information.
      </p>

      <button type="button" class="go-profile-btn" @click="openProfilePanel">
        Go to Profile
      </button>
    </div>

    <!-- Case 3: User signed in and profile is ready -->
    <template v-else>
      <div class="dashboard-top">
        <!-- Left card: user profile and nutrition information -->
        <div class="card user-info-card">
          <div class="user-header">
            <div>
              <h3>Welcome [{{ profile.name }}],</h3>
              <p>Let’s build a healthier day, one meal at a time.</p>
            </div>
          </div>

          <!-- Weight / Height row -->
          <div class="profile-fields">
            <div class="profile-values">
              <template v-if="isEditingProfile">
                <label>
                  Weight:
                  <input
                    v-model.number="profile.weight"
                    type="number"
                    min="1"
                    step="0.1"
                  />
                  kg
                </label>

                <label>
                  Height:
                  <input
                    v-model.number="profile.height"
                    type="number"
                    min="0.1"
                    step="0.01"
                  />
                  m
                </label>
              </template>

              <template v-else>
                <span>Weight: {{ profile.weight }} kg</span>
                <span>Height: {{ profile.height }} m</span>
              </template>
            </div>

            <div class="profile-actions">
              <button
                v-if="!isEditingProfile"
                class="edit-btn"
                type="button"
                @click="isEditingProfile = true"
              >
                Edit
              </button>

              <template v-else>
                <button type="button" class="save-btn" @click="saveProfileInfo">
                  Save
                </button>

                <button
                  type="button"
                  class="cancel-btn"
                  @click="isEditingProfile = false"
                >
                  Cancel
                </button>
              </template>
            </div>
          </div>

          <div class="bmr-row">
            <strong>BMR:</strong>
            <span>{{ profile.BMR }} kcal/day</span>
          </div>

          <div class="progress-group">
            <div class="progress-label-row">
              <label>Calories:</label>
              <small>
                {{ dailyNutrition.caloriesCurrent }} /
                {{ dailyNutrition.caloriesTarget }} kcal
              </small>
            </div>

            <div class="progress-bar">
              <div
                class="progress-fill"
                :style="{ width: caloriesPercent + '%' }"
              ></div>
            </div>
          </div>

          <h4>Nutrition Tracker</h4>

          <div class="progress-group">
            <div class="progress-label-row">
              <label>Proteins:</label>
              <small>
                {{ dailyNutrition.proteinCurrent }} /
                {{ dailyNutrition.proteinTarget }} g
              </small>
            </div>

            <div class="progress-bar">
              <div
                class="progress-fill"
                :style="{ width: proteinPercent + '%' }"
              ></div>
            </div>
          </div>

          <div class="progress-group">
            <div class="progress-label-row">
              <label>Fat:</label>
              <small>
                {{ dailyNutrition.fatCurrent }} /
                {{ dailyNutrition.fatTarget }} g
              </small>
            </div>

            <div class="progress-bar">
              <div
                class="progress-fill"
                :style="{ width: fatPercent + '%' }"
              ></div>
            </div>
          </div>

          <div class="progress-group">
            <div class="progress-label-row">
              <label>Carb:</label>
              <small>
                {{ dailyNutrition.carbCurrent }} /
                {{ dailyNutrition.carbTarget }} g
              </small>
            </div>

            <div class="progress-bar">
              <div
                class="progress-fill"
                :style="{ width: carbPercent + '%' }"
              ></div>
            </div>
          </div>
        </div>

        <!-- Right side: allergies and chronic diseases -->
        <div class="medical-info-column">
          <div class="card medical-card">
            <div class="card-header">
              <h3>Allergies</h3>

              <button
                class="circle-btn"
                type="button"
                @click="isAddingAllergy = true"
              >
                +
              </button>
            </div>

            <p v-if="profile.allergies.length === 0" class="empty-text">
              No allergies recorded.
            </p>

            <div
              v-for="(allergy, index) in profile.allergies"
              :key="`allergy-${index}`"
              class="list-item"
            >
              <span>{{ allergy }}</span>

              <button
                type="button"
                class="remove-btn"
                @click="removeAllergy(index)"
              >
                -
              </button>
            </div>

            <div v-if="isAddingAllergy" class="add-item-row">
              <input
                v-model="newAllergy"
                type="text"
                placeholder="Enter allergy..."
                @keyup.enter="addAllergy"
              />

              <button type="button" @click="addAllergy">Add</button>

              <button
                type="button"
                class="cancel-btn"
                @click="isAddingAllergy = false"
              >
                Cancel
              </button>
            </div>
          </div>

          <div class="card medical-card">
            <div class="card-header">
              <h3>Chronic Diseases</h3>

              <button
                class="circle-btn"
                type="button"
                @click="isAddingDisease = true"
              >
                +
              </button>
            </div>

            <p v-if="profile.chronic.length === 0" class="empty-text">
              No chronic diseases recorded.
            </p>

            <div
              v-for="(disease, index) in profile.chronic"
              :key="`disease-${index}`"
              class="list-item"
            >
              <span>{{ disease }}</span>

              <button
                type="button"
                class="remove-btn"
                @click="removeDisease(index)"
              >
                -
              </button>
            </div>

            <div v-if="isAddingDisease" class="add-item-row">
              <input
                v-model="newDisease"
                type="text"
                placeholder="Enter disease..."
                @keyup.enter="addDisease"
              />

              <button type="button" @click="addDisease">Add</button>

              <button
                type="button"
                class="cancel-btn"
                @click="isAddingDisease = false"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Bottom diagram placeholder -->
      <div class="diagram-card">
        <div class="diagram-header">
          <h3>Nutrition Diagram</h3>

          <div class="diagram-controls">
            <label>
              Type:
              <select v-model="selectedDiagramType">
                <option
                  v-for="option in diagramTypeOptions"
                  :key="option.value"
                  :value="option.value"
                >
                  {{ option.label }}
                </option>
              </select>
            </label>

            <label>
              Metric:
              <select v-model="selectedDiagramMetric">
                <option
                  v-for="option in diagramMetricOptions"
                  :key="option.value"
                  :value="option.value"
                >
                  {{ option.label }}
                </option>
              </select>
            </label>
          </div>
        </div>

        <p v-if="diagramData.length === 0" class="empty-text">
          No diagram data available for this date.
        </p>

        <!-- Bar Progress Diagram -->
        <div v-else-if="selectedDiagramType === 'bar'" class="bar-chart">
          <div
            v-for="item in diagramData"
            :key="item.date"
            class="bar-chart-row"
          >
            <span class="bar-label">{{ item.date }}</span>

            <div class="bar-track">
              <div
                class="bar-fill"
                :style="{
                  width:
                    maxDiagramValue > 0
                      ? ((Number(item[selectedDiagramMetric]) || 0) /
                          maxDiagramValue) *
                          100 +
                        '%'
                      : '0%',
                }"
              ></div>
            </div>

            <span class="bar-value">
              {{ item[selectedDiagramMetric] || 0 }}
              {{ selectedDiagramOption.suffix }}
            </span>
          </div>
        </div>

        <!-- Line Graph Diagram -->
        <div v-else class="line-chart-wrapper">
          <svg
            class="line-chart-svg"
            viewBox="0 0 520 180"
            preserveAspectRatio="none"
          >
            <line x1="24" y1="156" x2="496" y2="156" class="chart-axis" />
            <line x1="24" y1="24" x2="24" y2="156" class="chart-axis" />

            <polyline :points="lineGraphPoints" class="line-chart-polyline" />

            <circle
              v-for="(item, index) in diagramData"
              :key="`point-${item.date}`"
              class="line-chart-point"
              :cx="
                diagramData.length === 1
                  ? 260
                  : 24 + (index * (520 - 48)) / (diagramData.length - 1)
              "
              :cy="
                180 -
                24 -
                ((Number(item[selectedDiagramMetric]) || 0) /
                  (maxDiagramValue || 1)) *
                  (180 - 48)
              "
              r="4"
            />
          </svg>

          <div class="line-chart-labels">
            <span v-for="item in diagramData" :key="`label-${item.date}`">
              {{ item.date.slice(5) }}
            </span>
          </div>

          <p class="line-chart-summary">
            Showing {{ selectedDiagramOption.label }} trend by date.
          </p>
        </div>
      </div>
    </template>
  </section>
</template>
