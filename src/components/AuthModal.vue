<script setup>
import { reactive, ref } from "vue";
import { signInUser, signUpUser } from "../services/userAPI";
const props = defineProps({
  mode: {
    type: String,
    required: true,
    validator: (value) => ["sign-in", "sign-up"].includes(value),
  },
});
const emit = defineEmits(["close", "switch-mode", "auth-success"]);

const signInForm = reactive({
  email: "",
  password: "",
});

const signUpForm = reactive({
  email: "",
  name: "",
  password: "",
  confirm_password: "",
  birth_date: "",
});

const errorMessage = ref("");
const isSubmitting = ref(false);


async function closeModal() {
  emit("close");
}

async function switchToSignUp() {
  errorMessage.value = "";
  emit("switch-mode", "sign-up");
}

async function switchToSignIn() {
  errorMessage.value = "";
  emit("switch-mode", "sign-in");
}

async function submitSignIn() {
    errorMessage.value = "";
    isSubmitting.value = true;

    const result = await signInUser(signInForm);

    isSubmitting.value = false;

  if (result.code !== 0) {
    errorMessage.value = result.message || "Sign in failed.";
    return;
  }

    emit("auth-success", result.data.user);
}

async function submitSignUp() {
    errorMessage.value = "";
    isSubmitting.value = true;

    const result = await signUpUser(signUpForm);

    isSubmitting.value = false;

  if (result.code !== 0) {
    isSubmitting.value = false;
    errorMessage.value = result.message || "Sign up failed.";
    return;
  }

    const loginResult = await signInUser({
      email: signUpForm.email,
      password: signUpForm.password,
    });
    if (loginResult.code !== 0) {
    errorMessage.value = "Account created. Please sign in.";
    emit("switch-mode", "sign-in");
    return;
  }

  emit("auth-success", loginResult.data.user);
}
</script>

<template>
  <div class="modal-overlay" @click.self="closeModal">
    <div class="auth-card">
      <button class="modal-close-btn" type="button" @click="closeModal">
        ×
      </button>

      <!-- SIGN IN PANEL -->
      <form
        v-if="mode === 'sign-in'"
        class="auth-form"
        @submit.prevent="submitSignIn"
      >
        <h2>Sign In</h2>

        <label>
          Email:
          <input
            v-model="signInForm.email"
            type="email"
            placeholder="Text...."
            required
          />
        </label>

        <label>
          Password:
          <input
            v-model="signInForm.password"
            type="password"
            placeholder="Text...."
            required
          />
        </label>

        <button type="submit" class="auth-submit-btn">Login</button>

        <button
          type="button"
          class="auth-secondary-btn"
          @click="switchToSignUp"
        >
          Register
        </button>
      </form>

      <!-- SIGN UP PANEL -->
      <form v-else class="auth-form" @submit.prevent="submitSignUp">
        <h2>Sign Up</h2>

        <label>
          Email:
          <input
            v-model="signUpForm.email"
            type="email"
            placeholder="Text...."
            required
          />
        </label>

        <label>
          User Name:
          <input
            v-model="signUpForm.name"
            type="text"
            placeholder="Text...."
            required
          />
        </label>

        <label>
          Password:
          <input
            v-model="signUpForm.password"
            type="password"
            placeholder="Text...."
            required
          />
        </label>
        <label>
          Confirm Password:
          <input
            v-model="signUpForm.confirm_password"
            type="password"
            placeholder="Confirm password"
            required
          />
        </label>

        <label>
          Birth date:
          <input v-model="signUpForm.birth_date" type="date" required />
        </label>

        <button type="submit" class="auth-submit-btn">Register</button>

        <button
          type="button"
          class="auth-secondary-link"
          @click="switchToSignIn"
        >
          Already have an account? Sign In
        </button>
        <p v-if="errorMessage" class="auth-error">
          {{ errorMessage }}
        </p>
      </form>
    </div>
  </div>
</template>
