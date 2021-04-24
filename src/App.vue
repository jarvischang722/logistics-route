<template>
  <v-app id="inspire">
    <v-navigation-drawer v-model="drawer" app>
      <v-toolbar color="teal" dark>
        <v-toolbar-title>送貨路線</v-toolbar-title>
        <v-spacer></v-spacer>
        <ImportBtn @set-all-driver-route="setAllDriverRoute" />
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
import { EXCEL_HEADER } from "./constants";
import { addressToLatLng } from "./utils/map";

let map = null;

export default {
  components: {
    AddressList,
    ImportBtn,
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
    };
  },
  async mounted() {
    this.initMap();
  },
  watch: {
    selectDriver(driver) {
      this.orderList = this.allDriverRouteMap[driver];
      this.addressList = this.orderList.map((o) => o[EXCEL_HEADER.ADDRESS]);
      this.clearMarkers();
      this.drawRoute();
    },
  },
  methods: {
    // 建立地圖
    async initMap() {
      // 初始化地圖
      // 透過 Map 物件建構子建立新地圖 map 物件實例，並將地圖呈現在 id 為 map 的元素中
      map = new google.maps.Map(document.getElementById("map"), {
        zoom: 16,
        center: { lat: 22.811507757981406, lng: 120.506645000449 },
      });
      this.geocoderInstance = new google.maps.Geocoder();
      // 放置路線圖層
      this.directionsDisplay.setMap(map);
    },
    updateAddressRoute(sortedOrderList) {
      this.orderList = sortedOrderList;
      this.allDriverRouteMap[this.selectDriver] = this.orderList;
      this.drawRoute();
    },
    // 繪製路線
    async drawRoute() {
      try {
        this.showDialog = true;
        this.markers = [];
        this.infowindows = [];
        this.directionsDisplay.setMap(null);

        const requestGroup = [];
        let groupIdx = 0;
        let tempRequest = { waypoints: [] };

        for (let addrIdx = 0; addrIdx < this.addressList.length; addrIdx++) {
          const address = this.addressList[addrIdx];
          const latLng = await addressToLatLng(address, this.geocoderInstance);
          this.setMarker(
            latLng,
            this.orderList[addrIdx][EXCEL_HEADER.FLAG],
            addrIdx
          );
          // 25個點分一組，因為google map directionsService 只接受25個點(origin:1, destination:1, waypoints:23)
          if (groupIdx === 0) {
            tempRequest.origin = latLng;
            groupIdx++;
          } else if (
            groupIdx === 24 ||
            addrIdx === this.addressList.length - 1
          ) {
            tempRequest.destination = latLng;
            tempRequest.travelMode = google.maps.DirectionsTravelMode.DRIVING;
            requestGroup.push(tempRequest);
            tempRequest = { origin: latLng, waypoints: [] };
            groupIdx = 1;
          } else {
            tempRequest.waypoints.push({ location: latLng, stopover: true });
            groupIdx++;
          }
        }
        const promiseArr = requestGroup.map((request) =>
          this.routeWayPoint(request)
        );
        await Promise.all(promiseArr);
      } catch (error) {
        alert(`系統發生錯誤 :${error.message}`);
        console.error(error);
      }
    },
    async routeWayPoint(request) {
      return new Promise((resolve, reject) => {
        this.directionsService.route(request, (response, status) => {
          if (status == google.maps.DirectionsStatus.OK) {
            this.directionsDisplay.setMap(map);
            this.directionsDisplay.setOptions({
              suppressMarkers: true,
            });
            this.directionsDisplay.setDirections(response);
            resolve(status);
          } else {
            reject(status);
          }
          this.showDialog = false;
        });
      });
    },
    setAllDriverRoute(_allDriverMap) {
      this.allDriverRouteMap = _allDriverMap;
      this.driverList = Object.keys(_allDriverMap);
      this.selectDriver = this.driverList.length ? this.driverList[0] : null;
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
          content: position.toString(),
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
