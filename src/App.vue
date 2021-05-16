<template>
  <v-app id="inspire">
    <v-navigation-drawer v-model="drawer" app>
      <v-toolbar color="teal" dark>
        <v-toolbar-title>送貨路線</v-toolbar-title>
        <v-spacer></v-spacer>
        <ImportBtn
          @set-all-driver-route="setAllDriverRoute"
          @set-filename="setFileName"
        />
        <ExportBtn
          :all-driver-route-map="allDriverRouteMap"
          :filename="fileName"
        />
      </v-toolbar>
      <v-select
        v-model="selectDriver"
        :items="driverList"
        label="路線選擇"
        no-data-text="請匯入車趟資料"
      ></v-select>
      <AddressList
        @update-address-route="updateAddressRoute"
        :order-list="orderList"
        :list="addressList"
      />
    </v-navigation-drawer>

    <v-app-bar app>
      <v-app-bar-nav-icon @click="drawer = !drawer"></v-app-bar-nav-icon>
      <v-toolbar-title>竣騰商行路線系統</v-toolbar-title>
    </v-app-bar>

    <v-main>
      <div class="google-map" id="map"></div>
    </v-main>

    <v-dialog v-model="showDialog" persistent width="300">
      <v-card color="primary" dark>
        <v-card-text>
          路線規劃中
          <v-progress-linear
            indeterminate
            color="white"
            class="mb-0"
          ></v-progress-linear>
        </v-card-text>
      </v-card>
    </v-dialog>
  </v-app>
</template>

<script>
import AddressList from "./components/AddressList";
import ImportBtn from "./components/ImportBtn";
import ExportBtn from "./components/ExportBtn";
import { EXCEL_HEADER } from "./constants";
import { addressToLatLng } from "./utils/map";

let map = null;

export default {
  components: {
    AddressList,
    ImportBtn,
    ExportBtn,
  },
  data() {
    return {
      showDialog: false,
      directionsService: new google.maps.DirectionsService(),
      directionsDisplay: new google.maps.DirectionsRenderer(),
      geocoderInstance: null,
      infowindows: [],
      drawer: true,
      markers: new Array(),
      allDriverRouteMap: {},
      driverList: [],
      orderList: [],
      addressList: [],
      selectDriver: null,
      mapOptions: {
        // 設定地圖的中心點經緯度位置
        center: { lat: 25.0325917, lng: 121.5624999 },
        // center: { lat: this.lat, lng: this.lng },
        // 設定地圖縮放比例 0-20
        zoom: 12,
        // 限制使用者能縮放地圖的最大比例
        maxZoom: 20,
        // 限制使用者能縮放地圖的最小比例
        minZoom: 3,
        // 設定是否呈現右下角街景小人
        streetViewControl: true,
        // 設定是否讓使用者可以切換地圖樣式：一般、衛星圖等
        mapTypeControl: false,
      },
      fileName: "",
    };
  },
  async mounted() {
    this.initMap();
  },
  watch: {
    selectDriver(driver) {
      this.orderList = this.allDriverRouteMap[driver];
      this.addressList = this.orderList.map(o => o[EXCEL_HEADER.ADDRESS]);
      this.drawRoute();
    },
    orderList(newOrderList) {
      this.allDriverRouteMap[this.selectDriver] = newOrderList;
    },
  },
  methods: {
    // 建立地圖
    async initMap() {
      // 初始化地圖
      // 透過 Map 物件建構子建立新地圖 map 物件實例，並將地圖呈現在 id 為 map 的元素中
      map = new google.maps.Map(document.getElementById("map"), {
        zoom: 13,
        center: { lat: 22.6140951, lng: 120.3110925 },
      });
      this.geocoderInstance = new google.maps.Geocoder();
      // 放置路線圖層
      this.directionsDisplay.setMap(map);
    },

    // 繪製路線
    async drawRoute() {
      this.clearMarkers();
      this.showDialog = true;
      let origin = null,
        destination = null;
      const waypoints = [];
      for (let addrIdx = 0; addrIdx < this.addressList.length; addrIdx++) {
        const address = this.addressList[addrIdx].split("(")[0];
        const latLng = await addressToLatLng(address, this.geocoderInstance);
        if (addrIdx === 0) {
          origin = latLng;
        } else if (addrIdx === this.addressList.length - 1) {
          destination = latLng;
        } else {
          waypoints.push({
            location: latLng,
            stopover: true,
          });
        }
      }

      const request = {
        origin,
        destination,
        waypoints,
        travelMode: google.maps.DirectionsTravelMode.DRIVING,
      };

      this.markers = [];
      this.infowindows = [];
      this.directionsDisplay.setMap(null);

      return new Promise((resolve, reject) => {
        this.directionsService.route(request, (response, status) => {
          if (status == google.maps.DirectionsStatus.OK) {
            // 回傳路線上每個步驟的細節
            this.directionsDisplay = new google.maps.DirectionsRenderer({
              map: map,
              directions: response,
              suppressMarkers: true,
              preserveViewport: true,
            });
            const { origin, destination, waypoints } = response.request;

            this.setMarker(
              origin.location,
              this.orderList[0][EXCEL_HEADER.FLAG],
              0
            );

            if (waypoints && waypoints.length > 0) {
              let index = 1;
              for (const { location } of waypoints) {
                this.setMarker(
                  location.location,
                  this.orderList[index][EXCEL_HEADER.FLAG],
                  index
                );
                index++;
              }
            }

            this.setMarker(
              destination.location,
              this.orderList[this.orderList.length - 1][EXCEL_HEADER.FLAG],
              this.orderList.length - 1
            );

            resolve();
          } else {
            reject(status);
          }
          this.showDialog = false;
        });
      });
    },
    updateAddressRoute({ sortedOrderList }) {
      this.orderList = sortedOrderList;
      this.drawRoute();
    },
    setAllDriverRoute(_allDriverMap) {
      this.allDriverRouteMap = _allDriverMap;
      this.driverList = Object.keys(_allDriverMap);
      this.selectDriver = this.driverList.length ? this.driverList[0] : null;
    },
    setFileName(_fileName) {
      this.fileName = _fileName;
    },
    clearMarkers() {
      this.setMapOnAll(null);
    },
    setMapOnAll(map) {
      for (const marker of this.markers) {
        marker.setMap(map);
      }
    },
    setMarker(position, label, idx) {
      this.markers.push(
        new google.maps.Marker({
          position,
          map: map,
          label: { text: label.toString(), color: "#fff" },
          title: label.toString(),
        })
      );
      // 加入資訊視窗
      this.infowindows.push(
        new google.maps.InfoWindow({
          content: this.orderList[idx][EXCEL_HEADER.ADDRESS],
        })
      );
      // 加入地圖標記點擊事件
      this.markers[idx].addListener("click", () => {
        if (this.infowindows[idx].anchor) {
          this.infowindows[idx].close();
        } else {
          this.infowindows[idx].open(map, this.markers[idx]);
        }
      });
    },
  },
};
</script>

<style scoped>
.google-map {
  width: 100%;
  height: 680px;
}
</style>
