<script setup>
import { computed } from "vue";
import sunIcon from "../assets/sun.svg";
import moonIcon from "../assets/moon.svg";
import logoIcon from "../assets/logo-nutrition-coach.svg?raw";

const props = defineProps({
  isSignedIn: {
    type: Boolean,
    required: true,
  },

  isDarkScreen: {
    type: Boolean,
    required: true,
  },

  themeLabel: {
    type: String,
    required: true,
  },
});

const emit = defineEmits([
  "open-auth",
  "open-profile",
  "sign-out",
  "toggle-theme",
]);

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

function toggleTheme() {
  emit("toggle-theme");
}
</script>

<template>
  <header class="navbar">
    <div class="nav-left">
      <span class="brand-icon" aria-hidden="true" v-html="logoIcon"></span>
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
      <button
        type="button"
        class="theme-toggle"
        :class="{ 'theme-toggle-dark': isDarkScreen }"
        :aria-label="themeLabel"
        @click="toggleTheme"
      >
        <span class="theme-toggle-track">
          <span class="theme-icon theme-icon-sun" aria-hidden="true">
            <img :src="sunIcon" alt="" />
          </span>

          <span class="theme-icon theme-icon-moon" aria-hidden="true">
            <img :src="moonIcon" alt="" />
          </span>

          <span class="theme-toggle-thumb">
            <span class="theme-thumb-icon" aria-hidden="true">
              <img :src="isDarkScreen ? moonIcon : sunIcon" alt="" />
            </span>
          </span>
        </span>
      </button>
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
