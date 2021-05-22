<template>
  <div>
    <div class="black bottomCorner">
      <div>
        <v-img :src="`https://i.pravatar.cc/300`" class="profilePic"></v-img>
      </div>
      <div class="username" style="">
        Pā Ian
      </div>
    </div>

    <!-- Blur bar -->
    <!-- <div class="blurBar bottomCorner"></div> -->
  </div>
</template>

<script>
export default {
  name: "UserBar",

  data: () => ({}),
};
</script>

<style>
.black {
  background: grey;
  width: 25%;
  padding: 10px;
  border: 5px solid red;
  clip-path: polygon(20% 0, 100% 0, 100% 100%, 0 100%);
  text-align: right;
  display: flex;
  justify-content: flex-end;
  color: white;
  z-index: 99;
}

/* .blurBar {
  backdrop-filter: blur(6px);
  width: 100%;
  height: 80px;
  padding: 10px;
  text-align: right;
  display: flex;
  justify-content: flex-end;
  color: white;
  z-index: 98;
} */

.bottomCorner {
  position: absolute;
  bottom: 0;
  right: 0;
}

.profilePic {
  width: 50px;
  height: 50px;
  object-fit: cover;
  border-radius: 50%;
}

.username {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0 10px;
}
</style>
