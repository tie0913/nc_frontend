<script setup>
import { computed, onMounted, reactive, ref } from "vue";
import { getProfileFromAPI, saveProfileToAPI } from "../services/profileAPI";

const props = defineProps({
  currentUser: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(["close", "profile-saved"]);

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

const newGoal = ref("");
const newDisease = ref("");
const newAllergy = ref("");

const isAddingGoal = ref(false);
const isAddingDisease = ref(false);
const isAddingAllergy = ref(false);

const isLoadingProfile = ref(false);
const isSavingProfile = ref(false);
const errorMessage = ref("");

const hasInitialStatus = computed(() => {
  return Number(profile.weight) > 0 && Number(profile.height) > 0;
});

onMounted(() => {
  loadProfile();
});

function closeModal() {
  emit("close");
}

function fillUserBasicInfo() {
  profile.name = props.currentUser?.name || "";
  profile.email = props.currentUser?.email || "";
  profile.birth_date = props.currentUser?.birth_date || "";
}

function resetProfileToEmpty() {
  Object.assign(profile, {
    id: null,
    user_id: props.currentUser?.id || null,
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
}

async function loadProfile() {
  errorMessage.value = "";

  console.log("[Profile Modal] currentUser:", props.currentUser);

  if (!props.currentUser?.id) {
    console.log("[Profile Modal] No current user. Reset profile to empty.");
    resetProfileToEmpty();
    return;
  }

  isLoadingProfile.value = true;

  const result = await getProfileFromAPI();

  isLoadingProfile.value = false;

  console.log("[Profile Modal] loadProfile result:", result);


  /*
    If profile does not exist yet, backend may return:
    code: 1, message: "Profile not found"
    In that case, we show an empty form so user can create profile.
  */
  if (result.code !== 0) {
    console.log("[Profile Modal] Profile not found or failed. Use empty profile.");
    resetProfileToEmpty();
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

  console.log("[Profile Modal] Final profile data:", profile);
  fillUserBasicInfo();
}

async function saveProfile() {
  errorMessage.value = "";

  if (Number(profile.weight) <= 0 || Number(profile.height) <= 0) {
    errorMessage.value = "Weight and height must be greater than 0.";
    return;
  }

  isSavingProfile.value = true;

  const result = await saveProfileToAPI(profile);

  isSavingProfile.value = false;

  if (result.code !== 0) {
    errorMessage.value =
      typeof result.message === "object"
        ? JSON.stringify(result.message)
        : result.message || "Failed to save profile.";
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

  emit("profile-saved", profile);
}

function addGoal() {
  const value = newGoal.value.trim();

  if (!value) {
    return;
  }

  profile.goals.push(value);
  newGoal.value = "";
  isAddingGoal.value = false;
}

function removeGoal(index) {
  profile.goals.splice(index, 1);
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
</script>

<template>
  <div class="modal-overlay" @click.self="closeModal">
    <div class="profile-modal-card">
      <button class="modal-close-btn" type="button" @click="closeModal">
        ×
      </button>

      <h2>Profile: [{{ profile.name || currentUser.name }}]</h2>

      <p v-if="isLoadingProfile" class="profile-empty-text">
        Loading profile...
      </p>

      <p v-if="!hasInitialStatus && !isLoadingProfile" class="profile-warning-text">
        Please enter your weight and height to activate your dashboard.
      </p>

      <p v-if="errorMessage" class="profile-warning-text">
        {{ errorMessage }}
      </p>

      <div class="profile-modal-basic">
        <label>
          Weight:
          <input
            v-model.number="profile.weight"
            type="number"
            min="1"
            step="0.1"
            placeholder="kg"
          />
        </label>

        <label>
          Height:
          <input
            v-model.number="profile.height"
            type="number"
            min="0.1"
            step="0.01"
            placeholder="meter"
          />
        </label>

        <label>
          BMR:
          <input
            :value="profile.BMR || 0"
            type="text"
            readonly
            placeholder="Calculated by backend"
          />
        </label>
      </div>

      <button
        type="button"
        class="profile-save-btn"
        :disabled="isSavingProfile"
        @click="saveProfile"
      >
        {{ isSavingProfile ? "Saving..." : "Save" }}
      </button>

      <div class="profile-list-section">
        <div class="profile-list-header">
          <h3>Goals:</h3>

          <button
            type="button"
            class="profile-add-btn"
            @click="isAddingGoal = true"
          >
            +
          </button>
        </div>

        <p v-if="profile.goals.length === 0" class="profile-empty-text">
          No goals recorded.
        </p>

        <div
          v-for="(goal, index) in profile.goals"
          :key="`goal-${index}`"
          class="profile-list-item"
        >
          <span>{{ goal }}</span>

          <button type="button" @click="removeGoal(index)">
            ×
          </button>
        </div>

        <div v-if="isAddingGoal" class="profile-add-row">
          <input
            v-model="newGoal"
            type="text"
            placeholder="Text..."
            @keyup.enter="addGoal"
          />

          <button type="button" @click="addGoal">
            Add
          </button>

          <button type="button" @click="isAddingGoal = false">
            Cancel
          </button>
        </div>
      </div>

      <div class="profile-list-section">
        <div class="profile-list-header">
          <h3>Chronic diseases</h3>

          <button
            type="button"
            class="profile-add-btn"
            @click="isAddingDisease = true"
          >
            +
          </button>
        </div>

        <p v-if="profile.chronic.length === 0" class="profile-empty-text">
          No chronic diseases recorded.
        </p>

        <div
          v-for="(disease, index) in profile.chronic"
          :key="`disease-${index}`"
          class="profile-list-item"
        >
          <span>{{ disease }}</span>

          <button type="button" @click="removeDisease(index)">
            ×
          </button>
        </div>

        <div v-if="isAddingDisease" class="profile-add-row">
          <input
            v-model="newDisease"
            type="text"
            placeholder="Text..."
            @keyup.enter="addDisease"
          />

          <button type="button" @click="addDisease">
            Add
          </button>

          <button type="button" @click="isAddingDisease = false">
            Cancel
          </button>
        </div>
      </div>

      <div class="profile-list-section">
        <div class="profile-list-header">
          <h3>Allergies</h3>

          <button
            type="button"
            class="profile-add-btn"
            @click="isAddingAllergy = true"
          >
            +
          </button>
        </div>

        <p v-if="profile.allergies.length === 0" class="profile-empty-text">
          No allergies recorded.
        </p>

        <div
          v-for="(allergy, index) in profile.allergies"
          :key="`allergy-${index}`"
          class="profile-list-item"
        >
          <span>{{ allergy }}</span>

          <button type="button" @click="removeAllergy(index)">
            ×
          </button>
        </div>

        <div v-if="isAddingAllergy" class="profile-add-row">
          <input
            v-model="newAllergy"
            type="text"
            placeholder="Text..."
            @keyup.enter="addAllergy"
          />

          <button type="button" @click="addAllergy">
            Add
          </button>

          <button type="button" @click="isAddingAllergy = false">
            Cancel
          </button>
        </div>
      </div>
    </div>
  </div>
</template>