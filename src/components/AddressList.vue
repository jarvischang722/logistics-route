<template>
  <div>
    <v-list dense>
      <v-subheader>地址</v-subheader>
      <v-list-item-group v-model="selectedItem" color="primary">
        <draggable
          :list="list"
          :disabled="!enabled"
          class="list-group"
          ghost-class="ghost"
          @start="dragging = true"
          @end="onEnd"
        >
          <v-list-item v-for="(address, i) in list" :key="i">
            <v-list-item-icon>
              <v-icon v-text="icon"></v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title v-text="address"></v-list-item-title>
            </v-list-item-content>
          </v-list-item>
        </draggable>
      </v-list-item-group>
    </v-list>
  </div>
</template>

<script>
import draggable from "vuedraggable";
export default {
  props: {
    updateAddressRoute: {
      type: Function,
    },
    list: {
      type: Array,
    },
  },
  components: {
    draggable,
  },
  data() {
    return {
      enabled: true,
      dragging: false,
      selectedItem: -1,
      icon: "mdi-flag",
    };
  },
  methods: {
    onEnd(ent) {
      const { newDraggableIndex } = ent;
      this.selectedItem = newDraggableIndex;
      this.$emit("update-address-route");
    },
  },
};
</script>

<style lang="scss" scoped></style>
