<template>
  <v-app id="inspire">
    <v-navigation-drawer v-model="drawer" app>
      <v-toolbar color="teal" dark>
        <v-toolbar-title>送貨路線</v-toolbar-title>

        <v-spacer></v-spacer>

        <v-btn icon>
          <v-icon>mdi-file-import</v-icon>
        </v-btn>
      </v-toolbar>

      <AddressList
        @update-address-route="updateAddressRoute"
        :list="addressList"
      />
    </v-navigation-drawer>

    <v-app-bar app>
      <v-app-bar-nav-icon></v-app-bar-nav-icon>

      <v-toolbar-title>竣騰商行路線系統</v-toolbar-title>
    </v-app-bar>

    <v-main>
      <div class="google-map" id="map"></div>
    </v-main>
  </v-app>
</template>

<script>
import AddressList from "./components/AddressList";

let map = null;

export default {
  components: {
    AddressList,
  },
  data() {
    return {
      directionsService: new google.maps.DirectionsService(),
      directionsDisplay: new google.maps.DirectionsRenderer(),
      geocoder: null,
      infowindows: [],
      drawer: true,
      markers: [],
      addressList: [
        "高雄市鼓山區美術東四路396號",
        "高雄市鼓山區美術北五街66號10樓",
        "高雄市鼓山區美術東四路378號17樓",
      ],
      addressLatLngMap: {},
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

  methods: {
    // 建立地圖
    async initMap() {
      // 初始化地圖
      // 透過 Map 物件建構子建立新地圖 map 物件實例，並將地圖呈現在 id 為 map 的元素中
      map = new google.maps.Map(document.getElementById("map"), {
        zoom: 14,
        center: this.markers[0],
      });
      this.geocoder = new google.maps.Geocoder();
      // 放置路線圖層
      this.directionsDisplay.setMap(map);

      await this.drawRoute();
      // await this.setMarker();
    },

    // 繪製路線
    async drawRoute() {
      const waypoints = [];
      if (this.addressList.length > 2) {
        this.addressList.slice(1, -1).forEach(async (address) => {
          waypoints.push({
            location: await this.addressToLatLng(address),
            stopover: true,
          });
        });
      }

      const request = {
        origin: await this.addressToLatLng(this.addressList[0]),
        destination: await this.addressToLatLng(
          this.addressList[this.addressList.length - 1]
        ),
        waypoints,
        travelMode: "DRIVING",
      };

      return new Promise((resolve, reject) => {
        this.directionsService.route(request, (result, status) => {
          if (status == "OK") {
            // 回傳路線上每個步驟的細節
            // console.log(result.routes[0].legs[0].steps);
            this.directionsDisplay.setDirections(result);
            resolve();
          } else {
            reject(status);
          }
        });
      });
    },
    updateAddressRoute() {
      this.drawRoute();
    },
    async addressToLatLng(address) {
      let latLng = null;
      return new Promise((resolve, reject) => {
        if (this.addressLatLngMap[address]) {
          return resolve(this.addressLatLngMap[address]);
        }
        this.geocoder.geocode({ address: address }, (results, status) => {
          latLng = {
            lat: results[0].geometry.location.lat(),
            lng: results[0].geometry.location.lng(),
          };
          if (status == "OK") {
            this.addressLatLngMap[address] = latLng;
            resolve(latLng);
          } else {
            reject(
              `Geocode was not successful for the following reason: ${status}`
            );
          }
        });
      });
    },
    setMarker() {
      this.addressList.forEach(async (address, i) => {
        const latLng = await this.addressToLatLng(address);
        this.markers.push(
          new google.maps.Marker({
            position: latLng,
            map: map,
            // label: { text: i + "", color: "#fff" },
            title: i,
          })
        );
        // 加入資訊視窗
        this.infowindows.push(
          new google.maps.InfoWindow({
            content: "x",
          })
        );
        // 加入地圖標記點擊事件
        this.markers[i].addListener("click", function () {
          if (this.infowindows[i].anchor) {
            this.infowindows[i].close();
          } else {
            this.infowindows[i].open(map, this.markers[i]);
          }
        });
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
