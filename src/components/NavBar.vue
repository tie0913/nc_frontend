<script setup>
const props = defineProps({
  isSignedIn: {
    type: Boolean,
    required: true,
  },
});

const emit = defineEmits(["open-auth", "open-profile", "sign-out"]);

const scrollToSection = (sectionId) => {
  const section = document.getElementById(sectionId);

  if (section) {
    section.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }
};

function openSignIn() {
  emit("open-auth", "sign-in");
}

function openSignUp() {
  emit("open-auth", "sign-up");
}

function openProfile() {
  emit("open-profile");
}

function signOut() {
  emit("sign-out");
}
</script>

<template>
  <header class="navbar">
    <div class="nav-left">
      <h1>Nutrition Coach</h1>
    </div>

    <nav class="nav-center">
      <button type="button" @click="scrollToSection('dashboard')">
        Dashboard
      </button>

      <button type="button" @click="scrollToSection('food-log')">
        Food Log
      </button>

      <button type="button" @click="scrollToSection('meal-plan')">
        Meal Plan
      </button>
    </nav>

    <div class="nav-right">
      <template v-if="!isSignedIn">
        <button class="signin-btn" type="button" @click="openSignIn">
          Sign In
        </button>

        <button class="signup-btn" type="button" @click="openSignUp">
          Sign Up
        </button>
      </template>

      <template v-else>
        <button class="signin-btn" type="button" @click="openProfile">
          Profile
        </button>

        <button class="signup-btn" type="button" @click="signOut">
          Sign Out
        </button>
      </template>
    </div>
  </header>
</template>