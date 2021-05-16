<template>
  <div>
    <v-btn icon @click="exportRouterList">
      <v-icon>mdi-file-export</v-icon>
    </v-btn>
  </div>
</template>

<script>
import XLSX from "xlsx";
import moment from "moment";

export default {
  props: {
    allDriverRouteMap: {
      type: Object,
      required: true,
    },
    filename: {
      type: String,
      required: true,
    },
  },
  methods: {
    exportRouterList() {
      if (Object.keys(this.allDriverRouteMap).length === 0) {
        alert("請匯入車趟檔案");
        return;
      }
      const wb = XLSX.utils.book_new();

      Object.keys(this.allDriverRouteMap).forEach(driver => {
        const tempWS = XLSX.utils.json_to_sheet(this.allDriverRouteMap[driver]);
        XLSX.utils.book_append_sheet(wb, tempWS, driver);
      });
      const [name, fileType] = this.filename.split(".");
      XLSX.writeFile(
        wb,
        `${name}_匯出_${moment().format("YYYYMMDDHHmmss")}.${fileType}`
      );
    },
  },
};
</script>
