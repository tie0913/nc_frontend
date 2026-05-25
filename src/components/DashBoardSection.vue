<script setup>
import { computed, onMounted, reactive, ref } from "vue";
import { getProfile, saveProfile } from "../mock/mockDatabase";

const profile = reactive({
  id: null,
  user_id: null,
  name: "",
  weight: 0,
  height: 0,
  BMR: 0,
  chronic: [],
  allergies: [],
  goals: [],
});

const props = defineProps({
  dailyNutrition: {
    type: Object,
    required: true,
  },
});

const dailyNutrition = props.dailyNutrition;

const isEditingProfile = ref(false);

const isAddingAllergy = ref(false);
const isAddingDisease = ref(false);

const newAllergy = ref("");
const newDisease = ref("");

onMounted(() => {
  loadProfile();
});

function loadProfile() {
  const result = getProfile();

  if (result.code === 0) {
    Object.assign(profile, result.data);
  } else {
    alert(result.message);
  }
}

function updateProfileDatabase() {
  const result = saveProfile(profile);

  if (result.code !== 0) {
    alert(result.message);
  }
}

function saveProfileInfo() {
  if (profile.weight <= 0 || profile.height <= 0) {
    alert("Weight and height must be greater than 0.");
    return;
  }

  updateProfileDatabase();
  isEditingProfile.value = false;
}

function addAllergy() {
  const value = newAllergy.value.trim();

  if (!value) {
    return;
  }

  profile.allergies.push(value);
  newAllergy.value = "";
  isAddingAllergy.value = false;

  updateProfileDatabase();
}

function removeAllergy(index) {
  profile.allergies.splice(index, 1);
  updateProfileDatabase();
}

function addDisease() {
  const value = newDisease.value.trim();

  if (!value) {
    return;
  }

  profile.chronic.push(value);
  newDisease.value = "";
  isAddingDisease.value = false;

  updateProfileDatabase();
}

function removeDisease(index) {
  profile.chronic.splice(index, 1);
  updateProfileDatabase();
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
    dailyNutrition.caloriesTarget
  );
});

const proteinPercent = computed(() => {
  return getProgressPercent(
    dailyNutrition.proteinCurrent,
    dailyNutrition.proteinTarget
  );
});

const fatPercent = computed(() => {
  return getProgressPercent(
    dailyNutrition.fatCurrent,
    dailyNutrition.fatTarget
  );
});

const carbPercent = computed(() => {
  return getProgressPercent(
    dailyNutrition.carbCurrent,
    dailyNutrition.carbTarget
  );
});
</script>

<template>
  <section id="dashboard" class="page-section">
    <h2>Dashboard</h2>

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
              <button
                type="button"
                class="save-btn"
                @click="saveProfileInfo"
              >
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

            <button type="button" @click="addAllergy">
              Add
            </button>

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

            <button type="button" @click="addDisease">
              Add
            </button>

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
    <div class="diagram-holder">
      <div class="diagram-cross-line diagonal-left"></div>
      <div class="diagram-cross-line diagonal-right"></div>

      <p>Diagram / Nutrition Progress Chart</p>
    </div>
  </section>
</template>