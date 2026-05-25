<script setup>
const scrollToSection = (sectionId) =>{
    const section = document.getElementById(sectionId);

    if(section){
        section.scrollIntoView({
            behavior: 'smooth',
        block: 'start',
        });
    }
}
</script>

<template>
    <header class="navbar">
        <div class="nav-left">
            <h1>Nutrition Coach</h1>
        </div>

        <nav class="nav-center">
            <button @click="scrollToSection('dashboard')">Dashboard</button>
            <button @click="scrollToSection('food-log')">Food Log</button>
            <button @click="scrollToSection('meal-plan')">Meal Plans</button>
        </nav>

        <div class="nav-right">
                <button class="signin-btn">Sign In</button>
                <button class="signup-btn">Sign Up</button>
        </div>
    </header>
</template>