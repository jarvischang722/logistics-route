<template>
  <div>
    <v-file-input
      @change="importExcel"
      id="upload"
      truncate-length="15"
      prepend-icon="mdi-file-import"
      hide-input
    ></v-file-input>
  </div>
</template>

<script>
import xlsx from "xlsx";
export default {
  name: "ImportBtn",
  methods: {
    importExcel(file) {
      const { name, size } = file;
      if (size <= 0) {
        return alert("檔案是空的！");
      } else if (!/\.(xls|xlsx)$/.test(name.toLowerCase())) {
        return alert("只能選擇xlsx檔案");
      }
      this.setFileName(name);
      const allDriverRouteMap = {};
      const fileReader = new FileReader();
      fileReader.onload = ev => {
        try {
          const data = ev.target.result;
          const XLSX = xlsx;
          const workbook = XLSX.read(data, {
            type: "binary",
          });
          workbook.SheetNames.forEach(driverName => {
            const ws = XLSX.utils.sheet_to_json(workbook.Sheets[driverName]);
            const routeList = [];
            for (let i = 0; i < ws.length; i++) {
              routeList.push(ws[i]);
            }
            allDriverRouteMap[driverName] = routeList;
          });
          this.$emit("set-all-driver-route", allDriverRouteMap);
        } catch (e) {
          return alert("Read failure!");
        }
      };
      fileReader.readAsBinaryString(file);
      const input = document.getElementById("upload");
      input.value = "";
    },
    setFileName(name) {
      this.$emit("set-filename", name);
    },
  },
};
</script>

<style lang="scss" scoped>
// Button style
.button_group {
  .button_s {
    width: 78px;
    margin: 5px 10px 5px 5px;
  }
  .button_m {
    width: 100px;
    margin: 5px 10px 5px 5px;
  }
  .my_file {
    position: relative;
    .my_input {
      position: absolute;
      opacity: 0;
      width: 78px;
      height: 30px;
      top: 0;
      left: 0;
    }
  }
}
</style>
