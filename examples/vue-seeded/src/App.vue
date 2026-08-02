<template>
  <div>
    <img src="logo.png" />
    <a @click="openDialog">Open dialog</a>
    <div @click="openDialog">Open dialog</div>
    <span tabindex="3">Focusable</span>
    <div role="banana">Fruit</div>
    <p aria-labeledby="missing">Labelled</p>
    <marquee>Breaking news</marquee>
  </div>
</template>

<script setup>
function openDialog() {
  return undefined;
}
</script>
