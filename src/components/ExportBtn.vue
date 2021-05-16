<template>
  <div>
    <v-btn icon @click="exportRouterList">
      <v-icon>mdi-file-export</v-icon>
    </v-btn>
  </div>
</template>

<script>
import XLSX from "xlsx";

export default {
  props: {
    allDriverRouteMap: {
      type: Object,
      required: true,
    },
  },
  methods: {
    exportRouterList() {
      if (Object.keys(this.allDriverRouteMap).length === 0) {
        alert("請匯入車趟檔案");
        return;
      }
      var wb = XLSX.utils.book_new();

      Object.keys(this.allDriverRouteMap).forEach(driver => {
        const tempWS = XLSX.utils.json_to_sheet(this.allDriverRouteMap[driver]);
        XLSX.utils.book_append_sheet(wb, tempWS, driver);
      });
      XLSX.writeFile(wb, "export.xlsx");
    },
  },
};
</script>
