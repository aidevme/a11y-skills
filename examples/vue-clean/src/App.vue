<template>
  <main>
    <h1>Accessible example</h1>
    <img src="logo.png" alt="Company logo" />
    <label for="name">Name</label>
    <input id="name" type="text" />
    <button type="button" @click="save">Save</button>
    <a href="/docs">Documentation</a>
  </main>
</template>

<script setup>
function save() {
  return undefined;
}
</script>
