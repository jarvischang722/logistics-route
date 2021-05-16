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
              <v-list-item-title>{{
                orderList.find(o => o[excelHeader["ADDRESS"]] === address)[
                  excelHeader["FLAG"]
                ] +
                " - " +
                address.substring(6)
              }}</v-list-item-title>
            </v-list-item-content>
          </v-list-item>
        </draggable>
      </v-list-item-group>
    </v-list>
  </div>
</template>

<script>
import draggable from "vuedraggable";
import { EXCEL_HEADER } from "../constants";

export default {
  props: {
    updateAddressRoute: {
      type: Function,
    },
    list: {
      type: Array,
    },
    orderList: {
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
      excelHeader: EXCEL_HEADER,
    };
  },
  methods: {
    onEnd(ent) {
      const { newDraggableIndex, oldDraggableIndex } = ent;
      const sortedOrderList = JSON.parse(JSON.stringify(this.orderList));
      sortedOrderList[newDraggableIndex] = this.orderList[oldDraggableIndex];
      let startIdx = null,
        endIdx = null,
        startOrderListIdx = null;

      let setValuesArr = [];
      if (newDraggableIndex > oldDraggableIndex) {
        startIdx = oldDraggableIndex;
        endIdx = newDraggableIndex - 1;
        startOrderListIdx = oldDraggableIndex + 1;
      } else if (oldDraggableIndex > newDraggableIndex) {
        startIdx = newDraggableIndex + 1;
        endIdx = oldDraggableIndex;
        startOrderListIdx = newDraggableIndex;
      }

      for (let i = 0; i <= endIdx - startIdx; i++) {
        setValuesArr.push(this.orderList[startOrderListIdx + i]);
      }

      for (let idx = startIdx; idx <= endIdx; idx++) {
        sortedOrderList[idx] = setValuesArr.shift();
      }

      this.selectedItem = newDraggableIndex;
      this.$emit("update-address-route", {
        sortedOrderList,
      });
    },
  },
};
</script>

<style lang="scss" scoped></style>
